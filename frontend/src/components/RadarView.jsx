import React, { useState, useEffect, useCallback } from 'react';
import { Radar, Radio, MapPin, Clock, ShieldAlert, Sparkles, Navigation, CheckCircle2 } from 'lucide-react';
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
      if (res.ok) {
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

    // Local fallback when static hosting (Netlify without backend/auth)
    const updated = [newSpot, ...spots];
    setSpots(updated);
    try {
      localStorage.setItem(LOCAL_RADAR_KEY, JSON.stringify(updated.slice(0, 15)));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Radar Scanner Dashboard */}
      <div className="relative rounded-3xl bg-[#0e101a] border border-cyan-500/30 p-6 overflow-hidden shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0"></div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          {/* Visual Radar Screen */}
          <div className="relative w-64 h-64 rounded-full border-2 border-cyan-500/40 bg-[#07090e] flex items-center justify-center overflow-hidden shadow-inner shadow-cyan-950">
            {/* Concentric distance rings */}
            <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-32 h-32 rounded-full border border-cyan-500/25"></div>
            <div className="absolute w-16 h-16 rounded-full border border-cyan-500/30"></div>

            {/* Radar Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-cyan-500/20"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-[1px] bg-cyan-500/20"></div>
            </div>

            {/* Radar Sweep Light */}
            <div className="absolute inset-0 origin-center animate-radar pointer-events-none">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 to-transparent transform origin-bottom-right rounded-tl-full"></div>
            </div>

            {/* User Center Pin */}
            <div className="relative z-10 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 border-2 border-white animate-pulse"></div>

            {/* Spotted car blips on radar */}
            {spots.map((spot, idx) => {
              const angles = [45, 135, 230, 310, 180];
              const angle = (angles[idx % angles.length] * Math.PI) / 180;
              const dist = 30 + ((spot.distanceMeters || 600) / 1500) * 80;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              const isClaimed = claimedIds.has(spot.id);

              return (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  title={`${spot.brand} ${spot.model}`}
                  className={`absolute w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-150 z-20 ${
                    isClaimed
                      ? 'bg-emerald-400 shadow-emerald-400/70 border border-white'
                      : spot.rarity === 'Legendario'
                      ? 'bg-yellow-400 shadow-yellow-400/80 animate-ping border border-white'
                      : spot.rarity === 'Histórico'
                      ? 'bg-amber-500 shadow-amber-500/80 animate-ping border border-white'
                      : 'bg-purple-400 shadow-purple-400/80 border border-white'
                  }`}
                />
              );
            })}
          </div>

          {/* Radar Info Header */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              SISTEMA DE ALERTA DE PROXIMIDAD ACTIVO
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Radar de Caza Callejera
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-xl">
              Cuando un spotter encuentra un vehículo <strong className="text-amber-400">Legendario, Histórico o Raro</strong>, la red emite un pulso de proximidad con su silueta en gris y radio estimado para que corras a encontrarlo.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={simulateRandomAlert}
                className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simular Alerta de Caza Cercana
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Active Spots Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Avistamientos Activos en tu Zona</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {spots.length} objetivos detectados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {spots.map((spot) => {
            const isClaimed = claimedIds.has(spot.id);
            const rarityCfg = RARITY_CONFIG[spot.rarity] || RARITY_CONFIG['Común'];

            return (
              <div
                key={spot.id}
                className={`rounded-2xl border bg-[#11131e] overflow-hidden transition-all duration-300 hover:border-zinc-500 shadow-xl flex flex-col justify-between ${
                  isClaimed ? 'border-emerald-500/50' : 'border-white/10'
                }`}
              >
                {/* Silhouette / Photo with Grayscale Filter */}
                <div className="relative h-44 bg-black/80 overflow-hidden flex items-center justify-center">
                  <img
                    src={spot.imageSilhouette}
                    alt={spot.model}
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      isClaimed
                        ? 'grayscale-0 filter-none scale-100'
                        : 'grayscale contrast-125 brightness-50 blur-[1px]'
                    }`}
                  />

                  {/* Silhouette Overlay Badge if Not Claimed */}
                  {!isClaimed ? (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center mb-1 text-yellow-400 text-xl font-black shadow-lg">
                        ?
                      </div>
                      <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
                        Silueta Bloqueada
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Fotografíalo en la calle para revelar a color
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Descubierto
                    </div>
                  )}

                  {/* Rarity Pill */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${rarityCfg.bgBadge}`}>
                      {spot.rarity}
                    </span>
                  </div>

                  {/* Distance badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-cyan-400" />
                    a {spot.distanceMeters || 650}m de ti
                  </div>
                </div>

                {/* Spot Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-extrabold text-white">
                        {spot.brand} <span className="text-zinc-300">{spot.model}</span>
                      </h4>
                      <span className="text-xs font-mono text-zinc-400">{spot.year}</span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {spot.address || 'Av. Costanera'}
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400 border-t border-white/5 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Quedan ~20 min
                      </span>
                      <span>•</span>
                      <span>Por: {spot.spottedBy || 'Spotter'}</span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="mt-4">
                    {isClaimed ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
                        ✓ Ya desbloqueado en tu colección
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(spot)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        ¡Estoy aquí! Identificar y Reclamar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

