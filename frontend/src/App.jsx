import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import MobileContainer from './components/MobileContainer';
import ShowroomGallery from './components/ShowroomGallery';
import {
  resolveCurrentSession,
  logoutUser,
  getUserGarage,
  saveCarForUser,
  deleteCarForUser,
  syncGuestCarsToUser,
  getCarIdentityKey,
  getDailySaveStats
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
const AuthModal = lazyWithRetry(() => import('./components/AuthModal'));
const ProfileView = lazyWithRetry(() => import('./components/ProfileView'));

function ViewFallback() {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--cl-text-secondary)] font-telemetry text-[11px] uppercase tracking-wider">
      <div className="w-6 h-6 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
      <span>Cargando módulo...</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('cardex'); // 'cardex' | 'garage' | 'scanner' | 'radar' | 'profile'
  const [garage, setGarage] = useState([]);
  const [showroomMode, setShowroomMode] = useState(false);
  const [showroomCars, setShowroomCars] = useState([]);
  const [showroomLoading, setShowroomLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [target3DCarId, setTarget3DCarId] = useState(null);
  const [custom3DCar, setCustom3DCar] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [saveNotice, setSaveNotice] = useState(null);

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
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Load personal garage cleanly (Supabase Cloud + IndexedDB offline cache, isolated per user)
  const loadGarage = useCallback(async (user = currentUser) => {
    const userId = user ? user.id : null;
    const saved = await getUserGarage(userId);
    setGarage(Array.isArray(saved) ? saved : []);
  }, [currentUser]);

  useEffect(() => {
    loadGarage(currentUser);
  }, [currentUser, loadGarage]);

  const ensureShowroomCatalog = useCallback(async () => {
    if (showroomCars.length > 0) return showroomCars;
    try {
      const res = await fetch('/data/showroom_catalog.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setShowroomCars(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not load showroom catalog:', e);
    }
    return [];
  }, [showroomCars]);

  useEffect(() => {
    if ((activeTab === 'cardex' || showroomMode) && showroomCars.length === 0) {
      let cancelled = false;
      fetch('/data/showroom_catalog.json')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            setShowroomCars(data);
          }
        })
        .catch((e) => console.warn('Could not load showroom catalog:', e));
      return () => {
        cancelled = true;
      };
    }
  }, [activeTab, showroomMode, showroomCars.length]);

  // Lazy-load 60-model 3D showroom catalog on demand (read-only, separate from user progress)
  const handleToggleShowroom = async () => {
    if (!showroomMode && showroomCars.length === 0) {
      setShowroomLoading(true);
      await ensureShowroomCatalog();
      setShowroomLoading(false);
    }
    setSelectedBrand(null);
    setTarget3DCarId(null);
    setCustom3DCar(null);
    setShowroomMode((prev) => !prev);
  };

  const handleAuthSuccess = async (session) => {
    setCurrentUser(session);
    if (session?.id) {
      await syncGuestCarsToUser(session.id);
      await loadGarage(session);
    }
  };

  const showSaveNotice = (message, tone = 'warn') => {
    setSaveNotice({ message, tone });
    setTimeout(() => {
      setSaveNotice((prev) => (prev?.message === message ? null : prev));
    }, 3600);
  };

  const handleSaveToGarage = async (car) => {
    if (car?.captureSource !== 'scanner') {
      const msg = 'Solo podés sumar autos escaneándolos en la calle.';
      showSaveNotice(msg, 'warn');
      return { saved: false, reason: 'scanner_only', error: msg, updatedList: garage };
    }

    const newCar = {
      ...car,
      id: car.id || `car-${Date.now()}`,
      model: car.model || car.name || 'Modelo',
      zeroToHundred: parseFloat(car.zeroToHundred) || 0,
      topSpeed: parseInt(car.topSpeed, 10) || 0,
      imageUrl: car.imageUrl || car.image || '',
      funFact: car.funFact || car.description || '',
      capturedAt: new Date().toISOString(),
      userCaptured: true
    };

    const userId = currentUser ? currentUser.id : null;
    const result = await saveCarForUser(userId, newCar, garage);
    if (!result?.saved) {
      if (result?.error) {
        showSaveNotice(result.error, 'warn');
      }
      return result;
    }

    setGarage(result.updatedList);
    return result;
  };

  const handleDeleteFromGarage = async (carId) => {
    const userId = currentUser ? currentUser.id : null;
    const updatedList = await deleteCarForUser(userId, carId, garage);
    setGarage(updatedList);
  };

  const handleSpotFromRadar = () => {
    setActiveTab('scanner');
  };

  const handleOpenCarIn3D = async (car) => {
    if (!car) return;
    const catalog = await ensureShowroomCatalog();
    const normalizedCar = {
      ...car,
      model: car.model || car.name || 'Modelo',
      zeroToHundred: parseFloat(car.zeroToHundred) || 0,
      topSpeed: parseInt(car.topSpeed, 10) || 0,
      imageUrl: car.imageUrl || car.image || '',
      funFact: car.funFact || car.description || ''
    };
    const aliasIdMap = {
      'ferrari-f40': 'car-seed-1',
      'toyota-corolla': 'toyota-corolla-seed'
    };
    const lookupId = aliasIdMap[normalizedCar.id] || normalizedCar.id;
    const catalogMatch = catalog.find((c) => c.id === lookupId || c.id === normalizedCar.id);
    if (catalogMatch) {
      setCustom3DCar(null);
      setTarget3DCarId(catalogMatch.id);
    } else {
      setCustom3DCar(normalizedCar);
      setTarget3DCarId(normalizedCar.id);
    }
    setShowroomMode(true);
    setSelectedBrand('ALL');
    setActiveTab('garage');
  };

  const savedCarIds = new Set(
    garage
      .flatMap((c) => [
        c.id,
        c.brand && (c.model || c.name) ? `${c.brand}-${c.model || c.name}` : null,
        getCarIdentityKey(c)
      ])
      .filter(Boolean)
  );

  const dailySaveStats = getDailySaveStats(currentUser ? currentUser.id : null, garage);

  // Render Garage (Personal Collection or 3D Showroom Catalog)
  const renderGarageContent = () => {
    const baseFleet = showroomMode ? showroomCars : garage;
    const displayedFleet =
      showroomMode && custom3DCar && !baseFleet.some((c) => c.id === custom3DCar.id)
        ? [custom3DCar, ...baseFleet]
        : baseFleet;

    if (selectedBrand === null) {
      if (showroomMode) {
        return (
          <ShowroomGallery
            cars={showroomCars}
            savedIds={savedCarIds}
            onOpenIn3D={handleOpenCarIn3D}
            onBackToBookshelf={handleToggleShowroom}
            title="Catálogo 3D"
            loadingCatalog={showroomLoading}
          />
        );
      }

      return (
        <Suspense fallback={<ViewFallback />}>
          <BrandBookshelf
            garage={displayedFleet}
            onSelectBrand={(brand) => {
              setTarget3DCarId(null);
              setCustom3DCar(null);
              setSelectedBrand(brand);
            }}
            showingShowroom={showroomMode}
            onToggleShowroom={handleToggleShowroom}
            showroomCount={showroomCars.length || 111}
          />
        </Suspense>
      );
    }

    const filteredFleet =
      selectedBrand === 'ALL'
        ? displayedFleet
        : displayedFleet.filter((c) => (c.brand || '').toLowerCase().includes(selectedBrand.toLowerCase()));

    return (
      <Suspense fallback={<ViewFallback />}>
        <NfsGarageView
          key={`garage-3d-${selectedBrand}-${target3DCarId || 'default'}`}
          garage={filteredFleet}
          initialCarId={target3DCarId}
          selectedBrandTitle={
            showroomMode
              ? `Showroom // ${selectedBrand === 'ALL' ? 'Todos' : selectedBrand}`
              : (selectedBrand === 'ALL' ? 'Todos los Fabricantes' : selectedBrand)
          }
          onBackToBookshelf={() => {
            setSelectedBrand(null);
            setTarget3DCarId(null);
            setCustom3DCar(null);
          }}
          onDeleteCar={!showroomMode ? handleDeleteFromGarage : undefined}
          onOpenScanner={() => setActiveTab('scanner')}
          studioTheme="light"
          savedIds={savedCarIds}
        />
      </Suspense>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--cl-canvas)] text-[var(--cl-text-primary)] flex flex-col justify-center items-center">
      {saveNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-2xl bg-red-600 text-white font-semibold text-xs shadow-2xl border border-red-400/50 backdrop-blur-xl max-w-[92vw] text-center animate-fade-in"
        >
          {saveNotice.message}
        </div>
      )}
      <MobileContainer
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'garage') {
            setSelectedBrand(null);
            setTarget3DCarId(null);
            setCustom3DCar(null);
          }
        }}
        garage={garage}
        savedIds={savedCarIds}
        user={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCarIn3D={handleOpenCarIn3D}
        renderGarageContent={renderGarageContent}
        renderScannerContent={() => (
          <Suspense fallback={<ViewFallback />}>
            <ScannerView
              onSaveToGarage={handleSaveToGarage}
              savedCarIds={savedCarIds}
              dailySaveStats={dailySaveStats}
              onBroadcastToRadar={() => setActiveTab('radar')}
            />
          </Suspense>
        )}
        renderRadarContent={() => (
          <Suspense fallback={<ViewFallback />}>
            <RadarView onSpotFound={handleSpotFromRadar} savedCarIds={savedCarIds} />
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
    </div>
  );
}
