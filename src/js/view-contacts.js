// Initialize Lucide icons
lucide.createIcons();

const contactList = document.getElementById('contact-list');
const contactCount = document.getElementById('contact-count');
const searchInput = document.getElementById('search');
const alphaSidebar = document.getElementById('alpha-sidebar');

// State
// State
let allContacts = [];
let sortMode = localStorage.getItem('contactSortMode') || 'first';
let currentTab = 'all'; // 'all' | 'fav'

// Init and Render
(async function initPage() {
    try {
        await db.init();
        allContacts = await db.getAll();
        renderPage();
    } catch (err) {
        console.error(err);
        alert('Kişi listesi yüklenirken hata oluştu: ' + err.message);
    }
})();

// Dropdown Logic
window.toggleDropdown = (e) => {
    e.stopPropagation();
    const menu = document.getElementById('filter-menu');
    if (menu) menu.classList.toggle('show');
};

window.addEventListener('click', () => {
    const menu = document.getElementById('filter-menu');
    if (menu) menu.classList.remove('show');
});

window.selectFilter = (mode) => {
    currentTab = mode;
    // Update Menu Visuals
    document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`item-${mode}`);
    if (activeItem) activeItem.classList.add('active');

    // Update Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = (mode === 'all') ? 'Kişiler' : 'Favoriler';

    renderPage(searchInput.value);
};

window.toggleFavorite = async (e, id) => {
    e.stopPropagation();
    const contact = allContacts.find(c => c.id == id);
    if (contact) {
        contact.isFavorite = !contact.isFavorite;
        await db.update(contact);
        allContacts = await db.getAll(); // Refresh data
        renderPage(searchInput.value);
    }
};


// ... (Existing helper functions getDisplayString, getSortString) ... 

// Restore missing event listeners and functions
searchInput.addEventListener('input', (e) => renderPage(e.target.value));

window.deleteContact = async (id) => {
    if (confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) {
        await db.delete(id);
        allContacts = await db.getAll(); // Refresh locally
        renderPage(searchInput.value);
    }
}

window.toggleSort = () => {
    sortMode = sortMode === 'first' ? 'last' : 'first';
    localStorage.setItem('contactSortMode', sortMode);
    renderPage(searchInput.value);
}

// Helper Functions
function getDisplayString(contact) {
    const f = contact.firstName || '';
    const l = contact.lastName || '';
    const m = contact.middleName || '';

    if (f || l) {
        return `${f} ${m} ${l}`.trim().replace(/\s+/g, ' ');
    }
    return contact.name || '';
}

function getSortString(contact, mode) {
    const f = contact.firstName || '';
    const l = contact.lastName || '';
    const m = contact.middleName || '';
    const mainName = contact.name || '';

    if (f || l) {
        if (mode === 'last') {
            return `${l} ${f} ${m}`.trim().replace(/\s+/g, ' ');
        } else {
            return `${f} ${m} ${l}`.trim().replace(/\s+/g, ' ');
        }
    }
    return mainName;
}


