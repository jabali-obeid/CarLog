import React, { useState, useMemo, useEffect } from 'react';
import { Search, Box, Check, Plus, MapPin, UserCheck, Flame, Sparkles, Camera, Radio } from 'lucide-react';
import { getCarRarityScore, getScoreTheme } from '../utils/carScore';
import { isCarInSavedSet, getCarIdentityKey } from '../utils/auth';
import { fetchWeeklyRealFinds } from '../utils/radarService';

const FILTER_TABS = [
  { id: 'all', label: 'Todos los reales' },
  { id: 'ultra', label: '90–100 pts' },
  { id: 'classics', label: 'Clásicos' }
];

function BubbleFindCard({ car, rank, isSaved, onOpenIn3D, onSaveToGarage }) {
  const [imgFailed, setImgFailed] = useState(false);
  const modelName = car.model || car.name || 'Modelo';
  const score = car._score;
  const theme = getScoreTheme(score);
  const clampedPct = Math.max(4, Math.min(100, score));
  const remainingTo100 = Math.max(0, 100 - score);
  const thumbSrc = !imgFailed ? (car.cutoutImage || car.imageUrl || car.image) : '';

  return (
    <article className="rounded-[26px] shadow-[0_20px_42px_-16px_rgba(15,23,42,0.28)] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5">
      {/* Top White Bubble Header */}
      <div className="relative z-10 bg-white rounded-b-[20px] p-3.5 sm:p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-3">
          {/* Square Vehicle Thumbnail */}
          <div className="w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-2xl bg-[#f1f2f5] border border-black/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={`${car.brand} ${modelName}`}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className={`w-full h-full ${car.cutoutImage ? 'object-contain p-1' : 'object-cover'}`}
              />
            ) : (
              <span className="font-display font-extrabold text-sm text-slate-400 uppercase tracking-tight">
                {(car.brand || 'CL').slice(0, 3)}
              </span>
            )}
          </div>

          {/* Finder, Title & Score Value */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#7c8492] truncate flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{car.spottedBy || 'Spotter'}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0 ${theme.pillClass}`}>
                #{rank} · {theme.pillLabel}
              </span>
            </div>

            <h3 className="font-sans font-bold text-[16px] sm:text-[18px] text-[#111318] tracking-tight leading-snug truncate mt-0.5">
              {car.brand} {modelName} {car.year ? car.year : ''}
            </h3>

            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className={`text-[13px] font-bold ${theme.accentText}`}>
                Índice {score} / 100 · {car.rarity || theme.tierLabel}
              </span>
            </div>

            <div className="text-[11px] text-[#64748b] flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{car.location || 'Avistamiento en calle'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Rich Gradient Bubble Body */}
      <div className={`-mt-4 pt-7 px-4 pb-4 text-white bg-gradient-to-br ${theme.gradient}`}>
        <div className="text-[10px] font-telemetry uppercase tracking-[0.26em] text-white/80 text-center">
          RAREZA DEL HALLAZGO
        </div>

        {/* Rarity 1-100 Progress Meter */}
        <div className="relative mt-6 mb-2">
          <div
            className="absolute -top-5 -translate-x-1/2 font-telemetry text-[12px] font-bold text-white drop-shadow"
            style={{ left: `${clampedPct}%` }}
          >
            {score} pts
          </div>

          <div className="relative h-1.5 rounded-full bg-white/25 overflow-visible">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.barFill}`}
              style={{ width: `${clampedPct}%` }}
            />
            <span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)] ring-4 ring-white/25"
              style={{ left: `${clampedPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/85 font-medium mt-2">
            <span>{car.hp ? `${car.hp} CV · ${car.country || 'Mundo'}` : car.country || 'Hallazgo real'}</span>
            <span>{remainingTo100 === 0 ? 'Máximo histórico (100)' : `A ${remainingTo100} del 100`}</span>
          </div>
        </div>

        {/* Dual Action Buttons */}
        <div className="flex items-center gap-2.5 mt-3.5">
          <button
            type="button"
            onClick={() => onOpenIn3D && onOpenIn3D(car)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-white/35 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Ver en 3D</span>
          </button>

          <button
            type="button"
            disabled={isSaved}
            onClick={() => onSaveToGarage && onSaveToGarage(car)}
            className={`flex-[1.35] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm ${
              isSaved
                ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 cursor-default'
                : 'bg-white text-[#111318] hover:bg-zinc-100 active:scale-[0.98]'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'En tu Garage' : 'Agregar al Garage'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function WeeklyFindsFeed({
  savedIds = new Set(),
  onSaveToGarage,
  onOpenIn3D,
  onOpenScanner,
  onOpenRadar
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [realFinds, setRealFinds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchWeeklyRealFinds()
      .then((items) => {
        if (active) {
          setRealFinds(Array.isArray(items) ? items : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setRealFinds([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const rankedFinds = useMemo(() => {
    const deduped = new Map();
    for (const raw of realFinds) {
      if (!raw) continue;
      const normalized = {
        ...raw,
        model: raw.model || raw.name || 'Modelo',
        imageUrl: raw.imageUrl || raw.imageSilhouette || raw.image || ''
      };
      const key = getCarIdentityKey(normalized) || normalized.id;
      const score = getCarRarityScore(normalized);
      const candidate = { ...normalized, _score: score };
      const prev = deduped.get(key);
      if (!prev || candidate._score > prev._score) {
        deduped.set(key, candidate);
      }
    }
    return [...deduped.values()].sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return new Date(b.spottedAt || 0).getTime() - new Date(a.spottedAt || 0).getTime();
    });
  }, [realFinds]);

  const displayedFinds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedFinds.filter((car) => {
      if (q) {
        const hay = `${car.brand} ${car.model} ${car.year} ${car.spottedBy} ${car.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterTab === 'ultra') {
        return car._score >= 90;
      }
      if (filterTab === 'classics') {
        const yr = parseInt(String(car.year || ''), 10);
        return (Number.isFinite(yr) && yr <= 1995) || car.rarity === 'Histórico' || car.rarity === 'Legendario';
      }
      return true;
    });
  }, [rankedFinds, filterTab, searchQuery]);

  return (
    <div
      className="min-h-full px-3.5 pt-3 pb-6 space-y-4"
      style={{
        backgroundColor: '#f4f5f7',
        backgroundImage:
          'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)',
        backgroundSize: '42px 42px'
      }}
    >
      {/* Editorial Section Header */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-telemetry font-bold uppercase tracking-widest text-[#dc264e]">
              <Flame className="w-3.5 h-3.5" />
              <span>Lo mejor de la semana · Escala 1–100</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111318] tracking-tight leading-none mt-1 uppercase">
              HOT · Hallazgos Reales
            </h2>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white border border-black/[0.07] shadow-xs text-[11px] font-telemetry font-bold text-[#111318] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#dc264e]" />
            <span>{displayedFinds.length}</span>
          </div>
        </div>

        {rankedFinds.length > 0 && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar hallazgo, spotter o lugar..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white border border-black/[0.07] text-xs text-[#111318] placeholder-slate-400 shadow-xs focus:outline-none focus:border-[#dc264e]/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {FILTER_TABS.map((tab) => {
                const active = filterTab === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                      active
                        ? 'bg-[#111318] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-black/[0.07] hover:text-[#111318]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Real Finds Bubble Feed or Honest Empty State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[26px] bg-white h-52 animate-pulse border border-black/[0.06]" />
          ))}
        </div>
      ) : displayedFinds.length === 0 ? (
        <div className="rounded-[26px] bg-white border border-black/[0.07] p-7 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#ffe8ea] text-[#dc264e] flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-base text-[#111318]">
              {rankedFinds.length === 0 ? 'Todavía no hay hallazgos reales esta semana' : 'Sin resultados para tu filtro'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {rankedFinds.length === 0
                ? 'Cuando vos o la comunidad escaneen autos en la calle o publiquen un avistamiento en el Radar, aparecerán acá ordenados del 1 al 100.'
                : 'Probá limpiando la búsqueda o eligiendo Todos los reales.'}
            </p>
          </div>
          {rankedFinds.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-4 py-2.5 rounded-xl bg-[#111318] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Escanear Auto Real</span>
                </button>
              )}
              {onOpenRadar && (
                <button
                  type="button"
                  onClick={onOpenRadar}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#111318] border border-black/[0.08] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 transition active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 text-[#dc264e]" />
                  <span>Reportar en Radar</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedFinds.map((car, index) => (
            <BubbleFindCard
              key={car.id || `${car.brand}-${car.model}-${index}`}
              car={car}
              rank={index + 1}
              isSaved={isCarInSavedSet(car, savedIds)}
              onOpenIn3D={onOpenIn3D}
              onSaveToGarage={onSaveToGarage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
