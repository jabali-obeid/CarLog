import React, { useState, useMemo, useEffect } from 'react';
import { Search, Box, Check, Plus, MapPin, UserCheck, Flame, Sparkles } from 'lucide-react';
import { getCarRarityScore, getScoreTheme } from '../utils/carScore';
import { isCarInSavedSet, getCarIdentityKey } from '../utils/auth';
import { fetchRadarSpots } from '../utils/radarService';

const WEEKLY_SPOTTER_META = {
  'ford-a-baquet-1930': { spottedBy: '@Tomi_Clasicos', location: 'San Isidro · Av. del Libertador', weekTag: 'Hallazgo #1' },
  'porsche-gt3rs': { spottedBy: '@LuchoSpotter', location: 'Puerto Madero · Dique 4', weekTag: 'Top Semana' },
  'car-seed-1': { spottedBy: '@Maranello_BA', location: 'Recoleta · Av. Alvear', weekTag: 'Top Semana' },
  'ferrari-f40': { spottedBy: '@Maranello_BA', location: 'Recoleta · Av. Alvear', weekTag: 'Top Semana' },
  'renault-clio-v6': { spottedBy: '@Fran_RS', location: 'Autódromo Oscar y Juan Gálvez', weekTag: 'Destacado' },
  'bmw-m3-e36': { spottedBy: '@Bimmer_Sur', location: 'Nordelta · Bahía Grande', weekTag: 'Destacado' },
  'honda-civic-type-r': { spottedBy: '@Vtec_ARG', location: 'Palermo · Figueroa Alcorta', weekTag: 'Destacado' },
  'ford-f150-raptor': { spottedBy: '@OffRoad_Pilar', location: 'Panamericana Km 46 · Pilar', weekTag: 'Destacado' },
  'toyota-land-cruiser': { spottedBy: '@Patagonia4x4', location: 'Bariloche · Circuito Chico', weekTag: 'Destacado' },
  'vw-vento-gli': { spottedBy: '@VAG_Meet', location: 'Vicente López · Vial Costero', weekTag: 'Semana' },
  'renault-torino-380w': { spottedBy: '@Ika_Cordoba', location: 'Córdoba · Villa Carlos Paz', weekTag: 'Clásico ARG' },
  'ford-falcon-sprint': { spottedBy: '@Ovalo_BA', location: 'Avellaneda · Av. Mitre', weekTag: 'Clásico ARG' },
  'bmw-2002-turbo': { spottedBy: '@Nico_Bavaria', location: 'Belgrano · Barrancas', weekTag: 'Clásico' }
};

const CURATED_EXTRA_FINDS = [
  {
    id: 'ford-a-baquet-1930',
    brand: 'Ford',
    model: 'A Baquet 1930',
    model3dUrl: '/models/ford_model_a.glb',
    year: '1930',
    rarity: 'Legendario',
    hp: 40,
    zeroToHundred: 24.0,
    topSpeed: 105,
    engine: '3.3L 4 cil. en línea L-Head',
    color: 'Verde Inglés / Aluminio',
    country: 'Argentina / EE.UU.',
    funFact: 'Leyenda absoluta de los Grandes Premios argentinos y las rutas de tierra de los años 30.',
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
    spottedBy: '@Tomi_Clasicos',
    location: 'San Isidro · Av. del Libertador',
    isWeeklyFeatured: true
  }
];

const FALLBACK_SPOTTERS = [
  { spottedBy: '@Santi_BA', location: 'Palermo · Av. del Libertador' },
  { spottedBy: '@Mati_Gálvez', location: 'Villa Devoto · Plaza Arenales' },
  { spottedBy: '@Cami_Spot', location: 'Puerto Madero · Rosario Vera' },
  { spottedBy: '@Juani_ARG', location: 'Rosario · Bv. Oroño' },
  { spottedBy: '@Lucas_Cba', location: 'Córdoba · Nueva Córdoba' },
  { spottedBy: '@Fede_Z4', location: 'San Telmo · Paseo Colón' }
];

