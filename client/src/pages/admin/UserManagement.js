import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button, Card, Badge, Spinner, PageHeader, Table, Tr, Td, Alert, Input } from '../../components/common/UI';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('reviewers');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const role = activeTab === 'reviewers' ? 'reviewer' : 'admin';
      const res = await api.get('/users', { params: { role } });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      await api.put(`/users/${userId}/status`, { status: 'suspended' });
      setSuccess('Usuario suspendido correctamente');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al suspender usuario');
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.put(`/users/${userId}/status`, { status: 'active' });
      setSuccess('Usuario activado correctamente');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al activar usuario');
    }
  };

  const initiateDelete = (user) => {
    setUserToDelete(user);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeletingId(userToDelete._id);
      setDeleteError('');
      await api.delete(`/users/${userToDelete._id}`);
      setSuccess('Revisor eliminado correctamente');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar usuario';
      setDeleteError(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = { active: 'green', suspended: 'red', inactive: 'gray' };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = { active: 'Activo', suspended: 'Suspendido', inactive: 'Inactivo' };
    return labels[status] || status;
  };

  if (loading) return <Spinner />;

  return (
    <div className="animate-in">
      <PageHeader title="Gestión de Usuarios" subtitle="Administra los revisores y usuarios del sistema" />

      {/* Tabs */}
      <div style={{ marginBottom: 24, borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 0 }}>
        <button
          onClick={() => setActiveTab('reviewers')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'reviewers' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'reviewers' ? '#fff' : 'var(--gray-600)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            borderBottom: activeTab === 'reviewers' ? '2px solid var(--primary)' : 'none',
          }}
        >
          👥 Revisores
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'admins' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'admins' ? '#fff' : 'var(--gray-600)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            borderBottom: activeTab === 'admins' ? '2px solid var(--primary)' : 'none',
          }}
        >
          🔑 Administradores
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <Input
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Card style={{ maxWidth: 450, padding: 24 }}>
            <h3 style={{ marginBottom: 12, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> Confirmar eliminación
            </h3>
            <p style={{ marginBottom: 16, color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.5 }}>
              ¿Está seguro de que desea <strong>eliminar permanentemente</strong> al revisor <strong>{userToDelete.name}</strong> ({userToDelete.email})?
            </p>
            <div style={{ 
              background: '#fef3cd', 
              border: '1px solid #ffc107', 
              borderRadius: 'var(--radius)',
              padding: 12,
              marginBottom: 16,
              fontSize: 13,
              color: '#856404'
            }}>
              ⚡ Esta acción no se puede deshacer
            </div>
            {deleteError && (
              <Alert type="error" message={deleteError} style={{ marginBottom: 16 }} />
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingId !== null}
              >
                Cancelar
              </Button>
              <Button
                style={{ background: '#e74c3c' }}
                loading={deletingId === userToDelete._id}
                onClick={handleDelete}
              >
                {deletingId === userToDelete._id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <Table headers={['Nombre', 'Correo', 'Institución', 'Estado', 'Acciones']}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <Tr key={user._id}>
                <Td><span style={{ fontWeight: 600 }}>{user.name}</span></Td>
                <Td>{user.email}</Td>
                <Td>{user.institution || '—'}</Td>
                <Td>
                  <Badge color={getStatusColor(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSuspend(user._id)}
                        title="Suspender revisor antes de poder eliminarlo"
                      >
                        Suspender
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleActivate(user._id)}
                          title="Reactivar revisor"
                        >
                          Activar
                        </Button>
                        <Button
                          size="sm"
                          style={{ background: '#e74c3c', borderColor: '#c0392b' }}
                          onClick={() => initiateDelete(user)}
                          title="Eliminar revisor (solo disponible cuando está suspendido)"
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                No hay usuarios para mostrar
              </Td>
            </Tr>
          )}
        </Table>
      </Card>
    </div>
  );
};

export default UserManagement;
