import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio, MapPin, Clock, Sparkles, Navigation, CheckCircle2, Lock, Crosshair
} from 'lucide-react';
import { sound } from '../utils/audio';
import { RARITY_CONFIG, POKEDEX_CARS } from '../utils/demoData';
import { getSupabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { getCurrentSession } from '../utils/auth';

const LOCAL_RADAR_KEY = 'carlog_local_radar_spots';

function normalizeRadarSpot(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    rarity: row.rarity || 'Raro',
    hp: Number(row.hp) || 0,
    zeroToHundred: Number(row.zero_to_hundred ?? row.zeroToHundred) || 0,
    topSpeed: Number(row.top_speed ?? row.topSpeed) || 0,
    engine: row.engine || '',
    color: row.color || '',
    imageSilhouette: row.image_silhouette || row.imageSilhouette || row.imageUrl || '',
    spottedBy: row.spotted_by || row.spottedBy || 'Spotter_CarLog',
    address: row.address || 'Zona Urbana',
    distanceMeters: Number(row.distance_meters ?? row.distanceMeters) || 500,
    spottedAt: row.spotted_at || row.spottedAt || new Date().toISOString()
  };
}

function getFallbackSpots() {
  try {
    const savedLocal = JSON.parse(localStorage.getItem(LOCAL_RADAR_KEY) || '[]');
    if (Array.isArray(savedLocal) && savedLocal.length > 0) return savedLocal;
  } catch {}

  return POKEDEX_CARS.slice(0, 3).map((c, idx) => ({
    id: `seed-spot-${c.id}`,
    brand: c.brand,
    model: c.name,
    year: c.year,
    rarity: c.rarity,
    hp: c.hp,
    zeroToHundred: parseFloat(c.zeroToHundred) || 4.0,
    topSpeed: parseInt(c.topSpeed, 10) || 260,
    engine: c.engine,
    color: c.color,
    imageSilhouette: c.image,
    spottedBy: idx === 0 ? 'Spotter_Palermo' : 'CarLog_Radar',
    address: c.recentSpottedLocation || 'Av. del Libertador',
    distanceMeters: 420 + idx * 310
  }));
}

