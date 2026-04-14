// doctor-dashboard.js - Specialized JavaScript for Doctor Dashboard
// Extends MediSyncApp with doctor-specific functionality

// Include the base MediSyncApp class (this would normally be in a shared file)
class MediSyncApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.userRole = this.getUserRole();
        this.userId = this.getUserId();
        this.theme = localStorage.getItem('theme') || 'light';
        this.charts = {};
        this.userData = {};
        this.apiBaseUrl = '/api'; // Adjust based on your backend URL
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
        return localStorage.getItem('userRole') ||
               sessionStorage.getItem('userRole') ||
               this.getCookie('userRole') ||
               'patient'; // default fallback
    }

    getUserId() {
        return localStorage.getItem('userId') ||
               sessionStorage.getItem('userId') ||
               this.getCookie('userId');
    }

    setUserInfo(role, userId, token) {
        this.userRole = role;
        this.userId = userId;
        this.authToken = token;

        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', userId);
        localStorage.setItem('authToken', token);
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    getAuthToken() {
        return localStorage.getItem('authToken') ||
               sessionStorage.getItem('authToken') ||
               this.getCookie('authToken');
    }

    setAuthToken(token) {
        localStorage.setItem('authToken', token);
        this.authToken = token;
    }

    redirectToLogin() {
        window.location.href = '../login/index.html';
    }

    redirectToDashboard() {
        const dashboardUrl = this.pageRoutes[this.userRole]?.dashboard;
        if (dashboardUrl) {
            window.location.href = dashboardUrl;
        } else {
            this.redirectToLogin();
        }
    }

    navigateToPage(page) {
        const pageUrl = this.pageRoutes[this.userRole]?.[page];
        if (pageUrl) {
            window.location.href = pageUrl;
        } else {
            console.warn(`Page ${page} not found for role ${this.userRole}`);
            this.showNotification('Page not accessible', 'warning');
        }
    }

    isCurrentPageAllowed() {
        const currentPath = window.location.pathname;
        const allowedPages = Object.values(this.pageRoutes[this.userRole] || {});
        return allowedPages.some(page => currentPath.includes(page));
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

        // Check if user has access to current page
        if (!this.isCurrentPageAllowed()) {
            this.redirectToDashboard();
            return;
        }

        this.bindEvents();
        this.initializeCharts();
        this.applyTheme();
        this.updateActiveNav();
        this.loadUserData();
        this.addInterfaceIndicator();
        this.addGlobalNavigation();
    }

    bindEvents() {
        // Navigation events with loading states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // Theme toggle with smooth transition
        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', () => this.toggleTheme());
        }

        // Modal events
        this.bindModalEvents();

        // Logout event
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Refresh data on window focus
        window.addEventListener('focus', () => {
            if (!this.isLoading) {
                this.refreshData();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
            this.refreshData();
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not be available.', 'warning');
        });
    }

    bindModalEvents() {
        const scheduleBtns = document.querySelectorAll('.btn-primary[data-action="schedule"]');
        scheduleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openScheduleModal();
            });
        });

        const modal = document.getElementById('schedule-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            const form = modal.querySelector('#schedule-form');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeScheduleModal());
            }

            if (form) {
                form.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
            }

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeScheduleModal();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'block') {
                    this.closeScheduleModal();
                }
            });
        }
    }

    async navigateTo(page) {
        if (this.isLoading) return;

        // Check if it's a cross-page navigation
        if (this.pageRoutes[this.userRole]?.[page]) {
            this.navigateToPage(page);
            return;
        }

        // Same-page navigation (SPA style)
        this.updateNavState(page);
        this.currentPage = page;
        window.location.hash = page;

        // Show loading state
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
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
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
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = roleTitles[page] || `${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Dashboard`;
        }

        document.title = `${roleTitles[page] || 'Dashboard'} - MediSync`;
    }

    async loadPageContent(page) {
        // In a real application, load content based on page and user role
        const methodName = `load${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)}${page.charAt(0).toUpperCase() + page.slice(1)}Data`;

        if (this[methodName]) {
            await this[methodName]();
        } else {
            // Fallback to generic method
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
        // Clear all auth data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userId');
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.showNotification('Session expired. Please login again.', 'warning');
        setTimeout(() => this.redirectToLogin(), 2000);
    }

    async apiRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            }
        };

        const config = { ...defaultOptions, ...options };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, config);

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

            // Clear all auth data
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

        let loader = document.querySelector('.global-loader');
        if (!loader) {
            loader = document.createElement('div');
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
            loader.querySelector('p').textContent = message;
            loader.style.display = 'flex';
        }
    }

    hideLoadingState() {
        this.isLoading = false;
        const loader = document.querySelector('.global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showPageLoading() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('loading');
        }
    }

    hidePageLoading() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('loading');
        }
    }

    showErrorState() {
        const mainContent = document.querySelector('.main-content');
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
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after duration
        const timeoutId = setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            notification.remove();
        });

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
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

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
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
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Event delegation for dynamic content
    delegateEvent(eventType, selector, handler) {
        document.addEventListener(eventType, (e) => {
            if (e.target.matches(selector) || e.target.closest(selector)) {
                handler.call(this, e);
            }
        });
    }

    // Initialize event delegation for dynamic elements
    initEventDelegation() {
        // Handle invitation responses
        this.delegateEvent('click', '.btn-accept', (e) => {
            const invitationId = e.target.dataset.invitationId;
            if (invitationId) {
                this.handleInvitationResponse(invitationId, 'accept');
            }
        });

        this.delegateEvent('click', '.btn-decline', (e) => {
            const invitationId = e.target.dataset.invitationId;
            if (invitationId) {
                this.handleInvitationResponse(invitationId, 'decline');
            }
        });
    }

    addInterfaceIndicator() {
        // Add visual indicator of current interface
        const indicator = document.createElement('div');
        indicator.className = 'interface-indicator';
        indicator.innerHTML = `
            <i class="fas ${this.userRole === 'doctor' ? 'fa-user-md' : 'fa-user'}"></i>
            ${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Interface
        `;

        // Add click handler to switch roles if available
        indicator.addEventListener('click', () => {
            this.showRoleSwitcher();
        });

        document.body.appendChild(indicator);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 5000);
    }

    showRoleSwitcher() {
        // Create a modal or dropdown to switch roles
        const switcher = document.createElement('div');
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

        // Add event listeners
        switcher.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const role = e.currentTarget.dataset.role;
                if (role !== this.userRole) {
                    this.switchRole(role);
                }
                switcher.remove();
            });
        });

        switcher.querySelector('.close-switcher').addEventListener('click', () => {
            switcher.remove();
        });

        switcher.querySelector('.role-switcher-overlay').addEventListener('click', () => {
            switcher.remove();
        });

        document.body.appendChild(switcher);
    }

    async switchRole(newRole) {
        if (!this.pageRoutes[newRole]) {
            this.showNotification('Role not available', 'warning');
            return;
        }

        try {
            // Validate role switch with backend
            const result = await this.apiRequest('/auth/switch-role', {
                method: 'POST',
                body: { role: newRole }
            });

            if (result.allowed) {
                this.userRole = newRole;
                localStorage.setItem('userRole', newRole);
                this.navigateToRoleDashboard(newRole);
            } else {
                this.showNotification('You do not have permission to access this role', 'error');
            }
        } catch (error) {
            console.error('Failed to switch role:', error);
            this.showNotification('Failed to switch interface', 'error');
        }
    }

    addGlobalNavigation() {
        // Add role switcher to header if user has multiple roles
        this.checkUserRoles();
    }

    async checkUserRoles() {
        try {
            const roles = await this.apiRequest('/auth/user-roles');
            if (roles && roles.length > 1) {
                const roleSwitcher = this.createRoleSwitcher();
                const headerActions = document.querySelector('.header-actions');
                if (headerActions) {
                    headerActions.insertBefore(roleSwitcher, headerActions.firstChild);
                }
            }
        } catch (error) {
            console.warn('Could not load user roles:', error);
        }
    }

    createRoleSwitcher() {
        const roleSwitcher = document.createElement('div');
        roleSwitcher.className = 'role-switcher';
        roleSwitcher.innerHTML = `
            <select id="role-select" class="role-select">
                <option value="patient" ${this.userRole === 'patient' ? 'selected' : ''}>
                    <i class="fas fa-user"></i> Patient Interface
                </option>
                <option value="doctor" ${this.userRole === 'doctor' ? 'selected' : ''}>
                    <i class="fas fa-user-md"></i> Doctor Interface
                </option>
            </select>
        `;

        // Add event listener
        const select = roleSwitcher.querySelector('#role-select');
        select.addEventListener('change', (e) => {
            const newRole = e.target.value;
            if (newRole !== this.userRole) {
                this.switchRole(newRole);
            }
        });

        return roleSwitcher;
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);

        // Optionally save theme preference to backend
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
        document.documentElement.setAttribute('data-theme', this.theme);

        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
            themeSwitch.checked = this.theme === 'dark';
        }

        // Update charts theme
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.options.plugins.legend.labels.color = this.theme === 'dark' ? '#ffffff' : '#2c3e50';
                chart.update();
            }
        });
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
                    console.warn('Unknown page:', targetPage);
            }
        }

        // Remove active class from all items with animation
        sidebarMenuItems.forEach(i => {
            i.classList.remove('active');
            // Add a subtle animation when removing active state
            i.style.transform = 'translateX(0)';
            setTimeout(() => {
                i.style.transform = '';
            }, 150);
        });

        // Add active class to clicked item with animation
        this.classList.add('active');

        // Add click ripple effect
        this.style.position = 'relative';
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.marginLeft = '-10px';
        ripple.style.marginTop = '-10px';

        this.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    // Enhanced hover effects
    item.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'translateX(4px)';
        }
    });

    item.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'translateX(0)';
        }
    });
});

