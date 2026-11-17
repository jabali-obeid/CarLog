import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentSession } from './auth';
import { POKEDEX_CARS } from './demoData';

const LOCAL_RADAR_KEY = 'carlog_local_radar_spots';
const CLAIMED_SPOTS_KEY = 'carlog_claimed_radar_spots';
const USER_COORDS_KEY = 'carlog_last_coords';
const DEFAULT_CENTER = { lat: -34.5764, lng: -58.4148 }; // Palermo / Av. del Libertador, Buenos Aires
const DEFAULT_SPOT_TTL_MS = 30 * 60 * 1000;

const SIMULATION_POOL = [
  {
    brand: 'Porsche',
    model: '911 GT3 RS (992)',
    year: '2023',
    rarity: 'Legendario',
    hp: 525,
    zeroToHundred: 3.2,
    topSpeed: 296,
    engine: '4.0L Flat-6 Atmosférico',
    color: 'Ice Grey / Rojo',
    imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Ferrari',
    model: 'F40 Berlinetta',
    year: '1987',
    rarity: 'Histórico',
    hp: 478,
    zeroToHundred: 4.1,
    topSpeed: 324,
    engine: '2.9L Twin-Turbo V8',
    color: 'Rosso Corsa',
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Honda',
    model: 'Civic Type R (FK8)',
    year: '2021',
    rarity: 'Raro',
    hp: 320,
    zeroToHundred: 5.7,
    topSpeed: 272,
    engine: '2.0L VTEC Turbo',
    color: 'Championship White',
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'BMW',
    model: 'M3 E36 3.2 Coupé',
    year: '1997',
    rarity: 'Histórico',
    hp: 321,
    zeroToHundred: 5.5,
    topSpeed: 250,
    engine: '3.2L S50B32 6 cil.',
    color: 'Estoril Blue',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Renault',
    model: 'Clio V6 Renault Sport',
    year: '2003',
    rarity: 'Histórico',
    hp: 255,
    zeroToHundred: 5.8,
    topSpeed: 246,
    engine: '3.0L V6 Central Trasero',
    color: 'Azul Iliade',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
  },
  {
    brand: 'Ford',
    model: 'F-150 Raptor EcoBoost',
    year: '2023',
    rarity: 'Raro',
    hp: 456,
    zeroToHundred: 5.3,
    topSpeed: 180,
    engine: '3.5L V6 Biturbo',
    color: 'Azul Velocidad',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80'
  }
];

const STREETS_BA = [
  'Av. del Libertador 3800',
  'Av. Figueroa Alcorta y Sarmiento',
  'Av. Santa Fe y Callao',
  'Av. Corrientes 1400',
  'Puerto Madero · Blvd. Azucena Villaflor',
  'Av. Cabildo y Juramento'
];

