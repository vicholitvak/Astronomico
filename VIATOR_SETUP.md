# Viator Supplier API Integration

## Overview
This integration allows Atacama Dark Sky to receive bookings from Viator, similar to the existing GetYourGuide integration.

## API Endpoints

The following endpoints are available at `/api/viator/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/viator/tour-list` | POST | Returns list of available products |
| `/api/viator/availability` | POST | Real-time availability check |
| `/api/viator/batch-availability` | POST | Bulk availability for date ranges |
| `/api/viator/booking` | POST | Create a booking |
| `/api/viator/cancel` | POST | Cancel a booking |
| `/api/viator/amend` | POST | Amend an existing booking |

### Admin Endpoints (No auth required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/viator/admin/analytics` | GET/POST | Get Viator analytics |
| `/api/viator/admin/products` | GET/POST | Get product configuration |
| `/api/viator/admin/bookings` | GET/POST | Get recent Viator bookings |

## Environment Variables

Add these to your Vercel environment:

```env
# Viator API Key (provided by Viator during onboarding)
VIATOR_WEBHOOK_API_KEY=your_viator_api_key_here

# Supplier ID in Viator system
VIATOR_SUPPLIER_ID=ATACAMA_DARKSKY
```

## Database Migration

Run this SQL in your Neon database to add the viator_reference column:

```sql
-- Add viator_reference column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS viator_reference VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_viator_reference
ON bookings(viator_reference)
WHERE viator_reference IS NOT NULL;
```

Or run the migration file:
```bash
psql $DATABASE_URL -f database/add-viator-reference.sql
```

## Products Configuration

Two products are configured by default:

### ADS-REGULAR (Stargazing Tour)
- Max capacity: 16 persons
- Price: $50 USD per person
- Net price: $35 USD (30% commission)
- Available time: 21:00
- Cutoff: 2 hours before

### ADS-PRIVATE (Private Expedition)
- Max capacity: 4 persons
- Price: $133 USD per person
- Net price: $93 USD (30% commission)
- Available times: 20:00, 20:30, 21:00
- Cutoff: 4 hours before

## Integration Steps

1. **Register with Viator**
   - Sign up at viator.com/supplier
   - Complete supplier onboarding

2. **Configure API Connection**
   - Provide your endpoint URL to Viator: `https://atacamadarksky.cl/api/viator/`
   - Exchange API keys
   - Configure products in Viator portal

3. **Testing**
   - Viator will test your API in sandbox
   - Verify availability, booking, and cancellation flows

4. **Go Live**
   - Switch from sandbox to production API key
   - Monitor first bookings

## Request/Response Format

All requests use POST with JSON body. Example availability request:

```json
{
  "ApiKey": "your_api_key",
  "ResellerId": "1000",
  "SupplierId": "ATACAMA_DARKSKY",
  "SupplierProductCode": "ADS-REGULAR",
  "StartDate": "2025-02-15",
  "TravellerMix": {
    "Adult": 2,
    "Child": 0,
    "Total": 2
  },
  "ExternalReference": "VTR-123456"
}
```

## Documentation

- [Viator Supplier API Docs](https://docs.viator.com/supplier-api/technical/)
- [Connectivity Overview](https://docs.viator.com/supplier-api/technical/connectivity-overview/)
- [API Specification](https://docs.viator.com/supplier-api/technical/sapi-manual-latest/)

## Support

For API questions: supplierapi@viator.com
