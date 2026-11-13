import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, Aperture, ScanLine } from 'lucide-react';
import confetti from 'canvas-confetti';
import CarCard from './CarCard';
import { sound } from '../utils/audio';
import { compressImage } from '../utils/imageUtils';
import { getSupabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { getCurrentSession } from '../utils/auth';

const DAILY_SCAN_LIMIT = 15;

export default function ScannerView({ onSaveToGarage, savedCarIds, onBroadcastToRadar, initialPreset }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [identifiedCar, setIdentifiedCar] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);

  const hasCustomKey = Boolean((localStorage.getItem('cardex_gemini_key') || '').trim());

  // Load user's remaining daily scan count on mount
  useEffect(() => {
    let mounted = true;
    async function loadQuota() {
      const supabase = getSupabase();
      if (!supabase || !isSupabaseConfigured()) return;
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id;
        if (!uid) return;
        const todayUtc = new Date().toISOString().slice(0, 10);
        const { data } = await supabase
          .from('daily_scan_usage')
          .select('scan_count')
          .eq('user_id', uid)
          .eq('scan_date', todayUtc)
          .maybeSingle();
        if (mounted) {
          const used = data?.scan_count || 0;
          setQuotaInfo({
            used,
            remaining: Math.max(0, DAILY_SCAN_LIMIT - used),
            limit: DAILY_SCAN_LIMIT
          });
        }
      } catch {}
    }
    loadQuota();
    return () => { mounted = false; };
  }, []);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // If initial preset is passed (e.g. from Radar "Reclamar"), load it immediately
  useEffect(() => {
    if (initialPreset) {
      setImagePreview(initialPreset.imageUrl || initialPreset.imageSilhouette);
      setIdentifiedCar(initialPreset);
      sound.playEngineRev();
    }
  }, [initialPreset]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Effect to attach stream to video element when cameraActive becomes true
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Auto-play was prevented:', err);
        });
      }
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara en vivo requiere contexto seguro (HTTPS). Usa el botón "Tomar Foto con Cámara HD".');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (errFacing) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Permiso denegado o cámara no disponible. Asegúrate de habilitar el permiso de cámara.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Verify image is not pitch black
    try {
      const sample = ctx.getImageData(0, 0, Math.min(60, canvas.width), Math.min(60, canvas.height)).data;
      let total = 0;
      for (let i = 0; i < sample.length; i += 4) {
        total += sample[i] + sample[i + 1] + sample[i + 2];
      }
      const avg = total / ((sample.length / 4) * 3);
      if (avg < 5) {
        setCameraError('La cámara tomó una foto completamente oscura/negra. Toca "Cámara HD" para usar el sensor nativo de tu teléfono.');
        return;
      }
    } catch (e) {}

    sound.playCameraClick();
    const rawBase64 = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    compressImage(rawBase64, { maxDim: 1080, quality: 0.78 })
      .then((compressed) => {
        setImagePreview(compressed);
        identifyVehicle(compressed);
      })
      .catch(() => {
        setImagePreview(rawBase64);
        identifyVehicle(rawBase64);
      });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    sound.playCameraClick();
    try {
      const compressed = await compressImage(file, { maxDim: 1080, quality: 0.78 });
      setImagePreview(compressed);
      identifyVehicle(compressed);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setImagePreview(base64);
        identifyVehicle(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Client-side Direct AI fallback for static Netlify hosting
  const identifyDirectWithGemini = async (base64OrUrl) => {
    const apiKey = (localStorage.getItem('cardex_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('Falta configurar tu Gemini API Key en Ajustes (o GEMINI_API_KEY en Netlify Functions).');
    }
    const cleanBase64 = base64OrUrl.replace(/^data:image\/\w+;base64,/, '');

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
  "brand": "Marca (ej: Peugeot, Ford, Renault, Volkswagen, Fiat, BMW, Toyota)",
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
    for (const model of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
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
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.carDetected === false) {
              throw new Error(parsed.reason || 'No se detectó ningún vehículo visible en la imagen.');
            }
            return parsed;
          }
        }
      } catch (e) {
        if (e.message && e.message.includes('No se detectó ningún vehículo')) throw e;
      }
    }
    throw new Error('No se pudo identificar el vehículo con la IA. Verifica tu conexión.');
  };

  const identifyVehicle = async (base64OrUrl, presetData = null) => {
    setAnalyzing(true);
    setIdentifiedCar(null);
    setCameraError(null);

    await new Promise(r => setTimeout(r, 1000));

    try {
      if (presetData) {
        setIdentifiedCar({ ...presetData, imageUrl: base64OrUrl });
        triggerCelebration(presetData.rarity);
      } else {
        let carData = null;
        const customKey = (localStorage.getItem('cardex_gemini_key') || '').trim();
        let accessToken = '';
        const supabase = getSupabase();
        if (supabase && isSupabaseConfigured()) {
          const { data: sessData } = await supabase.auth.getSession().catch(() => ({ data: null }));
          accessToken = sessData?.session?.access_token || '';
        }

        // 1. Try local or configured server endpoint first
        let serverRespondedJson = false;
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

          const res = await fetch('/api/identify', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              imageBase64: base64OrUrl,
              mimeType: 'image/jpeg',
              ...(customKey ? { apiKey: customKey } : {})
            })
          });

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            serverRespondedJson = true;
            const json = await res.json();
            if (json.quota) setQuotaInfo(json.quota);

            if (res.ok && json.car) {
              carData = json.car;
            } else if (res.status === 401 || res.status === 429 || res.status === 400) {
              throw new Error(json.error || 'No se pudo identificar el vehículo.');
            }
          }
        } catch (serverErr) {
          if (serverRespondedJson) throw serverErr;
          console.warn('Backend endpoint unavailable, falling back to direct AI...', serverErr);
        }

        // 2. Fallback to direct Gemini only if server endpoint isn't active and user/env has a key
        if (!carData) {
          carData = await identifyDirectWithGemini(base64OrUrl);
        }

        const car = {
          ...carData,
          imageUrl: base64OrUrl,
          id: `car-${Date.now()}`
        };
        setIdentifiedCar(car);
        triggerCelebration(car.rarity);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setCameraError(err.message || 'Error al analizar la imagen.');
      setImagePreview(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerCelebration = (rarity) => {
    sound.playEngineRev();
    if (['Legendario', 'Histórico'].includes(rarity)) {
      sound.playLegendaryFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSave = (car) => {
    onSaveToGarage(car);
    setToastMessage(`${car.brand} ${car.model} guardado en tu Garage`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBroadcast = async (car) => {
    const supabase = getSupabase();
    const session = getCurrentSession();
    const spotPayload = {
      id: `spot-${Date.now()}`,
      brand: car.brand,
      model: car.model || car.name || 'Modelo',
      year: car.year ? String(car.year) : '',
      rarity: car.rarity || 'Raro',
      hp: Number(car.hp) || 0,
      zeroToHundred: Number(car.zeroToHundred) || 0,
      topSpeed: Number(car.topSpeed) || 0,
      engine: car.engine || '',
      color: car.color || '',
      imageUrl: car.imageUrl || '',
      spottedBy: session?.username || 'Tú (Spotter Oficial)'
    };

    if (supabase && isSupabaseConfigured() && session?.provider === 'supabase') {
      try {
        const { error } = await supabase.from('radar_spots').insert({
          id: spotPayload.id,
          user_id: session.id,
          brand: spotPayload.brand,
          model: spotPayload.model,
          year: spotPayload.year,
          rarity: spotPayload.rarity,
          hp: spotPayload.hp,
          zero_to_hundred: spotPayload.zeroToHundred,
          top_speed: spotPayload.topSpeed,
          engine: spotPayload.engine,
          color: spotPayload.color,
          image_silhouette: spotPayload.imageUrl,
          spotted_by: spotPayload.spottedBy,
          address: 'Avistamiento Comunitario',
          distance_meters: Math.floor(150 + Math.random() * 800)
        });
        if (!error) {
          sound.playRadarPing();
          setToastMessage(`Alerta enviada al Radar Cloud para ${car.brand} ${car.model}`);
          setTimeout(() => setToastMessage(null), 4000);
          return;
        }
      } catch (e) {
        console.warn('Supabase broadcast fallback:', e);
      }
    }

    try {
      const res = await fetch('/api/radar/spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spotPayload)
      });
      if (res.ok) {
        sound.playRadarPing();
        setToastMessage(`Alerta de proximidad lanzada para ${car.brand} ${car.model}`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
    } catch (e) {
      console.warn('Local backend radar unreachable:', e);
    }

    setToastMessage('Conecta Supabase o el servidor local para compartir alertas en vivo.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-fade-in pb-2">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#121620]/95 text-white font-semibold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-500/40 backdrop-blur-xl animate-fade-in max-w-[90vw]"
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Main Optical Viewfinder / Capture Bay */}
      <div className="relative rounded-3xl cl-card cl-microgrid p-4 sm:p-5 overflow-hidden">
        {/* Subtle Top Optical Accent */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-red-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/12 border border-red-500/30 flex items-center justify-center text-red-400">
              <Aperture className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-telemetry uppercase tracking-widest text-[var(--cl-text-muted)] block leading-none">
                OPTICAL ID // GEMINI VISION
              </span>
              <h2 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight leading-none mt-1">
                Escáner de Calle
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasCustomKey ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-telemetry text-emerald-300 font-semibold uppercase">
                API Propia · Ilimitado
              </span>
            ) : quotaInfo ? (
              <span
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-telemetry font-semibold uppercase ${
                  quotaInfo.remaining <= 3
                    ? 'bg-red-500/12 border-red-500/35 text-red-300'
                    : 'cl-panel text-zinc-300'
                }`}
              >
                Hoy: {String(quotaInfo.remaining).padStart(2, '0')}/{quotaInfo.limit}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg cl-panel text-[10px] text-zinc-400 font-telemetry uppercase">
                15 escaneos/día
              </span>
            )}
          </div>
        </div>

        {/* Viewfinder Frame with Corner Brackets */}
        <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-[#06080c] border border-white/[0.11] flex flex-col items-center justify-center overflow-hidden shadow-inner">
          {/* Precision Viewfinder Corner Brackets */}
          <span className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/30 z-20" />
          <span className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/30 z-20" />
          <span className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/30 z-20" />
          <span className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/30 z-20" />

          {/* Top Viewfinder HUD Status */}
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full bg-black/65 border border-white/10 backdrop-blur-md flex items-center gap-1.5 text-[9px] font-telemetry text-zinc-300 uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-red-500 animate-pulse' : analyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>{cameraActive ? 'VISOR ACTIVO' : analyzing ? 'ANALIZANDO' : 'LISTO PARA CAPTURA'}</span>
          </div>

          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-[#06080c]"
                onLoadedMetadata={(e) => {
                  e.target.play().catch(console.warn);
                }}
              />
              {/* Optical Laser Scanline */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.85)] animate-scanline pointer-events-none z-10" />

              {/* Shutter Button Overlay */}
              <div className="absolute bottom-5 flex items-center gap-4 z-20">
                <button
                  onClick={takeSnapshot}
                  aria-label="Capturar foto"
                  className="w-16 h-16 rounded-full p-1 border-2 border-white/80 bg-black/40 backdrop-blur-md active:scale-95 transition-transform shadow-2xl flex items-center justify-center"
                >
                  <span className="w-full h-full rounded-full bg-red-600 hover:bg-red-500 transition-colors flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-black/75 hover:bg-black text-xs font-semibold text-zinc-200 border border-white/15 backdrop-blur-md transition active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : imagePreview ? (
            <div className="relative w-full h-full flex items-center justify-center bg-[#06080c]">
              <img
                src={imagePreview}
                alt="Vehículo capturado"
                className="w-full h-full object-contain"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-[#06080c]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
                  <div className="relative w-14 h-14 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/25" />
                    <div className="w-14 h-14 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <ScanLine className="w-5 h-5 text-red-400 absolute" />
                  </div>
                  <h4 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
                    Identificando Vehículo
                  </h4>
                  <p className="text-[11px] font-telemetry text-zinc-400 mt-1 max-w-xs uppercase tracking-wider">
                    Marca · Carrocería · Potencia · Rareza
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center px-5 py-6 space-y-4 max-w-md relative z-10">
              <div className="w-14 h-14 rounded-2xl cl-pill flex items-center justify-center mx-auto text-zinc-200">
                <Camera className="w-6 h-6 text-red-400" />
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-extrabold uppercase text-white tracking-tight">
                  Apunta al vehículo
                </h3>
                <p className="text-xs text-[var(--cl-text-secondary)] leading-relaxed">
                  Detecta marca, modelo, especificaciones técnicas y categoría de colección al instante.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-[#08090c] shadow-[0_8px_20px_rgba(255,255,255,0.12)] flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  title="Abre la cámara oficial de tu teléfono (ideal para fotos de noche o en la calle)"
                >
                  <Camera className="w-4 h-4 text-red-600" />
                  <span>Cámara HD</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={startCamera}
                    className="min-h-[42px] px-3.5 py-2.5 rounded-xl font-semibold text-xs cl-pill hover:bg-[#232838] text-zinc-200 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                  >
                    <Aperture className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Visor Live</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[42px] px-3.5 py-2.5 rounded-xl font-semibold text-xs cl-pill hover:bg-[#232838] text-zinc-200 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Galería</span>
                  </button>
                </div>
              </div>

              {cameraError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-950/70 border border-red-500/45 text-xs text-red-200 text-left flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Native phone camera input */}
          <input
            type="file"
            ref={nativeCameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* File picker for gallery upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Retake / Change Photo Controls */}
        {imagePreview && !analyzing && (
          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() => {
                setImagePreview(null);
                setIdentifiedCar(null);
                stopCamera();
              }}
              className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-white/[0.05] active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Escanear otro</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition py-1 px-2 rounded-lg hover:bg-white/[0.05] active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir otra foto</span>
            </button>
          </div>
        )}
      </div>

      {/* Identified Card Result */}
      {identifiedCar && (
        <div className="mt-4 animate-fade-in">
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/35 text-emerald-300 font-telemetry text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Vehículo Identificado
            </span>
          </div>

          <CarCard
            car={identifiedCar}
            onSave={handleSave}
            isSaved={savedCarIds.has(identifiedCar.id || `${identifiedCar.brand}-${identifiedCar.model}`)}
            onBroadcast={handleBroadcast}
          />
        </div>
      )}
    </div>
  );
}
