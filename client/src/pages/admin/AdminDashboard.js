import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatCard, Card, Badge, Spinner, PageHeader, Table, Tr, Td } from '../../components/common/UI';

const statusBadge = (s) => {
  const m = { submitted: ['Enviado', 'blue'], under_review: ['En revisión', 'yellow'], evaluated: ['Evaluado', 'green'] };
  const [label, color] = m[s] || [s, 'gray'];
  return <Badge color={color}>{label}</Badge>;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/admin'), api.get('/contests')])
      .then(([s, c]) => { setStats(s.data); setContests(c.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedContest) {
      api.get(`/dashboard/rankings/${selectedContest}`).then(r => setRanking(r.data));
    }
  }, [selectedContest]);

  if (loading) return <Spinner />;

  return (
    <div className="animate-in">
      <PageHeader title="Dashboard" subtitle="Vista general del sistema de concursos" />

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard title="Concursos activos" value={stats?.activeContests ?? 0} icon="🏆" color="var(--primary)" subtitle={`de ${stats?.totalContests ?? 0} totales`} />
        <StatCard title="Proyectos registrados" value={stats?.totalProjects ?? 0} icon="📁" color="var(--secondary)" />
        <StatCard title="Evaluaciones pendientes" value={stats?.pendingEvals ?? 0} icon="⏳" color="var(--warning)" />
        <StatCard title="Usuarios registrados" value={stats?.totalUsers ?? 0} icon="👤" color="var(--success)" />
      </div>

      {/* Recent Projects */}
      <Card style={{ marginBottom: 28 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
          <h2 style={{ fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 700 }}>Proyectos recientes</h2>
        </div>
        <Table headers={['Proyecto', 'Alumno', 'Concurso', 'Fecha', 'Estado']}>
          {stats?.recentProjects?.map(p => (
            <Tr key={p._id}>
              <Td><span style={{ fontWeight: 600 }}>{p.title}</span></Td>
              <Td>{p.representative?.name}</Td>
              <Td>{p.contestId?.name}</Td>
              <Td>{formatDate(p.createdAt)}</Td>
              <Td>{statusBadge(p.status)}</Td>
            </Tr>
          ))}
        </Table>
      </Card>

      {/* Ranking */}
      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 700, flex: 1 }}>Ranking por concurso</h2>
          <select value={selectedContest} onChange={e => setSelectedContest(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1.5px solid var(--gray-200)', fontSize: 14, minWidth: 220 }}>
            <option value="">Selecciona un concurso</option>
            {contests.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {ranking.length > 0 ? (
          <Table headers={['#', 'Proyecto', 'Representante', 'Categoría', 'Calificación']}>
            {ranking.map((p, i) => (
              <Tr key={p._id}>
                <Td>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--gray-200)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    {i + 1}
                  </span>
                </Td>
                <Td><span style={{ fontWeight: 600 }}>{p.title}</span><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.registrationNumber}</span></Td>
                <Td>{p.representative?.name}</Td>
                <Td>{p.categoryName || '—'}</Td>
                <Td>
                  <span style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--primary)', fontWeight: 700 }}>
                    {p.finalScore?.toFixed(2) ?? '—'}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : selectedContest ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No hay proyectos evaluados en este concurso.</div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Selecciona un concurso para ver el ranking.</div>
        )}
      </Card>
    </div>
  );
}
