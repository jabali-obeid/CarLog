// CarLog Achievement Engine — 120 Collector Medals & Progress Milestones

function norm(val) {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseYear(car) {
  const y = parseInt(String(car?.year || '').replace(/\D/g, '').slice(0, 4), 10);
  return Number.isFinite(y) && y >= 1900 && y <= 2035 ? y : null;
}

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'collection', label: 'Colección' },
  { id: 'power', label: 'Potencia' },
  { id: 'rarity', label: 'Rareza' },
  { id: 'brands', label: 'Marcas' },
  { id: 'regions', label: 'Países' },
  { id: 'engines', label: 'Motores' },
  { id: 'eras', label: 'Épocas' },
  { id: 'special', label: 'Especiales' }
];

export const TIER_STYLES = {
  Bronce: 'bg-orange-950/50 text-orange-300 border-orange-700/40',
  Plata: 'bg-zinc-800/80 text-zinc-200 border-zinc-500/40',
  Oro: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
  Platino: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35',
  Diamante: 'bg-purple-500/15 text-purple-300 border-purple-400/40',
  Mito: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
};

export function getCollectorRank(totalCars) {
  if (totalCars >= 100) return { rank: 'Leyenda Inmortal del Asfalto', color: 'text-emerald-400', nextTarget: 100, pct: 100 };
  if (totalCars >= 60) return { rank: 'Magnate Mundial', color: 'text-purple-400', nextTarget: 100, pct: Math.floor((totalCars / 100) * 100) };
  if (totalCars >= 35) return { rank: 'Maestro Coleccionista', color: 'text-amber-400', nextTarget: 60, pct: Math.floor((totalCars / 60) * 100) };
  if (totalCars >= 15) return { rank: 'Spotter Experto', color: 'text-cyan-400', nextTarget: 35, pct: Math.floor((totalCars / 35) * 100) };
  if (totalCars >= 5) return { rank: 'Cazador de Calle', color: 'text-emerald-400', nextTarget: 15, pct: Math.floor((totalCars / 15) * 100) };
  return { rank: 'Spotter Novato', color: 'text-zinc-400', nextTarget: 5, pct: Math.min(100, Math.floor((totalCars / 5) * 100)) };
}

