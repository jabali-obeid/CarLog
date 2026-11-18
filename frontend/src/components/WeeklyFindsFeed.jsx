import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Check, Flame, Camera, Radio, Crown, Trophy, RefreshCw } from './CarLogIcons';
import { getCarRarityScore, getScoreTheme } from '../utils/carScore';
import { isCarInSavedSet, getCarIdentityKey, normalizeCarToken } from '../utils/auth';
import { fetchWeeklyRealFinds } from '../utils/radarService';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const FILTER_TABS = [
  { id: 'all', label: 'Todos los reales' },
  { id: 'ultra', label: '90–100 pts' },
  { id: 'classics', label: 'Clásicos' }
];

function isHttpUrl(url = '') {
  return /^https?:\/\//i.test(String(url || '').trim());
}

function pickPreferredImage(aUrl = '', bUrl = '') {
  if (isHttpUrl(aUrl)) return aUrl;
  if (isHttpUrl(bUrl)) return bUrl;
  return aUrl || bUrl || '';
}

function pickRicherLocation(aLoc = '', bLoc = '') {
  const generic = new Set(['', 'calle', 'tu garage', 'ubicacion en calle', 'ubicación en calle', 'escaneo en calle']);
  const aNorm = normalizeCarToken(aLoc);
  const bNorm = normalizeCarToken(bLoc);
  if (aLoc && !generic.has(aNorm)) return aLoc;
  if (bLoc && !generic.has(bNorm)) return bLoc;
  return aLoc || bLoc || 'Calle';
}

function mergeCarRecords(prev, next) {
  const newerTime = Math.max(
    new Date(prev.spottedAt || 0).getTime() || 0,
    new Date(next.spottedAt || 0).getTime() || 0
  );
  const primary = next._score > prev._score ? next : prev;
  const secondary = primary === next ? prev : next;

  return {
    ...secondary,
    ...primary,
    imageUrl: pickPreferredImage(primary.imageUrl, secondary.imageUrl),
    cutoutImage: primary.cutoutImage || secondary.cutoutImage || '',
    location: pickRicherLocation(primary.location, secondary.location),
    hp: Math.max(Number(primary.hp) || 0, Number(secondary.hp) || 0),
    topSpeed: Math.max(Number(primary.topSpeed) || 0, Number(secondary.topSpeed) || 0),
    zeroToHundred: Number(primary.zeroToHundred) || Number(secondary.zeroToHundred) || 0,
    engine: primary.engine || secondary.engine || '',
    country: primary.country || secondary.country || '',
    funFact: primary.funFact || secondary.funFact || '',
    model3dUrl: primary.model3dUrl || secondary.model3dUrl || '',
    _score: Math.max(prev._score, next._score),
    spottedAt: newerTime > 0 ? new Date(newerTime).toISOString() : primary.spottedAt
  };
}

