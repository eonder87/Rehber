class ContactService {
    constructor() {
        this.apiUrl = '/api/contacts';
    }

    // Initialize: Fetch data from server
    async init() {
        // No local init needed really, we fetch fresh data on render
        // But for compatibility with existing code structure:
        return await this.getAll();
    }

    async getAll() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    }

    async add(contact) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contact),
            });
            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.warn('JSON parse error on fail', e);
                    errorData.message = 'Ekleme işlemi başarısız oldu';
                }

                if (response.status === 409) {
                    const conflictErr = new Error(errorData.message || 'Çakışma var');
                    conflictErr.conflictData = errorData;
                    throw conflictErr;
                }

                throw new Error(errorData.message || 'Bir hata oluştu');
            }
            return await this.getAll(); // Return updated list
        } catch (error) {
            console.error('Error adding contact:', error);
            throw error;
        }
    }

    async update(contact) {
        try {
            const response = await fetch(`${this.apiUrl}/${contact.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contact),
            });
            if (!response.ok) throw new Error('Güncelleme işlemi başarısız oldu');
            return await this.getAll();
        } catch (error) {
            console.error('Error updating contact:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Error deleting contact');
            return await this.getAll();
        } catch (error) {
            console.error('Error deleting contact:', error);
            throw error;
        }
    }

    // Export current data as JSON file (Download from client side based on fetched data)
    async exportDatabase() {
        const data = await this.getAll();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'rehber_db.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import currently not supported via server API in this simple version
    // But we could implement it if needed by POSTing multiple times or a bulk endpoint.
    // For now, let's keep the client-side helper but warn it might not persist perfectly without a bulk endpoint.
    async importDatabase(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        // Use Bulk Endpoint
                        const response = await fetch(`${this.apiUrl}/import`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });

                        if (!response.ok) throw new Error('Import failed');

                        resolve(data);
                    } else {
                        reject(new Error('Geçersiz format: JSON array bekleniyor.'));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

// Export singleton
const db = new ContactService();
