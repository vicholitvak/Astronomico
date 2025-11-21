/**
 * ONE SKY EXPEDITIONS - RULES ENGINE
 * Motor de lógica de negocio para generación inteligente de itinerarios
 */

import { INVENTORY } from './inventory.js';

/**
 * Genera un itinerario personalizado basado en el perfil del usuario
 * @param {import('./types.js').UserProfile} profile - Perfil del usuario
 * @returns {import('./types.js').GeneratedItinerary}
 */
export function generateExpedition(profile) {
  /** @type {import('./types.js').ItineraryDay[]} */
  const days = [];
  /** @type {string[]} */
  const warnings = [];
  let totalPrice = 0;

  // ================================
  // 1. DETECCIÓN DE BLACKLIST
  // ================================
  const forbiddenTerms = ['sandboard', 'vino', 'barato', 'masivo', 'grupo grande'];
  const requestedBlacklist = forbiddenTerms.some(term =>
    profile.special_requests.toLowerCase().includes(term)
  );

  if (requestedBlacklist) {
    warnings.push(
      "⚠️ Hemos filtrado actividades de riesgo o baja calidad que mencionaste. " +
      "En One Sky priorizamos experiencias premium y tu seguridad."
    );
  }

  // ================================
  // 2. LÓGICA DÍA 1: ACLIMATACIÓN
  // ================================
  /** @type {import('./types.js').ItineraryDay} */
  const day1 = {
    day: 1,
    notes: ["🌅 Llegada y Aclimatación Suave (2,400m)"]
  };

  if (profile.vibe === 'PHOTO') {
    // Fotógrafos → Valle de la Luna Golden Hour
    const act = INVENTORY.find(i => i.id === 'valle_luna_golden');
    if (act && act.active) {
      day1.afternoon = act;
      totalPrice += act.financials.price_retail_usd;
      day1.notes.push("📸 Luz perfecta para fotografía de paisaje");
    }
  } else {
    // Resto → Laguna Cejar (Relax + Flotación)
    const act = INVENTORY.find(i => i.id === 'laguna_cejar');
    if (act && act.active) {
      day1.afternoon = act;
      totalPrice += act.financials.price_retail_usd;
      day1.notes.push("💧 Experiencia de flotación única");
    }
  }

  days.push(day1);

  // ================================
  // 3. LÓGICA DÍA 2: CORE EXPERIENCE
  // ================================
  /** @type {import('./types.js').ItineraryDay} */
  const day2 = {
    day: 2,
    notes: ["✨ Día Principal - Experiencia One Sky"]
  };

  // Asignar Astro Tour (Tu producto estrella)
  const astroTour = INVENTORY.find(i => i.id === 'astro_signature');
  if (astroTour && astroTour.active) {
    day2.night = astroTour;
    totalPrice += astroTour.financials.price_retail_usd;
    day2.notes.push("🔭 Deep Sky Observation con Telescopio Inteligente");
    day2.notes.push("🌌 Captura de Nebulosas y Galaxias a Color");
  }

  // Actividad diurna día 2 (antes del astro)
  if (profile.vibe === 'ADVENTURE') {
    const act = INVENTORY.find(i => i.id === 'lagunas_altiplanicas');
    if (act && act.active) {
      day2.morning = act;
      totalPrice += act.financials.price_retail_usd;
      day2.notes.push("🏔️ Alta montaña con vistas espectaculares");
    }
  } else if (profile.budget_level === 'HIGH' || profile.budget_level === 'UNLIMITED') {
    const act = INVENTORY.find(i => i.id === 'valle_arcoiris');
    if (act && act.active) {
      day2.morning = act;
      totalPrice += act.financials.price_retail_usd;
    }
  }

  days.push(day2);

  // ================================
  // 4. ACTIVAR MODO ZOMBIE?
  // ================================
  // Si el usuario odia madrugar OR acaba de hacer tour astro
  const isZombieMode = profile.hate_early_mornings ||
    (astroTour && astroTour.logic_flags?.triggers_anti_zombie);

  if (isZombieMode && profile.hate_early_mornings) {
    warnings.push(
      "💤 Hemos protegido tu sueño: Evitamos tours con salida antes de las 08:00 AM"
    );
  } else if (isZombieMode) {
    warnings.push(
      "💤 Protección Anti-Zombie activada: Evitamos madrugadas post-astro para mejor experiencia"
    );
  }

  // ================================
  // 5. LÓGICA DÍA 3+: DECISIÓN CRÍTICA
  // ================================

  if (profile.uyuni_preference !== 'NONE') {
    // ==================
    // RUTA A: EXPEDICIÓN UYUNI
    // ==================
    /** @type {import('./types.js').ItineraryDay} */
    const day3 = {
      day: 3,
      notes: ["🚀 Inicio Expedición Bolivia"]
    };

    const uyuniId = profile.uyuni_preference === 'ONE_WAY' ? 'uyuni_oneway' : 'uyuni_return';
    const uyuniTour = INVENTORY.find(i => i.id === uyuniId);

    if (uyuniTour && uyuniTour.active) {
      day3.morning = uyuniTour;
      totalPrice += uyuniTour.financials.price_retail_usd;
      day3.notes.push("🇧🇴 Cruce frontera Chile-Bolivia");
      day3.notes.push("🌋 Lagunas de colores + Geysers + Salar de Uyuni");

      if (isZombieMode) {
        warnings.push(
          "ℹ️ Nota: La expedición a Uyuni requiere salida a las 07:00 AM. " +
          "Es la única excepción a nuestra regla Anti-Zombie porque la experiencia lo vale."
        );
      }

      // Uyuni es multi-día, no agregar más días
      days.push(day3);

    } else {
      warnings.push("⚠️ Tour de Uyuni no disponible actualmente");
    }

  } else {
    // ==================
    // RUTA B: QUEDARSE EN SAN PEDRO
    // ==================
    for (let dayNum = 3; dayNum <= profile.nights; dayNum++) {
      /** @type {import('./types.js').ItineraryDay} */
      const currentDay = {
        day: dayNum,
        notes: []
      };

      // Lógica para día 3 (Post-Astro)
      if (dayNum === 3) {
        if (isZombieMode) {
          // REGLA APLICADA: Bloquear Tatio, ofrecer Puritama
          const puritama = INVENTORY.find(i => i.id === 'termas_puritama');
          if (puritama && puritama.active) {
            currentDay.morning = puritama;
            totalPrice += puritama.financials.price_retail_usd;
            currentDay.notes.push("🧖 Mañana de Relax Post-Astro (Inicio 09:30)");
            currentDay.notes.push("♨️ Aguas termales naturales a 3,500m");
          }
        } else {
          // Usuario es "Iron Man" que quiere madrugar
          const tatio = INVENTORY.find(i => i.id === 'geysers_tatio');
          if (tatio && tatio.active) {
            currentDay.morning = tatio;
            totalPrice += tatio.financials.price_retail_usd;
            currentDay.notes.push("🌋 Geysers activos al amanecer");
            currentDay.notes.push("⚠️ Salida 05:00 AM - Alta exigencia");
          }
        }
      }

      // Días adicionales (4+)
      if (dayNum >= 4) {
        // Rotar entre actividades según preferencias
        if (profile.vibe === 'PHOTO') {
          const piedrasRojas = INVENTORY.find(i => i.id === 'piedras_rojas');
          if (piedrasRojas && piedrasRojas.active && !isZombieMode) {
            currentDay.morning = piedrasRojas;
            totalPrice += piedrasRojas.financials.price_retail_usd;
            currentDay.notes.push("📸 Paisaje marciano para fotografía");
          }
        } else if (profile.vibe === 'RELAX') {
          const arcoiris = INVENTORY.find(i => i.id === 'valle_arcoiris');
          if (arcoiris && arcoiris.active) {
            currentDay.afternoon = arcoiris;
            totalPrice += arcoiris.financials.price_retail_usd;
            currentDay.notes.push("🌈 Valle multicolor + Petroglifos");
          }
        }
      }

      days.push(currentDay);
    }
  }

  // ================================
  // 6. RECOMENDACIONES ADICIONALES
  // ================================

  // Advertencia sobre altitud
  const hasHighAltitude = days.some(d =>
    (d.morning?.altitude_max_meters || 0) > 4000 ||
    (d.afternoon?.altitude_max_meters || 0) > 4000
  );

  if (hasHighAltitude) {
    warnings.push(
      "🏔️ Incluye actividades sobre 4,000m - Recomendamos té de coca y hidratación constante"
    );
  }

  // Recomendación sobre fotografía
  if (profile.vibe === 'PHOTO') {
    warnings.push(
      "📸 Pro Tip: Trae lentes gran angular (14-24mm) + trípode para astrofotografía óptima"
    );
  }

  // Presupuesto
  if (profile.budget_level === 'LOW' && totalPrice > 300) {
    warnings.push(
      "💰 Tu itinerario supera presupuesto básico. Contáctanos para opciones grupales más económicas."
    );
  }

  return {
    profile,
    days,
    total_price_usd: totalPrice,
    warnings
  };
}

