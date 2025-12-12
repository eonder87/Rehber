// Initialize Lucide icons
lucide.createIcons();

const exportJsonBtn = document.getElementById('export-json');
const exportVcfBtn = document.getElementById('export-vcf-btn'); // Updated ID
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');

// Events
exportJsonBtn.addEventListener('click', () => db.exportDatabase());

exportVcfBtn.addEventListener('click', async () => {
    const contacts = await db.getAll();
    if (contacts.length === 0) {
        alert('Dışa aktarılacak kişi yok.');
        return;
    }

    // Generate VCF Content
    let vcfContent = '';
    // Use WINDOWS-1254 (Latin-5) compatible newlines just in case (\r\n)
    const endl = '\r\n';
    contacts.forEach(c => {
        vcfContent += 'BEGIN:VCARD' + endl;
        vcfContent += 'VERSION:3.0' + endl;

        // Name components
        const parts = [
            c.lastName || '',
            c.firstName || '',
            c.middleName || '',
            c.prefix || '',
            c.suffix || ''
        ];
        vcfContent += `N:${parts.join(';')}${endl}`;
        vcfContent += `FN:${c.name}${endl}`;

        // Organization
        if (c.company) vcfContent += `ORG:${c.company}${endl}`;
        if (c.title) vcfContent += `TITLE:${c.title}${endl}`;

        // Phones
        if (c.phones && Object.keys(c.phones).length > 0) {
            Object.entries(c.phones).forEach(([key, val]) => {
                let type = 'VOICE';
                // Loose matching for mobile, mobile_2, mobile_3...
                if (key.startsWith('mobile')) type = 'CELL';
                else if (key.startsWith('home')) type = 'HOME';
                else if (key.startsWith('work')) type = 'WORK';

                vcfContent += `TEL;TYPE=${type}:${val}${endl}`;
            });
        } else if (c.phone) {
            vcfContent += `TEL;TYPE=CELL:${c.phone}${endl}`;
        }

        // Emails
        if (c.emails) {
            Object.entries(c.emails).forEach(([key, val]) => {
                let type = 'INTERNET';
                if (key.startsWith('home')) type = 'HOME';
                else if (key.startsWith('work')) type = 'WORK';
                vcfContent += `EMAIL;TYPE=${type}:${val}${endl}`;
            });
        }

        // URLs
        if (c.urls) {
            Object.values(c.urls).forEach(val => {
                vcfContent += `URL:${val}${endl}`;
            });
        }

        // Addresses
        if (c.addresses) {
            Object.entries(c.addresses).forEach(([key, addr]) => {
                let type = 'HOME'; // default
                if (key.includes('work')) type = 'WORK';

                // ADR format: ;;Street;City;Region;Zip;Country
                const street = addr.street || '';
                const city = addr.city || '';
                const district = addr.district || '';
                const zip = addr.zip || '';
                const country = addr.country || '';

                vcfContent += `ADR;TYPE=${type}:;;${street};${city};${district};${zip};${country}${endl}`;
            });
        }

        // Dates (Birthday)
        if (c.dates) {
            Object.entries(c.dates).forEach(([key, val]) => {
                if (key.includes('birthday')) {
                    vcfContent += `BDAY:${val}${endl}`;
                } else {
                    // X-ANNIVERSARY etc.
                    vcfContent += `item1.X-ABDATE:${val}${endl}`;
                    vcfContent += `item1.X-ABLabel:${key}${endl}`;
                }
            });
        }

        vcfContent += 'END:VCARD' + endl;
    });

    // Encoding Logic
    const encoding = document.getElementById('vcf-encoding').value;
    let blob;

    if (encoding === 'utf-8') {
        blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    } else {
        // Manual converting for ISO-8859-9 (Latin-5) and ISO-8859-15 (Latin-9)
        const bytes = new Uint8Array(vcfContent.length);
        for (let i = 0; i < vcfContent.length; i++) {
            let code = vcfContent.charCodeAt(i);

            // Map Turkish chars for Latin-5 (ISO-8859-9)
            if (encoding === 'iso-8859-9') {
                if (code === 0x011E) code = 0xD0; // Ğ
                else if (code === 0x011F) code = 0xF0; // ğ
                else if (code === 0x0130) code = 0xDD; // İ
                else if (code === 0x0131) code = 0xFD; // ı
                else if (code === 0x015E) code = 0xDE; // Ş
                else if (code === 0x015F) code = 0xFE; // ş
            }

            // Fallback for non-ASCII
            if (code > 255) code = 63; // '?'
            bytes[i] = code;
        }
        blob = new Blob([bytes], { type: `text/vcard;charset=${encoding}` });
    }

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'rehber.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

const exportCsvBtn = document.getElementById('export-csv');
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
        const contacts = await db.getAll();
        if (!contacts || contacts.length === 0) {
            alert('Dışa aktarılacak kişi yok.');
            return;
        }

        // CSV Header
        const headers = ["Ad", "Soyad", "Telefonlar", "E-Postalar", "Şirket", "Notlar"];
        let csvContent = headers.join(",") + "\n";

        // Rows
        contacts.forEach(c => {
            // Helper to escape CSV fields
            const escape = (txt) => {
                if (!txt) return "";
                let str = String(txt).replace(/"/g, '""');
                if (str.search(/("|,|\n)/g) >= 0) str = `"${str}"`;
                return str;
            };

            // Aggregate Phones
            let phoneStr = "";
            if (c.phones) phoneStr = Object.values(c.phones).join(" ; ");
            else if (c.phone) phoneStr = c.phone;

            // Aggregate Emails
            let emailStr = "";
            if (c.emails) emailStr = Object.values(c.emails).join(" ; ");

            const row = [
                escape(c.firstName),
                escape(c.lastName),
                escape(phoneStr),
                escape(emailStr),
                escape(c.company),
                escape(c.notes || "")
            ];
            csvContent += row.join(",") + "\n";
        });

        // Add BOM for Excel UTF-8
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rehber.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        try {
            await db.importDatabase(e.target.files[0]);
            alert('Veritabanı başarıyla güncellendi!');
        } catch (err) {
            alert('Hata: ' + err.message);
        }
        e.target.value = ''; // Reset
    }
});
