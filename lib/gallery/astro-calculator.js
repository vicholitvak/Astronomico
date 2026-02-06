// Astronomical calculator for San Pedro de Atacama (-22.9068, -68.1998)
// Moon phase, sunrise/sunset (NOAA algorithm), visible planets by month

const LATITUDE = -22.9068;
const LONGITUDE = -68.1998;
const TIMEZONE_OFFSET = -3; // Chile Standard Time (CLT) — NOTE: Chile uses -3 in summer, -4 in winter

/**
 * Calculate moon phase for a given date.
 * Based on the synodic month cycle from a known new moon reference.
 */
export function getMoonPhase(date) {
  const SYNODIC_MONTH = 29.53058867;
  // Known new moon: 2025-01-29 12:36 UTC
  const REFERENCE_NEW_MOON = new Date('2025-01-29T12:36:00Z');

  const diffMs = date.getTime() - REFERENCE_NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cyclePosition = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phase = cyclePosition / SYNODIC_MONTH; // 0 to 1

  // Illumination percentage (approximate sinusoidal)
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  const phases = [
    { name: 'New Moon', nameEs: 'Luna Nueva', emoji: '🌑', range: [0, 0.0625] },
    { name: 'Waxing Crescent', nameEs: 'Luna Creciente', emoji: '🌒', range: [0.0625, 0.1875] },
    { name: 'First Quarter', nameEs: 'Cuarto Creciente', emoji: '🌓', range: [0.1875, 0.3125] },
    { name: 'Waxing Gibbous', nameEs: 'Gibosa Creciente', emoji: '🌔', range: [0.3125, 0.4375] },
    { name: 'Full Moon', nameEs: 'Luna Llena', emoji: '🌕', range: [0.4375, 0.5625] },
    { name: 'Waning Gibbous', nameEs: 'Gibosa Menguante', emoji: '🌖', range: [0.5625, 0.6875] },
    { name: 'Last Quarter', nameEs: 'Cuarto Menguante', emoji: '🌗', range: [0.6875, 0.8125] },
    { name: 'Waning Crescent', nameEs: 'Menguante', emoji: '🌘', range: [0.8125, 1.0] }
  ];

  // Also catch wrap-around for new moon
  let phaseInfo = phases[0]; // default to new moon
  for (const p of phases) {
    if (phase >= p.range[0] && phase < p.range[1]) {
      phaseInfo = p;
      break;
    }
  }

  // Quality for stargazing (less moon = better)
  let quality;
  if (illumination <= 10) quality = 'Excellent — virtually no moonlight';
  else if (illumination <= 30) quality = 'Very good — minimal lunar interference';
  else if (illumination <= 50) quality = 'Good — some moonlight present';
  else if (illumination <= 75) quality = 'Fair — significant moonlight';
  else quality = 'Challenging — bright moonlight washes out faint objects';

  return {
    phase: phaseInfo.name,
    phaseEs: phaseInfo.nameEs,
    emoji: phaseInfo.emoji,
    illumination,
    age: Math.round(cyclePosition * 10) / 10, // days into cycle
    quality
  };
}

/**
 * Calculate sunrise and sunset times using the NOAA solar calculator algorithm.
 * Returns times in local Chile time.
 */
