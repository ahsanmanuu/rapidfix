const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class StorageManager {
    constructor() {
        this.useSupabase = process.env.USE_SUPABASE === 'true';
        this.io = null;

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

    setSocketIO(io) {
        this.io = io;
    }

    async upload(fileObject, folder, customName = null) {
        try {
            if (!fileObject) return null;
            const filename = customName || `${Date.now()}-${fileObject.originalname.replace(/\s+/g, '-')}`;

            let url;
            if (this.useSupabase) {
                url = await this._uploadToSupabase(fileObject, folder, filename);
            } else {
                url = await this._uploadToLocal(fileObject, folder, filename);
            }

            if (this.io) {
                this.io.emit('file_uploaded', { folder, filename, url });
            }
            return url;
        } catch (err) {
            console.error("[StorageManager] Error uploading file:", err);
            throw err;
        }
    }

    async _uploadToSupabase(file, folder, filename) {
        try {
            const bucket = folder === 'technicians' ? 'technician-documents' : 'user-avatars';
            const contentType = file.mimetype;
            const fileContent = fs.readFileSync(file.path);

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(`${folder}/${filename}`, fileContent, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(`${folder}/${filename}`);

            try { fs.unlinkSync(file.path); } catch (e) { }
            return urlData.publicUrl;
        } catch (error) {
            console.error("[StorageManager] Supabase Upload Error:", error);
            throw error;
        }
    }

    async _uploadToLocal(file, folder, filename) {
        try {
            const uploadDir = path.join(__dirname, '..', 'uploads', folder);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const newPath = path.join(uploadDir, filename);
            fs.renameSync(file.path, newPath);
            return `/uploads/${folder}/${filename}`;
        } catch (err) {
            console.error("[StorageManager] Local Upload Error:", err);
            throw err;
        }
    }

    async delete(url) {
        try {
            console.log(`[StorageManager] Delete requested for ${url}`);
            if (this.io) {
                this.io.emit('file_deleted', { url });
            }
            return true;
        } catch (err) {
            console.error(`[StorageManager] Error deleting file ${url}:`, err);
            return false;
        }
    }
}

module.exports = StorageManager;
