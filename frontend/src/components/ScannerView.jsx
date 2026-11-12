import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';
import CarCard from './CarCard';
import { sound } from '../utils/audio';
import { SAMPLE_CARS } from '../utils/demoData';
import { compressImage } from '../utils/imageUtils';
import { getSupabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { getCurrentSession } from '../utils/auth';

export default function ScannerView({ onSaveToGarage, savedCarIds, onBroadcastToRadar, initialPreset }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [identifiedCar, setIdentifiedCar] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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
        throw new Error('La cámara en vivo requiere contexto seguro (HTTPS). ¡Usa el botón "Tomar Foto con Cámara HD"!');
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      // Constraints with fallback for desktop integrated cameras and mobile rear cameras
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
        // Fallback without facingMode for laptops/PCs
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Permiso denegado o cámara no disponible. Asegurate de habilitar el permiso de cámara.');
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
        setCameraError('La cámara tomó una foto completamente oscura/negra. Toca "Cámara Nativa HD" para usar la cámara de tu teléfono con sensor.');
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

  const handleDemoPreset = (preset) => {
    setCameraError(null);
    sound.playCameraClick();
    setImagePreview(preset.image);
    stopCamera();
    identifyVehicle(preset.image, preset.data);
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

    // Scanning delay
    await new Promise(r => setTimeout(r, 1000));

    try {
      if (presetData) {
        setIdentifiedCar({ ...presetData, imageUrl: base64OrUrl });
        triggerCelebration(presetData.rarity);
      } else {
        let carData = null;

        // 1. Try local or configured server endpoint first
        try {
          const res = await fetch('/api/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64OrUrl,
              mimeType: 'image/jpeg'
            })
          });

          if (res.ok) {
            const json = await res.json();
            if (json.car) carData = json.car;
          }
        } catch (serverErr) {
          console.warn('Backend endpoint unavailable, falling back to direct AI...', serverErr);
        }

        // 2. If running on Netlify Drop static hosting without active backend, call Gemini directly
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
    setToastMessage(`¡${car.brand} ${car.model} guardado en tu Garage! 🏎️`);
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
          setToastMessage(`🚨 ¡Alerta enviada al Radar Cloud para ${car.brand} ${car.model}!`);
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
        setToastMessage(`🚨 ¡Alerta de proximidad lanzada para ${car.brand} ${car.model}!`);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          {toastMessage}
        </div>
      )}

      {/* Main Viewfinder / Capture Box */}
      <div className="relative rounded-3xl bg-[#10121d] border border-white/10 p-5 shadow-2xl overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">Captura y Reconocimiento IA</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">CarLog Vision v2.0</span>
        </div>

        {/* Viewfinder Window */}
        <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-black border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center overflow-hidden">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
                onLoadedMetadata={(e) => {
                  e.target.play().catch(console.warn);
                }}
              />
              {/* Laser Scanline */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-scanline pointer-events-none"></div>

              {/* Shutter Button Overlay */}
              <div className="absolute bottom-6 flex items-center gap-4 z-20">
                <button
                  onClick={takeSnapshot}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-2xl flex items-center justify-center"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black text-xs font-semibold text-zinc-300 backdrop-blur-md"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : imagePreview ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={imagePreview}
                alt="Captured Car"
                className="w-full h-full object-contain"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h4 className="text-lg font-bold text-white tracking-wide">
                    Identificando Vehículo con IA...
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    Reconociendo marca, generación de carrocería, año, potencia y rareza de colección.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Camera className="w-8 h-8 text-zinc-300" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Apunta tu cámara a cualquier auto</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                  La IA detectará el modelo exacto, ficha técnica completa y le asignará su categoría de rareza como si fuera un Pokémon.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95"
                  title="Abre la cámara oficial de tu teléfono (ideal para fotos de noche o en la calle)"
                >
                  <Camera className="w-4 h-4" />
                  Tomar Foto con Cámara HD
                </button>

                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 flex items-center gap-2 transition active:scale-95"
                >
                  <Camera className="w-4 h-4 text-zinc-400" />
                  Visor Web en Vivo
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 flex items-center gap-2 transition active:scale-95"
                >
                  <Upload className="w-4 h-4 text-zinc-400" />
                  Galería
                </button>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 max-w-md mx-auto text-left flex items-start gap-2 shadow-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Native phone camera input (always works over HTTP / HTTPS / Android / iOS) */}
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
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => {
                setImagePreview(null);
                setIdentifiedCar(null);
                stopCamera();
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Escanear otro vehículo
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Subir otra foto
            </button>
          </div>
        )}
      </div>

      {/* Identified Card Result */}
      {identifiedCar && (
        <div className="mt-6 animate-fade-in">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              ¡Vehículo Identificado con Éxito!
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