const FILTER_TABS = [
  { id: 'weekly', label: 'Top Semana' },
  { id: 'ultra', label: '90–100 pts' },
  { id: 'classics', label: 'Clásicos' },
  { id: 'all', label: 'Todos' }
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
                <span className="truncate">{car.spottedBy}</span>
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
              <span className="truncate">{car.location}</span>
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
          {/* Floating score number above glowing orb */}
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
            <span>{car.hp ? `${car.hp} CV · ${car.country || 'Mundo'}` : car.country || 'Avistamiento'}</span>
            <span>{remainingTo100 === 0 ? 'Máximo histórico (100)' : `A ${remainingTo100} del 100`}</span>
          </div>
        </div>

        {/* Dual Action Buttons matching reference bubble */}
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
  cars = [],
  savedIds = new Set(),
  onSaveToGarage,
  onOpenIn3D,
  loadingCatalog = false
}) {
  const [filterTab, setFilterTab] = useState('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [communitySpots, setCommunitySpots] = useState([]);

  useEffect(() => {
    let active = true;
    fetchRadarSpots()
      .then(({ spots }) => {
        if (active && Array.isArray(spots)) {
          setCommunitySpots(spots);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const rankedFinds = useMemo(() => {
    const mergedMap = new Map();

    const registerCar = (rawCar, isFeatured = false) => {
      if (!rawCar) return;
      const modelName = rawCar.model || rawCar.name || 'Modelo';
      const normalized = {
        ...rawCar,
        model: modelName,
        imageUrl: rawCar.imageUrl || rawCar.imageSilhouette || rawCar.image || ''
      };
      const key = getCarIdentityKey(normalized) || normalized.id;
      const meta = WEEKLY_SPOTTER_META[normalized.id];
      const fallbackIdx = Math.abs(
        key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      ) % FALLBACK_SPOTTERS.length;
      const fallback = FALLBACK_SPOTTERS[fallbackIdx];

      const score = getCarRarityScore(normalized);
      const existing = mergedMap.get(key);
      const candidate = {
        ...normalized,
        spottedBy: normalized.spottedBy || meta?.spottedBy || fallback.spottedBy,
        location: normalized.address || normalized.location || meta?.location || fallback.location,
        isWeeklyFeatured: Boolean(normalized.isWeeklyFeatured || meta || isFeatured),
        _score: score
      };

      if (!existing || candidate._score > existing._score || (!existing.model3dUrl && candidate.model3dUrl)) {
        mergedMap.set(key, candidate);
      }
    };

    CURATED_EXTRA_FINDS.forEach((c) => registerCar(c, true));
    communitySpots.forEach((s) => registerCar(s, true));
    cars.forEach((c) => registerCar(c, Boolean(WEEKLY_SPOTTER_META[c.id])));

    return [...mergedMap.values()].sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return (b.hp || 0) - (a.hp || 0);
    });
  }, [cars, communitySpots]);

  const displayedFinds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedFinds.filter((car) => {
      if (q) {
        const hay = `${car.brand} ${car.model} ${car.year} ${car.spottedBy} ${car.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (filterTab === 'weekly') {
        return car.isWeeklyFeatured || car._score >= 70;
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
      {/* Editorial Weekly Section Header */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-telemetry font-bold uppercase tracking-widest text-[#dc264e]">
              <Flame className="w-3.5 h-3.5" />
              <span>Ranking Semanal · Escala 1–100</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111318] tracking-tight leading-none mt-1 uppercase">
              Hallazgos de la Semana
            </h2>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white border border-black/[0.07] shadow-xs text-[11px] font-telemetry font-bold text-[#111318] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#dc264e]" />
            <span>{displayedFinds.length} autos</span>
          </div>
        </div>

        {/* Search + Filter Pills */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar hallazgo, spotter o barrio..."
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
      </div>

      {/* Bubble Cards Feed */}
      {loadingCatalog && displayedFinds.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[26px] bg-white h-56 animate-pulse border border-black/[0.06]" />
          ))}
        </div>
      ) : displayedFinds.length === 0 ? (
        <div className="rounded-[26px] bg-white border border-black/[0.07] p-8 text-center space-y-2 shadow-sm">
          <p className="font-bold text-sm text-[#111318]">Sin hallazgos para esa búsqueda</p>
          <p className="text-xs text-slate-500">Probá con otro filtro o buscá en Todos.</p>
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
