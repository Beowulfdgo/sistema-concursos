import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../../components/common/UI';
import api from '../../api/axios';

const ReviewerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reviewer');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      submitted: ['Enviado', 'blue'],
      under_review: ['En revisión', 'yellow'],
      evaluated: ['Evaluado', 'green']
    };
    return map[status] || ['Desconocido', 'gray'];
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard de Revisor</h1>
      <p>Bienvenido, {user.name}</p>

      {data.summary.map((item, index) => (
        <Card key={index} style={{ marginBottom: 20 }}>
          <h2>{item.contest.name}</h2>
          <p>Proyectos asignados: {item.totalProjects}</p>
          <p>Evaluados: {item.evaluated} | Pendientes: {item.pending}</p>

          <div style={{ marginTop: 10 }}>
            {item.projects.map(project => (
              <div key={project._id} className="card" style={{ padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{project.title}</strong>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                      Número: {project.registrationNumber}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Badge variant={getStatusBadge(project.status)[1]}>
                      {getStatusBadge(project.status)[0]}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/reviewer/evaluate/${project._id}`)}
                    >
                      Ver evaluación
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ReviewerDashboard;