export function getSunTimes(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const jd = jdn - 0.5; // Julian Date at midnight UT

  // Julian Century
  const T = (jd - 2451545.0) / 36525.0;

  // Solar coordinates
  const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360; // geometric mean longitude
  const M = (357.52911 + T * (35999.05029 - 0.0001537 * T)) % 360; // mean anomaly
  const Mrad = M * Math.PI / 180;

  const C = (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad); // equation of center

  const sunLon = L0 + C; // sun true longitude
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180); // apparent longitude

  // Obliquity of ecliptic
  const epsilon0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega * Math.PI / 180);
  const epsilonRad = epsilon * Math.PI / 180;

  // Declination
  const lambdaRad = lambda * Math.PI / 180;
  const sinDec = Math.sin(epsilonRad) * Math.sin(lambdaRad);
  const dec = Math.asin(sinDec);

  // Equation of Time
  const y2 = Math.tan(epsilonRad / 2) ** 2;
  const L0rad = L0 * Math.PI / 180;
  const eqTime = 4 * (180 / Math.PI) * (y2 * Math.sin(2 * L0rad) - 2 * 0.016709 * Math.sin(Mrad) + 4 * 0.016709 * y2 * Math.sin(Mrad) * Math.cos(2 * L0rad) - 0.5 * y2 * y2 * Math.sin(4 * L0rad) - 1.25 * 0.016709 * 0.016709 * Math.sin(2 * Mrad));

  // Hour angle for sunrise/sunset (solar zenith angle = 90.833° for atmospheric refraction)
  const latRad = LATITUDE * Math.PI / 180;
  const zenith = 90.833 * Math.PI / 180;
  const cosHA = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(dec))) - Math.tan(latRad) * Math.tan(dec);

  if (cosHA > 1 || cosHA < -1) {
    // No sunrise/sunset (polar conditions — shouldn't happen for San Pedro)
    return { sunrise: null, sunset: null, dayLength: cosHA < -1 ? '24:00' : '0:00' };
  }

  const HA = Math.acos(cosHA) * 180 / Math.PI; // in degrees

  // Sunrise and sunset in minutes from midnight UTC
  const solarNoon = (720 - 4 * LONGITUDE - eqTime) / 60; // hours UTC
  const sunriseUTC = solarNoon - HA / 15; // hours
  const sunsetUTC = solarNoon + HA / 15; // hours

  // Determine timezone offset (Chile: CLT = -4, CLST = -3)
  const tzOffset = getChileTimezoneOffset(date);
  const sunriseLocal = sunriseUTC + tzOffset;
  const sunsetLocal = sunsetUTC + tzOffset;

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const dayLengthHours = sunsetUTC - sunriseUTC;
  const dlH = Math.floor(dayLengthHours);
  const dlM = Math.round((dayLengthHours - dlH) * 60);

  // Astronomical twilight (sun 18° below horizon)
  const twilightZenith = 108 * Math.PI / 180;
  const cosHATwilight = (Math.cos(twilightZenith) / (Math.cos(latRad) * Math.cos(dec))) - Math.tan(latRad) * Math.tan(dec);
  let astroTwilightEnd = null;
  let astroTwilightStart = null;
  if (cosHATwilight >= -1 && cosHATwilight <= 1) {
    const HATwilight = Math.acos(cosHATwilight) * 180 / Math.PI;
    astroTwilightStart = solarNoon - HATwilight / 15 + tzOffset;
    astroTwilightEnd = solarNoon + HATwilight / 15 + tzOffset;
  }

  return {
    sunrise: formatTime(sunriseLocal),
    sunset: formatTime(sunsetLocal),
    dayLength: `${dlH}h ${dlM}m`,
    astronomicalTwilightStart: astroTwilightStart ? formatTime(astroTwilightStart) : null,
    astronomicalTwilightEnd: astroTwilightEnd ? formatTime(astroTwilightEnd) : null,
    solarNoon: formatTime(solarNoon + tzOffset)
  };
}

/**
 * Chile timezone offset. Chile uses:
 * - CLST (summer time, -3) from first Saturday of September to first Saturday of April
 * - CLT (winter time, -4) from first Saturday of April to first Saturday of September
 */
function getChileTimezoneOffset(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // Find first Saturday of April
  const apr1 = new Date(year, 3, 1);
  const firstSatApril = new Date(year, 3, 1 + (6 - apr1.getDay() + 7) % 7);

  // Find first Saturday of September
  const sep1 = new Date(year, 8, 1);
  const firstSatSep = new Date(year, 8, 1 + (6 - sep1.getDay() + 7) % 7);

  // Between first Sat of April and first Sat of September = winter = CLT = -4
  if (date >= firstSatApril && date < firstSatSep) {
    return -4;
  }
  return -3; // summer = CLST
}

/**
 * Get visible planets for a given month in 2026.
 * This is a lookup table based on 2026 ephemeris data.
 * Each entry has: name, visibility (evening/morning/all night), constellation
 */
