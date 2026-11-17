import React, { useState } from 'react';
import { Smartphone, Tablet, QrCode, ShieldAlert, ArrowRight, Monitor, Laptop } from 'lucide-react';

export default function DesktopGate({ onBypass }) {
  const lanUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(lanUrl)}`;

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] text-[#111318] flex flex-col items-center justify-center p-6 relative overflow-hidden cl-microgrid">
      {/* Main Gate Card */}
      <div className="relative z-10 max-w-md w-full rounded-3xl cl-card p-8 flex flex-col items-center text-center space-y-6">

        {/* Device Restriction Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-telemetry font-bold tracking-wider uppercase">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Acceso Restringido en PC</span>
        </div>

        {/* Brand Header */}
        <div className="space-y-1">
          <div className="text-2xl font-ethnocentric tracking-tight text-[#111318]">
            Car<span className="text-red-600">Log</span>
          </div>
          <h1 className="text-lg font-bold text-[#111318] tracking-tight uppercase">
            Exclusivo para Celulares y Tablets
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            CarLog fue diseñada para usarse en la calle con cámara y radar en tiempo real. No está disponible en computadoras de escritorio.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center border border-black/[0.08]">
          <img
            src={qrUrl}
            alt="Código QR para celular y tablet"
            className="w-52 h-52 object-contain rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="mt-2 text-[11px] font-telemetry font-bold text-slate-700 tracking-wider">
            ESCANEA CON TU CELULAR O TABLET
          </span>
        </div>

        {/* Direct URL */}
        <div className="w-full cl-panel rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-[11px] font-telemetry text-slate-500 uppercase tracking-widest">
            O ingresa desde tu navegador móvil:
          </span>
          <span className="text-sm font-telemetry font-bold text-red-600 select-all tracking-wide break-all">
            {lanUrl}
          </span>
        </div>

        {/* Device Compatibility Status Matrix */}
        <div className="grid grid-cols-2 gap-2 w-full text-xs font-telemetry">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Celulares: SÍ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <Tablet className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Tablets: SÍ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 col-span-2 justify-center">
            <Monitor className="w-4 h-4 text-red-600" />
            <span className="font-bold">PC / Notebooks: BLOQUEADO</span>
          </div>
        </div>

        {/* Developer Bypass Toggle (Discreet) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onBypass}
            className="min-h-[44px] px-3 text-xs font-telemetry text-slate-500 hover:text-[#111318] underline underline-offset-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded-lg"
          >
            Continuar en PC (Modo Desarrollador) →
          </button>
        </div>

      </div>
    </div>
  );
}

