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
            this.style.transform = 'translateX(8px)';

            // Update main content based on page
            updateMainContent(targetPage);
            updatePageTitle(targetPage);
        }
    });
});

// Function to update main content based on selected page
function updateMainContent(page) {
    const mainContent = document.querySelector('.main-content');
    const dashboardContent = mainContent.querySelector('.dashboard-content');

    if (!dashboardContent) return;

    // Clear existing content (keep header)
    const header = mainContent.querySelector('.header');
    mainContent.innerHTML = '';
    mainContent.appendChild(header);

    // Create new content based on page
    let newContent;

    switch (page) {
        case 'dashboard':
            newContent = createDashboardContent();
            break;
        case 'appointments':
            newContent = createAppointmentsContent();
            break;
        case 'history':
            newContent = createHistoryContent();
            break;
        case 'settings':
            newContent = createSettingsContent();
            break;
        default:
            newContent = createDashboardContent();
    }

    mainContent.appendChild(newContent);
    attachContentEventListeners(page);
}

// Function to create dashboard content
function createDashboardContent() {
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    content.innerHTML = `
        <!-- Welcome Section -->
        <section class="welcome-card">
            <h2>Welcome to MediSync</h2>
            <p>Manage your healthcare appointments and medical records.</p>
            <button class="btn-primary schedule-appointment-btn">
                <i class="fas fa-plus"></i> Schedule New Appointment
            </button>
        </section>

        <!-- Quick Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon appointments">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Total Appointments</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon doctors">
                    <i class="fas fa-user-md"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Doctors Visited</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon prescriptions">
                    <i class="fas fa-prescription"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Active Prescriptions</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon health">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div class="stat-info">
                    <h3>0%</h3>
                    <p>Health Score</p>
                </div>
            </div>
        </div>

        <!-- Upcoming Appointments -->
        <section class="appointments-section">
            <h2>Upcoming Appointments</h2>
            <div class="no-data-message">
                <i class="fas fa-calendar-plus"></i>
                <h3>No upcoming appointments</h3>
                <p>Schedule your first appointment to get started</p>
                <button class="btn-primary schedule-appointment-btn">
                    <i class="fas fa-plus"></i> Schedule Appointment
                </button>
            </div>
        </section>

        <!-- Recent Activity -->
        <section class="activity-section">
            <h2>Recent Activity</h2>
            <div class="no-data-message">
                <i class="fas fa-history"></i>
                <h3>No recent activity</h3>
                <p>Your medical activity will appear here once you start using the system</p>
            </div>
        </section>
    `;
    return content;
}

// Function to create appointments content
function createAppointmentsContent() {
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    content.innerHTML = `
        <section class="appointments-section">
            <h2>My Appointments</h2>
            <div class="no-data-message">
                <i class="fas fa-calendar-plus"></i>
                <h3>No upcoming appointments</h3>
                <p>Schedule your first appointment to get started</p>
                <button class="btn-primary schedule-appointment-btn">
                    <i class="fas fa-plus"></i> Schedule Appointment
                </button>
            </div>
        </section>
    `;
    return content;
}

// Function to create history content
function createHistoryContent() {
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    content.innerHTML = `
        <section class="history-section">
            <h2>Appointment History</h2>
            <div class="no-data-message">
                <i class="fas fa-history"></i>
                <h3>No appointment history</h3>
                <p>Your past appointments will appear here</p>
            </div>
        </section>
    `;
    return content;
}

// Function to create settings content
function createSettingsContent() {
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    content.innerHTML = `
        <section class="settings-section">
            <h2>Account Settings</h2>
            <div class="settings-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" value="John Doe">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" value="john@example.com">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" value="+1234567890">
                </div>
                <button class="btn-primary">Save Changes</button>
            </div>
        </section>
    `;
    return content;
}

// Function to update page title
function updatePageTitle(page) {
    const headerTitle = document.querySelector('.header h1');
    const titles = {
        dashboard: 'Patient Dashboard',
        appointments: 'My Appointments',
        history: 'Appointment History',
        settings: 'Account Settings'
    };

    if (headerTitle) {
        headerTitle.textContent = titles[page] || 'Patient Dashboard';
    }
}

// Function to attach event listeners to content
function attachContentEventListeners(page) {
    // Attach event listeners for buttons in the content
    const scheduleButtons = document.querySelectorAll('.schedule-appointment-btn');
    scheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            openScheduleModal();
        });
    });
}

// Modal functionality
function openScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    if (modal) {
        modal.style.display = 'block';
        // Load doctors list
        loadDoctorsList();
    }
}

function closeScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadDoctorsList() {
    const select = document.getElementById('doctor-select');
    if (select) {
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add sample doctors
        const doctors = [
            { id: 1, name: 'Dr. Smith', specialty: 'General Medicine' },
            { id: 2, name: 'Dr. Johnson', specialty: 'Cardiology' },
            { id: 3, name: 'Dr. Williams', specialty: 'Dermatology' }
        ];

        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `${doctor.name} - ${doctor.specialty}`;
            select.appendChild(option);
        });
    }
}

// Handle schedule form submission
document.addEventListener('DOMContentLoaded', function() {
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            console.log('Scheduling appointment:', data);
            alert('Appointment scheduled successfully!');

            // Close modal and reset form
            closeScheduleModal();
            this.reset();
        });
    }

    // Set default active menu item
    const defaultActive = document.querySelector('.sidebar-menu li[data-page="dashboard"]');
    if (defaultActive) {
        defaultActive.classList.add('active');
    }

    // Load initial dashboard content
    updateMainContent('dashboard');
});