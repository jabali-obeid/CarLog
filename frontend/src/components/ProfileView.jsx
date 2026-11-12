import React, { useState, useMemo } from 'react';
import {
  Award, Trophy, Zap, Shield, Warehouse, Camera, Calendar,
  Sparkles, CheckCircle2, Lock, Flame, Star, LogOut, User,
  Crown, Car, Wind, Wrench, Compass, Globe, Clock, Layers, Gauge
} from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORIES,
  TIER_STYLES,
  evaluateAchievements,
  getCollectorRank
} from '../utils/achievements';

const ICON_MAP = {
  camera: Camera,
  warehouse: Warehouse,
  trophy: Trophy,
  flame: Flame,
  award: Award,
  crown: Crown,
  sparkles: Sparkles,
  layers: Layers,
  compass: Compass,
  globe: Globe,
  zap: Zap,
  gauge: Gauge,
  shield: Shield,
  star: Star,
  car: Car,
  wind: Wind,
  wrench: Wrench,
  calendar: Calendar,
  clock: Clock
};

export default function ProfileView({ user, garage = [], onLogout, onOpenAuth }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  const { achievements, unlockedCount, totalCount, stats } = useMemo(
    () => evaluateAchievements(garage),
    [garage]
  );

  const filteredAchievements = useMemo(() => {
    return achievements
      .filter((ach) => {
        if (categoryFilter !== 'all' && ach.category !== categoryFilter) return false;
        if (statusFilter === 'unlocked' && !ach.unlocked) return false;
        if (statusFilter === 'locked' && ach.unlocked) return false;
        return true;
      })
      .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  }, [achievements, categoryFilter, statusFilter]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-zinc-400 shadow-xl">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">Perfil de Spotter</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Inicia sesión o regístrate para desbloquear tu tarjeta de coleccionista, rango y {totalCount} medallas.
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

  const rankInfo = getCollectorRank(stats.totalCars);

  return (
    <div className="space-y-4 max-w-md mx-auto select-none pb-4 animate-fade-in">
      {/* Collector ID Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#12151f] via-[#0d0f16] to-[#08090d] border border-white/10 p-5 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none"></div>
        <div className="absolute right-4 bottom-2 text-6xl font-black text-white/[0.02] font-mono select-none">
          CARLOG
        </div>

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
              <p className={`text-xs font-bold ${rankInfo.color} mt-0.5`}>
                ★ {rankInfo.rank}
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
            <span className="text-xl font-black text-white">{stats.totalCars}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Potencia</span>
            <span className="text-xl font-black text-zinc-100">
              {stats.totalHp.toLocaleString()} <span className="text-[10px] font-normal text-zinc-500">CV</span>
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Medallas</span>
            <span className="text-xl font-black text-emerald-400">{unlockedCount}/{totalCount}</span>
          </div>
        </div>

        {/* Collector Level Progress */}
        <div className="pt-4 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
            <span>Progreso al siguiente Rango</span>
            <span className="text-white font-mono">{stats.totalCars}/{rankInfo.nextTarget} Autos</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden">
            <div
              style={{ width: `${rankInfo.pct}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            ></div>
          </div>
        </div>
      </div>

      {/* Achievements Section Header & Filters */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Medallas & Logros ({totalCount})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {unlockedCount} desbloqueados ({Math.round((unlockedCount / totalCount) * 100)}%)
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#090b10] p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: `Todos (${totalCount})` },
            { id: 'unlocked', label: `Logrados (${unlockedCount})` },
            { id: 'locked', label: `Faltan (${totalCount - unlockedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-zinc-100 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ACHIEVEMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border transition ${
                categoryFilter === cat.id
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-[#0a0c12] border border-white/5 text-xs text-zinc-500 font-mono">
            No hay logros en este filtro todavía.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAchievements.map((ach) => {
              const Icon = ICON_MAP[ach.iconKey] || Award;
              const tierCls = TIER_STYLES[ach.tier] || TIER_STYLES.Bronce;
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    ach.unlocked
                      ? 'bg-[#0f111a] border-white/15 shadow-lg'
                      : 'bg-[#08090d]/70 border-white/[0.05] opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          ach.unlocked ? 'bg-white text-black shadow-md' : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded border ${
                          ach.unlocked ? tierCls : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/40'
                        }`}
                      >
                        {ach.tier}
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold leading-snug ${ach.unlocked ? 'text-white' : 'text-zinc-300'}`}>
                      {ach.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                      {ach.desc}
                    </p>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {ach.target > 1 && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                          <span>Progreso</span>
                          <span>{ach.current.toLocaleString()}/{ach.target.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${ach.unlocked ? 'bg-emerald-400' : 'bg-zinc-500'}`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-1 border-t border-white/[0.05] flex items-center gap-1 text-[9px] font-bold">
                      {ach.unlocked ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Desbloqueado
                        </span>
                      ) : (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
