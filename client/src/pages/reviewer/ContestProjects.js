import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge } from '../../components/common/UI';
import api from '../../api/axios';

const ContestProjects = () => {
  const { contestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [contestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load contest details
      const contestRes = await api.get(`/contests/${contestId}`);
      setContest(contestRes.data);

      // Load assigned projects for this contest (without finalScore)
      const assignmentsRes = await api.get('/assignments');
      const assignment = assignmentsRes.data.find(a => a.contestId._id === contestId);
      if (assignment) {
        setProjects(assignment.projectIds || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos');
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
      <h1>{contest?.name}</h1>
      <p>Proyectos asignados para evaluación</p>

      {projects.map(project => (
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
  );
};

export default ContestProjects;