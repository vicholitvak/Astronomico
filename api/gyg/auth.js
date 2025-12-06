/**
 * GetYourGuide API Authentication & Utilities
 *
 * GYG calls our endpoints with HTTP Basic Auth
 * We validate using credentials stored in env vars
 */

export function validateGygAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.GYG_WEBHOOK_USERNAME;
  const expectedPassword = process.env.GYG_WEBHOOK_PASSWORD;

  if (username === expectedUsername && password === expectedPassword) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid credentials' };
}

export function gygErrorResponse(code, message) {
  return {
    error: {
      code,
      message
    }
  };
}

// GYG error codes
export const GYG_ERRORS = {
  AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
  NO_AVAILABILITY: 'NO_AVAILABILITY',
  INVALID_RESERVATION: 'INVALID_RESERVATION',
  VALIDATION_FAILURE: 'VALIDATION_FAILURE',
  INVALID_TICKET_CATEGORY: 'INVALID_TICKET_CATEGORY',
  INTERNAL_SYSTEM_FAILURE: 'INTERNAL_SYSTEM_FAILURE',
  INVALID_PRODUCT: 'INVALID_PRODUCT'
};

// Product configuration
export const GYG_PRODUCTS = {
  'stargazing-regular': {
    name: 'Stargazing Tour',
    maxCapacity: 16,
    tourType: 'regular',
    times: ['21:00', '00:00']
  },
  'stargazing-private': {
    name: 'Private Stargazing Tour',
    maxCapacity: 10,
    tourType: 'private',
    times: ['21:00', '00:00']
  }
};
