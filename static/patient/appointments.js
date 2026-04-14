// Appointments Page JavaScript

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

class AppointmentCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedDoctor = null;
        this.availableSlots = {};

        // Mock data for available slots (in real app, this would come from backend)
        this.initializeMockData();

        this.init();
    }

    initializeMockData() {
        // Generate mock availability data
        const doctors = ['dr-johnson', 'dr-chen', 'dr-smith', 'dr-brown'];
        const baseDate = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            const dateKey = this.formatDate(date);
            this.availableSlots[dateKey] = {};

            doctors.forEach(doctor => {
                this.availableSlots[dateKey][doctor] = this.generateTimeSlots(date, doctor);
            });
        }
    }

    generateTimeSlots(date, doctor) {
        // Simulate different availability patterns for different doctors
        const dayOfWeek = date.getDay();
        const slots = [];

        // Base time slots (9 AM to 5 PM)
        const baseSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        // Different doctors have different availability
        let availableSlots = [...baseSlots];

        switch (doctor) {
            case 'dr-johnson':
                // Cardiologist - available Mon, Wed, Fri
                if ([1, 3, 5].includes(dayOfWeek)) {
                    availableSlots = availableSlots.slice(0, 8); // Shorter day
                } else {
                    availableSlots = [];
                }
                break;
            case 'dr-chen':
                // Dentist - available Tue, Thu, Sat
                if ([2, 4, 6].includes(dayOfWeek)) {
                    availableSlots = availableSlots.slice(2, 10);
                } else {
                    availableSlots = [];
                }
                break;
            case 'dr-smith':
                // GP - available most days
                if (dayOfWeek === 0) { // Sunday
                    availableSlots = [];
                } else {
                    availableSlots = availableSlots.slice(0, 10);
                }
                break;
            case 'dr-brown':
                // Orthopedic - available Mon-Fri
                if ([1, 2, 3, 4, 5].includes(dayOfWeek)) {
                    availableSlots = availableSlots.slice(4, 12);
                } else {
                    availableSlots = [];
                }
                break;
        }

        // Randomly remove some slots to simulate bookings
        return availableSlots.filter(() => Math.random() > 0.3);
    }

    async init() {
        this.renderCalendar();
        this.setupEventListeners();
        this.updateSidebar(); // Update with current data
        await this.loadDoctors();
    }

    async loadDoctors() {
        const baseUrl = 'http://127.0.0.1:8001/api/';
        try {
            const response = await fetch(`${baseUrl}doctors/`);
            const data = await response.json();
            const select = document.getElementById('doctor-select');
            select.innerHTML = '<option value="">Select a Doctor</option>';
            data.results.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `Dr. ${doctor.first_name} ${doctor.last_name} - ${doctor.specialty}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Doctor selection
        document.getElementById('doctor-select').addEventListener('change', (e) => {
            this.selectedDoctor = e.target.value;
            this.updateTimeSlots();
        });

        // Appointment type selection
        document.getElementById('appointment-type').addEventListener('change', (e) => {
            const otherTypeGroup = document.getElementById('other-type-group');
            const otherTypeInput = document.getElementById('other-type');

            if (e.target.value === 'other') {
                otherTypeGroup.style.display = 'block';
                otherTypeInput.required = true;
                otherTypeInput.focus();
            } else {
                otherTypeGroup.style.display = 'none';
                otherTypeInput.required = false;
                otherTypeInput.value = '';
            }
        });

        // Form submission
        document.getElementById('appointment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBooking();
        });

        // Privacy modal
        document.querySelector('.privacy-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hidePrivacyModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('privacy-modal');
            if (e.target === modal) {
                this.hidePrivacyModal();
            }
        });

        // Listen for localStorage changes to update sidebar
        window.addEventListener('storage', (e) => {
            if (e.key === 'userName' || e.key === 'firstName' || e.key === 'lastName') {
                this.updateSidebar();
            }
        });
    }

    updateSidebar() {
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

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

        // Clear previous days
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';

        // Get first day of month and last day
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';

            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);

            const dayNumber = currentDay.getDate();
            dayElement.textContent = dayNumber;

            // Check if day is in current month
            if (currentDay.getMonth() !== month) {
                dayElement.classList.add('disabled');
            } else if (this.isToday(currentDay)) {
                dayElement.classList.add('today');
            } else if (this.isPastDate(currentDay)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selectDate(currentDay));
            }

            // Highlight selected date
            if (this.selectedDate && this.datesEqual(currentDay, this.selectedDate)) {
                dayElement.classList.add('selected');
            }

            daysContainer.appendChild(dayElement);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        document.getElementById('selected-date').value = this.formatDateReadable(date);
        this.renderCalendar();
        this.updateTimeSlots();
    }

    updateTimeSlots() {
        const timeSlotsContainer = document.getElementById('time-slots');
        if (!timeSlotsContainer) {
            alert('Time slots container not found');
            return;
        }
        // Clear all children
        while (timeSlotsContainer.firstChild) {
            timeSlotsContainer.removeChild(timeSlotsContainer.firstChild);
        }

        if (!this.selectedDate || !this.selectedDoctor) {
            const p = document.createElement('p');
            p.style.color = 'var(--text-secondary)';
            p.style.fontStyle = 'italic';
            p.textContent = 'Please select a date and doctor first.';
            timeSlotsContainer.appendChild(p);
            return;
        }

        const dateKey = this.formatDate(this.selectedDate);
        let slots = this.availableSlots[dateKey]?.[this.selectedDoctor] || [];
        slots = [...new Set(slots)]; // Ensure unique slots

        alert('Updating slots: ' + slots.length + ' unique slots');

        if (slots.length === 0) {
            const p = document.createElement('p');
            p.style.color = 'var(--text-secondary)';
            p.style.fontStyle = 'italic';
            p.textContent = 'No available slots for this date.';
            timeSlotsContainer.appendChild(p);
            return;
        }

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = slot;
            slotElement.addEventListener('click', () => this.selectTimeSlot(slotElement, slot));
            timeSlotsContainer.appendChild(slotElement);
        });
    }

    selectTimeSlot(element, time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new slot
        element.classList.add('selected');
        this.selectedTime = time;
    }

    async handleBooking() {
        if (!this.validateForm()) {
            return;
        }

        const appointmentType = document.getElementById('appointment-type').value;
        const customType = appointmentType === 'other' ? document.getElementById('other-type').value : '';

        // Get patient ID
        const currentPatientEmail = localStorage.getItem('email');
        const baseUrl = 'http://127.0.0.1:8001/api/';
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

        const appointmentDateTime = new Date(this.selectedDate);
        const [hours, minutes] = this.selectedTime.split(':');
        appointmentDateTime.setHours(hours, minutes);

        const bookingData = {
            patient: patientId,
            doctor: this.selectedDoctor,
            appointment_date: appointmentDateTime.toISOString(),
            reason: document.getElementById('reason').value,
            status: 'scheduled',
            notes: customType || appointmentType
        };

        // Show loading state
        const submitBtn = document.querySelector('.btn-book-appointment');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${baseUrl}appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            if (response.ok) {
                this.showBookingSuccess(bookingData);
            } else {
                alert('Error booking appointment.');
            }
        } catch (error) {
            alert('Network error.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm() {
        const requiredFields = [
            'selected-date',
            'doctor-select',
            'appointment-type',
            'reason',
            'contact-email',
            'contact-phone'
        ];

        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                field.style.borderColor = 'var(--border-color)';
            }
        });

        // Check if "other" type is specified when selected
        const appointmentType = document.getElementById('appointment-type').value;
        const otherTypeInput = document.getElementById('other-type');
        if (appointmentType === 'other' && !otherTypeInput.value.trim()) {
            otherTypeInput.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            otherTypeInput.style.borderColor = 'var(--border-color)';
        }

        // Check if time slot is selected
        if (!this.selectedTime) {
            document.getElementById('time-slots').style.border = '1px solid #dc3545';
            isValid = false;
        } else {
            document.getElementById('time-slots').style.border = 'none';
        }

        // Check GDPR consent
        if (!document.getElementById('gdpr-consent').checked) {
            isValid = false;
            alert('Please accept the privacy notice to continue.');
        }

        return isValid;
    }

    showBookingSuccess(bookingData) {
        const doctorNames = {
            'dr-johnson': '',
            'dr-chen': '',
            'dr-smith': '',
            'dr-brown': ''
        };

        const successMessage = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--accent-color); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 15px;">Appointment Booked Successfully!</h3>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorNames[bookingData.doctor]}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${this.formatDateReadable(bookingData.date)}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${bookingData.time}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${bookingData.customType || bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)}</p>
                </div>
                <p style="color: var(--text-secondary);">You will receive a confirmation email and reminder notifications.</p>
            </div>
        `;

        // Create success modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 3000; display: flex;
            align-items: center; justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                ${successMessage}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: var(--accent-color); color: white; border: none;
                    padding: 10px 20px; border-radius: 6px; cursor: pointer;
                    margin-top: 15px; width: 100%;
                ">Close</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Reset form
        document.getElementById('appointment-form').reset();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDoctor = null;
        this.renderCalendar();
        this.updateTimeSlots();
    }

    sendEmailReminder(bookingData) {
        // Simulate sending email reminder
        console.log('Email reminder sent:', {
            to: bookingData.email,
            subject: 'Appointment Reminder - MediSync',
            body: `Your appointment is scheduled for ${this.formatDateReadable(bookingData.date)} at ${bookingData.time}`
        });

        // In a real app, this would make an API call to send the email
        setTimeout(() => {
            console.log('Automated email reminder sent successfully');
        }, 1000);
    }

    showPrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'block';
    }

    hidePrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'none';
    }

    // Utility methods
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateReadable(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    isToday(date) {
        const today = new Date();
        return this.datesEqual(date, today);
    }

    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }

    datesEqual(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
}

// Initialize the calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppointmentCalendar();
    loadAvatar();
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