export function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function calculateBearingDegrees(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function offsetCoordinates(lat, lng, distanceMeters, bearingDeg) {
  const R = 6378137;
  const radBear = (bearingDeg * Math.PI) / 180;
  const dLat = (distanceMeters * Math.cos(radBear)) / R;
  const dLng = (distanceMeters * Math.sin(radBear)) / (R * Math.cos((lat * Math.PI) / 180));
  return {
    lat: Number((lat + (dLat * 180) / Math.PI).toFixed(6)),
    lng: Number((lng + (dLng * 180) / Math.PI).toFixed(6))
  };
}

export function getSavedUserCoords() {
  try {
    const raw = sessionStorage.getItem(USER_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function requestUserLocation(timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy || 0)
        };
        try {
          sessionStorage.setItem(USER_COORDS_KEY, JSON.stringify(coords));
        } catch {
          // Ignore storage write errors
        }
        resolve(coords);
      },
      (err) => {
        if (err.code === 1) {
          reject(new Error('Permiso de ubicación denegado. Activá el GPS en el navegador.'));
        } else if (err.code === 3) {
          reject(new Error('Tiempo de espera agotado buscando señal GPS.'));
        } else {
          reject(new Error('No se pudo obtener tu ubicación actual.'));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}

export function formatDistance(meters) {
  const m = Number(meters);
  if (!Number.isFinite(m) || m < 0) return '—';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function formatRemainingMinutes(expiresAt) {
  if (!expiresAt) return 'Activo';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 'Expirado';
  const mins = Math.ceil(diffMs / 60000);
  if (mins <= 2) return '< 2 min';
  return `${mins} min`;
}

export function normalizeRadarSpot(row, userCoords = null) {
  const lat = Number.isFinite(Number(row.lat)) ? Number(row.lat) : null;
  const lng = Number.isFinite(Number(row.lng)) ? Number(row.lng) : null;
  const liveDist =
    userCoords && lat !== null && lng !== null
      ? calculateDistanceMeters(userCoords.lat, userCoords.lng, lat, lng)
      : null;
  const bearingDeg =
    userCoords && lat !== null && lng !== null
      ? calculateBearingDegrees(userCoords.lat, userCoords.lng, lat, lng)
      : Number.isFinite(Number(row.bearingDeg))
      ? Number(row.bearingDeg)
      : null;

  const spottedAt = row.spotted_at || row.spottedAt || new Date().toISOString();
  const expiresAt =
    row.expires_at ||
    row.expiresAt ||
    new Date(new Date(spottedAt).getTime() + DEFAULT_SPOT_TTL_MS).toISOString();

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year ? String(row.year) : '',
    rarity: row.rarity || 'Raro',
    hp: Number(row.hp) || 0,
    zeroToHundred: Number(row.zero_to_hundred ?? row.zeroToHundred) || 0,
    topSpeed: Number(row.top_speed ?? row.topSpeed) || 0,
    engine: row.engine || '',
    color: row.color || '',
    imageSilhouette: row.image_silhouette || row.imageSilhouette || row.imageUrl || '',
    spottedBy: row.spotted_by || row.spottedBy || 'Spotter_CarLog',
    address: row.address || 'Zona Urbana',
    lat,
    lng,
    bearingDeg,
    distanceMeters: liveDist !== null ? liveDist : Number(row.distance_meters ?? row.distanceMeters) || 500,
    spottedAt,
    expiresAt
  };
}

function readLocalSpotsRaw() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_RADAR_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    const now = Date.now();
    return saved.filter((s) => !s?.expiresAt || new Date(s.expiresAt).getTime() > now);
  } catch {
    return [];
  }
}

function writeLocalSpotsRaw(list) {
  try {
    localStorage.setItem(LOCAL_RADAR_KEY, JSON.stringify(list.slice(0, 25)));
  } catch {
    // Ignore storage quota errors
  }
}

function buildInitialSeedSpots(userCoords) {
  const center = userCoords || DEFAULT_CENTER;
  const bearings = [38, 145, 252];
  const distances = [420, 740, 1080];
  return POKEDEX_CARS.slice(0, 3).map((c, idx) => {
    const pos = offsetCoordinates(center.lat, center.lng, distances[idx], bearings[idx]);
    const now = Date.now();
    return {
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
      address: c.recentSpottedLocation || STREETS_BA[idx % STREETS_BA.length],
      lat: pos.lat,
      lng: pos.lng,
      bearingDeg: bearings[idx],
      distanceMeters: distances[idx],
      spottedAt: new Date(now - idx * 180000).toISOString(),
      expiresAt: new Date(now + (26 - idx * 4) * 60000).toISOString()
    };
  });
}

export function getClaimedSpotIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(CLAIMED_SPOTS_KEY) || '[]');
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markSpotClaimed(spotId) {
  if (!spotId) return getClaimedSpotIds();
  const current = getClaimedSpotIds();
  current.add(spotId);
  try {
    localStorage.setItem(CLAIMED_SPOTS_KEY, JSON.stringify([...current].slice(-120)));
  } catch {
    // Ignore storage quota errors
  }
  return current;
}

export async function fetchRadarSpots(userCoords = null) {
  const localSpots = readLocalSpotsRaw();
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('radar_spots')
        .select('*')
        .gt('expires_at', nowIso)
        .order('spotted_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data)) {
        const cloudIds = new Set(data.map((r) => r.id));
        const merged = [
          ...data.map((r) => normalizeRadarSpot(r, userCoords)),
          ...localSpots.filter((l) => !cloudIds.has(l.id)).map((l) => normalizeRadarSpot(l, userCoords))
        ];
        if (merged.length > 0) {
          return { spots: merged, source: 'cloud' };
        }
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
      if (Array.isArray(data) && data.length > 0) {
        return { spots: data.map((r) => normalizeRadarSpot(r, userCoords)), source: 'api' };
      }
    }
  } catch {
    // Expected on static/Netlify deployment without Express /api/radar
  }

  const fallbackRaw = localSpots.length > 0 ? localSpots : buildInitialSeedSpots(userCoords);
  if (localSpots.length === 0) {
    writeLocalSpotsRaw(fallbackRaw);
  }
  return {
    spots: fallbackRaw.map((r) => normalizeRadarSpot(r, userCoords)),
    source: 'local'
  };
}

