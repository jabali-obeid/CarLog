import { normalizeCarToken } from './auth';

const SCORE_OVERRIDES = [
  { match: ['baquet', 'model a'], score: 100 },
  { match: ['gt3 rs', '911 gt3'], score: 100 },
  { match: ['f40'], score: 100 },
  { match: ['veyron', 'chiron'], score: 100 },
  { match: ['296 gtb', 'sf90', 'laferrari'], score: 98 },
  { match: ['huracan', 'aventador', 'countach'], score: 97 },
  { match: ['porsche', '911'], score: 94 },
  { match: ['torino'], score: 93 },
  { match: ['clio v6'], score: 92 },
  { match: ['2002 turbo'], score: 91 },
  { match: ['falcon', 'sprint'], score: 89 },
  { match: ['m3 e36', 'm5 e39', 'e30'], score: 88 },
  { match: ['civic type r', 'type r'], score: 87 },
  { match: ['mustang', '1965'], score: 86 },
  { match: ['m3', 'g80'], score: 85 },
  { match: ['raptor', 'f-150'], score: 82 },
  { match: ['3500', 'dually'], score: 81 },
  { match: ['land cruiser'], score: 80 },
  { match: ['vento gli', 'gli'], score: 77 },
  { match: ['sw4', 'fortuner'], score: 75 },
  { match: ['grand cherokee'], score: 74 },
  { match: ['serie 5', '540i', 'x5 m'], score: 73 },
  { match: ['190e'], score: 72 },
  { match: ['impreza', 'wrx'], score: 71 },
  { match: ['fuego'], score: 69 },
  { match: ['glb'], score: 68 },
  { match: ['2cv', '3cv'], score: 67 },
  { match: ['fitito', '600'], score: 66 },
  { match: ['128 super'], score: 64 },
  { match: ['bora 1 8t', 'bora'], score: 61 },
  { match: ['golf gti'], score: 74 },
  { match: ['ram 1500', 'ram 2500'], score: 72 }
];

const RARITY_BASE = {
  Legendario: 93,
  Exótico: 88,
  Histórico: 82,
  Especial: 70,
  Deportivo: 76,
  Raro: 68,
  Común: 44,
  Básico: 22
};

function hashOffset(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCarRarityScore(car) {
  if (!car) return 50;
  if (Number.isFinite(Number(car.rarityScore))) {
    return Math.max(1, Math.min(100, Math.round(Number(car.rarityScore))));
  }

  const label = normalizeCarToken(`${car.brand || ''} ${car.model || car.name || ''}`);
  for (const rule of SCORE_OVERRIDES) {
    if (rule.match.some((kw) => label.includes(kw))) {
      return rule.score;
    }
  }

  const base = RARITY_BASE[car.rarity] ?? 45;
  const yearNum = parseInt(String(car.year || ''), 10);
  let yearBonus = 0;
  if (Number.isFinite(yearNum)) {
    if (yearNum <= 1945) yearBonus = 18;
    else if (yearNum <= 1975) yearBonus = 10;
    else if (yearNum <= 1995) yearBonus = 5;
  }

  const hp = Number(car.hp) || 0;
  const hpBonus = hp >= 450 ? 9 : hp >= 300 ? 6 : hp >= 200 ? 3 : 0;
  const microVariance = (hashOffset(label) % 5) - 2;

  return Math.max(1, Math.min(100, Math.round(base + yearBonus + hpBonus + microVariance)));
}

export function getScoreTheme(score) {
  if (score >= 90) {
    return {
      tierLabel: 'Élite / Histórico',
      pillLabel: 'TOP 100',
      pillClass: 'bg-[#ffe8ea] text-[#dc264e]',
      accentText: 'text-[#dc264e]',
      gradient: 'from-[#dc5638] via-[#b81d46] to-[#7b143b]',
      barFill: 'from-[#ffbfa4] via-[#ffe6dc] to-white'
    };
  }
  if (score >= 75) {
    return {
      tierLabel: 'Muy Buscado',
      pillLabel: 'RARO',
      pillClass: 'bg-[#ede9fe] text-[#6d28d9]',
      accentText: 'text-[#6d28d9]',
      gradient: 'from-[#5b4ce6] via-[#6d28d9] to-[#43157a]',
      barFill: 'from-[#ddd6fe] via-[#ede9fe] to-white'
    };
  }
  if (score >= 50) {
    return {
      tierLabel: 'Edición Especial',
      pillLabel: 'DESTACADO',
      pillClass: 'bg-[#e0f2fe] text-[#0369a1]',
      accentText: 'text-[#0284c7]',
      gradient: 'from-[#0ea5e9] via-[#1d4ed8] to-[#172554]',
      barFill: 'from-[#bae6fd] via-[#e0f2fe] to-white'
    };
  }
  return {
    tierLabel: 'Hallazgo Urbano',
    pillLabel: 'CALLE',
    pillClass: 'bg-slate-100 text-slate-700',
    accentText: 'text-slate-600',
    gradient: 'from-[#475569] via-[#334155] to-[#0f172a]',
    barFill: 'from-[#cbd5e1] via-[#e2e8f0] to-white'
  };
}
