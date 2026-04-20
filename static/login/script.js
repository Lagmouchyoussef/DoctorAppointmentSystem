const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Handle form submissions
document.querySelector('.sign-up form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = document.querySelector('input[placeholder="First Name"]').value;
  const lastName = document.querySelector('input[placeholder="Last Name"]').value;
  const email = document.querySelector('input[placeholder="Email"]').value;
  const password = document.querySelector('input[placeholder="Password"]').value;
  const role = document.querySelector('input[name="role"]:checked')?.value;

  if (!firstName || !lastName || !email || !password || !role) {
    alert('Please fill in all fields.');
    return;
  }

  const baseUrl = '/api/';
  let url, data;

  if (role === 'patient') {
    url = `${baseUrl}patients/`;
    data = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password
    };
  } else {
    url = `${baseUrl}doctors/`;
    data = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const userData = await response.json();
      alert(`Account created for ${firstName} ${lastName} as ${role}.`);

      // Set authentication data
      localStorage.setItem('authToken', `${role}_${userData.id}_${Date.now()}`);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('userName', role === 'doctor' ? `Dr. ${firstName} ${lastName}` : `${firstName} ${lastName}`);
      localStorage.setItem('email', email);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);
      if (role === 'patient') {
        window.location.href = '../patient/patient.html';
      } else {
        window.location.href = '../doctor/doctor.html';
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Error creating account: ' + (errorData.detail || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error: ' + error.message);
  }
});

document.querySelector('.sign-in form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.querySelector('.sign-in input[placeholder="Email"]').value;
  const password = document.querySelector('.sign-in input[placeholder="Password"]').value;

  if (!email || !password) {
    alert('Please enter email and password.');
    return;
  }

  const baseUrl = '/api/';

  try {
    // Try patient login first
    let response = await fetch(`${baseUrl}patients/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      // Set authentication data for patient
      localStorage.setItem('authToken', `patient_${userData.id}_${Date.now()}`);
      localStorage.setItem('userRole', 'patient');
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('userName', `${userData.first_name} ${userData.last_name}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('firstName', userData.first_name);
      localStorage.setItem('lastName', userData.last_name);

      alert(`Welcome back, ${userData.first_name}!`);
      window.location.href = '../patient/patient.html';
      return;
    }

    // Try doctor login
    response = await fetch(`${baseUrl}doctors/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      // Set authentication data for doctor
      localStorage.setItem('authToken', `doctor_${userData.id}_${Date.now()}`);
      localStorage.setItem('userRole', 'doctor');
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('userName', `Dr. ${userData.first_name} ${userData.last_name}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('firstName', userData.first_name);
      localStorage.setItem('lastName', userData.last_name);

      alert(`Welcome back, Dr. ${userData.first_name}!`);
      window.location.href = '../doctor/doctor.html';
      return;
    }

    // If both failed
    const errorData = await response.json().catch(() => ({}));
    alert('Invalid email or password.');

  } catch (error) {
    console.error('Error:', error);
    alert('Network error: ' + error.message);
  }
});

// Function to create 50 test users
async function createBatchUsers() {
  const baseUrl = '/api/';
  const users = [];
  const errors = [];

  for (let i = 1; i <= 50; i++) {
    const role = Math.random() > 0.5 ? 'patient' : 'doctor';
    const user = {
      first_name: `Test${i}`,
      last_name: `User${i}`,
      email: `test${i}@example.com`,
    };
    users.push({ ...user, role });
  }

  const progressDiv = document.createElement('div');
  progressDiv.id = 'progress';
  progressDiv.style.position = 'fixed';
  progressDiv.style.top = '10px';
  progressDiv.style.right = '10px';
  progressDiv.style.background = 'rgba(0,0,0,0.8)';
  progressDiv.style.color = 'white';
  progressDiv.style.padding = '10px';
  progressDiv.style.borderRadius = '5px';
  progressDiv.innerText = 'Creating users... 0/50';
  document.body.appendChild(progressDiv);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const url = user.role === 'patient' ? `${baseUrl}patients/` : `${baseUrl}doctors/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        errors.push(`User ${i+1}: ${errorData.detail || 'Error'}`);
      }
    } catch (error) {
      errors.push(`User ${i+1}: Network error - ${error.message}`);
    }
    progressDiv.innerText = `Creating users... ${i+1}/50`;
  }

  progressDiv.innerText = 'Done!';
  setTimeout(() => document.body.removeChild(progressDiv), 2000);

  if (errors.length > 0) {
    console.error('Errors:', errors);
    alert(`Batch creation completed with ${errors.length} errors. Check console for details.`);
  } else {
    alert('All 50 users created successfully!');
  }
}

// Function to create test users for demo
async function createTestUsers() {
  const baseUrl = '/api/';

  // Create test patient
  try {
    const patientResponse = await fetch(`${baseUrl}patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'patient@test.com'
      })
    });

    if (patientResponse.ok) {
      console.log('Test patient created successfully');
    } else {
      console.log('Test patient creation failed');
    }
  } catch (error) {
    console.error('Error creating test patient:', error);
  }

  // Create test doctor
  try {
    const doctorResponse = await fetch(`${baseUrl}doctors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Dr',
        last_name: 'Smith',
        email: 'doctor@test.com'
      })
    });

    if (doctorResponse.ok) {
      console.log('Test doctor created successfully');
    } else {
      console.log('Test doctor creation failed');
    }
  } catch (error) {
    console.error('Error creating test doctor:', error);
  }

  alert('Test users creation attempted. Check console for results.');
}

// Expose functions to console for testing
window.createBatchUsers = createBatchUsers;
window.createTestUsers = createTestUsers;
