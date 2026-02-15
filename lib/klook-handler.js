/**
 * Klook OCTO Supplier API
 *
 * Implements the Open Connectivity for Tourism (OCTO) standard.
 * Klook calls our endpoints to check availability and manage bookings.
 *
 * Endpoints:
 * - GET  /api/klook/octo/supplier
 * - GET  /api/klook/octo/products
 * - GET  /api/klook/octo/products/{id}
 * - POST /api/klook/octo/availability/calendar
 * - POST /api/klook/octo/availability
 * - POST /api/klook/octo/bookings
 * - GET  /api/klook/octo/bookings/{uuid}
 * - POST /api/klook/octo/bookings/{uuid}/confirm
 * - POST /api/klook/octo/bookings/{uuid}/cancel
 */

import crypto from 'crypto';
import { insert, query } from './db.js';
import { addToGoogleCalendar, refreshCalendarAfterCancellation } from './google-calendar.js';
import { syncDateAvailabilityToGYG } from './gyg-handler.js';
import { pushAvailabilityNotificationToViator } from './viator-handler.js';

// ============ CONFIGURATION ============
const PRODUCT = {
  id: 'ads-private-stargazing',
  internalName: 'Atacama: Semi-Private Stargazing experience to Secret Spot',
  reference: 'klook-190334', // Klook Activity ID: 190334, Package ID: 634721
  locale: 'es',
  timeZone: 'America/Santiago',
  allowFreesale: false,
  instantConfirmation: true,
  instantDelivery: true,
  availabilityRequired: true,
  availabilityType: 'START_TIME',
  deliveryFormats: ['QRCODE'],
  deliveryMethods: ['VOUCHER'],
  redemptionMethod: 'DIGITAL',
  tourType: 'private',
  maxCapacity: 4,
  currency: 'EUR',
  defaultCurrency: 'EUR',
  availableCurrencies: ['EUR'],
  pricingPer: 'UNIT',
  pricePerPerson: 16000, // EUR 160.00 in cents
  cutoffMinutes: 240,    // 4 hours before tour
  availableTimes: ['20:00', '20:30', '21:00'],
  options: [
    {
      id: 'DEFAULT',
      default: true,
      internalName: 'Semi-private',
      reference: 'klook-634721', // Klook Package ID
      availabilityLocalStartTimes: ['20:00', '20:30', '21:00'],
      cancellationCutoff: 'P1D',
      cancellationCutoffAmount: 1,
      cancellationCutoffUnit: 'day',
      requiredContactFields: ['fullName', 'emailAddress', 'phoneNumber'],
      restrictions: {
        minUnits: 1,
        maxUnits: 4
      },
      units: [
        {
          id: 'adult',
          internalName: 'Adult',
          reference: null,
          type: 'ADULT',
          requiredContactFields: [],
          restrictions: {
            minAge: 0,
            maxAge: 99,
            idRequired: false,
            minQuantity: 1,
            maxQuantity: 4,
            paxCount: 1,
            accompaniedBy: []
          },
          pricingFrom: [
            {
              original: 16000,
              retail: 16000,
              net: 16000,
              currency: 'EUR',
              currencyPrecision: 2,
              includedTaxes: []
            }
          ]
        }
      ]
    }
  ]
};

// EUR to CLP exchange rate
const EUR_TO_CLP = 1072;

// ============ CHILE TIMEZONE HELPER ============
function getChileTimezoneOffset(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const firstSundayApril = new Date(year, 3, 1);
  while (firstSundayApril.getDay() !== 0) {
    firstSundayApril.setDate(firstSundayApril.getDate() + 1);
  }

  const firstSundaySept = new Date(year, 8, 1);
  while (firstSundaySept.getDay() !== 0) {
    firstSundaySept.setDate(firstSundaySept.getDate() + 1);
  }

  const isWinterTime = (
    (month > 3 || (month === 3 && day >= firstSundayApril.getDate())) &&
    (month < 8 || (month === 8 && day < firstSundaySept.getDate()))
  );

  return isWinterTime ? '-04:00' : '-03:00';
}

