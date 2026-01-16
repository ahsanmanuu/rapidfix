const fs = require('fs');
const path = require('path');

class InvoiceSettingsManager {
    constructor(db) {
        this.db = db;
        this.SETTINGS_FILE = 'invoice_settings.json';
        this.defaultSettings = {
            companyName: 'Fixofy Inc.',
            companyAddress: 'Tech Hub, Silicon Valley\nMumbai, India 400001',
            companyEmail: 'support@fixofy.com',
            companyPhone: '+91 98765 43210',
            taxName: 'GST',
            taxRate: 18,
            terms: 'Payment is due upon receipt.\nSubject to Mumbai Jurisdiction.',
            footerNote: 'Thank you for choosing Fixofy Services.',
            logoUrl: '' // stored as base64 or relative path
        };
    }

    async getSettings() {
        try {
            // Since Database.js is generic and file-based, we might need a specific method or just instance
            // But Database.js constructor takes a filename.
            // Wait, existing managers usually take a `new Database('filename.json')`.
            // Let's assume this.db is passed as `new Database('invoice_settings.json')`

            const data = await this.db.read();
            // Expecting data to be an array or object. Based on other managers, it's usually a list.
            // But settings is a single object.
            // Converting to single object storage if possible, or just index 0 of array.

            if (Array.isArray(data) && data.length > 0) {
                return { ...this.defaultSettings, ...data[0] };
            }
            return this.defaultSettings;
        } catch (err) {
            console.error('[InvoiceSettingsManager] Get Error:', err);
            return this.defaultSettings;
        }
    }

    async updateSettings(newSettings) {
        try {
            const current = await this.getSettings();
            const updated = { ...current, ...newSettings };

            // Overwrite the file with array containing single settings object
            await this.db.write([updated]);
            return updated;
        } catch (err) {
            console.error('[InvoiceSettingsManager] Update Error:', err);
            throw err;
        }
    }
}

module.exports = InvoiceSettingsManager;
