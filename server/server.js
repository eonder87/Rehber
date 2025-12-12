const http = require('http');
const fs = require('fs');
const path = require('path');


const PORT = process.env.PORT || 8000;
const USER_DATA = process.env.USER_DATA_PATH;
const DATA_DIR = USER_DATA ? path.join(USER_DATA, 'data') : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure Data Dir Exists immediately
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { }

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Ext');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Helper: Read DB
    const readDb = () => {
        try {
            if (!fs.existsSync(DB_FILE)) return [];
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data) || [];
        } catch (e) {
            console.error('Database read error:', e);
            return [];
        }
    };

    // Helper: Write DB
    const writeDb = (data) => {
        try {
            const dir = path.dirname(DB_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('Database write error:', e);
            throw e;
        }
    };

    // API Endpoint: GET /api/contacts
    // Supports search: /api/contacts?q=term
    if (pathname === '/api/contacts' && req.method === 'GET') {
        const query = parsedUrl.searchParams.get('q');
        let contacts = readDb();

        if (query) {
            const lowerQ = query.toLowerCase();
            contacts = contacts.filter(c =>
                (c.name && c.name.toLowerCase().includes(lowerQ)) ||
                (c.phone && c.phone.includes(lowerQ))
            );
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contacts));
        return;
    }

    // API Endpoint: POST /api/contacts/import (Bulk)
    if (pathname === '/api/contacts/import' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const newContacts = JSON.parse(body);
                if (!Array.isArray(newContacts)) throw new Error('Expected array');

                const contacts = readDb();

                // BACKUP: Create a backup before bulk operations
                // Format: db.backup.TIMESTAMP.json
                const backupPath = path.join(path.dirname(DB_FILE), `db.backup.${Date.now()}.json`);
                try {
                    if (fs.existsSync(DB_FILE)) {
                        fs.copyFileSync(DB_FILE, backupPath);
                    }
                } catch (errBackup) {
                    console.error('Backup failed:', errBackup);
                    // Decide if we should block the import. Let's proceed but log it.
                }

                // Assign new IDs to imported contacts to avoid collisions
                const contactsToAdd = newContacts.map(c => ({
                    ...c,
                    id: Date.now() + Math.random().toString(36).substr(2, 9)
                }));

                const updatedContacts = [...contactsToAdd, ...contacts];
                writeDb(updatedContacts);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', count: newContacts.length }));
            } catch (e) {
                console.error('Import error:', e);
                res.writeHead(400);
                res.end('Invalid JSON or Server Error');
            }
        });
        return;
    }

    // API Endpoint: POST /api/contacts
    if (pathname === '/api/contacts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const newContact = JSON.parse(body);

                // Server-side validation
                // Relaxed: Require at least name OR phone OR company
                if (!newContact.name && !newContact.phone && !newContact.company) {
                    res.writeHead(400);
                    res.end('Missing required contact info');
                    return;
                }

                const contacts = readDb();

                // 1. Phone Uniqueness Check
                if (newContact.phone) {
                    const existingPhone = contacts.find(c => c.phone === newContact.phone);
                    if (existingPhone) {
                        res.writeHead(409, { 'Content-Type': 'application/json' });
                        // Return the existing contact ID so client can offer to merge if we wanted, 
                        // but for phone uniqueness we usually just block.
                        res.end(JSON.stringify({
                            status: 'error',
                            message: 'Bu numara zaten kayıtlı.',
                            conflictType: 'phone',
                            existingId: existingPhone.id
                        }));
                        return;
                    }
                }

                // 2. Name Uniqueness Check
                // We normalize names for comparison (trim, lowercase)
                if (newContact.name) {
                    const targetName = newContact.name.trim().toLowerCase();
                    const existingName = contacts.find(c => c.name && c.name.trim().toLowerCase() === targetName);

                    if (existingName) {
                        res.writeHead(409, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'error',
                            message: 'Bu isimde bir kayıt zaten var.',
                            conflictType: 'name',
                            existingId: existingName.id,
                            existingContact: existingName
                        }));
                        return;
                    }
                }

                // Server-side ID generation
                newContact.id = Date.now();

                contacts.unshift(newContact);
                writeDb(contacts);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', message: 'Contact added', contact: newContact }));
            } catch (e) {
                console.error('Add contact error:', e);
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
        return;
    }

    // API Endpoint: POST /api/upload
    if (pathname === '/api/upload' && req.method === 'POST') {
        const ext = req.headers['x-file-ext'] || '.jpg';
        const contactName = req.headers['x-contact-name']
            ? req.headers['x-contact-name'].replace(/[^a-z0-9]/gi, '_').toLowerCase()
            : 'img';

        const filename = `${contactName}_${Date.now()}${ext}`;
        const targetDir = path.join(DATA_DIR, 'contact_images');
        const targetPath = path.join(targetDir, filename);

        // Ensure uploads dir exists
        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        } catch (e) {
            console.error('Upload dir creation error:', e);
            res.writeHead(500);
            res.end('Server Error');
            return;
        }

        const fileStream = fs.createWriteStream(targetPath);

        req.pipe(fileStream);

        fileStream.on('finish', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            // Return web-accessible path
            res.end(JSON.stringify({ url: `/contact_images/${filename}` }));
        });

        fileStream.on('error', (err) => {
            console.error('Upload error:', err);
            res.writeHead(500);
            res.end('Upload failed');
        });
        return;
    }

    // API Endpoint: DELETE /api/contacts/:id
    if (pathname.startsWith('/api/contacts/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const idNum = Number(id);

        const contacts = readDb();
        const contactIndex = contacts.findIndex(c => c.id == id || c.id == idNum);

        if (contactIndex > -1) {
            const contact = contacts[contactIndex];
            // 1. Delete Photo if exists
            if (contact.photo && contact.photo.startsWith('/contact_images/')) {
                const filename = contact.photo.replace('/contact_images/', '');
                const filePath = path.join(DATA_DIR, 'contact_images', filename);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('Deleted photo:', filePath);
                    }
                } catch (e) {
                    console.error('Error deleting photo file:', e);
                }
            }

            // 2. Remove from DB
            contacts.splice(contactIndex, 1);
            writeDb(contacts);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
        return;
    }

    // API Endpoint: PUT /api/contacts/:id (Update)
    // ... we don't strictly delete old photo on update here unless logic requires it.
    // Ideally, if new photo != old photo, delete old.
    if (pathname.startsWith('/api/contacts/') && req.method === 'PUT') {
        const idParam = pathname.split('/').pop();
        const idNum = Number(idParam);

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const updateData = JSON.parse(body);
                const contacts = readDb();
                // Match ID as string or number (loose equality or explicit check)
                const index = contacts.findIndex(c => c.id == idParam || c.id === idNum);

                if (index === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Contact not found' }));
                    return;
                }

                // Check if photo changed and delete old
                const oldPhoto = contacts[index].photo;
                const newPhoto = updateData.photo;
                if (oldPhoto && newPhoto && oldPhoto !== newPhoto && oldPhoto.startsWith('/contact_images/')) {
                    const filename = oldPhoto.replace('/contact_images/', '');
                    const filePath = path.join(DATA_DIR, 'contact_images', filename);
                    try {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    } catch (e) { console.error('Error deleting old photo on update', e); }
                }

                // Merge / Update
                contacts[index] = { ...contacts[index], ...updateData, id: contacts[index].id };

                writeDb(contacts);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', contact: contacts[index] }));
            } catch (e) {
                console.error('Update error:', e);
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
        return;
    }

    // Serve Static Files
    // Custom serve for /contact_images/
    if (pathname.startsWith('/contact_images/')) {
        const filename = pathname.replace('/contact_images/', '');
        const filePath = path.join(DATA_DIR, 'contact_images', filename);
        // Security: ensure it's inside data/contact_images
        if (!path.resolve(filePath).startsWith(path.resolve(DATA_DIR, 'contact_images'))) {
            res.writeHead(403); res.end(); return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                const ext = path.extname(filePath).toLowerCase();
                const mime = {
                    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
                };
                res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
                res.end(content);
            }
        });
        return;
    }

    const STATIC_ROOT = process.env.STATIC_PATH || path.join(__dirname, '..');
    let filePath = path.join(STATIC_ROOT, pathname === '/' ? 'index.html' : pathname);
    // ... standard static serve continues ...
    const rootDir = path.resolve(STATIC_ROOT);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.jpeg': contentType = 'image/jpeg'; break;
        case '.gif': contentType = 'image/gif'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
        case '.webp': contentType = 'image/webp'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    // Notify Electron Main Process if running as child
    if (process.env.ELECTRON_RUN && process.send) {
        process.send({ type: 'ready', port: server.address().port });
    }
});
