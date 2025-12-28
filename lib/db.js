/**
 * Database Connection Utility for Neon PostgreSQL
 * Provides connection pooling and helper functions
 */

import pg from 'pg';
const { Pool, types } = pg;

// Configure pg to return DATE fields as strings instead of Date objects
// This prevents timezone conversion issues when reading dates from PostgreSQL
// DATE type OID is 1082
types.setTypeParser(1082, (val) => val); // Return DATE as string YYYY-MM-DD

// Create connection pool (singleton pattern)
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // Connection pool configuration
      max: 10, // Maximum number of clients
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds if connection fails
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Execute a query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text);
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
export async function getClient() {
  const pool = getPool();
  const client = await pool.connect();
  return client;
}

/**
 * Execute a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
export async function transaction(callback) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper: Insert a single row
 * @param {string} table - Table name
 * @param {Object} data - Data object with column: value pairs
 * @returns {Promise<Object>} Inserted row
 */
export async function insert(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const text = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await query(text, values);
  return result.rows[0];
}

/**
 * Helper: Update a single row
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Updated row
 */
export async function update(table, data, where) {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const whereClause = whereKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');

  const text = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;

  const result = await query(text, [...dataValues, ...whereValues]);
  return result.rows[0];
}

/**
 * Helper: Select rows
 * @param {string} table - Table name
 * @param {Object} where - Where conditions (optional)
 * @param {Object} options - Query options (limit, offset, orderBy)
 * @returns {Promise<Array>} Selected rows
 */
export async function select(table, where = {}, options = {}) {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  let text = `SELECT * FROM ${table}`;

  if (whereKeys.length > 0) {
    const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    text += ` WHERE ${whereClause}`;
  }

  if (options.orderBy) {
    text += ` ORDER BY ${options.orderBy}`;
  }

  if (options.limit) {
    text += ` LIMIT ${options.limit}`;
  }

  if (options.offset) {
    text += ` OFFSET ${options.offset}`;
  }

  const result = await query(text, whereValues);
  return result.rows;
}

/**
 * Helper: Delete rows
 * @param {string} table - Table name
 * @param {Object} where - Where conditions
 * @returns {Promise<number>} Number of deleted rows
 */
export async function deleteRows(table, where) {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const text = `DELETE FROM ${table} WHERE ${whereClause}`;
  const result = await query(text, whereValues);
  return result.rowCount;
}

/**
 * Check database connection
 * @returns {Promise<boolean>} True if connected
 */
export async function checkConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Close all connections (useful for graceful shutdown)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// Export pool getter for advanced use cases
export { getPool };

// Default export for convenience
export default {
  query,
  getClient,
  transaction,
  insert,
  update,
  select,
  deleteRows,
  checkConnection,
  closePool,
  getPool
};
