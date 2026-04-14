// doctor-dashboard.js - SES-compatible Doctor Dashboard
// Completely SES-safe implementation

(function() {
    'use strict';

    // SES-safe wrappers for restricted APIs
    const safeAPIs = {
        // Storage APIs
        localStorage: {
            getItem: function(key) {
                try {
                    return window.localStorage.getItem(key);
                } catch (e) {
                    return null;
                }
            },
            setItem: function(key, value) {
                try {
                    window.localStorage.setItem(key, value);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            removeItem: function(key) {
                try {
                    window.localStorage.removeItem(key);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        },

        sessionStorage: {
            getItem: function(key) {
                try {
                    return window.sessionStorage.getItem(key);
                } catch (e) {
                    return null;
                }
            },
            setItem: function(key, value) {
                try {
                    window.sessionStorage.setItem(key, value);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            removeItem: function(key) {
                try {
                    window.sessionStorage.removeItem(key);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        },

        // DOM APIs
        document: {
            querySelector: function(selector) {
                return window.document.querySelector(selector);
            },
            querySelectorAll: function(selector) {
                return Array.from(window.document.querySelectorAll(selector));
            },
            createElement: function(tag) {
                return window.document.createElement(tag);
            },
            getElementById: function(id) {
                return window.document.getElementById(id);
            },
            addEventListener: function(element, event, handler) {
                element.addEventListener(event, handler);
            },
            body: window.document.body
        },

        // Window APIs
        window: {
            location: {
                href: window.location.href,
                pathname: window.location.pathname,
                hash: window.location.hash
            },
            addEventListener: function(event, handler) {
                window.addEventListener(event, handler);
            },
            setTimeout: function(callback, delay) {
                return window.setTimeout(callback, delay);
            },
            clearTimeout: function(id) {
                window.clearTimeout(id);
            },
            alert: function(message) {
                window.alert(message);
            },
            confirm: function(message) {
                return window.confirm(message);
            }
        },

        // Network API
        fetch: function(url, options) {
            return window.fetch(url, options);
        },

        // Console API
        console: {
            log: function(...args) {
                if (window.console && window.console.log) {
                    window.console.log.apply(window.console, args);
                }
            },
            error: function(...args) {
                if (window.console && window.console.error) {
                    window.console.error.apply(window.console, args);
                }
            },
            warn: function(...args) {
                if (window.console && window.console.warn) {
                    window.console.warn.apply(window.console, args);
                }
            }
        }
    };

    // Safe cookie functions
    function getCookie(name) {
        try {
            const value = '; ' + window.document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        } catch (e) {
            return null;
        }
    }

    function setCookie(name, value, days) {
        try {
            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            window.document.cookie = name + '=' + value + expires + '; path=/';
            return true;
        } catch (e) {
            return false;
        }
    }

    // MediSyncApp class with SES-safe APIs
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
            return this.getStorageItem('userRole') ||
                   this.getSessionItem('userRole') ||
                   getCookie('userRole') ||
                   'doctor';
        }

        getUserId() {
            return this.getStorageItem('userId') ||
                   this.getSessionItem('userId') ||
                   getCookie('userId');
        }

        getStorageItem(key) {
            return safeAPIs.localStorage.getItem(key);
        }

        getSessionItem(key) {
            return safeAPIs.sessionStorage.getItem(key);
        }

        setStorageItem(key, value) {
            return safeAPIs.localStorage.setItem(key, value);
        }

        setSessionItem(key, value) {
            return safeAPIs.sessionStorage.setItem(key, value);
        }

        getAuthToken() {
            return this.getStorageItem('authToken') ||
                   this.getSessionItem('authToken') ||
                   getCookie('authToken');
        }

        setAuthToken(token) {
            this.setStorageItem('authToken', token);
            this.authToken = token;
        }

        redirectToLogin() {
            try {
                safeAPIs.window.location.href = '../login/index.html';
            } catch (e) {
                safeAPIs.console.warn('Cannot redirect in SES environment');
            }
        }

        navigateToPage(page) {
            const pageUrl = this.pageRoutes[this.userRole]?.[page];
            if (pageUrl) {
                try {
                    safeAPIs.window.location.href = pageUrl;
                } catch (e) {
                    safeAPIs.console.warn('Cannot navigate in SES environment');
                }
            } else {
                safeAPIs.console.warn('Page ' + page + ' not found for role ' + this.userRole);
                this.showNotification('Page not accessible', 'warning');
            }
        }

        isCurrentPageAllowed() {
            try {
                const currentPath = safeAPIs.window.location.pathname;
                const allowedPages = Object.values(this.pageRoutes[this.userRole] || {});
                return allowedPages.some(function(page) {
                    return currentPath.includes(page);
                });
            } catch (e) {
                return true;
            }
        }

        init() {
            const hasValidAuth = this.authToken || (this.getStorageItem('userRole') && this.getStorageItem('userId'));

            if (!hasValidAuth) {
                this.redirectToLogin();
                return;
            }

            if (!this.isCurrentPageAllowed()) {
                this.navigateToPage('dashboard');
                return;
            }

            this.bindEvents();
            // initializeCharts() - placeholder for chart initialization
            this.applyTheme();
            // updateActiveNav() - placeholder for nav state update
            this.loadUserData();
            this.addInterfaceIndicator();
        }

        bindEvents() {
            try {
                const navItems = window.document.querySelectorAll('.nav-item');
                const self = this;

                navItems.forEach(function(item) {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        const page = e.currentTarget.dataset.page;
                        self.navigateTo(page);
                    });
                });

                const themeSwitch = window.document.getElementById('theme-switch');
                if (themeSwitch) {
                    themeSwitch.addEventListener('change', function() {
                        self.toggleTheme();
                    });
                }

                const logoutBtn = window.document.querySelector('.logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        self.handleLogout();
                    });
                }
            } catch (e) {
                console.warn('Cannot bind events:', e);
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
                safeAPIs.window.location.hash = page;
            } catch (e) {
                // Ignore in SES environment
            }

            this.showPageLoading();

            try {
                await this.loadPageContent(page);
                this.updatePageTitle(page);
            } catch (error) {
                safeAPIs.console.error('Failed to load page ' + page + ':', error);
                this.showErrorState();
            } finally {
                this.hidePageLoading();
            }
        }

        updateNavState(page) {
            try {
                const navItems = window.document.querySelectorAll('.nav-item');
                navItems.forEach(function(item) {
                    item.classList.toggle('active', item.dataset.page === page);
                });
            } catch (e) {
                console.warn('Cannot update nav state:', e);
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

            const roleTitles = titles[this.userRole] || titles.doctor;
            try {
                const headerTitle = window.document.querySelector('.header h1');
                if (headerTitle) {
                    headerTitle.textContent = roleTitles[page] || this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1) + ' Dashboard';
                }
            } catch (e) {
                console.warn('Cannot update page title:', e);
            }
        }

        async loadPageContent(page) {
            const methodName = 'load' + this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1) + page.charAt(0).toUpperCase() + page.slice(1) + 'Data';

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
            this.clearCookie('authToken');
            this.clearCookie('userRole');
            this.clearCookie('userId');
            this.showNotification('Session expired. Please login again.', 'warning');
            safeAPIs.window.setTimeout(function() {
                this.redirectToLogin();
            }.bind(this), 2000);
        }

        clearStorageItem(key) {
            return safeAPIs.localStorage.removeItem(key);
        }

        clearSessionItem(key) {
            return safeAPIs.sessionStorage.removeItem(key);
        }

        clearCookie(name) {
            try {
                window.document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            } catch (e) {
                // Ignore errors in SES environment
            }
        }

        async apiRequest(endpoint, options) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.authToken
                }
            };

            const config = Object.assign({}, defaultOptions, options);
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }

            try {
                const response = await safeAPIs.fetch(this.apiBaseUrl + endpoint, config);

                if (response.status === 401) {
                    this.handleUnauthorized();
                    throw new Error('Unauthorized');
                }

                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }

                return await response.json();
            } catch (error) {
                safeAPIs.console.error('API request failed:', error);
                throw error;
            }
        }

        async handleLogout() {
            if (safeAPIs.window.confirm('Are you sure you want to logout?')) {
                try {
                    await this.apiRequest('/auth/logout', { method: 'POST' });
                } catch (error) {
                    safeAPIs.console.warn('Logout API call failed, but proceeding with local logout:', error);
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
            const parts = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(parts[0]), parseInt(parts[1]));
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        showLoadingState(message) {
            this.isLoading = true;

            try {
                let loader = window.document.querySelector('.global-loader');
                if (!loader) {
                    loader = window.document.createElement('div');
                    loader.className = 'global-loader';
                    loader.innerHTML = `
                        <div class="loader-backdrop"></div>
                        <div class="loader-content">
                            <div class="spinner"></div>
                            <p>${message || 'Loading...'}</p>
                        </div>
                    `;
                    window.document.body.appendChild(loader);
                } else {
                    const p = window.document.querySelector.call(loader, 'p');
                    if (p) {
                        p.textContent = message || 'Loading...';
                    }
                    loader.style.display = 'flex';
                }
            } catch (e) {
                console.warn('Cannot show loading state:', e);
            }
        }

        hideLoadingState() {
            this.isLoading = false;
            try {
                const loader = window.document.querySelector('.global-loader');
                if (loader) {
                    loader.style.display = 'none';
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showPageLoading() {
            try {
                const mainContent = window.document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.add('loading');
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        hidePageLoading() {
            try {
                const mainContent = window.document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.classList.remove('loading');
                }
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showErrorState() {
            try {
                const mainContent = safeAPIs.document.querySelector('.main-content');
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

        showNotification(message, type, duration) {
            type = type || 'info';
            duration = duration || 5000;

            try {
                const notification = safeAPIs.document.createElement('div');
                notification.className = 'notification notification-' + type;
                notification.innerHTML = `
                    <div class="notification-content">
                        <i class="fas ${this.getNotificationIcon(type)}"></i>
                        <span>${message}</span>
                    </div>
                    <button class="notification-close">&times;</button>
                `;

                safeAPIs.document.body.appendChild(notification);

                const timeoutId = safeAPIs.window.setTimeout(function() {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, duration);

                const closeBtn = safeAPIs.document.querySelector.call(notification, '.notification-close');
                safeAPIs.document.addEventListener(closeBtn, 'click', function() {
                    safeAPIs.window.clearTimeout(timeoutId);
                    notification.remove();
                });
            } catch (e) {
                safeAPIs.console.warn('Cannot show notification in SES environment:', message);
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
            let timeout;
            return function executedFunction() {
                const args = arguments;
                const later = function() {
                    safeAPIs.window.clearTimeout(timeout);
                    func.apply(null, args);
                };
                safeAPIs.window.clearTimeout(timeout);
                timeout = safeAPIs.window.setTimeout(later, wait);
            };
        }

        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    safeAPIs.window.setTimeout(function() { inThrottle = false; }, limit);
                }
            };
        }

        delegateEvent(eventType, selector, handler) {
            try {
                safeAPIs.document.addEventListener(safeAPIs.document.body, eventType, function(e) {
                    if (e.target.matches(selector) || e.target.closest(selector)) {
                        handler.call(this, e);
                    }
                });
            } catch (e) {
                safeAPIs.console.warn('Cannot delegate event in SES environment');
            }
        }

        addInterfaceIndicator() {
            try {
                const indicator = safeAPIs.document.createElement('div');
                indicator.className = 'interface-indicator';
                indicator.innerHTML = `
                    <i class="fas ${this.userRole === 'doctor' ? 'fa-user-md' : 'fa-user'}"></i>
                    ${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Interface
                `;

                safeAPIs.document.addEventListener(indicator, 'click', function() {
                    this.showRoleSwitcher();
                }.bind(this));

                safeAPIs.document.body.appendChild(indicator);

                safeAPIs.window.setTimeout(function() {
                    indicator.style.opacity = '0';
                    safeAPIs.window.setTimeout(function() { indicator.remove(); }, 300);
                }, 5000);
            } catch (e) {
                // Ignore in SES environment
            }
        }

        showRoleSwitcher() {
            try {
                const switcher = safeAPIs.document.createElement('div');
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

                const roleOptions = safeAPIs.document.querySelectorAll.call(switcher, '.role-option');
                const self = this;
                roleOptions.forEach(function(option) {
                    safeAPIs.document.addEventListener(option, 'click', function(e) {
                        const role = e.currentTarget.dataset.role;
                        if (role !== self.userRole) {
                            self.switchRole(role);
                        }
                        switcher.remove();
                    });
                });

                const closeBtn = safeAPIs.document.querySelector.call(switcher, '.close-switcher');
                safeAPIs.document.addEventListener(closeBtn, 'click', function() {
                    switcher.remove();
                });

                const overlay = safeAPIs.document.querySelector.call(switcher, '.role-switcher-overlay');
                safeAPIs.document.addEventListener(overlay, 'click', function() {
                    switcher.remove();
                });

                safeAPIs.document.body.appendChild(switcher);
            } catch (e) {
                safeAPIs.console.warn('Cannot show role switcher in SES environment');
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
                safeAPIs.console.error('Failed to switch role:', error);
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
                safeAPIs.console.warn('Failed to save theme preference:', error);
            }
        }

        applyTheme() {
            try {
                safeAPIs.document.body.parentElement.setAttribute('data-theme', this.theme);

                const themeSwitch = safeAPIs.document.getElementById('theme-switch');
                if (themeSwitch) {
                    themeSwitch.checked = this.theme === 'dark';
                }
            } catch (e) {
                safeAPIs.console.warn('Cannot apply theme in SES environment');
            }
        }

        initializeCharts() {
            // Placeholder method for chart initialization
            // Can be overridden by subclasses
            safeAPIs.console.log('Charts initialization placeholder');
        }

        updateActiveNav() {
            // Placeholder method for navigation state update
            // Can be overridden by subclasses
            safeAPIs.console.log('Navigation update placeholder');
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

        // Additional placeholder methods for dashboard functionality
        addGlobalNavigation() {
            // Placeholder for global navigation
            safeAPIs.console.log('Global navigation placeholder');
        }
    }

    // DoctorDashboard class
    class DoctorDashboard extends MediSyncApp {
        constructor() {
            super();
            this.doctorData = {};
        }

        async loadUserData() {
            try {
                const firstName = this.getStorageItem('firstName');
                const lastName = this.getStorageItem('lastName');

                if (firstName && lastName) {
                    this.doctorData = {
                        firstName: firstName,
                        lastName: lastName,
                        email: this.getStorageItem('email'),
                        id: this.getStorageItem('userId')
                    };
                    this.updateDoctorProfile(this.doctorData);
                } else {
                    this.doctorData = await this.apiRequest('/doctor/profile');
                    this.updateDoctorProfile(this.doctorData);
                }
            } catch (error) {
                safeAPIs.console.error('Failed to load doctor data:', error);
                if (!this.getStorageItem('firstName')) {
                    this.showNotification('Failed to load doctor data', 'error');
                }
            }
        }

        updateDoctorProfile(data) {
            try {
                const avatarSpan = window.document.querySelector('.avatar-img span');
                const doctorName = window.document.querySelector('.patient-info h4');

                if (avatarSpan) {
                    const initials = this.getInitials(data.firstName, data.lastName);
                    avatarSpan.textContent = initials;
                }

                if (doctorName) {
                    doctorName.textContent = 'Dr. ' + data.firstName + ' ' + data.lastName;
                }
            } catch (e) {
                console.warn('Cannot update doctor profile:', e);
            }
        }

        getInitials(firstName, lastName) {
            return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        }
    }

    // Initialize the doctor dashboard
    function initMediSync() {
        try {
            const userRole = safeAPIs.localStorage.getItem('userRole') ||
                           safeAPIs.sessionStorage.getItem('userRole') ||
                           'doctor';

            if (userRole === 'doctor') {
                window.mediSyncApp = new DoctorDashboard();
            }
        } catch (e) {
            safeAPIs.console.error('Failed to initialize MediSync:', e);
        }
    }

    // Safe DOM ready handler
    function onDOMReady(callback) {
        if (safeAPIs.document.readyState === 'loading') {
            try {
                safeAPIs.window.addEventListener('DOMContentLoaded', callback);
            } catch (e) {
                safeAPIs.window.setTimeout(callback, 100);
            }
        } else {
            callback();
        }
    }

    onDOMReady(initMediSync);

})();