const PodiumLeaderCard = React.memo(function PodiumLeaderCard({ car, isSaved, onOpenIn3D }) {
  const [imgFailed, setImgFailed] = useState(false);
  const modelName = car.model || car.name || 'Modelo';
  const score = car._score;
  const theme = getScoreTheme(score);
  const thumbSrc = !imgFailed ? (car.cutoutImage || car.imageUrl || car.image) : '';

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenIn3D && onOpenIn3D(car)}
        aria-label={`Puesto 1 semanal: ${car.brand} ${modelName}, por ${car.spottedBy || 'Spotter'}, puntaje ${score}`}
        className="w-full text-left rounded-[24px] bg-pit text-white border border-black/15 shadow-[0_18px_36px_-14px_rgba(15,23,42,0.45)] p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-racing focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-racing text-white text-[10px] font-telemetry font-bold uppercase tracking-wider">
            <Crown className="w-3 h-3" />
            <span>#1 Líder semanal</span>
          </span>

          <div className="flex items-center gap-1.5">
            {isSaved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold">
                <Check className="w-2.5 h-2.5" />
                <span>Tuyo</span>
              </span>
            )}
            <span className="text-[10px] font-telemetry font-semibold text-pit-muted uppercase tracking-wider">
              {car.rarity || theme.tierLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-2xl bg-pit-surface border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={`${car.brand} ${modelName}`}
                loading="eager"
                onError={() => setImgFailed(true)}
                className={`w-full h-full ${car.cutoutImage ? 'object-contain p-1.5' : 'object-cover'}`}
              />
            ) : (
              <span className="font-ethnocentric text-sm text-white uppercase">
                {(car.brand || 'CL').slice(0, 3)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-pit-muted truncate">
              <span>{car.spottedBy || 'Spotter'}</span>
              <span aria-hidden="true"> · </span>
              <span>{car.location || 'Calle'}</span>
            </div>

            <h4 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight leading-tight truncate mt-0.5">
              {car.brand} {modelName}
            </h4>

            <div className="flex items-center gap-2 mt-1 text-[11px] font-telemetry text-pit-muted">
              {car.year && <span>{car.year}</span>}
              {car.hp > 0 && (
                <>
                  {car.year && <span aria-hidden="true">·</span>}
                  <span>{car.hp} CV</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end justify-center shrink-0 pl-1">
            <span className="text-[9px] font-telemetry uppercase tracking-widest text-pit-muted">
              PTS
            </span>
            <span className="font-ethnocentric text-3xl sm:text-4xl leading-none tracking-tight text-white mt-0.5">
              {score}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
});

const PodiumRunnerUpCard = React.memo(function PodiumRunnerUpCard({ car, rank, isSaved, onOpenIn3D }) {
  const [imgFailed, setImgFailed] = useState(false);
  const modelName = car.model || car.name || 'Modelo';
  const score = car._score;
  const theme = getScoreTheme(score);
  const thumbSrc = !imgFailed ? (car.cutoutImage || car.imageUrl || car.image) : '';

  const badgeStyle =
    rank === 2
      ? 'bg-recessed text-ink border border-black/10'
      : 'bg-amber-50 text-amber-ink border border-amber-300';

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenIn3D && onOpenIn3D(car)}
        aria-label={`Puesto ${rank} semanal: ${car.brand} ${modelName}, por ${car.spottedBy || 'Spotter'}, puntaje ${score}`}
        className="w-full h-full text-left rounded-[22px] bg-surface border border-black/[0.08] shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)] p-3 flex flex-col justify-between gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/60"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-telemetry font-bold uppercase ${badgeStyle}`}>
            <Trophy className="w-2.5 h-2.5" />
            <span>#{rank}</span>
          </span>

          <span
            className={`font-ethnocentric text-xl leading-none tracking-tight ${
              score >= 90 ? 'text-racing-ink' : 'text-ink'
            }`}
          >
            {score}
          </span>
        </div>

        <div className="w-full h-24 rounded-xl bg-recessed border border-black/[0.06] overflow-hidden flex items-center justify-center">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={`${car.brand} ${modelName}`}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className={`w-full h-full ${car.cutoutImage ? 'object-contain p-1.5' : 'object-cover'}`}
            />
          ) : (
            <span className="font-ethnocentric text-xs text-racing-ink uppercase">
              {(car.brand || 'CL').slice(0, 3)}
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-0.5">
          <h4 className="font-display font-bold text-sm text-ink tracking-tight leading-snug truncate">
            {car.brand} {modelName}
          </h4>
          <div className="text-[11px] font-medium text-ink-muted truncate">
            {car.spottedBy || 'Spotter'}
          </div>
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <span className="text-[11px] font-semibold text-racing-ink truncate">
              {car.rarity || theme.tierLabel}
            </span>
            {isSaved && (
              <span className="px-1.5 py-0.5 rounded-full bg-racing text-white text-[9px] font-semibold shrink-0">
                Tuyo
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
});

const BubbleFindCard = React.memo(function BubbleFindCard({ car, rank, isSaved, onOpenIn3D }) {
  const [imgFailed, setImgFailed] = useState(false);
  const modelName = car.model || car.name || 'Modelo';
  const score = car._score;
  const theme = getScoreTheme(score);
  const thumbSrc = !imgFailed ? (car.cutoutImage || car.imageUrl || car.image) : '';

  return (
    <li className="cl-list-item">
      <button
        type="button"
        aria-label={`Puesto ${rank}: Ver ${car.brand} ${modelName} en 3D, por ${car.spottedBy || 'Spotter'}, puntaje ${score}`}
        onClick={() => onOpenIn3D && onOpenIn3D(car)}
        className="w-full text-left rounded-[22px] bg-surface border border-black/[0.08] shadow-[0_14px_30px_-14px_rgba(15,23,42,0.14)] p-3.5 sm:p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/50"
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

            <h4 className="font-display font-bold text-[15px] sm:text-[17px] text-ink tracking-tight leading-snug truncate mt-0.5">
              {car.brand} {modelName} {car.year ? car.year : ''}
            </h4>

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
      </button>
    </li>
  );
});

export default function WeeklyFindsFeed({
  savedIds = new Set(),
  garage = [],
  currentUser = null,
  onOpenIn3D,
  onOpenScanner,
  onOpenRadar
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [realFinds, setRealFinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekCutoffMs, setWeekCutoffMs] = useState(() => Date.now() - WEEK_MS);

  const loadFinds = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    setWeekCutoffMs(Date.now() - WEEK_MS);
    return fetchWeeklyRealFinds()
      .then((items) => {
        setRealFinds(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        // Keep current list on transient network error
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    let active = true;
    const run = () => {
      if (active) loadFinds(false);
    };
    run();
    const intervalId = setInterval(() => {
      if (active && !document.hidden) {
        loadFinds(false);
      }
    }, 30000);
    window.addEventListener('focus', run);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', run);
    };
  }, [loadFinds]);

  const rankedFinds = useMemo(() => {
    const recentGarageFallback = (Array.isArray(garage) ? garage : [])
      .filter((car) => {
        if (!car || car.userCaptured === false) return false;
        const id = String(car.id || '');
        if (id.startsWith('car-seed-') || id.startsWith('sim-')) return false;
        const t = new Date(car.capturedAt || car.spottedAt || 0).getTime();
        return Number.isFinite(t) && t >= weekCutoffMs;
      })
      .map((car) => ({
        ...car,
        spottedBy: car.spottedBy || currentUser?.username || 'Spotter',
        userId: car.userId || currentUser?.id || '',
        location: car.location || car.address || car.country || 'Tu Garage',
        spottedAt: car.capturedAt || car.spottedAt
      }));

    const deduped = new Map();
    for (const raw of [...realFinds, ...recentGarageFallback]) {
      if (!raw) continue;
      const normalized = {
        ...raw,
        model: raw.model || raw.name || 'Modelo',
        imageUrl: raw.imageUrl || raw.imageSilhouette || raw.image || '',
        spottedBy: raw.spottedBy || 'Spotter'
      };
      const carKey = getCarIdentityKey(normalized) || String(normalized.id || '');
      const spotterKey = normalizeCarToken(normalized.spottedBy || 'spotter') || 'spotter';
      const dedupeKey = `${spotterKey}::${carKey}`;
      const score = getCarRarityScore(normalized);
      const candidate = { ...normalized, _score: score };
      const prev = deduped.get(dedupeKey);
      deduped.set(dedupeKey, prev ? mergeCarRecords(prev, candidate) : candidate);
    }

    return [...deduped.values()].sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      const hpDiff = (Number(b.hp) || 0) - (Number(a.hp) || 0);
      if (hpDiff !== 0) return hpDiff;
      return new Date(b.spottedAt || 0).getTime() - new Date(a.spottedAt || 0).getTime();
    });
  }, [realFinds, garage, currentUser, weekCutoffMs]);

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

  const topThree = displayedFinds.slice(0, 3);
  const restFinds = displayedFinds.slice(3);
  const isFiltered = filterTab !== 'all' || Boolean(searchQuery.trim());

  return (
    <div className="min-h-full bg-canvas px-3.5 pt-3 pb-6 space-y-4">
      {/* Editorial Section Header */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-telemetry font-bold uppercase tracking-widest text-racing-ink">
              Lo mejor de la semana · Escala 1–100
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-none mt-1 uppercase">
              HOT · Hallazgos Reales
            </h2>
            <p className="text-xs text-ink-secondary mt-1">
              Top semanal de toda la comunidad ordenado por puntaje.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => loadFinds(true)}
              disabled={refreshing}
              aria-label="Actualizar hallazgos"
              title="Actualizar hallazgos"
              className="min-h-[36px] min-w-[36px] rounded-full bg-surface border border-black/[0.08] shadow-xs text-ink-secondary hover:text-racing-ink flex items-center justify-center transition active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-2.5 py-1.5 rounded-full bg-surface border border-black/[0.08] shadow-xs text-[11px] font-telemetry font-bold text-ink">
              <span>{displayedFinds.length}</span>
            </div>
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

      {/* Real Finds Podium + Ranked Feed or Honest Empty State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[26px] bg-surface h-44 animate-pulse border border-black/[0.06]" />
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
        <div className="space-y-5">
          {/* Top 3 Semanal Podium */}
          <section aria-labelledby="hot-top3-heading" className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 id="hot-top3-heading" className="font-display text-sm font-extrabold uppercase tracking-wide text-ink">
                {isFiltered ? 'Podio del filtro' : 'Top 3 Semanal'}
              </h3>
              <span className="text-[10px] font-telemetry font-semibold uppercase tracking-wider text-ink-muted">
                Por puntaje
              </span>
            </div>

            <ol role="list" className="space-y-2.5 list-none p-0 m-0">
              {topThree[0] && (
                <PodiumLeaderCard
                  key={topThree[0].id}
                  car={topThree[0]}
                  isSaved={isCarInSavedSet(topThree[0], savedIds)}
                  onOpenIn3D={onOpenIn3D}
                />
              )}

              {topThree.length > 1 && (
                <li className="list-none">
                  <ol
                    role="list"
                    className={`grid gap-2.5 list-none p-0 m-0 ${
                      topThree.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {topThree.slice(1).map((car, idx) => (
                      <PodiumRunnerUpCard
                        key={car.id}
                        car={car}
                        rank={idx + 2}
                        isSaved={isCarInSavedSet(car, savedIds)}
                        onOpenIn3D={onOpenIn3D}
                      />
                    ))}
                  </ol>
                </li>
              )}
            </ol>
          </section>

          {/* #4+ Remaining Weekly Ranking */}
          {restFinds.length > 0 && (
            <section aria-labelledby="hot-rest-heading" className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h3 id="hot-rest-heading" className="font-display text-sm font-extrabold uppercase tracking-wide text-ink">
                  Resto del ranking semanal
                </h3>
                <span className="text-[10px] font-telemetry font-semibold uppercase tracking-wider text-ink-muted">
                  #{4}–#{displayedFinds.length}
                </span>
              </div>

              <ol role="list" start={4} className="space-y-3 list-none p-0 m-0">
                {restFinds.map((car, idx) => (
                  <BubbleFindCard
                    key={car.id || `${car.brand}-${car.model}-${idx + 4}`}
                    car={car}
                    rank={idx + 4}
                    isSaved={isCarInSavedSet(car, savedIds)}
                    onOpenIn3D={onOpenIn3D}
                  />
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