const VISIBLE_PLANETS_2026 = {
  1: [
    { name: 'Venus', visibility: 'evening', constellation: 'Aquarius', magnitude: -3.9 },
    { name: 'Mars', visibility: 'all night', constellation: 'Cancer', magnitude: -0.8 },
    { name: 'Jupiter', visibility: 'evening', constellation: 'Taurus', magnitude: -2.3 },
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.8 }
  ],
  2: [
    { name: 'Venus', visibility: 'evening', constellation: 'Pisces', magnitude: -4.0 },
    { name: 'Mars', visibility: 'evening', constellation: 'Leo', magnitude: 0.2 },
    { name: 'Jupiter', visibility: 'evening', constellation: 'Taurus', magnitude: -2.1 },
    { name: 'Saturn', visibility: 'not visible', constellation: 'Pisces', magnitude: 0.8 }
  ],
  3: [
    { name: 'Venus', visibility: 'evening', constellation: 'Aries', magnitude: -4.2 },
    { name: 'Mars', visibility: 'evening', constellation: 'Leo', magnitude: 0.8 },
    { name: 'Jupiter', visibility: 'evening', constellation: 'Gemini', magnitude: -2.0 }
  ],
  4: [
    { name: 'Venus', visibility: 'evening', constellation: 'Taurus', magnitude: -4.3 },
    { name: 'Jupiter', visibility: 'not visible', constellation: 'Gemini', magnitude: -1.8 },
    { name: 'Mars', visibility: 'evening', constellation: 'Virgo', magnitude: 1.2 }
  ],
  5: [
    { name: 'Venus', visibility: 'evening', constellation: 'Gemini', magnitude: -4.1 },
    { name: 'Saturn', visibility: 'morning', constellation: 'Pisces', magnitude: 0.7 },
    { name: 'Mars', visibility: 'evening', constellation: 'Virgo', magnitude: 1.5 }
  ],
  6: [
    { name: 'Venus', visibility: 'not visible', constellation: 'Gemini', magnitude: -3.5 },
    { name: 'Saturn', visibility: 'morning', constellation: 'Pisces', magnitude: 0.6 },
    { name: 'Jupiter', visibility: 'morning', constellation: 'Cancer', magnitude: -1.8 }
  ],
  7: [
    { name: 'Venus', visibility: 'morning', constellation: 'Taurus', magnitude: -4.2 },
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.5 },
    { name: 'Jupiter', visibility: 'morning', constellation: 'Cancer', magnitude: -2.0 }
  ],
  8: [
    { name: 'Venus', visibility: 'morning', constellation: 'Gemini', magnitude: -4.0 },
    { name: 'Saturn', visibility: 'all night', constellation: 'Pisces', magnitude: 0.3 },
    { name: 'Jupiter', visibility: 'morning', constellation: 'Leo', magnitude: -2.1 }
  ],
  9: [
    { name: 'Venus', visibility: 'morning', constellation: 'Cancer', magnitude: -3.9 },
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.4 },
    { name: 'Jupiter', visibility: 'morning', constellation: 'Leo', magnitude: -2.2 },
    { name: 'Mars', visibility: 'morning', constellation: 'Sagittarius', magnitude: 1.7 }
  ],
  10: [
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.5 },
    { name: 'Jupiter', visibility: 'evening', constellation: 'Virgo', magnitude: -2.4 },
    { name: 'Mars', visibility: 'morning', constellation: 'Capricornus', magnitude: 1.5 }
  ],
  11: [
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.7 },
    { name: 'Jupiter', visibility: 'evening', constellation: 'Virgo', magnitude: -2.5 },
    { name: 'Mars', visibility: 'evening', constellation: 'Aquarius', magnitude: 1.2 }
  ],
  12: [
    { name: 'Saturn', visibility: 'evening', constellation: 'Pisces', magnitude: 0.8 },
    { name: 'Jupiter', visibility: 'all night', constellation: 'Virgo', magnitude: -2.7 },
    { name: 'Mars', visibility: 'evening', constellation: 'Pisces', magnitude: 0.8 }
  ]
};

export function getVisiblePlanets(date) {
  const month = date.getMonth() + 1;
  const planets = VISIBLE_PLANETS_2026[month] || [];
  return planets.filter(p => p.visibility !== 'not visible');
}

/**
 * Get a complete astronomical summary for a date.
 */
export function getAstroSummary(date) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return {
    moon: getMoonPhase(d),
    sun: getSunTimes(d),
    planets: getVisiblePlanets(d),
    location: {
      name: 'San Pedro de Atacama',
      latitude: LATITUDE,
      longitude: LONGITUDE,
      altitude: 2408, // meters
      bortle: 1
    }
  };
}
