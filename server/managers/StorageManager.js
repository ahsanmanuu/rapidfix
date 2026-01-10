const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class StorageManager {
    constructor() {
        this.useSupabase = process.env.USE_SUPABASE === 'true';

        if (this.useSupabase) {
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
                console.error("[StorageManager] Supabase credentials missing. Falling back to local.");
                this.useSupabase = false;
            } else {
                this.supabase = createClient(
                    process.env.SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_KEY
                );
            }
        }
    }

    /**
     * Upload a file
     * @param {Object} fileObject - Multer file object
     * @param {string} folder - Target folder (bucket/path prefix)
     * @param {string} customName - Optional custom filename
     * @returns {Promise<string>} Public URL or Local Path
     */
    async upload(fileObject, folder, customName = null) {
        if (!fileObject) return null;

        const filename = customName || `${Date.now()}-${fileObject.originalname.replace(/\s+/g, '-')}`;

        if (this.useSupabase) {
            return this._uploadToSupabase(fileObject, folder, filename);
        } else {
            return this._uploadToLocal(fileObject, folder, filename);
        }
    }

    async _uploadToSupabase(file, folder, filename) {
        try {
            const bucket = folder === 'technicians' ? 'technician-documents' : 'user-avatars';
            // Determine content type
            const contentType = file.mimetype;

            // Read file from temp path
            const fileContent = fs.readFileSync(file.path);

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(`${folder}/${filename}`, fileContent, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) throw error;

            // Get Public URL
            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(`${folder}/${filename}`);

            // Cleanup local temp file
            try { fs.unlinkSync(file.path); } catch (e) { }

            return urlData.publicUrl;
        } catch (error) {
            console.error("[StorageManager] Supabase Upload Error:", error);
            // Fallback? Or throw? Throwing ensures we know it failed.
            throw error;
        }
    }

    async _uploadToLocal(file, folder, filename) {
        const uploadDir = path.join(__dirname, '..', 'uploads', folder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const newPath = path.join(uploadDir, filename);
        fs.renameSync(file.path, newPath);

        // Return relative path for Serving
        return `/uploads/${folder}/${filename}`;
    }

    async delete(url) {
        // Implementation for cleanup if needed
        // For now, logging to avoid complexity
        console.log(`[StorageManager] Delete requested for ${url}`);
        return true;
    }
}

module.exports = StorageManager;
