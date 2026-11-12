import React from 'react';
import { 
  Award, Trophy, Zap, Shield, Warehouse, Camera, Calendar, 
  Sparkles, CheckCircle2, Lock, Flame, Star, LogOut, ChevronRight, User
} from 'lucide-react';

export default function ProfileView({ user, garage = [], onLogout, onOpenAuth }) {
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-zinc-400 shadow-xl">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">Perfil de Spotter</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Inicia sesión o regístrate para desbloquear tu tarjeta de coleccionista, rango y medallas.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow-lg active:scale-95 flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span>Iniciar Sesión / Registrarme</span>
        </button>
      </div>
    );
  }

  // Calculate collector achievements & medals
  const totalCars = garage.length;
  const historicCount = garage.filter(c => c.rarity === 'Histórico').length;
  const legendaryCount = garage.filter(c => c.rarity === 'Legendario').length;
  const rareCount = garage.filter(c => c.rarity === 'Raro').length;
  const totalHp = garage.reduce((acc, c) => acc + (c.hp || 0), 0);

  // Collector Ranks
  let rank = 'Spotter Novato';
  let rankColor = 'text-zinc-400';
  let progressPct = Math.min(100, Math.floor((totalCars / 25) * 100));

  if (totalCars >= 25) {
    rank = 'Maestro Coleccionista';
    rankColor = 'text-amber-400';
  } else if (totalCars >= 10) {
    rank = 'Spotter Experto';
    rankColor = 'text-cyan-400';
  } else if (totalCars >= 3) {
    rank = 'Cazador de Calle';
    rankColor = 'text-emerald-400';
  }

  // System Achievements & Badges
  const ACHIEVEMENTS = [
    {
      id: 'first_spot',
      title: 'Primer Avistamiento',
      desc: 'Escanea y guarda tu primer auto en el garage',
      icon: Camera,
      unlocked: totalCars >= 1,
      tier: 'Bronce'
    },
    {
      id: 'collector_5',
      title: 'Garage en Crecimiento',
      desc: 'Colecciona al menos 5 vehículos',
      icon: Warehouse,
      unlocked: totalCars >= 5,
      tier: 'Plata'
    },
    {
      id: 'hp_1000',
      title: 'Furia Mecánica',
      desc: 'Suma más de 1.000 CV de potencia total acumulada',
      icon: Zap,
      unlocked: totalHp >= 1000,
      tier: 'Plata'
    },
    {
      id: 'rare_hunter',
      title: 'Ojo de Águila',
      desc: 'Descubre al menos 1 vehículo de categoría Raro',
      icon: Star,
      unlocked: rareCount >= 1,
      tier: 'Oro'
    },
    {
      id: 'legend_spotter',
      title: 'Encuentro Legendario',
      desc: 'Encuentra y cataloga un auto Legendario o Histórico',
      icon: Trophy,
      unlocked: historicCount > 0 || legendaryCount > 0,
      tier: 'Platino'
    },
    {
      id: 'fleet_master',
      title: 'Gran Magnate',
      desc: 'Reúne 20 autos de diferentes fabricantes',
      icon: Flame,
      unlocked: totalCars >= 20,
      tier: 'Diamante'
    }
  ];

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  return (
    <div className="space-y-4 max-w-md mx-auto select-none pb-4 animate-fade-in">
      
      {/* Collector ID Card (Showroom License Style) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#12151f] via-[#0d0f16] to-[#08090d] border border-white/10 p-5 shadow-2xl overflow-hidden">
        {/* Holographic corner watermark */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none"></div>
        <div className="absolute right-4 bottom-2 text-6xl font-black text-white/[0.02] font-mono select-none">
          CARLOG
        </div>

        {/* User Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-white/20 p-1 flex items-center justify-center shadow-lg">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-white tracking-tight leading-none">
                  {user.username}
                </h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className={`text-xs font-bold ${rankColor} mt-0.5`}>
                ★ {rank}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Main Collector Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4">
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Autos</span>
            <span className="text-xl font-black text-white">{totalCars}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Potencia</span>
            <span className="text-xl font-black text-amber-400">{totalHp.toLocaleString()} <span className="text-[10px] font-normal text-zinc-500">CV</span></span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Medallas</span>
            <span className="text-xl font-black text-emerald-400">{unlockedCount} / {ACHIEVEMENTS.length}</span>
          </div>
        </div>

        {/* Collector Level Progress */}
        <div className="pt-4 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
            <span>Progreso al siguiente Rango</span>
            <span className="text-white font-mono">{totalCars}/25 Autos</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden">
            <div 
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            ></div>
          </div>
        </div>
      </div>

      {/* Medals & Achievements Showcase */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Medallas & Logros Desbloqueables
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {unlockedCount} de {ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? 'bg-[#0f111a] border-white/15 shadow-lg'
                    : 'bg-[#08090d]/60 border-white/[0.04] opacity-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    ach.unlocked 
                      ? 'bg-white text-black shadow-md' 
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className={`text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded ${
                    ach.unlocked ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {ach.tier}
                  </span>
                </div>

                <h4 className={`text-xs font-bold ${ach.unlocked ? 'text-white' : 'text-zinc-400'}`}>
                  {ach.title}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                  {ach.desc}
                </p>

                <div className="mt-2 pt-1 border-t border-white/[0.05] flex items-center gap-1 text-[9px] font-bold">
                  {ach.unlocked ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Desbloqueado
                    </span>
                  ) : (
                    <span className="text-zinc-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