// ============ AUTHENTICATION ============
function validateAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.split(' ')[1];
  const expectedToken = process.env.KLOOK_API_KEY;

  if (!expectedToken) {
    return { valid: false, error: 'KLOOK_API_KEY not configured' };
  }

  if (token === expectedToken) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid bearer token' };
}

// ============ HELPERS ============
function buildUnitPricing(unitId, quantity) {
  return {
    unitId,
    quantity,
    pricing: {
      original: PRODUCT.pricePerPerson * quantity,
      retail: PRODUCT.pricePerPerson * quantity,
      net: PRODUCT.pricePerPerson * quantity,
      currency: PRODUCT.currency,
      currencyPrecision: 2,
      includedTaxes: []
    }
  };
}

function buildPricing(persons) {
  return {
    original: PRODUCT.pricePerPerson * persons,
    retail: PRODUCT.pricePerPerson * persons,
    net: PRODUCT.pricePerPerson * persons,
    currency: PRODUCT.currency,
    currencyPrecision: 2,
    includedTaxes: []
  };
}

function octoStatusFromDbStatus(dbStatus) {
  switch (dbStatus) {
    case 'pending': return 'ON_HOLD';
    case 'confirmed': return 'CONFIRMED';
    case 'cancelled': return 'CANCELLED';
    case 'expired': return 'EXPIRED';
    default: return 'ON_HOLD';
  }
}

function buildBookingResponse(booking, octoUuid, persons, unitItems) {
  const dateStr = typeof booking.date === 'string' && booking.date.includes('T')
    ? booking.date.split('T')[0]
    : String(booking.date);
  const tzOffset = getChileTimezoneOffset(dateStr);
  const availabilityId = `${dateStr}T${booking.time}:00${tzOffset}`;

  return {
    id: octoUuid,
    uuid: octoUuid,
    testMode: false,
    resellerReference: booking.viator_reference || null,
    supplierReference: booking.booking_id,
    status: octoStatusFromDbStatus(booking.status),
    utcCreatedAt: booking.created_at ? new Date(booking.created_at).toISOString() : new Date().toISOString(),
    utcUpdatedAt: booking.updated_at ? new Date(booking.updated_at).toISOString() : new Date().toISOString(),
    utcExpiresAt: booking.status === 'pending'
      ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
      : null,
    utcRedeemedAt: null,
    utcConfirmedAt: booking.status === 'confirmed'
      ? (booking.updated_at ? new Date(booking.updated_at).toISOString() : new Date().toISOString())
      : null,
    productId: PRODUCT.id,
    product: {
      id: PRODUCT.id,
      internalName: PRODUCT.internalName
    },
    optionId: 'DEFAULT',
    option: {
      id: 'DEFAULT',
      internalName: PRODUCT.options[0].internalName
    },
    cancellable: booking.status !== 'cancelled',
    cancellation: booking.status === 'cancelled'
      ? { refund: 'FULL', reason: booking.cancellation_reason || 'Cancelled', utcCancelledAt: new Date().toISOString() }
      : null,
    freesale: false,
    availabilityId: availabilityId,
    availability: {
      id: availabilityId,
      localDateTimeStart: `${dateStr}T${booking.time}:00`,
      localDateTimeEnd: `${dateStr}T23:30:00`,
      allDay: false,
      openingHours: []
    },
    contact: {
      fullName: booking.name || null,
      firstName: null,
      lastName: null,
      emailAddress: booking.email || null,
      phoneNumber: booking.phone || null,
      locales: ['es'],
      country: null
    },
    notes: booking.message || null,
    deliveryMethods: ['VOUCHER'],
    voucher: booking.status === 'confirmed'
      ? { redemptionMethod: 'DIGITAL', utcRedeemedAt: null, deliveryOptions: [] }
      : null,
    unitItems: (unitItems || []).map((item, i) => ({
      uuid: item.uuid || crypto.randomUUID(),
      unitId: 'adult',
      unit: PRODUCT.options[0].units[0],
      status: octoStatusFromDbStatus(booking.status),
      utcRedeemedAt: null,
      contact: {},
      ticket: booking.status === 'confirmed'
        ? { deliveryOptions: [], redemptionMethod: 'DIGITAL' }
        : null,
      pricing: {
        original: PRODUCT.pricePerPerson,
        retail: PRODUCT.pricePerPerson,
        net: PRODUCT.pricePerPerson,
        currency: PRODUCT.currency,
        currencyPrecision: 2,
        includedTaxes: []
      }
    })),
    pricing: buildPricing(persons)
  };
}

