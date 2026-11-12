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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0e1017] border border-white/10 p-6 shadow-2xl text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-white text-black font-black text-xl flex items-center justify-center mx-auto shadow-md">
            CL
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-2">
            {isRegister ? 'Crear Cuenta CarLog' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isRegister
              ? 'Guarda tus autos capturados y medallas de Spotter'
              : 'Accede a tu Garage y progreso guardado'}
          </p>

          <div className="pt-1 flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
              cloudEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
            }`}>
              {cloudEnabled ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              <span>{cloudEnabled ? 'Sincronización Nube (Supabase)' : 'Almacenamiento Local (Dispositivo)'}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: Lucas_Spotter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              {isRegister ? 'Correo Electrónico' : 'Usuario o Correo'}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-60 transition shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-white/[0.08] text-center text-xs text-zinc-400">
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
                className="font-bold text-white hover:underline ml-1"
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
                className="font-bold text-white hover:underline ml-1"
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