export async function publishRadarSpot({
  car,
  coords = null,
  address = '',
  distanceMeters = null
}) {
  const session = getCurrentSession();
  const center = coords || getSavedUserCoords() || DEFAULT_CENTER;
  const dist = Number.isFinite(distanceMeters) ? distanceMeters : coords ? 25 : Math.floor(150 + Math.random() * 650);
  const bearing = Math.floor(Math.random() * 360);
  const pos = coords ? { lat: center.lat, lng: center.lng } : offsetCoordinates(center.lat, center.lng, dist, bearing);

  const now = Date.now();
  const newSpot = {
    id: `spot-${now}-${Math.floor(Math.random() * 1000)}`,
    brand: String(car?.brand || 'Deportivo').trim(),
    model: String(car?.model || car?.name || 'Modelo').trim(),
    year: car?.year ? String(car.year) : String(new Date().getFullYear()),
    rarity: car?.rarity || 'Raro',
    hp: Number(car?.hp) || 0,
    zeroToHundred: Number(car?.zeroToHundred) || 0,
    topSpeed: Number(car?.topSpeed) || 0,
    engine: car?.engine || '',
    color: car?.color || '',
    imageSilhouette: car?.imageUrl || car?.imageSilhouette || car?.image || SIMULATION_POOL[0].imageUrl,
    spottedBy: session?.username || 'Tú (Spotter Oficial)',
    address:
      (address || '').trim() ||
      (coords ? 'Ubicación GPS verificada' : STREETS_BA[Math.floor(Math.random() * STREETS_BA.length)]),
    lat: pos.lat,
    lng: pos.lng,
    bearingDeg: bearing,
    distanceMeters: dist,
    spottedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEFAULT_SPOT_TTL_MS).toISOString()
  };

  let persistedCloud = false;
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured() && session?.provider === 'supabase' && session?.id) {
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
        lat: newSpot.lat,
        lng: newSpot.lng,
        distance_meters: newSpot.distanceMeters,
        spotted_at: newSpot.spottedAt,
        expires_at: newSpot.expiresAt
      });
      if (!error) persistedCloud = true;
    } catch (e) {
      console.warn('Supabase radar insert fallback to local:', e);
    }
  }

  try {
    const res = await fetch('/api/radar/spot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSpot, imageUrl: newSpot.imageSilhouette })
    });
    if (res.ok && !persistedCloud) {
      // Also saved on local Express server
    }
  } catch {
    // Static frontend without Express server
  }

  // Always cache locally too so offline/guest sessions see immediate radar updates
  const currentLocal = readLocalSpotsRaw();
  writeLocalSpotsRaw([newSpot, ...currentLocal.filter((s) => s.id !== newSpot.id)]);

  return {
    spot: normalizeRadarSpot(newSpot, coords),
    mode: persistedCloud ? 'cloud' : 'local'
  };
}

export async function simulateNearbySpot(coords = null) {
  const sample = SIMULATION_POOL[Math.floor(Math.random() * SIMULATION_POOL.length)];
  const center = coords || getSavedUserCoords() || DEFAULT_CENTER;
  const dist = Math.floor(180 + Math.random() * 980);
  const bearing = Math.floor(Math.random() * 360);
  const pos = offsetCoordinates(center.lat, center.lng, dist, bearing);

  const session = getCurrentSession();
  const simSpot = {
    id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...sample,
    imageSilhouette: sample.imageUrl,
    spottedBy: session?.username ? `${session.username} (Radar)` : 'RadarBot_Live',
    address: STREETS_BA[Math.floor(Math.random() * STREETS_BA.length)],
    lat: pos.lat,
    lng: pos.lng,
    bearingDeg: bearing,
    distanceMeters: dist,
    spottedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + DEFAULT_SPOT_TTL_MS).toISOString()
  };

  // Publish to cloud only if authenticated; otherwise add cleanly to local spots
  const res = await publishRadarSpot({
    car: simSpot,
    coords: pos,
    address: simSpot.address,
    distanceMeters: dist
  });

  return {
    ...res,
    spot: normalizeRadarSpot({ ...res.spot, distanceMeters: dist, bearingDeg: bearing }, coords)
  };
}
