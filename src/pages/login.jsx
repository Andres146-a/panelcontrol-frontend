import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = await login(email, password);
      sessionStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="bg-surface border border-border rounded-xl shadow-md w-full max-w-md p-10">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-text">AdminPanel - Super Metal PPG</div>
            <div className="text-xs text-text-3">Sistema de gestión empresarial</div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-text mb-1">Iniciar sesión</h1>
        <p className="text-sm text-text-3 mb-8">Ingresa tus credenciales para acceder al panel</p>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@empresa.com"
            required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text placeholder-text-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 mb-4"
          />

          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text placeholder-text-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 mb-4"
          />

          {/* Error */}
          {error && (
            <p className="text-xs text-red mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-navy text-white py-2.5 rounded-md text-sm font-semibold hover:bg-navy2 transition-colors"
          >
            Acceder al sistema
          </button>
        </form>

        <p className="text-center text-xs text-text-3 mt-6">
          AdminPanel v1.0 — Acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
};

export default Login;