async function renderPage(filterText = '') {
    // Re-query critical UI elements to ensure safety
    const listEl = document.getElementById('contact-list');
    const alphaEl = document.getElementById('alpha-sidebar');
    if (!listEl) {
        console.error("Critical: contact-list element not found!");
        return;
    }

    // 1. Calculate Counts
    const favCount = allContacts.filter(c => c.isFavorite).length;

    // Update Dropdown & Header Counts
    const pageCountEl = document.getElementById('page-count');
    const menuAllEl = document.getElementById('menu-count-all');
    const menuFavEl = document.getElementById('menu-count-fav');

    if (pageCountEl) {
        // Show count for current view
        pageCountEl.textContent = (currentTab === 'all') ? allContacts.length : favCount;
    }
    if (menuAllEl) menuAllEl.textContent = allContacts.length;
    if (menuFavEl) menuFavEl.textContent = favCount;

    listEl.innerHTML = '';

    // 2. Filter (Text + Tab)
    let filtered = allContacts;

    // Tab Filter
    if (currentTab === 'fav') {
        filtered = filtered.filter(c => c.isFavorite);
    }

    if (filterText) {
        const q = filterText.toLowerCase();
        filtered = filtered.filter(c => {
            const nameMatch = (c.firstName || '').toLowerCase().includes(q) ||
                (c.lastName || '').toLowerCase().includes(q) ||
                (c.name || '').toLowerCase().includes(q);
            const phoneMatch = (c.phone || '').includes(q);

            // Re-use complex matching logic if needed or keep it simple
            // For brevity using the main checks
            return nameMatch || phoneMatch;
        });
    }

    // 3. Sort
    filtered.sort((a, b) => {
        const keyA = getSortString(a, sortMode).toLocaleUpperCase('tr-TR');
        const keyB = getSortString(b, sortMode).toLocaleUpperCase('tr-TR');
        return keyA.localeCompare(keyB, 'tr-TR');
    });

    if (filtered.length === 0) {
        contactList.innerHTML = `
            <li class="empty-state">
                <i data-lucide="users" width="32" height="32"></i>
                <p>${currentTab === 'fav' ? 'Favori kişi yok' : (allContacts.length === 0 ? 'Henüz kişi eklenmedi' : 'Sonuç bulunamadı')}</p>
            </li>
        `;
        renderAlphaSidebar([]);
        lucide.createIcons();
        return;
    }

    // 4. Group & Render
    const groups = {};
    filtered.forEach(contact => {
        const sortKey = getSortString(contact, sortMode);
        let firstChar = sortKey.charAt(0).toLocaleUpperCase('tr-TR');
        if (!/^[A-ZÇĞİÖŞÜ]$/.test(firstChar)) firstChar = '#';
        if (!groups[firstChar]) groups[firstChar] = [];
        groups[firstChar].push(contact);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b, 'tr-TR');
    });

    sortedKeys.forEach(char => {
        const header = document.createElement('li');
        header.className = 'section-header-sticky';
        header.id = `section-${char}`;
        header.textContent = char;
        contactList.appendChild(header);

        groups[char].forEach(contact => {
            const li = document.createElement('li');
            li.className = 'contact-item';
            li.onclick = (e) => {
                if (e.target.closest('button')) return; // Ignore button clicks
                showContactDetails(contact);
            };
            li.style.cursor = 'pointer';

            const dName = getDisplayString(contact);
            const subtitle = contact.company || contact.phone || '';
            const isFav = contact.isFavorite;

            li.innerHTML = `
                <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; width: 100%;">
                    <div class="list-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                        ${contact.photo
                    ? `<img src="${contact.photo}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<i data-lucide="user" width="18" height="18"></i>`
                }
                    </div>
                    <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden; flex: 1;">
                        <span class="contact-name" style="line-height: 1.2;">${escapeHtml(dName)}</span>
                        <span class="contact-phone" style="font-size: 0.85em; opacity: 0.7; line-height: 1.2;">${escapeHtml(subtitle)}</span>
                    </div>
                </div>
                
                <!-- Action Buttons: Fav & Delete -->
                <div style="display: flex; gap: 8px;">
                    <button class="fav-btn" onclick="toggleFavorite(event, '${contact.id}')" title="${isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}"
                        style="background: transparent; border: none; cursor: pointer; color: ${isFav ? '#fbbf24' : 'var(--text-muted)'}; display: flex; align-items: center;">
                        <i data-lucide="star" width="18" height="18" fill="${isFav ? '#fbbf24' : 'none'}"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteContact('${contact.id}')" title="Sil">
                        <i data-lucide="trash-2" width="18" height="18"></i>
                    </button>
                </div>
            `;
            contactList.appendChild(li);
        });
    });

    renderAlphaSidebar(sortedKeys);
    lucide.createIcons();
}

function renderAlphaSidebar(activeChars) {
    if (!alphaSidebar) return;
    alphaSidebar.innerHTML = '';

    // Complete Alphabet (TR)
    const chars = "A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z #".split(" ");

    chars.forEach(char => {
        const a = document.createElement('a');
        a.className = 'alpha-link';
        a.textContent = char;

        // Check if this char exists in current list
        if (activeChars.includes(char)) {
            a.onclick = () => {
                const target = document.getElementById(`section-${char}`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
        } else {
            a.style.opacity = '0.3';
            a.style.cursor = 'default';
        }

        alphaSidebar.appendChild(a);
    });
}

function showContactDetails(contact) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');

    // Helper to generate a read-only row
    const row = (label, value) => `
        <div class="input-row" style="padding: 12px 0;">
            <div class="label-col" style="min-width: 100px;">
                <span class="ios-label">${label}</span>
            </div>
            <div style="flex:1; color: white;">${escapeHtml(value)}</div>
        </div>
    `;

    const dName = getDisplayString(contact) || contact.name;

    // 1. New Header Layout (Photo Left) + Edit Button
    let html = `
        <div class="detail-header-row" style="position:relative;">
            <div class="photo-circle" style="width:100px; height:100px; cursor: default; flex-shrink:0;">
                ${contact.photo
            ? `<img src="${contact.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
            : `<i data-lucide="user" width="40" height="40"></i>`
        }
            </div>
            <div class="detail-header-info">
                <h2 style="font-size:1.5rem; margin-bottom:0.25rem; line-height:1.2;">${escapeHtml(dName)}</h2>
                ${contact.company ? `<p style="color:var(--text-muted); margin-bottom:0.25rem;">${escapeHtml(contact.company)}</p>` : ''}
                ${contact.title ? `<p style="color:var(--text-muted); font-size:0.9rem;">${escapeHtml(contact.title)}</p>` : ''}
            </div>
            <button onclick="editContactRedirect('${contact.id}')" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:600;">
                Düzenle
            </button>
        </div>
    `;

    // 2. Phones
    if (contact.phones && Object.keys(contact.phones).length > 0) {
        html += `<div class="ios-group"><div class="section-header">Telefon</div>`;
        Object.entries(contact.phones).forEach(([key, val]) => {
            let label = key.replace(/_\d+$/, '').replace(/_merged_.*$/, '');
            const map = { mobile: 'cep', home: 'ev', work: 'iş', other: 'diğer' };
            label = map[label] || label;

            // Format phone if helper exists
            const displayVal = (window.smartFormatPhone && val) ? window.smartFormatPhone(val) : val;
            html += row(label, displayVal);
        });
        html += `</div>`;
    } else if (contact.phone) {
        const displayVal = (window.smartFormatPhone) ? window.smartFormatPhone(contact.phone) : contact.phone;
        html += `<div class="ios-group"><div class="section-header">Telefon</div>${row('cep', displayVal)}</div>`;
    }

    // 3. Emails
    if (contact.emails && Object.keys(contact.emails).length > 0) {
        html += `<div class="ios-group"><div class="section-header">E-Posta</div>`;
        Object.entries(contact.emails).forEach(([key, val]) => {
            let label = key.replace(/_\d+$/, '').replace(/_merged_.*$/, '');
            const map = { home: 'ev', work: 'iş', personal: 'kişisel', other: 'diğer' };
            label = map[label] || label;
            html += row(label, val);
        });
        html += `</div>`;
    }

    // 4. Urls
    if (contact.urls && Object.keys(contact.urls).length > 0) {
        html += `<div class="ios-group"><div class="section-header">URL</div>`;
        Object.values(contact.urls).forEach(val => {
            html += row('url', val);
        });
        html += `</div>`;
    }

    // 5. Addresses
    if (contact.addresses && Object.keys(contact.addresses).length > 0) {
        html += `<div class="ios-group"><div class="section-header">Adres</div>`;
        Object.entries(contact.addresses).forEach(([key, addr]) => {
            const fullAddr = [
                addr.street,
                addr.district,
                addr.city,
                addr.zip,
                addr.country
            ].filter(Boolean).join(', ');
            html += row('adres', fullAddr);
        });
        html += `</div>`;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
    lucide.createIcons();
}

function editContactRedirect(id) {
    // Navigate to add-contact.html with ID
    // Since we are likely in an iframe, we just change our location
    window.location.href = `add-contact.html?id=${id}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
