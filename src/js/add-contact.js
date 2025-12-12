// Initialize Lucide icons
lucide.createIcons();

// Init DB
db.init();

// Global UI Controller defined below...
// (Previous legacy code removed to prevent crash)

// Add Contact
// UI Controller for Dynamic Fields
// Add Contact
// Helper: Smart Phone Formatter & Validation
// Helpers moved to phone-utils.js

// UI Controller for Dynamic Fields
window.ui = {
    // Add extra field to Identity Section
    addIdentityField: (selectEl) => {
        try {
            const value = selectEl.value;
            if (!value) return;

            const text = selectEl.options[selectEl.selectedIndex].text;

            // Prevent duplicate fields
            if (document.getElementById(value)) {
                alert('Bu alan zaten ekli.');
                selectEl.value = '';
                return;
            }

            const container = document.getElementById('container-identity');
            if (!container) return;

            // Weights
            const weights = {
                'prefix': 10, 'firstName': 20, 'middleName': 30, 'lastName': 40, 'suffix': 50,
                'nickname': 60, 'company': 70, 'department': 80, 'title': 90,
                'phoneticFirstName': 70, 'phoneticLastName': 80, 'phoneticCompany': 90
            };
            const currentWeight = weights[value] || 100;

            const div = document.createElement('div');
            div.className = 'input-row dynamic-identity-row';
            div.setAttribute('data-weight', currentWeight);
            div.innerHTML = `
                <input type="text" id="${value}" placeholder="${text}" class="pk-input" style="flex:1;">
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            `;

            // Sort logic remains same
            const children = Array.from(container.children);
            let inserted = false;
            for (let child of children) {
                const attr = child.getAttribute('data-weight');
                if (attr == null) continue;
                const w = parseInt(attr, 10);
                if (!isNaN(w) && w > currentWeight) {
                    container.insertBefore(div, child);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) container.appendChild(div);

            selectEl.value = '';
            lucide.createIcons();
        } catch (err) {
            console.error('Error in addIdentityField:', err);
        }
    },

    addPhone: () => {
        const container = document.getElementById('container-phones');
        const html = `
            <div class="input-row phone-row dynamic-row">
                <div class="label-col">
                    <select class="label-select">
                        <option value="mobile">cep</option>
                        <option value="home">ev</option>
                        <option value="work">iş</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <input type="tel" class="phone-input" placeholder="+90 ..." oninput="formatPhoneInput(this)">
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    },

    addEmail: () => {
        const container = document.getElementById('container-emails');
        const html = `
            <div class="input-row email-row dynamic-row">
                <div class="label-col">
                    <select class="label-select">
                        <option value="home">ev</option>
                        <option value="work">iş</option>
                        <option value="personal">kişisel</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <input type="email" class="email-input" placeholder="E-Posta">
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    },

    addUrl: () => {
        const container = document.getElementById('container-urls');
        const html = `
            <div class="input-row url-row dynamic-row">
                <div class="label-col">
                    <select class="label-select">
                        <option value="homepage">ana sayfa</option>
                        <option value="home">ev</option>
                        <option value="work">iş</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <input type="url" class="url-input" placeholder="URL">
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    },

    addAddress: () => {
        const container = document.getElementById('container-addresses');

        // Complex Address Block
        // We use a wrapper div with 'dynamic-row' class but custom styling
        // Restore original layout: Textarea + Split Rows
        const block = document.createElement('div');
        block.className = 'address-block dynamic-row';
        block.style.display = 'flex';
        block.style.flexDirection = 'column';
        block.style.padding = '0';

        block.innerHTML = `
            <!-- Label Row + Street -->
            <div class="input-row" style="border-bottom:1px solid rgba(255,255,255,0.05); align-items: flex-start;">
                <div class="label-col" style="height: auto; border-right: 1px solid rgba(255,255,255,0.05);">
                    <select class="label-select addr-label" style="margin-top: 14px;">
                        <option value="home">ev</option>
                        <option value="work">iş</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <!-- Street Textarea -->
                <textarea class="addr-street" placeholder="Sokak / Cadde / Adres" rows="2" style="padding:14px; min-height:60px; resize:none; flex:1; background:transparent; border:none; color:white; font-family:inherit;"></textarea>
                
                <!-- Remove Button (Top Right of Block) -->
                <!-- Manually aligned to match label top margin -->
                <button type="button" class="remove-btn" onclick="this.closest('.address-block').remove()" style="margin-top: 14px;">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
            
            <!-- Zip & District Row (Split) -->
            <div class="input-row" style="border-bottom:1px solid rgba(255,255,255,0.05); display:flex; padding:0;">
                <input type="text" class="addr-zip" placeholder="Posta Kodu" style="width:50%; border-right:1px solid rgba(255,255,255,0.05); border-radius:0;">
                <input type="text" class="addr-district" placeholder="Semt / İlçe" style="width:50%; border-radius:0;">
            </div>

            <!-- City & Country Row (Split) -->
            <div class="input-row" style="display:flex; padding:0;">
                <input type="text" class="addr-city" placeholder="Şehir" style="width:50%; border-right:1px solid rgba(255,255,255,0.05); border-radius:0;">
                <input type="text" class="addr-country" placeholder="Ülke" style="width:50%; border-radius:0;">
            </div>
        `;

        container.appendChild(block);
        lucide.createIcons();
    },

    addDate: () => {
        const container = document.getElementById('container-dates');
        const html = `
            <div class="input-row date-row dynamic-row">
                <div class="label-col">
                    <select class="label-select">
                        <option value="birthday">doğum günü</option>
                        <option value="anniversary">yıl dönümü</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <input type="date" class="date-input" style="color-scheme: dark;"> 
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    },

    addSocial: () => {
        const container = document.getElementById('container-social');
        // Ensure container is visible if it was hidden
        if (container) container.style.display = 'block';

        const html = `
            <div class="input-row social-row dynamic-row">
                <div class="label-col">
                    <select class="label-select">
                        <option value="twitter">twitter</option>
                        <option value="facebook">facebook</option>
                        <option value="instagram">instagram</option>
                        <option value="linkedin">linkedin</option>
                        <option value="other">diğer</option>
                    </select>
                </div>
                <input type="text" class="social-input" placeholder="Kullanıcı adı">
                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
                    <i data-lucide="trash-2" width="16"></i>
                </button>
            </div>
        `;
        if (container) container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    }
};

// Initialize with one phone field OR load existing if editing
window.addEventListener('DOMContentLoaded', async () => {
    // Check URL Params for ID
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');

    if (editId) {
        document.querySelector('h1').textContent = 'Kişiyi Düzenle';
        document.querySelector('p').textContent = 'Bilgileri güncelleyin';
        const btn = document.getElementById('add-btn');
        if (btn) {
            btn.textContent = 'Güncelle';
            btn.removeEventListener('click', addContact);
            btn.addEventListener('click', () => updateContact(editId));
        }

        // Load Data
        await loadContactToForm(editId);
    } else {
        // Default new mode
        ui.addPhone();
    }

    // Attach Save Button Listener (Only if not already handled by edit mode above)
    const saveBtn = document.getElementById('add-btn');
    if (saveBtn && !editId) {
        saveBtn.addEventListener('click', addContact);
    }

    // Photo Input Listener
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                photoPreview.src = url;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
            }
        });
    }
});

