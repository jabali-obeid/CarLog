import React, { useState, useMemo } from 'react';
import {
  Search, SlidersHorizontal, ArrowUpRight, LayoutGrid, Rows3,
  Check, Warehouse, X, ArrowUpDown, BookOpen, Box
} from 'lucide-react';

const RARITY_OPTIONS = ['Todos', 'Legendario', 'Histórico', 'Raro', 'Común', 'Básico'];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Popular' },
  { id: 'hp_desc', label: 'Potencia ↓' },
  { id: 'accel_asc', label: '0–100 ↑' },
  { id: 'speed_desc', label: 'Vel. Máx ↓' }
];

const POWER_PRESETS = [
  { id: 'all', label: 'Cualquier potencia', minHp: 0 },
  { id: '250', label: '+250 CV', minHp: 250 },
  { id: '400', label: '+400 CV', minHp: 400 },
  { id: '500', label: '+500 CV', minHp: 500 }
];

function getModelCodeWatermark(car) {
  const raw = String(car?.model || car?.name || car?.brand || 'CARLOG')
    .replace(/\([^)]*\)/g, '')
    .trim();
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'CARLOG';
  if (tokens.length === 1) return tokens[0].slice(0, 9).toUpperCase();
  const firstTwo = `${tokens[0]} ${tokens[1]}`;
  if (firstTwo.length <= 9) return firstTwo.toUpperCase();
  return tokens[0].slice(0, 9).toUpperCase();
}

