import React, { useState, useEffect } from 'react';
import { X, Key, Info, Sparkles, Check, Cloud } from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [tripoKey, setTripoKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('carlog_gemini_key') || '');
    setTripoKey(localStorage.getItem('carlog_tripo_key') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const cloudActive = isSupabaseConfigured();

  const handleSave = () => {
    localStorage.setItem('carlog_gemini_key', apiKey.trim());
    localStorage.setItem('carlog_tripo_key', tripoKey.trim());
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-black/[0.08] p-6 shadow-2xl text-[#111318] space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ajustes"
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-ethnocentric text-xs shadow-sm">
              CL
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#111318]">Ajustes de CarLog</h3>
              <p className="text-xs text-slate-500">Preferencias personales e inteligencia artificial</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-telemetry font-semibold ${
              cloudActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-black/[0.08]'
            }`}
          >
            {cloudActive ? 'Nube activa' : 'Modo local'}
          </span>
        </div>

        {/* Gemini API Key Section (Personal user BYOK override) */}
        <div className="space-y-1.5">
          <label htmlFor="settings-gemini-key" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-4 h-4 text-red-600" />
            Tu Gemini API Key (Opcional - Escaneo propio)
          </label>
          <input
            id="settings-gemini-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Dejar vacío para usar la cuota gratuita (15/día)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-black/[0.1] text-[#111318] placeholder-slate-400 text-xs font-telemetry focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus:border-red-500 transition"
          />
          <p className="text-xs text-slate-500">
            Se guarda solo en tu dispositivo si quieres usar tu propia cuota personal de Google AI Studio.
          </p>
        </div>

        {/* Tripo3D Image-to-3D API Key Section */}
        <div className="space-y-1.5">
          <label htmlFor="settings-tripo-key" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-red-600" />
            Tripo3D API Key (Opcional - Reconstrucción 3D)
          </label>
          <input
            id="settings-tripo-key"
            type="password"
            value={tripoKey}
            onChange={(e) => setTripoKey(e.target.value)}
            placeholder="tsk_..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-black/[0.1] text-[#111318] placeholder-slate-400 text-xs font-telemetry focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus:border-red-500 transition"
          />
        </div>

        {/* Rarity guide */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-black/[0.06] space-y-2">
          <div className="text-xs font-bold text-[#111318] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-red-600" />
            Escala de Rareza CarLog
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
            <div><strong className="text-amber-700">Histórico:</strong> Clásicos (+35 años)</div>
            <div><strong className="text-red-600">Legendario:</strong> Superdeportivos</div>
            <div><strong className="text-purple-700">Raro:</strong> Deportivos / M / AMG / RS</div>
            <div><strong className="text-blue-700">Común:</strong> Sedanes & SUVs</div>
            <div className="col-span-2"><strong className="text-slate-800">Básico:</strong> Urbanos masivos (Corolla, Gol, Corsa)</div>
          </div>
        </div>

        {/* Footer save */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
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
