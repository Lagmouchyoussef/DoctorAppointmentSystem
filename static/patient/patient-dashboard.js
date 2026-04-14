alert('JS loaded');

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

// Sidebar menu active state with enhanced animations
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');

// Commented to avoid conflicts with onclick
/*
sidebarMenuItems.forEach(item => {
    item.addEventListener('click', function() {
        // Get the target page from data-page attribute
        const targetPage = this.getAttribute('data-page');

        if (targetPage) {
            // Navigate to the corresponding page
            switch (targetPage) {
                case 'dashboard':
                    window.location.href = '/static/patient/patient.html';
                    break;
                case 'appointments':
                    window.location.href = '/static/patient/appointments.html';
                    break;
                case 'history':
                    window.location.href = '/static/patient/history.html';
                    break;
                case 'settings':
                    window.location.href = '/static/patient/settings.html';
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
*/

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

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', function() {
        localStorage.clear();
        window.location.href = '/static/login/index.html';
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
                    window.location.href = '/static/patient/patient.html';
                    break;
                case 'appointments':
                    window.location.href = '/static/patient/appointments.html';
                    break;
                case 'history':
                    window.location.href = '/static/patient/history.html';
                    break;
                case 'settings':
                    window.location.href = '/static/patient/settings.html';
                    break;
            }
    });
    } catch(e) {
        alert('Error in DOM: ' + e.message);
    }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
}

