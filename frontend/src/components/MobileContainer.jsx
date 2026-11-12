import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Zap, Shield, Gauge, Target, 
  MapPin, Heart, Settings, Camera, Award, Radio, Check, 
  BookOpen, Warehouse, Sparkles, Smartphone, Download, Layers, Flame, User, LogOut
} from 'lucide-react';
import { POKEDEX_CARS } from '../utils/demoData';

export default function MobileContainer({ 
  activeTab, 
  onTabChange, 
  garage = [], 
  onSaveToGarage, 
  savedIds = new Set(),
  onOpenSettings,
  user,
  onOpenAuth,
  onLogout,
  renderGarageContent,
  renderScannerContent,
  renderRadarContent,
  renderProfileContent
}) {
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [likedCars, setLikedCars] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setToast('¡CarDex instalada en tu dispositivo! 📱');
      }
      setDeferredPrompt(null);
    } else {
      setToast('En tu navegador móvil toca el menú (⋮) y selecciona "Instalar aplicación" 📲');
      setTimeout(() => setToast(null), 4500);
    }
  };

  const car = POKEDEX_CARS[currentCarIndex];
  const isSaved = savedIds.has(car.id) || savedIds.has(`${car.brand}-${car.name}`);
  const isLiked = likedCars.has(car.id);

  const nextCar = () => {
    setCurrentCarIndex((prev) => (prev + 1) % POKEDEX_CARS.length);
  };

  const prevCar = () => {
    setCurrentCarIndex((prev) => (prev - 1 + POKEDEX_CARS.length) % POKEDEX_CARS.length);
  };

  const handleCapture = () => {
    onSaveToGarage({
      id: car.id,
      brand: car.brand,
      model: car.name,
      year: car.year,
      rarity: car.rarity,
      hp: car.hp,
      zeroToHundred: parseFloat(car.zeroToHundred),
      topSpeed: parseInt(car.topSpeed),
      engine: car.engine,
      color: car.color,
      imageUrl: car.image,
      funFact: car.description
    });
    setToast(`¡${car.brand} ${car.name} guardado en tu Garage! 🏎️`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-0 sm:py-3 sm:px-2 select-none min-h-screen w-full bg-[#050608] text-zinc-100">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 z-50 px-4 py-2 rounded-full bg-zinc-900/90 text-white font-medium text-xs shadow-2xl border border-zinc-700/80 backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main App Canvas: Edge-to-edge on mobile, sleek bezel on tablet/desktop */}
      <div className="relative w-full sm:max-w-md md:max-w-lg h-screen sm:h-[94vh] sm:max-h-[920px] sm:rounded-[36px] bg-[#090b10] shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-0 sm:border border-zinc-800/80 overflow-hidden flex flex-col justify-between">
        
        {/* Subtle Ambient Studio Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-blue-600/10 via-zinc-500/5 to-transparent blur-2xl pointer-events-none"></div>

        {/* Minimalist Top App Bar */}
        <header className="relative z-30 pt-3 pb-2 px-5 flex items-center justify-between border-b border-white/[0.06] bg-[#090b10]/80 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
              <span className="font-black text-xs tracking-tighter">CL</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-white">CarLog</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">OS</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Auto Spotter & Taller 3D</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Profile / Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-zinc-800/80 pl-2 pr-1 py-1 rounded-xl border border-zinc-700/60">
                <span className="text-[11px] font-bold text-zinc-200 max-w-[80px] truncate">{user.username}</span>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-lg bg-white text-black font-bold text-[11px] hover:bg-zinc-200 transition active:scale-95 shadow-sm flex items-center gap-1"
              >
                <User className="w-3 h-3" />
                <span>Entrar</span>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                title="Instalar App en Celular"
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <Smartphone className="w-3 h-3 text-zinc-300" />
                <span>Instalar</span>
              </button>
            )}

            <button 
              onClick={onOpenSettings}
              title="Ajustes de API"
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic App Tab Body */}
        <main className="relative z-20 flex-1 flex flex-col overflow-hidden">
          {/* TAB 1: CARDEX SHOWCASE */}
          {activeTab === 'cardex' && (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
              
              {/* Car Carousel Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {POKEDEX_CARS.map((c, idx) => {
                  const active = idx === currentCarIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCurrentCarIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        active
                          ? 'bg-white text-black shadow-lg shadow-white/10'
                          : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-zinc-900' : 'bg-zinc-600'}`}></span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modern Vehicle Stage Card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-[#12151e] to-[#0c0d14] border border-white/[0.08] p-5 shadow-2xl flex-1 flex flex-col justify-between my-2 overflow-hidden">
                {/* Background Spec Details Watermark */}
                <div className="absolute right-3 top-3 text-[56px] font-black text-white/[0.03] select-none pointer-events-none font-mono">
                  {car.year}
                </div>

                {/* Card Header Info */}
                <div className="flex items-start justify-between z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/[0.08] text-zinc-300 font-bold border border-white/[0.05]">
                        {car.brand}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-300">
                        {car.rarity}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                      {car.name}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium">
                      {car.generation} • {car.country}
                    </p>
                  </div>

                  {/* Quick Save Badge */}
                  <button
                    onClick={handleCapture}
                    className={`p-2 rounded-xl border transition active:scale-95 ${
                      isSaved 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white'
                    }`}
                    title={isSaved ? 'En el Garage' : 'Guardar en Garage'}
                  >
                    <Warehouse className="w-4 h-4" />
                  </button>
                </div>

                {/* Vehicle Showcase Image with soft floor reflection */}
                <div className="relative my-auto py-4 flex flex-col items-center justify-center">
                  <div className="relative group cursor-pointer" onClick={() => onTabChange('garage')}>
                    <img 
                      src={car.cutoutImage || car.image}
                      alt={car.name}
                      className="w-72 sm:w-80 h-44 object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = car.image;
                      }}
                    />
                    <div className="w-56 h-4 bg-black/60 rounded-full blur-md mx-auto -mt-2"></div>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-2 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-zinc-300" />
                    Toca la imagen para abrirlo en 3D interactivo
                  </span>
                </div>

                {/* 4 Clean Minimalist Performance Spec Metrics */}
                <div className="grid grid-cols-4 gap-2 z-10 pt-2 border-t border-white/[0.06]">
                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Potencia</div>
                    <div className="text-sm font-bold text-white mt-0.5">{car.hp} <span className="text-[10px] font-normal text-zinc-500">CV</span></div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">0-100</div>
                    <div className="text-sm font-bold text-white mt-0.5">{car.zeroToHundred}</div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Vel. Máx</div>
                    <div className="text-sm font-bold text-white mt-0.5">{car.topSpeed}</div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center">
                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Motor</div>
                    <div className="text-xs font-bold text-zinc-200 truncate mt-1">{car.engine ? car.engine.split(' ')[0] : 'V6'}</div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 z-10">
                  <button
                    onClick={handleCapture}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                      isSaved
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white text-black hover:bg-zinc-200 shadow-md'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Guardado en Garage' : 'Guardar en Garage'}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('scanner')}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Escanear en Calle</span>
                  </button>
                </div>
              </div>

              {/* Prev / Next Car Navigation footer */}
              <div className="flex items-center justify-between px-2 pt-1 text-xs text-zinc-400">
                <button onClick={prevCar} className="hover:text-white flex items-center gap-1 font-medium transition py-1">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="font-mono text-[11px] text-zinc-500">
                  {currentCarIndex + 1} de {POKEDEX_CARS.length}
                </span>
                <button onClick={nextCar} className="hover:text-white flex items-center gap-1 font-medium transition py-1">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GARAGE (Bookshelf & 3D Workshop) */}
          {activeTab === 'garage' && (
            <div className="flex-1 overflow-y-auto p-3 text-white">
              {renderGarageContent()}
            </div>
          )}

          {/* TAB 3: SCANNER */}
          {activeTab === 'scanner' && (
            <div className="flex-1 overflow-y-auto p-3 text-white">
              {renderScannerContent()}
            </div>
          )}

          {/* TAB 4: RADAR */}
          {activeTab === 'radar' && (
            <div className="flex-1 overflow-y-auto p-3 text-white">
              {renderRadarContent()}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto p-3 text-white">
              {renderProfileContent ? renderProfileContent() : null}
            </div>
          )}
        </main>

        {/* Modern Floating Bottom Navigation Bar (Pill design above Netlify/browser bottom bars) */}
        <div className="relative z-40 px-3 pb-4 pt-1 pointer-events-none">
          <nav className="pointer-events-auto max-w-[360px] mx-auto py-2 px-2.5 bg-[#0d0f17]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.8)] flex items-center justify-around">
            {/* Tab 1: CarLog */}
            <button 
              onClick={() => onTabChange('cardex')}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'cardex' ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${activeTab === 'cardex' ? 'bg-white/10' : ''}`}>
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">CarLog</span>
            </button>

            {/* Tab 2: Garage */}
            <button 
              onClick={() => onTabChange('garage')}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'garage' ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${activeTab === 'garage' ? 'bg-white/10' : ''}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">Garage</span>
            </button>

            {/* Tab 3: Camera Scanner */}
            <button 
              onClick={() => onTabChange('scanner')}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'scanner' ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${activeTab === 'scanner' ? 'bg-white/10' : ''}`}>
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">Escanear</span>
            </button>

            {/* Tab 4: Radar */}
            <button 
              onClick={() => onTabChange('radar')}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'radar' ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${activeTab === 'radar' ? 'bg-white/10' : ''}`}>
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">Radar</span>
            </button>

            {/* Tab 5: Profile */}
            <button 
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'profile' ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${activeTab === 'profile' ? 'bg-white/10' : ''}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight">Perfil</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
