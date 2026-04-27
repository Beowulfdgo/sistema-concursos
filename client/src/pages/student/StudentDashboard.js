import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/UI';

export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="animate-in">
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Bienvenido, {user?.name}</h1>
      <Card style={{ padding: 24 }}>
        <p style={{ color: 'var(--gray-500)' }}>Tu panel de alumno está en construcción.</p>
      </Card>
    </div>
  );
}
