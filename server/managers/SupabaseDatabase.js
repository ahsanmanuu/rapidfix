const { createClient } = require('@supabase/supabase-js');

/**
 * SupabaseDatabase - Drop-in replacement for the JSON file-based Database.js
 * Maintains the same API so all managers continue to work without changes
 */
class SupabaseDatabase {
    constructor(tableName) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
            console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
            // Fallback for dev if needed, or throw error
        }

        // Use service_role key for backend operations (bypasses RLS)
        this.client = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_KEY || ''
        );

        this.table = tableName;
    }

    /**
     * Helper to execute operations with retry logic
     * @param {Function} operation - Async function to execute
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Delay between retries in ms
     */
    async _executeWithRetry(operation, maxRetries = 3, delay = 500) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // [FIX] Suppress noisy Foreign Key errors (e.g. tracking for deleted users)
                if (error.code === '23503') {
                    throw error;
                }

                console.warn(`[Supabase] Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
                if (i < maxRetries - 1) await new Promise(res => setTimeout(res, delay));
            }
        }
        throw lastError;
    }

    _cleanColumns(columns) {
        if (!columns || columns === '*') {
            if (this.table === 'jobs') {
                return 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, payment_status, payment_method';
            }
            return columns || '*';
        }

        if (this.table === 'jobs') {
            const problematic = ['timeline', 'professional_note'];
            let cleaned = columns.split(',').map(c => c.trim());
            cleaned = cleaned.filter(c => !problematic.includes(c));
            return cleaned.join(', ');
        }
        return columns;
    }

    /**
     * Read all records from the table
     * @returns {Promise<Array>} Array of records
     */
    async read(columns = null) {
        if (!this.client) return [];
        return this._executeWithRetry(async () => {
            const finalColumns = this._cleanColumns(columns);
            const { data, error } = await this.client
                .from(this.table)
                .select(finalColumns);

            if (error) throw error;
            return data || [];
        });
    }

    /**
     * Write/replace all records in the table (NOT RECOMMENDED in production)
     * This method exists for compatibility but should not be used
     * @param {Array} data - Array of records
     * @returns {Promise<boolean>}
     */
    async write(data) {
        console.warn(`[WARNING] write() method called on ${this.table}. This is not recommended with Supabase.`);
        return false;
    }

    /**
     * Add a new record
     * @param {Object} item - Record to add
     * @returns {Promise<Object>} Created record with UUID
     */
    async add(item, columns = null) {
        return this._executeWithRetry(async () => {
            // Store original ID as legacy_id for migration tracking if present
            const cleanItem = { ...item };

            // [NUCLEAR FILTER] Strip problematic columns missing from Supabase schema cache
            if (this.table === 'jobs') {
                // Now that schema is updated, we can allow these.
                const problematic = ['timeline', 'professional_note'];
                problematic.forEach(key => {
                    if (cleanItem[key] !== undefined) {
                        console.log(`[Supabase:jobs] Nuclear filter: Stripping '${key}' from insert payload`);
                        delete cleanItem[key];
                    }
                });
            }

            if (cleanItem.id && cleanItem.id.length < 10) { // Simple check for non-UUID legacy IDs
                cleanItem.legacy_id = cleanItem.id;
                delete cleanItem.id;
            }

            const finalColumns = this._cleanColumns(columns);

            console.log(`[Supabase:${this.table}] Inserting item with keys:`, Object.keys(cleanItem));
            const { data, error } = await this.client
                .from(this.table)
                .insert([cleanItem])
                .select(finalColumns)
                .single();

            if (error) throw error;
            return data;
        });
    }

    /**
     * Update a record
     * @param {string} idField - Field name to match (e.g., 'id', 'email')
     * @param {any} idValue - Value to match
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object|null>} Updated record or null
     */
    async update(idField, idValue, updateData, columns = null) {
        return this._executeWithRetry(async () => {
            const { id, ...cleanUpdate } = updateData;

            // [NUCLEAR FILTER] Strip problematic columns missing from Supabase schema cache
            if (this.table === 'jobs') {
                // Now that schema is updated, we can allow these.
                // Keeping 'timeline' and 'professional_note' in filter just in case, but allowing others.
                const problematic = ['timeline', 'professional_note'];
                problematic.forEach(key => {
                    if (cleanUpdate[key] !== undefined) {
                        console.log(`[Supabase:jobs] Nuclear filter: Stripping '${key}' from update payload`);
                        delete cleanUpdate[key];
                    }
                });
            }

            const finalColumns = this._cleanColumns(columns);

            const { data, error } = await this.client
                .from(this.table)
                .update(cleanUpdate)
                .eq(idField, idValue)
                .select(finalColumns)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No rows found
                throw error;
            }

            return data;
        });
    }

    /**
     * Delete a record
     * @param {string} idField - Field name to match
     * @param {any} idValue - Value to match
     * @returns {Promise<boolean>} True if deleted, false otherwise
     */
    async delete(idField, idValue) {
        try {
            return await this._executeWithRetry(async () => {
                const { error } = await this.client
                    .from(this.table)
                    .delete()
                    .eq(idField, idValue);

                if (error) throw error;
                return true;
            });
        } catch (error) {
            console.error(`Error deleting from ${this.table}:`, error);
            return false;
        }
    }

    /**
     * Find a single record
     * @param {string} field - Field name to match
     * @param {any} value - Value to match
     * @returns {Promise<Object|null>} Found record or null
     */
    async find(field, value, columns = null) {
        try {
            return await this._executeWithRetry(async () => {
                const finalColumns = this._cleanColumns(columns);
                const { data, error } = await this.client
                    .from(this.table)
                    .select(finalColumns)
                    .eq(field, value)
                    .maybeSingle();

                if (error) throw error;
                return data;
            });
        } catch (error) {
            console.error(`Error finding in ${this.table}:`, error);
            return null;
        }
    }

    /**
     * Find all records matching a condition
     * @param {string} field - Field name to match (optional)
     * @param {any} value - Value to match (optional)
     * @param {string} columns - Columns to select
     * @param {Object} orderBy - Optional { column: 'field', ascending: true/false }
     * @returns {Promise<Array>} Array of matching records
     */
    async findAll(field, value, columns = null, orderBy = null) {
        try {
            return await this._executeWithRetry(async () => {
                const finalColumns = this._cleanColumns(columns);
                let query = this.client.from(this.table).select(finalColumns);

                if (field && value !== undefined) {
                    query = query.eq(field, value);
                }

                // Apply ordering if specified
                if (orderBy && orderBy.column) {
                    query = query.order(orderBy.column, { ascending: orderBy.ascending !== false ? true : false });
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            });
        } catch (error) {
            console.error(`Error finding all in ${this.table}:`, error);
            return [];
        }
    }

    /**
     * Advanced query with filters, sorting, and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async query(options = {}, columns = null) {
        try {
            return await this._executeWithRetry(async () => {
                const finalColumns = this._cleanColumns(columns);
                let query = this.client.from(this.table).select(finalColumns);

                // Geospatial Filter (Basic Box Approximation if needed, or PostGIS if available)
                // For now, let's assume we fetch all and filter in memory if complex, 
                // OR use Supabase's `rpc` if we set up PostGIS functions.
                // Here we just handle standard filters.

                if (options.filters) {
                    Object.entries(options.filters).forEach(([key, val]) => {
                        query = query.eq(key, val);
                    });
                }

                if (options.sort) {
                    query = query.order(options.sort.field, {
                        ascending: options.sort.order !== 'desc'
                    });
                }

                if (options.limit) {
                    query = query.limit(options.limit);
                }
                if (options.offset) {
                    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            });
        } catch (error) {
            console.error(`Error querying ${this.table}:`, error);
            return [];
        }
    }

    // Storage methods remain the same...
    getStorageClient() {
        return this.client.storage;
    }

    async uploadFile(bucket, path, file) {
        try {
            return await this._executeWithRetry(async () => {
                const { data, error } = await this.client.storage
                    .from(bucket)
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) throw error;

                const { data: urlData } = this.client.storage
                    .from(bucket)
                    .getPublicUrl(path);

                return urlData.publicUrl;
            });
        } catch (error) {
            console.error(`Error uploading file to ${bucket}:`, error);
            throw error;
        }
    }

    async deleteFile(bucket, path) {
        try {
            return await this._executeWithRetry(async () => {
                const { error } = await this.client.storage
                    .from(bucket)
                    .remove([path]);

                if (error) throw error;
                return true;
            });
        } catch (error) {
            console.error(`Error deleting file from ${bucket}:`, error);
            return false;
        }
    }
}

module.exports = SupabaseDatabase;