async function loadContactToForm(id) {
    // We fetch all because we don't have GET /id yet
    // In a real app, use db.get(id)
    const contacts = await db.getAll();
    // ID comes as string from URL, compare loose or strict? DB ids are numbers or strings.
    const contact = contacts.find(c => c.id == id);

    if (!contact) {
        alert('Kişi bulunamadı!');
        return;
    }

    // 1. Identity
    const setVal = (domId, val) => {
        const el = document.getElementById(domId);
        if (el) el.value = val || '';
    };

    setVal('firstName', contact.firstName);
    setVal('lastName', contact.lastName);

    // Render extra identity fields if they have values
    const identityMap = {
        prefix: 'Ön Ek', middleName: 'İkinci Adı', suffix: 'Son Ek', nickname: 'Takma Ad',
        company: 'Şirket', title: 'Unvan', department: 'Bölüm',
        phoneticFirstName: 'Adın Okunuşu', phoneticLastName: 'Soyadının Okunuşu', phoneticCompany: 'Şirket Okunuşu'
    };

    Object.keys(identityMap).forEach(key => {
        if (contact[key]) {
            // We need to simulate selecting it from dropdown to create the row
            // Then set value.
            // But ui.addIdentityField expects a select element.
            // Let's manually create the row using internal logic or mock the select.
            // Better: Manual creation to be safe.

            // Re-using logic from addIdentityField roughly or create a helper?
            // Let's manually inject for simplicity or expose createIdentityRow

            const container = document.getElementById('container-identity');
            const placeholderText = identityMap[key];

            // Just create input
            const div = document.createElement('div');
            div.className = 'input-row dynamic-identity-row';
            div.innerHTML = `<input type="text" id="${key}" value="${contact[key]}" placeholder="${placeholderText}" class="pk-input">`;
            container.appendChild(div);
        }
    });

    // 2. Photo
    if (contact.photo) {
        const photoPreview = document.getElementById('photo-preview');
        const photoPlaceholder = document.getElementById('photo-placeholder');
        photoPreview.src = contact.photo;
        photoPreview.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    }

    // 3. Dynamic Fields Helper
    const loadDynamic = (containerId, dataObj, addFnName, inputClass, labelClass) => {
        const container = document.getElementById(containerId);
        // DO NOT clear innerHTML, it kills headers!

        // Remove existing dynamic rows
        // But container has a header usually.
        // Actually the containers (container-phones etc.) usually have a header div inside.
        // Clearing innerHTML kills the header.
        // We should clear only dynamic rows.

        // Remove existing dynamic rows
        const dynamics = container.querySelectorAll('.dynamic-row');
        dynamics.forEach(d => d.remove());

        if (!dataObj) return;

        // Iterate keys
        Object.entries(dataObj).forEach(([key, val]) => {
            // Trigger UI add
            // We need to access the NEW row to set value.
            // modify Add functions to return the created row or select it last.
            // Hack: Call Add, then select last child.

            ui[addFnName]();
            const rows = container.querySelectorAll('.dynamic-row');
            const lastRow = rows[rows.length - 1];

            // Set Type (Label)
            const select = lastRow.querySelector(labelClass);
            if (select) {
                // Map key to option value if possible
                // key might be "mobile_2". Clean it.
                let cleanKey = key.replace(/_\d+$/, '').replace(/_merged_.*$/, '');
                // Simple mapping fallback
                if (['mobile', 'home', 'work', 'other'].includes(cleanKey)) select.value = cleanKey;
                // Emails: home, work, personal, other
                else if (['personal'].includes(cleanKey)) select.value = cleanKey;
                // URL: homepage, home, work
                else if (['homepage'].includes(cleanKey)) select.value = cleanKey;
                // Date: birthday, anniversary
                else if (['birthday', 'anniversary'].includes(cleanKey)) select.value = cleanKey;

                // If key is totally custom or not in list, default stands.
            }

            // Set Value
            const input = lastRow.querySelector(inputClass);
            if (input) input.value = val;
        });
    };

    // 3.1 Phones
    if (contact.phones) {
        loadDynamic('container-phones', contact.phones, 'addPhone', '.phone-input', '.label-select');
    } else if (contact.phone) {
        // Legacy
        loadDynamic('container-phones', { mobile: contact.phone }, 'addPhone', '.phone-input', '.label-select');
    }

    // 3.2 Emails
    loadDynamic('container-emails', contact.emails, 'addEmail', '.email-input', '.label-select');
    // 3.3 Urls
    loadDynamic('container-urls', contact.urls, 'addUrl', '.url-input', '.label-select');
    // 3.4 Dates
    loadDynamic('container-dates', contact.dates, 'addDate', '.date-input', '.label-select');

    // 3.5 Addresses (Complex)
    // Remove existing
    const addrContainer = document.getElementById('container-addresses');
    addrContainer.querySelectorAll('.address-block').forEach(b => b.remove());

    if (contact.addresses) {
        Object.entries(contact.addresses).forEach(([key, addr]) => {
            ui.addAddress();
            const blocks = addrContainer.querySelectorAll('.address-block');
            const lastBlock = blocks[blocks.length - 1];

            // Label
            let cleanKey = key.replace(/_\d+$/, '');
            const sel = lastBlock.querySelector('.addr-label');
            if (sel && ['home', 'work', 'other'].includes(cleanKey)) sel.value = cleanKey;

            // Fields
            lastBlock.querySelector('.addr-street').value = addr.street || '';
            lastBlock.querySelector('.addr-zip').value = addr.zip || '';
            lastBlock.querySelector('.addr-district').value = addr.district || '';
            lastBlock.querySelector('.addr-city').value = addr.city || '';
            lastBlock.querySelector('.addr-country').value = addr.country || '';
        });
    }
}

