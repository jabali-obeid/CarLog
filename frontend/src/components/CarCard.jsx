import React from 'react';
import { Volume2, Zap, Gauge, Award, Fuel, Sparkles, MapPin, Palette, Info, Check } from 'lucide-react';
import { RARITY_CONFIG } from '../utils/demoData';
import { sound } from '../utils/audio';
import { getCarRarityScore } from '../utils/carScore';

export default function CarCard({ car, onSave, isSaved, dailyLimitReached = false, onBroadcast, onRevEngine }) {
  const rarity = car?.rarity || 'Común';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Común'];
  const rarityScore = getCarRarityScore(car);

  const handleRev = (e) => {
    e.stopPropagation();
    sound.playEngineRev();
    if (onRevEngine) onRevEngine();
  };

  return (
    <div className="relative group max-w-sm w-full mx-auto transition-all duration-300">
      {/* Main White & Red Card Container */}
      <div
        className={`relative rounded-2xl overflow-hidden border bg-white text-[#111318] shadow-xl transition-all duration-300 ${config.border} ${config.cardClass}`}
      >
        {/* Top Header Strip */}
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.07] bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-telemetry uppercase px-2 py-0.5 rounded-md tracking-wider bg-red-600 text-white font-bold">
              {config.badge}
            </span>
            <span className="text-[10px] font-telemetry font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 shrink-0">
              {rarityScore}/100
            </span>
            <span className="text-[11px] font-telemetry text-slate-500 truncate">
              {car.country || 'Origen Global'}
            </span>
          </div>

          <button
            onClick={handleRev}
            title="Acelerar y escuchar motor"
            aria-label="Acelerar y escuchar motor"
            className="p-1.5 rounded-lg cl-pill hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors text-slate-600 active:scale-90 shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Image View */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
          <img
            src={car.imageUrl || car.image}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Capture Badge */}
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-telemetry text-[#111318] flex items-center gap-1.5 border border-black/[0.08] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Captura verificada</span>
          </div>

          {/* Color tag */}
          {car.color && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-telemetry text-[#111318] border border-black/[0.08] flex items-center gap-1 max-w-[55%] shadow-xs">
              <Palette className="w-3 h-3 text-red-600 shrink-0" />
              <span className="truncate">{car.color}</span>
            </div>
          )}
        </div>

        {/* Title & Telemetry Specs */}
        <div className="p-4 pt-3.5 space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-[#111318] truncate">
                {car.brand}{' '}
                <span className="text-red-600 font-bold">{car.model}</span>
              </h3>
              <span className="text-[11px] font-telemetry font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 shrink-0">
                {car.year || '2023'}
              </span>
            </div>

            {car.engine && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                <Fuel className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{car.engine}</span>
              </p>
            )}
          </div>

          {/* Tabular Telemetry Strip */}
          <div className="grid grid-cols-3 divide-x divide-black/[0.07] py-2.5 rounded-xl cl-panel text-center">
            <div className="px-2">
              <div className="text-[9px] font-telemetry uppercase text-slate-500 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-red-600" /> Potencia
              </div>
              <div className="font-telemetry text-base font-bold text-[#111318] mt-0.5">
                {car.hp || 200} <span className="text-[10px] text-slate-500 font-normal">CV</span>
              </div>
            </div>

            <div className="px-2">
              <div className="text-[9px] font-telemetry uppercase text-slate-500 flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3 text-red-600" /> 0–100
              </div>
              <div className="font-telemetry text-base font-bold text-[#111318] mt-0.5">
                {car.zeroToHundred || 5.2} <span className="text-[10px] text-slate-500 font-normal">s</span>
              </div>
            </div>

            <div className="px-2">
              <div className="text-[9px] font-telemetry uppercase text-slate-500 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-red-600" /> Vel. Máx
              </div>
              <div className="font-telemetry text-base font-bold text-[#111318] mt-0.5">
                {car.topSpeed || 240} <span className="text-[10px] text-slate-500 font-normal">km/h</span>
              </div>
            </div>
          </div>

          {/* Fun fact for car spotters */}
          {car.funFact && (
            <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-200/70 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-red-700 font-semibold mr-1">Curiosidad:</span>
                {car.funFact}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-0.5">
            {onSave && (
              <button
                onClick={() => onSave(car)}
                disabled={isSaved}
                className={`w-full min-h-[42px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isSaved
                    ? 'bg-red-50 border border-red-200 text-red-700 cursor-default'
                    : dailyLimitReached
                      ? 'bg-slate-200 border border-slate-300 text-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_8px_20px_rgba(220,38,38,0.28)]'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-red-600" />
                    <span>En tu Garage (sin repetir)</span>
                  </>
                ) : dailyLimitReached ? (
                  <>
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span>Cupo diario completo (5/5 guardados hoy)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Guardar en el Garage</span>
                  </>
                )}
              </button>
            )}

            {onBroadcast && ['Legendario', 'Histórico', 'Raro'].includes(rarity) && (
              <button
                onClick={() => onBroadcast(car)}
                className="w-full min-h-[38px] py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-red-50 text-red-700 border border-red-200 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Publicar Hallazgo en Radar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
