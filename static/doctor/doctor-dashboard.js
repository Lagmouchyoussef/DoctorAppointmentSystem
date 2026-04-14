// Theme toggle functionality
const themeSwitch = document.getElementById('theme-switch');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';

// Apply the current theme
if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    themeSwitch.checked = true;
} else {
    document.body.removeAttribute('data-theme');
    themeSwitch.checked = false;
}

// Toggle theme when switch is clicked
themeSwitch.addEventListener('change', function() {
    if (this.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
});

// Sidebar menu navigation
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');

sidebarMenuItems.forEach(item => {
    item.addEventListener('click', function() {
        // Get the target page from data-page attribute
        const targetPage = this.getAttribute('data-page');

        if (targetPage) {
            // Navigate to the corresponding page
            switch (targetPage) {
                case 'dashboard':
                    window.location.href = 'doctor.html';
                    break;
                case 'availability':
                    window.location.href = 'doctor-availability.html';
                    break;
                case 'history':
                    window.location.href = 'doctor-history.html';
                    break;
                case 'settings':
                    window.location.href = 'doctor-settings.html';
                    break;
                default:
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
                    break;
                case 'settings':
                    window.location.href = 'doctor-settings.html';
                    break;
            }
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