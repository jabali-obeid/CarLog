import React, { useState, useEffect } from 'react';
import {
  Camera, Radio, Check,
  BookOpen, Smartphone, Flame, User, LogOut
} from 'lucide-react';
import WeeklyFindsFeed from './WeeklyFindsFeed';
import FluidBottomDock from './FluidBottomDock';

export default function MobileContainer({
  activeTab,
  onTabChange,
  garage = [],
  savedIds = new Set(),
  user,
  onOpenAuth,
  onLogout,
  onOpenCarIn3D,
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

  const navItems = [
    { id: 'carlog', label: 'HOT', icon: Flame },
    { id: 'garage', label: 'Garage', icon: BookOpen, badge: garage.length > 0 ? garage.length : null },
    { id: 'scanner', label: 'Escanear', icon: Camera, primary: true },
    { id: 'radar', label: 'Radar', icon: Radio },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center p-0 sm:py-3 sm:px-3 select-none min-h-[100dvh] w-full bg-[#eef0f3] text-[#111318]">
      {/* Toast popup */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-[#111318] font-medium text-xs shadow-xl border border-red-200 flex items-center gap-2 animate-fade-in max-w-[90vw]"
        >
          <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-red-600" />
          </span>
          <span className="truncate">{toast}</span>
        </div>
      )}

      {/* Main White & Red App Shell */}
      <div className="relative w-full sm:max-w-md md:max-w-lg h-[100dvh] sm:h-[min(94dvh,920px)] sm:rounded-[34px] shadow-[0_24px_60px_rgba(15,23,42,0.14)] border-0 sm:border sm:border-black/[0.08] overflow-hidden flex flex-col justify-between bg-[#f4f5f7] text-[#111318]">
        {/* Top Red Motorsport Hairline Accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-600 to-rose-500 shrink-0 z-40" />

        {/* Clean White Top App Bar with Official Logo */}
        <header className="relative z-30 pt-[max(0.75rem,var(--sat))] pb-2.5 px-4 sm:px-5 flex items-center justify-between border-b border-black/[0.07] bg-white/95 backdrop-blur-xl text-[#111318]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-red-700/20 bg-red-600 p-1.5 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="CarLog"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-extrabold text-lg tracking-wide uppercase text-[#111318]">
                  CarLog
                </span>
                <span className="text-[9px] font-telemetry uppercase tracking-widest px-1.5 py-0.5 rounded font-bold bg-red-50 text-red-600 border border-red-200">
                  STREET
                </span>
              </div>
              <span className="text-[10px] font-telemetry uppercase tracking-wider block mt-0.5 text-slate-500">
                Spotting · Garaje 3D
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {user ? (
              <div className="h-8 flex items-center gap-1.5 pl-2.5 pr-1 rounded-xl border bg-red-50/70 border-red-200/80 text-[#111318]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span className="text-[11px] font-semibold max-w-[82px] truncate text-[#111318]">
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="p-1 rounded-lg transition active:scale-95 text-slate-500 hover:text-red-600 hover:bg-red-100/70"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="h-8 px-3.5 rounded-xl font-bold text-[11px] transition active:scale-[0.97] shadow-sm flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700"
              >
                <User className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                title="Instalar App en Celular"
                className="h-8 px-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition active:scale-[0.97] border bg-white hover:bg-slate-50 text-slate-700 border-black/[0.09]"
              >
                <Smartphone className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden xs:inline sm:inline">Instalar</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic App Tab Body (Unified White & Red Palette) */}
        <main className="relative z-20 flex-1 flex flex-col overflow-hidden bg-[#f4f5f7]">
          {/* TAB 1: HOT WEEKLY REAL FINDS */}
          {activeTab === 'carlog' && (
            <div className="flex-1 overflow-y-auto pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              <WeeklyFindsFeed
                savedIds={savedIds}
                onOpenIn3D={onOpenCarIn3D}
                onOpenScanner={() => onTabChange('scanner')}
                onOpenRadar={() => onTabChange('radar')}
              />
            </div>
          )}

          {/* TAB 2: GARAGE (Bookshelf / Read-only 3D Catalog / 3D Studio) */}
          {activeTab === 'garage' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              {renderGarageContent()}
            </div>
          )}

          {/* TAB 3: SCANNER */}
          {activeTab === 'scanner' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              {renderScannerContent()}
            </div>
          )}

          {/* TAB 4: RADAR */}
          {activeTab === 'radar' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              {renderRadarContent()}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-8 bg-[#f4f5f7] text-[#111318] scrollbar-none">
              {renderProfileContent ? renderProfileContent() : null}
            </div>
          )}
        </main>

        {/* Fluid Concave-Notch Bottom Dock (Always Crisp White & Red) */}
        <FluidBottomDock
          items={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isLightView={true}
        />
      </div>
    </div>
  );
}
