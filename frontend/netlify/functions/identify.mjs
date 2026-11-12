// Netlify Serverless Function for CarLog AI Vehicle Identification
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DAILY_SCAN_LIMIT = 15;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function checkAndConsumeDailyQuota(authHeader) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { enforced: false, allowed: true, quota: null };
  }

  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      enforced: true,
      allowed: false,
      statusCode: 401,
      error: 'Inicia sesión en CarLog para usar el escáner IA (15 escaneos gratis por día).'
    };
  }

  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_daily_scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ max_scans: DAILY_SCAN_LIMIT })
  });

  if (rpcRes.status === 401) {
    return {
      enforced: true,
      allowed: false,
      statusCode: 401,
      error: 'Tu sesión expiró. Vuelve a iniciar sesión para escanear.'
    };
  }

  if (!rpcRes.ok) {
    const errText = await rpcRes.text().catch(() => '');
    // If SQL function wasn't created yet in Supabase, avoid breaking until user runs schema.sql
    if (rpcRes.status === 404 || errText.includes('consume_daily_scan')) {
      console.warn('consume_daily_scan RPC missing in Supabase; skipping quota check until schema.sql is applied.');
      return { enforced: false, allowed: true, quota: null };
    }
    return {
      enforced: true,
      allowed: false,
      statusCode: 401,
      error: 'No se pudo validar tu sesión. Inicia sesión nuevamente.'
    };
  }

  const quota = await rpcRes.json();
  if (!quota?.allowed) {
    if (quota?.reason === 'AUTH_REQUIRED') {
      return {
        enforced: true,
        allowed: false,
        statusCode: 401,
        error: 'Inicia sesión para usar el escáner IA.'
      };
    }
    return {
      enforced: true,
      allowed: false,
      statusCode: 429,
      quota,
      error: `Alcanzaste el límite de ${DAILY_SCAN_LIMIT} escaneos por hoy. Vuelve mañana o usa tu propia Gemini API Key en Ajustes.`
    };
  }

  return { enforced: true, allowed: true, quota };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', apiKey } = JSON.parse(event.body || '{}');
    const customApiKey = (apiKey || '').trim();
    const effectiveKey = customApiKey || GEMINI_API_KEY;

    if (!effectiveKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Falta configurar GEMINI_API_KEY en Netlify o enviarla desde Ajustes.' })
      };
    }

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No se recibió ninguna imagen para analizar.' })
      };
    }

    // Enforce 15/day quota only when using the app owner's GEMINI_API_KEY
    let quotaInfo = null;
    if (!customApiKey) {
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const quotaCheck = await checkAndConsumeDailyQuota(authHeader);
      if (!quotaCheck.allowed) {
        return {
          statusCode: quotaCheck.statusCode || 429,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: quotaCheck.error,
            quota: quotaCheck.quota || null
          })
        };
      }
      quotaInfo = quotaCheck.quota;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Eres un perito automotriz de la aplicación 'CarLog'.
Analiza la imagen adjunta.

REGLA CRÍTICA 1:
Si la imagen está completamente oscura, negra, borrosa o NO contiene un automóvil real visible, responde ÚNICAMENTE con:
{"carDetected": false, "reason": "No se detectó ningún vehículo visible en la imagen. Enfoca el auto con buena iluminación."}

REGLA CRÍTICA 2:
Si SÍ hay un auto visible, responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "carDetected": true,
  "brand": "Marca (ej: Peugeot, Ford, Renault, Volkswagen, Fiat, BMW)",
  "model": "Modelo y versión exacta (ej: 206, Gol Trend, Corsa Classic, Focus, 330i)",
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

    const candidateModels = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    let result = null;
    let lastStatus = 500;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${effectiveKey}`, {
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

        lastStatus = response.status;
        if (response.ok) {
          result = await response.json();
          break;
        }
        if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429) {
          break;
        }
      } catch {
        // Try next candidate model on transient network error
      }
    }

    if (!result) {
      return {
        statusCode: lastStatus === 429 ? 429 : 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: lastStatus === 429
            ? 'El servicio de IA está momentáneamente saturado. Intenta nuevamente en unos segundos.'
            : 'Error comunicándose con la IA de Gemini. Verifica tu conexión.'
        })
      };
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'La IA no pudo procesar la imagen enviada.' })
      };
    }

    const identified = JSON.parse(rawText);

    if (identified.carDetected === false) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: identified.reason || 'No se detectó ningún vehículo en la foto.' })
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        car: identified,
        quota: quotaInfo
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Error interno del servidor.' })
    };
  }
}
