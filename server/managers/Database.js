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

    read() {
        try {
            const data = fs.readFileSync(this.filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading database ${this.filename}:`, error);
            return [];
        }
    }

    write(data) {
        try {
            fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing database ${this.filename}:`, error);
            return false;
        }
    }

    add(item) {
        const data = this.read();
        data.push(item);
        this.write(data);
        return item;
    }

    update(idField, idValue, updateData) {
        const data = this.read();
        const index = data.findIndex(item => item[idField] == idValue);
        if (index !== -1) {
            data[index] = { ...data[index], ...updateData };
            this.write(data);
            return data[index];
        }
        return null;
    }

    delete(idField, idValue) {
        const data = this.read();
        const filtered = data.filter(item => item[idField] != idValue);
        this.write(filtered);
        return filtered.length !== data.length;
    }

    find(field, value) {
        const data = this.read();
        return data.find(item => item[field] == value);
    }

    findAll(field, value) {
        const data = this.read();
        if (!field) return data;
        return data.filter(item => item[field] == value);
    }
}

module.exports = Database;
