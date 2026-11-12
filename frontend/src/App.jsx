import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import MobileContainer from './components/MobileContainer';
import {
  resolveCurrentSession,
  logoutUser,
  getUserGarage,
  saveCarForUser,
  deleteCarForUser,
  syncGuestCarsToUser
} from './utils/auth';
import { getSupabase, isSupabaseConfigured } from './utils/supabaseClient';

function lazyWithRetry(importer) {
  return lazy(() =>
    importer().catch(async (err) => {
      // Retry once after 300ms in case mobile radio/PWA just woke from background
      await new Promise((r) => setTimeout(r, 300));
      return importer().catch(() => {
        if (!sessionStorage.getItem('carlog_chunk_reload')) {
          sessionStorage.setItem('carlog_chunk_reload', '1');
          window.location.reload();
        }
        throw err;
      });
    })
  );
}

const ScannerView = lazyWithRetry(() => import('./components/ScannerView'));
const NfsGarageView = lazyWithRetry(() => import('./components/NfsGarageView'));
const BrandBookshelf = lazyWithRetry(() => import('./components/BrandBookshelf'));
const RadarView = lazyWithRetry(() => import('./components/RadarView'));
const SettingsModal = lazyWithRetry(() => import('./components/SettingsModal'));
const DesktopGate = lazyWithRetry(() => import('./components/DesktopGate'));
const AuthModal = lazyWithRetry(() => import('./components/AuthModal'));
const ProfileView = lazyWithRetry(() => import('./components/ProfileView'));

