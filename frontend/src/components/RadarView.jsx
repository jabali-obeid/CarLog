import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Radio,
  MapPin,
  Clock,
  Sparkles,
  Navigation,
  CheckCircle2,
  Lock,
  Crosshair,
  LocateFixed,
  Plus,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { sound } from '../utils/audio';
import { RARITY_CONFIG } from '../utils/demoData';
import { getSupabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { isCarInSavedSet } from '../utils/auth';
import {
  fetchRadarSpots,
  publishRadarSpot,
  simulateNearbySpot,
  requestUserLocation,
  getSavedUserCoords,
  getClaimedSpotIds,
  markSpotClaimed,
  normalizeRadarSpot,
  formatDistance,
  formatRemainingMinutes
} from '../utils/radarService';

const RADIUS_OPTIONS = [
  { id: '500', label: '500 m', meters: 500 },
  { id: '1500', label: '1.5 km', meters: 1500 },
  { id: '5000', label: '5 km', meters: 5000 },
  { id: 'all', label: 'Todos', meters: Infinity }
];

export default function RadarView({ onSpotFound, savedCarIds = new Set() }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [claimedIds, setClaimedIds] = useState(() => getClaimedSpotIds());
  const [userCoords, setUserCoords] = useState(() => getSavedUserCoords());
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(() => (getSavedUserCoords() ? 'active' : 'idle'));
  const [radarToast, setRadarToast] = useState(null);
  const [radiusFilter, setRadiusFilter] = useState('all');
  const [radarSource, setRadarSource] = useState('local');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState({
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    rarity: 'Raro',
    address: ''
  });

  const showToast = useCallback((message, tone = 'info') => {
    setRadarToast({ message, tone });
    setTimeout(() => {
      setRadarToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const loadRadar = useCallback(async (coordsOverride = undefined) => {
    const activeCoords = coordsOverride === undefined ? userCoords : coordsOverride;
    const { spots: nextSpots, source } = await fetchRadarSpots(activeCoords);
    setSpots(nextSpots);
    setRadarSource(source);
    setLoading(false);
  }, [userCoords]);

  // Try silent geolocation once on mount if permissions are already granted
  useEffect(() => {
    let active = true;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (active && perm.state === 'granted') {
            requestUserLocation(5000)
              .then((coords) => {
                if (!active) return;
                setUserCoords(coords);
                setGpsStatus('active');
                loadRadar(coords);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [loadRadar]);

  useEffect(() => {
    loadRadar();

    const supabase = getSupabase();
    let channel = null;
    if (supabase && isSupabaseConfigured()) {
      channel = supabase
        .channel('radar-spots-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radar_spots' }, (payload) => {
          if (payload?.new) {
            const spot = normalizeRadarSpot(payload.new, userCoords);
            setSpots((prev) => [spot, ...prev.filter((s) => s.id !== spot.id)]);
          }
        })
        .subscribe();
    }

    const interval = setInterval(() => loadRadar(), 20000);
    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [loadRadar, userCoords]);

  const handleActivateGps = async () => {
    setGpsLoading(true);
    try {
      const coords = await requestUserLocation(8000);
      setUserCoords(coords);
      setGpsStatus('active');
      await loadRadar(coords);
      sound.playRadarPing();
      showToast(`GPS activado (precisión ±${coords.accuracy}m). Distancias actualizadas.`, 'success');
    } catch (err) {
      setGpsStatus('error');
      showToast(err.message || 'No se pudo activar el GPS.', 'warn');
    } finally {
      setGpsLoading(false);
    }
  };

  const activeRadiusMeters = useMemo(() => {
    const found = RADIUS_OPTIONS.find((r) => r.id === radiusFilter);
    return found ? found.meters : Infinity;
  }, [radiusFilter]);

  const filteredSpots = useMemo(() => {
    const now = Date.now();
    return spots
      .filter((spot) => {
        if (spot.expiresAt && new Date(spot.expiresAt).getTime() <= now) return false;
        if (activeRadiusMeters !== Infinity && Number(spot.distanceMeters) > activeRadiusMeters) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }, [spots, activeRadiusMeters]);

  const isSpotClaimed = (spot) =>
    Boolean(spot) && (claimedIds.has(spot.id) || isCarInSavedSet(spot, savedCarIds));

  const handleClaim = (spot) => {
    sound.playRadarPing();
    sound.playEngineRev();
    const updated = markSpotClaimed(spot.id);
    setClaimedIds(new Set(updated));
    if (onSpotFound) {
      onSpotFound({
        ...spot,
        id: spot.id,
        imageUrl: spot.imageSilhouette
      });
    }
  };

  const handleSimulateAlert = async () => {
    sound.playRadarPing();
    const { spot } = await simulateNearbySpot(userCoords);
    setSpots((prev) => [spot, ...prev.filter((s) => s.id !== spot.id)]);
    setSelectedSpot(spot);
    showToast(`Nueva señal: ${spot.brand} ${spot.model} a ${formatDistance(spot.distanceMeters)}`, 'success');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.brand.trim() || !reportForm.model.trim()) {
      showToast('Completá al menos la marca y el modelo del auto.', 'warn');
      return;
    }
    setReportSubmitting(true);
    try {
      let coords = userCoords;
      if (!coords) {
        try {
          coords = await requestUserLocation(3500);
          setUserCoords(coords);
          setGpsStatus('active');
        } catch {
          coords = null;
        }
      }

      const { spot, mode } = await publishRadarSpot({
        car: {
          brand: reportForm.brand.trim(),
          model: reportForm.model.trim(),
          year: reportForm.year.trim() || String(new Date().getFullYear()),
          rarity: reportForm.rarity
        },
        coords,
        address: reportForm.address.trim() || (coords ? 'Avistamiento GPS en vivo' : 'Zona urbana')
      });

      sound.playRadarPing();
      setSpots((prev) => [spot, ...prev.filter((s) => s.id !== spot.id)]);
      setSelectedSpot(spot);
      setReportOpen(false);
      setReportForm({
        brand: '',
        model: '',
        year: String(new Date().getFullYear()),
        rarity: 'Raro',
        address: ''
      });
      showToast(
        mode === 'cloud'
          ? `Avistamiento publicado en Radar Cloud (${spot.brand} ${spot.model})`
          : `Avistamiento publicado en Radar (${spot.brand} ${spot.model})`,
        'success'
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const scopeMaxMeters = activeRadiusMeters === Infinity ? 1500 : activeRadiusMeters;

  return (
    <div className="space-y-5 animate-fade-in pb-2">
      {/* Toast Feedback */}
      {radarToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-2xl border backdrop-blur-xl max-w-[92vw] text-center animate-fade-in ${
            radarToast.tone === 'warn'
              ? 'bg-[#1a1314]/95 text-amber-200 border-amber-500/40'
              : 'bg-[#0e1518]/95 text-cyan-200 border-cyan-500/40'
          }`}
        >
          {radarToast.message}
        </div>
      )}

      {/* Radar Telemetry Scope Instrument */}
      <div className="relative rounded-3xl cl-card cl-microgrid p-5 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Circular Telemetry Radar Dial */}
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 rounded-full border border-cyan-500/35 bg-[#07090e] flex items-center justify-center overflow-hidden shadow-[inset_0_0_32px_rgba(6,182,212,0.12)] shrink-0">
            <div className="absolute w-44 h-44 rounded-full border border-cyan-500/18" />
            <div className="absolute w-28 h-28 rounded-full border border-cyan-500/22" />
            <div className="absolute w-14 h-14 rounded-full border border-cyan-500/28" />

            <span className="absolute top-2 font-telemetry text-[8px] text-cyan-500/65 uppercase tracking-widest pointer-events-none">
              {formatDistance(scopeMaxMeters)}
            </span>
            <span className="absolute bottom-2 font-telemetry text-[8px] text-cyan-500/55 uppercase tracking-widest pointer-events-none">
              {gpsStatus === 'active' ? 'GPS · NORTE' : 'MODO ZONA'}
            </span>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-cyan-500/15" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-cyan-500/15" />
            </div>

            <div className="absolute inset-0 origin-center animate-radar pointer-events-none">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 to-transparent transform origin-bottom-right rounded-tl-full" />
            </div>

            <div
              className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white ${
                gpsStatus === 'active'
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                  : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
              }`}
              title={gpsStatus === 'active' ? 'Tu ubicación GPS' : 'Centro de zona'}
            />

            {/* Spotted Car Blips */}
            {filteredSpots.slice(0, 10).map((spot, idx) => {
              const fallbackAngles = [42, 132, 224, 308, 178, 86, 268, 14, 195, 340];
              const bearing = Number.isFinite(spot.bearingDeg)
                ? spot.bearingDeg
                : fallbackAngles[idx % fallbackAngles.length];
              // Convert compass bearing (0 deg = North/up) to screen coordinates
              const rad = ((bearing - 90) * Math.PI) / 180;
              const dist = 24 + Math.min(1, (spot.distanceMeters || 600) / scopeMaxMeters) * 72;
              const x = Math.cos(rad) * dist;
              const y = Math.sin(rad) * dist;
              const claimed = isSpotClaimed(spot);
              const isSelected = selectedSpot?.id === spot.id;

              return (
                <button
                  type="button"
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  title={`${spot.brand} ${spot.model} (${formatDistance(spot.distanceMeters)})`}
                  aria-label={`Objetivo ${spot.brand} ${spot.model} a ${formatDistance(spot.distanceMeters)}`}
                  className={`absolute w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-150 focus:outline-none z-20 border border-white ${
                    isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#07090e] scale-125' : ''
                  } ${
                    claimed
                      ? 'bg-emerald-400'
                      : spot.rarity === 'Legendario'
                      ? 'bg-amber-400'
                      : spot.rarity === 'Histórico'
                      ? 'bg-orange-500'
                      : 'bg-cyan-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Radar Telemetry Summary & Controls */}
          <div className="flex-1 space-y-3 text-center md:text-left w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-telemetry font-bold uppercase tracking-widest">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{radarSource === 'cloud' ? 'Red Cloud En Vivo' : 'Radar Local Activo'}</span>
              </div>

              <button
                type="button"
                onClick={handleActivateGps}
                disabled={gpsLoading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-telemetry font-bold uppercase transition active:scale-95 ${
                  gpsStatus === 'active'
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-white/[0.05] border-white/15 text-zinc-300 hover:text-white hover:border-cyan-400/40'
                }`}
              >
                <LocateFixed className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>
                  {gpsLoading
                    ? 'Buscando GPS...'
                    : gpsStatus === 'active'
                    ? 'GPS Activo · Actualizar'
                    : 'Activar GPS Real'}
                </span>
              </button>
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold text-white uppercase tracking-tight leading-none">
                Radar de Caza Callejera
              </h2>
              <p className="text-xs text-[var(--cl-text-secondary)] leading-relaxed max-w-md mt-2 mx-auto md:mx-0">
                Detecta vehículos reportados cerca tuyo, consultá su distancia real y reclamalos para sumarlos a tu flota.
              </p>
            </div>

            {selectedSpot && (
              <div className="p-2.5 rounded-xl cl-panel flex items-center justify-between gap-2 text-left animate-fade-in">
                <div className="min-w-0">
                  <div className="text-[9px] font-telemetry text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3" /> OBJETIVO FIJADO · {formatRemainingMinutes(selectedSpot.expiresAt)}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {selectedSpot.brand} {selectedSpot.model} ·{' '}
                    <span className="font-telemetry text-cyan-300">{formatDistance(selectedSpot.distanceMeters)}</span>
                  </div>
                </div>
                {!isSpotClaimed(selectedSpot) ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(selectedSpot)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-[#08090c] font-bold text-[10px] shrink-0 active:scale-95 transition"
                  >
                    Reclamar
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-telemetry text-[10px] shrink-0">
                    Reclamado
                  </span>
                )}
              </div>
            )}

            {/* Action Controls */}
            <div className="pt-1 flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => setReportOpen((v) => !v)}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06090e] text-xs font-bold transition flex items-center gap-1.5 active:scale-[0.98]"
              >
                {reportOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{reportOpen ? 'Cerrar Reporte' : 'Reportar Auto Visto'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateAlert}
                className="min-h-[38px] px-3.5 py-2 rounded-xl cl-pill hover:bg-[#232838] text-cyan-300 border-cyan-500/35 text-xs font-bold transition flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simular Alerta</span>
              </button>

              <button
                type="button"
                onClick={() => loadRadar()}
                className="min-h-[38px] px-3 py-2 rounded-xl cl-panel hover:bg-white/[0.08] text-zinc-300 text-xs font-semibold transition flex items-center gap-1.5 active:scale-[0.98]"
                title="Actualizar radar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Report Sighting Form */}
        {reportOpen && (
          <form
            onSubmit={handleReportSubmit}
            className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 animate-fade-in"
          >
            <input
              type="text"
              value={reportForm.brand}
              onChange={(e) => setReportForm((p) => ({ ...p, brand: e.target.value }))}
              placeholder="Marca (ej: Subaru)"
              className="px-3 py-2 rounded-xl bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              required
            />
            <input
              type="text"
              value={reportForm.model}
              onChange={(e) => setReportForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="Modelo (ej: Impreza WRX)"
              className="px-3 py-2 rounded-xl bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              required
            />
            <select
              value={reportForm.rarity}
              onChange={(e) => setReportForm((p) => ({ ...p, rarity: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-[#07090e] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Común">Común</option>
              <option value="Raro">Raro</option>
              <option value="Histórico">Histórico</option>
              <option value="Legendario">Legendario</option>
            </select>
            <input
              type="text"
              value={reportForm.address}
              onChange={(e) => setReportForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Calle / Zona (opcional)"
              className="px-3 py-2 rounded-xl bg-[#07090e] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={reportSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04120b] font-bold text-xs transition active:scale-95 disabled:opacity-60"
            >
              {reportSubmitting ? 'Publicando...' : 'Transmitir Señal'}
            </button>
          </form>
        )}
      </div>

      {/* Nearby Active Spots Feed */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
              Avistamientos en Zona
            </h3>
            <span className="text-[11px] text-[var(--cl-text-secondary)] font-telemetry uppercase">
              ({String(filteredSpots.length).padStart(2, '0')})
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setRadiusFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-telemetry font-bold uppercase transition ${
                  radiusFilter === opt.id
                    ? 'bg-cyan-500 text-[#06090e]'
                    : 'cl-panel text-zinc-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl cl-card overflow-hidden animate-pulse">
                <div className="h-40 bg-white/[0.04]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                  <div className="h-9 w-full bg-white/[0.06] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSpots.length === 0 ? (
          <div className="py-12 px-5 text-center rounded-3xl cl-card space-y-3">
            <Radio className="w-7 h-7 text-cyan-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-display text-xl font-bold uppercase text-white">Sin señales en este radio</h4>
              <p className="text-xs text-[var(--cl-text-secondary)] max-w-xs mx-auto">
                Amplia el filtro de distancia, reportá un auto que hayas visto o simulá una alerta cercana.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpots.map((spot) => {
              const claimed = isSpotClaimed(spot);
              const isSelected = selectedSpot?.id === spot.id;
              const rarityCfg = RARITY_CONFIG[spot.rarity] || RARITY_CONFIG['Común'];
              const hasCoords = Number.isFinite(spot.lat) && Number.isFinite(spot.lng);

              return (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className={`rounded-2xl cl-card overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    claimed
                      ? 'border-emerald-500/45'
                      : isSelected
                      ? 'border-cyan-400/60 ring-1 ring-cyan-400/30'
                      : 'hover:border-white/25'
                  }`}
                >
                  {/* Silhouette / Photo */}
                  <div className="relative h-44 bg-[#06080c] overflow-hidden flex items-center justify-center">
                    <img
                      src={spot.imageSilhouette}
                      alt={spot.model}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        claimed
                          ? 'grayscale-0 filter-none scale-100'
                          : 'grayscale contrast-125 brightness-[0.42] blur-[1.5px]'
                      }`}
                    />

                    {!claimed ? (
                      <div className="absolute inset-0 bg-[#07090e]/45 backdrop-blur-[1.5px] flex flex-col items-center justify-center text-center p-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#0b0e15]/85 border border-white/15 flex items-center justify-center mb-1.5 text-amber-400 shadow-lg">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-telemetry font-bold tracking-widest text-zinc-100 uppercase">
                          Silueta Bloqueada
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-0.5">
                          Reclámalo para revelar y guardar
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[#05110b] text-[10px] font-telemetry font-bold uppercase flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Descubierto
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-telemetry uppercase px-2 py-0.5 rounded-md ${rarityCfg.bgBadge}`}>
                        {spot.rarity}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#090b10]/88 backdrop-blur-md text-[10px] font-telemetry font-semibold text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      <span>{formatDistance(spot.distanceMeters)}</span>
                    </div>

                    {hasCoords && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#090b10]/88 hover:bg-cyan-500 hover:text-[#06090e] backdrop-blur-md text-[10px] font-telemetry font-semibold text-zinc-200 border border-white/15 flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Mapa</span>
                      </a>
                    )}
                  </div>

                  {/* Spot Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-display text-xl font-extrabold uppercase text-white tracking-tight truncate">
                          {spot.brand} <span className="text-zinc-400 font-bold">{spot.model}</span>
                        </h4>
                        <span className="text-[11px] font-telemetry text-zinc-400 shrink-0">{spot.year}</span>
                      </div>

                      <p className="text-xs text-[var(--cl-text-secondary)] mt-1 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{spot.address || 'Zona Urbana'}</span>
                      </p>

                      {(spot.hp > 0 || spot.topSpeed > 0 || spot.zeroToHundred > 0) && (
                        <div className="grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl cl-panel mt-3 py-1.5 text-center font-telemetry">
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">CV</span>
                            <span className="text-[11px] font-bold text-zinc-200">{spot.hp || '—'}</span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">0–100</span>
                            <span className="text-[11px] font-bold text-zinc-200">
                              {spot.zeroToHundred ? `${spot.zeroToHundred}s` : '—'}
                            </span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">KM/H</span>
                            <span className="text-[11px] font-bold text-zinc-200">{spot.topSpeed || '—'}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-zinc-400 border-t border-white/[0.06] pt-2.5 font-telemetry">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Clock className="w-3 h-3" /> {formatRemainingMinutes(spot.expiresAt)}
                        </span>
                        <span className="truncate text-zinc-500">{spot.spottedBy || 'Spotter'}</span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div>
                      {claimed ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCarInSavedSet(spot, savedCarIds) ? 'En tu Garage' : 'Reclamado'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(spot);
                          }}
                          className="w-full min-h-[40px] py-2.5 px-4 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-[#08090c] shadow-[0_8px_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transition active:scale-[0.98]"
                        >
                          <Crosshair className="w-4 h-4 text-red-600" />
                          <span>Identificar y Reclamar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
