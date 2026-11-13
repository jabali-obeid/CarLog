import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Settings, Camera, Radio, Check,
  BookOpen, Warehouse, Smartphone, Flame, User, LogOut, Box, Gauge
} from 'lucide-react';
import { POKEDEX_CARS, RARITY_CONFIG } from '../utils/demoData';

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
        setToast('CarLog instalada en tu dispositivo.');
      }
      setDeferredPrompt(null);
    } else {
      setToast('En tu navegador móvil toca el menú (⋮) y selecciona "Instalar aplicación"');
      setTimeout(() => setToast(null), 4500);
    }
  };

  const car = POKEDEX_CARS[currentCarIndex];
  const isSaved = savedIds.has(car.id) || savedIds.has(`${car.brand}-${car.name}`);
  const rarityCfg = RARITY_CONFIG[car.rarity] || RARITY_CONFIG['Común'];

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
      topSpeed: parseInt(car.topSpeed, 10),
      engine: car.engine,
      color: car.color,
      imageUrl: car.image,
      funFact: car.description
    });
    setToast(`${car.brand} ${car.name} guardado en tu Garage`);
    setTimeout(() => setToast(null), 3000);
  };

  const zeroToHundredNum = String(car.zeroToHundred ?? '').replace(/s$/i, '').trim();
  const topSpeedNum = String(car.topSpeed ?? '').replace(/\s*km\/h$/i, '').trim();

  const navItems = [
    { id: 'cardex', label: 'CarLog', icon: Flame },
    { id: 'garage', label: 'Garage', icon: BookOpen, badge: garage.length > 0 ? garage.length : null },
    { id: 'scanner', label: 'Escanear', icon: Camera, primary: true },
    { id: 'radar', label: 'Radar', icon: Radio },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center p-0 sm:py-3 sm:px-3 select-none min-h-[100dvh] w-full bg-[var(--cl-canvas)] text-[var(--cl-text-primary)]">
      {/* Toast popup */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#12151e]/95 text-[var(--cl-text-primary)] font-medium text-xs shadow-2xl border border-white/15 backdrop-blur-xl flex items-center gap-2 animate-fade-in max-w-[90vw]"
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-400" />
          </span>
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* Main App Shell: Edge-to-edge on mobile, machined cockpit frame on tablet/desktop */}
      <div className="relative w-full sm:max-w-md md:max-w-lg h-[100dvh] sm:h-[min(94dvh,920px)] sm:rounded-[34px] bg-[var(--cl-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.88)] border-0 sm:border sm:border-white/[0.11] overflow-hidden flex flex-col justify-between">
        {/* Top Motorsport Hairline Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent z-40 pointer-events-none" />
        {/* Restrained Overhead Showroom Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-white/[0.035] to-transparent blur-2xl pointer-events-none" />

        {/* Telemetry Top App Bar */}
        <header className="relative z-30 pt-[max(0.75rem,var(--sat))] pb-2.5 px-4 sm:px-5 flex items-center justify-between border-b border-white/[0.07] bg-[#0b0d12]/88 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-b from-white to-zinc-200 text-[#08090c] flex items-center justify-center shadow-[inset_0_-1px_0_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.5)]">
              <span className="font-display font-extrabold text-sm tracking-tighter leading-none">CL</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-[#0b0d12]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-extrabold text-lg tracking-wide uppercase text-white">
                  CarLog
                </span>
                <span className="text-[9px] font-telemetry uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-600/12 text-red-400 border border-red-500/25 font-semibold">
                  OS
                </span>
              </div>
              <span className="text-[10px] font-telemetry text-[var(--cl-text-muted)] uppercase tracking-wider block mt-0.5">
                Showroom · Telemetría 3D
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {user ? (
              <div className="h-8 flex items-center gap-1.5 cl-pill pl-2.5 pr-1 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-zinc-200 max-w-[78px] truncate">
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/[0.06] transition active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="h-8 px-3 rounded-xl bg-white text-[#08090c] font-bold text-[11px] hover:bg-zinc-200 transition active:scale-[0.97] shadow-sm flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                title="Instalar App en Celular"
                className="h-8 px-2.5 rounded-xl cl-pill hover:bg-[#1f2432] text-[11px] font-medium text-zinc-300 flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xs:inline sm:inline">Instalar</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              title="Ajustes de API"
              aria-label="Ajustes de API"
              className="w-8 h-8 rounded-xl cl-pill hover:bg-[#1f2432] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-[0.97]"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic App Tab Body */}
        <main className="relative z-20 flex-1 flex flex-col overflow-hidden">
          {/* TAB 1: CARDEX SHOWROOM */}
          {activeTab === 'cardex' && (
            <div className="flex-1 flex flex-col justify-between px-4 pt-3 pb-2 overflow-y-auto scrollbar-none">
              {/* Telemetry Model Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {POKEDEX_CARS.map((c, idx) => {
                  const active = idx === currentCarIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCurrentCarIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all whitespace-nowrap flex items-center gap-2 shrink-0 active:scale-[0.97] ${
                        active
                          ? 'bg-white text-[#08090c] shadow-[0_6px_18px_rgba(255,255,255,0.12)]'
                          : 'bg-[#12151d] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                      }`}
                    >
                      <span className={`font-telemetry text-[10px] font-bold ${active ? 'text-red-600' : 'text-zinc-600'}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Showroom Vehicle Stage Card */}
              <div className="relative rounded-3xl cl-card cl-microgrid p-4 sm:p-5 flex-1 flex flex-col justify-between my-1.5 overflow-hidden">
                {/* Overhead Showroom Spotlight */}
                <div className="absolute inset-0 cl-showroom-spotlight pointer-events-none" />

                {/* Background Year Display Watermark */}
                <div className="absolute right-4 top-2 text-[68px] font-display font-extrabold italic leading-none text-white/[0.035] select-none pointer-events-none">
                  {car.year}
                </div>

                {/* Card Header Info */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-telemetry uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/[0.07] text-zinc-200 font-semibold border border-white/[0.08]">
                        {car.brand}
                      </span>
                      <span className={`text-[10px] font-telemetry uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/[0.08] bg-black/40 font-semibold ${rarityCfg.text}`}>
                        {car.rarity}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-tight leading-[0.95] truncate">
                      {car.name}
                    </h2>
                    <p className="text-[11px] font-telemetry text-[var(--cl-text-secondary)] mt-1 uppercase tracking-wider">
                      {car.generation} · {car.country}
                    </p>
                  </div>

                  {/* Quick Save Badge */}
                  <button
                    onClick={handleCapture}
                    aria-label={isSaved ? 'En el Garage' : 'Guardar en Garage'}
                    className={`w-10 h-10 rounded-xl border transition flex items-center justify-center shrink-0 active:scale-95 ${
                      isSaved
                        ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-400'
                        : 'cl-pill text-zinc-400 hover:text-white'
                    }`}
                    title={isSaved ? 'En el Garage' : 'Guardar en Garage'}
                  >
                    <Warehouse className="w-4 h-4" />
                  </button>
                </div>

                {/* Vehicle Turntable Stage */}
                <div className="relative my-auto py-3 flex flex-col items-center justify-center z-10">
                  <button
                    type="button"
                    onClick={() => onTabChange('garage')}
                    className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl p-1"
                    aria-label={`Abrir ${car.brand} ${car.name} en vista 3D`}
                  >
                    {/* Turntable Ring */}
                    <div className="absolute inset-x-4 bottom-3 h-10 rounded-[100%] border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                    <img
                      src={car.cutoutImage || car.image}
                      alt={`${car.brand} ${car.name}`}
                      className="relative z-10 w-68 sm:w-80 h-40 sm:h-44 object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.75)] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      onError={(e) => {
                        e.target.src = car.image;
                      }}
                    />
                    <div className="w-52 h-3.5 bg-black/70 rounded-full blur-md mx-auto -mt-2" />
                  </button>

                  <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 border border-white/[0.07] text-[10px] font-telemetry text-zinc-400">
                    <Box className="w-3 h-3 text-cyan-400" />
                    <span>TOCA EL AUTO PARA VISTA 3D</span>
                  </span>
                </div>

                {/* 4-Column Motorsport Telemetry Strip */}
                <div className="relative z-10 rounded-2xl cl-panel grid grid-cols-4 divide-x divide-white/[0.07]">
                  <div className="py-2.5 px-2 text-center">
                    <div className="text-[9px] font-telemetry text-[var(--cl-text-muted)] uppercase tracking-wider">
                      Potencia
                    </div>
                    <div className="font-telemetry text-sm font-bold text-white mt-0.5 leading-tight">
                      {car.hp}
                      <span className="text-[10px] font-normal text-zinc-500 ml-0.5">CV</span>
                    </div>
                  </div>

                  <div className="py-2.5 px-2 text-center">
                    <div className="text-[9px] font-telemetry text-[var(--cl-text-muted)] uppercase tracking-wider">
                      0–100
                    </div>
                    <div className="font-telemetry text-sm font-bold text-white mt-0.5 leading-tight">
                      {zeroToHundredNum}
                      <span className="text-[10px] font-normal text-zinc-500 ml-0.5">s</span>
                    </div>
                  </div>

                  <div className="py-2.5 px-2 text-center">
                    <div className="text-[9px] font-telemetry text-[var(--cl-text-muted)] uppercase tracking-wider">
                      Vel. Máx
                    </div>
                    <div className="font-telemetry text-sm font-bold text-white mt-0.5 leading-tight">
                      {topSpeedNum}
                      <span className="text-[9px] font-normal text-zinc-500 ml-0.5">km/h</span>
                    </div>
                  </div>

                  <div className="py-2.5 px-2 text-center">
                    <div className="text-[9px] font-telemetry text-[var(--cl-text-muted)] uppercase tracking-wider">
                      Bloque
                    </div>
                    <div className="font-telemetry text-xs font-bold text-zinc-200 truncate mt-1 leading-tight">
                      {car.engine ? car.engine.split(' ')[0] : 'V6'}
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 z-10">
                  <button
                    onClick={handleCapture}
                    className={`min-h-[42px] px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                      isSaved
                        ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/35'
                        : 'bg-white text-[#08090c] hover:bg-zinc-200 shadow-[0_8px_20px_rgba(255,255,255,0.12)]'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'En el Garage' : 'Guardar Auto'}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('scanner')}
                    className="min-h-[42px] px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white border border-red-400/25 transition flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(220,38,38,0.28)] active:scale-[0.98]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Escanear Calle</span>
                  </button>
                </div>
              </div>

              {/* Prev / Next Telemetry Stepper */}
              <div className="flex items-center justify-between px-1 pt-1 text-xs text-zinc-400">
                <button
                  onClick={prevCar}
                  className="hover:text-white flex items-center gap-1 font-medium transition py-1.5 px-2 rounded-lg hover:bg-white/[0.04] active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <div className="flex items-center gap-2 font-telemetry text-[11px] text-zinc-400">
                  <Gauge className="w-3.5 h-3.5 text-red-500" />
                  <span>
                    {String(currentCarIndex + 1).padStart(2, '0')} / {String(POKEDEX_CARS.length).padStart(2, '0')}
                  </span>
                </div>
                <button
                  onClick={nextCar}
                  className="hover:text-white flex items-center gap-1 font-medium transition py-1.5 px-2 rounded-lg hover:bg-white/[0.04] active:scale-95"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GARAGE (Bookshelf & 3D Workshop) */}
          {activeTab === 'garage' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-white scrollbar-none">
              {renderGarageContent()}
            </div>
          )}

          {/* TAB 3: SCANNER */}
          {activeTab === 'scanner' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-white scrollbar-none">
              {renderScannerContent()}
            </div>
          )}

          {/* TAB 4: RADAR */}
          {activeTab === 'radar' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-white scrollbar-none">
              {renderRadarContent()}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-white scrollbar-none">
              {renderProfileContent ? renderProfileContent() : null}
            </div>
          )}
        </main>

        {/* Floating Pit-Wall Bottom Dock */}
        <div className="relative z-40 px-3 pt-1 pb-[max(0.85rem,var(--sab))] bg-gradient-to-t from-[#08090c] via-[#08090c]/80 to-transparent pointer-events-none">
          <nav
            aria-label="Navegación principal"
            className="pointer-events-auto max-w-[380px] mx-auto p-1.5 bg-[#0e1118]/92 backdrop-blur-2xl rounded-2xl border border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_36px_rgba(0,0,0,0.88)] grid grid-cols-5 gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                    isActive
                      ? 'bg-white/[0.09] text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Top Active Telemetry Pip */}
                  <span
                    className={`absolute top-0.5 w-4 h-[2px] rounded-full transition-opacity ${
                      isActive
                        ? item.primary
                          ? 'bg-red-500 opacity-100'
                          : 'bg-white opacity-100'
                        : 'opacity-0'
                    }`}
                  />

                  <div className="relative p-1">
                    <Icon
                      className={`w-4 h-4 transition-transform ${
                        isActive ? 'scale-105' : ''
                      } ${item.primary && isActive ? 'text-red-400' : ''}`}
                    />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-red-600 text-white font-telemetry text-[8px] font-bold flex items-center justify-center ring-1 ring-[#0e1118]">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold tracking-tight leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
