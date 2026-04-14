// patient-dashboard.js - Professional JavaScript for Patient Dashboard
// SES-compatible version with restricted APIs

(function() {
    'use strict';

    // SES-compatible storage wrapper
    const createStorageWrapper = function(storage) {
        return {
            getItem: function(key) {
                try {
                    return storage.getItem(key);
                } catch (e) {
                    return null;
                }
            },
            setItem: function(key, value) {
                try {
                    storage.setItem(key, value);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            removeItem: function(key) {
                try {
                    storage.removeItem(key);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        };
    };

    // SES-compatible fetch wrapper
    const safeFetch = function(url, options) {
        return fetch(url, options);
    };

    // SES-compatible DOM access
    const safeDOM = {
        querySelector: function(selector) {
            return document.querySelector(selector);
        },
        querySelectorAll: function(selector) {
            return Array.from(document.querySelectorAll(selector));
        },
        createElement: function(tag) {
            return document.createElement(tag);
        },
        getElementById: function(id) {
            return document.getElementById(id);
        },
        addEventListener: function(element, event, handler) {
            element.addEventListener(event, handler);
        },
        setTimeout: function(callback, delay) {
            return window.setTimeout(callback, delay);
        },
        clearTimeout: function(id) {
            window.clearTimeout(id);
        },
        setInterval: function(callback, delay) {
            return window.setInterval(callback, delay);
        },
        clearInterval: function(id) {
            window.clearInterval(id);
        }
    };

    // CSP-safe timeout functions
    function safeTimeout(callback, delay) {
        return safeDOM.setTimeout(callback, delay);
    }

    function safeClearTimeout(id) {
        safeDOM.clearTimeout(id);
    }

    // CSP-safe debounce function
    function safeDebounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = function() {
                safeClearTimeout(timeout);
                func(...args);
            };
            safeClearTimeout(timeout);
            timeout = safeTimeout(later, wait);
        };
    }

    // CSP-safe throttle function
    function safeThrottle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                safeTimeout(function() { inThrottle = false; }, limit);
            }
        }
    }

    class MediSyncApp {
        constructor() {
            this.currentPage = 'dashboard';
            this.userRole = this.getUserRole();
            this.userId = this.getUserId();
            this.theme = this.getStorageItem('theme') || 'light';
            this.charts = {};
            this.userData = {};
            this.apiBaseUrl = '/api';
            this.authToken = this.getAuthToken();
            this.isLoading = false;

            // Page mappings for different user roles
            this.pageRoutes = {
                patient: {
                    dashboard: 'static/patient/patient.html',
                    appointments: 'static/patient/appointments.html',
                    history: 'static/patient/history.html',
                    settings: 'static/patient/settings.html'
                },
                doctor: {
                    dashboard: 'static/doctor/doctor.html',
                    availability: 'static/doctor/doctor-availability.html',
                    history: 'static/doctor/doctor-history.html',
                    settings: 'static/doctor/doctor-settings.html'
                }
            };

            this.init();
        }

        getUserRole() {
            try {
                return this.getStorageItem('userRole') ||
                       this.getSessionItem('userRole') ||
                       this.getCookieValue('userRole') ||
                       'patient';
            } catch (e) {
                console.warn('Error getting user role:', e);
                return 'patient';
            }
        }

        getUserId() {
            try {
                return this.getStorageItem('userId') ||
                       this.getSessionItem('userId') ||
                       this.getCookieValue('userId');
            } catch (e) {
                console.warn('Error getting user ID:', e);
                return null;
            }
        }

        getStorageItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        }

        getSessionItem(key) {
            try {
                return sessionStorage.getItem(key);
            } catch (e) {
                return null;
            }
        }

        setStorageItem(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                return false;
            }
        }

        setSessionItem(key, value) {
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch (e) {
                return false;
            }
        }

        getCookieValue(name) {
            try {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            } catch (e) {
                return null;
            }
        }

        clearCookieValue(name) {
            try {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            } catch (e) {
                // Ignore errors in SES environment
            }
        }

        getAuthToken() {
            try {
                return this.getStorageItem('authToken') ||
                       this.getSessionItem('authToken') ||
                       this.getCookieValue('authToken');
            } catch (e) {
                console.warn('Error getting auth token:', e);
                return null;
            }
        }

        setAuthToken(token) {
            this.setStorageItem('authToken', token);
            this.authToken = token;
        }

        redirectToLogin() {
            try {
                window.location.href = '../login/index.html';
            } catch (e) {
                console.warn('Cannot redirect in SES environment');
            }
        }

        navigateToPage(page) {
            const pageUrl = this.pageRoutes[this.userRole]?.[page];
            if (pageUrl) {
                try {
                    window.location.href = pageUrl;
                } catch (e) {
                    console.warn('Cannot navigate in SES environment');
                }
            } else {
                console.warn(`Page ${page} not found for role ${this.userRole}`);
                this.showNotification('Page not accessible', 'warning');
            }
        }

        isCurrentPageAllowed() {
            try {
                const currentPath = window.location.pathname;
                const allowedPages = Object.values(this.pageRoutes[this.userRole] || {});
                return allowedPages.some(page => currentPath.includes(page));
            } catch (e) {
                return true;
            }
        }

    init() {
        // Check authentication - accept login-set data as valid
        const hasValidAuth = this.authToken || (this.getStorageItem('userRole') && this.getStorageItem('userId'));

        if (!hasValidAuth) {
            this.redirectToLogin();
            return;
        }

        // Set role from localStorage if not already set
        if (!this.userRole && this.getStorageItem('userRole')) {
            this.userRole = this.getStorageItem('userRole');
        }

        if (!this.userId && this.getStorageItem('userId')) {
            this.userId = this.getStorageItem('userId');
        }

        if (!this.isCurrentPageAllowed()) {
            this.navigateToPage('dashboard');
            return;
        }

        this.bindEvents();
        this.initializeCharts();
        this.applyTheme();
        this.updateActiveNav();
        this.loadUserData();
        this.addInterfaceIndicator();
    }

        bindEvents() {
            try {
                const navItems = safeDOM.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    safeDOM.addEventListener(item, 'click', (e) => {
                        e.preventDefault();
                        const page = e.currentTarget.dataset.page;
                        this.navigateTo(page);
                    });
                });

                const themeSwitch = safeDOM.getElementById('theme-switch');
                if (themeSwitch) {
                    safeDOM.addEventListener(themeSwitch, 'change', () => this.toggleTheme());
                }

                const logoutBtn = safeDOM.querySelector('.logout-btn');
                if (logoutBtn) {
                    safeDOM.addEventListener(logoutBtn, 'click', (e) => {
                        e.preventDefault();
                        this.handleLogout();
                    });
                }
            } catch (e) {
                console.warn('Cannot bind events in SES environment');
            }
        }

        async navigateTo(page) {
            if (this.isLoading) return;

            if (this.pageRoutes[this.userRole]?.[page]) {
                this.navigateToPage(page);
                return;
            }

            this.updateNavState(page);
            this.currentPage = page;
            try {
                window.location.hash = page;
            } catch (e) {
                // Ignore in SES environment
            }

            this.showPageLoading();

            try {
                await this.loadPageContent(page);
                this.updatePageTitle(page);
            } catch (error) {
                console.error(`Failed to load page ${page}:`, error);
                this.showErrorState();
            } finally {
                this.hidePageLoading();
            }
        }

        updateNavState(page) {
            try {
                const navItems = safeDOM.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    item.classList.toggle('active', item.dataset.page === page);
                });
            } catch (e) {
                console.warn('Cannot update nav state in SES environment');
            }
        }

        updatePageTitle(page) {
            const titles = {
                patient: {
                    dashboard: 'Patient Dashboard',
                    appointments: 'My Appointments',
                    history: 'Appointment History',
                    settings: 'Account Settings'
                },
                doctor: {
                    dashboard: 'Doctor Dashboard',
                    availability: 'Set Availability',
                    history: 'Appointment History',
                    settings: 'Account Settings'
                }
            };

            const roleTitles = titles[this.userRole] || titles.patient;
            try {
                const headerTitle = safeDOM.querySelector('.header h1');
                if (headerTitle) {
                    headerTitle.textContent = roleTitles[page] || `${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Dashboard`;
                }
            } catch (e) {
                console.warn('Cannot update page title in SES environment');
            }
        }

        async loadPageContent(page) {
            const methodName = `load${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)}${page.charAt(0).toUpperCase() + page.slice(1)}Data`;

            if (this[methodName]) {
                await this[methodName]();
            } else {
                switch (page) {
                    case 'dashboard':
                        await this.loadDashboardData();
                        break;
                    case 'appointments':
                    case 'availability':
                        await this.loadAppointmentsData();
                        break;
                    case 'history':
                        await this.loadHistoryData();
                        break;
                    case 'settings':
                        await this.loadSettingsData();
                        break;
                }
            }
        }

        handleUnauthorized() {
            this.clearStorageItem('authToken');
            this.clearStorageItem('userRole');
            this.clearStorageItem('userId');
            this.clearSessionItem('authToken');
            this.clearSessionItem('userRole');
            this.clearSessionItem('userId');
            this.clearCookieValue('authToken');
            this.clearCookieValue('userRole');
            this.clearCookieValue('userId');
            this.showNotification('Session expired. Please login again.', 'warning');
            safeTimeout(() => this.redirectToLogin(), 2000);
        }

        clearStorageItem(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                // Ignore errors in SES environment
            }
        }

        clearSessionItem(key) {
            try {
                sessionStorage.removeItem(key);
            } catch (e) {
                // Ignore errors in SES environment
            }
        }

        async apiRequest(endpoint, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                }
            };

            const config = Object.assign({}, defaultOptions, options);
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }

            try {
                const response = await safeFetch(`${this.apiBaseUrl}${endpoint}`, config);

                if (response.status === 401) {
                    this.handleUnauthorized();
                    throw new Error('Unauthorized');
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        }

        async handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    await this.apiRequest('/auth/logout', { method: 'POST' });
                } catch (error) {
                    console.warn('Logout API call failed, but proceeding with local logout:', error);
                }

                this.handleUnauthorized();
                this.redirectToLogin();
            }
        }

        async refreshData() {
            if (this.currentPage === 'dashboard') {
                await this.loadDashboardData();
            }
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(hours, minutes);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        showLoadingState(message = 'Loading...') {
            this.isLoading = true;

            try {
                let loader = safeDOM.querySelector('.global-loader');
                if (!loader) {
                    loader = safeDOM.createElement('div');
                    loader.className = 'global-loader';
                    loader.innerHTML = `
                        <div class="loader-backdrop"></div>
                        <div class="loader-content">
                            <div class="spinner"></div>
                            <p>${message}</p>
                        </div>
                    `;
                    document.body.appendChild(loader);
                } else {
                    const p = safeDOM.querySelector.call(loader, 'p');
                    if (p) {
                        p.textContent = message;
                    }
                    loader.style.display = 'flex';
                }
            } catch (e) {
                console.warn('Cannot show loading state in SES environment');
            }
        }

        hideLoadingState() {
            this.isLoading = false;
            try {
                const loader = safeDOM.querySelector('.global-loader');
                if (loader) {
                    loader.style.display = 'none';
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showPageLoading() {
            try {
                const mainContent = safeDOM.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.add('loading');
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        hidePageLoading() {
            try {
                const mainContent = safeDOM.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.remove('loading');
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showErrorState() {
            try {
                const mainContent = safeDOM.querySelector('.main-content');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h2>Something went wrong</h2>
                            <p>We couldn't load the page. Please try refreshing.</p>
                            <button class="btn-primary" onclick="window.location.reload()">Refresh Page</button>
                        </div>
                    `;
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showNotification(message, type = 'info', duration = 5000) {
            try {
                const notification = safeDOM.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="fas ${this.getNotificationIcon(type)}"></i>
                        <span>${message}</span>
                    </div>
                    <button class="notification-close">&times;</button>
                `;

                document.body.appendChild(notification);

                const timeoutId = safeTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, duration);

                const closeBtn = notification.querySelector('.notification-close');
                safeDOM.addEventListener(closeBtn, 'click', () => {
                    safeClearTimeout(timeoutId);
                    notification.remove();
                });
            } catch (e) {
                console.warn('Cannot show notification in SES environment:', message);
            }
        }

        getNotificationIcon(type) {
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            return icons[type] || icons.info;
        }

        debounce(func, wait) {
            return safeDebounce(func, wait);
        }

        throttle(func, limit) {
            return safeThrottle(func, limit);
        }

        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    safeTimeout(() => inThrottle = false, limit);
                }
            }
        }

        delegateEvent(eventType, selector, handler) {
            try {
                document.addEventListener(eventType, (e) => {
                    if (e.target.matches(selector) || e.target.closest(selector)) {
                        handler.call(this, e);
                    }
                });
            } catch (e) {
                console.warn('Cannot delegate event in SES environment');
            }
        }

        addInterfaceIndicator() {
            try {
                const indicator = safeDOM.createElement('div');
                indicator.className = 'interface-indicator';
                indicator.innerHTML = `
                    <i class="fas ${this.userRole === 'doctor' ? 'fa-user-md' : 'fa-user'}"></i>
                    ${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Interface
                `;

                safeDOM.addEventListener(indicator, 'click', () => {
                    this.showRoleSwitcher();
                });

                document.body.appendChild(indicator);

                safeTimeout(() => {
                    indicator.style.opacity = '0';
                    safeTimeout(() => indicator.remove(), 300);
                }, 5000);
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showRoleSwitcher() {
            try {
                const switcher = safeDOM.createElement('div');
                switcher.className = 'role-switcher-modal';
                switcher.innerHTML = `
                    <div class="role-switcher-overlay"></div>
                    <div class="role-switcher-content">
                        <h3>Switch Interface</h3>
                        <div class="role-options">
                            <button class="role-option ${this.userRole === 'patient' ? 'active' : ''}" data-role="patient">
                                <i class="fas fa-user"></i>
                                <span>Patient Interface</span>
                                <small>Manage your appointments</small>
                            </button>
                            <button class="role-option ${this.userRole === 'doctor' ? 'active' : ''}" data-role="doctor">
                                <i class="fas fa-user-md"></i>
                                <span>Doctor Interface</span>
                                <small>Manage your practice</small>
                            </button>
                        </div>
                        <button class="btn-cancel close-switcher">Cancel</button>
                    </div>
                `;

                const roleOptions = switcher.querySelectorAll('.role-option');
                roleOptions.forEach(option => {
                    safeDOM.addEventListener(option, 'click', (e) => {
                        const role = e.currentTarget.dataset.role;
                        if (role !== this.userRole) {
                            this.switchRole(role);
                        }
                        switcher.remove();
                    });
                });

                const closeBtn = switcher.querySelector('.close-switcher');
                safeDOM.addEventListener(closeBtn, 'click', () => {
                    switcher.remove();
                });

                const overlay = switcher.querySelector('.role-switcher-overlay');
                safeDOM.addEventListener(overlay, 'click', () => {
                    switcher.remove();
                });

                document.body.appendChild(switcher);
            } catch (e) {
                console.warn('Cannot show role switcher in SES environment');
            }
        }

        async switchRole(newRole) {
            if (!this.pageRoutes[newRole]) {
                this.showNotification('Role not available', 'warning');
                return;
            }

            try {
                const result = await this.apiRequest('/auth/switch-role', {
                    method: 'POST',
                    body: { role: newRole }
                });

                if (result.allowed) {
                    this.userRole = newRole;
                    this.setStorageItem('userRole', newRole);
                    this.navigateToPage('dashboard');
                } else {
                    this.showNotification('You do not have permission to access this role', 'error');
                }
            } catch (error) {
                console.error('Failed to switch role:', error);
                this.showNotification('Failed to switch interface', 'error');
            }
        }

        toggleTheme() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.setStorageItem('theme', this.theme);
            this.applyTheme();

            this.saveThemePreference();
        }

        async saveThemePreference() {
            try {
                await this.apiRequest('/user/preferences', {
                    method: 'PATCH',
                    body: { theme: this.theme }
                });
            } catch (error) {
                console.warn('Failed to save theme preference:', error);
            }
        }

        applyTheme() {
            try {
                document.documentElement.setAttribute('data-theme', this.theme);

                const themeSwitch = safeDOM.getElementById('theme-switch');
                if (themeSwitch) {
                    themeSwitch.checked = this.theme === 'dark';
                }
            } catch (e) {
                console.warn('Cannot apply theme in SES environment');
            }
        }

        // Placeholder methods to be overridden by subclasses
        async loadUserData() {
            // To be implemented by subclasses
        }

        async loadDashboardData() {
            // To be implemented by subclasses
        }

        async loadAppointmentsData() {
            // To be implemented by subclasses
        }

        async loadHistoryData() {
            // To be implemented by subclasses
        }

        async loadSettingsData() {
            // To be implemented by subclasses
        }
    }

    // Specialized classes for different user roles
    class PatientDashboard extends MediSyncApp {
        constructor() {
            super();
            this.patientData = {};
        }

    async loadUserData() {
        try {
            // First try to get data from localStorage (set by login)
            const firstName = this.getStorageItem('firstName');
            const lastName = this.getStorageItem('lastName');

            if (firstName && lastName) {
                this.patientData = {
                    firstName: firstName,
                    lastName: lastName,
                    email: this.getStorageItem('email'),
                    id: this.getStorageItem('userId')
                };
                this.updatePatientProfile(this.patientData);
            } else {
                // Fallback to API call
                this.patientData = await this.apiRequest('/patient/profile');
                this.updatePatientProfile(this.patientData);
            }
        } catch (error) {
            console.error('Failed to load patient data:', error);
            // Don't show error notification if we have localStorage data
            if (!this.getStorageItem('firstName')) {
                this.showNotification('Failed to load patient data', 'error');
            }
        }
    }

        async loadDashboardData() {
            try {
                const [stats, healthData, invitations] = await Promise.all([
                    this.apiRequest('/patient/dashboard/stats'),
                    this.apiRequest('/patient/health-data'),
                    this.apiRequest('/patient/appointment-invitations')
                ]);

                this.updateDashboardStats(stats);
                this.updateHealthCharts(healthData);
                this.updateInvitations(invitations);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                this.showNotification('Failed to load dashboard data', 'error');
            }
        }

        updatePatientProfile(data) {
            try {
                const avatarSpan = safeDOM.querySelector('.avatar-img span');
                const patientName = safeDOM.querySelector('.patient-info h4');

                if (avatarSpan) {
                    const initials = this.getInitials(data.firstName, data.lastName);
                    avatarSpan.textContent = initials;
                }

                if (patientName) {
                    patientName.textContent = `${data.firstName} ${data.lastName}`;
                }
            } catch (e) {
                console.warn('Cannot update patient profile in SES environment');
            }
        }

        getInitials(firstName, lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        updateDashboardStats(stats) {
            this.updateStatCard('totalAppointments', stats.totalAppointments || 0);
            this.updateStatCard('doctorsVisited', stats.doctorsVisited || 0);
            this.updateStatCard('activePrescriptions', stats.activePrescriptions || 0);
            this.updateStatCard('healthScore', `${stats.healthScore || 0}%`);
        }

        updateStatCard(statName, value) {
            try {
                const statCard = safeDOM.querySelector(`.stat-icon.${statName}`);
                if (statCard) {
                    const valueElement = statCard.closest('.stat-card').querySelector('.stat-info h3');
                    if (valueElement) {
                        valueElement.textContent = value;
                    }
                }
            } catch (e) {
                console.warn('Cannot update stat card in SES environment');
            }
        }
    }

    // Initialize the appropriate dashboard based on user role
    function initMediSync() {
        try {
            const userRole = createStorageWrapper(localStorage).getItem('userRole') ||
                            createStorageWrapper(sessionStorage).getItem('userRole') ||
                            'patient';

            let dashboardInstance;

            if (userRole === 'doctor') {
                dashboardInstance = new DoctorDashboard();
            } else {
                dashboardInstance = new PatientDashboard();
            }

            window.mediSyncApp = dashboardInstance;
        } catch (e) {
            console.error('Failed to initialize MediSync:', e);
        }
    }

    // Safe DOM ready handler
    function onDOMReady(callback) {
        if (document.readyState === 'loading') {
            try {
                safeDOM.addEventListener(document, 'DOMContentLoaded', callback);
            } catch (e) {
                safeTimeout(callback, 100);
            }
        } else {
            callback();
        }
    }

    onDOMReady(initMediSync);

})();