import React, { useState, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Warehouse, Box } from 'lucide-react';

export default function BrandBookshelf({
  garage = [],
  onSelectBrand,
  showingShowroom = false,
  onToggleShowroom,
  showroomCount = 60
}) {
  const [hoveredBrand, setHoveredBrand] = useState(null);
  const scrollRef = useRef(null);

  // Group garage cars by brand
  const brandGroups = garage.reduce((acc, car) => {
    const brand = car.brand || 'Otros';
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(car);
    return acc;
  }, {});

  // Pre-configured brand book spine styles (inspired by Colophon x Monotype visual identity)
  const BRAND_BOOK_CONFIGS = {
    'Porsche': {
      spineBg: 'bg-[#FFDE00]', // Leaning yellow book like "MIDNIGHT"
      spineText: 'text-[#111111]',
      title: 'PORSCHE',
      subtitle: 'STUTTGART // 911',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'rotate-[-3deg] hover:rotate-0 -translate-y-2',
      accentColor: '#FFDE00',
      origin: 'Alemania',
      edition: 'VOL. 992'
    },
    'Ferrari': {
      spineBg: 'bg-[#E10600]', // Iconic Rosso Corsa
      spineText: 'text-white',
      title: 'FERRARI',
      subtitle: 'MARANELLO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-84 sm:h-[400px]',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#E10600',
      origin: 'Italia',
      edition: 'EDIZIONE'
    },
    'Peugeot': {
      spineBg: 'bg-[#002D62]',
      spineText: 'text-white',
      title: 'PEUGEOT',
      subtitle: 'FRANCE // 206 & 308',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#002D62',
      origin: 'Francia / ARG',
      edition: 'LION EDITION'
    },
    'Renault': {
      spineBg: 'bg-[#FFCC00]',
      spineText: 'text-black',
      title: 'RENAULT',
      subtitle: 'ROMBO // R12 & CLIO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-84 sm:h-[400px]',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#FFCC00',
      origin: 'Francia / ARG',
      edition: 'ROMBO CLASSIC'
    },
    'Chevrolet': {
      spineBg: 'bg-[#D4AF37]',
      spineText: 'text-black',
      title: 'CHEVROLET',
      subtitle: 'CORSA // BOWTIE',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-92',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#D4AF37',
      origin: 'ARG / EE.UU.',
      edition: 'CORSA CLASSIC'
    },
    'Subaru': {
      spineBg: 'bg-[#003399]',
      spineText: 'text-white',
      title: 'SUBARU',
      subtitle: 'WRX // IMPREZA & XV',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#FFD700',
      origin: 'Japón',
      edition: 'BOXER AWD'
    },
    'Lada': {
      spineBg: 'bg-[#B91C1C]',
      spineText: 'text-white',
      title: 'LADA NIVA',
      subtitle: 'TOGLIATTI // 4X4',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-88',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#B91C1C',
      origin: 'Rusia / ARG',
      edition: 'OFFROAD 4X4'
    },
    'Mitsubishi': {
      spineBg: 'bg-[#DC2626]',
      spineText: 'text-white',
      title: 'MITSUBISHI',
      subtitle: 'LANCER // RALLIART',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#DC2626',
      origin: 'Japón',
      edition: 'EVOLUTION'
    },
    'Ford': {
      spineBg: 'bg-[#FF5500]', // Vibrant Orange like Cotford book
      spineText: 'text-white',
      title: 'FORD',
      subtitle: 'FIESTA // FOCUS // KA',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-88',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#FF5500',
      origin: 'EE.UU. / ARG',
      edition: 'KINETIC'
    },
    'BMW': {
      spineBg: 'bg-[#0066B1]', // Deep M-Power Blue like Basis book
      spineText: 'text-white',
      title: 'BMW',
      subtitle: 'BAVARIA // E30 & M3',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#0066B1',
      origin: 'Alemania',
      edition: 'ULTIMATE DRIVE'
    },
    'Audi': {
      spineBg: 'bg-[#BB0A30]',
      spineText: 'text-white',
      title: 'AUDI',
      subtitle: 'INGOLSTADT // QUATTRO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-92',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#BB0A30',
      origin: 'Alemania',
      edition: '4-RINGS'
    },
    'Alfa Romeo': {
      spineBg: 'bg-[#98002E]',
      spineText: 'text-white',
      title: 'ALFA ROMEO',
      subtitle: 'MILANO // QUADRIFOGLIO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#98002E',
      origin: 'Italia',
      edition: 'CUORE SPORTIVO'
    },
    'Toyota': {
      spineBg: 'bg-[#F2F2F2]', // Paper white like Aperçu book
      spineText: 'text-zinc-900',
      title: 'TOYOTA',
      subtitle: 'AICHI // GAZOO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-92',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#EB0A1E',
      origin: 'Japón',
      edition: 'COROLLA'
    },
    'Lamborghini': {
      spineBg: 'bg-[#B026FF]', // Vibrant Purple like Lardent book
      spineText: 'text-white',
      title: 'LAMBORGHINI',
      subtitle: 'SANT\'AGATA',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-84 sm:h-[410px]',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#B026FF',
      origin: 'Italia',
      edition: 'BULL ARCHIVE'
    },
    'Mercedes-Benz': {
      spineBg: 'bg-[#00D2BE]', // Petronas Teal like System 85 book
      spineText: 'text-zinc-900',
      title: 'AMG',
      subtitle: 'AFFALTERBACH',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#00D2BE',
      origin: 'Alemania',
      edition: 'BITURBO'
    },
    'Volkswagen': {
      spineBg: 'bg-[#001E50]',
      spineText: 'text-white',
      title: 'VOLKSWAGEN',
      subtitle: 'GOL // GOLF // AMAROK',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-84 sm:h-[400px]',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#001E50',
      origin: 'Alemania / ARG',
      edition: 'DAS AUTO'
    },
    'Fiat': {
      spineBg: 'bg-[#8B0000]',
      spineText: 'text-white',
      title: 'FIAT',
      subtitle: 'FITITO // 147 // UNO',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#8B0000',
      origin: 'Italia / ARG',
      edition: 'FITITO ARCHIVE'
    },
    'Citroën': {
      spineBg: 'bg-[#E30613]',
      spineText: 'text-white',
      title: 'CITROËN',
      subtitle: 'PARIS // 2CV & 3CV',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-76 sm:h-92',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#E30613',
      origin: 'Francia / ARG',
      edition: 'CHEVRON'
    },
    'Honda': {
      spineBg: 'bg-[#CC0000]',
      spineText: 'text-white',
      title: 'HONDA',
      subtitle: 'TOKYO // CIVIC & VTEC',
      spineWidth: 'w-20 sm:w-24',
      spineHeight: 'h-80 sm:h-96',
      tiltClass: 'hover:-translate-y-3',
      accentColor: '#CC0000',
      origin: 'Japón / ARG',
      edition: 'VTEC POWER'
    }
  };

  const allBrands = [
    'BMW',
    'Volkswagen',
    'Fiat',
    'Renault',
    'Peugeot',
    'Chevrolet',
    'Ford',
    'Toyota',
    'Mercedes-Benz',
    'Audi',
    'Honda',
    'Citroën',
    'Alfa Romeo',
    'Subaru',
    'Mitsubishi',
    'Lada',
    'Porsche',
    'Ferrari'
  ];

  // Smooth scroll left and right
  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Convert mouse vertical wheel into horizontal bookshelf slide
  const handleWheel = (e) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto select-none">
      {/* Header Monotype x Colophon Style */}
      <div className="text-center space-y-1.5 pb-3 border-b border-white/[0.08] px-2">
        <div className="inline-flex items-center gap-2 text-[10px] font-telemetry tracking-widest text-[var(--cl-text-muted)] uppercase">
          <span>CARLOG</span>
          <span className="text-red-500 font-bold">×</span>
          <span>MANUFACTURERS ARCHIVE</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
          Biblioteca de Marcas
        </h2>
        <p className="text-xs text-[var(--cl-text-secondary)] max-w-xs mx-auto">
          Desliza horizontalmente y toca un volumen para abrir sus vehículos en el taller 3D.
        </p>

        {/* Quick Access Pills: Ver Toda la Flota & Catálogo 3D Showroom */}
        <div className="pt-2 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onSelectBrand('ALL')}
            className="px-4 py-1.5 rounded-full cl-pill hover:bg-[#232838] text-[11px] font-telemetry font-bold text-zinc-200 hover:text-white transition flex items-center gap-1.5 active:scale-95"
          >
            <Warehouse className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {showingShowroom ? `Ver Showroom (${garage.length})` : `Mi Flota (${garage.length})`}
            </span>
          </button>

          {onToggleShowroom && (
            <button
              onClick={onToggleShowroom}
              className={`px-4 py-1.5 rounded-full border text-[11px] font-telemetry font-bold transition flex items-center gap-1.5 active:scale-95 ${
                showingShowroom
                  ? 'bg-white text-[#08090c] border-white shadow-sm'
                  : 'cl-panel text-zinc-300 hover:text-white hover:border-white/20'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>
                {showingShowroom ? 'Volver a Mi Progreso' : `Catálogo 3D (${showroomCount})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* The Bookshelf Showcase Container */}
      <div className="relative rounded-3xl cl-card cl-microgrid p-3 sm:p-6 overflow-hidden min-h-[450px] flex flex-col justify-end">
        {/* Ambient Top Studio Lighting */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

        {/* Floating Left Navigation Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-500 active:scale-90 transition shadow-2xl backdrop-blur-md"
          title="Deslizar marcas a la izquierda"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Navigation Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-500 active:scale-90 transition shadow-2xl backdrop-blur-md"
          title="Deslizar marcas a la derecha"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Hovered Brand Live Status Tip */}
        <div className="text-center mb-2 z-20">
          {hoveredBrand ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[11px] text-white font-mono shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{hoveredBrand}:</span>
              <strong className="text-zinc-200">
                {(brandGroups[hoveredBrand] || []).length} modelo(s) en tu garage
              </strong>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <BookOpen className="w-3 h-3" />
              <span>Toca las flechas o desliza con el dedo / rueda para girar entre libros</span>
            </div>
          )}
        </div>

        {/* Books Standing Side-by-Side (Scrollable Container) */}
        <div 
          ref={scrollRef}
          onWheel={handleWheel}
          className="relative z-10 flex items-end gap-3 overflow-x-auto pb-4 pt-10 px-8 snap-x scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allBrands.map((brandName) => {
            const config = BRAND_BOOK_CONFIGS[brandName] || {
              spineBg: 'bg-zinc-800',
              spineText: 'text-white',
              title: brandName.toUpperCase(),
              subtitle: 'AUTO ARCHIVE',
              spineWidth: 'w-20',
              spineHeight: 'h-80',
              tiltClass: '',
              accentColor: '#FFFFFF',
              origin: 'Global'
            };

            const collectedCars = brandGroups[brandName] || [];
            const hasCars = collectedCars.length > 0;

            return (
              <div
                key={brandName}
                onMouseEnter={() => setHoveredBrand(brandName)}
                onMouseLeave={() => setHoveredBrand(null)}
                onClick={() => onSelectBrand(brandName, collectedCars)}
                className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 snap-center ${config.spineWidth} ${config.spineHeight} ${config.tiltClass}`}
              >
                {/* Book Spine */}
                <div
                  className={`w-full h-full rounded-t-sm shadow-[0_12px_30px_rgba(0,0,0,0.85)] border-r border-t border-l border-white/20 flex flex-col justify-between py-5 px-2 transition-transform duration-300 group-hover:-translate-y-5 active:scale-95 ${config.spineBg} ${config.spineText}`}
                >
                  {/* Top Spine: Origin */}
                  <div className="text-[9px] font-black uppercase tracking-wider text-center opacity-80 truncate">
                    {config.origin}
                  </div>

                  {/* Main Spine Typography: Bold Vertical Brand Name */}
                  <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
                    <span 
                      style={{ writingMode: 'vertical-rl' }}
                      className="text-base sm:text-xl font-black tracking-widest uppercase transform rotate-180 drop-shadow-sm whitespace-nowrap"
                    >
                      {config.title}
                    </span>
                  </div>

                  {/* Bottom Spine: Count & Status */}
                  <div className="space-y-1 pt-1.5 border-t border-black/15 text-center">
                    <div className="text-[8px] font-mono font-black tracking-tighter uppercase opacity-90 truncate">
                      {hasCars ? `${collectedCars.length} AUTO(S)` : '0 AUTOS'}
                    </div>

                    <div className="w-5 h-5 rounded-full mx-auto flex items-center justify-center font-mono text-[9px] font-black border border-current shadow-sm">
                      {hasCars ? collectedCars.length : '0'}
                    </div>
                  </div>
                </div>

                {/* Ground Shadow */}
                <div className="absolute -bottom-2 inset-x-1 h-3 bg-black/60 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
            );
          })}
        </div>

        {/* The Wooden / Metallic Shelf Ledge */}
        <div className="relative z-20 w-full h-4 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 border-t border-zinc-600 shadow-2xl rounded-b-md flex items-center justify-between px-4">
          <div className="h-0.5 w-full bg-black/40 rounded-full"></div>
        </div>
      </div>

      {/* Brand Direct Tap Quick Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 justify-start sm:justify-center">
        {allBrands.map((b) => {
          const count = (brandGroups[b] || []).length;
          return (
            <button
              key={b}
              onClick={() => onSelectBrand(b, brandGroups[b] || [])}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white border border-zinc-800 whitespace-nowrap transition active:scale-95 flex items-center gap-1"
            >
              <span>{b}</span>
              {count > 0 && <span className="text-amber-400">({count})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
