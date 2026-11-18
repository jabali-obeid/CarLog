import React, { useState } from 'react';
import { Warehouse, Zap, Gauge, Award, Filter, Trash2, Search, ExternalLink } from './CarLogIcons';
import CarCard from './CarCard';
import { RARITY_CONFIG } from '../utils/demoData';
import { sound } from '../utils/audio';

export default function GarageView({ garage, onDeleteCar }) {
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectCar, setInspectCar] = useState(null);

  // Compute Garage Stats
  const totalCars = garage.length;
  const totalHp = garage.reduce((acc, car) => acc + (car.hp || 0), 0);
  
  // Fastest 0-100
  const fastestCar = garage.length > 0 
    ? [...garage].sort((a, b) => (a.zeroToHundred || 99) - (b.zeroToHundred || 99))[0]
    : null;

  // Rarest count
  const rarityCounts = garage.reduce((acc, car) => {
    const r = car.rarity || 'Común';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const filteredCars = garage.filter(car => {
    const matchesRarity = selectedFilter === 'Todos' || car.rarity === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      `${car.brand} ${car.model} ${car.year}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  const rarityTabs = ['Todos', 'Histórico', 'Legendario', 'Raro', 'Común', 'Básico'];

  return (
    <div className="space-y-6">
      {/* Garage Dashboard Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl cl-card">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-racing-ink" />
            Autos Coleccionados
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-telemetry text-ink mt-1">
            {totalCars} <span className="text-xs font-sans font-normal text-ink-muted">vehículos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl cl-card">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-ink" />
            Potencia del Garage
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-telemetry text-amber-ink mt-1">
            {totalHp.toLocaleString()} <span className="text-xs font-sans font-normal text-ink-muted">CV</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl cl-card">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-racing-ink" />
            Más Rápido (0-100)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-telemetry text-ink mt-1 truncate">
            {fastestCar ? `${fastestCar.zeroToHundred}s` : '--'}
            <span className="text-xs font-sans font-normal text-ink-muted block truncate">
              {fastestCar ? `${fastestCar.brand} ${fastestCar.model}` : 'Ninguno'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl cl-card">
          <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-racing-ink" />
            Nivel Coleccionista
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-ink mt-1">
            {rarityCounts['Histórico'] || rarityCounts['Legendario'] ? '★ Maestro' : 'Experto'}
            <span className="text-xs font-normal text-ink-muted block">
              {(rarityCounts['Legendario'] || 0) + (rarityCounts['Histórico'] || 0)} Épicos
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 cl-card p-3 rounded-2xl">
        {/* Rarity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {rarityTabs.map((tab) => {
            const count = tab === 'Todos' ? totalCars : (rarityCounts[tab] || 0);
            const active = selectedFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 ${
                  active
                    ? 'bg-racing text-white shadow-sm'
                    : 'bg-recessed hover:bg-black/[0.08] text-ink-secondary hover:text-ink'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${active ? 'bg-black/20 text-white' : 'bg-surface text-ink-secondary'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar en mi garage"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por marca o modelo..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-recessed border border-black/[0.1] text-ink placeholder-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-racing/40 focus:border-racing"
          />
        </div>
      </div>

      {/* Garage Cards Grid */}
      {filteredCars.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl cl-card space-y-3">
          <Warehouse className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="font-display text-lg font-bold text-ink">No se encontraron autos en esta sección</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            Utiliza la pestaña <strong>Scanner</strong> para fotografiar vehículos o prueba los autos de demostración para agregarlos a tu garage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const rarityCfg = RARITY_CONFIG[car.rarity] || RARITY_CONFIG['Común'];

            return (
              <div key={car.id} className="relative group">
                <CarCard
                  car={car}
                  isSaved={true}
                  onRevEngine={() => sound.playEngineRev()}
                />
                
                {/* Delete button from garage */}
                <button
                  type="button"
                  onClick={() => onDeleteCar(car.id)}
                  title="Eliminar de mi garage"
                  aria-label={`Eliminar ${car.brand} ${car.model} de mi garage`}
                  className="absolute top-2 right-2 p-2.5 rounded-full bg-black/70 hover:bg-red-600 text-zinc-200 hover:text-white transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 z-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