// Notification badge animation removed

// Logout functionality (placeholder)
const logoutBtn = document.querySelector('.logout-btn');
logoutBtn.addEventListener('click', function() {
    // In a real app, this would handle logout
    alert('Logout functionality would be implemented here');
});

// Button hover effects
const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-cancel');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Card hover effects with enhanced animations
const cards = document.querySelectorAll('.stat-card, .appointment-card, .activity-item, .welcome-card');
cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = 'var(--shadow), 0 8px 25px rgba(0, 0, 0, 0.15)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'var(--shadow)';
    });
});

// Navigation handler - only for sidebar menu items
function setupNavigation() {
    const sidebarNavItems = document.querySelectorAll('.sidebar-menu .nav-item');

    sidebarNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;

            // Update active state in sidebar only
            document.querySelectorAll('.sidebar-menu .nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Navigate to page
            switch(page) {
                case 'dashboard':
                    window.location.href = 'doctor.html';
                    break;
                case 'availability':
                    window.location.href = 'doctor-availability.html';
                    break;
                case 'history':
                    window.location.href = 'doctor-history.html';
}

class DoctorDashboard extends MediSyncApp {
    constructor() {
        super();
        this.doctorData = {};
        this.currentAppointments = [];
        this.availabilitySlots = [];
    }

    init() {
        super.init();
        // Doctor-specific initializations
        this.initializeDoctorFeatures();
    }

    initializeDoctorFeatures() {
        // Add doctor-specific navigation and features
        this.addDoctorNavigation();
        this.initializeAppointmentReminders();
        this.setupRealTimeUpdates();
    }

    addDoctorNavigation() {
        // Update navigation labels for doctor interface
        this.updateDoctorNavLabels();

        // Add quick action buttons
        this.addQuickActionButtons();
    }

    updateDoctorNavLabels() {
        const navMappings = {
            'appointments': 'availability',
            'history': 'history'
        };

        document.querySelectorAll('.nav-item').forEach(item => {
            const page = item.dataset.page;
            if (navMappings[page]) {
                const span = item.querySelector('span');
                if (span) {
                    span.textContent = page === 'appointments' ? 'Availability' : span.textContent;
                }
                item.dataset.page = navMappings[page];
            }
        });
    }

    addQuickActionButtons() {
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
            <button class="quick-action-btn" title="Quick Appointment" onclick="quickScheduleAppointment()">
                <i class="fas fa-plus"></i>
            </button>
            <button class="quick-action-btn" title="Patient Search" onclick="searchPatients()">
                <i class="fas fa-search"></i>
            </button>
            <button class="quick-action-btn" title="Emergency" onclick="emergencyMode()">
                <i class="fas fa-exclamation-triangle"></i>
            </button>
        `;

        document.body.appendChild(quickActions);
    }

    async loadPageContent(page) {
        // Doctor-specific page loading
        switch (page) {
            case 'dashboard':
                await this.loadDoctorDashboardData();
                break;
            case 'availability':
                await this.loadDoctorAvailabilityData();
                break;
            case 'history':
                await this.loadDoctorHistoryData();
                break;
            case 'settings':
                await this.loadDoctorSettingsData();
                break;
            default:
                await super.loadPageContent(page);
        }
    }

    async loadUserData() {
        try {
            this.doctorData = await this.apiRequest('/doctor/profile');
            this.updateDoctorProfile(this.doctorData);
        } catch (error) {
            console.error('Failed to load doctor data:', error);
            this.showNotification('Failed to load doctor data', 'error');
        }
    }

    async loadDoctorDashboardData() {
        try {
            const [stats, todayAppointments, upcomingAppointments, recentActivity] = await Promise.all([
                this.apiRequest('/doctor/dashboard/stats'),
                this.apiRequest('/doctor/appointments/today'),
                this.apiRequest('/doctor/appointments/upcoming'),
                this.apiRequest('/doctor/activity/recent')
            ]);

            this.updateDoctorDashboardStats(stats);
            this.displayTodayAppointments(todayAppointments);
            this.displayUpcomingAppointments(upcomingAppointments);
            this.displayRecentActivity(recentActivity);

            // Update current appointments for real-time updates
            this.currentAppointments = todayAppointments;

        } catch (error) {
            console.error('Failed to load doctor dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadDoctorAvailabilityData() {
        try {
            const availability = await this.apiRequest('/doctor/availability');
            this.renderDoctorAvailability(availability);
        } catch (error) {
            console.error('Failed to load availability:', error);
            this.showNotification('Failed to load availability', 'error');
        }
    }

    async loadDoctorHistoryData() {
        try {
            const history = await this.apiRequest('/doctor/appointments/history');
            this.renderDoctorHistory(history);
        } catch (error) {
            console.error('Failed to load doctor history:', error);
            this.showNotification('Failed to load appointment history', 'error');
        }
    }

    async loadDoctorSettingsData() {
        try {
            const settings = await this.apiRequest('/doctor/settings');
            this.renderDoctorSettings(settings);
        } catch (error) {
            console.error('Failed to load doctor settings:', error);
            this.showNotification('Failed to load settings', 'error');
        }
    }

    updateDoctorProfile(data) {
        const avatarSpan = document.querySelector('.avatar-img span');
        const doctorName = document.querySelector('.patient-info h4');

        if (avatarSpan) {
            const initials = this.getInitials(data.firstName, data.lastName);
            avatarSpan.textContent = initials;
        }

        if (doctorName) {
            doctorName.textContent = `Dr. ${data.firstName} ${data.lastName}`;
        }
    }

    updateDoctorDashboardStats(stats) {
        // Update doctor-specific statistics
        this.updateStatCard('totalAppointments', stats.totalAppointments || 0);
        this.updateStatCard('patientsSeen', stats.patientsSeen || 0);
        this.updateStatCard('availabilityHours', `${stats.availabilityHours || 0}h`);
        this.updateStatCard('avgRating', `${stats.averageRating || 0}/5`);

        // Update stats overview
        this.updateDoctorStatsOverview(stats);
    }

    updateDoctorStatsOverview(stats) {
        const overviewBoxes = document.querySelectorAll('.stat-box');

        if (overviewBoxes.length >= 4) {
            overviewBoxes[0].querySelector('.stat-value').textContent = stats.todayAppointments || 0;
            overviewBoxes[1].querySelector('.stat-value').textContent = stats.completedToday || 0;
            overviewBoxes[2].querySelector('.stat-value').textContent = stats.upcomingThisWeek || 0;
            overviewBoxes[3].querySelector('.stat-value').textContent = stats.cancellationRate || 0;

            // Update trend indicators
            this.updateDoctorTrends(stats);
        }
    }

    updateDoctorTrends(stats) {
        const trends = document.querySelectorAll('.stat-trend');

        // Calculate trends based on doctor metrics
        const trendData = [
            stats.todayAppointments > 0 ? 'positive' : 'neutral',
            stats.completedToday > 0 ? 'positive' : 'neutral',
            stats.upcomingThisWeek > 5 ? 'positive' : 'neutral',
            (stats.cancellationRate || 0) < 10 ? 'positive' : 'negative'
        ];

        trends.forEach((trend, index) => {
            trend.className = `stat-trend ${trendData[index]}`;
            const icons = ['fa-arrow-up', 'fa-arrow-up', 'fa-arrow-up', 'fa-arrow-down'];
            const messages = ['Active day', 'Good progress', 'Busy week', 'Low cancellations'];

            trend.innerHTML = `<i class="fas ${icons[index]}"></i> ${messages[index]}`;
        });
    }

    displayTodayAppointments(appointments) {
        const container = document.querySelector('.appointments-section') ||
                         document.querySelector('.dashboard-content');

        if (!container) return;

        if (appointments && appointments.length > 0) {
            const appointmentsHtml = appointments.map(apt => this.renderDoctorAppointment(apt)).join('');

            // Update or create appointments section
            let appointmentsSection = container.querySelector('.appointments-section');
            if (!appointmentsSection) {
                appointmentsSection = document.createElement('section');
                appointmentsSection.className = 'appointments-section';
                container.appendChild(appointmentsSection);
            }

            appointmentsSection.innerHTML = `
                <h2><i class="fas fa-calendar-day"></i> Today's Appointments</h2>
                <div class="appointments-list">
                    ${appointmentsHtml}
                </div>
            `;
        } else {
            this.displayNoAppointmentsMessage(container);
        }

        // Re-bind event handlers
        this.bindAppointmentActions();
    }

    displayUpcomingAppointments(appointments) {
        if (!appointments || appointments.length === 0) return;

        const container = document.querySelector('.dashboard-content');
        if (!container) return;

        const upcomingHtml = appointments.slice(0, 5).map(apt => `
            <div class="upcoming-appointment">
                <div class="appointment-time">${this.formatTime(apt.time)}</div>
                <div class="appointment-info">
                    <strong>${apt.patientName}</strong>
                    <small>${apt.reason}</small>
                </div>
            </div>
        `).join('');

        // Add upcoming appointments section
        const upcomingSection = document.createElement('section');
        upcomingSection.className = 'upcoming-appointments';
        upcomingSection.innerHTML = `
            <h2><i class="fas fa-clock"></i> Upcoming This Week</h2>
            <div class="upcoming-list">
                ${upcomingHtml}
            </div>
        `;

        container.appendChild(upcomingSection);
    }

    displayRecentActivity(activities) {
        const container = document.querySelector('.activity-section') ||
                         document.querySelector('.dashboard-content');

        if (!container) return;

        if (activities && activities.length > 0) {
            const activityHtml = activities.map(activity => this.renderDoctorActivity(activity)).join('');

            let activitySection = container.querySelector('.activity-section');
            if (!activitySection) {
                activitySection = document.createElement('section');
                activitySection.className = 'activity-section';
                container.appendChild(activitySection);
            }

            activitySection.innerHTML = `
                <h2><i class="fas fa-history"></i> Recent Activity</h2>
                <div class="activity-list">
                    ${activityHtml}
                </div>
            `;
        } else {
            this.displayNoActivityMessage(container);
        }
    }

    renderDoctorAppointment(appointment) {
        const statusClass = appointment.status.toLowerCase();
        const isUrgent = appointment.priority === 'high';

        return `
            <div class="appointment-card doctor-appointment-card ${statusClass} ${isUrgent ? 'urgent' : ''}" data-appointment-id="${appointment.id}">
                <div class="appointment-header">
                    <div class="appointment-time-status">
                        <div class="appointment-time">${this.formatTime(appointment.time)}</div>
                        <div class="appointment-status status-${statusClass}">
                            ${appointment.status}
                        </div>
                    </div>
                    ${isUrgent ? '<div class="urgent-indicator"><i class="fas fa-exclamation-triangle"></i></div>' : ''}
                </div>

                <div class="appointment-info">
                    <h4>${appointment.patientName}</h4>
                    <p class="patient-details">
                        <span class="patient-age">${appointment.patientAge} years old</span>
                        <span class="patient-gender">${appointment.patientGender}</span>
                    </p>
                    <p class="appointment-reason">${appointment.reason}</p>
                    ${appointment.notes ? `<p class="appointment-notes">${appointment.notes}</p>` : ''}
                </div>

                <div class="appointment-actions">
                    ${this.getAppointmentActionButtons(appointment)}
                </div>
            </div>
        `;
    }

    getAppointmentActionButtons(appointment) {
        const status = appointment.status.toLowerCase();

        switch (status) {
            case 'scheduled':
                return `
                    <button class="btn-primary start-appointment" data-action="start">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn-secondary reschedule-appointment" data-action="reschedule">
                        <i class="fas fa-calendar-alt"></i> Reschedule
                    </button>
                    <button class="btn-cancel cancel-appointment" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                `;
            case 'in-progress':
                return `
                    <button class="btn-primary complete-appointment" data-action="complete">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn-secondary add-note" data-action="note">
                        <i class="fas fa-sticky-note"></i> Add Note
                    </button>
                `;
            case 'completed':
                return `
                    <button class="btn-secondary view-details" data-action="view">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn-secondary add-followup" data-action="followup">
                        <i class="fas fa-calendar-plus"></i> Follow-up
                    </button>
                `;
            default:
                return `
                    <button class="btn-secondary view-details" data-action="view">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                `;
        }
    }

    renderDoctorActivity(activity) {
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <small>${this.formatDate(activity.timestamp)} at ${this.formatTime(activity.timestamp)}</small>
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'appointment_completed': 'fa-check-circle',
            'appointment_cancelled': 'fa-times-circle',
            'patient_registered': 'fa-user-plus',
            'prescription_issued': 'fa-prescription-bottle',
            'test_ordered': 'fa-vial',
            'note_added': 'fa-sticky-note'
        };
        return icons[type] || 'fa-info-circle';
    }

    renderDoctorAvailability(availability) {
        // Implementation for availability management
        const container = document.querySelector('.dashboard-content') ||
                         document.querySelector('.main-content');

        if (!container) return;

        const availabilityHtml = this.generateAvailabilityCalendar(availability);

        container.innerHTML = `
            <div class="availability-container">
                <h2><i class="fas fa-calendar-check"></i> Manage Availability</h2>
                <div class="availability-controls">
                    <button class="btn-primary" onclick="setBulkAvailability()">
                        <i class="fas fa-calendar-plus"></i> Set Weekly Schedule
                    </button>
                    <button class="btn-secondary" onclick="addTimeSlot()">
                        <i class="fas fa-plus"></i> Add Time Slot
                    </button>
                </div>
                <div class="availability-calendar">
                    ${availabilityHtml}
                </div>
            </div>
        `;
    }

    generateAvailabilityCalendar(availability) {
        // Generate a weekly calendar view for availability
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        return days.map(day => `
            <div class="availability-day">
                <h3>${day}</h3>
                <div class="day-slots">
                    ${this.generateTimeSlots(day.toLowerCase(), availability)}
                </div>
            </div>
        `).join('');
    }

    generateTimeSlots(day, availability) {
        // Generate time slots for each day
        const slots = availability?.[day] || [];
        if (slots.length === 0) {
            return '<p class="no-slots">No availability set</p>';
        }

        return slots.map(slot => `
            <div class="time-slot available" data-day="${day}" data-start="${slot.start}" data-end="${slot.end}">
                <span>${slot.start} - ${slot.end}</span>
                <button class="remove-slot" onclick="removeTimeSlot('${day}', '${slot.start}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderDoctorHistory(history) {
        // Implementation for appointment history
        const container = document.querySelector('.dashboard-content');

        if (!container) return;

        const historyHtml = history.map(appointment => `
            <div class="history-item">
                <div class="history-date">${this.formatDate(appointment.date)}</div>
                <div class="history-details">
                    <h4>${appointment.patientName}</h4>
                    <p>Reason: ${appointment.reason}</p>
                    <p>Status: ${appointment.status}</p>
                </div>
                <div class="history-actions">
                    <button class="btn-secondary" onclick="viewAppointmentDetails(${appointment.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="history-container">
                <h2><i class="fas fa-history"></i> Appointment History</h2>
                <div class="history-filters">
                    <select id="history-filter">
                        <option value="all">All Appointments</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                    </select>
                    <input type="date" id="history-date-from">
                    <input type="date" id="history-date-to">
                </div>
                <div class="history-list">
                    ${historyHtml}
                </div>
            </div>
        `;
    }

    renderDoctorSettings(settings) {
        // Implementation for doctor settings
        const container = document.querySelector('.dashboard-content');

        if (!container) return;

        container.innerHTML = `
            <div class="settings-container">
                <h2><i class="fas fa-cog"></i> Account Settings</h2>
                <form class="settings-form">
                    <div class="settings-section">
                        <h3>Profile Information</h3>
                        <div class="form-group">
                            <label for="doctor-name">Full Name</label>
                            <input type="text" id="doctor-name" value="${settings.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="doctor-specialty">Specialty</label>
                            <input type="text" id="doctor-specialty" value="${settings.specialty || ''}">
                        </div>
                        <div class="form-group">
                            <label for="doctor-license">License Number</label>
                            <input type="text" id="doctor-license" value="${settings.licenseNumber || ''}">
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Consultation Settings</h3>
                        <div class="form-group">
                            <label for="consultation-fee">Consultation Fee ($)</label>
                            <input type="number" id="consultation-fee" value="${settings.consultationFee || 0}">
                        </div>
                        <div class="form-group">
                            <label for="slot-duration">Slot Duration (minutes)</label>
                            <select id="slot-duration">
                                <option value="15" ${settings.slotDuration === 15 ? 'selected' : ''}>15 minutes</option>
                                <option value="30" ${settings.slotDuration === 30 ? 'selected' : ''}>30 minutes</option>
                                <option value="45" ${settings.slotDuration === 45 ? 'selected' : ''}>45 minutes</option>
                                <option value="60" ${settings.slotDuration === 60 ? 'selected' : ''}>60 minutes</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-actions">
                        <button type="submit" class="btn-primary">Save Changes</button>
                        <button type="button" class="btn-cancel" onclick="resetSettings()">Reset</button>
                    </div>
                </form>
            </div>
        `;
    }

    // Appointment management methods
    async startAppointment(appointmentId) {
        try {
            const result = await this.apiRequest(`/doctor/appointments/${appointmentId}/start`, {
                method: 'POST'
            });

            this.showNotification('Appointment started successfully', 'success');
            await this.loadDoctorDashboardData(); // Refresh dashboard

            // Update local appointment status
            this.updateAppointmentStatus(appointmentId, 'in-progress');

        } catch (error) {
            console.error('Failed to start appointment:', error);
            this.showNotification('Failed to start appointment', 'error');
        }
    }

    async completeAppointment(appointmentId) {
        try {
            const result = await this.apiRequest(`/doctor/appointments/${appointmentId}/complete`, {
                method: 'POST'
            });

            this.showNotification('Appointment completed successfully', 'success');
            await this.loadDoctorDashboardData(); // Refresh dashboard

        } catch (error) {
            console.error('Failed to complete appointment:', error);
            this.showNotification('Failed to complete appointment', 'error');
        }
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const result = await this.apiRequest(`/doctor/appointments/${appointmentId}/cancel`, {
                method: 'POST',
                body: { reason: 'Cancelled by doctor' }
            });

            this.showNotification('Appointment cancelled', 'warning');
            await this.loadDoctorDashboardData(); // Refresh dashboard

        } catch (error) {
            console.error('Failed to cancel appointment:', error);
            this.showNotification('Failed to cancel appointment', 'error');
        }
    }

    updateAppointmentStatus(appointmentId, status) {
        const appointmentCard = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
        if (appointmentCard) {
            appointmentCard.className = `appointment-card doctor-appointment-card ${status}`;
            const statusElement = appointmentCard.querySelector('.appointment-status');
            if (statusElement) {
                statusElement.className = `appointment-status status-${status}`;
                statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            }

            // Update action buttons
            const actionsContainer = appointmentCard.querySelector('.appointment-actions');
            if (actionsContainer) {
                actionsContainer.innerHTML = this.getAppointmentActionButtons({ id: appointmentId, status });
            }
        }
    }

    bindAppointmentActions() {
        // Bind action buttons for appointments
        document.querySelectorAll('.start-appointment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appointmentId = e.target.closest('.appointment-card').dataset.appointmentId;
                this.startAppointment(appointmentId);
            });
        });

        document.querySelectorAll('.complete-appointment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appointmentId = e.target.closest('.appointment-card').dataset.appointmentId;
                this.completeAppointment(appointmentId);
            });
        });

        document.querySelectorAll('.cancel-appointment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appointmentId = e.target.closest('.appointment-card').dataset.appointmentId;
                this.cancelAppointment(appointmentId);
            });
        });
    }

    initializeAppointmentReminders() {
        // Set up reminders for upcoming appointments
        this.checkUpcomingAppointments();
        setInterval(() => this.checkUpcomingAppointments(), 60000); // Check every minute
    }

    async checkUpcomingAppointments() {
        try {
            const upcoming = await this.apiRequest('/doctor/appointments/upcoming?within=30');
            const now = new Date();

            upcoming.forEach(appointment => {
                const appointmentTime = new Date(`${appointment.date} ${appointment.time}`);
                const timeDiff = (appointmentTime - now) / (1000 * 60); // Difference in minutes

                if (timeDiff > 0 && timeDiff <= 15 && !appointment.reminded) {
                    this.showAppointmentReminder(appointment);
                    appointment.reminded = true;
                }
            });
        } catch (error) {
            console.warn('Failed to check upcoming appointments:', error);
        }
    }

    showAppointmentReminder(appointment) {
        const reminder = document.createElement('div');
        reminder.className = 'appointment-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <i class="fas fa-bell"></i>
                <div class="reminder-text">
                    <strong>Upcoming Appointment</strong>
                    <p>${appointment.patientName} at ${appointment.time}</p>
                </div>
                <button class="reminder-close">&times;</button>
            </div>
        `;

        reminder.querySelector('.reminder-close').addEventListener('click', () => {
            reminder.remove();
        });

        document.body.appendChild(reminder);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (reminder.parentNode) {
                reminder.remove();
            }
        }, 10000);
    }

    setupRealTimeUpdates() {
        // Setup WebSocket or polling for real-time updates
        this.startRealTimeUpdates();
    }

    startRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(async () => {
            if (document.visibilityState === 'visible') {
                try {
                    const updates = await this.apiRequest('/doctor/updates');
                    this.handleRealTimeUpdates(updates);
                } catch (error) {
                    console.warn('Failed to get real-time updates:', error);
                }
            }
        }, 30000);
    }

    handleRealTimeUpdates(updates) {
        if (updates.newAppointments) {
            this.showNotification(`New appointment scheduled`, 'info');
            this.loadDoctorDashboardData(); // Refresh dashboard
        }

        if (updates.cancelledAppointments) {
            this.showNotification(`Appointment cancelled`, 'warning');
            this.loadDoctorDashboardData(); // Refresh dashboard
        }
    }

    displayNoAppointmentsMessage(container) {
        const noAppointmentsSection = document.createElement('section');
        noAppointmentsSection.className = 'appointments-section';
        noAppointmentsSection.innerHTML = `
            <h2><i class="fas fa-calendar-day"></i> Today's Appointments</h2>
            <div class="no-data-message">
                <i class="fas fa-calendar-check"></i>
                <h3>No appointments today</h3>
                <p>You have no scheduled appointments for today. Set your availability to receive appointments.</p>
                <button class="btn-primary" onclick="navigateToPage('availability')">
                    <i class="fas fa-calendar-plus"></i> Set Availability
                </button>
            </div>
        `;

        container.appendChild(noAppointmentsSection);
    }

    displayNoActivityMessage(container) {
        const noActivitySection = document.createElement('section');
        noActivitySection.className = 'activity-section';
        noActivitySection.innerHTML = `
            <h2><i class="fas fa-history"></i> Recent Activity</h2>
            <div class="no-data-message">
                <i class="fas fa-history"></i>
                <h3>No recent activity</h3>
                <p>Your medical activities will appear here once you start seeing patients.</p>
            </div>
        `;

        container.appendChild(noActivitySection);
    }
}

// Quick action functions
function quickScheduleAppointment() {
    if (window.mediSyncApp && window.mediSyncApp.userRole === 'doctor') {
        window.mediSyncApp.navigateTo('availability');
    }
}

function searchPatients() {
    // Implement patient search functionality
    console.log('Opening patient search...');
}

function emergencyMode() {
    // Implement emergency mode functionality
    if (confirm('Activate emergency mode? This will prioritize urgent appointments.')) {
        console.log('Emergency mode activated');
    }
}

// Initialize the appropriate dashboard based on user role
document.addEventListener('DOMContentLoaded', () => {
    // Detect user role and initialize appropriate dashboard
    const userRole = localStorage.getItem('userRole') ||
                    sessionStorage.getItem('userRole') ||
                    'doctor'; // Default to doctor for doctor pages

    let dashboardInstance;

    if (userRole === 'doctor') {
        dashboardInstance = new DoctorDashboard();
    } else {
        // Fallback - redirect to appropriate dashboard
        window.location.href = '../patient/patient.html';
        return;
    }

    window.mediSyncApp = dashboardInstance;

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        if (window.mediSyncApp) {
            window.mediSyncApp.updateActiveNav();
        }
    });
});

// Additional CSS for doctor-specific features
const doctorStyles = `
<style>
.appointment-reminder {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--card-bg);
    border: 2px solid var(--accent-color);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow);
    z-index: 1000;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
}

