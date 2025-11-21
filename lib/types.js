/**
 * ONE SKY EXPEDITIONS - TYPES DEFINITION
 * Sistema de tipos para el generador de itinerarios
 */

/**
 * @typedef {'PHOTO' | 'RELAX' | 'ADVENTURE' | 'BUDGET'} VibeType
 */

/**
 * @typedef {'NONE' | 'ONE_WAY' | 'ROUNDTRIP'} UyuniOption
 */

/**
 * @typedef {Object} Financials
 * @property {number} cost_net_usd - Costo neto operativo
 * @property {number} price_retail_usd - Precio venta al público
 * @property {number} margin_usd - Margen de ganancia
 */

/**
 * @typedef {Object} LogicFlags
 * @property {boolean} [is_night_activity] - Actividad nocturna
 * @property {boolean} [moon_dependent] - Depende de fase lunar
 * @property {boolean} [requires_clear_sky] - Requiere cielo despejado
 * @property {boolean} [triggers_anti_zombie] - Activa regla anti-zombie
 * @property {boolean} [best_for_photographers] - Óptimo para fotógrafos
 * @property {boolean} [luxury_only] - Solo para segmento premium
 * @property {boolean} [requires_early_pickup] - Requiere pickup temprano
 * @property {boolean} [anti_zombie_blocker] - Bloqueado en modo zombie
 * @property {boolean} [is_border_crossing] - Cruza frontera
 * @property {boolean} [force_morning_start] - Fuerza inicio mañana
 * @property {string} [blacklist_reason] - Razón de exclusión
 */

/**
 * @typedef {Object} Activity
 * @property {string} id - Identificador único
 * @property {string} name - Nombre comercial
 * @property {'CORE'|'CLASSIC'|'LUX'|'HIGH_ALTITUDE'|'EXPEDITION'|'BLACKLIST'} category
 * @property {number} duration_hours - Duración en horas
 * @property {string[]} start_time_range - Rango horario inicio
 * @property {number} altitude_max_meters - Altitud máxima
 * @property {1|2|3|4|5} physical_effort - Esfuerzo físico
 * @property {Financials} [financials] - Información financiera
 * @property {LogicFlags} [logic_flags] - Flags de lógica de negocio
 * @property {boolean} active - Actividad disponible
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name - Nombre del cliente
 * @property {VibeType} vibe - Tipo de experiencia buscada
 * @property {number} nights - Noches en destino
 * @property {number} pax - Número de personas
 * @property {UyuniOption} uyuni_preference - Preferencia Uyuni
 * @property {'LOW'|'MID'|'HIGH'|'UNLIMITED'} budget_level - Nivel presupuesto
 * @property {boolean} hate_early_mornings - Odia madrugar
 * @property {string} special_requests - Solicitudes especiales
 */

/**
 * @typedef {Object} ItineraryDay
 * @property {number} day - Número de día
 * @property {string} [date] - Fecha específica (opcional)
 * @property {Activity} [morning] - Actividad mañana
 * @property {Activity} [afternoon] - Actividad tarde
 * @property {Activity} [night] - Actividad noche
 * @property {string[]} notes - Notas del día
 */

/**
 * @typedef {Object} GeneratedItinerary
 * @property {UserProfile} profile - Perfil del usuario
 * @property {ItineraryDay[]} days - Días del itinerario
 * @property {number} total_price_usd - Precio total USD
 * @property {string[]} warnings - Advertencias/recomendaciones
 */

export {};