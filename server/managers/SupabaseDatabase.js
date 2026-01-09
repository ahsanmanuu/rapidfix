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
     * Read all records from the table
     * @returns {Promise<Array>} Array of records
     */
    async read() {
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error reading from ${this.table}:`, error);
            return [];
        }
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
        try {
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
        } catch (error) {
            console.error(`Error adding to ${this.table}:`, error);
            throw error;
        }
    }

    /**
     * Update a record
     * @param {string} idField - Field name to match (e.g., 'id', 'email')
     * @param {any} idValue - Value to match
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object|null>} Updated record or null
     */
    async update(idField, idValue, updateData) {
        try {
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
        } catch (error) {
            console.error(`Error updating ${this.table}:`, error);
            return null;
        }
    }

    /**
     * Delete a record
     * @param {string} idField - Field name to match
     * @param {any} idValue - Value to match
     * @returns {Promise<boolean>} True if deleted, false otherwise
     */
    async delete(idField, idValue) {
        try {
            const { error } = await this.client
                .from(this.table)
                .delete()
                .eq(idField, idValue);

            return !error;
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
        try {
            const { data, error } = await this.client
                .from(this.table)
                .select('*')
                .eq(field, value)
                .maybeSingle(); // Returns null if not found, doesn't throw

            if (error) throw error;
            return data;
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
            let query = this.client.from(this.table).select('*');

            if (field && value !== undefined) {
                query = query.eq(field, value);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
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
            let query = this.client.from(this.table).select('*');

            // Filters: { field: value, field2: value2 }
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, val]) => {
                    query = query.eq(key, val);
                });
            }

            // Sorting: { field: 'name', order: 'asc' }
            if (options.sort) {
                query = query.order(options.sort.field, {
                    ascending: options.sort.order !== 'desc'
                });
            }

            // Pagination: { limit: 10, offset: 0 }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
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
            const { data, error } = await this.client.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(bucket)
                .getPublicUrl(path);

            return urlData.publicUrl;
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
            const { error } = await this.client.storage
                .from(bucket)
                .remove([path]);

            return !error;
        } catch (error) {
            console.error(`Error deleting file from ${bucket}:`, error);
            return false;
        }
    }
}

module.exports = SupabaseDatabase;