async function getAvailabilityForDate(dateStr) {
  // Check blocked dates
  const blockedResult = await query(
    `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
    [dateStr]
  );

  if (blockedResult.rows.length > 0) {
    const blockInfo = blockedResult.rows[0];
    if (blockInfo.block_type === 'full' || blockInfo.block_type === 'private_only') {
      // private_only blocks private tours too (it means only private allowed, but in context of this product it's the private tour itself)
      // Actually: 'private_only' means only private tours are allowed (regular blocked). So private IS allowed.
      if (blockInfo.block_type === 'full') {
        return 0;
      }
      // 'private_only' — private tours are still allowed, continue
    }
  }

  // Count existing bookings
  const bookingsResult = await query(
    `SELECT COALESCE(SUM(persons), 0) as total_persons
     FROM bookings
     WHERE date = $1 AND tour_type = 'private'
     AND status NOT IN ('cancelled', 'rejected')`,
    [dateStr]
  );
  const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
  return Math.max(0, PRODUCT.maxCapacity - bookedPersons);
}

// ============ MAIN HANDLER ============
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/klook/octo', '').replace(/\/$/, '') || '/';

  // Validate auth for all endpoints
  const auth = validateAuth(req);
  if (!auth.valid) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      errorMessage: auth.error
    });
  }

  console.log(`[KLOOK] ${req.method} ${path}`);
  console.log(`[KLOOK] Body:`, JSON.stringify(req.body));

  try {
    // Route based on path and method
    if (path === '/supplier' && req.method === 'GET') {
      return handleGetSupplier(req, res);
    }

    if (path === '/products' && req.method === 'GET') {
      return handleGetProducts(req, res);
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (productMatch && req.method === 'GET') {
      return handleGetProduct(req, res, productMatch[1]);
    }

    if (path === '/availability/calendar' && req.method === 'POST') {
      return handleAvailabilityCalendar(req, res);
    }

    if (path === '/availability' && req.method === 'POST') {
      return handleAvailability(req, res);
    }

    if (path === '/bookings' && req.method === 'POST') {
      return handleCreateBooking(req, res);
    }

    const bookingConfirmMatch = path.match(/^\/bookings\/([^/]+)\/confirm$/);
    if (bookingConfirmMatch && req.method === 'POST') {
      return handleConfirmBooking(req, res, bookingConfirmMatch[1]);
    }

    const bookingCancelMatch = path.match(/^\/bookings\/([^/]+)\/cancel$/);
    if (bookingCancelMatch && req.method === 'POST') {
      return handleCancelBooking(req, res, bookingCancelMatch[1]);
    }

    const bookingGetMatch = path.match(/^\/bookings\/([^/]+)$/);
    if (bookingGetMatch && req.method === 'GET') {
      return handleGetBooking(req, res, bookingGetMatch[1]);
    }

    return res.status(404).json({
      error: 'NOT_FOUND',
      errorMessage: `Endpoint not found: ${req.method} ${path}`
    });

  } catch (error) {
    console.error('[KLOOK] API error:', error);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      errorMessage: error.message
    });
  }
}

// ============ GET /supplier ============
function handleGetSupplier(req, res) {
  return res.status(200).json({
    id: 'atacama-darksky',
    name: 'Atacama Dark Sky',
    endpoint: 'https://atacamadarksky.cl/api/klook/octo',
    contact: {
      website: 'https://atacamadarksky.cl',
      email: 'contact@atacamadarksky.cl',
      telephone: null,
      address: 'San Pedro de Atacama, Chile'
    }
  });
}

// ============ GET /products ============
function handleGetProducts(req, res) {
  return res.status(200).json([buildProductResponse()]);
}

// ============ GET /products/{id} ============
function handleGetProduct(req, res, productId) {
  if (productId !== PRODUCT.id) {
    return res.status(404).json({
      error: 'INVALID_PRODUCT_ID',
      errorMessage: `Product ${productId} not found`
    });
  }
  return res.status(200).json(buildProductResponse());
}

function buildProductResponse() {
  return {
    id: PRODUCT.id,
    internalName: PRODUCT.internalName,
    reference: PRODUCT.reference,
    locale: PRODUCT.locale,
    timeZone: PRODUCT.timeZone,
    allowFreesale: PRODUCT.allowFreesale,
    instantConfirmation: PRODUCT.instantConfirmation,
    instantDelivery: PRODUCT.instantDelivery,
    availabilityRequired: PRODUCT.availabilityRequired,
    availabilityType: PRODUCT.availabilityType,
    deliveryFormats: PRODUCT.deliveryFormats,
    deliveryMethods: PRODUCT.deliveryMethods,
    redemptionMethod: PRODUCT.redemptionMethod,
    options: PRODUCT.options
  };
}

// ============ POST /availability/calendar ============
async function handleAvailabilityCalendar(req, res) {
  const { productId, optionId, localDateStart, localDateEnd } = req.body;

  if (productId !== PRODUCT.id) {
    return res.status(400).json({
      error: 'INVALID_PRODUCT_ID',
      errorMessage: `Product ${productId} not found`
    });
  }

  if (!localDateStart || !localDateEnd) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      errorMessage: 'Missing localDateStart or localDateEnd'
    });
  }

  const results = [];
  let currentDate = new Date(localDateStart + 'T12:00:00');
  const endDate = new Date(localDateEnd + 'T12:00:00');

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const vacancies = await getAvailabilityForDate(dateStr);

    results.push({
      localDate: dateStr,
      status: vacancies > 0 ? 'AVAILABLE' : 'SOLD_OUT',
      vacancies: vacancies,
      capacity: PRODUCT.maxCapacity,
      openingHours: []
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(200).json(results);
}

// ============ POST /availability ============
async function handleAvailability(req, res) {
  const { productId, optionId, localDateStart, localDateEnd } = req.body;

  if (productId !== PRODUCT.id) {
    return res.status(400).json({
      error: 'INVALID_PRODUCT_ID',
      errorMessage: `Product ${productId} not found`
    });
  }

  if (!localDateStart || !localDateEnd) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      errorMessage: 'Missing localDateStart or localDateEnd'
    });
  }

  const results = [];
  let currentDate = new Date(localDateStart + 'T12:00:00');
  const endDate = new Date(localDateEnd + 'T12:00:00');

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const vacancies = await getAvailabilityForDate(dateStr);
    const tzOffset = getChileTimezoneOffset(dateStr);

    // Return a timeslot for each available time
    for (const time of PRODUCT.availableTimes) {
      const availabilityId = `${dateStr}T${time}:00${tzOffset}`;

      // Check cutoff: if this timeslot is within cutoff minutes from now, mark sold out
      const slotDateTime = new Date(`${dateStr}T${time}:00${tzOffset}`);
      const cutoffTime = new Date(slotDateTime.getTime() - PRODUCT.cutoffMinutes * 60 * 1000);
      const isPastCutoff = new Date() > cutoffTime;

      results.push({
        id: availabilityId,
        localDateTimeStart: `${dateStr}T${time}:00`,
        localDateTimeEnd: `${dateStr}T23:30:00`,
        allDay: false,
        available: !isPastCutoff && vacancies > 0,
        status: (!isPastCutoff && vacancies > 0) ? 'AVAILABLE' : 'SOLD_OUT',
        vacancies: isPastCutoff ? 0 : vacancies,
        capacity: PRODUCT.maxCapacity,
        maxUnits: isPastCutoff ? 0 : vacancies,
        utcCutoffAt: cutoffTime.toISOString(),
        openingHours: [],
        pricing: {
          unitPricing: [buildUnitPricing('adult', 1)]
        }
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(200).json(results);
}

// ============ POST /bookings ============
async function handleCreateBooking(req, res) {
  const { productId, optionId, availabilityId, unitItems, notes } = req.body;

  if (productId !== PRODUCT.id) {
    return res.status(400).json({
      error: 'INVALID_PRODUCT_ID',
      errorMessage: `Product ${productId} not found`
    });
  }

  if (!availabilityId) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      errorMessage: 'Missing availabilityId'
    });
  }

  if (!unitItems || !Array.isArray(unitItems) || unitItems.length === 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      errorMessage: 'Missing or empty unitItems'
    });
  }

  const persons = unitItems.length;

  if (persons > PRODUCT.maxCapacity) {
    return res.status(400).json({
      error: 'INVALID_UNIT_COUNT',
      errorMessage: `Maximum ${PRODUCT.maxCapacity} units allowed, got ${persons}`
    });
  }

  // Parse availabilityId to extract date and time
  // Format: 2026-03-15T21:00:00-03:00
  const dateMatch = availabilityId.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!dateMatch) {
    return res.status(400).json({
      error: 'INVALID_AVAILABILITY_ID',
      errorMessage: 'Could not parse availabilityId'
    });
  }

  const date = dateMatch[1];
  const time = dateMatch[2];

  // Check availability
  const vacancies = await getAvailabilityForDate(date);
  if (persons > vacancies) {
    return res.status(400).json({
      error: 'NO_AVAILABILITY',
      errorMessage: `Only ${vacancies} spots available, requested ${persons}`
    });
  }

  // Check cutoff
  const tzOffset = getChileTimezoneOffset(date);
  const slotDateTime = new Date(`${date}T${time}:00${tzOffset}`);
  const cutoffTime = new Date(slotDateTime.getTime() - PRODUCT.cutoffMinutes * 60 * 1000);
  if (new Date() > cutoffTime) {
    return res.status(400).json({
      error: 'NO_AVAILABILITY',
      errorMessage: 'Booking cutoff has passed for this timeslot'
    });
  }

  // Generate OCTO UUID and booking ID
  const octoUuid = crypto.randomUUID();
  const bookingId = `KLK-${octoUuid}`;

  // Assign UUIDs to each unit item
  const unitItemsWithUuids = unitItems.map(item => ({
    ...item,
    uuid: item.uuid || crypto.randomUUID()
  }));

  // Calculate payment in CLP
  const paymentAmountCLP = Math.round((PRODUCT.pricePerPerson / 100) * persons * EUR_TO_CLP);

  // Insert into DB
  const booking = await insert('bookings', {
    booking_id: bookingId,
    date,
    time,
    name: 'Klook Reservation (Pending)',
    email: 'pending@klook.com',
    phone: '',
    persons,
    tour_type: PRODUCT.tourType,
    status: 'pending',
    source: 'klook',
    payment_method: 'klook',
    payment_status: 'pending',
    payment_amount: paymentAmountCLP,
    message: `OCTO UUID: ${octoUuid} | Units: ${persons} | Option: ${optionId || 'DEFAULT'}${notes ? ` | Notes: ${notes}` : ''}`,
    created_at: new Date().toISOString()
  });

  console.log(`[KLOOK] Booking created: ${bookingId} (OCTO: ${octoUuid}) | ${date} ${time} | ${persons} pax`);

  return res.status(200).json(buildBookingResponse(booking, octoUuid, persons, unitItemsWithUuids));
}

// ============ GET /bookings/{uuid} ============
async function handleGetBooking(req, res, uuid) {
  const bookingId = `KLK-${uuid}`;
  const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'BOOKING_NOT_FOUND',
      errorMessage: `Booking ${uuid} not found`
    });
  }

  const booking = result.rows[0];
  const persons = booking.persons;

  // Rebuild unit items from persons count
  const unitItems = Array.from({ length: persons }, () => ({ uuid: crypto.randomUUID(), unitId: 'adult' }));

  return res.status(200).json(buildBookingResponse(booking, uuid, persons, unitItems));
}

// ============ POST /bookings/{uuid}/confirm ============
async function handleConfirmBooking(req, res, uuid) {
  const bookingId = `KLK-${uuid}`;
  const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'BOOKING_NOT_FOUND',
      errorMessage: `Booking ${uuid} not found`
    });
  }

  const booking = result.rows[0];

  if (booking.status === 'cancelled') {
    return res.status(400).json({
      error: 'BOOKING_ALREADY_CANCELLED',
      errorMessage: 'Cannot confirm a cancelled booking'
    });
  }

  if (booking.status === 'confirmed') {
    // Idempotent — return current state
    const persons = booking.persons;
    const unitItems = Array.from({ length: persons }, () => ({ uuid: crypto.randomUUID(), unitId: 'adult' }));
    return res.status(200).json(buildBookingResponse(booking, uuid, persons, unitItems));
  }

  // Extract contact and reseller reference from request body
  const { contact, resellerReference, notes } = req.body;
  const fullName = contact?.fullName || contact?.firstName || booking.name;
  const email = contact?.emailAddress || contact?.email || booking.email;
  const phone = contact?.phoneNumber || contact?.phone || booking.phone;

  const dateStr = typeof booking.date === 'string' && booking.date.includes('T')
    ? booking.date.split('T')[0]
    : String(booking.date);

  // Update booking to confirmed
  await query(
    `UPDATE bookings SET
      status = 'confirmed',
      payment_status = 'paid',
      name = $2,
      email = $3,
      phone = $4,
      viator_reference = $5,
      message = COALESCE(message, '') || $6,
      updated_at = NOW()
    WHERE booking_id = $1`,
    [
      bookingId,
      fullName,
      email,
      phone,
      resellerReference || null,
      notes ? `\nNotes: ${notes}` : ''
    ]
  );

  console.log(`[KLOOK] Booking confirmed: ${bookingId} | ${fullName} | ${email}`);

  // Re-fetch updated booking
  const updatedResult = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);
  const updatedBooking = updatedResult.rows[0];
  const persons = updatedBooking.persons;

  // Side effects (non-blocking)

  // 1. Google Calendar sync
  addToGoogleCalendar({
    bookingId: bookingId,
    date: dateStr,
    time: updatedBooking.time,
    persons: persons,
    tourType: PRODUCT.tourType,
    name: fullName,
    email: email,
    phone: phone,
    message: `Klook Booking${resellerReference ? ` | Ref: ${resellerReference}` : ''}`
  }).catch(err => console.error('[KLOOK] Calendar sync failed:', err.message));

  // 2. Admin notification email
  sendKlookAdminNotificationEmail({
    bookingId,
    klookReference: resellerReference,
    date: dateStr,
    time: updatedBooking.time,
    persons,
    name: fullName,
    email,
    phone,
    paymentAmount: updatedBooking.payment_amount
  }).catch(err => console.error('[KLOOK] Admin email failed:', err.message));

  // 3. Sync availability to GYG
  syncDateAvailabilityToGYG(dateStr).catch(err => {
    console.error('[KLOOK] GYG availability sync failed:', err.message);
  });

  // 4. Notify Viator of availability change
  pushAvailabilityNotificationToViator(dateStr).catch(err => {
    console.error('[KLOOK] Viator push failed:', err.message);
  });

  const unitItems = Array.from({ length: persons }, () => ({ uuid: crypto.randomUUID(), unitId: 'adult' }));
  return res.status(200).json(buildBookingResponse(updatedBooking, uuid, persons, unitItems));
}

// ============ POST /bookings/{uuid}/cancel ============
async function handleCancelBooking(req, res, uuid) {
  const bookingId = `KLK-${uuid}`;
  const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'BOOKING_NOT_FOUND',
      errorMessage: `Booking ${uuid} not found`
    });
  }

  const booking = result.rows[0];

  if (booking.status === 'cancelled') {
    // Idempotent
    const persons = booking.persons;
    const unitItems = Array.from({ length: persons }, () => ({ uuid: crypto.randomUUID(), unitId: 'adult' }));
    return res.status(200).json(buildBookingResponse(booking, uuid, persons, unitItems));
  }

  const { reason } = req.body;

  const dateStr = typeof booking.date === 'string' && booking.date.includes('T')
    ? booking.date.split('T')[0]
    : String(booking.date);

  await query(
    `UPDATE bookings SET
      status = 'cancelled',
      cancellation_reason = $2,
      updated_at = NOW()
    WHERE booking_id = $1`,
    [bookingId, reason || 'Cancelled via Klook OCTO API']
  );

  console.log(`[KLOOK] Booking cancelled: ${bookingId}`);

  // Side effects (non-blocking)

  // 1. Refresh Google Calendar
  refreshCalendarAfterCancellation(dateStr, PRODUCT.tourType).catch(err => {
    console.error('[KLOOK] Calendar refresh failed:', err.message);
  });

  // 2. Sync availability to GYG
  syncDateAvailabilityToGYG(dateStr).catch(err => {
    console.error('[KLOOK] GYG availability sync failed:', err.message);
  });

  // 3. Notify Viator of availability change
  pushAvailabilityNotificationToViator(dateStr).catch(err => {
    console.error('[KLOOK] Viator push failed on cancel:', err.message);
  });

  // 4. Admin cancellation email
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (resendApiKey) {
    try {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
          to: [adminEmail],
          subject: `Reserva Cancelada Klook: ${booking.name} - ${formattedDate}`,
          html: `
            <h2>Reserva Cancelada via Klook</h2>
            <p><strong>ID:</strong> ${bookingId}</p>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Hora:</strong> ${booking.time}</p>
            <p><strong>Tour:</strong> Tour Privado Exclusivo</p>
            <p><strong>Personas:</strong> ${booking.persons}</p>
            <p><strong>Cliente:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Motivo:</strong> ${reason || 'No especificado'}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">La disponibilidad ha sido actualizada automaticamente.</p>
          `
        })
      });
    } catch (e) {
      console.error('[KLOOK] Cancellation email failed:', e.message);
    }
  }

  // Re-fetch updated booking
  const updatedResult = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);
  const updatedBooking = updatedResult.rows[0];
  const persons = updatedBooking.persons;
  const unitItems = Array.from({ length: persons }, () => ({ uuid: crypto.randomUUID(), unitId: 'adult' }));

  return res.status(200).json(buildBookingResponse(updatedBooking, uuid, persons, unitItems));
}

// ============ ADMIN EMAIL HELPER ============
async function sendKlookAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (!resendApiKey) {
    console.log('[KLOOK] Skipping email notification - RESEND_API_KEY not configured');
    return;
  }

  const dateObj = new Date(booking.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const paymentCLP = booking.paymentAmount ? `$${booking.paymentAmount.toLocaleString('es-CL')} CLP` : 'Pagado via Klook';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
      to: [adminEmail],
      subject: `Nueva Reserva Klook: ${booking.name} - ${formattedDate}`,
      html: `
        <h2>Nueva Reserva via Klook</h2>
        <p><strong>ID:</strong> ${booking.bookingId}</p>
        <p><strong>Referencia Klook:</strong> ${booking.klookReference || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${formattedDate}</p>
        <p><strong>Hora:</strong> ${booking.time}</p>
        <p><strong>Tour:</strong> Tour Privado Exclusivo (Klook)</p>
        <p><strong>Personas:</strong> ${booking.persons}</p>
        <p><strong>Cliente:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Telefono:</strong> ${booking.phone || 'No proporcionado'}</p>
        <p><strong>Pago:</strong> ${paymentCLP}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Esta reserva fue procesada automaticamente desde Klook via OCTO.</p>
      `,
      reply_to: booking.email
    })
  });

  console.log(`[KLOOK] Admin notification email sent for booking ${booking.bookingId}`);
}
