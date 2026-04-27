/**
 * Preservation Property Tests
 * Feature: delete-student-not-visible
 *
 * PURPOSE: These tests MUST PASS on unfixed code.
 * They establish the baseline behavior that must be preserved after the fix.
 *
 * Property 2: Preservation — Pestañas Revisores y Admins sin botón Eliminar
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUsers from '../pages/admin/AdminUsers';

// Mock the API module to avoid real HTTP calls
jest.mock('../api/axios', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

import api from '../api/axios';

// ---------------------------------------------------------------------------
// Helpers / generators
// ---------------------------------------------------------------------------

/** Build a user object with the given role */
const makeUser = (id, role) => ({
  _id: `${role}-${id}`,
  name: `User ${role} ${id}`,
  email: `${role}${id}@test.com`,
  role,
  status: 'active',
});

/**
 * Generate a mixed user list with the given counts per role.
 * Simulates property-based generation of varied inputs.
 */
const generateUserList = ({ students = 0, reviewers = 0, admins = 0 } = {}) => [
  ...Array.from({ length: students }, (_, i) => makeUser(i + 1, 'student')),
  ...Array.from({ length: reviewers }, (_, i) => makeUser(i + 1, 'reviewer')),
  ...Array.from({ length: admins }, (_, i) => makeUser(i + 1, 'admin')),
];

/**
 * Property-based style: multiple input combinations to test preservation.
 * Each entry is [description, { students, reviewers, admins }].
 */
const USER_LIST_VARIANTS = [
  ['empty list', { students: 0, reviewers: 0, admins: 0 }],
  ['1 reviewer only', { students: 0, reviewers: 1, admins: 0 }],
  ['3 reviewers only', { students: 0, reviewers: 3, admins: 0 }],
  ['1 admin only', { students: 0, reviewers: 0, admins: 1 }],
  ['3 admins only', { students: 0, reviewers: 0, admins: 3 }],
  ['mixed: 2 students + 2 reviewers', { students: 2, reviewers: 2, admins: 0 }],
  ['mixed: 2 students + 2 admins', { students: 2, reviewers: 0, admins: 2 }],
  ['mixed: 1 student + 1 reviewer + 1 admin', { students: 1, reviewers: 1, admins: 1 }],
  ['mixed: 5 students + 3 reviewers + 2 admins', { students: 5, reviewers: 3, admins: 2 }],
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => false); // default: cancel
  window.alert = jest.fn();
});

// ---------------------------------------------------------------------------
// Property 2a: tab='reviewer' — no "Eliminar" button, no "Acciones" header
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe('Property 2a: Preservation — pestaña Revisores sin botón Eliminar', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * For all user list variants, when tab='reviewer':
   *   - No "Eliminar" button should appear
   *   - No "Acciones" header should appear
   */
  test.each(USER_LIST_VARIANTS)(
    'no "Eliminar" button or "Acciones" header with tab=reviewer — %s',
    async (_desc, counts) => {
      const users = generateUserList(counts);
      api.get.mockResolvedValueOnce({ data: { users } });

      render(<AdminUsers />);

      // Navigate to reviewer tab
      const reviewerTabBtn = screen.getByRole('button', { name: /revisores/i });
      fireEvent.click(reviewerTabBtn);

      // Wait for loading to finish
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
      // Give time for state update
      await screen.findByRole('button', { name: /revisores/i });

      // No "Eliminar" button should be present
      expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);

      // No "Acciones" header text should be present
      expect(screen.queryByText(/^acciones$/i)).not.toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Property 2b: tab='admin' — no "Eliminar" button, no "Acciones" header
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------

describe('Property 2b: Preservation — pestaña Admins sin botón Eliminar', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * For all user list variants, when tab='admin':
   *   - No "Eliminar" button should appear
   *   - No "Acciones" header should appear
   */
  test.each(USER_LIST_VARIANTS)(
    'no "Eliminar" button or "Acciones" header with tab=admin — %s',
    async (_desc, counts) => {
      const users = generateUserList(counts);
      api.get.mockResolvedValueOnce({ data: { users } });

      render(<AdminUsers />);

      // Navigate to admin tab
      const adminTabBtn = screen.getByRole('button', { name: /admins/i });
      fireEvent.click(adminTabBtn);

      // Wait for loading to finish
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
      await screen.findByRole('button', { name: /admins/i });

      // No "Eliminar" button should be present
      expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);

      // No "Acciones" header text should be present
      expect(screen.queryByText(/^acciones$/i)).not.toBeInTheDocument();
    }
  );
});

