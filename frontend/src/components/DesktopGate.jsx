import React, { useState } from 'react';
import { Smartphone, Tablet, QrCode, ShieldAlert, ArrowRight, Monitor, Laptop } from 'lucide-react';

export default function DesktopGate({ onBypass }) {
  const lanUrl = `http://${window.location.hostname || '192.168.1.213'}:${window.location.port || '5000'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(lanUrl)}`;

  return (
    <div className="min-h-screen w-full bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background ambient automotive grid and glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.08),transparent_60%)] pointer-events-none"></div>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full"></div>

      {/* Main Gate Card */}
      <div className="relative z-10 max-w-md w-full rounded-3xl bg-[#0c0e14] border border-zinc-800/80 p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Device Restriction Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider uppercase shadow">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Acceso Restringido en PC</span>
        </div>

        {/* Brand Header */}
        <div className="space-y-1">
          <div className="text-3xl font-black italic tracking-tighter text-white">
            Car<span className="text-zinc-400">Log</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            Exclusivo para Celulares y Tablets
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            CarLog fue diseñada para usarse en la calle con cámara y radar en tiempo real. No está disponible en computadoras de escritorio.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center border-4 border-amber-400/40">
          <img 
            src={qrUrl} 
            alt="Código QR para celular y tablet" 
            className="w-52 h-52 object-contain rounded-lg"
            onError={(e) => {
              // Fallback placeholder if offline
              e.target.style.display = 'none';
            }}
          />
          <span className="mt-2 text-[10px] font-mono font-bold text-zinc-800 tracking-wider">
            ESCANEA CON TU CELULAR O TABLET
          </span>
        </div>

        {/* Direct URL */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            O ingresa desde tu navegador móvil:
          </span>
          <span className="text-sm font-mono font-bold text-amber-400 select-all tracking-wide">
            {lanUrl}
          </span>
        </div>

        {/* Device Compatibility Status Matrix */}
        <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="font-bold">Celulares: SÍ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
            <Tablet className="w-4 h-4" />
            <span className="font-bold">Tablets: SÍ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-red-500/30 text-red-400 flex items-center gap-2 col-span-2 justify-center">
            <Monitor className="w-4 h-4" />
            <span className="font-bold">PC / Notebooks: BLOQUEADO</span>
          </div>
        </div>

        {/* Developer Bypass Toggle (Discreet) */}
        <div className="pt-2">
          <button
            onClick={onBypass}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition"
          >
            Continuar en PC (Modo Desarrollador) →
          </button>
        </div>

      </div>
    </div>
  );
}

