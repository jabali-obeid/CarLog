import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings, Camera, Radio, Check,
  BookOpen, Smartphone, Flame, User, LogOut
} from 'lucide-react';
import { POKEDEX_CARS } from '../utils/demoData';
import ShowroomGallery from './ShowroomGallery';
import FluidBottomDock from './FluidBottomDock';

const CATALOG_ALIAS_IDS = new Set([
  'porsche-gt3rs',
  'bmw-m3-g80',
  'car-seed-1',
  'toyota-corolla-seed'
]);

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
  showroomCars = [],
  showroomLoading = false,
  onOpenCarIn3D,
  isGarageShowroom = false,
  renderGarageContent,
  renderScannerContent,
  renderRadarContent,
  renderProfileContent
}) {
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

  // Merge featured Pokedex studio cars first with full catalog, deduplicating aliases
  const showcaseCars = useMemo(() => {
    const featured = POKEDEX_CARS.map((c) => ({
      ...c,
      model: c.model || c.name,
      imageUrl: c.imageUrl || c.image,
      funFact: c.funFact || c.description
    }));
    const seenKeys = new Set(
      featured.map((c) => `${(c.brand || '').toLowerCase()}::${(c.model || '').toLowerCase()}`)
    );
    const extras = (Array.isArray(showroomCars) ? showroomCars : []).filter((c) => {
      if (!c || CATALOG_ALIAS_IDS.has(c.id)) return false;
      const key = `${(c.brand || '').toLowerCase()}::${(c.model || c.name || '').toLowerCase()}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    return [...featured, ...extras];
  }, [showroomCars]);

  const handleCapture = (targetCar) => {
    const selected = targetCar || showcaseCars[0];
    if (!selected) return;
    const modelName = selected.model || selected.name || 'Modelo';
    onSaveToGarage({
      id: selected.id,
      brand: selected.brand,
      model: modelName,
      year: selected.year,
      rarity: selected.rarity,
      hp: selected.hp,
      zeroToHundred: parseFloat(selected.zeroToHundred) || 0,
      topSpeed: parseInt(selected.topSpeed, 10) || 0,
      engine: selected.engine,
      color: selected.color,
      imageUrl: selected.imageUrl || selected.image,
      funFact: selected.funFact || selected.description
    });
    setToast(`${selected.brand} ${modelName} guardado en tu Garage`);
    setTimeout(() => setToast(null), 3000);
  };

  const isLightView = activeTab === 'cardex' || (activeTab === 'garage' && isGarageShowroom);

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
      <div
        className={`relative w-full sm:max-w-md md:max-w-lg h-[100dvh] sm:h-[min(94dvh,920px)] sm:rounded-[34px] shadow-[0_24px_60px_rgba(0,0,0,0.88)] border-0 sm:border sm:border-white/[0.11] overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
          isLightView ? 'bg-[#f4f5f7] text-[#111318]' : 'bg-[var(--cl-surface)]'
        }`}
      >
        {!isLightView && (
          <>
            {/* Top Motorsport Hairline Accent */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent z-40 pointer-events-none" />
            {/* Restrained Overhead Showroom Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-white/[0.035] to-transparent blur-2xl pointer-events-none" />
          </>
        )}

        {/* Adaptive Top App Bar (Studio White in Showroom / Dark Pit-Wall in Workshop) */}
        <header
          className={`relative z-30 pt-[max(0.75rem,var(--sat))] pb-2.5 px-4 sm:px-5 flex items-center justify-between border-b backdrop-blur-xl transition-colors duration-300 ${
            isLightView
              ? 'border-slate-200/80 bg-white/92 text-[#111318]'
              : 'border-white/[0.07] bg-[#0b0d12]/88 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${
                isLightView
                  ? 'bg-[#111318] text-white shadow-sm'
                  : 'bg-gradient-to-b from-white to-zinc-200 text-[#08090c] shadow-[inset_0_-1px_0_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.5)]'
              }`}
            >
              <span className="font-display font-extrabold text-sm tracking-tighter leading-none">CL</span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ${
                  isLightView ? 'bg-emerald-500 ring-white' : 'bg-red-600 ring-[#0b0d12]'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span
                  className={`font-display font-extrabold text-lg tracking-wide uppercase ${
                    isLightView ? 'text-[#111318]' : 'text-white'
                  }`}
                >
                  CarLog
                </span>
                <span
                  className={`text-[9px] font-telemetry uppercase tracking-widest px-1.5 py-0.5 rounded font-semibold border ${
                    isLightView
                      ? 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30'
                      : 'bg-red-600/12 text-red-400 border-red-500/25'
                  }`}
                >
                  {isLightView ? 'Studio' : 'OS'}
                </span>
              </div>
              <span
                className={`text-[10px] font-telemetry uppercase tracking-wider block mt-0.5 ${
                  isLightView ? 'text-slate-500' : 'text-[var(--cl-text-muted)]'
                }`}
              >
                Showroom · Telemetría 3D
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {user ? (
              <div
                className={`h-8 flex items-center gap-1.5 pl-2.5 pr-1 rounded-xl border ${
                  isLightView
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'cl-pill'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span
                  className={`text-[11px] font-semibold max-w-[78px] truncate ${
                    isLightView ? 'text-slate-800' : 'text-zinc-200'
                  }`}
                >
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className={`p-1 rounded-lg transition active:scale-95 ${
                    isLightView
                      ? 'text-slate-500 hover:text-red-600 hover:bg-slate-200/70'
                      : 'text-zinc-400 hover:text-red-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className={`h-8 px-3 rounded-xl font-bold text-[11px] transition active:scale-[0.97] shadow-sm flex items-center gap-1.5 ${
                  isLightView
                    ? 'bg-[#111318] text-white hover:bg-slate-800'
                    : 'bg-white text-[#08090c] hover:bg-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                title="Instalar App en Celular"
                className={`h-8 px-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition active:scale-[0.97] border ${
                  isLightView
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                    : 'cl-pill hover:bg-[#1f2432] text-zinc-300 border-transparent'
                }`}
              >
                <Smartphone className={`w-3.5 h-3.5 ${isLightView ? 'text-slate-500' : 'text-zinc-400'}`} />
                <span className="hidden xs:inline sm:inline">Instalar</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              title="Ajustes de API"
              aria-label="Ajustes de API"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-[0.97] border ${
                isLightView
                  ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border-slate-200'
                  : 'cl-pill hover:bg-[#1f2432] text-zinc-400 hover:text-white border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic App Tab Body */}
        <main className="relative z-20 flex-1 flex flex-col overflow-hidden">
          {/* TAB 1: LIGHT STUDIO SHOWROOM */}
          {activeTab === 'cardex' && (
            <div className="flex-1 overflow-y-auto pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              <ShowroomGallery
                cars={showcaseCars}
                savedIds={savedIds}
                onSaveToGarage={handleCapture}
                onOpenIn3D={onOpenCarIn3D}
                title="En Showroom"
                loadingCatalog={showroomLoading}
              />
            </div>
          )}

          {/* TAB 2: GARAGE (Bookshelf / Light 3D Catalog / 3D Workshop) */}
          {activeTab === 'garage' && (
            <div
              className={`flex-1 overflow-y-auto scrollbar-none ${
                isGarageShowroom
                  ? 'p-0 pb-8 bg-[#f4f5f7] text-[#111318]'
                  : 'p-3 sm:p-4 pb-8 text-white'
              }`}
            >
              {renderGarageContent()}
            </div>
          )}

          {/* TAB 3: SCANNER */}
          {activeTab === 'scanner' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 text-white scrollbar-none">
              {renderScannerContent()}
            </div>
          )}

          {/* TAB 4: RADAR */}
          {activeTab === 'radar' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 text-white scrollbar-none">
              {renderRadarContent()}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 text-white scrollbar-none">
              {renderProfileContent ? renderProfileContent() : null}
            </div>
          )}
        </main>

        {/* Fluid Concave-Notch Bottom Dock */}
        <FluidBottomDock
          items={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isLightView={isLightView}
        />
      </div>
    </div>
  );
}
