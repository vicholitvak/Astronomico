/**
 * ONE SKY EXPEDITIONS - ACTIVITY INVENTORY
 * Base de datos maestra de actividades con reglas de negocio
 */

/** @type {import('./types.js').Activity[]} */
export const INVENTORY = [
  // ================================
  // CORE EXPERIENCES (Tu producto estrella)
  // ================================
  {
    id: "astro_signature",
    name: "One Sky Signature Astronomy (Deep Sky & Astrophotography)",
    category: "CORE",
    duration_hours: 4,
    start_time_range: ["20:30", "21:30"],
    altitude_max_meters: 2450,
    physical_effort: 1,
    active: true,
    financials: {
      cost_net_usd: 0,
      price_retail_usd: 165,
      margin_usd: 165
    },
    logic_flags: {
      is_night_activity: true,
      triggers_anti_zombie: true,
      moon_dependent: true,
      requires_clear_sky: true,
      best_for_photographers: true
    }
  },

  // ================================
  // CLASSIC TOURS
  // ================================
  {
    id: "valle_luna_golden",
    name: "Valle de la Luna & Muerte - Golden Hour (Privado)",
    category: "CLASSIC",
    duration_hours: 4,
    start_time_range: ["15:30", "16:30"],
    altitude_max_meters: 2550,
    physical_effort: 2,
    active: true,
    financials: {
      cost_net_usd: 28,
      price_retail_usd: 95,
      margin_usd: 67
    },
    logic_flags: {
      best_for_photographers: true
    }
  },

  {
    id: "laguna_cejar",
    name: "Laguna Cejar & Ojos del Salar (Afternoon)",
    category: "CLASSIC",
    duration_hours: 5,
    start_time_range: ["14:00", "15:00"],
    altitude_max_meters: 2300,
    physical_effort: 1,
    active: true,
    financials: {
      cost_net_usd: 35,
      price_retail_usd: 110,
      margin_usd: 75
    },
    logic_flags: {}
  },

  {
    id: "lagunas_altiplanicas",
    name: "Lagunas Altiplánicas (Miscanti & Miñiques)",
    category: "CLASSIC",
    duration_hours: 8,
    start_time_range: ["08:00", "09:00"],
    altitude_max_meters: 4200,
    physical_effort: 2,
    active: true,
    financials: {
      cost_net_usd: 45,
      price_retail_usd: 120,
      margin_usd: 75
    },
    logic_flags: {
      anti_zombie_blocker: false // Empieza tarde (08:00)
    }
  },

  {
    id: "valle_arcoiris",
    name: "Valle del Arcoíris + Yerbas Buenas",
    category: "CLASSIC",
    duration_hours: 6,
    start_time_range: ["09:00", "10:00"],
    altitude_max_meters: 3200,
    physical_effort: 2,
    active: true,
    financials: {
      cost_net_usd: 40,
      price_retail_usd: 115,
      margin_usd: 75
    },
    logic_flags: {}
  },

  // ================================
  // LUXURY EXPERIENCES
  // ================================
  {
    id: "termas_puritama",
    name: "Termas de Puritama (Morning Relax)",
    category: "LUX",
    duration_hours: 5,
    start_time_range: ["09:30", "10:00"],
    altitude_max_meters: 3500,
    physical_effort: 1,
    active: true,
    financials: {
      cost_net_usd: 42,
      price_retail_usd: 140,
      margin_usd: 98
    },
    logic_flags: {
      luxury_only: true,
      anti_zombie_blocker: false // Empieza a las 09:30, perfecto post-astro
    }
  },

  {
    id: "valle_luna_sunset_premium",
    name: "Valle de la Luna Sunset Premium + Cena Astronómica",
    category: "LUX",
    duration_hours: 5,
    start_time_range: ["16:00"],
    altitude_max_meters: 2550,
    physical_effort: 1,
    active: true,
    financials: {
      cost_net_usd: 65,
      price_retail_usd: 180,
      margin_usd: 115
    },
    logic_flags: {
      luxury_only: true,
      best_for_photographers: true
    }
  },

  // ================================
  // HIGH ALTITUDE (Madrugadas)
  // ================================
  {
    id: "geysers_tatio",
    name: "Geysers del Tatio (Privado)",
    category: "HIGH_ALTITUDE",
    duration_hours: 7,
    start_time_range: ["05:00", "05:30"],
    altitude_max_meters: 4320,
    physical_effort: 2,
    active: true,
    financials: {
      cost_net_usd: 90,
      price_retail_usd: 210,
      margin_usd: 120
    },
    logic_flags: {
      requires_early_pickup: true,
      anti_zombie_blocker: true // BLOQUEADO después de Astro Tour
    }
  },

  {
    id: "piedras_rojas",
    name: "Piedras Rojas & Salar de Aguas Calientes",
    category: "HIGH_ALTITUDE",
    duration_hours: 10,
    start_time_range: ["06:00"],
    altitude_max_meters: 4500,
    physical_effort: 3,
    active: true,
    financials: {
      cost_net_usd: 110,
      price_retail_usd: 245,
      margin_usd: 135
    },
    logic_flags: {
      requires_early_pickup: true,
      anti_zombie_blocker: true,
      best_for_photographers: true
    }
  },

  // ================================
  // EXPEDITIONS (Multi-día)
  // ================================
  {
    id: "uyuni_oneway",
    name: "Expedición Uyuni 4D/3N (Finaliza en Uyuni)",
    category: "EXPEDITION",
    duration_hours: 96,
    start_time_range: ["07:00"],
    altitude_max_meters: 5000,
    physical_effort: 3,
    active: true,
    financials: {
      cost_net_usd: 195,
      price_retail_usd: 335,
      margin_usd: 140
    },
    logic_flags: {
      is_border_crossing: true,
      force_morning_start: true,
      requires_early_pickup: false // Excepción: 07:00 es aceptable
    }
  },

  {
    id: "uyuni_return",
    name: "Expedición Uyuni 6D/5N (Retorno San Pedro)",
    category: "EXPEDITION",
    duration_hours: 144,
    start_time_range: ["07:00"],
    altitude_max_meters: 5000,
    physical_effort: 3,
    active: true,
    financials: {
      cost_net_usd: 325,
      price_retail_usd: 550,
      margin_usd: 225
    },
    logic_flags: {
      is_border_crossing: true,
      force_morning_start: true
    }
  },

  // ================================
  // BLACKLIST (Tours que NO ofrecemos)
  // ================================
  {
    id: "sandboard_death",
    name: "Sandboard",
    category: "BLACKLIST",
    duration_hours: 3,
    start_time_range: [],
    altitude_max_meters: 2500,
    physical_effort: 4,
    active: false,
    logic_flags: {
      blacklist_reason: "Alto riesgo físico - Arena en ojos/nariz - Experiencia mediocre"
    }
  },

  {
    id: "tour_masivo_valle",
    name: "Tour Masivo Valle de la Luna",
    category: "BLACKLIST",
    duration_hours: 4,
    start_time_range: [],
    altitude_max_meters: 2500,
    physical_effort: 2,
    active: false,
    logic_flags: {
      blacklist_reason: "Grupos grandes (20+ personas) - Experiencia degradada - No One Sky estándar"
    }
  },

  {
    id: "tour_vino_barato",
    name: "Tour del Vino Económico",
    category: "BLACKLIST",
    duration_hours: 5,
    start_time_range: [],
    altitude_max_meters: 2400,
    physical_effort: 1,
    active: false,
    logic_flags: {
      blacklist_reason: "Calidad inferior - No alineado con marca premium"
    }
  }
];