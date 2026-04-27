/**
 * Bug Condition Exploration Test
 * Feature: delete-student-not-visible
 *
 * PURPOSE: This test MUST FAIL on unfixed code.
 * Failure confirms the bug exists (isBugCondition is true).
 *
 * Bug Condition (formal):
 *   isBugCondition(state) =
 *     state.tab === 'student'
 *     AND filtered(state.users, 'student').length > 0
 *     AND NOT deleteButtonVisibleInDOM()
 *
 * Validates: Requirements 1.1, 1.3
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUsers from '../pages/admin/AdminUsers';

// Mock the API module to avoid real HTTP calls
jest.mock('../api/axios', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

import api from '../api/axios';

const mockStudents = [
  { _id: 'student-1', name: 'Ana García', email: 'ana@test.com', role: 'student', status: 'active' },
  { _id: 'student-2', name: 'Luis Pérez', email: 'luis@test.com', role: 'student', status: 'active' },
];

const mockReviewers = [
  { _id: 'reviewer-1', name: 'Carlos Revisor', email: 'carlos@test.com', role: 'reviewer', status: 'active' },
];

beforeEach(() => {
  jest.clearAllMocks();
  window.confirm = jest.fn(() => true);
});

describe('Bug Condition Exploration — Botón Eliminar en pestaña Alumnos', () => {
  /**
   * Test Case 1: tab='student' con 2 alumnos → deben existir 2 botones "Eliminar"
   *
   * isBugCondition: tab === 'student' AND filtered.length > 0 AND NOT deleteButtonVisibleInDOM()
   * EXPECTED ON UNFIXED CODE: FAIL (botón no encontrado)
   */
  test('TC1: renders exactly 2 "Eliminar" buttons when tab is student and there are 2 students', async () => {
    api.get.mockResolvedValueOnce({ data: { users: mockStudents } });

    render(<AdminUsers />);

    // Wait for the async fetch to complete and loading to disappear
    const eliminarButtons = await screen.findAllByRole('button', { name: /eliminar/i });

    // Should find exactly 2 "Eliminar" buttons (one per student)
    expect(eliminarButtons).toHaveLength(2);
  });

  /**
   * Test Case 2: Header "Acciones" visible cuando tab='student'
   *
   * EXPECTED ON UNFIXED CODE: FAIL or PASS depending on whether empty string renders a th
   * The Table component renders all headers including '' as <th>, so this may pass
   * but the column is empty — the real bug is the missing button.
   */
  test('TC2: renders "Acciones" column header when tab is student', async () => {
    api.get.mockResolvedValueOnce({ data: { users: mockStudents } });

    render(<AdminUsers />);

    // Wait for loading to finish
    await screen.findAllByText('Ana García');

    // The "Acciones" header should be visible in the table
    const accionesHeader = screen.getByText(/acciones/i);
    expect(accionesHeader).toBeInTheDocument();
  });

  /**
   * Test Case 3: Cambio de tab reviewer → student → botón reaparece
   *
   * isBugCondition covers re-render scenario (Requirement 1.3)
   * EXPECTED ON UNFIXED CODE: FAIL (botón no reaparece o nunca apareció)
   */
  test('TC3: "Eliminar" buttons reappear after switching tab reviewer → student', async () => {
    // Users include both students and a reviewer
    api.get.mockResolvedValueOnce({
      data: { users: [...mockStudents, ...mockReviewers] },
    });

    render(<AdminUsers />);

    // Wait for initial render (starts on student tab)
    await screen.findAllByText('Ana García');

    // Switch to reviewer tab
    const reviewerTabBtn = screen.getByRole('button', { name: /revisores/i });
    fireEvent.click(reviewerTabBtn);

    // Verify we're on reviewer tab — no "Eliminar" buttons
    expect(screen.queryAllByRole('button', { name: /eliminar/i })).toHaveLength(0);

    // Switch back to student tab
    const studentTabBtn = screen.getByRole('button', { name: /alumnos/i });
    fireEvent.click(studentTabBtn);

    // Now "Eliminar" buttons should reappear — 2 students
    const eliminarButtons = screen.getAllByRole('button', { name: /eliminar/i });
    expect(eliminarButtons).toHaveLength(2);
  });
});
