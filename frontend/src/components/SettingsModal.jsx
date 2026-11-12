import React, { useState, useEffect } from 'react';
import { X, Key, Info, Sparkles, Check, Cloud } from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [tripoKey, setTripoKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('cardex_gemini_key') || '');
    setTripoKey(localStorage.getItem('cardex_tripo_key') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const cloudActive = isSupabaseConfigured();

  const handleSave = () => {
    localStorage.setItem('cardex_gemini_key', apiKey.trim());
    localStorage.setItem('cardex_tripo_key', tripoKey.trim());
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e1017] border border-white/10 p-6 shadow-2xl text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-base shadow-md">
              CL
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ajustes de CarLog</h3>
              <p className="text-xs text-zinc-400">Preferencias personales e inteligencia artificial</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
              cloudActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {cloudActive ? 'Nube activa' : 'Modo local'}
          </span>
        </div>

        {/* Gemini API Key Section (Personal user BYOK override) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-4 h-4 text-zinc-300" />
            Tu Gemini API Key (Opcional - Escaneo ilimitado propio)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Dejar vacío para usar la cuota gratuita (15/día)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-zinc-400"
          />
          <p className="text-[11px] text-zinc-500">
            Se guarda solo en tu dispositivo si quieres usar tu propia cuota personal de Google AI Studio.
          </p>
        </div>

        {/* Tripo3D Image-to-3D API Key Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Tripo3D API Key (Opcional - Reconstrucción 3D)
          </label>
          <input
            type="password"
            value={tripoKey}
            onChange={(e) => setTripoKey(e.target.value)}
            placeholder="tsk_..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Rarity guide */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            Escala de Rareza CarLog
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
            <div><strong className="text-amber-400">Histórico:</strong> Clásicos (+35 años)</div>
            <div><strong className="text-yellow-300">Legendario:</strong> Superdeportivos</div>
            <div><strong className="text-purple-400">Raro:</strong> Deportivos / M / AMG / RS</div>
            <div><strong className="text-blue-400">Común:</strong> Sedanes & SUVs</div>
            <div className="col-span-2"><strong className="text-zinc-300">Básico:</strong> Urbanos masivos (Corolla, Gol, Corsa)</div>
          </div>
        </div>

        {/* Footer save */}
        <div className="pt-1">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Configuración Guardada!</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Guardar Ajustes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
