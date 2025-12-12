/**
 * Phone Number Utilities
 * Comprehensive International Phone Number Formatting and Validation
 */

// Comprehensive list of Country Codes and their common masks
// '#' represents a digit.
const COUNTRY_FORMATS = {
    // North America (NANP)
    "+1": { mask: "(###) ###-####", name: "USA/Canada" },

    // Europe
    "+7": { mask: "(###) ###-##-##", name: "Russia/Kazakhstan" },
    "+20": { mask: "### ### ####", name: "Egypt" },
    "+27": { mask: "## ### ####", name: "South Africa" },
    "+30": { mask: "### ### ####", name: "Greece" },
    "+31": { mask: "## ########", name: "Netherlands" },
    "+32": { mask: "### ## ## ##", name: "Belgium" },
    "+33": { mask: "# ## ## ## ##", name: "France" },
    "+34": { mask: "### ## ## ##", name: "Spain" },
    "+36": { mask: "## ### ####", name: "Hungary" },
    "+39": { mask: "### #### ###", name: "Italy" }, // Mobile
    "+40": { mask: "## ### ####", name: "Romania" },
    "+41": { mask: "## ### ## ##", name: "Switzerland" },
    "+43": { mask: "### #######", name: "Austria" },
    "+44": { mask: "#### ######", name: "UK" },
    "+45": { mask: "## ## ## ##", name: "Denmark" },
    "+46": { mask: "## ### ## ##", name: "Sweden" },
    "+47": { mask: "### ## ###", name: "Norway" },
    "+48": { mask: "### ### ###", name: "Poland" },
    "+49": { mask: "(###) #######", name: "Germany" }, // Variable
    "+51": { mask: "### ### ###", name: "Peru" },
    "+52": { mask: "## #### ####", name: "Mexico" },
    "+54": { mask: "# ## #### ####", name: "Argentina" },
    "+55": { mask: "(##) #####-####", name: "Brazil" },
    "+56": { mask: "# #### ####", name: "Chile" },
    "+57": { mask: "### ### ####", name: "Colombia" },
    "+58": { mask: "### ### ####", name: "Venezuela" },
    "+60": { mask: "##-### ####", name: "Malaysia" },
    "+61": { mask: "# #### ####", name: "Australia" },
    "+62": { mask: "###-####-####", name: "Indonesia" },
    "+63": { mask: "### ### ####", name: "Philippines" },
    "+64": { mask: "## ### ####", name: "New Zealand" },
    "+65": { mask: "#### ####", name: "Singapore" },
    "+66": { mask: "## ### ####", name: "Thailand" },
    "+81": { mask: "##-####-####", name: "Japan" },
    "+82": { mask: "##-###-####", name: "South Korea" },
    "+84": { mask: "### ### ####", name: "Vietnam" },
    "+86": { mask: "### #### ####", name: "China" },
    "+90": { mask: "(###) ### ## ##", name: "Turkey" },
    "+91": { mask: "##### #####", name: "India" },
    "+92": { mask: "### #######", name: "Pakistan" },
    "+93": { mask: "## ### ####", name: "Afghanistan" },
    "+94": { mask: "## ### ####", name: "Sri Lanka" },
    "+95": { mask: "## ### ####", name: "Myanmar" },
    "+98": { mask: "### ### ####", name: "Iran" },

    // Middle East
    "+960": { mask: "###-####", name: "Maldives" },
    "+961": { mask: "## ######", name: "Lebanon" },
    "+962": { mask: "# #### ####", name: "Jordan" },
    "+963": { mask: "## #### ###", name: "Syria" },
    "+964": { mask: "### ### ####", name: "Iraq" },
    "+965": { mask: "#### ####", name: "Kuwait" },
    "+966": { mask: "## ### ####", name: "Saudi Arabia" },
    "+967": { mask: "### ### ###", name: "Yemen" },
    "+968": { mask: "#### ####", name: "Oman" },
    "+971": { mask: "## ### ####", name: "UAE" },
    "+972": { mask: "##-###-####", name: "Israel" },
    "+973": { mask: "#### ####", name: "Bahrain" },
    "+974": { mask: "#### ####", name: "Qatar" },
    // Africa
    "+212": { mask: "##-####-##", name: "Morocco" },
    "+213": { mask: "## ## ## ## ##", name: "Algeria" },
    "+216": { mask: "## ### ###", name: "Tunisia" },
    "+218": { mask: "##-#######", name: "Libya" },
    "+220": { mask: "### ####", name: "Gambia" },
    "+221": { mask: "## ### ## ##", name: "Senegal" },
    "+222": { mask: "## ## ## ##", name: "Mauritania" },
    "+234": { mask: "### ### ####", name: "Nigeria" },
    "+254": { mask: "### ######", name: "Kenya" },
    // Others
    "+351": { mask: "## ### ####", name: "Portugal" },
    "+352": { mask: "### #####", name: "Luxembourg" },
    "+353": { mask: "## ### ####", name: "Ireland" },
    "+354": { mask: "### ####", name: "Iceland" },
    "+355": { mask: "## ### ####", name: "Albania" },
    "+356": { mask: "#### ####", name: "Malta" },
    "+357": { mask: "## ######", name: "Cyprus" },
    "+358": { mask: "## ### ## ##", name: "Finland" },
    "+359": { mask: "## ### ####", name: "Bulgaria" },
    "+370": { mask: "### #####", name: "Lithuania" },
    "+371": { mask: "## ######", name: "Latvia" },
    "+372": { mask: "#### ####", name: "Estonia" },
    "+375": { mask: "## ###-##-##", name: "Belarus" },
    "+380": { mask: "(##) ###-##-##", name: "Ukraine" },
    "+381": { mask: "## ### ####", name: "Serbia" },
    "+385": { mask: "## ### ####", name: "Croatia" },
    "+386": { mask: "## ### ###", name: "Slovenia" },
    "+387": { mask: "## ### ###", name: "Bosnia" },
    "+389": { mask: "## ### ###", name: "Macedonia" },

    // Add generic fallback for unknown
    "default": { mask: "##########", name: "Unknown" }
};

