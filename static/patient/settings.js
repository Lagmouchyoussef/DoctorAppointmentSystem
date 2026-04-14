// Settings Page JavaScript

// Theme toggle functionality
const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    } else {
        document.body.removeAttribute('data-theme');
        themeSwitch.checked = false;
    }
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

class SettingsManager {
    constructor() {
        this.currentSection = 'profile';
        this.init();
    }

    init() {
        console.log('Initializing SettingsManager...');

        // Ensure DOM is ready before setting up everything
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupAll();
            });
        } else {
            // DOM is already ready
            setTimeout(() => {
                this.setupAll();
            }, 100); // Small delay to ensure everything is rendered
        }
    }

    setupAll() {
        console.log('Setting up all components...');

        this.setupNavigation();
        this.setupFormValidation();
        this.setupPasswordStrength();
        this.setupModalHandlers();
        this.setupToggleHandlers();
        this.setupPreferenceHandlers();
        this.setupAvatarHandlers();
        this.setupAvatarInitialsUpdate();
        this.setupNameChangeListeners();
        this.loadUserData();

        // Set default active section
        console.log('Setting default active section...');
        this.showSection('profile');
        const profileNavItem = document.querySelector('[data-section="profile"]');
        if (profileNavItem) {
            profileNavItem.classList.add('active');
            console.log('Profile nav item activated');
        } else {
            console.error('Profile nav item not found');
        }
    }

    setupNavigation() {
        console.log('Setting up navigation...');

        // Only target nav items in the settings navigation, not the sidebar
        const navItems = document.querySelectorAll('.settings-nav .nav-item');
        console.log('Navigation items found:', navItems.length);

        navItems.forEach((item, index) => {
            console.log(`Setting up nav item ${index}:`, item.dataset.section);

            item.addEventListener('click', (e) => {
                console.log('Nav item clicked:', item.dataset.section);
                e.preventDefault();
                e.stopPropagation();

                const sectionId = item.dataset.section;
                console.log('Switching to section:', sectionId);

                // Update navigation active state
                this.updateNavActive(sectionId);

                // Show section
                this.showSection(sectionId);
            });
        });
    }

    showSection(sectionId) {
        console.log('Showing section:', sectionId);

        // Hide all sections
        const allSections = document.querySelectorAll('.settings-section');
        console.log('Hiding sections, found:', allSections.length);

        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionId}-section`);
        console.log('Target section found:', !!targetSection);

        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Section activated successfully');
        } else {
            console.error('Target section not found:', `${sectionId}-section`);
        }
    }

    updateNavActive(sectionId) {
        console.log('Updating nav active state for:', sectionId);

        // Update navigation active state - only in settings nav
        document.querySelectorAll('.settings-nav .nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`.settings-nav [data-section="${sectionId}"]`);
        console.log('Active nav item found:', !!activeItem);

        if (activeItem) {
            activeItem.classList.add('active');
            console.log('Nav item activated successfully');
        } else {
            console.error('Active nav item not found for:', sectionId);
        }

        this.currentSection = sectionId;
    }

    setupFormValidation() {
        // Profile form validation
        const profileInputs = document.querySelectorAll('#profile-section input, #profile-section textarea');
        profileInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });

            input.addEventListener('input', (e) => {
                this.clearFieldError(e.target);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Invalid email address';
                }
                break;
            case 'phone':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
                    isValid = false;
                    errorMessage = 'Invalid phone number';
                }
                break;
            case 'first-name':
            case 'last-name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Minimum 2 characters required';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#dc3545';
        field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';

        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('small');
            errorElement.className = 'field-error';
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '12px';
            errorElement.style.marginTop = '4px';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        field.style.borderColor = 'var(--border-color)';
        field.style.boxShadow = 'none';

        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    setupPasswordStrength() {
        const newPasswordInput = document.getElementById('new-password');
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');

        if (newPasswordInput && strengthBar && strengthText) {
            newPasswordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);

                strengthBar.style.width = strength.percentage + '%';
                strengthBar.style.background = strength.color;
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            });
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) score += 25;
        else feedback.push('At least 8 characters');

        // Lowercase check
        if (/[a-z]/.test(password)) score += 25;
        else feedback.push('One lowercase letter');

        // Uppercase check
        if (/[A-Z]/.test(password)) score += 25;
        else feedback.push('One uppercase letter');

        // Number or special char check
        if (/[\d\W]/.test(password)) score += 25;
        else feedback.push('One number or special character');

        let percentage = score;
        let color = '#dc3545'; // red
        let text = 'Weak';

        if (score >= 75) {
            color = '#28a745'; // green
            text = 'Very Strong';
        } else if (score >= 50) {
            color = '#ffc107'; // yellow
            text = 'Medium';
        } else if (score >= 25) {
            color = '#fd7e14'; // orange
            text = 'Weak';
        }

        return { percentage, color, text, feedback };
    }

    setupModalHandlers() {
        // Password modal
        const passwordModalClose = document.getElementById('password-modal-close');
        const cancelPassword = document.getElementById('cancel-password');

        if (passwordModalClose) {
            passwordModalClose.addEventListener('click', () => this.closePasswordModal());
        }
        if (cancelPassword) {
            cancelPassword.addEventListener('click', () => this.closePasswordModal());
        }

        // Password form submission
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.id === 'password-modal') {
                this.closePasswordModal();
            }
        });
    }



    loadUserData() {
        // Load saved data from localStorage, default to empty
        const firstNameEl = document.getElementById('first-name');
        if (firstNameEl) firstNameEl.value = localStorage.getItem('firstName') || '';
        const lastNameEl = document.getElementById('last-name');
        if (lastNameEl) lastNameEl.value = localStorage.getItem('lastName') || '';
        const emailEl = document.getElementById('email');
        if (emailEl) emailEl.value = localStorage.getItem('email') || '';
        // Set userName from localStorage or empty
        const savedName = localStorage.getItem('userName') || '';
        if (savedName) localStorage.setItem('userName', savedName);
        // Load saved settings (simulate from localStorage or API)
        this.loadSavedSettings();
        // Load avatar and update initials/sidebar
        this.loadAvatar();
        this.updateSidebarName();
    }

    loadSavedSettings() {
        // Load preferences
        const savedTheme = localStorage.getItem('settings_theme') || 'light';
        const savedLanguage = localStorage.getItem('settings_language') || 'en';
        const savedTimezone = localStorage.getItem('settings_timezone') || 'Europe/Paris';
        const savedFontSize = localStorage.getItem('settings_fontSize') || 'medium';

        // Apply theme
        const themeInput = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
        if (themeInput) {
            themeInput.checked = true;
            this.applyTheme(savedTheme);
        }

        // Apply language
        const languageSelect = document.getElementById('language');
        if (languageSelect) languageSelect.value = savedLanguage;

        // Apply timezone
        const timezoneSelect = document.getElementById('timezone');
        if (timezoneSelect) timezoneSelect.value = savedTimezone;

        // Apply font size
        const fontSizeSelect = document.getElementById('font-size');
        if (fontSizeSelect) {
            fontSizeSelect.value = savedFontSize;
            this.applyFontSize(savedFontSize);
        }

        // Load notification settings (simulate some enabled)
        const notificationToggles = document.querySelectorAll('#notifications-section input[type="checkbox"]:not(.method-item input)');
        notificationToggles.forEach((toggle, index) => {
            // Enable first 3 by default
            if (index < 3) {
                toggle.checked = true;
                const toggleContainer = toggle.closest('.toggle');
                if (toggleContainer) toggleContainer.classList.add('active');
            }
        });

        // Load notification methods (enable email and SMS by default)
        const emailMethod = document.querySelector('.method-item input[name="email"]');
        const smsMethod = document.querySelector('.method-item input[name="sms"]');
        if (emailMethod) emailMethod.checked = true;
        if (smsMethod) smsMethod.checked = true;
    }

    openPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'block';
    }

    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        const passwordForm = document.getElementById('password-form');
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');

        if (modal) modal.style.display = 'none';
        if (passwordForm) passwordForm.reset();
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthText) strengthText.textContent = 'Password strength';
    }

    async saveAllSettings() {
        const saveBtn = document.getElementById('save-all-btn');
        const originalText = saveBtn.innerHTML;

        try {
            // Validate current section
            const currentSection = document.querySelector('.settings-section.active');
            const inputs = currentSection.querySelectorAll('input, textarea, select');

            let isValid = true;
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                throw new Error('Please correct the errors in the form');
            }

            // Show confirmation message for 2.5 seconds
            await this.showSaveConfirmation();

            // Show loading state
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;

            // Collect form data
            const formData = this.collectFormData();

            // Send to API
            const userId = localStorage.getItem('userId');
            const role = localStorage.getItem('role');
            const endpoint = role === 'patient' ? 'patients' : 'doctors';
            const apiUrl = `http://127.0.0.1:8001/api/${endpoint}/${userId}/`;

            const updateData = {
                first_name: formData['first-name'],
                last_name: formData['last-name'],
                email: formData['email']
            };

            const apiResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update profile');
            }

            // Update localStorage
            localStorage.setItem('firstName', formData['first-name']);
            localStorage.setItem('lastName', formData['last-name']);
            localStorage.setItem('email', formData['email']);
            localStorage.setItem('userName', `${formData['first-name']} ${formData['last-name']}`);

            // Save other settings to localStorage
            Object.keys(formData).forEach(key => {
                if (key !== 'first-name' && key !== 'last-name' && key !== 'email') {
                    if (typeof formData[key] === 'object') {
                        localStorage.setItem(`settings_${key}`, JSON.stringify(formData[key]));
                    } else {
                        localStorage.setItem(`settings_${key}`, formData[key]);
                    }
                }
            });

            // Show success feedback
            this.showSaveFeedback();

        } catch (error) {
            // If validation error, show alert
            if (error.message.includes('correct the errors')) {
                await alertModal.show(error.message, 'Validation Error', 'warning');
            } else {
                await alertModal.show(error.message || 'Error saving settings', 'Error', 'error');
            }
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    collectFormData() {
        const formData = {};

        // Profile data
        const profileFields = ['first-name', 'last-name', 'email', 'phone', 'birthdate', 'address', 'emergency-contact', 'emergency-phone'];
        profileFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                formData[field] = element.value;
            }
        });

        // Security settings
        formData.twoFactorEnabled = document.querySelector('#security-section input[type="checkbox"]').checked;

        // Notification settings
        const notificationToggles = document.querySelectorAll('#notifications-section input[type="checkbox"]:not(.method-item input)');
        formData.notifications = {};
        notificationToggles.forEach(toggle => {
            if (toggle.id) {
                formData.notifications[toggle.id] = toggle.checked;
            }
        });

        // Notification methods
        const notificationMethods = document.querySelectorAll('.method-item input[type="checkbox"]');
        formData.notificationMethods = {};
        notificationMethods.forEach(method => {
            formData.notificationMethods[method.name || method.id] = method.checked;
        });

        // Privacy settings
        const privacyToggles = document.querySelectorAll('#privacy-section input[type="checkbox"]');
        formData.privacy = {};
        privacyToggles.forEach(toggle => {
            const label = toggle.closest('.privacy-item').querySelector('h3').textContent.toLowerCase().replace(/\s+/g, '_');
            formData.privacy[label] = toggle.checked;
        });

        // Preferences
        formData.language = document.getElementById('language')?.value || 'en';
        formData.timezone = document.getElementById('timezone')?.value || 'Europe/Paris';
        formData.fontSize = document.getElementById('font-size')?.value || 'medium';
        formData.theme = document.querySelector('input[name="theme"]:checked')?.value || 'light';

        // Behavior settings
        const behaviorToggles = document.querySelectorAll('#preferences-section .preference-item .toggle input[type="checkbox"]');
        formData.behavior = {};
        behaviorToggles.forEach((toggle, index) => {
            const labels = ['animations', 'confirmation_before_deletion', 'automatic_reminders'];
            formData.behavior[labels[index]] = toggle.checked;
        });

        return formData;
    }

    setupToggleHandlers() {
        // Handle all toggle switches
        const toggles = document.querySelectorAll('.toggle input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const toggleElement = e.target;
                const toggleContainer = toggleElement.closest('.toggle');

                if (toggleContainer) {
                    if (toggleElement.checked) {
                        toggleContainer.classList.add('active');
                    } else {
                        toggleContainer.classList.remove('active');
                    }
                }

                // Save setting immediately
                this.saveSetting(toggleElement.id, toggleElement.checked);
            });
        });
    }

    setupPreferenceHandlers() {
        // Handle theme selection
        const themeInputs = document.querySelectorAll('input[name="theme"]');
        themeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                this.applyTheme(selectedTheme);
                this.saveSetting('theme', selectedTheme);
            });
        });

        // Handle language selection
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.saveSetting('language', e.target.value);
            });
        }

        // Handle timezone selection
        const timezoneSelect = document.getElementById('timezone');
        if (timezoneSelect) {
            timezoneSelect.addEventListener('change', (e) => {
                this.saveSetting('timezone', e.target.value);
            });
        }

        // Handle font size selection
        const fontSizeSelect = document.getElementById('font-size');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.applyFontSize(e.target.value);
                this.saveSetting('fontSize', e.target.value);
            });
        }

        // Handle notification method checkboxes
        const notificationMethods = document.querySelectorAll('.method-item input[type="checkbox"]');
        notificationMethods.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.saveSetting(`notification_${e.target.name}`, e.target.checked);
            });
        });

        // Handle data management actions
        const exportBtns = document.querySelectorAll('.export-btn');
        const cleanBtn = document.querySelector('.action-card:nth-child(2) button');
        const archiveBtn = document.querySelector('.action-card:nth-child(3) button');

        // Handle export buttons
        exportBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportData(format);
            });
        });

        if (cleanBtn) {
            cleanBtn.addEventListener('click', () => {
                this.showCleanHistoryModal();
            });
        }

        if (archiveBtn) {
            archiveBtn.addEventListener('click', async () => {
                await alertModal.show('Data archiving feature - Your data would be compressed and stored', 'Archiving', 'info');
            });
        }
    }

    applyTheme(theme) {
        const body = document.body;
        body.removeAttribute('data-theme');

        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
        } else if (theme === 'auto') {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                body.setAttribute('data-theme', 'dark');
            }
        }
        // For 'light', we don't set any data-theme attribute
    }

    applyFontSize(size) {
        const body = document.body;
        body.classList.remove('font-small', 'font-medium', 'font-large');

        if (size !== 'medium') {
            body.classList.add(`font-${size}`);
        }
    }

    async saveSetting(key, value) {
        try {
            // Simulate API call to save individual setting
            await new Promise(resolve => setTimeout(resolve, 500));

            // Could show a small success indicator here
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    }

    async showSaveConfirmation() {
        return new Promise(resolve => {
            // Create confirmation overlay
            const overlayHTML = `
                <div id="save-confirmation-overlay" class="save-confirmation-overlay">
                    <div class="confirmation-message">
                        <i class="fas fa-question-circle"></i>
                        <h3>Are you sure you want to clean old appointment history?</h3>
                        <p>Your settings will be saved and old data may be cleaned.</p>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', overlayHTML);

            const overlay = document.getElementById('save-confirmation-overlay');

            // Auto-confirm after 2.5 seconds
            setTimeout(() => {
                if (overlay) overlay.remove();
                resolve();
            }, 2500);
        });
    }

    showSaveFeedback() {
        const saveBtn = document.getElementById('save-all-btn');
        if (!saveBtn) return;

        const originalText = saveBtn.innerHTML;

        // Show success state
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveBtn.style.backgroundColor = '#28a745';

        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.backgroundColor = '';
        }, 2000);
    }

    async exportData(format) {
        try {
            // Show loading
            await alertModal.show(`Preparing your data export in ${format.toUpperCase()} format...`, 'Exporting', 'info');

            // Simulate data preparation
            const exportData = this.prepareExportData();
            let filename, content, mimeType;

            if (format === 'csv') {
                ({ filename, content, mimeType } = this.generateCSV(exportData));
            } else if (format === 'pdf') {
                ({ filename, content, mimeType } = await this.generatePDF(exportData));
            }

            // Download file
            this.downloadFile(filename, content, mimeType);

            // Show success
            await alertModal.show(`Your medical data has been exported successfully as ${format.toUpperCase()}!`, 'Export Complete', 'success');

        } catch (error) {
            console.error('Export error:', error);
            await alertModal.show('Failed to export data. Please try again.', 'Export Error', 'error');
        }
    }

    prepareExportData() {
        // Get current user data from localStorage or empty
        const userData = {
            firstName: localStorage.getItem('firstName') || '',
            lastName: localStorage.getItem('lastName') || '',
            email: localStorage.getItem('email') || '',
            phone: localStorage.getItem('phone') || '',
            birthdate: localStorage.getItem('birthdate') || '',
            address: localStorage.getItem('address') || ''
        };

        return {
            user: userData,
            appointments: [], // No demo appointments
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    generateCSV(data) {
        const headers = ['Date', 'Time', 'Doctor', 'Specialty', 'Status', 'Reason', 'Notes'];
        const rows = data.appointments.map(apt => [
            apt.date,
            apt.time,
            apt.doctorName,
            apt.specialty,
            apt.status,
            apt.reason || '',
            apt.notes || ''
        ]);

        // Add user info at the top
        const userInfo = [
            ['Patient Information'],
            ['Name', `${data.user.firstName} ${data.user.lastName}`],
            ['Email', data.user.email],
            ['Phone', data.user.phone],
            ['Birth Date', data.user.birthdate],
            ['Address', data.user.address],
            [''],
            ['Appointments'],
            headers,
            ...rows
        ];

        const csvContent = userInfo.map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        return {
            filename: `medical_data_${new Date().toISOString().split('T')[0]}.csv`,
            content: csvContent,
            mimeType: 'text/csv'
        };
    }

    async generatePDF(data) {
        // Simulate PDF generation (in a real app, you'd use a library like jsPDF)
        const pdfContent = `
MEDICAL DATA EXPORT
==================

Patient Information:
Name: ${data.user.firstName} ${data.user.lastName}
Email: ${data.user.email}
Phone: ${data.user.phone}
Birth Date: ${data.user.birthdate}
Address: ${data.user.address}

Appointments:
${data.appointments.map(apt =>
    `${apt.date} ${apt.time} - ${apt.doctorName} (${apt.specialty}) - ${apt.status}`
).join('\n')}

Export Date: ${data.exportDate}
Version: ${data.version}
        `;

        // In a real implementation, you'd generate actual PDF binary data
        // For demo purposes, we'll create a text file that simulates PDF content
        return {
            filename: `medical_data_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfContent,
            mimeType: 'application/pdf'
        };
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    showCleanHistoryModal() {
        const modalHTML = `
            <div id="clean-history-modal" class="modal">
                <div class="modal-content clean-confirmation">
                    <div class="modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Clean History</h3>
                        <span class="modal-close" id="clean-modal-close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="clean-warning">
                            <div class="warning-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="warning-content">
                                <h4>Are you sure you want to clean old appointment history?</h4>
                                <p>This action will permanently delete:</p>
                                <ul>
                                    <li>Appointments older than 2 years</li>
                                    <li>Associated medical notes and records</li>
                                    <li>Historical data that cannot be recovered</li>
                                </ul>
                                <p class="warning-text"><strong>This action cannot be undone.</strong></p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" id="cancel-clean" class="btn-secondary">Cancel</button>
                        <button type="button" id="confirm-clean" class="btn-warning">Clean History</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('clean-history-modal');
        const closeBtn = document.getElementById('clean-modal-close');
        const cancelBtn = document.getElementById('cancel-clean');
        const confirmBtn = document.getElementById('confirm-clean');

        const cleanup = () => {
            if (modal) modal.remove();
        };

        confirmBtn.addEventListener('click', async () => {
            cleanup();
            await alertModal.show('History cleaned - Old appointments removed', 'Success', 'success');
        });

        cancelBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) cleanup();
        });

        modal.style.display = 'block';
    }

    setupAvatarHandlers() {
        console.log('Setting up avatar handlers...');

        // Load avatar on page load
        this.loadAvatar();

        // Upload avatar button
        const uploadBtn = document.getElementById('upload-avatar-btn');
        console.log('Upload button found:', !!uploadBtn);

        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                console.log('Upload button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.uploadAvatar();
            });
        }

        // Delete avatar button
        const deleteBtn = document.getElementById('delete-avatar-btn');
        console.log('Delete button found:', !!deleteBtn);

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                console.log('Delete button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.deleteAvatar();
            });
        }
    }

    loadAvatar() {
        const savedImage = localStorage.getItem('userAvatar');
        const img = document.getElementById('profile-avatar');
        const placeholder = document.querySelector('.avatar-placeholder');

        if (savedImage) {
            img.src = savedImage;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'flex';
            img.style.display = 'none';
            this.updateAvatarInitials();
        }
        this.updateSidebarAvatar();
    }

    async uploadAvatar() {
        const input = document.getElementById('avatar-file-input');
        if (!input) return;

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Basic validations
            if (file.size > 10 * 1024 * 1024) { // 10MB max
                alert('File too large (max 10MB).');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Invalid file format. Please use images only.');
                return;
            }

            // Check image size
            const imageSize = await this.getImageDimensions(file);
            console.log('Image size:', imageSize);
            if (imageSize.width < 128 || imageSize.height < 128) {
                const proceed = confirm(`The selected image is small (${imageSize.width}x${imageSize.height}px). To avoid blurriness, use an image of at least 128x128px. Do you want to use it anyway?`);
                if (!proceed) return;
            }

            try {
                // Show loading indicator
                const uploadBtn = document.getElementById('upload-avatar-btn');
                const originalText = uploadBtn.innerHTML;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                uploadBtn.disabled = true;

                // Process image for quality
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const processedImage = await this.processImage(e.target.result);

                        // Display immediately
                        const img = document.getElementById('profile-avatar');
                        img.src = processedImage;
                        img.style.display = 'block';
                        document.querySelector('.avatar-placeholder').style.display = 'none';

                        // Save
                        localStorage.setItem('userAvatar', processedImage);
                        this.updateSidebarAvatar();

                        // Restore button
                        uploadBtn.innerHTML = originalText;
                        uploadBtn.disabled = false;

                        // Success message
                        await alertModal.show('Profile picture updated!', 'Success', 'success');

                    } catch (innerError) {
                        console.error('Processing error:', innerError);
                        // Fallback to simple base64
                        const img = document.getElementById('profile-avatar');
                        img.src = e.target.result;
                        img.style.display = 'block';
                        document.querySelector('.avatar-placeholder').style.display = 'none';
                        localStorage.setItem('userAvatar', e.target.result);
                        this.updateSidebarAvatar();

                        uploadBtn.innerHTML = originalText;
                        uploadBtn.disabled = false;
                    }
                };
                reader.readAsDataURL(file);

            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try again.');

                // Restore button on error
                const uploadBtn = document.getElementById('upload-avatar-btn');
                uploadBtn.innerHTML = '<i class="fas fa-camera"></i> Change';
                uploadBtn.disabled = false;
            }
        };

        input.click();
    }

    deleteAvatar() {
        this.showDeleteConfirmationModal();
    }

    showDeleteConfirmationModal() {
        const modalHTML = `
            <div id="delete-avatar-modal" class="modal">
                <div class="modal-content alert-card" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
                    </div>
                    <div class="modal-body">
                        <div class="alert-content">
                            <div class="alert-icon">
                                <i class="fas fa-question-circle text-blue-500"></i>
                            </div>
                            <div class="alert-message">
                                <p>Delete profile picture?</p>
                                <p style="font-size: 14px; color: #6b7280; margin-top: 8px;">This action cannot be undone.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button id="cancel-delete-avatar" class="btn-secondary">Cancel</button>
                        <button id="confirm-delete-avatar" class="btn-danger">Delete</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('delete-avatar-modal');
        const cancelBtn = document.getElementById('cancel-delete-avatar');
        const confirmBtn = document.getElementById('confirm-delete-avatar');

        const cleanup = () => {
            if (modal) modal.remove();
        };

        cancelBtn.addEventListener('click', cleanup);

        confirmBtn.addEventListener('click', () => {
            // Delete the avatar
            const img = document.getElementById('profile-avatar');
            img.src = '';
            img.style.display = 'none';
            localStorage.removeItem('userAvatar');

            const placeholder = document.querySelector('.avatar-placeholder');
            placeholder.style.display = 'flex';
            this.updateAvatarInitials();
            this.updateSidebarAvatar();

            cleanup();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) cleanup();
        });

        modal.style.display = 'block';
    }

    getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.src = URL.createObjectURL(file);
        });
    }

    async processImage(base64Data) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { naturalWidth: width, naturalHeight: height } = img;

                // Redimensionner si trop grand
                const maxSize = 512;
                if (Math.max(width, height) > maxSize) {
                    const ratio = maxSize / Math.max(width, height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Configuration for maximum quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.filter = 'none';

                ctx.drawImage(img, 0, 0, width, height);

                // PNG for lossless quality
                const processedDataUrl = canvas.toDataURL('image/png');
                resolve(processedDataUrl);
            };

            img.onerror = reject;
            img.src = base64Data;
        });
    }

    updateSidebarAvatar() {
        const avatarContainer = document.querySelector('.avatar-img');
        if (avatarContainer) {
            const savedImage = localStorage.getItem('userAvatar');
            const name = localStorage.getItem('userName') || '';

            // Remove any existing img or span
            const existingImg = avatarContainer.querySelector('img');
            const existingSpan = avatarContainer.querySelector('span');
            if (existingImg) existingImg.remove();
            if (existingSpan) existingSpan.remove();

            if (savedImage) {
                const img = document.createElement('img');
                img.src = savedImage;
                img.alt = 'Avatar';
                img.onload = () => {
                    img.style.display = 'block';
                    // Force le re-render pour appliquer les styles CSS
                    img.style.transform = 'translateZ(0)';
                };
                avatarContainer.appendChild(img);
                avatarContainer.style.backgroundColor = 'transparent';
            } else {
                const initials = name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() || '';
                const span = document.createElement('span');
                span.textContent = initials;
                avatarContainer.appendChild(span);
                avatarContainer.style.backgroundColor = '#f0f0f0';
            }
        }

        // Emit custom event to notify other pages
        window.dispatchEvent(new CustomEvent('avatarUpdated'));
    }

    setupNameChangeListeners() {
        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');

        if (firstNameInput) {
            firstNameInput.addEventListener('input', () => {
                this.updateSidebarName();
            });
        }

        if (lastNameInput) {
            lastNameInput.addEventListener('input', () => {
                this.updateSidebarName();
            });
        }
    }

    updateAvatarInitials() {
        const firstName = document.getElementById('first-name')?.value || '';
        const lastName = document.getElementById('last-name')?.value || '';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

        // Update profile page avatar
        const avatarPlaceholder = document.querySelector('.avatar-placeholder span');
        if (avatarPlaceholder) {
            avatarPlaceholder.textContent = initials;
        }

        // Update sidebar avatar
        const sidebarAvatar = document.querySelector('.avatar-img span');
        if (sidebarAvatar) {
            sidebarAvatar.textContent = initials;
        }
    }

    setupAvatarInitialsUpdate() {
        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');

        if (firstNameInput) {
            firstNameInput.addEventListener('input', () => {
                this.updateAvatarInitials();
                this.updateSidebarName();
            });
        }
        if (lastNameInput) {
            lastNameInput.addEventListener('input', () => {
                this.updateAvatarInitials();
                this.updateSidebarName();
            });
        }
    }

    updateSidebarName() {
        const firstName = document.getElementById('first-name')?.value || '';
        const lastName = document.getElementById('last-name')?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Store in localStorage
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('lastName', lastName);
        localStorage.setItem('userName', fullName);

        const sidebarName = document.querySelector('.patient-info h4');
        if (sidebarName) {
            sidebarName.textContent = fullName || ''; // Empty if no name
        }

        // Also update avatar initials
        this.updateSidebarAvatar();
    }

    // Global functions for HTML onclick handlers
    openPasswordModal() {
        this.openPasswordModal();
    }

    confirmDeleteAccount() {
        this.showDeleteAccountModal();
    }

    showDeleteAccountModal() {
        const modalHTML = `
            <div id="delete-account-modal-global" class="modal">
                <div class="modal-content delete-confirmation">
                    <div class="modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Delete Account</h3>
                        <span class="modal-close" id="delete-modal-close-global">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="delete-warning">
                            <div class="warning-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="warning-content">
                                <h4>Are you sure you want to permanently delete your account?</h4>
                                <p>This action is irreversible and will permanently delete:</p>
                                <ul>
                                    <li>All your medical records and appointments</li>
                                    <li>Your personal information and profile</li>
                                    <li>All your saved preferences and settings</li>
                                    <li>Your account access and history</li>
                                </ul>
                                <p class="warning-text"><strong>This action cannot be undone.</strong></p>
                            </div>
                        </div>
                        <div class="confirmation-input">
                            <label for="delete-confirmation-global">Type "DELETE" to confirm:</label>
                            <input type="text" id="delete-confirmation-global" placeholder="DELETE" class="form-input">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" id="cancel-delete-global" class="btn-secondary">Cancel</button>
                        <button type="button" id="confirm-delete-global" class="btn-danger" disabled>Delete Account</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('delete-account-modal-global');
        const closeBtn = document.getElementById('delete-modal-close-global');
        const cancelBtn = document.getElementById('cancel-delete-global');
        const confirmBtn = document.getElementById('confirm-delete-global');
        const input = document.getElementById('delete-confirmation-global');

        const cleanup = () => {
            if (modal) modal.remove();
        };

        const checkInput = () => {
            confirmBtn.disabled = input.value !== 'DELETE';
        };

        input.addEventListener('input', checkInput);

        confirmBtn.addEventListener('click', async () => {
            if (input.value === 'DELETE') {
                cleanup();
                await alertModal.show('Account deletion initiated. This would normally send a confirmation email.', 'Account Deletion', 'warning');
            }
        });

        cancelBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) cleanup();
        });

        modal.style.display = 'block';
    }

    openPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'block';
    }

    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        const passwordForm = document.getElementById('password-form');
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');

        if (modal) modal.style.display = 'none';
        if (passwordForm) passwordForm.reset();
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthText) strengthText.textContent = 'Password strength';
    }

    handlePasswordChange() {
        // Simulate password change
        alertModal.show('Password changed successfully!', 'Success', 'success');
        this.closePasswordModal();
    }
}

// Navigation functions are now handled by the SettingsManager class

// Debug function for troubleshooting
function debugSettingsPage() {
    console.log('=== DEBUGGING SETTINGS PAGE ===');

    // Check if elements exist
    const uploadBtn = document.getElementById('upload-avatar-btn');
    const deleteBtn = document.getElementById('delete-avatar-btn');
    const navItems = document.querySelectorAll('.settings-nav .nav-item');
    const sections = document.querySelectorAll('.settings-section');

    console.log('Upload button found:', !!uploadBtn);
    console.log('Delete button found:', !!deleteBtn);
    console.log('Nav items found:', navItems.length);
    console.log('Sections found:', sections.length);

    // Log nav items
    navItems.forEach((item, index) => {
        console.log(`Nav item ${index}:`, item.dataset.section);
    });

    // Test clicking buttons manually
    if (uploadBtn) {
        console.log('Upload button exists, testing click...');
        // Don't actually click to avoid file dialog
    }

    if (deleteBtn) {
        console.log('Delete button exists, testing click...');
        // Don't actually click to avoid confirmation dialog
    }

    return {
        uploadBtn: !!uploadBtn,
        deleteBtn: !!deleteBtn,
        navItems: navItems.length,
        sections: sections.length
    };
}

// Reset app to virgin state
function resetAppToVirgin() {
    // Clear all localStorage
    localStorage.clear();
    // Clear any session storage if used
    sessionStorage.clear();
    // Reload the page to reset all state
    window.location.reload();
}

// Make functions available globally
window.debugSettingsPage = debugSettingsPage;
window.resetAppToVirgin = resetAppToVirgin;

// Alert Modal System
class AlertModal {
    constructor() {
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div id="alert-modal" class="modal">
                <div class="modal-content alert-card">
                    <div class="modal-header">
                        <h3 id="alert-title"></h3>
                    </div>
                    <div class="modal-body">
                        <div class="alert-content">
                            <div class="alert-icon" id="alert-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="alert-message" id="alert-message"></div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button id="alert-close" class="btn-primary">OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.modal = document.getElementById('alert-modal');
        this.title = document.getElementById('alert-title');
        this.icon = document.getElementById('alert-icon');
        this.message = document.getElementById('alert-message');
        this.closeBtn = document.getElementById('alert-close');

        this.closeBtn.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show(message, title = 'Information', type = 'info') {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.message.textContent = message;

            // Set icon based on type
            const iconMap = {
                'success': 'fa-check-circle text-green-500',
                'error': 'fa-exclamation-triangle text-red-500',
                'warning': 'fa-exclamation-triangle text-yellow-500',
                'info': 'fa-info-circle text-blue-500'
            };

            this.icon.innerHTML = `<i class="fas ${iconMap[type] || iconMap.info}"></i>`;

            this.modal.style.display = 'block';

            // Auto-hide after 3 seconds for non-error types
            if (type !== 'error') {
                setTimeout(() => {
                    this.hide();
                    resolve();
                }, 3000);
            } else {
                // For errors, wait for user to close
                const originalHide = this.hide.bind(this);
                this.hide = () => {
                    originalHide();
                    resolve();
                };
            }
        });
    }

    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

// Initialize alert modal
const alertModal = new AlertModal();

// Initialize settings manager
window.settingsManager = new SettingsManager();

// Global functions for HTML onclick handlers
window.openPasswordModal = () => window.settingsManager.openPasswordModal();
window.confirmDeleteAccount = () => window.settingsManager.confirmDeleteAccount();