function ViewFallback() {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500 font-mono text-xs">
      <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
      <span>Cargando módulo...</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('cardex'); // 'cardex' | 'garage' | 'scanner' | 'radar' | 'profile'
  const [garage, setGarage] = useState([]);
  const [showroomMode, setShowroomMode] = useState(false);
  const [showroomCars, setShowroomCars] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [radarSelectedPreset, setRadarSelectedPreset] = useState(null);
  const [isAllowedDevice, setIsAllowedDevice] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  // Resolve initial Supabase/local session and subscribe to auth updates
  useEffect(() => {
    let active = true;
    resolveCurrentSession().then((session) => {
      if (active && session) {
        setCurrentUser(session);
      }
    });

    const supabase = getSupabase();
    let subscription = null;
    if (supabase && isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        if (!active) return;
        if (sbSession?.user) {
          const resolved = {
            id: sbSession.user.id,
            email: sbSession.user.email,
            username: sbSession.user.user_metadata?.username || sbSession.user.email?.split('@')[0] || 'Spotter',
            createdAt: sbSession.user.created_at,
            provider: 'supabase'
          };
          localStorage.setItem('carlog_current_session', JSON.stringify(resolved));
          setCurrentUser((prev) =>
            prev?.id === resolved.id && prev?.username === resolved.username ? prev : resolved
          );
        }
      });
      subscription = data?.subscription || null;
    }

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, [settingsVersion]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  useEffect(() => {
    const checkDevice = () => {
      const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
      const mobileTabletRegex = /android|iphone|ipad|ipod|tablet|silk|kindle|mobile|blackberry|opera mini|iemobile|windows phone/i;
      const isUaMatch = mobileTabletRegex.test(ua);
      const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const hasTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);

      const isMobileOrTablet = isUaMatch || isIPad || (hasTouch && window.innerWidth <= 1366);
      setIsAllowedDevice(isMobileOrTablet);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Load personal garage cleanly (Supabase Cloud + IndexedDB offline cache, isolated per user)
  const loadGarage = useCallback(async (user = currentUser) => {
    const userId = user ? user.id : null;
    const saved = await getUserGarage(userId);
    setGarage(Array.isArray(saved) ? saved : []);
  }, [currentUser]);

  useEffect(() => {
    loadGarage(currentUser);
  }, [currentUser, settingsVersion, loadGarage]);

  // Lazy-load 60-model 3D showroom catalog on demand (read-only, separate from user progress)
  const handleToggleShowroom = async () => {
    if (!showroomMode && showroomCars.length === 0) {
      try {
        const res = await fetch('/data/showroom_catalog.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setShowroomCars(data);
        }
      } catch (e) {
        console.warn('Could not load showroom catalog:', e);
      }
    }
    setSelectedBrand(null);
    setShowroomMode((prev) => !prev);
  };

  const handleAuthSuccess = async (session) => {
    setCurrentUser(session);
    if (session?.id) {
      await syncGuestCarsToUser(session.id);
      await loadGarage(session);
    }
  };

  const handleSaveToGarage = async (car) => {
    const newCar = {
      ...car,
      id: car.id || `car-${Date.now()}`,
      capturedAt: car.capturedAt || new Date().toISOString(),
      userCaptured: true
    };

    const userId = currentUser ? currentUser.id : null;
    const { updatedList } = await saveCarForUser(userId, newCar, garage);
    setGarage(updatedList);
  };

  const handleDeleteFromGarage = async (carId) => {
    const userId = currentUser ? currentUser.id : null;
    const updatedList = await deleteCarForUser(userId, carId, garage);
    setGarage(updatedList);
  };

  const handleSpotFromRadar = (spot) => {
    setRadarSelectedPreset(spot);
    setActiveTab('scanner');
  };

  const savedCarIds = new Set(garage.map(c => c.id || `${c.brand}-${c.model || c.name}`));

  // Render Garage (Personal Collection or 3D Showroom Catalog)
  const renderGarageContent = () => {
    const displayedFleet = showroomMode ? showroomCars : garage;

    if (selectedBrand === null) {
      return (
        <Suspense fallback={<ViewFallback />}>
          <BrandBookshelf
            garage={displayedFleet}
            onSelectBrand={(brand) => setSelectedBrand(brand)}
            showingShowroom={showroomMode}
            onToggleShowroom={handleToggleShowroom}
            showroomCount={showroomCars.length || 60}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<ViewFallback />}>
        <NfsGarageView
          garage={
            selectedBrand === 'ALL'
              ? displayedFleet
              : displayedFleet.filter(c => (c.brand || '').toLowerCase().includes(selectedBrand.toLowerCase()))
          }
          selectedBrandTitle={
            showroomMode
              ? `Showroom // ${selectedBrand === 'ALL' ? 'Todos' : selectedBrand}`
              : (selectedBrand === 'ALL' ? 'Todos los Fabricantes' : selectedBrand)
          }
          onBackToBookshelf={() => setSelectedBrand(null)}
          onDeleteCar={!showroomMode ? handleDeleteFromGarage : undefined}
          onOpenScanner={() => setActiveTab('scanner')}
        />
      </Suspense>
    );
  };

  if (!isAllowedDevice && !devBypass) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <DesktopGate onBypass={() => setDevBypass(true)} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col justify-center items-center">
      <MobileContainer
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'garage') setSelectedBrand(null);
        }}
        garage={garage}
        onSaveToGarage={handleSaveToGarage}
        savedIds={savedCarIds}
        onOpenSettings={() => setSettingsOpen(true)}
        user={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        renderGarageContent={renderGarageContent}
        renderScannerContent={() => (
          <Suspense fallback={<ViewFallback />}>
            <ScannerView
              onSaveToGarage={handleSaveToGarage}
              savedCarIds={savedCarIds}
              onBroadcastToRadar={() => setActiveTab('radar')}
              initialPreset={radarSelectedPreset}
            />
          </Suspense>
        )}
        renderRadarContent={() => (
          <Suspense fallback={<ViewFallback />}>
            <RadarView onSpotFound={handleSpotFromRadar} />
          </Suspense>
        )}
        renderProfileContent={() => (
          <Suspense fallback={<ViewFallback />}>
            <ProfileView
              user={currentUser}
              garage={garage}
              onLogout={handleLogout}
              onOpenAuth={() => setAuthOpen(true)}
            />
          </Suspense>
        )}
      />

      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        </Suspense>
      )}

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSettingsSaved={() => setSettingsVersion(v => v + 1)}
          />
        </Suspense>
      )}
    </div>
  );
}
