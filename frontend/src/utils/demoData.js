export const RARITY_CONFIG = {
  'Histórico': {
    badge: 'HISTÓRICO',
    border: 'border-amber-500 shadow-amber-500/50',
    glow: 'from-amber-500/20 via-orange-600/10 to-transparent',
    text: 'text-amber-400',
    bgBadge: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-black',
    cardClass: 'holo-historic'
  },
  'Legendario': {
    badge: 'LEGENDARIO',
    border: 'border-yellow-400 shadow-yellow-400/50',
    glow: 'from-yellow-400/20 via-amber-500/10 to-transparent',
    text: 'text-yellow-400',
    bgBadge: 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-black animate-pulse',
    cardClass: 'holo-legendary'
  },
  'Raro': {
    badge: 'RARO',
    border: 'border-purple-500 shadow-purple-500/40',
    glow: 'from-purple-500/20 via-indigo-600/10 to-transparent',
    text: 'text-purple-400',
    bgBadge: 'bg-purple-600 text-white font-bold',
    cardClass: 'holo-rare'
  },
  'Común': {
    badge: 'COMÚN',
    border: 'border-blue-500 shadow-blue-500/30',
    glow: 'from-blue-500/15 via-cyan-600/10 to-transparent',
    text: 'text-blue-400',
    bgBadge: 'bg-blue-600 text-white font-medium',
    cardClass: 'holo-common'
  },
  'Básico': {
    badge: 'BÁSICO',
    border: 'border-zinc-500 shadow-zinc-500/20',
    glow: 'from-zinc-500/10 via-zinc-700/10 to-transparent',
    text: 'text-zinc-400',
    bgBadge: 'bg-zinc-700 text-zinc-200 font-medium',
    cardClass: 'holo-basic'
  }
};

export const SAMPLE_CARS = [
  {
    name: 'Porsche 911 GT3 RS',
    rarity: 'Legendario',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
    data: {
      brand: 'Porsche',
      model: '911 GT3 RS (992)',
      year: '2023',
      rarity: 'Legendario',
      hp: 525,
      zeroToHundred: 3.2,
      topSpeed: 296,
      engine: '4.0L Bóxer 6 cil. Atmosférico (9000 RPM)',
      color: 'Blanco Carrara / Llantas Pyro Red',
      country: 'Alemania',
      funFact: 'Equipa un alerón activo hidráulico con sistema DRS inspirado en la Fórmula 1.',
      rarityReason: 'Producción de alta demanda, codiciado en circuitos y valor de reventa superior.'
    }
  },
  {
    name: 'Ford Mustang Fastback',
    rarity: 'Histórico',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
    data: {
      brand: 'Ford',
      model: 'Mustang Fastback 390 GT',
      year: '1967',
      rarity: 'Histórico',
      hp: 320,
      zeroToHundred: 6.2,
      topSpeed: 215,
      engine: '6.4L V8 Big Block 390ci',
      color: 'Highland Green Vintage',
      country: 'Estados Unidos',
      funFact: 'Inmortalizado por Steve McQueen en la persecución más famosa del cine en "Bullitt" (1968).',
      rarityReason: 'Ícono supremo de los muscle cars clásicos estadounidenses de los años 60.'
    }
  },
  {
    name: 'BMW M3 Competition',
    rarity: 'Raro',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    data: {
      brand: 'BMW',
      model: 'M3 Competition (G80)',
      year: '2022',
      rarity: 'Raro',
      hp: 510,
      zeroToHundred: 3.5,
      topSpeed: 290,
      engine: '3.0L S58 Twin-Turbo 6 en línea',
      color: 'Isle of Man Green Metallic',
      country: 'Alemania',
      funFact: 'Desarrollado en Nürburgring Nordschleife con frenos carbocerámicos y tracción M xDrive.',
      rarityReason: 'Sedán de competición de alta gama con presencia muy buscada por car spotters.'
    }
  },
  {
    name: 'Ferrari F40',
    rarity: 'Histórico',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    data: {
      brand: 'Ferrari',
      model: 'F40 Berlinetta',
      year: '1987',
      rarity: 'Histórico',
      hp: 478,
      zeroToHundred: 4.1,
      topSpeed: 324,
      engine: '2.9L Twin-Turbo V8 Tipo F120A',
      color: 'Rosso Corsa',
      country: 'Italia',
      funFact: 'Fue el primer automóvil de producción en superar los 320 km/h (200 mph) y el último aprobado por Enzo Ferrari.',
      rarityReason: 'Obra cumbre de la historia del automovilismo con cotización millonaria.'
    }
  },
  {
    name: 'Toyota Corolla SEG',
    rarity: 'Básico',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    data: {
      brand: 'Toyota',
      model: 'Corolla 2.0 SEG',
      year: '2021',
      rarity: 'Básico',
      hp: 170,
      zeroToHundred: 9.4,
      topSpeed: 195,
      engine: '2.0L Dual VVT-iE 4 cilindros',
      color: 'Plata Metálico',
      country: 'Japón',
      funFact: 'Es el auto más vendido de todos los tiempos, con más de 50 millones de unidades globales.',
      rarityReason: 'Auto urbano sumamente común, el pilar de la categoría Básica.'
    }
  }
];