async function updateContact(id) {
    // 1. Validate Phones First (Using Helper)
    if (!validatePhoneInputs()) return;

    // 1. Gather Data (Reusing logic from addContact would be best, but we need to extract it)
    // Refactor addContact to return the object?
    // Let's duplication for safety now to avoid breaking addContact flow.

    // COPIED & ADAPTED FROM addContact
    const getVal = (domId) => { const el = document.getElementById(domId); return el ? el.value.trim() : ''; };
    const firstName = getVal('firstName');
    const lastName = getVal('lastName');
    // ... we need to check if those dynamic fields exist
    // Just getVal returns '' if not exists, so it's safe.
    const prefix = getVal('prefix');
    const middleName = getVal('middleName');
    const suffix = getVal('suffix');
    const nickname = getVal('nickname');
    const company = getVal('company');
    const title = getVal('title');
    const department = getVal('department');
    const phoneticFirstName = getVal('phoneticFirstName');
    const phoneticLastName = getVal('phoneticLastName');
    const phoneticCompany = getVal('phoneticCompany');

    const collectDynamic = (selector, inputSelector, labelSelector = '.label-select') => {
        const rows = document.querySelectorAll(selector);
        const result = {};
        const addToObj = (obj, label, val) => {
            if (!val) return;
            let key = label;
            let i = 2;
            while (obj[key]) { key = `${label}_${i}`; i++; }
            obj[key] = val;
        };
        rows.forEach(row => {
            const labelEl = row.querySelector(labelSelector);
            const inputEl = row.querySelector(inputSelector);
            if (labelEl && inputEl) {
                addToObj(result, labelEl.value, inputEl.value.trim());
            }
        });
        return result;
    };

    const phones = collectDynamic('.phone-row', '.phone-input');
    const emails = collectDynamic('.email-row', '.email-input');
    const urls = collectDynamic('.url-row', '.url-input');
    const dates = collectDynamic('.date-row', '.date-input');

    const addressBlocks = document.querySelectorAll('.address-block');
    const addresses = {};
    addressBlocks.forEach(block => {
        const label = block.querySelector('.addr-label').value;
        const street = block.querySelector('.addr-street').value.trim();
        const zip = block.querySelector('.addr-zip').value.trim();
        const district = block.querySelector('.addr-district').value.trim();
        const city = block.querySelector('.addr-city').value.trim();
        const country = block.querySelector('.addr-country').value.trim();

        if (street || zip || district || city || country) {
            let key = label;
            let i = 2;
            while (addresses[key]) { key = `${label}_${i}`; i++; }
            addresses[key] = { street, zip, district, city, country };
        }
    });

    // Photo
    let photoUrl = '';
    const photoPreview = document.getElementById('photo-preview');
    // If preview has src and it's not blob (or if it is), we might need to handle upload ONLY if changed.
    // If input has files, upload. Else keep existing.
    // We can't easily get existing URL from preview if it was set via Load.
    // But we can check if it starts with http or /uploads
    if (photoPreview.src && !photoPreview.src.startsWith('blob:') && photoPreview.style.display !== 'none') {
        photoUrl = photoPreview.src; // Keep existing
    }

    // Check new upload
    const photoInput = document.getElementById('photo-input');
    if (photoInput && photoInput.files.length > 0) {
        try {
            const uploadRes = await uploadFile(photoInput.files[0]);
            photoUrl = uploadRes.url;
        } catch (err) {
            alert('Fotoğraf güncellenemedi: ' + err.message);
            return;
        }
    }

    const nameParts = [prefix, firstName, middleName, lastName, suffix].filter(Boolean);
    let displayName = nameParts.join(' ');
    if (!displayName && company) displayName = company;

    const contactData = {
        id: parseInt(id), // Keep ID
        name: displayName,
        photo: photoUrl,
        firstName, lastName, middleName, prefix, suffix, nickname,
        company, title, department,
        phoneticFirstName, phoneticLastName, phoneticCompany,
        phones, emails, urls, dates, addresses,
        phone: Object.values(phones)[0] || '' // legacy
    };

    try {
        await db.update(contactData);
        alert('Kişi güncellendi!');
        // Refresh or go back?
        // Since we are in iframe, just reload current page is fine or go to view.
        // Let's reload to show changes
        window.location.href = 'view-contacts.html';
    } catch (err) {
        alert('Güncelleme hatası: ' + err.message);
    }
}


