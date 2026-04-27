import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/AuthPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import EvaluateProject from './pages/reviewer/EvaluateProject';
import ContestProjects from './pages/reviewer/ContestProjects';
import StudentDashboard from './pages/student/StudentDashboard';

// Protects a route by required role
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Layout role={user?.role}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />

        {/* Reviewer routes */}
        <Route path="/reviewer/dashboard" element={<PrivateRoute role="reviewer"><ReviewerDashboard /></PrivateRoute>} />
        <Route path="/reviewer/evaluate/:projectId" element={<PrivateRoute role="reviewer"><EvaluateProject /></PrivateRoute>} />
        <Route path="/reviewer/contest/:contestId" element={<PrivateRoute role="reviewer"><ContestProjects /></PrivateRoute>} />

        {/* Student routes */}
        <Route path="/student/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
