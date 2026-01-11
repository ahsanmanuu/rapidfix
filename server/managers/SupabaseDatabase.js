const { createClient } = require('@supabase/supabase-js');

/**
 * SupabaseDatabase - Drop-in replacement for the JSON file-based Database.js
 * Maintains the same API so all managers continue to work without changes
 */
class SupabaseDatabase {
    constructor(tableName) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
            throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
        }

        // Use service_role key for backend operations (bypasses RLS)
        this.client = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
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
                console.warn(`[Supabase] Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
                // Don't retry if it's a known non-transient error (like 409 Conflict or 400 Bad Request)
                // But for now, we'll confirm retry on connection issues. 
                // Postgres errors often don't have standard HTTP codes here.
                if (i < maxRetries - 1) await new Promise(res => setTimeout(res, delay));
            }
        }
        throw lastError;
    }

    /**
     * Read all records from the table
     * @returns {Promise<Array>} Array of records
     */
    async read() {
        return this._executeWithRetry(async () => {
            const { data, error } = await this.client
                .from(this.table)
                .select('*');

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
        // Not implementing this as it would delete all data - too dangerous
        return false;
    }

    /**
     * Add a new record
     * @param {Object} item - Record to add
     * @returns {Promise<Object>} Created record with UUID
     */
    async add(item) {
        return this._executeWithRetry(async () => {
            // Store original ID as legacy_id for migration tracking
            if (item.id) {
                item.legacy_id = item.id;
                delete item.id; // Let Supabase generate UUID
            }

            const { data, error } = await this.client
                .from(this.table)
                .insert([item])
                .select()
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
    async update(idField, idValue, updateData) {
        return this._executeWithRetry(async () => {
            // Remove id from updateData to prevent conflicts
            const { id, ...cleanUpdate } = updateData;

            const { data, error } = await this.client
                .from(this.table)
                .update(cleanUpdate)
                .eq(idField, idValue)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    return null;
                }
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
    async find(field, value) {
        // find doesn't throw usually, but let's wrap logic to catch connection errors
        try {
            return await this._executeWithRetry(async () => {
                const { data, error } = await this.client
                    .from(this.table)
                    .select('*')
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
     * @returns {Promise<Array>} Array of matching records
     */
    async findAll(field, value) {
        try {
            return await this._executeWithRetry(async () => {
                let query = this.client.from(this.table).select('*');

                if (field && value !== undefined) {
                    query = query.eq(field, value);
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
    async query(options = {}) {
        try {
            return await this._executeWithRetry(async () => {
                let query = this.client.from(this.table).select('*');

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

    /**
     * Get storage client for file operations
     * @returns {Object} Supabase Storage client
     */
    getStorageClient() {
        return this.client.storage;
    }

    /**
     * Upload a file to Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} path - File path in bucket
     * @param {Buffer|File} file - File data
     * @returns {Promise<string>} Public URL of uploaded file
     */
    async uploadFile(bucket, path, file) {
        try {
            // Retry uploads too, as they are network heavy
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

    /**
     * Delete a file from Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} path - File path in bucket
     * @returns {Promise<boolean>}
     */
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
