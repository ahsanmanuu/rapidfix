const fs = require('fs');
const path = require('path');

class Database {
    constructor(filename) {
        this.filename = filename;
        this.filepath = path.join(__dirname, '..', 'data', filename);
        this.ensureDataDir();
    }

    ensureDataDir() {
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        if (!fs.existsSync(this.filepath)) {
            fs.writeFileSync(this.filepath, JSON.stringify([], null, 2));
        }
    }

    async read() {
        try {
            if (!fs.existsSync(this.filepath)) {
                await fs.promises.writeFile(this.filepath, JSON.stringify([], null, 2));
                return [];
            }
            const data = await fs.promises.readFile(this.filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`[Database:${this.filename}] Read Error:`, error);
            return [];
        }
    }

    async write(data) {
        try {
            await fs.promises.writeFile(this.filepath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`[Database:${this.filename}] Write Error:`, error);
            return false;
        }
    }

    async add(item) {
        try {
            const data = await this.read();
            data.push(item);
            await this.write(data);
            return item;
        } catch (err) {
            console.error(`[Database:${this.filename}] Add Error:`, err);
            throw err;
        }
    }

    async update(idField, idValue, updateData) {
        try {
            const data = await this.read();
            const index = data.findIndex(item => item[idField] == idValue);
            if (index !== -1) {
                data[index] = { ...data[index], ...updateData };
                await this.write(data);
                return data[index];
            }
            return null;
        } catch (err) {
            console.error(`[Database:${this.filename}] Update Error:`, err);
            return null;
        }
    }

    async delete(idField, idValue) {
        try {
            const data = await this.read();
            const filtered = data.filter(item => item[idField] != idValue);
            if (filtered.length === data.length) return false;
            await this.write(filtered);
            return true;
        } catch (err) {
            console.error(`[Database:${this.filename}] Delete Error:`, err);
            return false;
        }
    }

    async find(field, value) {
        try {
            const data = await this.read();
            return data.find(item => item[field] == value) || null;
        } catch (err) {
            console.error(`[Database:${this.filename}] Find Error:`, err);
            return null;
        }
    }

    async findAll(field, value) {
        try {
            const data = await this.read();
            if (!field) return data;
            return data.filter(item => item[field] == value);
        } catch (err) {
            console.error(`[Database:${this.filename}] FindAll Error:`, err);
            return [];
        }
    }
}

module.exports = Database;