export const POKEDEX_CARS = [
  {
    id: 'porsche-gt3rs',
    brand: 'Porsche',
    name: '911 GT3 RS',
    generation: '992',
    year: '2023',
    rarity: 'Legendario',
    typeBadge: '⚡ Legendario • Circuito',
    themeColor: '#FF533D', // Vibrant Coral / Pikachu orange-red
    accentColor: '#FFD166',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1000&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-porsche-911-gt3-rs-carcarsporschevehiclecheetah-9615246535560n5h5.png',
    hp: 525,
    zeroToHundred: '3.2s',
    topSpeed: '296 km/h',
    catchRate: '2%',
    engine: '4.0L Bóxer 6 cil. Atmosférico (9000 RPM)',
    color: 'Blanco Carrara / Llantas Pyro Red',
    country: 'Alemania',
    description: 'Equipado con aerodinámica activa y DRS de F1. Es uno de los autos de homologación más veloces en el Nürburgring Nordschleife.',
    whereToCatch: 'Zonas exclusivas de la ciudad, track days de fin de semana en autódromos y concentraciones de superdeportivos.',
    recentSpottedLocation: 'Av. Libertador y Olleros (a 620m de ti)'
  },
  {
    id: 'ford-mustang-67',
    brand: 'Ford',
    name: 'Mustang Fastback',
    generation: '1ra Generación',
    year: '1967',
    rarity: 'Histórico',
    typeBadge: '🏆 Histórico • Muscle Car',
    themeColor: '#48D0B0', // Mint Teal Green like Squirtle / Highland Green
    accentColor: '#70E4CB',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1000&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-ford-mustang-shelby-gt500-carfordford-mustangford-mustang-shelbycaravehicletransport-17015274888258h63g.png',
    hp: 320,
    zeroToHundred: '6.2s',
    topSpeed: '215 km/h',
    catchRate: '4%',
    engine: '6.4L V8 Big Block 390ci',
    color: 'Highland Green Clásico',
    country: 'Estados Unidos',
    description: 'El legendario ícono de la era dorada de Detroit. Inmortalizado por Steve McQueen en la mítica película Bullitt.',
    whereToCatch: 'Exposiciones de autos clásicos, encuentros de coleccionistas en costanera y paseos soleados de domingo.',
    recentSpottedLocation: 'Paseo Costanera Norte (a 940m de ti)'
  },
  {
    id: 'ferrari-f40',
    brand: 'Ferrari',
    name: 'Ferrari F40',
    generation: 'Tipo F120',
    year: '1987',
    rarity: 'Histórico',
    typeBadge: '🔥 Histórico • Leyenda V8',
    themeColor: '#EA2828', // Rosso Corsa Red
    accentColor: '#FFD166',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-ferrari-f40-carferraricarsvehicle-1701527480572eoxu7.png',
    hp: 478,
    zeroToHundred: '4.1s',
    topSpeed: '324 km/h',
    catchRate: '1%',
    engine: '2.9L Twin-Turbo V8',
    color: 'Rosso Corsa',
    country: 'Italia',
    description: 'El último superdeportivo bendecido en persona por Don Enzo Ferrari antes de su fallecimiento. Pura fibra de carbono y kevlar analógico.',
    whereToCatch: 'Concursos de elegancia, galpones de coleccionistas privados y subastas internacionales de Sotheby’s.',
    recentSpottedLocation: 'Av. Alvear, Recoleta (a 1.8km de ti)'
  },
  {
    id: 'bmw-m3-g80',
    brand: 'BMW',
    name: 'M3 Competition',
    generation: 'G80',
    year: '2022',
    rarity: 'Raro',
    typeBadge: '⚡ Raro • Twin-Turbo',
    themeColor: '#3A86FF', // M-Power Electric Blue
    accentColor: '#60A5FA',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-bmw-m3-blue-carcarbmwvehicletransport-1701527419143om8i7.png',
    hp: 510,
    zeroToHundred: '3.5s',
    topSpeed: '290 km/h',
    catchRate: '9%',
    engine: '3.0L S58 Twin-Turbo 6 en línea',
    color: 'Isle of Man Green / Portimao Blue',
    country: 'Alemania',
    description: 'Sedán de carreras para la calle con tracción total M xDrive desactivable para derrapes controlados.',
    whereToCatch: 'Avenidas principales, cafés de polo o encuentros nocturnos de entusiastas de BMW M.',
    recentSpottedLocation: 'Plaza Italia, Palermo (a 1.3km de ti)'
  },
  {
    id: 'toyota-corolla',
    brand: 'Toyota',
    name: 'Corolla 2.0 SEG',
    generation: 'E210',
    year: '2021',
    rarity: 'Básico',
    typeBadge: '💧 Básico • Urbano',
    themeColor: '#78909C', // Slate Silver Blue
    accentColor: '#B0BEC5',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80',
    cutoutImage: 'https://purepng.com/public/uploads/large/purepng.com-toyota-corolla-grey-carcarvehicletransporttoyotatoyota-corolla-1701527622830p0awe.png',
    hp: 170,
    zeroToHundred: '9.4s',
    topSpeed: '195 km/h',
    catchRate: '85%',
    engine: '2.0L Dynamic Force 4 cil.',
    color: 'Plata Metálico',
    country: 'Japón',
    description: 'El automóvil más fabricado y vendido en la historia de la humanidad con más de 50 millones de unidades rodando.',
    whereToCatch: 'En cualquier esquina, semáforo, estacionamiento de supermercado o avenida de tu ciudad.',
    recentSpottedLocation: 'A 45 metros de tu ubicación actual'
  }
];
