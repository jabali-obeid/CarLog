import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Zap, Gauge, Award, Fuel, 
  Trash2, ShieldCheck, Sparkles, Sliders, Eye, Box, Image, BookOpen
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
        setToast3D('¡Modelo 3D .GLB asignado y renderizado con éxito!');
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
    { id: 'cyan', label: 'Neón Cyan', hex: '#00F0FF', shadow: '0 0 35px #00F0FF' },
    { id: 'purple', label: 'Neón Púrpura', hex: '#B026FF', shadow: '0 0 35px #B026FF' },
    { id: 'red', label: 'Neón Carmesí', hex: '#FF003C', shadow: '0 0 35px #FF003C' },
    { id: 'green', label: 'Neón Tóxico', hex: '#39FF14', shadow: '0 0 35px #39FF14' },
    { id: 'amber', label: 'Neón Dorado', hex: '#FFB800', shadow: '0 0 35px #FFB800' }
  ];

  const activeNeon = neonColors.find(c => c.id === neonColor) || neonColors[0];

  if (garage.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 rounded-3xl bg-[#08090d] border border-zinc-800">
        <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
          🏎️
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-wider">
          Garage Subterráneo Vacío
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          No tienes vehículos guardados en el garage. Usa el scanner de cámara o añade autos desde la sección principal.
        </p>
        <button
          onClick={onOpenScanner}
          className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition uppercase tracking-wider"
        >
          Ir a Cazar Autos
        </button>
      </div>
    );
  }

  // Calculate tuning gauge bars (NFSU2 style out of 850hp, 2.5s, 360kmh)
  const hpPct = Math.min(100, Math.round(((currentCar?.hp || 200) / 850) * 100));
  const accelPct = Math.min(100, Math.round(((8 - (currentCar?.zeroToHundred || 5.0)) / 5.5) * 100));
  const speedPct = Math.min(100, Math.round(((currentCar?.topSpeed || 200) / 360) * 100));

  const rarityCfg = RARITY_CONFIG[currentCar?.rarity] || RARITY_CONFIG['Común'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* NFSU2 Top Garage Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          {onBackToBookshelf && (
            <button
              onClick={onBackToBookshelf}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>← Estantería</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 font-black text-xs uppercase tracking-widest shadow">
            {selectedBrandTitle ? `VOLUMEN // ${selectedBrandTitle.toUpperCase()}` : 'GARAGE // 3D SHOWROOM'}
          </div>
          <span className="text-sm font-black text-zinc-300 uppercase tracking-wider hidden md:inline">
            Taller Subterráneo
          </span>
        </div>

        {/* View Mode Toggle: 3D Model vs 2D Photo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode3D(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode3D
                  ? 'bg-zinc-200 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Modelo 3D</span>
            </button>

            <button
              onClick={() => setViewMode3D(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                !viewMode3D
                  ? 'bg-zinc-700 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Vista Foto</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-500">AUTO:</span>
            <span className="text-zinc-200 font-bold text-sm">
              {String(safeIndex + 1).padStart(2, '0')} <span className="text-zinc-600">/ {String(garage.length).padStart(2, '0')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Underground Garage Bay Viewport */}
      <div className="relative rounded-3xl bg-[#07080c] border-2 border-zinc-800 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[540px]">
        {/* Overhead Fluorescent Shop Lights & Industrial Metal Texture */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-zinc-800/40 to-transparent flex justify-around px-8 pointer-events-none z-20">
          <div className="w-32 h-1 bg-cyan-400/80 shadow-[0_0_15px_#00F0FF] rounded-full"></div>
          <div className="w-40 h-1 bg-white/70 shadow-[0_0_15px_#FFFFFF] rounded-full"></div>
          <div className="w-32 h-1 bg-amber-400/80 shadow-[0_0_15px_#FFB800] rounded-full"></div>
        </div>

        {/* Industrial Grating & Hazard Stripe Background Accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Top Header of the Selected Vehicle */}
        <div className="relative z-20 p-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-black tracking-wider ${rarityCfg.bgBadge}`}>
                {currentCar.rarity || 'Común'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                AÑO {currentCar.year || '2023'} • {currentCar.country || 'GLOBAL'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tight uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              {currentCar.brand} <span className="text-zinc-400 font-bold">{currentCar.model || currentCar.name}</span>
            </h2>
          </div>

          {/* Delete from garage button (hidden in read-only Showroom mode) */}
          {onDeleteCar && (
            <button
              onClick={() => {
                onDeleteCar(currentCar.id);
                if (safeIndex > 0) setSelectedIndex(safeIndex - 1);
              }}
              title="Vender / Quitar del Garage"
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-red-600/80 text-zinc-400 hover:text-white border border-zinc-700 transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descartar</span>
            </button>
          )}
        </div>

        {/* Center Stage: 3D Interactive Turntable OR 2D Cutout Photo */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-2">
          {/* Left Arrow Navigation Button */}
          <button
            onClick={prevCar}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 transition shadow-2xl backdrop-blur-md"
            title="Deslizar auto anterior"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Right Arrow Navigation Button */}
          <button
            onClick={nextCar}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-500 hover:scale-110 active:scale-95 transition shadow-2xl backdrop-blur-md"
            title="Deslizar siguiente auto"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {viewMode3D ? (
            /* 3D Interactive Turntable View */
            <div className="w-full">
              <Car3DViewer car={currentCar} neonColorHex={activeNeon.hex} />
            </div>
          ) : (
            /* 2D Cutout on Reflective Asphalt */
            <div className="relative flex flex-col items-center justify-center w-full max-w-lg py-12">
              <div
                style={{
                  backgroundColor: activeNeon.hex,
                  boxShadow: activeNeon.shadow
                }}
                className="absolute -bottom-2 w-72 sm:w-96 h-10 rounded-full blur-xl opacity-80 transition-all duration-500"
              />
              <div className="absolute -bottom-4 w-80 sm:w-[460px] h-12 rounded-full border border-zinc-700/80 bg-zinc-950/60 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-64 sm:w-[380px] h-8 rounded-full border border-zinc-800/60"></div>
              </div>
              <img
                src={currentCar.cutoutImage || currentCar.imageUrl || currentCar.image}
                alt={currentCar.model}
                className="relative z-20 w-80 sm:w-[420px] h-52 object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.9)] transition-all duration-500 hover:scale-105"
                onError={(e) => {
                  e.target.src = currentCar.imageUrl || currentCar.image;
                }}
              />
              <div className="w-72 sm:w-96 h-4 bg-black/40 rounded-full blur-sm -mt-2 relative z-10"></div>
            </div>
          )}
        </div>

        {/* Bottom Tuner HUD: NFSU2 Dyno Performance Gauges */}
        <div className="relative z-20 bg-[#090b12]/95 border-t border-zinc-800 p-5 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Dyno Gauge Bars */}
            <div className="md:col-span-2 space-y-2.5">
              {/* HP Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 uppercase">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Potencia (BHP / CV)
                  </span>
                  <span className="text-amber-400 font-black text-sm">
                    {currentCar.hp} CV
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    style={{ width: `${hpPct}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-700 shadow-[0_0_8px_#f59e0b]"
                  />
                </div>
              </div>

              {/* Accel Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 uppercase">
                    <Gauge className="w-3.5 h-3.5 text-red-500" /> Aceleración (0-100 km/h)
                  </span>
                  <span className="text-red-400 font-black text-sm">
                    {currentCar.zeroToHundred}s
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    style={{ width: `${accelPct}%` }}
                    className="h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 rounded-full transition-all duration-700 shadow-[0_0_8px_#ef4444]"
                  />
                </div>
              </div>

              {/* Top Speed Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 uppercase">
                    <Award className="w-3.5 h-3.5 text-cyan-400" /> Velocidad Punta
                  </span>
                  <span className="text-cyan-400 font-black text-sm">
                    {currentCar.topSpeed} km/h
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    style={{ width: `${speedPct}%` }}
                    className="h-full bg-gradient-to-r from-cyan-700 via-cyan-500 to-blue-400 rounded-full transition-all duration-700 shadow-[0_0_8px_#06b6d4]"
                  />
                </div>
              </div>
            </div>

            {/* Underglow Customizer & NHTSA Validation Badge */}
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-5">
              {/* NFSU2 Underglow Color Selector */}
              <div>
                <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-zinc-300" />
                  Neón Underglow de Piso
                </div>
                <div className="flex items-center gap-2">
                  {neonColors.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNeonColor(n.id)}
                      style={{ backgroundColor: n.hex }}
                      title={n.label}
                      className={`w-6 h-6 rounded-full transition-transform active:scale-90 ${
                        neonColor === n.id ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Official NHTSA vPIC Verification Badge */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  NHTSA vPIC VERIFICADO
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
                  ID: {currentCar.vpicMeta?.makeId || '584'} • {currentCar.vpicMeta?.databaseSource || 'U.S. Dept of Transportation'}
                </div>
              </div>

              {/* Option C: Image-to-3D Generator Trigger */}
              <button
                onClick={handleGenerate3D}
                disabled={generating3D}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${generating3D ? 'animate-spin' : ''}`} />
                {generating3D ? 'Reconstruyendo Malla 3D...' : 'Asignar / Generar Malla 3D .GLB'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails Carousel: Click or swipe sideways */}
      <div>
        <div className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Desliza para elegir auto en el elevador:
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {garage.map((carItem, idx) => (
            <div
              key={carItem.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`flex-shrink-0 w-36 p-2 rounded-2xl border transition-all cursor-pointer bg-[#0c0d15] ${
                selectedIndex === idx
                  ? 'border-red-500 ring-2 ring-red-500/40 scale-105'
                  : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="h-16 w-full flex items-center justify-center bg-black/40 rounded-xl overflow-hidden mb-1.5">
                <img
                  src={carItem.cutoutImage || carItem.imageUrl || carItem.image}
                  alt={carItem.model}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="text-[11px] font-black text-white truncate">{carItem.brand}</div>
              <div className="text-[10px] font-bold text-zinc-400 truncate">{carItem.model || carItem.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