/**
 * Obtiene actividad por ID
 * @param {string} activityId
 * @returns {import('./types.js').Activity | undefined}
 */
export function getActivityById(activityId) {
  return INVENTORY.find(a => a.id === activityId);
}

/**
 * Obtiene actividades por categoría
 * @param {'CORE'|'CLASSIC'|'LUX'|'HIGH_ALTITUDE'|'EXPEDITION'|'BLACKLIST'} category
 * @returns {import('./types.js').Activity[]}
 */
export function getActivitiesByCategory(category) {
  return INVENTORY.filter(a => a.category === category && a.active);
}

/**
 * Valida si una actividad es compatible con el perfil del usuario
 * @param {import('./types.js').Activity} activity
 * @param {import('./types.js').UserProfile} profile
 * @param {boolean} isPostAstro - Si se ejecuta después de tour astronómico
 * @returns {{compatible: boolean, reason?: string}}
 */
export function validateActivityCompatibility(activity, profile, isPostAstro = false) {
  // Blacklist
  if (!activity.active) {
    return {
      compatible: false,
      reason: activity.logic_flags?.blacklist_reason || 'Actividad no disponible'
    };
  }

  // Anti-Zombie Rule
  if (isPostAstro && activity.logic_flags?.anti_zombie_blocker && profile.hate_early_mornings) {
    return {
      compatible: false,
      reason: 'Salida muy temprana después de tour nocturno (protección de sueño)'
    };
  }

  // Luxury Level
  if (activity.logic_flags?.luxury_only &&
      (profile.budget_level === 'LOW' || profile.budget_level === 'MID')) {
    return {
      compatible: false,
      reason: 'Experiencia premium - Requiere presupuesto superior'
    };
  }

  // Physical Effort
  if (activity.physical_effort >= 4 && profile.special_requests.toLowerCase().includes('relax')) {
    return {
      compatible: false,
      reason: 'Alta exigencia física - No compatible con perfil relax'
    };
  }

  return { compatible: true };
}