// Function to initialize the dashboard
function initDashboard() {
    try {
        // Only run full dashboard on patient.html
        if (!window.location.pathname.includes('patient.html')) {
            // Still attach navigation listeners for other pages
            setupNavigation();
            return;
        }

        // Check if logged in
        // if (!localStorage.getItem('email')) {
        //     window.location.href = '/static/login/index.html';
        //     return;
        // }

    // Setup navigation
    setupNavigation();
    // Animate patient profile first
    const patientProfile = document.querySelector('.patient-profile');
    if (patientProfile) {
        patientProfile.style.opacity = '0';
        patientProfile.style.transform = 'translateX(-30px)';
        setTimeout(() => {
            patientProfile.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            patientProfile.style.opacity = '1';
            patientProfile.style.transform = 'translateX(0)';
        }, 200);
    }

    // Animate menu items with staggered delay
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 400 + index * 80);
    });

    // Animate footer elements
    const footerElements = document.querySelectorAll('.sidebar-footer > *');
    footerElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 800 + index * 100);
    });

    // Initialize charts
    // initializeCharts();

    // Load avatar from localStorage
    loadAvatar();
    updateSidebar(); // Ensure sidebar is updated

    // Handle schedule appointment buttons
    const scheduleButtons = document.querySelectorAll('.btn-primary');
    console.log('Found schedule buttons:', scheduleButtons.length);
    scheduleButtons.forEach(button => {
        if (button.textContent.includes('Schedule') || button.textContent.includes('Appointment')) {
            button.addEventListener('click', function() {
                openScheduleModal();
            });
        }
    });
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
    const userName = localStorage.getItem('userName') || 'Patient User';
    const sidebarName = document.querySelector('.patient-profile .patient-info h4');
    if (sidebarName) {
        sidebarName.textContent = userName;
    } else {
        alert('sidebarName not found');
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
    // Blood Pressure Chart
    const bloodPressureCtx = document.getElementById('bloodPressureChart');
    if (bloodPressureCtx) {
        new Chart(bloodPressureCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Systolic',
                    data: [null, null, null, null, null, null],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Diastolic',
                    data: [null, null, null, null, null, null],
                    borderColor: '#2da0a8',
                    backgroundColor: 'rgba(45, 160, 168, 0.1)',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 160
                    }
                }
            }
        });
    }

    // Weight Chart
    const weightCtx = document.getElementById('weightChart');
    if (weightCtx) {
        new Chart(weightCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Weight (kg)',
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
                        beginAtZero: false,
                        min: 70,
                        max: 80
                    }
                }
            }
        });
    }

    // Appointments Chart
    const appointmentsCtx = document.getElementById('appointmentsChart');
    if (appointmentsCtx) {
        new Chart(appointmentsCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Appointments',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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

    // Health Metrics Chart
    const healthMetricsCtx = document.getElementById('healthMetricsChart');
    if (healthMetricsCtx) {
        new Chart(healthMetricsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Excellent', 'Good', 'Fair', 'Needs Attention'],
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
});

// Load and display appointment invitations
async function loadAppointmentInvitations() {
    const currentPatientEmail = localStorage.getItem('email');
    if (!currentPatientEmail) return;

    const baseUrl = 'http://127.0.0.1:8001/api/';

    try {
        // Get patient ID
        const patientResponse = await fetch(`${baseUrl}patients/?email=${currentPatientEmail}`);
        const patientData = await patientResponse.json();
        if (patientData.results.length === 0) return;
        const patientId = patientData.results[0].id;

        // Get appointments for this patient
        const appointmentResponse = await fetch(`${baseUrl}appointments/?patient=${patientId}&status=scheduled`);
        const appointmentData = await appointmentResponse.json();

        const container = document.querySelector('.invitations-container');

        if (appointmentData.results.length === 0) {
            container.innerHTML = `
                <div class="no-invitations-message">
                    <i class="fas fa-inbox"></i>
                    <h3>No pending appointments</h3>
                    <p>You'll see your scheduled appointments here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        appointmentData.results.forEach(appointment => {
            const invitationCard = createInvitationCardFromAppointment(appointment);
            container.appendChild(invitationCard);
        });
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function getPatientIdFromEmail(email) {
    // Simple mapping for demo - in real app, this would be from user session
    const emailToIdMap = {
        'alice.dupont@email.com': '1',
        'jean.martin@email.com': '2',
        'marie.leroy@email.com': '3',
        'pierre.durand@email.com': '4',
        'sophie.moreau@email.com': '5'
    };
    return emailToIdMap[email] || '1';
}

function createInvitationCardFromAppointment(appointment) {
    const card = document.createElement('div');
    card.className = 'invitation-card new';

    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const time = appointmentDate.toTimeString().split(' ')[0].substring(0,5);

    card.innerHTML = `
        <div class="invitation-header">
            <div class="invitation-doctor">
                <div class="doctor-avatar">
                    Dr
                </div>
                <div class="doctor-info">
                    <h4>Doctor</h4>
                    <p>Appointment</p>
                </div>
            </div>
            <div class="invitation-status scheduled">
                Scheduled
            </div>
        </div>

        <div class="invitation-details">
            <div class="invitation-detail">
                <i class="fas fa-calendar"></i>
                <span>${formattedDate}</span>
            </div>
            <div class="invitation-detail">
                <i class="fas fa-clock"></i>
                <span>${time}</span>
            </div>
            <div class="invitation-detail">
                <i class="fas fa-stethoscope"></i>
                <span>Consultation</span>
            </div>
            ${appointment.notes ? `
                <div class="invitation-notes">
                    <i class="fas fa-sticky-note"></i>
                    "${appointment.notes}"
                </div>
            ` : ''}
        </div>

        <div class="invitation-actions">
            <button class="btn-accept" onclick="completeAppointment(${appointment.id})">
                <i class="fas fa-check"></i>
                Complete
            </button>
        </div>
    `;

    return card;
}

function createInvitationCard(invitation) {
    const card = document.createElement('div');
    card.className = `invitation-card ${invitation.status === 'pending' ? 'new' : ''}`;

    const appointmentDate = new Date(invitation.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const appointmentTypes = {
        'consultation': 'General Consultation',
        'follow-up': 'Follow-up Visit',
        'emergency': 'Emergency Visit',
        'specialist': 'Specialist Consultation'
    };

    card.innerHTML = `
        <div class="invitation-header">
            <div class="invitation-doctor">
                <div class="doctor-avatar">
                    ${invitation.doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div class="doctor-info">
                    <h4>${invitation.doctor.name}</h4>
                    <p>Doctor</p>
                </div>
            </div>
            <div class="invitation-status ${invitation.status}">
                ${invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
            </div>
        </div>

        <div class="invitation-details">
            <div class="invitation-detail">
                <i class="fas fa-calendar"></i>
                <span>${formattedDate}</span>
            </div>
            <div class="invitation-detail">
                <i class="fas fa-clock"></i>
                <span>${invitation.time}</span>
            </div>
            <div class="invitation-detail">
                <i class="fas fa-stethoscope"></i>
                <span>${appointmentTypes[invitation.type] || invitation.type}</span>
            </div>
            ${invitation.notes ? `
                <div class="invitation-notes">
                    <i class="fas fa-sticky-note"></i>
                    "${invitation.notes}"
                </div>
            ` : ''}
        </div>

        <div class="invitation-actions">
            <button class="btn-accept" onclick="acceptInvitation('${invitation.id}')">
                <i class="fas fa-check"></i>
                Accept
            </button>
            <button class="btn-decline" onclick="declineInvitation('${invitation.id}')">
                <i class="fas fa-times"></i>
                Decline
            </button>
        </div>
    `;

    return card;
}

async function completeAppointment(appointmentId) {
    const baseUrl = 'http://127.0.0.1:8001/api/';
    try {
        const response = await fetch(`${baseUrl}appointments/${appointmentId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
        });
        if (response.ok) {
            showNotification('Appointment completed!', 'success');
            loadAppointmentInvitations();
        } else {
            showNotification('Error updating appointment.', 'error');
        }
    } catch (error) {
        showNotification('Network error.', 'error');
    }
}

function acceptInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'accepted');
    showNotification('Appointment accepted successfully!', 'success');
    loadAppointmentInvitations();
}

function declineInvitation(invitationId) {
    updateInvitationStatus(invitationId, 'declined');
    showNotification('Appointment declined.', 'info');
    loadAppointmentInvitations();
}

function updateInvitationStatus(invitationId, newStatus) {
    const currentPatientEmail = localStorage.getItem('email') || 'alice.dupont@email.com';
    const patientId = getPatientIdFromEmail(currentPatientEmail);
    const invitationsKey = `patient_${patientId}_invitations`;

    let invitations = JSON.parse(localStorage.getItem(invitationsKey) || '[]');

    invitations = invitations.map(inv => {
        if (inv.id === invitationId) {
            return { ...inv, status: newStatus };
        }
        return inv;
    });

    localStorage.setItem(invitationsKey, JSON.stringify(invitations));

    // If accepted, add to appointments
    if (newStatus === 'accepted') {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
            addToAppointments(invitation);
        }
    }
}

function addToAppointments(invitation) {
    const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
    const appointment = {
        id: invitation.id,
        doctor: invitation.doctor.name,
        date: invitation.date,
        time: invitation.time,
        type: invitation.type,
        status: 'confirmed',
        notes: invitation.notes
    };

    appointments.push(appointment);
    localStorage.setItem('patientAppointments', JSON.stringify(appointments));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load invitations and emails when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAppointmentInvitations();
    loadRecentEmails();
});

