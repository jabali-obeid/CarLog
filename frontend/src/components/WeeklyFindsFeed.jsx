import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, Flame, Camera, Radio } from './CarLogIcons';
import { getCarRarityScore, getScoreTheme } from '../utils/carScore';
import { isCarInSavedSet, getCarIdentityKey } from '../utils/auth';
import { fetchWeeklyRealFinds } from '../utils/radarService';

const FILTER_TABS = [
  { id: 'all', label: 'Todos los reales' },
  { id: 'ultra', label: '90–100 pts' },
  { id: 'classics', label: 'Clásicos' }
];

const BubbleFindCard = React.memo(function BubbleFindCard({ car, rank, isSaved, onOpenIn3D }) {
  const [imgFailed, setImgFailed] = useState(false);
  const modelName = car.model || car.name || 'Modelo';
  const score = car._score;
  const theme = getScoreTheme(score);
  const thumbSrc = !imgFailed ? (car.cutoutImage || car.imageUrl || car.image) : '';

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver ${car.brand} ${modelName} en 3D, puntaje ${score}`}
      onClick={() => onOpenIn3D && onOpenIn3D(car)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onOpenIn3D) onOpenIn3D(car);
        }
      }}
      className="cl-list-item rounded-[22px] bg-surface border border-black/[0.08] shadow-[0_14px_30px_-14px_rgba(15,23,42,0.16)] p-3.5 sm:p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/50"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Square Rounded Car Photo */}
        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-recessed border border-black/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={`${car.brand} ${modelName}`}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className={`w-full h-full ${car.cutoutImage ? 'object-contain p-1' : 'object-cover'}`}
            />
          ) : (
            <span className="font-ethnocentric text-xs text-racing-ink uppercase">
              {(car.brand || 'CL').slice(0, 3)}
            </span>
          )}
        </div>

        {/* Middle: Spotter + Location, Title, Rarity */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5 truncate">
            <span className="truncate">{car.spottedBy || 'Spotter'}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{car.location || 'Calle'}</span>
          </div>

          <h3 className="font-display font-bold text-[15px] sm:text-[17px] text-ink tracking-tight leading-snug truncate mt-0.5">
            {car.brand} {modelName} {car.year ? car.year : ''}
          </h3>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] font-semibold text-racing-ink truncate">
              {car.rarity || theme.tierLabel}
            </span>
            {car.hp > 0 && (
              <span className="text-[10px] font-telemetry text-ink-muted shrink-0">
                {car.hp} CV
              </span>
            )}
          </div>
        </div>

        {/* Right: Soft Pill + Large Ethnocentric Score Number */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide inline-flex items-center gap-1 ${
              isSaved
                ? 'bg-racing text-white'
                : 'bg-racing-soft text-racing-ink'
            }`}
          >
            {isSaved ? <Check className="w-2.5 h-2.5" /> : null}
            <span>{isSaved ? 'Tuyo' : `#${rank}`}</span>
          </span>

          <div className="flex items-baseline gap-1 mt-2">
            <span
              className={`font-ethnocentric text-2xl sm:text-[28px] leading-none tracking-tight ${
                score >= 90 ? 'text-racing-ink' : 'text-ink'
              }`}
              title={`Índice de rareza ${score}/100`}
            >
              {score}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});

export default function WeeklyFindsFeed({
  savedIds = new Set(),
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
    const loadFinds = () => {
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
    };

    loadFinds();
    const intervalId = setInterval(loadFinds, 20000);
    const onFocus = () => loadFinds();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
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
    <div className="min-h-full bg-canvas px-3.5 pt-3 pb-6 space-y-4">
      {/* Editorial Section Header */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-telemetry font-bold uppercase tracking-widest text-racing-ink">
              Lo mejor de la semana · Escala 1–100
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-none mt-1 uppercase">
              HOT · Hallazgos Reales
            </h2>
            <p className="text-xs text-ink-secondary mt-1">
              Ranking semanal de autos reales escaneados por la comunidad.
            </p>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-surface border border-black/[0.08] shadow-xs text-[11px] font-telemetry font-bold text-ink shrink-0">
            <span>{displayedFinds.length}</span>
          </div>
        </div>

        {rankedFinds.length > 0 && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Buscar hallazgo, spotter o lugar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar hallazgo, spotter o lugar..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-surface border border-black/[0.09] text-xs text-ink placeholder-ink-muted shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing/60"
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
                        ? 'bg-ink text-white shadow-sm'
                        : 'bg-surface text-ink-secondary border border-black/[0.09] hover:text-ink'
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
            <div key={i} className="rounded-[26px] bg-surface h-52 animate-pulse border border-black/[0.06]" />
          ))}
        </div>
      ) : displayedFinds.length === 0 ? (
        <div className="rounded-[26px] bg-surface border border-black/[0.08] p-7 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-racing-soft text-racing-ink flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-ink">
              {rankedFinds.length === 0 ? 'Todavía no hay hallazgos reales esta semana' : 'Sin resultados para tu filtro'}
            </h3>
            <p className="text-xs text-ink-secondary max-w-xs mx-auto leading-relaxed">
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
                  className="px-4 py-2.5 rounded-xl bg-ink text-white text-xs font-bold flex items-center gap-1.5 hover:bg-pit-surface transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Escanear Auto Real</span>
                </button>
              )}
              {onOpenRadar && (
                <button
                  type="button"
                  onClick={onOpenRadar}
                  className="px-4 py-2.5 rounded-xl bg-recessed text-ink border border-black/[0.1] text-xs font-semibold flex items-center gap-1.5 hover:bg-black/[0.06] transition active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 text-racing-ink" />
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
