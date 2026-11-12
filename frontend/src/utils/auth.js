// CarLog Authentication & Cloud/Local Persistence Layer
// Supports Supabase Cloud (Auth + PostgreSQL + Storage) with automatic IndexedDB offline fallback

import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { idbGetGarage, idbSaveGarage } from './localDb';
import { dataUrlToBlob } from './imageUtils';

const USERS_STORAGE_KEY = 'carlog_users_db';
const SESSION_STORAGE_KEY = 'carlog_current_session';

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

function normalizeCarToDb(car, userId) {
  return {
    id: car.id || `car-${Date.now()}`,
    user_id: userId,
    brand: car.brand || 'Desconocido',
    model: car.model || car.name || 'Modelo',
    year: car.year ? String(car.year) : '',
    rarity: car.rarity || 'Común',
    hp: Number(car.hp) || 0,
    zero_to_hundred: Number(car.zeroToHundred) || 0,
    top_speed: Number(car.topSpeed) || 0,
    engine: car.engine || '',
    color: car.color || '',
    country: car.country || '',
    fun_fact: car.funFact || '',
    rarity_reason: car.rarityReason || '',
    image_url: car.imageUrl || car.image || '',
    model_3d_url: car.model3dUrl || '',
    captured_at: car.capturedAt || new Date().toISOString()
  };
}

function normalizeDbToCar(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    rarity: row.rarity,
    hp: row.hp,
    zeroToHundred: Number(row.zero_to_hundred) || 0,
    topSpeed: row.top_speed || 0,
    engine: row.engine,
    color: row.color,
    country: row.country,
    funFact: row.fun_fact,
    rarityReason: row.rarity_reason,
    imageUrl: row.image_url,
    model3dUrl: row.model_3d_url,
    capturedAt: row.captured_at,
    userCaptured: true
  };
}

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mapSupabaseSession(authSession, profile = null) {
  if (!authSession?.user) return null;
  const u = authSession.user;
  const username =
    profile?.username ||
    u.user_metadata?.username ||
    (u.email ? u.email.split('@')[0] : 'Spotter');

  return {
    id: u.id,
    username,
    email: u.email || '',
    avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    rank: profile?.rank || 'Spotter Novato',
    isCloud: true
  };
}

export async function registerUser({ username, email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = username.trim();

  if (!cleanUser || cleanUser.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ingresa un correo electrónico válido.');
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  // Cloud mode via Supabase
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: { username: cleanUser }
      }
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.session) {
      return {
        id: data.user?.id || `pending_${Date.now()}`,
        username: cleanUser,
        email: cleanEmail,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
        rank: 'Spotter Novato',
        isCloud: true,
        needsEmailConfirmation: true
      };
    }
    return mapSupabaseSession(data.session, { username: cleanUser });
  }

  // Local device account fallback
  const users = getUsers();
  if (users.some(u => u.email === cleanEmail)) {
    throw new Error('Ya existe una cuenta registrada con este correo.');
  }
  if (users.some(u => u.username.toLowerCase() === cleanUser.toLowerCase())) {
    throw new Error('Ese nombre de usuario ya está en uso.');
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
    rank: 'Spotter Novato',
    joinedAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return await loginUser({ email: cleanEmail, password });
}

export async function loginUser({ email, password }) {
  const clean = email.trim().toLowerCase();

  // Cloud mode via Supabase
  const supabase = getSupabase();
  if (supabase) {
    let targetEmail = clean;
    if (!clean.includes('@')) {
      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', clean)
        .maybeSingle();
      if (profileMatch?.email) {
        targetEmail = profileMatch.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password
    });
    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return mapSupabaseSession(data.session, profile);
  }

  // Local device account fallback
  const users = getUsers();
  const targetHash = hashPassword(password);
  const user = users.find(
    u => (u.email === clean || u.username.toLowerCase() === clean) && u.passwordHash === targetHash
  );

  if (!user) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  const session = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    rank: user.rank,
    isCloud: false,
    token: `tok_${Date.now()}_${Math.random().toString(36).substring(2)}`
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function resolveCurrentSession() {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();
      return mapSupabaseSession(data.session, profile);
    }
    return null;
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
}

// --- Garage Persistence (Supabase Cloud + IndexedDB Offline Cache) ---

export async function getUserGarage(userId) {
  const supabase = getSupabase();
  if (supabase && userId && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('garage_cars')
        .select('*')
        .eq('user_id', userId)
        .order('captured_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cars = data.map(normalizeDbToCar);
        await idbSaveGarage(userId, cars);
        return cars;
      }
    } catch (e) {
      console.warn('Cloud garage fetch failed, reading offline cache:', e);
    }
  }

  return await idbGetGarage(userId);
}

export async function saveCarForUser(userId, car, currentList) {
  let finalCar = { ...car, userCaptured: true };
  const supabase = getSupabase();

  // If authenticated on Supabase, upload compressed photo to Storage if needed & upsert DB row
  if (supabase && userId && isSupabaseConfigured()) {
    try {
      if (finalCar.imageUrl && finalCar.imageUrl.startsWith('data:image/')) {
        const filePath = `${userId}/${finalCar.id}.jpg`;
        const blob = dataUrlToBlob(finalCar.imageUrl);
        const { error: uploadErr } = await supabase.storage
          .from('car-photos')
          .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

        if (!uploadErr) {
          const { data: pub } = supabase.storage.from('car-photos').getPublicUrl(filePath);
          if (pub?.publicUrl) {
            finalCar.imageUrl = pub.publicUrl;
          }
        }
      }

      const row = normalizeCarToDb(finalCar, userId);
      const { error: upsertErr } = await supabase
        .from('garage_cars')
        .upsert(row, { onConflict: 'user_id,id' });

      if (upsertErr) {
        console.warn('Supabase car upsert error:', upsertErr.message);
      }
    } catch (e) {
      console.warn('Cloud save failed, keeping in IndexedDB:', e);
    }
  }

  const updated = [finalCar, ...currentList.filter(c => c.id !== finalCar.id)];
  await idbSaveGarage(userId, updated);
  return { savedCar: finalCar, updatedList: updated };
}

export async function deleteCarForUser(userId, carId, currentList) {
  const supabase = getSupabase();
  if (supabase && userId && isSupabaseConfigured()) {
    try {
      await supabase
        .from('garage_cars')
        .delete()
        .eq('user_id', userId)
        .eq('id', carId);
    } catch (e) {
      console.warn('Cloud delete failed:', e);
    }
  }

  const updated = currentList.filter(c => c.id !== carId);
  await idbSaveGarage(userId, updated);
  return updated;
}

export async function syncGuestCarsToUser(userId) {
  const guestList = await idbGetGarage(null);
  if (!guestList || guestList.length === 0 || !userId) return [];

  const customGuestCars = guestList.filter(c => c.userCaptured || !String(c.id || '').startsWith('car-seed'));
  if (customGuestCars.length === 0) return [];

  const existingUserCars = (await getUserGarage(userId)) || [];
  const existingIds = new Set(existingUserCars.map(c => c.id));
  let merged = [...existingUserCars];

  for (const guestCar of customGuestCars) {
    if (!existingIds.has(guestCar.id)) {
      const { updatedList } = await saveCarForUser(userId, guestCar, merged);
      merged = updatedList;
    }
  }

  await idbSaveGarage(null, []);
  return merged;
}
