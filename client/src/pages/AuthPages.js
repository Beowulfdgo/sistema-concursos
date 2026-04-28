import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { Button, Input, Alert } from '../components/common/UI';



const AuthCard = ({ children, title, subtitle }) => (
  <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, var(--gray-900) 0%, #1a1a2e 50%, var(--gray-900) 100%)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,26,42,0.12)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(26,60,107,0.15)', filter: 'blur(80px)' }} />
    </div>
    <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', width: '100%', maxWidth: 440, overflow: 'hidden', position: 'relative', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ background: 'var(--primary)', padding: '32px 36px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 28 }}>🏅</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.3 }}>Sistema de Gestión<br />de Concursos</div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 28, marginBottom: 6 }}>{title}</h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '32px 36px' }}>{children}</div>
    </div>
  </div>
);

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'reviewer') navigate('/reviewer/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        setError(data?.message || 'Error al iniciar sesión.');
      }
    } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Bienvenido" subtitle="Inicia sesión para continuar">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <Input label="Correo electrónico" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@correo.com" />
        <Input label="Contraseña" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
        <Button type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>Iniciar sesión</Button>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Regístrate</Link>
        </p>
      </form>
    </AuthCard>
  );
};

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    setError(''); setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el registro.');
    } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Crear cuenta" subtitle="Regístrate como alumno participante">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <Input label="Nombre completo" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre" />
        <Input label="Correo electrónico" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@correo.com" />
        <Input label="Contraseña" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
        <Input label="Confirmar contraseña" type="password" required value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repite la contraseña" />
        <Button type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>Crear cuenta</Button>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </form>
    </AuthCard>
  );
};

export const VerifyEmailPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = { state: {} };

  // Get email from location state or localStorage
  const email = window.history.state?.usr?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const api = (await import('../../api/axios')).default;
      await api.post('/auth/verify-email', { email, code });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido o expirado.');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      const api = (await import('../../api/axios')).default;
      await api.post('/auth/resend-code', { email });
      setError('');
    } catch {}
  };

  return (
    <AuthCard title="Verifica tu correo" subtitle={`Ingresa el código enviado a ${email}`}>
      {success ? (
        <Alert type="success" message="¡Cuenta verificada! Redirigiendo al login..." />
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          <Alert type="info" message="Revisa tu bandeja de entrada (y spam). El código expira en 15 minutos." />
          <Input label="Código de 6 dígitos" required value={code} onChange={e => setCode(e.target.value)} placeholder="123456" maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }} />
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center' }}>Verificar cuenta</Button>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
            ¿No recibiste el código?{' '}
            <button type="button" onClick={resend} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Reenviar</button>
          </p>
        </form>
      )}
    </AuthCard>
  );
};
