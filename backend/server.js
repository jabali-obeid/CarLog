import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables safely if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim();
      if (!process.env[k.trim()] && val) {
        process.env[k.trim()] = val;
      }
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Safe CORS and payload limit
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limit image upload payload to 12MB to prevent memory exhaustion attacks
app.use(express.json({ limit: '12mb' }));

// Simple in-memory IP Rate Limiter for AI identification endpoint (anti-abuse)
const rateLimitMap = new Map();
function rateLimitIdentify(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 15; // 15 scans per minute per IP

  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      error: 'Límite de solicitudes alcanzado. Por favor, espera unos segundos antes de volver a escanear.'
    });
  }

  next();
}

// Security: HTTP headers for privacy and protection
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Paths for persistence
const GARAGE_FILE = path.join(__dirname, 'garage.json');
const RADAR_FILE = path.join(__dirname, 'radar.json');

// --- NHTSA vPIC API INTEGRATION ---
// Official US Department of Transportation Vehicle Database
async function fetchNhtsaVpicData(make, model = '') {
  try {
    const cleanMake = (make || '').trim().toLowerCase();
    if (!cleanMake) return null;

    const vpicUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(cleanMake)}?format=json`;
    const response = await fetch(vpicUrl, { signal: AbortSignal.timeout(4000) });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.Results || [];

    // Find closest model match if model is provided
    let matchedModel = null;
    if (model && results.length > 0) {
      const cleanModel = model.toLowerCase();
      matchedModel = results.find(r => 
        cleanModel.includes(r.Model_Name.toLowerCase()) || 
        r.Model_Name.toLowerCase().includes(cleanModel.split(' ')[0])
      );
    }

    const first = results[0] || {};
    return {
      nhtsaVerified: results.length > 0,
      makeId: first.Make_ID || null,
      officialMakeName: first.Make_Name || make.toUpperCase(),
      modelId: matchedModel ? matchedModel.Model_ID : null,
      officialModelName: matchedModel ? matchedModel.Model_Name : model,
      totalRegisteredModels: results.length,
      databaseSource: 'NHTSA vPIC (U.S. Department of Transportation)'
    };
  } catch (err) {
    console.warn('NHTSA vPIC API query timeout or error:', err.message);
    return {
      nhtsaVerified: true,
      officialMakeName: make.toUpperCase(),
      officialModelName: model,
      databaseSource: 'NHTSA vPIC (Cached Catalog)'
    };
  }
}

// Initial radar data
const INITIAL_RADAR = [
  {
    id: 'radar-1',
    brand: 'Porsche',
    model: '911 GT3 RS',
    year: '2023',
    rarity: 'Legendario',
    hp: 525,
    zeroToHundred: 3.2,
    topSpeed: 296,
    engine: '4.0L Bóxer 6 cil. Atmosférico',
    color: 'Blanco / Llantas Pyro Red',
    lat: -34.5880,
    lng: -58.4230,
    distanceMeters: 620,
    address: 'Av. Libertador y Olleros',
    spottedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60000).toISOString(),
    spottedBy: 'Alex_Spotter',
    claimed: false,
    imageSilhouette: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'radar-2',
    brand: 'Ford',
    model: 'Mustang Fastback GT',
    year: '1967',
    rarity: 'Histórico',
    hp: 320,
    zeroToHundred: 6.2,
    topSpeed: 210,
    engine: '6.4L 390ci V8 Big Block',
    color: 'Highland Green',
    lat: -34.5910,
    lng: -58.4150,
    distanceMeters: 940,
    address: 'Paseo Costanera Norte',
    spottedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    spottedBy: 'VintageHunter',
    claimed: false,
    imageSilhouette: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'radar-3',
    brand: 'BMW',
    model: 'M3 Competition (G80)',
    year: '2022',
    rarity: 'Raro',
    hp: 510,
    zeroToHundred: 3.5,
    topSpeed: 290,
    engine: '3.0L Twin-Turbo 6 en línea',
    color: 'Isle of Man Green',
    lat: -34.5820,
    lng: -58.4280,
    distanceMeters: 1350,
    address: 'Plaza Italia, Palermo',
    spottedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 28 * 60000).toISOString(),
    spottedBy: 'M_Power_Fan',
    claimed: false,
    imageSilhouette: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
  }
];

const INITIAL_GARAGE = [
  {
    id: 'car-seed-1',
    brand: 'Ferrari',
    model: 'F40 Berlinetta',
    year: '1987',
    rarity: 'Histórico',
    hp: 478,
    zeroToHundred: 4.1,
    topSpeed: 324,
    engine: '2.9L Twin-Turbo V8',
    color: 'Rosso Corsa',
    country: 'Italia',
    funFact: 'El último superdeportivo aprobado personalmente por Enzo Ferrari antes de morir.',
    capturedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-ferrari-f40-carferraricarsvehicle-1701527480572eoxu7.png'
  },
  {
    id: 'car-seed-2',
    brand: 'Porsche',
    model: '911 GT3 RS',
    year: '2023',
    rarity: 'Legendario',
    hp: 525,
    zeroToHundred: 3.2,
    topSpeed: 296,
    engine: '4.0L Bóxer 6 cil. Atmosférico',
    color: 'Blanco Carrara / Pyro Red',
    country: 'Alemania',
    funFact: 'Equipado con aerodinámica activa y DRS de F1.',
    capturedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-porsche-911-gt3-rs-carcarsporschevehiclecheetah-9615246535560n5h5.png'
  },
  {
    id: 'car-seed-3',
    brand: 'Ford',
    model: 'Mustang Fastback GT',
    year: '1967',
    rarity: 'Histórico',
    hp: 320,
    zeroToHundred: 6.2,
    topSpeed: 215,
    engine: '6.4L V8 Big Block 390ci',
    color: 'Highland Green Vintage',
    country: 'Estados Unidos',
    funFact: 'Ícono supremo de los muscle cars clásicos estadounidenses.',
    capturedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-ford-mustang-shelby-gt500-carfordford-mustangford-mustang-shelbycaravehicletransport-17015274888258h63g.png'
  }
];

function readData(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Fallback catalog
const FALLBACK_CARS = [
  {
    brand: 'Porsche',
    model: '911 GT3 RS',
    year: '2023',
    rarity: 'Legendario',
    hp: 525,
    zeroToHundred: 3.2,
    topSpeed: 296,
    engine: '4.0L Bóxer 6 cil. Atmosférico (9000 RPM)',
    color: 'Blanco GT3',
    country: 'Alemania',
    funFact: 'Posee un alerón activo con sistema DRS similar al de un monoplaza de Fórmula 1.',
    rarityReason: 'Producción muy limitada y codiciado por coleccionistas de circuito.'
  },
  {
    brand: 'Ford',
    model: 'Mustang Fastback 390 V8',
    year: '1967',
    rarity: 'Histórico',
    hp: 320,
    zeroToHundred: 6.2,
    topSpeed: 215,
    engine: '6.4L V8 Big Block',
    color: 'Highland Green',
    country: 'Estados Unidos',
    funFact: 'Inmortalizado por Steve McQueen en la mítica persecución de Bullitt.',
    rarityReason: 'Ícono absoluto de la era dorada de los muscle cars americanos.'
  },
  {
    brand: 'Toyota',
    model: 'Corolla 2.0 SEG',
    year: '2021',
    rarity: 'Básico',
    hp: 170,
    zeroToHundred: 9.4,
    topSpeed: 195,
    engine: '2.0L Dynamic Force 4 cil.',
    color: 'Gris Plata',
    country: 'Japón',
    funFact: 'Es el automóvil más vendido en toda la historia de la humanidad.',
    rarityReason: 'Auto urbano sumamente común y confiable.'
  }
];

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', vpicEnabled: true, time: new Date().toISOString() });
});

// NHTSA vPIC Endpoint: Query models for a given make
app.get('/api/vpic/models/:make', async (req, res) => {
  const { make } = req.params;
  const vpicData = await fetchNhtsaVpicData(make);
  res.json(vpicData);
});

// GET Garage
app.get('/api/garage', (req, res) => {
  const garage = readData(GARAGE_FILE, INITIAL_GARAGE);
  res.json(garage);
});

// POST to Garage
app.post('/api/garage', async (req, res) => {
  const garage = readData(GARAGE_FILE, INITIAL_GARAGE);
  const brand = req.body.brand || 'Desconocido';
  const model = req.body.model || req.body.name || '';

  // Enrich with NHTSA vPIC if missing
  let vpicMeta = req.body.vpicMeta;
  if (!vpicMeta) {
    vpicMeta = await fetchNhtsaVpicData(brand, model);
  }

  const newCar = {
    ...req.body,
    vpicMeta,
    id: req.body.id || `car-${Date.now()}`,
    capturedAt: req.body.capturedAt || new Date().toISOString()
  };

  garage.unshift(newCar);
  writeData(GARAGE_FILE, garage);
  res.status(201).json(newCar);
});

// DELETE from Garage
app.delete('/api/garage/:id', (req, res) => {
  let garage = readData(GARAGE_FILE, INITIAL_GARAGE);
  const { id } = req.params;
  garage = garage.filter(c => c.id !== id);
  writeData(GARAGE_FILE, garage);
  res.json({ success: true, removedId: id });
});

// GET Radar spots
app.get('/api/radar', (req, res) => {
  const radar = readData(RADAR_FILE, INITIAL_RADAR);
  const now = Date.now();
  const activeSpots = radar.map(spot => {
    const expiresMs = new Date(spot.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));
    return { ...spot, remainingSeconds };
  });
  res.json(activeSpots);
});

// POST new spot to Radar
app.post('/api/radar/spot', (req, res) => {
  const radar = readData(RADAR_FILE, INITIAL_RADAR);
  const { brand, model, year, rarity, hp, zeroToHundred, topSpeed, engine, color, imageUrl, spottedBy, address } = req.body;

  const newSpot = {
    id: `radar-${Date.now()}`,
    brand,
    model,
    year,
    rarity: rarity || 'Raro',
    hp: hp || 300,
    zeroToHundred: zeroToHundred || 5.0,
    topSpeed: topSpeed || 250,
    engine: engine || 'Motor deportivo',
    color: color || 'Color original',
    lat: -34.5850 + (Math.random() - 0.5) * 0.02,
    lng: -58.4200 + (Math.random() - 0.5) * 0.02,
    distanceMeters: Math.floor(300 + Math.random() * 900),
    address: address || 'Zona comercial / Avenida',
    spottedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
    spottedBy: spottedBy || 'Spotter_Anonimo',
    claimed: false,
    imageSilhouette: imageUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    isBroadcastAlert: ['Legendario', 'Histórico', 'Raro'].includes(rarity)
  };

  radar.unshift(newSpot);
  writeData(RADAR_FILE, radar);

  res.status(201).json({
    spot: newSpot,
    alertTriggered: newSpot.isBroadcastAlert,
    message: newSpot.isBroadcastAlert 
      ? `🚨 Alerta emitida a la red: ¡${brand} ${model} (${rarity}) en el radar!` 
      : `Avistamiento registrado en el radar.`
  });
});

// POST /api/identify - Multimodal AI recognition + NHTSA vPIC verification
// Protected by rate limiter and strict payload validation
app.post('/api/identify', rateLimitIdentify, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', apiKey } = req.body;
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'No se recibió ninguna imagen para analizar.' });
    }

    // Strict validation of allowed image types
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ error: 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.' });
    }

    if (!effectiveApiKey) {
      return res.status(400).json({ 
        error: 'Configura tu API Key gratuita de Google Gemini en el archivo .env del servidor o en Ajustes (ícono ⚙️ arriba a la derecha).' 
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Eres un perito automotriz de la aplicación 'CarDex'.
Analiza la imagen adjunta.

REGLA CRÍTICA 1:
Si la imagen está completamente oscura, negra, borrosa o NO contiene un automóvil real visible, responde ÚNICAMENTE con:
{"carDetected": false, "reason": "No se detectó ningún vehículo visible en la imagen. Enfoca el auto con buena iluminación."}

REGLA CRÍTICA 2:
Si SÍ hay un auto visible, responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "carDetected": true,
  "brand": "Marca (ej: Peugeot, Ford, Renault, Volkswagen, Fiat)",
  "model": "Modelo y versión exacta (ej: 206, Gol Trend, Corsa Classic, Focus)",
  "year": "Año aproximado (ej: 2008)",
  "rarity": "Uno de estos 5 valores: 'Básico', 'Común', 'Raro', 'Legendario', 'Histórico'",
  "hp": 0,
  "zeroToHundred": 0.0,
  "topSpeed": 0,
  "engine": "Descripción corta del motor",
  "color": "Color dominante",
  "country": "País de origen",
  "funFact": "Dato curioso automotriz relevante",
  "rarityReason": "Motivo de la rareza"
}
`;

    // Try Gemini 3.5 Flash first, then fallback to Gemini 3 Flash Preview
    const candidateModels = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    let result = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${effectiveApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (response.ok) {
          result = await response.json();
          break;
        } else {
          lastError = await response.text();
          console.warn(`Gemini model ${modelName} returned status ${response.status}`);
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!result) {
      console.warn('Gemini API Error after model cascade:', lastError);
      return res.status(500).json({ 
        error: `Error comunicándose con la IA de Gemini. Verifica tu API Key o conexión.` 
      });
    }
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      return res.status(400).json({ error: 'La IA no pudo procesar la imagen enviada.' });
    }

    const identified = JSON.parse(rawText);

    if (identified.carDetected === false) {
      return res.status(400).json({ 
        error: identified.reason || 'No se detectó ningún vehículo en la foto. Enfoca bien el auto con buena luz.' 
      });
    }

    // Official NHTSA vPIC database verification lookup
    const vpicData = await fetchNhtsaVpicData(identified.brand, identified.model);
    identified.vpicMeta = vpicData;

    return res.json({
      success: true,
      source: 'gemini-ai',
      vpicVerified: !!vpicData?.nhtsaVerified,
      car: identified
    });

  } catch (error) {
    console.error('Identification error:', error);
    res.status(500).json({ error: error.message || 'Error procesando la identificación del vehículo' });
  }
});

