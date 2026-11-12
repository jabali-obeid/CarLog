/**
 * IndexedDB storage for CarLog user garages.
 * Replaces size-restricted localStorage (~5MB) with high-capacity persistent browser storage.
 */
const DB_NAME = 'carlog_idb_v1';
const STORE_NAME = 'garages';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getKey(userId) {
  return userId ? `garage_${userId}` : 'garage_guest';
}

export async function idbGetGarage(userId) {
  const legacyKey = userId ? `carlog_garage_${userId}` : 'carlog_garage_guest';
  try {
    const db = await openDb();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(getKey(userId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();

    if (result) return result;

    // Auto-migrate legacy localStorage entries if present
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      await idbSaveGarage(userId, parsed);
      localStorage.removeItem(legacyKey);
      return parsed;
    }
    return null;
  } catch (e) {
    try {
      const raw = localStorage.getItem(legacyKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function idbSaveGarage(userId, garageList) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(garageList, getKey(userId));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch (e) {
    console.warn('IndexedDB write failed:', e);
  }
}