export function evaluateAchievements(garage = []) {
  const totalCars = garage.length;
  const totalHp = garage.reduce((acc, c) => acc + (Number(c.hp) || 0), 0);

  const countWhere = (fn) => garage.filter(fn).length;
  const maxWhere = (fn) => garage.reduce((m, c) => Math.max(m, fn(c) || 0), 0);
  const minPositiveWhere = (fn) => {
    let best = Infinity;
    for (const c of garage) {
      const v = fn(c);
      if (v > 0 && v < best) best = v;
    }
    return best === Infinity ? null : best;
  };

  const uniqueBrands = new Set(garage.map(c => norm(c.brand)).filter(Boolean));
  const uniqueCountries = new Set(garage.map(c => norm(c.country)).filter(Boolean));
  const uniqueRarities = new Set(garage.map(c => norm(c.rarity)).filter(Boolean));
  const uniqueDecades = new Set(garage.map(c => {
    const y = parseYear(c);
    return y ? Math.floor(y / 10) * 10 : null;
  }).filter(Boolean));

  const rarityCounts = {
    basico: countWhere(c => norm(c.rarity) === 'basico'),
    comun: countWhere(c => norm(c.rarity) === 'comun'),
    raro: countWhere(c => norm(c.rarity) === 'raro'),
    legendario: countWhere(c => norm(c.rarity) === 'legendario'),
    historico: countWhere(c => norm(c.rarity) === 'historico')
  };

  const brandCount = (keyword) => countWhere(c => norm(c.brand).includes(keyword));
  const countryCount = (...keywords) => countWhere(c => keywords.some(k => norm(c.country).includes(k)));
  const engineCount = (...keywords) => countWhere(c => keywords.some(k => norm(c.engine).includes(k)));
  const colorCount = (...keywords) => countWhere(c => keywords.some(k => norm(c.color).includes(k)));

  const maxHp = maxWhere(c => Number(c.hp) || 0);
  const maxSpeed = maxWhere(c => Number(c.topSpeed) || 0);
  const bestZeroToHundred = minPositiveWhere(c => Number(c.zeroToHundred) || 0);

  // Real camera/upload captures (excludes external Unsplash seed URLs)
  const realPhotoCount = countWhere(c => {
    const u = String(c.imageUrl || '');
    return u.startsWith('data:image/') || u.includes('car-photos');
  });

  // Same-day streak and time-of-day detections
  const capturesByDay = {};
  let hasNightCapture = false;
  let hasEarlyCapture = false;
  for (const c of garage) {
    if (!c.capturedAt) continue;
    const d = new Date(c.capturedAt);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = d.toISOString().slice(0, 10);
    capturesByDay[dayKey] = (capturesByDay[dayKey] || 0) + 1;
    const hr = d.getHours();
    if (hr >= 0 && hr < 6) hasNightCapture = true;
    if (hr >= 6 && hr < 9) hasEarlyCapture = true;
  }
  const maxDayCaptures = Object.values(capturesByDay).reduce((a, b) => Math.max(a, b), 0);

  const list = [];
  const add = (id, category, tier, title, desc, iconKey, current, target) => {
    const safeTarget = target ?? 1;
    const safeCurrent = typeof current === 'boolean' ? (current ? 1 : 0) : Math.min(current, safeTarget);
    const unlocked = typeof current === 'boolean' ? current : current >= safeTarget;
    list.push({
      id,
      category,
      tier,
      title,
      desc,
      iconKey,
      unlocked,
      current: safeCurrent,
      target: safeTarget
    });
  };

  // --- 1. COLECCIÓN (14) ---
  add('col_1', 'collection', 'Bronce', 'Primer Avistamiento', 'Guarda tu primer auto en el garage', 'camera', totalCars, 1);
  add('col_2', 'collection', 'Bronce', 'Doble Motor', 'Reúne 2 vehículos en tu colección', 'warehouse', totalCars, 2);
  add('col_3', 'collection', 'Bronce', 'Trío Callejero', 'Alcanza 3 autos escaneados', 'warehouse', totalCars, 3);
  add('col_5', 'collection', 'Plata', 'Garage en Crecimiento', 'Colecciona al menos 5 autos', 'warehouse', totalCars, 5);
  add('col_8', 'collection', 'Plata', 'Escuadra Urbana', 'Llega a 8 vehículos guardados', 'warehouse', totalCars, 8);
  add('col_10', 'collection', 'Plata', 'Decena Sobre Ruedas', 'Completa 10 autos en tu garage', 'trophy', totalCars, 10);
  add('col_15', 'collection', 'Oro', 'Spotter Dedicado', 'Suma 15 vehículos catalogados', 'trophy', totalCars, 15);
  add('col_20', 'collection', 'Oro', 'Veintena de Acero', 'Reúne 20 autos distintos en tu flota', 'flame', totalCars, 20);
  add('col_25', 'collection', 'Oro', 'Cuarto de Centena', 'Alcanza 25 autos en el taller', 'award', totalCars, 25);
  add('col_35', 'collection', 'Platino', 'Curador Automotriz', 'Supera los 35 vehículos guardados', 'crown', totalCars, 35);
  add('col_50', 'collection', 'Platino', 'Medio Centenar', 'Construye un museo de 50 autos', 'crown', totalCars, 50);
  add('col_65', 'collection', 'Diamante', 'Archivo Vivo', 'Guarda 65 autos en tu cuenta', 'sparkles', totalCars, 65);
  add('col_80', 'collection', 'Diamante', 'Megacoleccionista', 'Alcanza 80 vehículos registrados', 'sparkles', totalCars, 80);
  add('col_100', 'collection', 'Mito', 'Club de los 100', 'Haz historia reuniendo 100 autos', 'trophy', totalCars, 100);

  // --- 2. DIVERSIDAD DE MARCAS Y COMPLETISMO (8) ---
  add('div_b2', 'collection', 'Bronce', 'Dúo de Fabricantes', 'Consigue autos de 2 marcas distintas', 'layers', uniqueBrands.size, 2);
  add('div_b4', 'collection', 'Plata', 'Vitrina Variada', 'Colecciona 4 fabricantes diferentes', 'layers', uniqueBrands.size, 4);
  add('div_b6', 'collection', 'Plata', 'Multimarca', 'Reúne 6 marcas distintas en el garage', 'layers', uniqueBrands.size, 6);
  add('div_b8', 'collection', 'Oro', 'Salón del Automóvil', 'Llega a 8 marcas diferentes', 'compass', uniqueBrands.size, 8);
  add('div_b12', 'collection', 'Platino', 'Enciclopedia Mecánica', 'Consigue 12 fabricantes distintos', 'compass', uniqueBrands.size, 12);
  add('div_b16', 'collection', 'Diamante', 'Consorcio Global', 'Reúne 16 marcas distintas', 'globe', uniqueBrands.size, 16);
  add('div_b20', 'collection', 'Mito', 'Emperador del Motor', 'Cataloga 20 fabricantes diferentes', 'crown', uniqueBrands.size, 20);
  add('div_all_rarities', 'collection', 'Platino', 'Escala Completa', 'Captura las 5 rarezas (Básico a Histórico)', 'award', uniqueRarities.size, 5);

  // --- 3. POTENCIA ACUMULADA (10) ---
  add('hp_sum_300', 'power', 'Bronce', 'Primeros Caballos', 'Suma 300 CV acumulados en tu garage', 'zap', totalHp, 300);
  add('hp_sum_600', 'power', 'Bronce', 'Manada en Marcha', 'Alcanza 600 CV totales', 'zap', totalHp, 600);
  add('hp_sum_1k', 'power', 'Plata', 'Furia Mecánica', 'Supera los 1.000 CV acumulados', 'zap', totalHp, 1000);
  add('hp_sum_2k', 'power', 'Plata', 'Estampida de Torque', 'Acumula 2.000 CV en tu taller', 'zap', totalHp, 2000);
  add('hp_sum_3500', 'power', 'Oro', 'Central Eléctrica', 'Suma 3.500 CV entre todos tus autos', 'flame', totalHp, 3500);
  add('hp_sum_5k', 'power', 'Oro', 'Cinco Mil Caballos', 'Alcanza 5.000 CV acumulados', 'flame', totalHp, 5000);
  add('hp_sum_7500', 'power', 'Platino', 'Trueno Urbano', 'Supera los 7.500 CV totales', 'flame', totalHp, 7500);
  add('hp_sum_10k', 'power', 'Diamante', 'Diez Mil Caballos', 'Acumula 10.000 CV en tu colección', 'zap', totalHp, 10000);
  add('hp_sum_15k', 'power', 'Diamante', 'Fábrica de Potencia', 'Llega a 15.000 CV acumulados', 'crown', totalHp, 15000);
  add('hp_sum_25k', 'power', 'Mito', 'Reactores de Fusión', 'Alcanza 25.000 CV totales en tu flota', 'sparkles', totalHp, 25000);

  // --- 4. POTENCIA INDIVIDUAL, ACELERACIÓN Y VELOCIDAD (12) ---
  add('hp_car_200', 'power', 'Bronce', 'Nervio Deportivo', 'Captura un auto de al menos 200 CV', 'gauge', maxHp, 200);
  add('hp_car_300', 'power', 'Plata', 'Club de los 300', 'Captura una máquina de 300+ CV', 'gauge', maxHp, 300);
  add('hp_car_400', 'power', 'Oro', 'Bestia de Pista', 'Captura un deportivo de 400+ CV', 'gauge', maxHp, 400);
  add('hp_car_500', 'power', 'Platino', 'Medio Millar', 'Captura un superdeportivo de 500+ CV', 'flame', maxHp, 500);
  add('hp_car_650', 'power', 'Diamante', 'Hiperpotencia', 'Captura una bestia de 650+ CV', 'flame', maxHp, 650);
  add('hp_car_800', 'power', 'Mito', 'Misil Homologado', 'Captura un monstruo de 800+ CV', 'sparkles', maxHp, 800);

  add('acc_5s', 'power', 'Plata', 'Aceleración Pura', 'Consigue un auto que haga 0-100 en ≤ 5.0s', 'gauge', bestZeroToHundred !== null && bestZeroToHundred <= 5.0, 1);
  add('acc_4s', 'power', 'Oro', 'Empuje G', 'Consigue un auto que haga 0-100 en ≤ 4.0s', 'zap', bestZeroToHundred !== null && bestZeroToHundred <= 4.0, 1);
  add('acc_3_2s', 'power', 'Diamante', 'Velocidad Terminal', 'Consigue un auto que haga 0-100 en ≤ 3.2s', 'sparkles', bestZeroToHundred !== null && bestZeroToHundred <= 3.2, 1);

  add('spd_220', 'power', 'Bronce', 'Más Allá de 220', 'Guarda un auto con máxima ≥ 220 km/h', 'gauge', maxSpeed, 220);
  add('spd_260', 'power', 'Oro', 'Rey de la Autopista', 'Guarda un auto que alcance ≥ 260 km/h', 'gauge', maxSpeed, 260);
  add('spd_300', 'power', 'Diamante', 'Club 300 km/h', 'Guarda un bólido que pase los 300 km/h', 'trophy', maxSpeed, 300);

  // --- 5. RAREZAS (18) ---
  add('rar_bas_1', 'rarity', 'Bronce', 'Vida Cotidiana', 'Cataloga 1 auto de rareza Básico', 'shield', rarityCounts.basico, 1);
  add('rar_bas_5', 'rarity', 'Plata', 'Asfalto Diario', 'Reúne 5 autos Básicos', 'shield', rarityCounts.basico, 5);
  add('rar_bas_15', 'rarity', 'Oro', 'Maestro de la Calle', 'Consigue 15 autos Básicos', 'shield', rarityCounts.basico, 15);

  add('rar_com_1', 'rarity', 'Bronce', 'Clásico Moderno', 'Cataloga 1 auto Común', 'award', rarityCounts.comun, 1);
  add('rar_com_5', 'rarity', 'Plata', 'Flota Popular', 'Reúne 5 autos Comunes', 'award', rarityCounts.comun, 5);
  add('rar_com_15', 'rarity', 'Oro', 'Concesionario Propio', 'Consigue 15 autos Comunes', 'award', rarityCounts.comun, 15);

  add('rar_rar_1', 'rarity', 'Plata', 'Ojo de Águila', 'Encuentra 1 auto de categoría Raro', 'star', rarityCounts.raro, 1);
  add('rar_rar_3', 'rarity', 'Oro', 'Radar Afinado', 'Captura 3 autos Raros', 'star', rarityCounts.raro, 3);
  add('rar_rar_7', 'rarity', 'Platino', 'Imán de Joyas', 'Reúne 7 autos Raros', 'star', rarityCounts.raro, 7);
  add('rar_rar_15', 'rarity', 'Diamante', 'Coleccionista Exclusivo', 'Alcanza 15 autos Raros', 'star', rarityCounts.raro, 15);

  add('rar_leg_1', 'rarity', 'Platino', 'Encuentro Legendario', 'Captura tu primer auto Legendario', 'trophy', rarityCounts.legendario, 1);
  add('rar_leg_3', 'rarity', 'Diamante', 'Cazador de Leyendas', 'Reúne 3 autos Legendarios', 'trophy', rarityCounts.legendario, 3);
  add('rar_leg_5', 'rarity', 'Diamante', 'Santuario Dorado', 'Consigue 5 autos Legendarios', 'crown', rarityCounts.legendario, 5);
  add('rar_leg_10', 'rarity', 'Mito', 'Olimpo del Motor', 'Colecciona 10 autos Legendarios', 'sparkles', rarityCounts.legendario, 10);

  add('rar_his_1', 'rarity', 'Platino', 'Reliquia Histórica', 'Cataloga tu primer auto Histórico', 'shield', rarityCounts.historico, 1);
  add('rar_his_3', 'rarity', 'Diamante', 'Conservador del Museo', 'Reúne 3 autos Históricos', 'shield', rarityCounts.historico, 3);
  add('rar_his_5', 'rarity', 'Diamante', 'Guardián del Pasado', 'Consigue 5 autos Históricos', 'crown', rarityCounts.historico, 5);
  add('rar_his_10', 'rarity', 'Mito', 'Patrimonio Automotor', 'Colecciona 10 autos Históricos', 'sparkles', rarityCounts.historico, 10);

  // --- 6. FANÁTICOS POR MARCA (26) ---
  add('br_vw_1', 'brands', 'Bronce', 'Volks-Spotter', 'Captura tu primer Volkswagen', 'car', brandCount('volkswagen') + brandCount('vw'), 1);
  add('br_vw_3', 'brands', 'Oro', 'Fanático Wolfsburg', 'Reúne 3 Volkswagen en el garage', 'car', brandCount('volkswagen') + brandCount('vw'), 3);
  add('br_peug_1', 'brands', 'Bronce', 'Garra del León', 'Captura tu primer Peugeot', 'car', brandCount('peugeot'), 1);
  add('br_peug_3', 'brands', 'Oro', 'Escudería Sochaux', 'Reúne 3 modelos de Peugeot', 'car', brandCount('peugeot'), 3);
  add('br_ren_1', 'brands', 'Bronce', 'Rombo en la Ruta', 'Captura tu primer Renault', 'car', brandCount('renault'), 1);
  add('br_ren_3', 'brands', 'Oro', 'Pasión Rombo', 'Reúne 3 Renault en tu garage', 'car', brandCount('renault'), 3);
  add('br_fiat_1', 'brands', 'Bronce', 'Cuore Italiano Popular', 'Captura tu primer Fiat', 'car', brandCount('fiat'), 1);
  add('br_fiat_3', 'brands', 'Oro', 'Club del Fitito', 'Reúne 3 modelos Fiat', 'car', brandCount('fiat'), 3);
  add('br_ford_1', 'brands', 'Bronce', 'Óvalo Azul', 'Captura tu primer Ford', 'car', brandCount('ford'), 1);
  add('br_ford_3', 'brands', 'Oro', 'Sangre de Detroit', 'Reúne 3 vehículos Ford', 'car', brandCount('ford'), 3);
  add('br_chev_1', 'brands', 'Bronce', 'Corbatín Dorado', 'Captura tu primer Chevrolet', 'car', brandCount('chevrolet'), 1);
  add('br_chev_3', 'brands', 'Oro', 'Fanático Chevy', 'Reúne 3 Chevrolet en tu colección', 'car', brandCount('chevrolet'), 3);
  add('br_toy_1', 'brands', 'Bronce', 'Confiabilidad Nippona', 'Captura tu primer Toyota', 'car', brandCount('toyota'), 1);
  add('br_toy_3', 'brands', 'Oro', 'Garantía Toyota', 'Reúne 3 modelos Toyota', 'car', brandCount('toyota'), 3);
  add('br_hon_1', 'brands', 'Plata', 'Espíritu VTEC', 'Captura al menos 1 Honda', 'car', brandCount('honda'), 1);
  add('br_bmw_1', 'brands', 'Plata', 'Hélice Bávara', 'Captura tu primer BMW', 'car', brandCount('bmw'), 1);
  add('br_bmw_3', 'brands', 'Platino', 'División M', 'Reúne 3 BMW en el taller', 'crown', brandCount('bmw'), 3);
  add('br_mb_1', 'brands', 'Plata', 'Estrella de Tres Puntas', 'Captura un Mercedes-Benz / AMG', 'car', brandCount('mercedes') + brandCount('amg'), 1);
  add('br_audi_1', 'brands', 'Plata', 'Cuatro Aros', 'Captura tu primer Audi', 'car', brandCount('audi'), 1);
  add('br_por_1', 'brands', 'Oro', 'Stuttgart Express', 'Captura tu primer Porsche', 'trophy', brandCount('porsche'), 1);
  add('br_por_3', 'brands', 'Diamante', 'Colección 911', 'Reúne 3 modelos Porsche', 'crown', brandCount('porsche'), 3);
  add('br_fer_1', 'brands', 'Platino', 'Cavallino Rampante', 'Captura tu primer Ferrari', 'trophy', brandCount('ferrari'), 1);
  add('br_fer_3', 'brands', 'Mito', 'Tifoso Oficial', 'Reúne 3 Ferrari en tu garage', 'sparkles', brandCount('ferrari'), 3);
  add('br_cit_1', 'brands', 'Bronce', 'Doble Chevrón', 'Captura un Citroën en la calle', 'car', brandCount('citroen'), 1);
  add('br_sub_mit_1', 'brands', 'Plata', 'Leyenda del Rally', 'Captura un Subaru o Mitsubishi', 'flame', brandCount('subaru') + brandCount('mitsubishi'), 1);
  add('br_exotic_1', 'brands', 'Platino', 'Corazón Italiano Exótico', 'Captura un Alfa Romeo, Lamborghini o Maserati', 'star', brandCount('alfa') + brandCount('lamborghini') + brandCount('maserati'), 1);

  // --- 7. PAÍSES Y REGIONES (13) ---
  add('reg_de_1', 'regions', 'Bronce', 'Ingeniería Alemana', 'Captura 1 auto de Alemania', 'globe', countryCount('alemania', 'germany'), 1);
  add('reg_de_5', 'regions', 'Oro', 'Autobahn Master', 'Reúne 5 autos alemanes', 'globe', countryCount('alemania', 'germany'), 5);
  add('reg_it_1', 'regions', 'Bronce', 'Pasión Italiana', 'Captura 1 auto de Italia', 'globe', countryCount('italia', 'italy'), 1);
  add('reg_it_5', 'regions', 'Platino', 'La Bella Macchina', 'Reúne 5 autos italianos', 'globe', countryCount('italia', 'italy'), 5);
  add('reg_fr_1', 'regions', 'Bronce', 'Diseño Francés', 'Captura 1 auto de Francia', 'globe', countryCount('francia', 'france'), 1);
  add('reg_fr_5', 'regions', 'Oro', 'Avenue des Champs', 'Reúne 5 autos franceses', 'globe', countryCount('francia', 'france'), 5);
  add('reg_jp_1', 'regions', 'Bronce', 'Cultura JDM', 'Captura 1 auto de Japón', 'globe', countryCount('japon', 'japan'), 1);
  add('reg_jp_5', 'regions', 'Oro', 'Rey del Touge', 'Reúne 5 autos japoneses', 'globe', countryCount('japon', 'japan'), 5);
  add('reg_us_1', 'regions', 'Bronce', 'Ruta 66', 'Captura 1 auto de Estados Unidos', 'globe', countryCount('estados unidos', 'usa', 'eeuu'), 1);
  add('reg_us_5', 'regions', 'Oro', 'Muscle & Pickups', 'Reúne 5 autos estadounidenses', 'globe', countryCount('estados unidos', 'usa', 'eeuu'), 5);
  add('reg_uk_1', 'regions', 'Plata', 'Estilo Británico', 'Captura 1 auto de Reino Unido', 'globe', countryCount('reino unido', 'inglaterra', 'uk'), 1);
  add('reg_div_3', 'regions', 'Plata', 'Pasaporte Vial', 'Colecciona autos de 3 países distintos', 'compass', uniqueCountries.size, 3);
  add('reg_div_6', 'regions', 'Diamante', 'Vuelta al Mundo', 'Colecciona autos de 6 países distintos', 'globe', uniqueCountries.size, 6);

  // --- 8. MOTORES Y TECNOLOGÍA (12) ---
  add('eng_turbo_1', 'engines', 'Plata', 'Silbido de Admisión', 'Captura 1 vehículo con motor Turbo / Twin-Turbo', 'wind', engineCount('turbo'), 1);
  add('eng_turbo_5', 'engines', 'Platino', 'Adicto al Boost', 'Reúne 5 motores con Turbo', 'wind', engineCount('turbo'), 5);
  add('eng_v8_1', 'engines', 'Oro', 'Rugido V8', 'Captura 1 vehículo con motor V8', 'flame', engineCount('v8'), 1);
  add('eng_v8_3', 'engines', 'Diamante', 'Orquesta de Ocho Cilindros', 'Reúne 3 autos con motor V8', 'flame', engineCount('v8'), 3);
  add('eng_v10_12', 'engines', 'Mito', 'Sinfonía Extrema', 'Captura un motor V10 o V12', 'sparkles', engineCount('v10', 'v12'), 1);
  add('eng_v6_1', 'engines', 'Plata', 'Equilibrio V6', 'Captura 1 vehículo con motor V6', 'wrench', engineCount('v6'), 1);
  add('eng_boxer', 'engines', 'Oro', 'Pistones Opuestos', 'Captura un motor Bóxer (Porsche o Subaru)', 'wrench', engineCount('boxer'), 1);
  add('eng_hybrid', 'engines', 'Plata', 'Futuro Híbrido', 'Captura un vehículo híbrido o enchufable', 'zap', engineCount('hibrid', 'hybrid'), 1);
  add('eng_ev', 'engines', 'Plata', 'Cero Emisiones', 'Captura un automóvil 100% eléctrico', 'zap', engineCount('electri', 'ev '), 1);
  add('eng_diesel', 'engines', 'Bronce', 'Torque Diésel', 'Captura un motor Diésel / TDI / HDi', 'wrench', engineCount('diesel', 'tdi', 'hdi', 'dci'), 1);
  add('eng_i6', 'engines', 'Oro', 'Seis en Línea', 'Captura un motor 6 cilindros en línea', 'wrench', engineCount('6 en linea', 'l6', 'i6'), 1);
  add('eng_i4_3', 'engines', 'Bronce', 'Cuatro Cilindros Fieles', 'Reúne 3 autos de 4 cilindros', 'wrench', engineCount('4 cil', '4 cilindros'), 3);

  // --- 9. ÉPOCAS Y CLÁSICOS (8) ---
  const y60s = countWhere(c => { const y = parseYear(c); return y && y <= 1969; });
  const y70s = countWhere(c => { const y = parseYear(c); return y >= 1970 && y <= 1979; });
  const y80s = countWhere(c => { const y = parseYear(c); return y >= 1980 && y <= 1989; });
  const y90s = countWhere(c => { const y = parseYear(c); return y >= 1990 && y <= 1999; });
  const y00s = countWhere(c => { const y = parseYear(c); return y >= 2000 && y <= 2009; });
  const y20s = countWhere(c => { const y = parseYear(c); return y >= 2020; });
  const yVet = countWhere(c => { const y = parseYear(c); return y && y <= 1996; });

  add('era_60s', 'eras', 'Platino', 'Era Dorada (Pre-70)', 'Captura un clásico de 1969 o anterior', 'calendar', y60s, 1);
  add('era_70s', 'eras', 'Oro', 'Setentoso', 'Cataloga un modelo de los años 70', 'calendar', y70s, 1);
  add('era_80s', 'eras', 'Oro', 'Fiebre Retro 80s', 'Cataloga un icono de los años 80', 'calendar', y80s, 1);
  add('era_90s', 'eras', 'Plata', 'Nostalgia Noventosa', 'Cataloga un modelo de los años 90', 'calendar', y90s, 1);
  add('era_00s', 'eras', 'Bronce', 'Generación Dosmil', 'Captura un modelo entre 2000 y 2009', 'calendar', y00s, 1);
  add('era_20s', 'eras', 'Bronce', 'Nueva Generación', 'Captura un modelo 2020 o más reciente', 'calendar', y20s, 1);
  add('era_vet', 'eras', 'Oro', 'Patente Histórica (30+ años)', 'Consigue un vehículo con 30 años o más', 'shield', yVet, 1);
  add('era_4dec', 'eras', 'Diamante', 'Viajero en el Tiempo', 'Reúne autos de 4 décadas diferentes', 'clock', uniqueDecades.size, 4);

  // --- 10. COLORES, CAPTURAS REALES Y SECRETOS (9) ---
  add('spc_red', 'special', 'Plata', 'Fiebre Carmesí', 'Captura 3 autos de color rojo / rosso', 'sparkles', colorCount('rojo', 'red', 'rosso'), 3);
  add('spc_black', 'special', 'Plata', 'Escuadrón Nocturno', 'Captura 3 autos de color negro / black', 'sparkles', colorCount('negro', 'black', 'oscuro'), 3);
  add('spc_white', 'special', 'Plata', 'Perla Pura', 'Captura 3 autos de color blanco / white', 'sparkles', colorCount('blanco', 'white', 'perla', 'carrara'), 3);
  add('spc_blue', 'special', 'Bronce', 'Rayo Azul', 'Captura 2 autos de color azul / blue', 'sparkles', colorCount('azul', 'blue'), 2);
  add('spc_yellow', 'special', 'Plata', 'Amarillo Modena', 'Captura 1 auto amarillo o dorado', 'star', colorCount('amarillo', 'yellow', 'giallo', 'dorado', 'gold'), 1);
  add('spc_green', 'special', 'Plata', 'British / Highland Green', 'Captura 1 auto de color verde', 'star', colorCount('verde', 'green'), 1);

  add('spc_photo_1', 'special', 'Bronce', 'Fotógrafo en Acción', 'Escanea tu primer auto con foto real', 'camera', realPhotoCount, 1);
  add('spc_photo_10', 'special', 'Oro', 'Reportero Vial', 'Guarda 10 autos fotografiados por ti', 'camera', realPhotoCount, 10);
  add('spc_night', 'special', 'Platino', 'Búho del Asfalto', 'Captura un auto entre las 00:00 y 05:59 hs', 'clock', hasNightCapture, 1);
  add('spc_early', 'special', 'Plata', 'Madrugador Automotriz', 'Captura un auto entre las 06:00 y 08:59 hs', 'clock', hasEarlyCapture, 1);
  add('spc_streak_3', 'special', 'Oro', 'Jornada Épica', 'Captura 3 autos en un mismo día', 'flame', maxDayCaptures, 3);

  const unlockedCount = list.filter(a => a.unlocked).length;
  return {
    achievements: list,
    unlockedCount,
    totalCount: list.length,
    stats: { totalCars, totalHp, uniqueBrandsCount: uniqueBrands.size }
  };
}