// Load and display recent emails
function loadRecentEmails() {
    const currentPatientEmail = localStorage.getItem('email') || 'alice.dupont@email.com';
    let sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');

    // Filter emails for current patient
    let patientEmails = sentEmails.filter(email => email.to === currentPatientEmail);

    // For demo purposes, add a sample email if none exist
    if (patientEmails.length === 0 && currentPatientEmail === 'alice.dupont@email.com') {
        const sampleEmail = {
            to: 'alice.dupont@email.com',
            from: 'dr.smith@medisync.com',
            subject: 'Appointment Invitation - MediSync',
            body: `Dear Alice Dupont,

You have received an appointment invitation from Dr. Smith.

Appointment Details:
- Date: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}
- Time: 10:00
- Type: General Consultation

Please log in to your MediSync account to accept or decline this appointment.

Best regards,
MediSync Team`,
            sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
        };
        patientEmails = [sampleEmail];
        sentEmails.push(sampleEmail);
        localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
    }

    const container = document.querySelector('.emails-container');

    if (patientEmails.length === 0) {
        container.innerHTML = `
            <div class="no-emails-message">
                <i class="fas fa-envelope-open"></i>
                <h3>No recent emails</h3>
                <p>Email notifications will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    // Show last 5 emails
    const recentEmails = patientEmails.slice(-5).reverse();

    recentEmails.forEach(email => {
        const emailCard = createEmailCard(email);
        container.appendChild(emailCard);
    });
}

function createEmailCard(email) {
    const card = document.createElement('div');
    card.className = 'email-card unread';

    const sentDate = new Date(email.sentAt);
    const timeAgo = getTimeAgo(sentDate);

    // Extract subject from body for display
    const subject = email.subject || 'Appointment Invitation';
    const preview = email.body.split('\n')[0].substring(0, 100) + '...';

    card.innerHTML = `
        <div class="email-header">
            <div>
                <div class="email-sender">${email.from.split('@')[0]}@medisync.com</div>
                <div class="email-subject">${subject}</div>
                <div class="email-preview">${preview}</div>
            </div>
            <div class="email-timestamp">${timeAgo}</div>
        </div>
    `;

    // Mark as read when clicked
    card.addEventListener('click', () => {
        card.classList.remove('unread');
        showEmailModal(email);
    });

    return card;
}

function showEmailModal(email) {
    const sentDate = new Date(email.sentAt);
    const formattedDate = sentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 3000; display: flex;
        align-items: center; justify-content: center; animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
                    <div>
                        <h3 style="color: var(--text-primary); margin-bottom: 8px;">${email.subject}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">
                            From: ${email.from.split('@')[0]}@medisync.com<br>
                            To: ${email.to}<br>
                            Date: ${formattedDate}
                        </p>
                    </div>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
                </div>
                <div style="color: var(--text-primary); line-height: 1.6; white-space: pre-line;">
                    ${email.body}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

// Schedule modal functions
function openScheduleModal() {
    loadDoctorsForModal();
    document.getElementById('schedule-modal').style.display = 'block';
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').style.display = 'none';
}

async function loadDoctorsForModal() {
    const baseUrl = 'http://127.0.0.1:8001/api/';
    try {
        const response = await fetch(`${baseUrl}doctors/`);
        const data = await response.json();
        const select = document.getElementById('doctor-select');
        select.innerHTML = '<option value="">Select Doctor</option>';
        data.results.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `Dr. ${doctor.first_name} ${doctor.last_name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

document.getElementById('schedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const baseUrl = 'http://127.0.0.1:8001/api/';
    const currentPatientEmail = localStorage.getItem('email');
    let patientId;
    try {
        const patientResponse = await fetch(`${baseUrl}patients/?email=${currentPatientEmail}`);
        const patientData = await patientResponse.json();
        if (patientData.results.length > 0) {
            patientId = patientData.results[0].id;
        } else {
            alert('Patient not found.');
            return;
        }
    } catch (error) {
        alert('Error finding patient.');
        return;
    }

    const data = {
        patient: patientId,
        doctor: document.getElementById('doctor-select').value,
        appointment_date: document.getElementById('appointment-datetime').value,
        reason: document.getElementById('appointment-reason').value,
        status: 'scheduled'
    };

    try {
        const response = await fetch(`${baseUrl}appointments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            showNotification('Appointment scheduled successfully!', 'success');
            closeScheduleModal();
            loadAppointmentInvitations(); // Refresh
        } else {
            showNotification('Error scheduling appointment.', 'error');
        }
    } catch (error) {
        showNotification('Network error.', 'error');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('schedule-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);