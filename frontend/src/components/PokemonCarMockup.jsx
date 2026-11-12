import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Zap, Shield, Gauge, Target, 
  MapPin, Heart, Settings, Camera, Flame, Award, Radio, Check, Volume2, Sparkles
} from 'lucide-react';
import { POKEDEX_CARS } from '../utils/demoData';
import { sound } from '../utils/audio';

export default function PokemonCarMockup({ onOpenScanner, onOpenRadar, onSaveToGarage, savedIds = new Set() }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState('about'); // 'hero' | 'about' | 'radar'
  const [likedCars, setLikedCars] = useState(new Set());
  const [toast, setToast] = useState(null);

  const car = POKEDEX_CARS[currentIndex];
  const isSaved = savedIds.has(car.id) || savedIds.has(`${car.brand}-${car.name}`);
  const isLiked = likedCars.has(car.id);

  const nextCar = () => {
    sound.playRadarPing();
    setCurrentIndex((prev) => (prev + 1) % POKEDEX_CARS.length);
  };

  const prevCar = () => {
    sound.playRadarPing();
    setCurrentIndex((prev) => (prev - 1 + POKEDEX_CARS.length) % POKEDEX_CARS.length);
  };

  const toggleLike = () => {
    sound.playCameraClick();
    setLikedCars((prev) => {
      const next = new Set(prev);
      if (next.has(car.id)) next.delete(car.id);
      else next.add(car.id);
      return next;
    });
  };

  const handleCapture = () => {
    sound.playEngineRev();
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
    setToast(`¡${car.brand} ${car.name} atrapado en tu Garage! 🏎️`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-4 px-2 select-none">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-8 z-50 px-5 py-2.5 rounded-full bg-white text-zinc-900 font-bold text-xs shadow-2xl border border-zinc-200 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      {/* Car Selector Pill Ticker at Top */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto max-w-md pb-2 px-2">
        {POKEDEX_CARS.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => {
              sound.playRadarPing();
              setCurrentIndex(idx);
            }}
            style={{ 
              backgroundColor: idx === currentIndex ? c.themeColor : 'rgba(255,255,255,0.06)',
              color: idx === currentIndex ? '#FFFFFF' : '#A1A1AA'
            }}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm hover:scale-105 active:scale-95"
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Mobile Device Frame */}
      <div 
        className="relative w-full max-w-[390px] h-[780px] rounded-[50px] shadow-2xl p-4 overflow-hidden border-[8px] border-zinc-900 transition-colors duration-500 flex flex-col justify-between"
        style={{ backgroundColor: car.themeColor }}
      >
        {/* Device Notch & Status Bar */}
        <div className="relative z-30 pt-1 px-3 flex items-center justify-between text-white text-[12px] font-semibold tracking-tight">
          <span className="font-bold">GS</span>
          <div className="w-28 h-4 bg-black/20 rounded-full mx-auto backdrop-blur-sm flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-black/40 mr-2"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-black/30"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-white rounded-[4px] p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Top Navigation Bar: < CarDex (wheel icon) */}
        <div className="relative z-30 px-3 py-2 flex items-center justify-between text-white">
          <button 
            onClick={prevCar}
            className="p-1 rounded-full hover:bg-black/10 active:scale-90 transition"
            title="Auto anterior"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Pokémon-Style CarDex Brand Logo */}
          <div className="flex items-center gap-1">
            <span className="font-black text-2xl tracking-tighter italic text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              Car<span className="text-white">Dex</span>
            </span>
          </div>

          {/* Automotive Racing Wheel / Tachometer Icon (No Pokeball) */}
          <button 
            title="Tacómetro CarDex"
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 shadow-lg flex items-center justify-center text-amber-400 active:scale-95 transition-transform"
          >
            <Gauge className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* --- VIEW CONTENT --- */}
        {activeSheet === 'about' ? (
          /* SCREEN 2: DETAIL SHEET (Pikachu 'About' style) */
          <div className="relative z-20 flex-1 flex flex-col justify-end">
            {/* Floating Mini Car Cutout with soft shadow */}
            <div className="relative z-30 flex flex-col items-center -mb-8 pointer-events-none">
              <img 
                src={car.cutoutImage}
                alt={car.name}
                className="w-56 h-36 object-contain drop-shadow-2xl animate-pulse-glow"
                onError={(e) => {
                  e.target.src = car.image;
                }}
              />
              <div className="w-40 h-4 bg-black/25 rounded-full blur-md -mt-2"></div>
            </div>

            {/* White Rounded Detail Sheet */}
            <div className="bg-white rounded-t-[38px] px-6 pt-10 pb-4 text-zinc-800 shadow-2xl space-y-4 animate-fade-in">
              {/* Header Title with 'All >' */}
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">About</h2>
                  <p className="text-xs font-bold text-zinc-400">{car.brand} • {car.generation} ({car.year})</p>
                </div>
                <button 
                  onClick={() => setActiveSheet('hero')}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 flex items-center"
                >
                  Cerrar ×
                </button>
              </div>

              {/* 4 Clean Stat Boxes (Attack, Protection, Health, Chance to catch) */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {/* Stat 1: Potencia (Attack) */}
                <div className="p-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 text-center shadow-sm">
                  <div className="flex items-center justify-center text-amber-500 mb-1">
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Potencia</div>
                  <div className="text-base font-black text-zinc-800 mt-0.5">{car.hp}</div>
                </div>

                {/* Stat 2: 0-100 (Protection) */}
                <div className="p-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 text-center shadow-sm">
                  <div className="flex items-center justify-center text-blue-500 mb-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">0-100</div>
                  <div className="text-base font-black text-zinc-800 mt-0.5">{car.zeroToHundred}</div>
                </div>

                {/* Stat 3: Vel. Máx (Health) */}
                <div className="p-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 text-center shadow-sm">
                  <div className="flex items-center justify-center text-emerald-500 mb-1">
                    <Gauge className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Vel. Máx</div>
                  <div className="text-sm font-black text-zinc-800 mt-0.5 leading-tight">{car.topSpeed.split(' ')[0]}</div>
                </div>

                {/* Stat 4: Chance to catch / Rareza */}
                <div className="p-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 text-center shadow-sm">
                  <div className="flex items-center justify-center text-red-500 mb-1">
                    <Target className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Spawn</div>
                  <div className="text-base font-black text-zinc-800 mt-0.5">{car.catchRate}</div>
                </div>
              </div>

              {/* Where to catch this car? */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-sm font-black text-zinc-900 text-center">
                  Where to catch {car.name}?
                </h4>
                <p className="text-[11px] text-zinc-500 text-center leading-relaxed px-2">
                  {car.whereToCatch}
                </p>
                <p className="text-[10px] font-mono font-bold text-amber-600 text-center">
                  📍 {car.recentSpottedLocation}
                </p>
              </div>

              {/* Two Action Buttons: TO FAVORITES / OPEN THE MAP */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCapture}
                  className="py-3 px-3 rounded-full text-xs font-extrabold uppercase tracking-wide border-2 border-red-200 bg-red-50/70 text-red-600 hover:bg-red-100 transition shadow-sm active:scale-95"
                >
                  {isSaved ? '✓ En Garage' : 'To Favorites'}
                </button>

                <button
                  onClick={onOpenRadar}
                  style={{ backgroundColor: car.themeColor }}
                  className="py-3 px-3 rounded-full text-xs font-extrabold uppercase tracking-wide text-white hover:brightness-110 transition shadow-lg shadow-black/15 active:scale-95 text-center flex items-center justify-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Open the Map
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 1 & 3: HERO VIEW (Pikachu & Squirtle standalone style) */
          <div className="relative z-20 flex-1 flex flex-col justify-between py-6">
            {/* Big Header Title */}
            <div className="text-center space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                {car.name}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                <span>{car.typeBadge}</span>
              </div>
            </div>

            {/* Big Floating Car Cutout with soft ground shadow */}
            <div className="relative flex flex-col items-center justify-center my-auto">
              <img
                src={car.cutoutImage}
                alt={car.name}
                className="w-72 h-44 object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.target.src = car.image;
                }}
              />
              <div className="w-56 h-6 bg-black/30 rounded-full blur-md -mt-3"></div>
            </div>

            {/* Bottom Segmented Pill Bar: [ ABOUT ]  [ + ]  [ RADAR ] */}
            <div className="px-6 flex items-center justify-center">
              <div className="w-full max-w-[320px] h-14 bg-black/20 backdrop-blur-md rounded-full p-1.5 flex items-center justify-between shadow-xl border border-white/20">
                {/* ABOUT Button */}
                <button
                  onClick={() => {
                    sound.playRadarPing();
                    setActiveSheet('about');
                  }}
                  className="flex-1 h-full rounded-full bg-[#1e2029] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center shadow-md active:scale-95 transition"
                >
                  About
                </button>

                {/* Center + Action Button */}
                <button
                  onClick={handleCapture}
                  style={{ backgroundColor: car.accentColor }}
                  className="w-12 h-12 rounded-full mx-2 flex items-center justify-center text-zinc-900 font-black text-2xl shadow-lg hover:scale-110 active:scale-90 transition-transform"
                  title="Capturar y guardar en Garage"
                >
                  +
                </button>

                {/* RADAR / MAP Button */}
                <button
                  onClick={() => {
                    sound.playRadarPing();
                    onOpenRadar();
                  }}
                  className="flex-1 h-full rounded-full bg-white/30 hover:bg-white/40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center transition active:scale-95"
                >
                  Radar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom App Bar (Pokédex, CarDex Center, Heart, Settings) */}
        <div className="relative z-30 pt-3 pb-2 px-6 bg-white/95 backdrop-blur-md rounded-b-[42px] -mx-4 -mb-4 border-t border-zinc-200/80 flex items-center justify-between text-zinc-400">
          {/* Pokédex / Garage Icon */}
          <button 
            onClick={onOpenRadar}
            className="flex flex-col items-center gap-0.5 hover:text-zinc-800 transition"
            title="Radar"
          >
            <Radio className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Radar</span>
          </button>

          {/* Center Brand Icon: Active CarDex */}
          <button 
            onClick={() => setActiveSheet(activeSheet === 'about' ? 'hero' : 'about')}
            className="flex flex-col items-center gap-0.5 text-zinc-900"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-red-500 font-black text-sm">
              🏎️
            </div>
            <span className="text-[10px] font-black tracking-tight -mt-1 text-zinc-900">
              CarDex
            </span>
          </button>

          {/* Heart / Favorites */}
          <button 
            onClick={toggleLike}
            className={`flex flex-col items-center gap-0.5 transition ${isLiked ? 'text-red-500' : 'hover:text-zinc-800'}`}
            title="Favorito"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            <span className="text-[9px] font-semibold">Favorito</span>
          </button>

          {/* Camera Scanner Trigger */}
          <button 
            onClick={onOpenScanner}
            className="flex flex-col items-center gap-0.5 hover:text-zinc-800 transition text-red-600 font-bold"
            title="Abrir Cámara Scanner"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Cámara</span>
          </button>
        </div>
      </div>

      {/* Swipe / Switch helper text */}
      <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-zinc-400">
        <button onClick={prevCar} className="hover:text-white flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <span>• Auto {currentIndex + 1} de {POKEDEX_CARS.length} •</span>
        <button onClick={nextCar} className="hover:text-white flex items-center gap-1">
          Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