export default function RadarView({ onSpotFound }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [claimedIds, setClaimedIds] = useState(new Set());

  const fetchRadar = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('radar_spots')
          .select('*')
          .order('spotted_at', { ascending: false })
          .limit(20);

        if (!error && Array.isArray(data)) {
          setSpots(data.length > 0 ? data.map(normalizeRadarSpot) : getFallbackSpots());
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase radar read fallback:', err);
      }
    }

    try {
      const res = await fetch('/api/radar');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setSpots(Array.isArray(data) && data.length > 0 ? data : getFallbackSpots());
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Using local radar fallback', err);
    }

    setSpots(getFallbackSpots());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRadar();

    const supabase = getSupabase();
    let channel = null;
    if (supabase && isSupabaseConfigured()) {
      channel = supabase
        .channel('radar-spots-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radar_spots' }, (payload) => {
          if (payload?.new) {
            const spot = normalizeRadarSpot(payload.new);
            setSpots(prev => [spot, ...prev.filter(s => s.id !== spot.id)]);
          }
        })
        .subscribe();
    }

    const interval = setInterval(fetchRadar, 20000);
    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [fetchRadar]);

  const handleClaim = (spot) => {
    sound.playRadarPing();
    sound.playEngineRev();
    setClaimedIds(prev => new Set([...prev, spot.id]));
    if (onSpotFound) {
      onSpotFound({
        ...spot,
        imageUrl: spot.imageSilhouette
      });
    }
  };

  const simulateRandomAlert = async () => {
    sound.playRadarPing();
    const session = getCurrentSession();
    const newSpot = {
      id: `spot-${Date.now()}`,
      brand: 'Ferrari',
      model: '296 GTB Hybrid V6',
      year: '2024',
      rarity: 'Legendario',
      hp: 830,
      zeroToHundred: 2.9,
      topSpeed: 330,
      engine: '3.0L Twin-Turbo V6 Híbrido Enchufable',
      color: 'Giallo Modena (Amarillo)',
      imageSilhouette: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=800&q=80',
      spottedBy: session?.username || 'RadarBot_Auto',
      address: 'Av. Santa Fe y Callao',
      distanceMeters: Math.floor(250 + Math.random() * 750)
    };

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured() && session?.provider === 'supabase') {
      try {
        const { error } = await supabase.from('radar_spots').insert({
          id: newSpot.id,
          user_id: session.id,
          brand: newSpot.brand,
          model: newSpot.model,
          year: newSpot.year,
          rarity: newSpot.rarity,
          hp: newSpot.hp,
          zero_to_hundred: newSpot.zeroToHundred,
          top_speed: newSpot.topSpeed,
          engine: newSpot.engine,
          color: newSpot.color,
          image_silhouette: newSpot.imageSilhouette,
          spotted_by: newSpot.spottedBy,
          address: newSpot.address,
          distance_meters: newSpot.distanceMeters
        });
        if (!error) {
          await fetchRadar();
          return;
        }
      } catch (e) {
        console.warn('Supabase radar insert failed:', e);
      }
    }

    try {
      const res = await fetch('/api/radar/spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSpot,
          imageUrl: newSpot.imageSilhouette
        })
      });
      if (res.ok) {
        await fetchRadar();
        return;
      }
    } catch {}

    const updated = [newSpot, ...spots];
    setSpots(updated);
    try {
      localStorage.setItem(LOCAL_RADAR_KEY, JSON.stringify(updated.slice(0, 15)));
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-in pb-2">
      {/* Radar Telemetry Scope Instrument */}
      <div className="relative rounded-3xl cl-card cl-microgrid p-5 overflow-hidden">
        {/* Calibrated Top Cyan Accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Circular Telemetry Radar Dial */}
          <div className="relative w-56 h-56 sm:w-60 sm:h-60 rounded-full border border-cyan-500/35 bg-[#07090e] flex items-center justify-center overflow-hidden shadow-[inset_0_0_32px_rgba(6,182,212,0.12)] shrink-0">
            {/* Concentric Distance Rings */}
            <div className="absolute w-44 h-44 rounded-full border border-cyan-500/18" />
            <div className="absolute w-28 h-28 rounded-full border border-cyan-500/22" />
            <div className="absolute w-14 h-14 rounded-full border border-cyan-500/28" />

            {/* Range Ring Scale Labels */}
            <span className="absolute top-2 font-telemetry text-[8px] text-cyan-500/55 uppercase tracking-widest pointer-events-none">
              1.5 KM
            </span>
            <span className="absolute bottom-2 font-telemetry text-[8px] text-cyan-500/55 uppercase tracking-widest pointer-events-none">
              N · 180°
            </span>

            {/* Radar Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-cyan-500/15" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-cyan-500/15" />
            </div>

            {/* Radar Sweep Light */}
            <div className="absolute inset-0 origin-center animate-radar pointer-events-none">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 to-transparent transform origin-bottom-right rounded-tl-full" />
            </div>

            {/* User Center Pin */}
            <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            {/* Spotted Car Blips */}
            {spots.slice(0, 8).map((spot, idx) => {
              const angles = [42, 132, 224, 308, 178, 86, 268, 14];
              const angle = (angles[idx % angles.length] * Math.PI) / 180;
              const dist = 26 + Math.min(1, (spot.distanceMeters || 600) / 1500) * 70;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              const isClaimed = claimedIds.has(spot.id);
              const isSelected = selectedSpot?.id === spot.id;

              return (
                <button
                  type="button"
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  title={`${spot.brand} ${spot.model} (${spot.distanceMeters}m)`}
                  aria-label={`Objetivo ${spot.brand} ${spot.model} a ${spot.distanceMeters} metros`}
                  className={`absolute w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-150 focus:outline-none z-20 border border-white ${
                    isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#07090e] scale-125' : ''
                  } ${
                    isClaimed
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

          {/* Radar Telemetry Summary */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-telemetry font-bold uppercase tracking-widest">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Telemetría de Proximidad Activa</span>
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold text-white uppercase tracking-tight leading-none">
                Radar de Caza Callejera
              </h2>
              <p className="text-xs text-[var(--cl-text-secondary)] leading-relaxed max-w-md mt-2">
                Cuando un spotter detecta un vehículo <strong className="text-amber-300 font-semibold">Legendario, Histórico o Raro</strong>, la red transmite su silueta y distancia estimada para reclamarlo en campo.
              </p>
            </div>

            {selectedSpot && (
              <div className="p-2.5 rounded-xl cl-panel flex items-center justify-between gap-2 text-left animate-fade-in">
                <div className="min-w-0">
                  <div className="text-[9px] font-telemetry text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3" /> OBJETIVO FIJADO
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {selectedSpot.brand} {selectedSpot.model} ·{' '}
                    <span className="font-telemetry text-cyan-300">{selectedSpot.distanceMeters}m</span>
                  </div>
                </div>
                {!claimedIds.has(selectedSpot.id) && (
                  <button
                    onClick={() => handleClaim(selectedSpot)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-[#08090c] font-bold text-[10px] shrink-0 active:scale-95 transition"
                  >
                    Reclamar
                  </button>
                )}
              </div>
            )}

            <div className="pt-1 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={simulateRandomAlert}
                className="min-h-[40px] px-4 py-2 rounded-xl cl-pill hover:bg-[#232838] text-cyan-300 border-cyan-500/35 text-xs font-bold transition flex items-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simular Alerta Cercana</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Active Spots Feed */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-white">
              Avistamientos en Zona
            </h3>
          </div>
          <span className="text-[11px] text-[var(--cl-text-secondary)] font-telemetry uppercase">
            {String(spots.length).padStart(2, '0')} objetivos
          </span>
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
        ) : spots.length === 0 ? (
          <div className="py-12 px-5 text-center rounded-3xl cl-card space-y-3">
            <Radio className="w-7 h-7 text-cyan-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-display text-xl font-bold uppercase text-white">Sin señales activas</h4>
              <p className="text-xs text-[var(--cl-text-secondary)] max-w-xs mx-auto">
                No hay alertas recientes en tu radio. Simula un avistamiento cercano o escanea un auto en la calle.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spots.map((spot) => {
              const isClaimed = claimedIds.has(spot.id);
              const isSelected = selectedSpot?.id === spot.id;
              const rarityCfg = RARITY_CONFIG[spot.rarity] || RARITY_CONFIG['Común'];

              return (
                <div
                  key={spot.id}
                  className={`rounded-2xl cl-card overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    isClaimed
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
                        isClaimed
                          ? 'grayscale-0 filter-none scale-100'
                          : 'grayscale contrast-125 brightness-[0.42] blur-[1.5px]'
                      }`}
                    />

                    {/* Silhouette Overlay Badge if Not Claimed */}
                    {!isClaimed ? (
                      <div className="absolute inset-0 bg-[#07090e]/45 backdrop-blur-[1.5px] flex flex-col items-center justify-center text-center p-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#0b0e15]/85 border border-white/15 flex items-center justify-center mb-1.5 text-amber-400 shadow-lg">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-telemetry font-bold tracking-widest text-zinc-100 uppercase">
                          Silueta Bloqueada
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-0.5">
                          Reclámalo en terreno para revelar
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[#05110b] text-[10px] font-telemetry font-bold uppercase flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Descubierto
                      </div>
                    )}

                    {/* Rarity Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-telemetry uppercase px-2 py-0.5 rounded-md ${rarityCfg.bgBadge}`}>
                        {spot.rarity}
                      </span>
                    </div>

                    {/* Distance badge */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#090b10]/88 backdrop-blur-md text-[10px] font-telemetry font-semibold text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      <span>{spot.distanceMeters || 650} m</span>
                    </div>
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
                        <span className="truncate">{spot.address || 'Av. Costanera'}</span>
                      </p>

                      {(spot.hp > 0 || spot.topSpeed > 0 || spot.zeroToHundred > 0) && (
                        <div className="grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl cl-panel mt-3 py-1.5 text-center font-telemetry">
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">CV</span>
                            <span className="text-[11px] font-bold text-zinc-200">{spot.hp || '—'}</span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">0–100</span>
                            <span className="text-[11px] font-bold text-zinc-200">{spot.zeroToHundred ? `${spot.zeroToHundred}s` : '—'}</span>
                          </div>
                          <div className="px-1">
                            <span className="text-[8px] text-[var(--cl-text-muted)] uppercase block">KM/H</span>
                            <span className="text-[11px] font-bold text-zinc-200">{spot.topSpeed || '—'}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-zinc-400 border-t border-white/[0.06] pt-2.5 font-telemetry">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Clock className="w-3 h-3" /> ~20 min
                        </span>
                        <span className="truncate text-zinc-500">{spot.spottedBy || 'Spotter'}</span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div>
                      {isClaimed ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reclamado en colección</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(spot)}
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
