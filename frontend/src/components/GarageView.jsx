import React, { useState } from 'react';
import { Warehouse, Zap, Gauge, Award, Filter, Trash2, Search, ExternalLink } from 'lucide-react';
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
        <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 shadow-lg">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-red-500" />
            Autos Coleccionados
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {totalCars} <span className="text-xs font-normal text-zinc-400">vehículos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 shadow-lg">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Potencia del Garage
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
            {totalHp.toLocaleString()} <span className="text-xs font-normal text-zinc-400">CV</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 shadow-lg">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Más Rápido (0-100)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-1 truncate">
            {fastestCar ? `${fastestCar.zeroToHundred}s` : '--'}
            <span className="text-xs font-normal text-zinc-400 block truncate">
              {fastestCar ? `${fastestCar.brand} ${fastestCar.model}` : 'Ninguno'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11131f] border border-white/10 shadow-lg">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            Nivel Coleccionista
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-yellow-400 mt-1">
            {rarityCounts['Histórico'] || rarityCounts['Legendario'] ? '★ Maestro' : 'Experto'}
            <span className="text-xs font-normal text-zinc-400 block">
              {(rarityCounts['Legendario'] || 0) + (rarityCounts['Histórico'] || 0)} Épicos
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0f17] p-3 rounded-2xl border border-white/10">
        {/* Rarity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {rarityTabs.map((tab) => {
            const count = tab === 'Todos' ? totalCars : (rarityCounts[tab] || 0);
            const active = selectedFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por marca o modelo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Garage Cards Grid */}
      {filteredCars.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#0f111a] border border-white/5 space-y-3">
          <Warehouse className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron autos en esta sección</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
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
                  onClick={() => onDeleteCar(car.id)}
                  title="Eliminar de mi garage"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600/80 text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100 z-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

