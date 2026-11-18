import React, { useState, useMemo } from 'react';
import {
  Award, Trophy, Zap, Shield, Warehouse, Camera, Calendar,
  Sparkles, CheckCircle2, Lock, Flame, Star, LogOut, User,
  Crown, Car, Wind, Wrench, Compass, Globe, Clock, Layers, Gauge
} from './CarLogIcons';
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
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl cl-card p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-racing-soft border border-red-200 flex items-center justify-center text-racing-ink mx-auto">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-telemetry uppercase tracking-widest text-racing-ink font-bold block">
              LICENCIA DE SPOTTER
            </span>
            <h3 className="font-display text-2xl font-extrabold uppercase text-ink tracking-tight">
              Perfil de Coleccionista
            </h3>
            <p className="text-xs text-ink-secondary max-w-xs mx-auto leading-relaxed">
              Inicia sesión o regístrate para sincronizar tu garage en la nube y desbloquear las{' '}
              <span className="font-telemetry text-racing-ink font-bold">{totalCount}</span> medallas oficiales.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="w-full min-h-[42px] px-6 py-2.5 rounded-xl bg-racing text-white font-bold text-xs hover:bg-racing-ink transition shadow-[0_8px_20px_rgba(220,38,38,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Iniciar Sesión / Registrarme</span>
          </button>
        </div>
      </div>
    );
  }

  const rankInfo = getCollectorRank(stats.totalCars);
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 max-w-md mx-auto select-none pb-4 animate-fade-in text-ink">
      {/* Collector Telemetry License Card (White & Red) */}
      <div className="relative rounded-3xl cl-card p-5 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-red-500/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-4 bottom-2 text-5xl font-display font-extrabold italic text-red-600/[0.05] select-none pointer-events-none">
          CARLOG
        </div>

        {/* License Top Strip */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-telemetry uppercase tracking-widest text-ink-muted mb-3">
          <span>CARLOG // LICENCIA SPOTTER</span>
          <span className="text-racing-ink font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-racing" />
            ACTIVO
          </span>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-racing-soft border border-red-200 p-1 flex items-center justify-center shrink-0">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-2xl font-extrabold uppercase text-ink tracking-tight leading-none truncate">
                  {user.username}
                </h2>
                <CheckCircle2 className="w-4 h-4 text-racing-ink shrink-0" />
              </div>
              <p className="text-xs font-semibold text-racing-ink mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current shrink-0" />
                <span className="truncate">{rankInfo.rank}</span>
              </p>
              <p className="text-[10px] text-ink-muted font-telemetry truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-2 rounded-xl bg-surface border border-black/[0.08] hover:bg-racing-soft hover:border-red-200 text-ink-muted hover:text-racing-ink transition shrink-0 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Column Collector Telemetry Strip */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-black/[0.07] rounded-2xl cl-panel mt-4 py-2.5 text-center">
          <div className="px-2">
            <span className="text-[9px] font-telemetry uppercase text-ink-muted block tracking-wider">
              Autos
            </span>
            <span className="font-telemetry text-lg font-bold text-ink leading-tight block mt-0.5">
              {stats.totalCars}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[9px] font-telemetry uppercase text-ink-muted block tracking-wider">
              Potencia
            </span>
            <span className="font-telemetry text-lg font-bold text-ink leading-tight block mt-0.5">
              {stats.totalHp.toLocaleString()}
              <span className="text-[10px] font-normal text-ink-muted ml-0.5">CV</span>
            </span>
          </div>

          <div className="px-2">
            <span className="text-[9px] font-telemetry uppercase text-ink-muted block tracking-wider">
              Medallas
            </span>
            <span className="font-telemetry text-lg font-bold text-racing-ink leading-tight block mt-0.5">
              {unlockedCount}
              <span className="text-xs font-normal text-ink-muted">/{totalCount}</span>
            </span>
          </div>
        </div>

        {/* Collector Level Progress */}
        <div className="relative z-10 pt-3.5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-ink-secondary">
            <span>Siguiente rango</span>
            <span className="text-ink font-telemetry font-semibold">
              {stats.totalCars}/{rankInfo.nextTarget} autos
            </span>
          </div>
          <div className="w-full h-2 rounded-full cl-panel overflow-hidden">
            <div
              style={{ width: `${rankInfo.pct}%` }}
              className="h-full bg-gradient-to-r from-red-700 to-racing rounded-full transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {/* Achievements Section Header & Filters */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-racing-ink" />
            <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-ink">
              Medallas & Logros
            </h3>
          </div>
          <span className="text-[10px] font-telemetry text-ink-muted uppercase font-semibold">
            {unlockedCount}/{totalCount} ({completionPct}%)
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-surface border border-black/[0.08] p-1 rounded-xl">
          {[
            { id: 'all', label: `Todos (${totalCount})` },
            { id: 'unlocked', label: `Logrados (${unlockedCount})` },
            { id: 'locked', label: `Faltan (${totalCount - unlockedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 rounded-lg text-[10px] font-telemetry font-bold transition active:scale-95 ${
                statusFilter === tab.id
                  ? 'bg-racing text-white shadow-sm'
                  : 'text-ink-secondary hover:text-racing-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ACHIEVEMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-telemetry font-bold shrink-0 border transition active:scale-95 ${
                categoryFilter === cat.id
                  ? 'bg-racing text-white border-racing'
                  : 'bg-surface text-ink-secondary border-black/[0.08] hover:text-racing-ink'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <div className="py-10 text-center rounded-2xl cl-panel text-xs text-ink-muted font-telemetry">
            No hay logros en este filtro todavía.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredAchievements.map((ach) => {
              const Icon = ICON_MAP[ach.iconKey] || Award;
              const tierCls = TIER_STYLES[ach.tier] || TIER_STYLES.Bronce;
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl transition-all flex flex-col justify-between ${
                    ach.unlocked
                      ? 'bg-surface border border-red-200 shadow-sm'
                      : 'bg-surface/90 border border-black/[0.08]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          ach.unlocked ? 'bg-racing text-white shadow-sm' : 'bg-recessed text-ink-muted border border-black/[0.08]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <span
                        className={`text-[9px] font-telemetry uppercase font-bold px-1.5 py-0.5 rounded border ${
                          ach.unlocked ? tierCls : 'bg-recessed text-ink-secondary border-black/[0.08]'
                        }`}
                      >
                        {ach.tier}
                      </span>
                    </div>

                    <h4 className={`font-display text-xs font-bold leading-snug ${ach.unlocked ? 'text-ink' : 'text-ink-secondary'}`}>
                      {ach.title}
                    </h4>
                    <p className="text-[10px] text-ink-muted leading-snug mt-0.5">
                      {ach.desc}
                    </p>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {ach.target > 1 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-telemetry text-ink-muted">
                          <span>Progreso</span>
                          <span>
                            {ach.current.toLocaleString()}/{ach.target.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-recessed overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${ach.unlocked ? 'bg-racing' : 'bg-ink-muted'}`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-black/[0.06] flex items-center gap-1 text-[9px] font-telemetry uppercase font-bold">
                      {ach.unlocked ? (
                        <span className="text-racing-ink flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Desbloqueado
                        </span>
                      ) : (
                        <span className="text-ink-muted flex items-center gap-1">
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
