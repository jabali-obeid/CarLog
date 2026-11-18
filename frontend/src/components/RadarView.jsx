import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Radio,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Lock,
  Camera,
  LocateFixed,
  Plus,
  ExternalLink,
  RefreshCw,
  X
} from './CarLogIcons';
import { sound } from '../utils/audio';
import { RARITY_CONFIG } from '../utils/demoData';
import { getSupabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { isCarInSavedSet } from '../utils/auth';
import {
  fetchRadarSpots,
  publishRadarSpot,
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

  const handleGoScanSpot = (spot) => {
    sound.playRadarPing();
    const updated = markSpotClaimed(spot.id);
    setClaimedIds(new Set(updated));
    if (onSpotFound) {
      onSpotFound(spot);
    }
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
        address: reportForm.address.trim() || (coords ? 'Avistamiento GPS en vivo' : 'Avistamiento en calle')
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
    <div className="space-y-5 animate-fade-in pb-2 text-[#111318]">
      {/* Toast Feedback */}
      {radarToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-2xl bg-white text-[#111318] font-semibold text-xs shadow-xl border border-red-200 max-w-[92vw] text-center animate-fade-in"
        >
          {radarToast.message}
        </div>
      )}

      {/* White & Red Radar Telemetry Scope Instrument */}
      <div className="relative rounded-3xl cl-card p-5 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Circular Crisp White/Red Radar Dial */}
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 rounded-full border-2 border-red-500/30 bg-surface flex items-center justify-center overflow-hidden shadow-[inset_0_0_28px_rgba(220,38,38,0.08)] shrink-0">
            <div className="absolute w-44 h-44 rounded-full border border-red-500/20" />
            <div className="absolute w-28 h-28 rounded-full border border-red-500/25" />
            <div className="absolute w-14 h-14 rounded-full border border-red-500/30" />

            <span className="absolute top-2 font-telemetry text-[8px] text-racing-ink font-bold uppercase tracking-widest pointer-events-none">
              {formatDistance(scopeMaxMeters)}
            </span>
            <span className="absolute bottom-2 font-telemetry text-[8px] text-ink-muted uppercase tracking-widest pointer-events-none">
              {gpsStatus === 'active' ? 'GPS · NORTE' : 'MODO ZONA'}
            </span>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-red-500/15" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-red-500/15" />
            </div>

            <div className="absolute inset-0 origin-center animate-radar pointer-events-none">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-red-500/25 to-transparent transform origin-bottom-right rounded-tl-full" />
            </div>

            <div
              className="relative z-10 w-3.5 h-3.5 rounded-full border-2 border-white bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
              title={gpsStatus === 'active' ? 'Tu ubicación GPS' : 'Centro de zona'}
            />

            {/* Spotted Car Blips */}
            {filteredSpots.slice(0, 10).map((spot, idx) => {
              const fallbackAngles = [42, 132, 224, 308, 178, 86, 268, 14, 195, 340];
              const bearing = Number.isFinite(spot.bearingDeg)
                ? spot.bearingDeg
                : fallbackAngles[idx % fallbackAngles.length];
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
                  className="absolute w-10 h-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 rounded-full z-20"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                      isSelected ? 'ring-2 ring-red-600 scale-125' : ''
                    } ${claimed ? 'bg-slate-400' : 'bg-red-600'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Radar Telemetry Summary & Controls */}
          <div className="flex-1 space-y-3 text-center md:text-left w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-telemetry font-bold uppercase tracking-widest">
                <Radio className="w-3 h-3 text-red-600 animate-pulse" />
                <span>{radarSource === 'cloud' ? 'Red Cloud En Vivo' : 'Radar Local Activo'}</span>
              </div>

              <button
                type="button"
                onClick={handleActivateGps}
                disabled={gpsLoading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-telemetry font-bold uppercase transition active:scale-95 ${
                  gpsStatus === 'active'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-black/[0.1] text-slate-700 hover:text-red-600 hover:border-red-300'
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
              <h2 className="font-display text-3xl font-extrabold text-ink uppercase tracking-tight leading-none">
                Radar de Caza Callejera
              </h2>
              <p className="text-xs text-ink-secondary leading-relaxed max-w-md mt-2 mx-auto md:mx-0">
                Consultá avistamientos reales reportados en la calle, acercate con el mapa y escanealos en vivo para sumarlos a tu flota.
              </p>
            </div>

            {selectedSpot && (
              <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 flex items-center justify-between gap-2 text-left animate-fade-in">
                <div className="min-w-0">
                  <div className="text-[9px] font-telemetry text-red-600 uppercase font-bold tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> OBJETIVO FIJADO · {formatRemainingMinutes(selectedSpot.expiresAt)}
                  </div>
                  <div className="text-xs font-bold text-[#111318] truncate">
                    {selectedSpot.brand} {selectedSpot.model} ·{' '}
                    <span className="font-telemetry text-red-600">{formatDistance(selectedSpot.distanceMeters)}</span>
                  </div>
                </div>
                {!isCarInSavedSet(selectedSpot, savedCarIds) ? (
                  <button
                    type="button"
                    onClick={() => handleGoScanSpot(selectedSpot)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[10px] shrink-0 active:scale-95 transition"
                  >
                    Ir a Escanear
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-lg bg-white border border-red-200 text-red-700 font-telemetry text-[10px] font-bold shrink-0">
                    En Garage
                  </span>
                )}
              </div>
            )}

            {/* Action Controls (Real Reports Only — Zero Simulations) */}
            <div className="pt-1 flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => setReportOpen((v) => !v)}
                className="min-h-[38px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-[0.98] shadow-sm"
              >
                {reportOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{reportOpen ? 'Cerrar Reporte' : 'Reportar Auto Visto'}</span>
              </button>

              <button
                type="button"
                onClick={() => loadRadar()}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white border border-black/[0.1] hover:bg-red-50 text-[#111318] text-xs font-semibold transition flex items-center gap-1.5 active:scale-[0.98]"
                title="Actualizar radar"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Report Sighting Form */}
        {reportOpen && (
          <form
            onSubmit={handleReportSubmit}
            className="mt-4 pt-4 border-t border-black/[0.08] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 animate-fade-in"
          >
            <input
              type="text"
              aria-label="Marca del vehículo"
              value={reportForm.brand}
              onChange={(e) => setReportForm((p) => ({ ...p, brand: e.target.value }))}
              placeholder="Marca (ej: Subaru)"
              className="px-3 py-2.5 rounded-xl bg-recessed border border-black/[0.1] text-xs text-ink placeholder-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing"
              required
            />
            <input
              type="text"
              aria-label="Modelo del vehículo"
              value={reportForm.model}
              onChange={(e) => setReportForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="Modelo (ej: Impreza WRX)"
              className="px-3 py-2.5 rounded-xl bg-recessed border border-black/[0.1] text-xs text-ink placeholder-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing"
              required
            />
            <select
              aria-label="Rareza del vehículo"
              value={reportForm.rarity}
              onChange={(e) => setReportForm((p) => ({ ...p, rarity: e.target.value }))}
              className="px-3 py-2.5 rounded-xl bg-recessed border border-black/[0.1] text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing"
            >
              <option value="Común">Común</option>
              <option value="Raro">Raro</option>
              <option value="Histórico">Histórico</option>
              <option value="Legendario">Legendario</option>
            </select>
            <input
              type="text"
              aria-label="Calle o zona del avistamiento"
              value={reportForm.address}
              onChange={(e) => setReportForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Calle / Zona (opcional)"
              className="px-3 py-2.5 rounded-xl bg-recessed border border-black/[0.1] text-xs text-ink placeholder-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing"
            />
            <button
              type="submit"
              disabled={reportSubmitting}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
            <MapPin className="w-4 h-4 text-red-600" />
            <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-ink">
              Avistamientos en Zona
            </h3>
            <span className="text-[11px] text-ink-muted font-telemetry uppercase">
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
                    ? 'bg-racing text-white'
                    : 'bg-surface border border-black/[0.08] text-ink-secondary hover:text-racing-ink'
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
              <div key={n} className="rounded-2xl bg-surface border border-black/[0.06] overflow-hidden animate-pulse">
                <div className="h-40 bg-recessed" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-recessed rounded" />
                  <div className="h-3 w-1/2 bg-recessed rounded" />
                  <div className="h-9 w-full bg-recessed rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSpots.length === 0 ? (
          <div className="py-12 px-5 text-center rounded-3xl cl-card space-y-3">
            <Radio className="w-7 h-7 text-racing-ink mx-auto" />
            <div className="space-y-1">
              <h4 className="font-display text-xl font-bold uppercase text-ink">Sin señales activas</h4>
              <p className="text-xs text-ink-secondary max-w-xs mx-auto">
                Todavía no hay reportes reales activos en este radio. Si ves un auto interesante en la calle, reportalo o escanealo.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpots.map((spot) => {
              const owned = isCarInSavedSet(spot, savedCarIds);
              const isSelected = selectedSpot?.id === spot.id;
              const rarityCfg = RARITY_CONFIG[spot.rarity] || RARITY_CONFIG['Común'];
              const hasCoords = Number.isFinite(spot.lat) && Number.isFinite(spot.lng);

              return (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className={`rounded-2xl cl-card overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    owned
                      ? 'border-red-400'
                      : isSelected
                      ? 'border-red-600 ring-1 ring-red-500/30'
                      : 'hover:border-red-300'
                  }`}
                >
                  {/* Silhouette / Photo */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {spot.imageSilhouette ? (
                      <img
                        src={spot.imageSilhouette}
                        alt={spot.model}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          owned
                            ? 'grayscale-0 filter-none scale-100'
                            : 'grayscale contrast-125 brightness-[0.6] blur-[1.5px]'
                        }`}
                      />
                    ) : (
                      <Radio className="w-10 h-10 text-red-300" />
                    )}

                    {!owned ? (
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px] flex flex-col items-center justify-center text-center p-4">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-red-200 flex items-center justify-center mb-1.5 text-red-600 shadow-lg">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-telemetry font-bold tracking-widest text-white uppercase">
                          Silueta en Zona
                        </span>
                        <span className="text-[11px] text-white/85 mt-0.5">
                          Escanealo en la calle para desbloquearlo
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-telemetry font-bold uppercase flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> En tu Garage
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-telemetry uppercase px-2 py-0.5 rounded-md ${rarityCfg.bgBadge}`}>
                        {spot.rarity}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[10px] font-telemetry font-semibold text-red-700 border border-red-200 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-red-600" />
                      <span>{formatDistance(spot.distanceMeters)}</span>
                    </div>

                    {hasCoords && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/95 hover:bg-red-600 hover:text-white backdrop-blur-md text-[10px] font-telemetry font-semibold text-[#111318] border border-black/[0.08] flex items-center gap-1 transition"
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
                        <h4 className="font-display text-xl font-extrabold uppercase text-ink tracking-tight truncate">
                          {spot.brand} <span className="text-racing-ink font-bold">{spot.model}</span>
                        </h4>
                        <span className="text-[11px] font-telemetry text-ink-muted shrink-0">{spot.year}</span>
                      </div>

                      <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-racing-ink shrink-0" />
                        <span className="truncate">{spot.address || 'Zona Urbana'}</span>
                      </p>

                      {(spot.hp > 0 || spot.topSpeed > 0 || spot.zeroToHundred > 0) && (
                        <div className="grid grid-cols-3 divide-x divide-black/[0.07] rounded-xl cl-panel mt-3 py-1.5 text-center font-telemetry">
                          <div className="px-1">
                            <span className="text-[8px] text-ink-muted uppercase block">CV</span>
                            <span className="text-[11px] font-bold text-ink">{spot.hp || '—'}</span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-ink-muted uppercase block">0–100</span>
                            <span className="text-[11px] font-bold text-ink">
                              {spot.zeroToHundred ? `${spot.zeroToHundred}s` : '—'}
                            </span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-ink-muted uppercase block">KM/H</span>
                            <span className="text-[11px] font-bold text-ink">{spot.topSpeed || '—'}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-ink-muted border-t border-black/[0.06] pt-2.5 font-telemetry">
                        <span className="flex items-center gap-1 text-racing-ink font-semibold">
                          <Clock className="w-3 h-3" /> {formatRemainingMinutes(spot.expiresAt)}
                        </span>
                        <span className="truncate text-ink-muted">{spot.spottedBy || 'Spotter'}</span>
                      </div>
                    </div>

                    {/* Scan CTA */}
                    <div>
                      {owned ? (
                        <div className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ya está en tu Garage</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoScanSpot(spot);
                          }}
                          className="w-full min-h-[40px] py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Ir a Escanear en Calle</span>
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
