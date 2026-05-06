import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout';
import { LoginPage } from './pages/AuthPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import EvaluateProject from './pages/reviewer/EvaluateProject';
import ContestProjects from './pages/reviewer/ContestProjects';
// Import other pages as needed

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/reviewer/dashboard" element={<ReviewerDashboard />} />
            <Route path="/reviewer/evaluate/:projectId" element={<EvaluateProject />} />
            <Route path="/reviewer/contest/:contestId" element={<ContestProjects />} />
            {/* Add other routes */}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;