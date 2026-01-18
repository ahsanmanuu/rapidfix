const Database = require('./DatabaseLoader');

/**
 * Universal BaseManager for "Automation" and Standardization.
 * automatically handles:
 * - Database interactions (CRUD)
 * - Socket.io event broadcasting (Automation)
 * - Error handling
 * - Data Mapping (via abstract methods)
 */
class BaseManager {
    /**
     * @param {string} tableName - The name of the database table/collection
     */
    constructor(tableName) {
        this.tableName = tableName;
        this.db = new Database(tableName);
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    /**
     * Universal Create Method with Auto-Broadcasting
     */
    async create(data) {
        try {
            const dbData = this._mapToDb(data);

            // Auto-timestamp if not present
            if (!dbData.created_at) dbData.created_at = new Date().toISOString();
            if (!dbData.updated_at) dbData.updated_at = new Date().toISOString();

            const created = await this.db.add(dbData);
            const entity = this._mapFromDb(created);

            this.broadcast('created', entity);
            return entity;
        } catch (err) {
            console.error(`[${this.constructor.name}] Create Error:`, err);
            throw err;
        }
    }

    /**
     * Universal Update Method
     */
    async update(id, updates) {
        try {
            const dbUpdates = this._mapToDb(updates);
            dbUpdates.updated_at = new Date().toISOString();

            const updated = await this.db.update('id', id, dbUpdates);
            const entity = this._mapFromDb(updated);

            this.broadcast('updated', entity);
            return entity;
        } catch (err) {
            console.error(`[${this.constructor.name}] Update Error:`, err);
            throw err;
        }
    }

    /**
     * Universal Delete Method
     */
    async delete(id) {
        try {
            const success = await this.db.delete('id', id);
            if (success) {
                this.broadcast('deleted', { id });
            }
            return success;
        } catch (err) {
            console.error(`[${this.constructor.name}] Delete Error:`, err);
            throw err;
        }
    }

    /**
     * Find by field
     */
    async findOne(field, value) {
        try {
            // [FIX] Handle single-argument call (findOne(id))
            if (value === undefined) {
                value = field;
                field = 'id';
            }
            const record = await this.db.find(field, value);
            return this._mapFromDb(record);
        } catch (err) {
            return null;
        }
    }

    /**
     * Find All / Filter
     */
    async findAll(filter = {}) {
        try {
            // Note: Basic filter support, expandable
            const records = await this.db.getAll(); // Assuming getAll exists or similar
            // This needs adaptation based on Database.js capabilities
            return records.map(r => this._mapFromDb(r));
        } catch (err) {
            return [];
        }
    }

    /**
     * Automatic Event Broadcasting
     * Emits: {tableName}_{action} -> e.g., 'users_updated'
     */
    broadcast(action, data) {
        if (!this.io) return;

        // Universal Event Name: e.g., 'technician_created'
        const eventName = `${this.tableName.slice(0, -1)}_${action}`; // Remove plural 's' for singular event? Or keep table name.
        // Let's use singular for clearer events: users -> user_created
        const singularName = this.tableName.endsWith('s') ? this.tableName.slice(0, -1) : this.tableName;

        const finalEvent = `${singularName}_${action}`;

        console.log(`[UniversalAutomation] Emitting: ${finalEvent}`);
        this.io.emit(finalEvent, data);
    }

    // Abstract Methods - To be implemented by subclasses if needed
    // Default implementation passes data through
    _mapToDb(data) { return data || {}; }
    _mapFromDb(data) { return data || null; }
}

module.exports = BaseManager;
