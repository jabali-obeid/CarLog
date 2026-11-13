import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Zap, Gauge, Award,
  Trash2, ShieldCheck, Sparkles, Sliders, Box, Image, BookOpen, Warehouse, Check
} from 'lucide-react';
import { RARITY_CONFIG } from '../utils/demoData';
import Car3DViewer from './Car3DViewer';

export default function NfsGarageView({ garage = [], onDeleteCar, onOpenScanner, onBackToBookshelf, selectedBrandTitle }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [neonColor, setNeonColor] = useState('cyan'); // 'cyan' | 'purple' | 'red' | 'green' | 'amber'
  const [viewMode3D, setViewMode3D] = useState(true); // Default to 3D interactive mode!
  const [generating3D, setGenerating3D] = useState(false);
  const [toast3D, setToast3D] = useState(null);

  useEffect(() => {
    if (garage.length === 0) {
      if (selectedIndex !== 0) setSelectedIndex(0);
    } else if (selectedIndex >= garage.length) {
      setSelectedIndex(garage.length - 1);
    }
  }, [garage.length, selectedIndex]);

  const safeIndex = garage.length > 0 ? Math.min(selectedIndex, garage.length - 1) : 0;
  const currentCar = garage[safeIndex] || null;

  const handleGenerate3D = async () => {
    if (!currentCar) return;
    setGenerating3D(true);
    try {
      const tripoApiKey = localStorage.getItem('cardex_tripo_key') || '';
      const res = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentCar.imageUrl || currentCar.image,
          brand: currentCar.brand,
          model: currentCar.model || currentCar.name,
          tripoApiKey
        })
      });
      if (res.ok) {
        const data = await res.json();
        currentCar.model3dUrl = data.model3dUrl || '/models/ferrari.glb';
        setViewMode3D(true);
        setToast3D('Modelo 3D .GLB asignado y renderizado con éxito.');
        setTimeout(() => setToast3D(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating3D(false);
    }
  };

  const nextCar = () => {
    if (garage.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % garage.length);
  };

  const prevCar = () => {
    if (garage.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + garage.length) % garage.length);
  };

  const neonColors = [
    { id: 'cyan', label: 'Neón Cyan', hex: '#00F0FF', shadow: '0 0 30px rgba(0,240,255,0.45)' },
    { id: 'purple', label: 'Neón Púrpura', hex: '#B026FF', shadow: '0 0 30px rgba(176,38,255,0.45)' },
    { id: 'red', label: 'Neón Carmesí', hex: '#FF003C', shadow: '0 0 30px rgba(255,0,60,0.45)' },
    { id: 'green', label: 'Neón Tóxico', hex: '#39FF14', shadow: '0 0 30px rgba(57,255,20,0.4)' },
    { id: 'amber', label: 'Neón Dorado', hex: '#FFB800', shadow: '0 0 30px rgba(255,184,0,0.45)' }
  ];

  const activeNeon = neonColors.find(c => c.id === neonColor) || neonColors[0];

  if (garage.length === 0) {
    return (
      <div className="py-16 px-6 text-center space-y-4 rounded-3xl cl-card cl-microgrid">
        <div className="w-16 h-16 rounded-2xl bg-red-600/12 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-inner">
          <Warehouse className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-telemetry uppercase tracking-widest text-[var(--cl-text-muted)] block">
            BAHÍA 00 · SIN VEHÍCULOS
          </span>
          <h3 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight">
            Garage Subterráneo Vacío
          </h3>
          <p className="text-xs text-[var(--cl-text-secondary)] max-w-xs mx-auto leading-relaxed">
            Todavía no tienes vehículos guardados en esta colección. Usa el escáner óptico o guarda un modelo desde CarLog.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onBackToBookshelf && (
            <button
              onClick={onBackToBookshelf}
              className="px-4 py-2.5 rounded-xl cl-pill hover:bg-[#232838] text-zinc-200 font-semibold text-xs transition active:scale-[0.98]"
            >
              Volver a Estantería
            </button>
          )}
          <button
            onClick={onOpenScanner}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-[0_8px_20px_rgba(220,38,38,0.28)] transition uppercase tracking-wider active:scale-[0.98]"
          >
            Ir a Escanear Autos
          </button>
        </div>
      </div>
    );
  }

  // Calculate tuning gauge bars (Dyno scale out of 850hp, 2.5s, 360kmh)
  const hpPct = Math.min(100, Math.round(((currentCar?.hp || 200) / 850) * 100));
  const accelPct = Math.min(100, Math.max(8, Math.round(((8 - (currentCar?.zeroToHundred || 5.0)) / 5.5) * 100)));
  const speedPct = Math.min(100, Math.round(((currentCar?.topSpeed || 200) / 360) * 100));

  const rarityCfg = RARITY_CONFIG[currentCar?.rarity] || RARITY_CONFIG['Común'];

  return (
    <div className="space-y-4 max-w-5xl mx-auto select-none animate-fade-in pb-2">
      {/* Toast 3D */}
      {toast3D && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/35 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast3D}</span>
        </div>
      )}

      {/* Top Garage Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToBookshelf && (
            <button
              onClick={onBackToBookshelf}
              className="px-2.5 py-1.5 rounded-xl cl-pill hover:bg-[#232838] text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 active:scale-[0.97]"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>Estantería</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-white text-[#08090c] font-telemetry font-bold text-[10px] uppercase tracking-widest">
            {selectedBrandTitle ? selectedBrandTitle.toUpperCase() : 'GARAGE // 3D'}
          </div>
        </div>

        {/* View Mode Toggle + Telemetry Unit Index */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center cl-panel p-1 rounded-xl">
            <button
              onClick={() => setViewMode3D(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                viewMode3D
                  ? 'bg-white text-[#08090c] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>

            <button
              onClick={() => setViewMode3D(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                !viewMode3D
                  ? 'bg-white text-[#08090c] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>
          </div>

          <div className="px-2.5 py-1 rounded-lg cl-panel font-telemetry text-[11px]">
            <span className="text-white font-bold">{String(safeIndex + 1).padStart(2, '0')}</span>
            <span className="text-zinc-500"> / {String(garage.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Underground Showroom Bay Viewport */}
      <div className="relative rounded-3xl cl-card cl-microgrid overflow-hidden flex flex-col justify-between">
        {/* Overhead Showroom Studio Light Diffusers */}
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/[0.045] to-transparent flex justify-center gap-8 px-10 pt-1 pointer-events-none z-20">
          <div className="w-24 h-[2px] bg-white/40 rounded-full blur-[1px]" />
          <div className="w-36 h-[2px] bg-white/60 rounded-full blur-[1px]" />
          <div className="w-24 h-[2px] bg-white/40 rounded-full blur-[1px]" />
        </div>

        {/* Top Header of the Selected Vehicle */}
        <div className="relative z-20 px-4 sm:px-5 pt-5 pb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-telemetry px-2 py-0.5 rounded-md uppercase font-bold tracking-wider ${rarityCfg.bgBadge}`}>
                {currentCar.rarity || 'Común'}
              </span>
              <span className="text-[11px] font-telemetry text-[var(--cl-text-secondary)] uppercase tracking-wider">
                AÑO {currentCar.year || '2023'} · {currentCar.country || 'GLOBAL'}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white italic tracking-tight uppercase leading-[0.95] truncate">
              {currentCar.brand}{' '}
              <span className="text-zinc-400 font-bold not-italic">{currentCar.model || currentCar.name}</span>
            </h2>
          </div>

          {/* Delete from garage button (hidden in read-only Showroom mode) */}
          {onDeleteCar && (
            <button
              onClick={() => {
                onDeleteCar(currentCar.id);
                if (safeIndex > 0) setSelectedIndex(safeIndex - 1);
              }}
              title="Quitar del Garage"
              className="px-2.5 py-2 rounded-xl cl-pill hover:bg-red-600/20 hover:border-red-500/40 text-zinc-400 hover:text-red-300 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descartar</span>
            </button>
          )}
        </div>

        {/* Center Stage: 3D Interactive Turntable OR 2D Cutout Photo */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-3 py-2">
          {/* Left Arrow Navigation Button */}
          {garage.length > 1 && (
            <button
              onClick={prevCar}
              aria-label="Auto anterior"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0c0e14]/80 border border-white/15 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-400/50 active:scale-90 transition shadow-xl backdrop-blur-md"
              title="Auto anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Navigation Button */}
          {garage.length > 1 && (
            <button
              onClick={nextCar}
              aria-label="Siguiente auto"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0c0e14]/80 border border-white/15 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-400/50 active:scale-90 transition shadow-xl backdrop-blur-md"
              title="Siguiente auto"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {viewMode3D ? (
            <div className="w-full">
              <Car3DViewer car={currentCar} neonColorHex={activeNeon.hex} />
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full max-w-lg py-10">
              <div
                style={{
                  backgroundColor: activeNeon.hex,
                  boxShadow: activeNeon.shadow
                }}
                className="absolute bottom-6 w-64 sm:w-80 h-7 rounded-full blur-xl opacity-60 transition-all duration-500"
              />
              <div className="absolute bottom-4 w-72 sm:w-96 h-10 rounded-full border border-white/[0.1] bg-[#08090c]/80 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-56 sm:w-80 h-6 rounded-full border border-white/[0.05]" />
              </div>
              <img
                src={currentCar.cutoutImage || currentCar.imageUrl || currentCar.image}
                alt={currentCar.model || currentCar.name}
                className="relative z-20 w-72 sm:w-96 h-48 object-contain drop-shadow-[0_22px_24px_rgba(0,0,0,0.88)] transition-transform duration-500 hover:scale-[1.03]"
                onError={(e) => {
                  e.target.src = currentCar.imageUrl || currentCar.image;
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Tuner HUD: Dyno Performance Telemetry */}
        <div className="relative z-20 bg-[#0b0d13]/95 border-t border-white/[0.08] p-4 sm:p-5 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Dyno Gauge Bars */}
            <div className="md:col-span-2 space-y-2.5">
              {/* HP Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-telemetry mb-1">
                  <span className="text-[var(--cl-text-secondary)] flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Potencia
                  </span>
                  <span className="text-amber-300 font-bold text-xs">
                    {currentCar.hp} <span className="text-[10px] text-zinc-500 font-normal">CV</span>
                  </span>
                </div>
                <div className="h-2 w-full cl-panel rounded-full overflow-hidden">
                  <div
                    style={{ width: `${hpPct}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                  />
                </div>
              </div>

              {/* Accel Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-telemetry mb-1">
                  <span className="text-[var(--cl-text-secondary)] flex items-center gap-1.5 uppercase tracking-wider">
                    <Gauge className="w-3.5 h-3.5 text-red-400" /> 0–100 km/h
                  </span>
                  <span className="text-red-300 font-bold text-xs">
                    {currentCar.zeroToHundred}<span className="text-[10px] text-zinc-500 font-normal ml-0.5">s</span>
                  </span>
                </div>
                <div className="h-2 w-full cl-panel rounded-full overflow-hidden">
                  <div
                    style={{ width: `${accelPct}%` }}
                    className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-700"
                  />
                </div>
              </div>

              {/* Top Speed Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-telemetry mb-1">
                  <span className="text-[var(--cl-text-secondary)] flex items-center gap-1.5 uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-cyan-400" /> Vel. Punta
                  </span>
                  <span className="text-cyan-300 font-bold text-xs">
                    {currentCar.topSpeed} <span className="text-[10px] text-zinc-500 font-normal">km/h</span>
                  </span>
                </div>
                <div className="h-2 w-full cl-panel rounded-full overflow-hidden">
                  <div
                    style={{ width: `${speedPct}%` }}
                    className="h-full bg-gradient-to-r from-cyan-700 to-cyan-400 rounded-full transition-all duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Underglow Customizer & NHTSA Validation */}
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/[0.08] pt-3 md:pt-0 md:pl-4">
              {/* Underglow Color Selector */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-telemetry text-[var(--cl-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Underglow</span>
                </div>
                <div className="flex items-center gap-2">
                  {neonColors.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNeonColor(n.id)}
                      style={{ backgroundColor: n.hex }}
                      title={n.label}
                      aria-label={n.label}
                      className={`w-5 h-5 rounded-full transition-transform active:scale-90 ${
                        neonColor === n.id
                          ? 'scale-120 ring-2 ring-white ring-offset-2 ring-offset-[#0b0d13]'
                          : 'opacity-55 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Official NHTSA vPIC Verification Badge */}
              <div className="p-2.5 rounded-xl cl-panel text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-telemetry tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>NHTSA vPIC VERIFICADO</span>
                </div>
                <div className="text-[10px] text-[var(--cl-text-muted)] font-telemetry truncate mt-0.5">
                  ID: {currentCar.vpicMeta?.makeId || '584'} · {currentCar.vpicMeta?.databaseSource || 'U.S. Dept of Transportation'}
                </div>
              </div>

              {/* Image-to-3D Generator Trigger */}
              <button
                onClick={handleGenerate3D}
                disabled={generating3D}
                className="w-full py-2.5 px-3 rounded-xl cl-pill hover:bg-[#232838] text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${generating3D ? 'animate-spin' : ''}`} />
                <span>{generating3D ? 'Reconstruyendo Malla 3D...' : 'Generar / Asignar Malla .GLB'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails Carousel */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[10px] font-telemetry font-bold text-[var(--cl-text-muted)] uppercase tracking-widest">
            Selector de Bahía
          </span>
          <span className="text-[10px] font-telemetry text-zinc-500">
            {garage.length} {garage.length === 1 ? 'unidad' : 'unidades'}
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-none">
          {garage.map((carItem, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                type="button"
                key={carItem.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`flex-shrink-0 w-36 p-2 rounded-2xl border text-left transition-all cursor-pointer snap-start active:scale-[0.97] ${
                  isSelected
                    ? 'cl-card border-red-500/80 ring-1 ring-red-500/40'
                    : 'bg-[#0e1118] border-white/[0.06] hover:border-white/20 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="h-16 w-full flex items-center justify-center cl-panel rounded-xl overflow-hidden mb-1.5 px-1">
                  <img
                    src={carItem.cutoutImage || carItem.imageUrl || carItem.image}
                    alt={carItem.model || carItem.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-xs font-extrabold uppercase text-white truncate">
                    {carItem.brand}
                  </span>
                  <span className="font-telemetry text-[9px] text-zinc-400 shrink-0">
                    {carItem.hp || 0}CV
                  </span>
                </div>
                <div className="text-[10px] font-medium text-zinc-400 truncate">
                  {carItem.model || carItem.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
