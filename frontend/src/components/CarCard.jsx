import React, { useState } from 'react';
import { Volume2, Zap, Gauge, Award, Fuel, Sparkles, MapPin, Share2 } from 'lucide-react';
import { RARITY_CONFIG } from '../utils/demoData';
import { sound } from '../utils/audio';

export default function CarCard({ car, onSave, isSaved, onBroadcast, onRevEngine }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rarity = car?.rarity || 'Común';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Común'];

  const handleRev = (e) => {
    e.stopPropagation();
    sound.playEngineRev();
    if (onRevEngine) onRevEngine();
  };

  return (
    <div className="relative group max-w-sm w-full mx-auto perspective-1000 transition-all duration-300">
      {/* Glow Aura */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${config.glow} opacity-70 blur-xl group-hover:opacity-100 transition duration-500`}></div>

      {/* Main Card Container */}
      <div 
        className={`relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#161926] to-[#0c0e17] text-white shadow-2xl transition-all duration-300 hover:scale-[1.02] ${config.border} ${config.cardClass}`}
      >
        {/* Top Header Strip */}
        <div className="p-3.5 pb-2 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full tracking-wider shadow-sm ${config.bgBadge}`}>
              {config.badge}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              {car.country || 'Origen Global'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRev}
              title="Acelerar y escuchar motor"
              className="p-1.5 rounded-full bg-white/10 hover:bg-red-600/80 hover:text-white transition-colors text-zinc-300 active:scale-90"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vehicle Image View */}
        <div className="relative h-48 w-full overflow-hidden bg-black/60 flex items-center justify-center">
          <img
            src={car.imageUrl || car.image}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Privacy Plate Blur Badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-zinc-400 flex items-center gap-1 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Patente protegida
          </div>

          {/* Color tag */}
          {car.color && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[11px] text-zinc-300 border border-white/10">
              🎨 {car.color}
            </div>
          )}
        </div>

        {/* Title & Model */}
        <div className="p-4 pt-3">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>{car.brand}</span>
              <span className="text-zinc-400 font-semibold text-lg">{car.model}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {car.year || '2023'}
            </span>
          </div>

          {/* Motor specification badge */}
          {car.engine && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 mb-3">
              <Fuel className="w-3.5 h-3.5 text-zinc-500" />
              <span className="truncate">{car.engine}</span>
            </p>
          )}

          {/* Stats Grid - Pokemon/Top Trumps Style */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 mb-3">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-400" /> Potencia
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {car.hp || 200} <span className="text-[10px] text-zinc-400 font-normal">CV</span>
              </div>
            </div>

            <div className="text-center border-x border-white/10">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-0.5">
                <Gauge className="w-3 h-3 text-red-400" /> 0-100
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {car.zeroToHundred || 5.2} <span className="text-[10px] text-zinc-400 font-normal">s</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-0.5">
                <Award className="w-3 h-3 text-cyan-400" /> Vel. Máx
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {car.topSpeed || 240} <span className="text-[10px] text-zinc-400 font-normal">km/h</span>
              </div>
            </div>
          </div>

          {/* Fun fact for car spotters */}
          {car.funFact && (
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-zinc-300 leading-relaxed mb-3">
              <span className="text-amber-400 font-bold mr-1">💡 Curiosidad:</span>
              {car.funFact}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {onSave && (
              <button
                onClick={() => onSave(car)}
                disabled={isSaved}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                  isSaved
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 cursor-default'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/30'
                }`}
              >
                {isSaved ? (
                  <>✓ En tu Garage Coleccionista</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Guardar en el Garage
                  </>
                )}
              </button>
            )}

            {onBroadcast && ['Legendario', 'Histórico', 'Raro'].includes(rarity) && (
              <button
                onClick={() => onBroadcast(car)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                Alertar a Cazadores Cercanos (Radar)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