// Helper to find the best matching country code
function findCountryFormat(val) {
    if (!val.startsWith('+')) return null;

    // Check for longest matching code (e.g. +1246 vs +1)
    // Keys like +90, +1
    let bestMatch = null;
    let bestLen = 0;

    for (const code in COUNTRY_FORMATS) {
        if (code === 'default') continue;
        if (val.startsWith(code)) {
            if (code.length > bestLen) {
                bestLen = code.length;
                bestMatch = code;
            }
        }
    }
    return bestMatch ? { code: bestMatch, ...COUNTRY_FORMATS[bestMatch] } : null;
}

// Format phone number based on country code
window.smartFormatPhone = (val) => {
    // 1. Strip all non-numeric characters EXCEPT '+' at start
    let cleaned = val.replace(/[^\d+]/g, '');

    if (!cleaned) return '';
    if (!cleaned.startsWith('+')) return cleaned;

    const match = findCountryFormat(cleaned);

    if (match) {
        const mask = match.mask;
        const code = match.code;
        // Raw numbers after country code
        let raw = cleaned.substring(code.length);

        let formatted = code;
        let rawIndex = 0;

        // Loop through mask
        // If mask char is #, take from raw
        // Else, append mask char (space, dash, parenthesis)
        // If raw is empty, stop appending mask chars that are trailing

        // We append the separator characters IFF we have more numbers coming
        // Except for the first separator maybe?

        // Better approach: Build string char by char
        // But we want to handle partial input nicely.

        let afterCode = "";
        for (let i = 0; i < mask.length; i++) {
            const m = mask[i];
            if (m === '#') {
                if (rawIndex < raw.length) {
                    afterCode += raw[rawIndex++];
                } else {
                    break; // No more numbers
                }
            } else {
                // It's a separator. Only add if we have more numbers to show,
                // OR if it's an opening parenthesis at the start?
                // Simple logic: Add if we haven't exhausted raw OR if it's just formatting
                // To avoid trailing separators like "+90 " or "+90 (", we should check
                if (rawIndex < raw.length) {
                    afterCode += m;
                }
            }
        }

        // Add remaining raw numbers if any (overflow)
        if (rawIndex < raw.length) {
            afterCode += raw.substring(rawIndex);
        }

        // Add a space between code and the rest if not present
        if (afterCode.length > 0 && !mask.startsWith(' ') && !mask.startsWith('(')) {
            return formatted + ' ' + afterCode;
        }

        return formatted + (afterCode ? ' ' + afterCode : '');
    }

    // No match, return as is
    return cleaned;
};

// Event Handler
window.formatPhoneInput = (input) => {
    const oldVal = input.value;
    const newVal = smartFormatPhone(oldVal);
    // Only update if changed and cursor management is tricky. 
    // For simple append, this is fine. For deleting, it can be jumpy.
    if (oldVal !== newVal) {
        input.value = newVal;
    }
};

/**
 * Validates all phone inputs.
 * Checks for:
 * 1. Must start with +
 * 2. Must match a known country code
 */
window.validatePhoneInputs = () => {
    const phoneInputs = document.querySelectorAll('.phone-input');
    for (let input of phoneInputs) {
        const val = input.value.trim();
        if (!val) continue;

        if (!val.startsWith('+')) {
            alert('Telefon numarası "+" ile başlayan geçerli bir Ülke Kodu içermelidir (Örn: +90...).');
            input.focus();
            return false;
        }

        const match = findCountryFormat(val);
        if (!match) {
            alert('Telefon numarası bilinmeyen bir ülke kodu içeriyor. Lütfen geçerli bir kod girin (Örn: +90, +1, +49).');
            input.focus();
            return false;
        }

        // Optional: Check length?
        // Count digits
        // let digits = val.replace(/[^\d]/g, '').length;
        // let codeDigits = match.code.length - 1; // remove +
        // let expectedDigits = match.mask.split('#').length - 1 + codeDigits;
        // if (digits !== expectedDigits) ...
        // For now, Strict Country Code check is sufficient per request.
    }
    return true;
};
