// Availability Page JavaScript

// Only load on availability pages
if (!window.location.href.includes('doctor-availability.html') && !window.location.href.includes('debug-availability.html')) {
    console.log('Availability script skipped - not on availability page');
} else {

document.addEventListener('DOMContentLoaded', function() {
    // Only run on availability page
    if (!window.location.pathname.includes('doctor-availability.html')) {
        return;
    }

    try {
        console.log('Availability page loading...');

        // Load saved availability (with error handling)
        if (typeof loadAvailability === 'function') {
            loadAvailability();
        }

        // Handle save availability button
        const saveButton = document.getElementById('save-availability-btn');
        if (saveButton && typeof saveAvailability === 'function') {
            saveButton.addEventListener('click', saveAvailability);
        }

        // Handle view schedule button
        const viewButton = document.getElementById('view-schedule-btn');
        if (viewButton && typeof showScheduleView === 'function') {
            viewButton.addEventListener('click', showScheduleView);
        }

        // Initialize invitation functionality (only if function exists)
        // Delay initialization to ensure all functions are loaded
        setTimeout(() => {
            if (typeof initializeInvitationSystem === 'function') {
                initializeInvitationSystem();
            }
        }, 100);

        console.log('Availability page loaded successfully');
    } catch (error) {
        console.error('Error loading availability page:', error);
        // Don't show alert for minor errors, just log them
        if (error.message && !error.message.includes('undefined')) {
            alert('Page loaded with some errors. Check console for details.');
        }
    }
});

} // End of page check condition

function saveAvailability() {
    // Check if required elements exist
    const startTimeEl = document.getElementById('start-time');
    const endTimeEl = document.getElementById('end-time');
    const dayCards = document.querySelectorAll('.day-card input');

    if (!startTimeEl || !endTimeEl || dayCards.length === 0) {
        alert('Error: Required form elements not found. Please refresh the page.');
        return;
    }

    const selectedDays = Array.from(document.querySelectorAll('.day-card input:checked')).map(cb => cb.value);
    const startTime = startTimeEl.value;
    const endTime = endTimeEl.value;

    if (selectedDays.length === 0) {
        alert('Please select at least one day');
        return;
    }

    if (!startTime || !endTime) {
        alert('Please set both start and end times');
        return;
    }

    if (startTime >= endTime) {
        alert('Start time must be before end time');
        return;
    }

    const availability = {
        days: selectedDays,
        startTime: startTime,
        endTime: endTime
    };

    localStorage.setItem('doctorAvailability', JSON.stringify(availability));

    alert('Availability saved successfully!');
    displayCurrentAvailability(availability);
}

