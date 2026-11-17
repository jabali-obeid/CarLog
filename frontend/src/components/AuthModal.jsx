import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, X, Cloud, HardDrive } from 'lucide-react';
import { registerUser, loginUser } from '../utils/auth';
import { isSupabaseConfigured } from '../utils/supabaseClient';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cloudEnabled = isSupabaseConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await registerUser({ username, email, password });
        if (user.needsEmailConfirmation) {
          setSuccess(`Cuenta creada para ${user.username}. Revisa tu correo para confirmar y luego inicia sesión.`);
          setIsRegister(false);
        } else {
          setSuccess(`¡Bienvenido a CarLog, ${user.username}!`);
          setTimeout(() => {
            onAuthSuccess(user);
            onClose();
          }, 900);
        }
      } else {
        const session = await loginUser({ email, password });
        setSuccess(`¡Hola de nuevo, ${session.username}!`);
        setTimeout(() => {
          onAuthSuccess(session);
          onClose();
        }, 900);
      }
    } catch (err) {
      setError(err.message || 'Error al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-black/[0.08] p-6 shadow-2xl text-[#111318] space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-md border border-red-700/20 bg-red-600 p-2.5 flex items-center justify-center">
            <img src="/logo.png" alt="CarLog" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black text-[#111318] tracking-tight mt-2">
            {isRegister ? 'Crear Cuenta CarLog' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Guarda tus autos capturados y medallas de Spotter'
              : 'Accede a tu Garage y progreso guardado'}
          </p>

          <div className="pt-1 flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
              cloudEnabled
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {cloudEnabled ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              <span>{cloudEnabled ? 'Sincronización Nube (Supabase)' : 'Almacenamiento Local (Dispositivo)'}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="auth-username" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-600" />
                Nombre de Usuario
              </label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: Lucas_Spotter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-black/[0.1] text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus:border-red-500 transition"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-600" />
              {isRegister ? 'Correo Electrónico' : 'Usuario o Correo'}
            </label>
            <input
              id="auth-email"
              type={isRegister ? 'email' : 'text'}
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-black/[0.1] text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus:border-red-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-600" />
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-black/[0.1] text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus:border-red-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-60 transition shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-black/[0.08] text-center text-xs text-slate-500">
          {isRegister ? (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="font-bold text-red-600 hover:underline ml-1"
              >
                Inicia sesión
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                  setSuccess(null);
                }}
                className="font-bold text-red-600 hover:underline ml-1"
              >
                Crea una aquí
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
