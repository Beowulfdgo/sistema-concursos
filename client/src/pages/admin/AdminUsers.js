import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Table, Tr, Td, Button, Spinner, Card, Badge } from '../../components/common/UI';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);
  const [tab, setTab] = useState('student');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

const handleSuspend = async (id, name) => {
  if (!window.confirm(`¿Suspender al alumno "${name}"?`)) return;
  setSuspendingId(id);
  try {
    await api.patch(`/users/${id}/status`, { status: 'suspended' }); // ✅ correcto
    setUsers(prev => prev.map(u => u._id === id ? { ...u, status: 'suspended' } : u));
  } catch (err) {
    alert('Error al suspender usuario');
  } finally {
    setSuspendingId(null);
  }
};

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente al alumno "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}/permanent`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert('Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(u => u.role === tab);

  const headers = ['Nombre', 'Email', 'Rol', 'Estado'];
  if (tab === 'student') headers.push('Acciones');

  return (
    <div className="animate-in">
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Gestión de Usuarios</h1>
      <div style={{ marginBottom: 24 }}>
        <Button variant={tab === 'student' ? 'primary' : 'outline'} onClick={() => setTab('student')}>Alumnos</Button>
        <Button variant={tab === 'reviewer' ? 'primary' : 'outline'} onClick={() => setTab('reviewer')} style={{ marginLeft: 8 }}>Revisores</Button>
        <Button variant={tab === 'admin' ? 'primary' : 'outline'} onClick={() => setTab('admin')} style={{ marginLeft: 8 }}>Admins</Button>
      </div>
      <Card>
        {loading ? <Spinner /> : (
          <Table headers={headers}>
            {filtered.map(u => (
              <Tr key={u._id}>
                <Td>{u.name}</Td>
                <Td>{u.email}</Td>
                <Td><Badge color={u.role === 'student' ? 'blue' : u.role === 'reviewer' ? 'yellow' : 'green'}>{u.role}</Badge></Td>
                <Td><Badge color={u.status === 'active' ? 'green' : u.status === 'pending' ? 'yellow' : 'red'}>{u.status}</Badge></Td>
                {tab === 'student' && (
                  <Td>
                    <Button variant="outline" size="sm" loading={suspendingId === u._id} onClick={() => handleSuspend(u._id, u.name)} style={{ marginRight: 6 }}>
                      Suspender
                    </Button>
                    <Button variant="danger" size="sm" loading={deletingId === u._id} onClick={() => handleDelete(u._id, u.name)}>
                      Eliminar
                    </Button>
                  </Td>
                )}
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