function loadAvailability() {
    try {
        const saved = localStorage.getItem('doctorAvailability');
        if (saved) {
            const availability = JSON.parse(saved);

            // Check if availability has required properties
            if (!availability.days || !availability.startTime || !availability.endTime) {
                console.warn('Invalid availability data in localStorage');
                return;
            }

            // Check the appropriate days
            availability.days.forEach(day => {
                const checkbox = document.querySelector(`.day-card input[value="${day}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Set the times
            const startTimeEl = document.getElementById('start-time');
            const endTimeEl = document.getElementById('end-time');
            if (startTimeEl) startTimeEl.value = availability.startTime;
            if (endTimeEl) endTimeEl.value = availability.endTime;

            displayCurrentAvailability(availability);
        }
    } catch (error) {
        console.error('Error loading availability:', error);
        // Clear corrupted data
        localStorage.removeItem('doctorAvailability');
    }
}

function displayCurrentAvailability(availability) {
    const displayDiv = document.querySelector('.availability-display');

    if (!displayDiv) {
        console.warn('Availability display element not found');
        return;
    }

    try {
        const availabilityHtml = `
            <div class="current-schedule">
                <h4>Your Weekly Availability</h4>
                <div class="schedule-details">
                    <p><strong>Days:</strong> ${availability.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
                    <p><strong>Time:</strong> ${availability.startTime} - ${availability.endTime}</p>
                </div>
            </div>
        `;

        displayDiv.innerHTML = availabilityHtml;
    } catch (error) {
        console.error('Error displaying availability:', error);
    }
}

function showScheduleView() {
    try {
        // Get saved availability
        const saved = localStorage.getItem('doctorAvailability');
        if (!saved) {
            alert('Please set your availability first before viewing your schedule.');
            return;
        }

        const availability = JSON.parse(saved);

    // Create schedule view modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 3000; display: flex;
        align-items: center; justify-content: center; animation: fadeIn 0.3s ease;
    `;

    // Generate schedule HTML
    const scheduleHtml = generateScheduleHtml(availability);

    modal.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
                    <h2 style="color: var(--text-primary); margin: 0;">Your Weekly Schedule</h2>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
                </div>
                ${scheduleHtml}
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error showing schedule view:', error);
        alert('An error occurred while displaying the schedule. Please try again.');
    }
}

function generateScheduleHtml(availability) {
    const dayNames = {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
    };

    let scheduleHtml = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">Available Days & Times</h3>
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>Time Range:</strong> ${availability.startTime} - ${availability.endTime}</p>
                <p style="margin: 5px 0;"><strong>Available Days:</strong> ${availability.days.map(d => dayNames[d]).join(', ')}</p>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">Weekly Schedule</h3>
            <div style="display: grid; gap: 10px;">
    `;

    // Show all days with availability status
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
        const isAvailable = availability.days.includes(day);
        const status = isAvailable ?
            `<span style="color: #28a745; font-weight: 600;">Available: ${availability.startTime} - ${availability.endTime}</span>` :
            `<span style="color: var(--text-secondary);">Not available</span>`;

        scheduleHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: 6px;">
                <span style="font-weight: 500; color: var(--text-primary);">${dayNames[day]}</span>
                ${status}
            </div>
        `;
    });

    scheduleHtml += `
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">Quick Actions</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="editAvailability()" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;">Edit Availability</button>
                <button onclick="exportSchedule()" style="padding: 8px 16px; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 6px; cursor: pointer;">Export Schedule</button>
            </div>
        </div>
    `;

    return scheduleHtml;
}

// Create a namespace for availability functions to avoid conflicts
window.AvailabilityManager = {
    editAvailability: function() {
        try {
            // Close modal and scroll to availability section
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            const availabilitySection = document.querySelector('.availability-section');
            if (availabilitySection) {
                availabilitySection.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error in editAvailability:', error);
        }
    },

    exportSchedule: function() {
        try {
            // Simple export functionality
            const saved = localStorage.getItem('doctorAvailability');
            if (!saved) {
                alert('No availability data to export.');
                return;
            }

            const availability = JSON.parse(saved);
            const exportData = {
                schedule: availability,
                exportedAt: new Date().toISOString(),
                doctor: 'Current Doctor' // In real app, get from user data
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'doctor_schedule.json';
            link.click();

            alert('Schedule exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting schedule. Please try again.');
        }
    }
};

// For backward compatibility, also attach to window
window.editAvailability = window.AvailabilityManager.editAvailability;
window.exportSchedule = window.AvailabilityManager.exportSchedule;

// Invitation System Functions
function initializeInvitationSystem() {
    // Check if invitation elements exist
    const patientSelect = document.getElementById('patient-select');
    const dateInput = document.getElementById('invitation-date');

    if (!patientSelect || !dateInput) {
        console.warn('Invitation elements not found, skipping initialization');
        return;
    }

    try {
        // Load patients list
        loadPatientsList();

        // Set up event listeners
        setupInvitationListeners();

        // Set default date to today + 1 day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error initializing invitation system:', error);
    }
}

function loadPatientsList() {
    try {
        // Mock patient data - in a real app, this would come from an API
        const mockPatients = [
            { id: '1', name: 'Alice Dupont', email: 'alice.dupont@email.com', phone: '+33 6 12 34 56 78' },
            { id: '2', name: 'Jean Martin', email: 'jean.martin@email.com', phone: '+33 6 98 76 54 32' },
            { id: '3', name: 'Marie Leroy', email: 'marie.leroy@email.com', phone: '+33 6 55 44 33 22' },
            { id: '4', name: 'Pierre Durand', email: 'pierre.durand@email.com', phone: '+33 6 11 22 33 44' },
            { id: '5', name: 'Sophie Moreau', email: 'sophie.moreau@email.com', phone: '+33 6 77 88 99 00' }
        ];

        const patientSelect = document.getElementById('patient-select');
        if (!patientSelect) {
            console.warn('Patient select element not found');
            return;
        }

        mockPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name} (${patient.email})`;
            option.dataset.patient = JSON.stringify(patient);
            patientSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading patients list:', error);
    }
}

function setupInvitationListeners() {
    try {
        // Date change listener to update available times
        const dateInput = document.getElementById('invitation-date');
        if (dateInput) {
            dateInput.addEventListener('change', function(e) {
                const selectedDate = new Date(e.target.value);
                updateAvailableTimes(selectedDate);
            });
        }

        // Send invitation button
        const sendBtn = document.getElementById('send-invitation-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendInvitation);
        }

        // Preview invitation button
        const previewBtn = document.getElementById('preview-invitation-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', previewInvitation);
        }
    } catch (error) {
        console.error('Error setting up invitation listeners:', error);
    }

    // Initial load of times for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateAvailableTimes(tomorrow);
}

function updateAvailableTimes(selectedDate) {
    const timeSelect = document.getElementById('invitation-time');
    timeSelect.innerHTML = '<option value="">Select time...</option>';

    // Get doctor's availability
    const savedAvailability = localStorage.getItem('doctorAvailability');
    if (!savedAvailability) {
        timeSelect.innerHTML = '<option value="">Set your availability first</option>';
        return;
    }

    const availability = JSON.parse(savedAvailability);

    // Check if the selected day is available
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = dayNames[selectedDate.getDay()];

    if (!availability.days.includes(selectedDayName)) {
        timeSelect.innerHTML = '<option value="">Doctor not available this day</option>';
        return;
    }

    // Generate time slots based on availability
    const startTime = availability.startTime;
    const endTime = availability.endTime;

    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);

    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);

        // Add 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
        }
    }

    // Add slots to select
    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
    });
}

function sendInvitation() {
    // Validate form
    const patientSelect = document.getElementById('patient-select');
    const dateInput = document.getElementById('invitation-date');
    const timeSelect = document.getElementById('invitation-time');
    const typeSelect = document.getElementById('appointment-type');

    if (!patientSelect.value || !dateInput.value || !timeSelect.value || !typeSelect.value) {
        alert('Please fill in all required fields');
        return;
    }

    // Get patient data
    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientData = JSON.parse(selectedOption.dataset.patient);

    // Get doctor's info
    const doctorName = localStorage.getItem('userName') || 'Dr. [Your Name]';
    const doctorEmail = localStorage.getItem('email') || 'doctor@medisync.com';

    // Get form data
    const invitationData = {
        id: Date.now().toString(),
        patient: patientData,
        doctor: {
            name: doctorName,
            email: doctorEmail
        },
        date: dateInput.value,
        time: timeSelect.value,
        type: typeSelect.value,
        notes: document.getElementById('invitation-notes').value,
        sentAt: new Date().toISOString(),
        status: 'pending'
    };

    // Show loading state
    const sendBtn = document.getElementById('send-invitation-btn');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;

    // Simulate sending invitation
    setTimeout(() => {
        // Save invitation to localStorage (in real app, this would be an API call)
        const existingInvitations = JSON.parse(localStorage.getItem('sentInvitations') || '[]');
        existingInvitations.push(invitationData);
        localStorage.setItem('sentInvitations', JSON.stringify(existingInvitations));

        // Save to patient's received invitations (simulating database)
        const patientInvitations = JSON.parse(localStorage.getItem(`patient_${patientData.id}_invitations`) || '[]');
        patientInvitations.push(invitationData);
        localStorage.setItem(`patient_${patientData.id}_invitations`, JSON.stringify(patientInvitations));

        // Simulate email sending
        sendInvitationEmail(invitationData);

        // Show success message
        showInvitationSuccess(invitationData);

        // Reset form
        resetInvitationForm();

        // Restore button
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }, 2000);
}

function previewInvitation() {
    const patientSelect = document.getElementById('patient-select');
    const dateInput = document.getElementById('invitation-date');
    const timeSelect = document.getElementById('invitation-time');
    const typeSelect = document.getElementById('appointment-type');
    const notesInput = document.getElementById('invitation-notes');

    if (!patientSelect.value || !dateInput.value || !timeSelect.value) {
        alert('Please select a patient, date, and time first');
        return;
    }

    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    const patientData = JSON.parse(selectedOption.dataset.patient);

    const appointmentTypes = {
        'consultation': 'General Consultation',
        'follow-up': 'Follow-up Visit',
        'emergency': 'Emergency Visit',
        'specialist': 'Specialist Consultation'
    };

    const previewHtml = `
        <div style="padding: 20px; max-width: 500px;">
            <h3 style="margin-bottom: 20px; color: var(--text-primary);">Appointment Invitation Preview</h3>

            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Dear ${patientData.name},</h4>

                <p style="margin-bottom: 15px; line-height: 1.5;">
                    I would like to invite you for an appointment at my clinic.
                </p>

                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                    <p style="margin: 5px 0;"><strong>Appointment Type:</strong> ${appointmentTypes[typeSelect.value]}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(dateInput.value).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSelect.value}</p>
                    ${notesInput.value ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notesInput.value}</p>` : ''}
                </div>

                <p style="margin-bottom: 15px;">
                    Please confirm your availability by responding to this invitation.
                </p>

                <p style="margin-bottom: 0;">
                    Best regards,<br>
                    ${localStorage.getItem('userName') || 'Dr. [Your Name]'}
                </p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="this.closest('.modal').remove()" style="padding: 8px 16px; border: 1px solid var(--border-color); background: white; border-radius: 4px; cursor: pointer;">Close</button>
                <button onclick="document.getElementById('send-invitation-btn').click(); this.closest('.modal').remove()" style="padding: 8px 16px; background: var(--accent-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Send Invitation</button>
            </div>
        </div>
    `;

    showModal(previewHtml, 'Appointment Invitation Preview');
}

function showInvitationSuccess(invitationData) {
    const successHtml = `
        <div style="text-align: center; padding: 30px;">
            <i class="fas fa-paper-plane" style="font-size: 48px; color: var(--accent-color); margin-bottom: 20px;"></i>
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">Invitation Sent Successfully!</h3>
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                <p style="margin: 5px 0;"><strong>Patient:</strong> ${invitationData.patient.name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${invitationData.patient.email}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(invitationData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${invitationData.time}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${invitationData.type.charAt(0).toUpperCase() + invitationData.type.slice(1)}</p>
            </div>
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                <i class="fas fa-envelope" style="color: #155724; margin-right: 10px;"></i>
                <strong style="color: #155724;">Email notification sent to ${invitationData.patient.email}</strong>
            </div>
            <p style="color: var(--text-secondary);">The patient will receive this invitation in their dashboard and can accept or decline the appointment.</p>
            <button onclick="this.closest('.modal').remove()" style="background: var(--accent-color); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">Close</button>
        </div>
    `;

    showModal(successHtml, 'Invitation Sent');
}

function sendInvitationEmail(invitationData) {
    // Simulate sending email - in a real app, this would be an API call
    const emailData = {
        to: invitationData.patient.email,
        from: invitationData.doctor.email,
        subject: `Appointment Invitation - ${invitationData.doctor.name}`,
        body: `
Dear ${invitationData.patient.name},

You have received an appointment invitation from ${invitationData.doctor.name}.

Appointment Details:
- Date: ${new Date(invitationData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}
- Time: ${invitationData.time}
- Type: ${invitationData.type.charAt(0).toUpperCase() + invitationData.type.slice(1)}
${invitationData.notes ? `- Notes: ${invitationData.notes}` : ''}

Please log in to your MediSync account to accept or decline this appointment.

Best regards,
MediSync Team
        `,
        sentAt: new Date().toISOString()
    };

    // Store email in localStorage for simulation
    const sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
    sentEmails.push(emailData);
    localStorage.setItem('sentEmails', JSON.stringify(sentEmails));

    console.log('Email sent:', emailData);
}

function resetInvitationForm() {
    document.getElementById('patient-select').value = '';
    document.getElementById('invitation-time').innerHTML = '<option value="">Select time...</option>';
    document.getElementById('appointment-type').value = 'consultation';
    document.getElementById('invitation-notes').value = '';

    // Reset date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('invitation-date').value = tomorrow.toISOString().split('T')[0];
}

function showModal(content, title) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 3000; display: flex;
        align-items: center; justify-content: center; animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 12px; max-width: 90%; max-height: 90%; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            ${content}
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Avatar management functions
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