/**
 * Health Check Endpoint para n8n Monitoring
 * Updated to use Neon PostgreSQL instead of Supabase
 */

import { checkConnection, query } from './lib/db.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // 1. Verificar Neon Database
    try {
      const dbStart = Date.now();
      const isConnected = await checkConnection();

      if (isConnected) {
        // Test a simple query
        const result = await query('SELECT COUNT(*) as count FROM bookings');
        const bookingCount = result.rows[0].count;

        healthStatus.checks.database = {
          status: 'healthy',
          responseTime: Date.now() - dbStart,
          message: 'Connected successfully',
          bookings: parseInt(bookingCount),
          provider: 'Neon PostgreSQL'
        };
      } else {
        throw new Error('Connection check failed');
      }
    } catch (error) {
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: error.message,
        provider: 'Neon PostgreSQL'
      };
      healthStatus.status = 'unhealthy';
    }

    // 2. Verificar Google Calendar API
    try {
      const calendarTest = Date.now();
      const hasGoogleCreds = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

      healthStatus.checks.googleCalendar = {
        status: hasGoogleCreds ? 'healthy' : 'misconfigured',
        responseTime: Date.now() - calendarTest,
        message: hasGoogleCreds ? 'Credentials present' : 'Missing credentials'
      };

      if (!hasGoogleCreds) healthStatus.status = 'degraded';
    } catch (error) {
      healthStatus.checks.googleCalendar = {
        status: 'unhealthy',
        error: error.message
      };
      healthStatus.status = 'degraded';
    }

    // 3. Verificar Resend Email API
    try {
      const resendTest = Date.now();
      const hasResendKey = !!process.env.RESEND_API_KEY;

      healthStatus.checks.resendEmail = {
        status: hasResendKey ? 'healthy' : 'misconfigured',
        responseTime: Date.now() - resendTest,
        message: hasResendKey ? 'API key present' : 'Missing API key'
      };

      if (!hasResendKey) healthStatus.status = 'degraded';
    } catch (error) {
      healthStatus.checks.resendEmail = {
        status: 'unhealthy',
        error: error.message
      };
      healthStatus.status = 'degraded';
    }

    // 4. Verificar conectividad externa (NASA API como test)
    try {
      const externalTest = Date.now();
      const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      healthStatus.checks.externalAPIs = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - externalTest,
        statusCode: response.status
      };

      if (!response.ok) healthStatus.status = 'degraded';
    } catch (error) {
      healthStatus.checks.externalAPIs = {
        status: 'unhealthy',
        error: error.message
      };
      healthStatus.status = 'degraded';
    }

    // Agregar métricas generales
    healthStatus.totalResponseTime = Date.now() - startTime;
    healthStatus.version = '1.0.0';
    healthStatus.environment = process.env.VERCEL_ENV || 'development';
    healthStatus.database = 'Neon PostgreSQL';

    // Retornar con código apropiado
    const statusCode = healthStatus.status === 'healthy' ? 200 :
                       healthStatus.status === 'degraded' ? 207 : 503;

    return res.status(statusCode).json(healthStatus);

  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      totalResponseTime: Date.now() - startTime
    });
  }
}