function getNumeric(val, fallback = 0) {
  const n = parseFloat(String(val ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function ShowroomCard({ car, isFeatured, isSaved, layout, onSelectFeatured, onOpenIn3D, onSaveToGarage }) {
  const [cutoutFailed, setCutoutFailed] = useState(false);

  const modelName = car.model || car.name || '';
  const watermark = getModelCodeWatermark(car);
  const hpNum = getNumeric(car.hp, 200);
  const zeroNum = getNumeric(car.zeroToHundred, 5.2);
  const speedNum = getNumeric(car.topSpeed, 240);

  const showCutout = Boolean(car.cutoutImage) && !cutoutFailed;
  const displaySrc = showCutout ? car.cutoutImage : (car.image || car.imageUrl);
  const compactEngine = car.engine ? car.engine.split('(')[0].trim() : `${car.country || 'Showroom'}`;
  const isTwoCol = layout === 'grid';

  return (
    <article
      onClick={() => onSelectFeatured(car.id)}
      className={`group relative rounded-[24px] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
        isTwoCol ? 'p-3.5' : 'p-4 sm:p-5'
      } ${
        isFeatured
          ? 'cl-studio-featured'
          : 'cl-studio-card hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(15,23,42,0.14)]'
      }`}
    >
      {/* Top Header: Model + Power + Open in 3D Circle Button */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={`font-sans font-bold text-[#111318] tracking-tight leading-snug truncate ${
              isTwoCol ? 'text-[13px]' : 'text-[16px]'
            }`}
          >
            {car.brand} {modelName}
          </h3>
          <p className={`text-[#6b7280] font-medium truncate mt-0.5 ${isTwoCol ? 'text-[10px]' : 'text-[11px]'}`}>
            {isTwoCol ? `${car.rarity || 'Showroom'} · ${car.year || '2024'}` : `${compactEngine} · ${car.year || '2024'}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`font-telemetry font-bold text-[#111318] whitespace-nowrap ${
              isTwoCol ? 'text-[11px]' : 'text-[13px]'
            }`}
          >
            {hpNum} CV
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenIn3D) onOpenIn3D(car);
            }}
            title={`Abrir ${car.brand} ${modelName} en 3D`}
            aria-label={`Abrir ${car.brand} ${modelName} en 3D`}
            className={`rounded-full bg-white/95 hover:bg-[#111318] text-[#111318] hover:text-white border border-black/[0.09] shadow-sm flex items-center justify-center transition active:scale-90 ${
              isTwoCol ? 'w-7 h-7' : 'w-8 h-8'
            }`}
          >
            <ArrowUpRight className={isTwoCol ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        </div>
      </div>

      {/* Center Stage with Giant Background Model Watermark */}
      <div
        className={`relative flex items-center justify-center overflow-hidden my-2 ${
          isTwoCol ? 'h-24' : 'h-36 sm:h-40'
        }`}
      >
        {/* Giant Background Watermark */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 text-center font-display font-extrabold uppercase italic tracking-tighter leading-none whitespace-nowrap select-none pointer-events-none ${
            isTwoCol ? 'text-[44px] bottom-1' : 'text-[68px] sm:text-[78px] bottom-0'
          } ${isFeatured ? 'text-emerald-950/[0.075]' : 'text-[#0f172a]/[0.055]'}`}
        >
          {watermark}
        </span>

        {showCutout ? (
          <img
            src={displaySrc}
            alt={`${car.brand} ${modelName}`}
            loading="lazy"
            onError={() => setCutoutFailed(true)}
            className={`relative z-10 w-auto max-w-[92%] object-contain drop-shadow-[0_14px_16px_rgba(15,23,42,0.18)] transition-transform duration-500 group-hover:scale-[1.04] ${
              isTwoCol ? 'max-h-[86px]' : 'max-h-[132px]'
            }`}
          />
        ) : (
          <div
            className={`relative z-10 w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-[#eef0f3] shadow-sm ${
              isTwoCol ? 'h-22' : 'h-32 sm:h-36'
            }`}
          >
            <img
              src={displaySrc}
              alt={`${car.brand} ${modelName}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-white/88 backdrop-blur-sm text-[9px] font-telemetry font-semibold text-[#111318] border border-black/[0.06]">
              {car.rarity || 'Showroom'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom 3-Metric Telemetry Footer + Save Strip */}
      <div className="relative z-10 space-y-2.5 pt-1">
        <div className="grid grid-cols-3 gap-1.5 items-end">
          <div>
            <div className={`font-telemetry font-bold text-[#111318] leading-tight ${isTwoCol ? 'text-[11px]' : 'text-[13px]'}`}>
              {hpNum} CV
            </div>
            <div className={`text-[#6b7280] font-medium ${isTwoCol ? 'text-[9px]' : 'text-[10px]'}`}>
              Potencia
            </div>
          </div>

          <div className="text-center">
            <div className={`font-telemetry font-bold text-[#111318] leading-tight ${isTwoCol ? 'text-[11px]' : 'text-[13px]'}`}>
              {zeroNum} s
            </div>
            <div className={`text-[#6b7280] font-medium ${isTwoCol ? 'text-[9px]' : 'text-[10px]'}`}>
              0–100 km/h
            </div>
          </div>

          <div className="text-right">
            <div className={`font-telemetry font-bold text-[#111318] leading-tight ${isTwoCol ? 'text-[11px]' : 'text-[13px]'}`}>
              {speedNum} km/h
            </div>
            <div className={`text-[#6b7280] font-medium ${isTwoCol ? 'text-[9px]' : 'text-[10px]'}`}>
              Vel. Máx
            </div>
          </div>
        </div>

        {/* Save / 3D Action Row */}
        {onSaveToGarage && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSaveToGarage(car);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                isSaved
                  ? 'bg-emerald-600/12 text-emerald-800 border border-emerald-700/20'
                  : 'bg-[#111318] text-white hover:bg-[#1f2430]'
              }`}
            >
              {isSaved ? <Check className="w-3 h-3" /> : <Warehouse className="w-3 h-3" />}
              <span>{isSaved ? 'En Garage' : 'Guardar'}</span>
            </button>

            {!isTwoCol && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenIn3D) onOpenIn3D(car);
                }}
                className="py-1.5 px-3 rounded-xl text-[11px] font-semibold bg-white text-[#111318] border border-black/[0.1] hover:bg-zinc-100 transition flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Box className="w-3 h-3" />
                <span>Ver 3D</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ShowroomGallery({
  cars = [],
  savedIds = new Set(),
  onSaveToGarage,
  onOpenIn3D,
  onBackToBookshelf,
  title = 'En Showroom',
  loadingCatalog = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('Todos');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minHp, setMinHp] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [layout, setLayout] = useState('single'); // 'single' | 'grid'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [featuredId, setFeaturedId] = useState(null);

  const availableBrands = useMemo(() => {
    const counts = {};
    for (const c of cars) {
      const b = c.brand || 'Otros';
      counts[b] = (counts[b] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cars]);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const cycleSort = () => {
    const idx = SORT_OPTIONS.findIndex((o) => o.id === sortBy);
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].id);
  };

  const filteredCars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = cars.filter((c) => {
      if (selectedRarity !== 'Todos' && c.rarity !== selectedRarity) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(c.brand)) return false;
      if (minHp > 0 && getNumeric(c.hp, 0) < minHp) return false;
      if (q) {
        const hay = `${c.brand || ''} ${c.model || c.name || ''} ${c.engine || ''} ${c.year || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'hp_desc') {
      return [...list].sort((a, b) => getNumeric(b.hp) - getNumeric(a.hp));
    }
    if (sortBy === 'accel_asc') {
      return [...list].sort((a, b) => getNumeric(a.zeroToHundred, 99) - getNumeric(b.zeroToHundred, 99));
    }
    if (sortBy === 'speed_desc') {
      return [...list].sort((a, b) => getNumeric(b.topSpeed) - getNumeric(a.topSpeed));
    }
    return list;
  }, [cars, searchQuery, selectedRarity, selectedBrands, minHp, sortBy]);

  const activeFilterCount =
    (selectedRarity !== 'Todos' ? 1 : 0) + selectedBrands.length + (minHp > 0 ? 1 : 0);

  const activeFeaturedId =
    featuredId && filteredCars.some((c) => c.id === featuredId)
      ? featuredId
      : filteredCars[0]?.id;

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label || 'Popular';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRarity('Todos');
    setSelectedBrands([]);
    setMinHp(0);
  };

  return (
    <div className="min-h-full bg-[#f4f5f7] text-[#111318] px-3.5 pt-3.5 pb-6 space-y-3.5 select-none">
      {/* Studio Header Bar (matches CARZONE "In Stock (27)" + Sort + View Toggle) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBackToBookshelf && (
            <button
              type="button"
              onClick={onBackToBookshelf}
              className="h-8 px-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-black/[0.08] text-[11px] font-semibold text-[#111318] flex items-center gap-1.5 shadow-xs transition active:scale-95 shrink-0"
              title="Volver a Mi Estantería"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-600" />
              <span>Mi Flota</span>
            </button>
          )}
          <div className="flex items-baseline gap-1.5 min-w-0">
            <h2 className="font-sans text-[20px] font-bold tracking-tight text-[#111318] truncate">
              {title}
            </h2>
            <span className="font-telemetry text-sm font-medium text-[#6b7280] shrink-0">
              ({filteredCars.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cycleSort}
            className="h-8 px-2.5 rounded-full bg-white hover:bg-zinc-100 border border-black/[0.08] text-[11px] font-semibold text-[#111318] flex items-center gap-1 transition active:scale-95"
            title="Cambiar orden"
          >
            <span>{currentSortLabel}</span>
            <ArrowUpDown className="w-3 h-3 text-zinc-500" />
          </button>

          <div className="h-8 p-0.5 rounded-xl bg-white border border-black/[0.08] flex items-center">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              aria-label="Vista en grilla"
              className={`w-7 h-6.5 rounded-lg flex items-center justify-center transition ${
                layout === 'grid' ? 'bg-[#111318] text-white' : 'text-zinc-500 hover:text-[#111318]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayout('single')}
              aria-label="Vista amplia"
              className={`w-7 h-6.5 rounded-lg flex items-center justify-center transition ${
                layout === 'single' ? 'bg-[#111318] text-white' : 'text-zinc-500 hover:text-[#111318]'
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters Pill Strip */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar marca o modelo..."
            className="w-full h-9 pl-8 pr-8 rounded-xl bg-white border border-black/[0.08] text-xs font-medium text-[#111318] placeholder-zinc-400 focus:outline-none focus:border-black/25 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#111318]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
            filtersOpen || activeFilterCount > 0
              ? 'bg-[#111318] text-white border-[#111318]'
              : 'bg-white text-[#111318] border-black/[0.08] hover:bg-zinc-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-[#081c15] font-telemetry text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Horizontal Brand Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedBrands([])}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition active:scale-95 shrink-0 ${
            selectedBrands.length === 0
              ? 'bg-[#111318] text-white border-[#111318]'
              : 'bg-white text-[#4b5563] border-black/[0.08] hover:text-[#111318]'
          }`}
        >
          Todas
        </button>
        {availableBrands.map((b) => {
          const active = selectedBrands.includes(b.name);
          return (
            <button
              type="button"
              key={b.name}
              onClick={() => toggleBrand(b.name)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition active:scale-95 shrink-0 flex items-center gap-1.5 ${
                active
                  ? 'bg-[#111318] text-white border-[#111318]'
                  : 'bg-white text-[#4b5563] border-black/[0.08] hover:text-[#111318]'
              }`}
            >
              <span>{b.name}</span>
              <span className={`font-telemetry text-[10px] ${active ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {b.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable Filter Panel (CARZONE Left-Sidebar style adapted for mobile) */}
      {filtersOpen && (
        <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 shadow-md space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-telemetry font-bold uppercase tracking-widest text-[#6b7280]">
              Refinar Showroom
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold text-red-600 hover:underline"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Rarity Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-telemetry font-bold uppercase tracking-wider text-[#6b7280] block">
              Categoría / Rareza
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RARITY_OPTIONS.map((rarity) => {
                const active = selectedRarity === rarity;
                return (
                  <button
                    type="button"
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      active
                        ? 'bg-[#111318] text-white border-[#111318]'
                        : 'bg-[#f8f9fb] text-[#4b5563] border-black/[0.07] hover:text-[#111318]'
                    }`}
                  >
                    {rarity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Power Threshold */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-telemetry font-bold uppercase tracking-wider text-[#6b7280] block">
              Potencia Mínima
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POWER_PRESETS.map((preset) => {
                const active = minHp === preset.minHp;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setMinHp(preset.minHp)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-telemetry font-semibold border transition ${
                      active
                        ? 'bg-[#111318] text-white border-[#111318]'
                        : 'bg-[#f8f9fb] text-[#4b5563] border-black/[0.07] hover:text-[#111318]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Checkboxes */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-telemetry font-bold uppercase tracking-wider text-[#6b7280] block">
              Marcas
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {availableBrands.map((b) => {
                const checked = selectedBrands.includes(b.name);
                return (
                  <button
                    type="button"
                    key={b.name}
                    onClick={() => toggleBrand(b.name)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f4f5f7] text-left transition"
                  >
                    <span
                      className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition ${
                        checked
                          ? 'bg-[#111318] border-[#111318] text-white'
                          : 'bg-white border-black/20'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className={`text-xs truncate ${checked ? 'font-bold text-[#111318]' : 'text-[#4b5563]'}`}>
                      {b.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {loadingCatalog && filteredCars.length === 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[24px] bg-white border border-black/[0.06] p-5 h-60 animate-pulse" />
          ))}
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-black/[0.07] p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[#111318]">No hay modelos con esos filtros</p>
          <p className="text-xs text-[#6b7280]">
            Prueba limpiando la búsqueda o seleccionando otra marca/rareza.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-[#111318] text-white text-xs font-semibold hover:bg-[#232834] transition active:scale-95"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {filteredCars.map((car) => {
            const key = car.id || `${car.brand}-${car.model || car.name}`;
            const isSaved = savedIds.has(car.id) || savedIds.has(`${car.brand}-${car.model || car.name}`);
            return (
              <ShowroomCard
                key={key}
                car={car}
                isFeatured={car.id === activeFeaturedId}
                isSaved={isSaved}
                layout={layout}
                onSelectFeatured={setFeaturedId}
                onOpenIn3D={onOpenIn3D}
                onSaveToGarage={onSaveToGarage}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