// Helper: Upload File
async function uploadFile(file) {
    // Get extension
    const nameParts = file.name.split('.');
    const ext = nameParts.length > 1 ? '.' + nameParts.pop() : '.jpg';

    // Try to get a hint for the name
    const fName = document.getElementById('firstName')?.value.trim() || '';
    const lName = document.getElementById('lastName')?.value.trim() || '';
    const company = document.getElementById('company')?.value.trim() || '';

    let contactSlug = 'contact';
    if (fName || lName) contactSlug = `${fName}_${lName}`;
    else if (company) contactSlug = company;

    // Convert to ascii safe
    // We rely on server to strict sanitize, but basic replacement here helps
    // Actually server does stricter logic. Let's just send what we have.

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'X-File-Ext': ext,
            'X-Contact-Name': contactSlug, // Send hint
            'Content-Type': 'application/octet-stream' // Treating as raw stream
        },
        body: file
    });

    if (!response.ok) {
        throw new Error('Fotoğraf yüklenemedi: ' + response.statusText);
    }
    return await response.json(); // returns { url: ... }
}


// Add Contact Main Function
async function addContact() {
    // 1. Validate Phones First (Using Helper)
    if (!validatePhoneInputs()) return;

    // Gathering Fields...
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const firstName = getVal('firstName');
    const lastName = getVal('lastName');
    const prefix = getVal('prefix');
    const middleName = getVal('middleName');
    const suffix = getVal('suffix');
    const nickname = getVal('nickname');
    const company = getVal('company');
    const title = getVal('title');
    const department = getVal('department');
    // phonetics...
    const phoneticFirstName = getVal('phoneticFirstName');
    const phoneticLastName = getVal('phoneticLastName');
    const phoneticCompany = getVal('phoneticCompany');

    // Helper for collecting dynamic fields
    const collectDynamic = (selector, inputSelector, labelSelector = '.label-select') => {
        const rows = document.querySelectorAll(selector);
        const result = {};

        const addToObj = (obj, label, val) => {
            if (!val) return;
            let key = label;
            let i = 2;
            while (obj[key]) {
                key = `${label}_${i}`;
                i++;
            }
            obj[key] = val;
        };

        rows.forEach(row => {
            const labelEl = row.querySelector(labelSelector);
            const inputEl = row.querySelector(inputSelector);
            if (labelEl && inputEl) {
                addToObj(result, labelEl.value, inputEl.value.trim());
            }
        });
        return result;
    };

    // 2. Phones
    const phones = collectDynamic('.phone-row', '.phone-input');

    // 3. Emails
    const emails = collectDynamic('.email-row', '.email-input');

    // 4. Urls
    const urls = collectDynamic('.url-row', '.url-input');

    // 5. Dates
    const dates = collectDynamic('.date-row', '.date-input');

    // 6. Addresses (Complex collection)
    const addressBlocks = document.querySelectorAll('.address-block');
    const addresses = {};

    addressBlocks.forEach(block => {
        const label = block.querySelector('.addr-label').value;
        const street = block.querySelector('.addr-street').value.trim();
        const zip = block.querySelector('.addr-zip').value.trim();
        const district = block.querySelector('.addr-district').value.trim();
        const city = block.querySelector('.addr-city').value.trim();
        const country = block.querySelector('.addr-country').value.trim();

        // Only add if at least one field is filled
        if (street || zip || district || city || country) {
            let key = label;
            let i = 2;
            while (addresses[key]) { key = `${label}_${i}`; i++; }

            addresses[key] = {
                street, zip, district, city, country
            };
        }
    });


    // Validation
    const hasName = firstName || lastName || company || nickname;
    if (!hasName) {
        alert('Lütfen en az bir isim veya şirket adı giriniz.');
        return;
    }

    // Construct Display Name
    const nameParts = [prefix, firstName, middleName, lastName, suffix].filter(Boolean);
    let displayName = nameParts.join(' ');
    if (!displayName && company) displayName = company;
    if (!displayName && nickname) displayName = nickname;

    // Pick first phone for primary listing
    const primaryPhone = Object.values(phones)[0] || '';

    // Upload Photo if exists
    let photoUrl = '';
    const photoInput = document.getElementById('photo-input');
    if (photoInput && photoInput.files.length > 0) {
        try {
            console.log('Uploading photo:', photoInput.files[0].name);
            const uploadRes = await uploadFile(photoInput.files[0]);
            photoUrl = uploadRes.url;
            console.log('Photo uploaded successfully:', photoUrl);
        } catch (err) {
            console.error('Photo upload failed:', err);
            alert('Fotoğraf yüklenemedi: ' + err.message);
            if (!confirm('Fotoğrafsız devam edilsin mi?')) {
                return;
            }
        }
    }

    // Contact Object
    const newContact = {
        name: displayName,
        photo: photoUrl, // Add photo URL
        firstName, lastName, middleName, prefix, suffix, nickname,
        company, title, department,
        phoneticFirstName, phoneticLastName, phoneticCompany,

        phones,
        emails,
        urls,
        dates,
        addresses,

        // Compatibility
        phone: primaryPhone,
        rawPhone: primaryPhone
    };

    try {
        await db.add(newContact);
        alert('Kişi kaydedildi!');
        location.reload();
    } catch (err) {
        if (err.conflictData && err.conflictData.conflictType === 'name') {
            const existingContact = err.conflictData.existingContact;
            const existingName = existingContact.name;

            if (confirm(`"${existingName}" adında bir kişi zaten var. Mevcut kaydın üzerine eklemek ister misiniz?\n\n(Yeni bilgiler mevcut kişiye eklenecektir)`)) {

                // Merge Logic
                // 1. Merge simple fields if empty in existing (prefer existing usually, or overwrite? User said "add on top", implies append)
                // Actually "üzerine eklenmesi" usually means adding new phones/emails to the list.

                // Arrays to merge: phones, emails, urls, dates, addresses
                const mergeObjects = (oldObj, newObj) => {
                    const merged = { ...oldObj };

                    Object.entries(newObj).forEach(([baseKey, val]) => {
                        // 1. Check if exact value exists (duplicates)
                        const values = Object.values(merged);
                        // Deep compare for objects (like addresses), simple for strings
                        let exists = false;
                        if (typeof val === 'object') {
                            exists = values.some(v => JSON.stringify(v) === JSON.stringify(val));
                        } else {
                            exists = values.includes(val);
                        }
                        if (exists) return; // Skip duplicate value

                        // 2. Find a clean key
                        // The key from newObj is likely "mobile", "home", etc.
                        // We want to keep it "mobile", "mobile_2", "mobile_3" etc.

                        // If the incoming key has a suffix (like mobile_2), strip it to find base type if needed,
                        // or just treat it as the label. 
                        // Let's rely on the label concept.

                        // Removing numbering from incoming key to find base label
                        let label = baseKey.replace(/_\d+$/, '').replace(/_merged_.*$/, '');

                        // Check if 'mobile' exists, if so try 'mobile_2', 'mobile_3'...
                        let candidateKey = label;
                        let counter = 2;

                        // If the exact label is taken (by different value), find next free slot
                        while (merged[candidateKey]) {
                            candidateKey = `${label}_${counter}`;
                            counter++;
                        }

                        merged[candidateKey] = val;
                    });

                    return merged;
                };

                const mergedContact = {
                    ...existingContact,
                    phones: mergeObjects(existingContact.phones || {}, newContact.phones || {}),
                    emails: mergeObjects(existingContact.emails || {}, newContact.emails || {}),
                    urls: mergeObjects(existingContact.urls || {}, newContact.urls || {}),
                    dates: mergeObjects(existingContact.dates || {}, newContact.dates || {}),
                    addresses: mergeObjects(existingContact.addresses || {}, newContact.addresses || {}),
                    // For single fields, we keep existing if present, else take new
                    company: existingContact.company || newContact.company,
                    title: existingContact.title || newContact.title,
                };

                try {
                    await db.update(mergedContact);
                    alert('Kayıt başarıyla birleştirildi!');
                    location.reload();
                } catch (updateErr) {
                    alert('Güncelleme hatası: ' + updateErr.message);
                }

            }
        } else {
            alert('Hata: ' + err.message);
        }
    }
}
