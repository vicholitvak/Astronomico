/**
 * Unified Supplier API Router
 *
 * Single serverless function that routes to the appropriate supplier handler
 * based on the URL path. This consolidates GYG, Viator, and Klook into one
 * function to stay within Vercel's Hobby plan limit.
 */

import gygHandler from '../lib/gyg-handler.js';
import viatorHandler from '../lib/viator-handler.js';
import klookHandler from '../lib/klook-handler.js';

export default async function handler(req, res) {
  const path = req.url || '';

  if (path.includes('/api/klook/')) {
    return klookHandler(req, res);
  }

  if (path.includes('/api/viator/')) {
    return viatorHandler(req, res);
  }

  // Default: GYG handler (covers /api/gyg/*)
  return gygHandler(req, res);
}

// Re-export GYG functions used by other modules
export {
  syncDateAvailabilityToGYG,
  syncMultipleDatesAvailabilityToGYG,
  syncDateRangeAvailabilityToGYG,
  pushAvailabilityToGYG,
  reactivateProductOnGYG
} from '../lib/gyg-handler.js';

// Re-export Viator push notification
export { pushAvailabilityNotificationToViator } from '../lib/viator-handler.js';