.reminder-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.reminder-content i {
    color: var(--accent-color);
    font-size: 24px;
    margin-top: 2px;
}

.reminder-text strong {
    display: block;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.reminder-text p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
}

.reminder-close {
    position: absolute;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-secondary);
}

.reminder-close:hover {
    color: var(--text-primary);
}

.doctor-appointment-card {
    border-left: 4px solid #28a745;
}

.doctor-appointment-card.urgent {
    border-left-color: #dc3545;
    background: rgba(220, 53, 69, 0.05);
}

.appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.appointment-time-status {
    display: flex;
    align-items: center;
    gap: 12px;
}

.appointment-time {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent-color);
}

.appointment-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-scheduled {
    background: #fff3cd;
    color: #856404;
}

.status-in-progress {
    background: #cce5ff;
    color: #004085;
}

.status-completed {
    background: #d4edda;
    color: #155724;
}

.status-cancelled {
    background: #f8d7da;
    color: #721c24;
}

.urgent-indicator {
    color: #dc3545;
    font-size: 16px;
}

.patient-details {
    display: flex;
    gap: 12px;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.appointment-notes {
    background: var(--bg-secondary);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 8px;
}

.upcoming-appointments {
    margin-bottom: 30px;
}

.upcoming-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.upcoming-appointment {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: var(--card-bg);
    border-radius: 8px;
    box-shadow: var(--shadow);
    transition: transform 0.2s ease;
}

.upcoming-appointment:hover {
    transform: translateY(-2px);
}

.appointment-time {
    font-weight: 600;
    color: var(--accent-color);
    min-width: 80px;
}

.appointment-info strong {
    color: var(--text-primary);
    display: block;
}

.appointment-info small {
    color: var(--text-secondary);
}

.availability-container {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.availability-controls {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.availability-calendar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.availability-day {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 16px;
}

.availability-day h3 {
    color: var(--text-primary);
    margin-bottom: 12px;
    font-size: 16px;
}

.day-slots {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.time-slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--card-bg);
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.time-slot.available {
    border-color: #28a745;
    background: rgba(40, 167, 69, 0.05);
}

.remove-slot {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.remove-slot:hover {
    background: #dc3545;
    color: white;
}

.no-slots {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 20px;
}

.history-container {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.history-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.history-filters select,
.history-filters input {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.history-date {
    font-weight: 600;
    color: var(--accent-color);
    min-width: 120px;
}

.history-details h4 {
    color: var(--text-primary);
    margin-bottom: 4px;
}

.history-details p {
    color: var(--text-secondary);
    margin: 2px 0;
    font-size: 14px;
}

.settings-container {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.settings-section {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
}

.settings-section h3 {
    color: var(--text-primary);
    margin-bottom: 16px;
    font-size: 18px;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    color: var(--text-primary);
    margin-bottom: 6px;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(45, 160, 168, 0.2);
}

.settings-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.quick-actions {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
}

.quick-action-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: var(--accent-color);
    color: white;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.quick-action-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 20px rgba(45, 160, 168, 0.4);
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Responsive adjustments for doctor interface */
@media (max-width: 768px) {
    .appointment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .history-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .availability-calendar {
        grid-template-columns: 1fr;
    }

    .settings-actions {
        flex-direction: column;
    }

    .settings-actions .btn-primary,
    .settings-actions .btn-cancel {
        width: 100%;
    }

    .quick-actions {
        bottom: 10px;
        right: 10px;
    }

    .quick-action-btn {
        width: 45px;
        height: 45px;
        font-size: 16px;
    }
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', doctorStyles);
        });
    });
}

// Set active sidebar item based on current page
function setActiveSidebarItem() {
    const currentPath = window.location.pathname;
    let activePage = 'dashboard'; // default

    if (currentPath.includes('doctor-availability.html')) {
        activePage = 'availability';
    } else if (currentPath.includes('doctor-history.html')) {
        activePage = 'history';
    } else if (currentPath.includes('doctor-settings.html')) {
        activePage = 'settings';
    }

    // Remove active class from all items
    sidebarMenuItems.forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to current page item
    const activeItem = document.querySelector(`.sidebar-menu li[data-page="${activePage}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Add staggered animation to sidebar elements on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Doctor dashboard DOMContentLoaded');

    // Set active sidebar item
    setActiveSidebarItem();

    // Run common code on all doctor pages
    loadAvatar();
    updateSidebar(); // Ensure sidebar is updated

    // Only run dashboard-specific code on the main dashboard page
    if (window.location.pathname.includes('doctor.html') && !window.location.pathname.includes('doctor-availability.html') && !window.location.pathname.includes('doctor-history.html') && !window.location.pathname.includes('doctor-settings.html')) {
        // Handle availability buttons on main dashboard
        const scheduleButtons = document.querySelectorAll('.btn-primary');
        scheduleButtons.forEach(button => {
            if (button.textContent.includes('View Patient Records') || button.textContent.includes('Manage Schedule')) {
                button.addEventListener('click', function() {
                    window.location.href = 'doctor-availability.html';
                });
            }
        });
    }
});

// Avatar management
function loadAvatar() {
    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        updateAvatarDisplay(avatarContainer);
    }

    // Listen for avatar updates from other pages
    window.addEventListener('avatarUpdated', () => {
        const avatarContainer = document.querySelector('.avatar-img');
        if (avatarContainer) {
            updateAvatarDisplay(avatarContainer);
        }
    });

    // Listen for localStorage changes to update sidebar
    window.addEventListener('storage', (e) => {
        if (e.key === 'userName' || e.key === 'firstName' || e.key === 'lastName') {
            updateSidebar();
        }
    });
}

function updateSidebar() {
    // Update name
    const userName = localStorage.getItem('userName') || '';
    const sidebarName = document.querySelector('.patient-info h4');
    if (sidebarName) {
        sidebarName.textContent = userName;
    }
    // Update avatar
    const avatarContainer = document.querySelector('.avatar-img');
    if (avatarContainer) {
        updateAvatarDisplay(avatarContainer);
    }
}

function updateAvatarDisplay(avatarContainer) {
    const savedImage = localStorage.getItem('userAvatar');

    // Clear existing content
    avatarContainer.innerHTML = '';

    if (savedImage) {
        // Display saved image
        const img = document.createElement('img');
        img.src = savedImage;
        img.alt = 'Avatar';
        img.onload = () => {
            img.style.display = 'block';
        };
        avatarContainer.appendChild(img);
    } else {
        // Display initials
        const userName = localStorage.getItem('userName') || '';
        const nameParts = userName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[1] || '';
        const initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
        if (!initials.trim()) initials = '';

        const span = document.createElement('span');
        span.textContent = initials;
        avatarContainer.appendChild(span);
    }
}

// Chart initialization and data
function initializeCharts() {
    // Patient Health Overview Chart
    const patientHealthCtx = document.getElementById('patientHealthChart');
    if (patientHealthCtx) {
        new Chart(patientHealthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average Health Score',
                    data: [null, null, null, null, null, null],
                    borderColor: '#2da0a8',
                    backgroundColor: 'rgba(45, 160, 168, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Appointment Trends Chart
    const appointmentTrendsCtx = document.getElementById('appointmentTrendsChart');
    if (appointmentTrendsCtx) {
        new Chart(appointmentTrendsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Appointments',
                    data: [null, null, null, null, null, null],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Specialty Chart
    const specialtyCtx = document.getElementById('specialtyChart');
    if (specialtyCtx) {
        new Chart(specialtyCtx, {
            type: 'bar',
            data: {
                labels: ['Cardiology', 'Dentistry', 'Neurology', 'Ophthalmology', 'General Medicine'],
                datasets: [{
                    label: 'Patients',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(45, 160, 168, 0.8)',
                    borderColor: '#2da0a8',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        new Chart(performanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Patient Satisfaction', 'On-time Appointments', 'Treatment Success', 'Needs Improvement'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#28a745',
                        '#2da0a8',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

// Keyboard navigation for sidebar
document.addEventListener('keydown', function(e) {
    const menuItems = Array.from(document.querySelectorAll('.sidebar-menu li'));
    const activeItem = document.querySelector('.sidebar-menu li.active');
    const activeIndex = menuItems.indexOf(activeItem);

    if (e.key === 'ArrowDown' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const nextIndex = (activeIndex + 1) % menuItems.length;
        menuItems[nextIndex].click();
        menuItems[nextIndex].focus();
    } else if (e.key === 'ArrowUp' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const prevIndex = activeIndex === 0 ? menuItems.length - 1 : activeIndex - 1;
        menuItems[prevIndex].click();
        menuItems[prevIndex].focus();
    }
});