// ---------------------------------------------------------------------------
// Property 2c: Column count consistency
// Validates: Requirements 3.1, 3.2
//
// For tab !== 'student', the number of <th> headers must equal the number of
// <td> cells in each row. This ensures no visual misalignment.
// ---------------------------------------------------------------------------

describe('Property 2c: Column count consistency for non-student tabs', () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For any user list, when tab='reviewer' or tab='admin',
   * every row must have the same number of <td> cells as there are <th> headers.
   */
  const tabsToTest = [
    ['reviewer', /revisores/i],
    ['admin', /admins/i],
  ];

  test.each(tabsToTest)(
    'column count matches header count for tab=%s with mixed users',
    async (tabName, tabButtonPattern) => {
      const users = generateUserList({ students: 2, reviewers: 2, admins: 2 });
      api.get.mockResolvedValueOnce({ data: { users } });

      const { container } = render(<AdminUsers />);

      // Wait for data to load first (initial student tab)
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
      // Wait for table to appear
      await waitFor(() => expect(container.querySelector('table')).not.toBeNull());

      // Navigate to the target tab
      const tabBtn = screen.getByRole('button', { name: tabButtonPattern });
      fireEvent.click(tabBtn);

      // Wait for the table to re-render with the new tab's data
      await waitFor(() => expect(container.querySelector('table')).not.toBeNull());

      // Count header columns
      const headers = container.querySelectorAll('thead th');
      const headerCount = headers.length;

      // Count td cells in each body row
      const rows = container.querySelectorAll('tbody tr');

      if (rows.length > 0) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          expect(cells.length).toBe(headerCount);
        });
      }
      // Verify headers exist (no crash)
      expect(headerCount).toBeGreaterThan(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Property 2d: handleDelete calls window.confirm before API
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 2d: handleDelete calls window.confirm before API request', () => {
  /**
   * **Validates: Requirements 3.5**
   *
   * When the "Eliminar" button is clicked (on student tab),
   * window.confirm must be called before any API delete request.
   */
  test('calls window.confirm before api.delete when Eliminar is clicked', async () => {
    const users = generateUserList({ students: 1 });
    api.get.mockResolvedValueOnce({ data: { users } });

    // Set up call-order tracking BEFORE rendering
    const callOrder = [];
    window.confirm = jest.fn(() => { callOrder.push('confirm'); return true; });
    api.delete.mockImplementation(() => { callOrder.push('delete'); return Promise.resolve({}); });

    render(<AdminUsers />);

    // Default tab is 'student', wait for the Eliminar button
    const eliminarBtn = await screen.findByRole('button', { name: /eliminar/i });

    fireEvent.click(eliminarBtn);

    await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(1));

    // confirm must have been called before delete
    expect(callOrder).toEqual(['confirm', 'delete']);
  });
});

// ---------------------------------------------------------------------------
// Property 2e: When confirm is cancelled, API is NOT called
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 2e: When confirm is cancelled, API delete is NOT called', () => {
  /**
   * **Validates: Requirements 3.5**
   *
   * For any student in the list, if the user cancels the confirm dialog,
   * api.delete must NOT be called.
   */
  const studentCounts = [1, 2, 3, 5];

  test.each(studentCounts)(
    'api.delete is NOT called when confirm is cancelled — %d student(s)',
    async (count) => {
      const users = generateUserList({ students: count });
      api.get.mockResolvedValueOnce({ data: { users } });
      window.confirm = jest.fn(() => false); // user cancels

      render(<AdminUsers />);

      // Wait for Eliminar buttons to appear
      const eliminarBtns = await screen.findAllByRole('button', { name: /eliminar/i });
      expect(eliminarBtns).toHaveLength(count);

      // Click the first Eliminar button
      fireEvent.click(eliminarBtns[0]);

      // confirm was called
      expect(window.confirm).toHaveBeenCalledTimes(1);

      // api.delete must NOT have been called
      expect(api.delete).not.toHaveBeenCalled();
    }
  );
});