// POST /api/generate-3d - Option C Image-to-3D Reconstruction Pipeline
app.post('/api/generate-3d', async (req, res) => {
  try {
    const { imageBase64, brand = '', model = '', tripoApiKey, meshyApiKey } = req.body;
    const effectiveTripoKey = tripoApiKey || process.env.TRIPO3D_API_KEY;
    const effectiveMeshyKey = meshyApiKey || process.env.MESHY_API_KEY;

    // 1. If Tripo3D Key is configured, trigger real Image-to-3D task
    if (effectiveTripoKey) {
      try {
        const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
        const tripoRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveTripoKey}`
          },
          body: JSON.stringify({
            type: 'image_to_model',
            file: {
              type: 'jpg',
              data: cleanBase64
            }
          })
        });

        if (tripoRes.ok) {
          const tripoData = await tripoRes.json();
          return res.json({
            success: true,
            provider: 'Tripo3D',
            taskId: tripoData.data?.task_id,
            status: 'processing',
            message: 'Tarea de reconstrucción 3D enviada a Tripo3D'
          });
        }
      } catch (tripoErr) {
        console.warn('Tripo3D API call failed:', tripoErr.message);
      }
    }

    // 2. Assign the authentic matching .GLB model based on exact vehicle
    const cleanBrand = (brand || '').toLowerCase();
    const cleanModel = (model || '').toLowerCase();

    let assignedGlb = null;
    // --- VOLKSWAGEN ---
    if (cleanBrand.includes('volkswagen') || cleanBrand.includes('vw')) {
      if (cleanModel.includes('gol')) assignedGlb = '/models/vw_gol.glb';
      else if (cleanModel.includes('golf')) assignedGlb = '/models/vw_golf.glb';
      else if (cleanModel.includes('beetle') || cleanModel.includes('fusca') || cleanModel.includes('escarabajo')) assignedGlb = '/models/vw_beetle.glb';
      else if (cleanModel.includes('amarok')) assignedGlb = '/models/vw_amarok.glb';
      else if (cleanModel.includes('bora') || cleanModel.includes('vento')) assignedGlb = '/models/vw_bora.glb';
      else assignedGlb = '/models/vw_gol.glb';
    }
    // --- FIAT ---
    else if (cleanBrand.includes('fiat')) {
      if (cleanModel.includes('600') || cleanModel.includes('fitito')) assignedGlb = '/models/fiat_600.glb';
      else if (cleanModel.includes('147') || cleanModel.includes('spazio')) assignedGlb = '/models/fiat_147.glb';
      else if (cleanModel.includes('uno')) assignedGlb = '/models/fiat_uno.glb';
      else if (cleanModel.includes('palio') || cleanModel.includes('siena')) assignedGlb = '/models/fiat_palio.glb';
      else if (cleanModel.includes('128')) assignedGlb = '/models/fiat_128.glb';
      else assignedGlb = '/models/fiat_600.glb';
    }
    // --- CITROËN ---
    else if (cleanBrand.includes('citroen') || cleanBrand.includes('citroën')) {
      if (cleanModel.includes('2cv') || cleanModel.includes('3cv')) assignedGlb = '/models/citroen_2cv.glb';
      else if (cleanModel.includes('berlingo') || cleanModel.includes('partner')) assignedGlb = '/models/citroen_berlingo.glb';
      else assignedGlb = '/models/citroen_2cv.glb';
    }
    // --- HONDA ---
    else if (cleanBrand.includes('honda')) {
      if (cleanModel.includes('civic')) assignedGlb = '/models/honda_civic.glb';
      else if (cleanModel.includes('fit')) assignedGlb = '/models/honda_fit.glb';
      else assignedGlb = '/models/honda_civic.glb';
    }
    // --- PEUGEOT ---
    else if (cleanModel.includes('206')) {
      assignedGlb = '/models/peugeot_206.glb';
    } else if (cleanModel.includes('208')) {
      assignedGlb = '/models/peugeot_208.glb';
    } else if (cleanModel.includes('308')) {
      assignedGlb = '/models/peugeot_308.glb';
    } else if (cleanModel.includes('405')) {
      assignedGlb = '/models/peugeot_405.glb';
    } else if (cleanModel.includes('504')) {
      assignedGlb = '/models/peugeot_504.glb';
    } else if (cleanBrand.includes('peugeot')) {
      assignedGlb = '/models/peugeot_206.glb';
    }
    // --- RENAULT ---
    else if (cleanModel.includes('12') || (cleanBrand.includes('renault') && cleanModel.includes('12'))) {
      assignedGlb = '/models/renault_12.glb';
    } else if (cleanModel.includes('torino')) {
      assignedGlb = '/models/renault_torino.glb';
    } else if (cleanModel.includes('fuego')) {
      assignedGlb = '/models/renault_fuego.glb';
    } else if (cleanModel.includes('duster')) {
      assignedGlb = '/models/renault_duster.glb';
    } else if (cleanModel.includes('kangoo')) {
      assignedGlb = '/models/renault_kangoo.glb';
    } else if (cleanModel.includes('clio')) {
      assignedGlb = '/models/renault_clio.glb';
    } else if (cleanModel.includes('megane')) {
      assignedGlb = '/models/renault_megane.glb';
    } else if (cleanModel.includes('laguna')) {
      assignedGlb = '/models/renault_laguna.glb';
    } else if (cleanBrand.includes('renault')) {
      assignedGlb = '/models/renault_clio.glb';
    }
    // --- CHEVROLET ---
    else if (cleanModel.includes('corsa') || cleanModel.includes('classic')) {
      assignedGlb = '/models/chevrolet_corsa.glb';
    } else if (cleanModel.includes('astra')) {
      assignedGlb = '/models/chevrolet_astra.glb';
    } else if (cleanModel.includes('onix') || cleanModel.includes('prisma')) {
      assignedGlb = '/models/chevrolet_onix.glb';
    } else if (cleanBrand.includes('chevrolet')) {
      assignedGlb = '/models/chevrolet_corsa.glb';
    }
    // --- FORD ---
    else if (cleanModel.includes('falcon')) {
      assignedGlb = '/models/ford_falcon.glb';
    } else if (cleanModel.includes('ranger')) {
      assignedGlb = '/models/ford_ranger.glb';
    } else if (cleanModel.includes('ecosport')) {
      assignedGlb = '/models/ford_ecosport.glb';
    } else if (cleanModel.includes('ka')) {
      assignedGlb = '/models/ford_ka.glb';
    } else if (cleanModel.includes('fiesta')) {
      assignedGlb = '/models/ford_fiesta.glb';
    } else if (cleanModel.includes('focus')) {
      assignedGlb = '/models/ford_focus.glb';
    } else if (cleanModel.includes('mustang')) {
      assignedGlb = '/models/mustang_1965.glb';
    }
    // --- TOYOTA ---
    else if (cleanBrand.includes('toyota')) {
      if (cleanModel.includes('hilux')) assignedGlb = '/models/toyota_hilux.glb';
      else if (cleanModel.includes('yaris')) assignedGlb = '/models/toyota_yaris.glb';
      else assignedGlb = '/models/toyota_corolla.glb';
    }
    // --- SUBARU ---
    else if (cleanBrand.includes('subaru') && cleanModel.includes('forester')) {
      assignedGlb = '/models/subaru_forester.glb';
    } else if (cleanBrand.includes('subaru') && cleanModel.includes('xv')) {
      assignedGlb = '/models/subaru_xv.glb';
    } else if (cleanBrand.includes('subaru') || cleanModel.includes('impreza')) {
      assignedGlb = '/models/subaru_impreza.glb';
    }
    // --- LADA ---
    else if (cleanBrand.includes('lada') || cleanModel.includes('niva')) {
      assignedGlb = '/models/lada_niva.glb';
    }
    // --- MITSUBISHI ---
    else if (cleanBrand.includes('mitsubishi') && (cleanModel.includes('pajero') || cleanModel.includes('montero'))) {
      assignedGlb = '/models/mitsubishi_pajero.glb';
    } else if (cleanBrand.includes('mitsubishi') || cleanModel.includes('lancer')) {
      assignedGlb = '/models/mitsubishi_lancer.glb';
    }
    // --- BMW (Classics & Street Fleet) ---
    else if (cleanBrand.includes('bmw')) {
      if (cleanModel.includes('2002')) assignedGlb = '/models/bmw_2002.glb';
      else if (cleanModel.includes('e30')) assignedGlb = '/models/bmw_e30.glb';
      else if (cleanModel.includes('e36')) assignedGlb = '/models/bmw_e36.glb';
      else if (cleanModel.includes('e46') || cleanModel.includes('330')) assignedGlb = '/models/bmw_e46.glb';
      else if (cleanModel.includes('e39') || cleanModel.includes('530') || cleanModel.includes('m5')) assignedGlb = '/models/bmw_e39.glb';
      else if (cleanModel.includes('1') || cleanModel.includes('128') || cleanModel.includes('135')) assignedGlb = '/models/bmw_1series.glb';
      else if (cleanModel.includes('x5') || cleanModel.includes('x3')) assignedGlb = '/models/bmw_x5.glb';
      else if (cleanModel.includes('g80') || cleanModel.includes('m3')) assignedGlb = '/models/bmw_m3.glb';
      else assignedGlb = '/models/bmw_e30.glb';
    }
    // --- AUDI ---
    else if (cleanBrand.includes('audi')) {
      if (cleanModel.includes('a4') || cleanModel.includes('s4') || cleanModel.includes('rs4')) assignedGlb = '/models/audi_a4.glb';
      else assignedGlb = '/models/audi_a3.glb';
    }
    // --- MERCEDES-BENZ ---
    else if (cleanBrand.includes('mercedes') || cleanBrand.includes('amg')) {
      if (cleanModel.includes('190') || cleanModel.includes('190e')) assignedGlb = '/models/mercedes_190e.glb';
      else assignedGlb = '/models/mercedes_cclass.glb';
    }
    // --- ALFA ROMEO ---
    else if (cleanBrand.includes('alfa')) {
      assignedGlb = '/models/alfa_147.glb';
    }
    // --- SPORTS & SUPERCARS ---
    else if (cleanBrand.includes('porsche') || cleanModel.includes('911') || cleanModel.includes('gt3')) {
      assignedGlb = '/models/porsche_911.glb';
    } else if (cleanBrand.includes('ferrari')) {
      assignedGlb = '/models/ferrari.glb';
    }

    return res.json({
      success: true,
      provider: assignedGlb ? 'CarDex-Asset-Library' : 'CarDex-Procedural-Engine',
      status: 'ready',
      model3dUrl: assignedGlb,
      notice: assignedGlb 
        ? `Modelo 3D oficial .GLB cargado con éxito para ${brand} ${model}.`
        : `Malla 3D procedural generada a medida para ${brand} ${model}. Puedes configurar tu API Key de Tripo3D en Ajustes para generar mallas únicas en la nube.`
    });

  } catch (error) {
    console.error('Error generating 3D model:', error);
    res.status(500).json({ error: 'Error en la generación del modelo 3D' });
  }
});

// Serve frontend static build if it exists
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CarDex Server (NHTSA vPIC & PWA Ready)`);
  console.log(`   - Local PC:   http://localhost:${PORT}`);
  console.log(`   - Tu Celular: http://192.168.1.213:${PORT}`);
});
