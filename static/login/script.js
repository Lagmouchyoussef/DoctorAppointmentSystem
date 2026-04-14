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

  const baseUrl = 'http://127.0.0.1:8001/api/';
  let url, data;

  if (role === 'patient') {
    url = `${baseUrl}patients/`;
    data = {
      first_name: firstName,
      last_name: lastName,
      email: email
    };
  } else {
    url = `${baseUrl}doctors/`;
    data = {
      first_name: firstName,
      last_name: lastName,
      email: email
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
        window.location.href = '/static/patient/patient.html';
      } else {
        window.location.href = '/static/doctor/doctor.html';
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

  const baseUrl = 'http://127.0.0.1:8001/api/';

  try {
    // Check if patient
    let response = await fetch(`${baseUrl}patients/?email=${email}`);
    let data = await response.json();
    if (data.results.length > 0) {
      // Set authentication data
      localStorage.setItem('authToken', `patient_${data.results[0].id}_${Date.now()}`);
      localStorage.setItem('userRole', 'patient');
      localStorage.setItem('userId', data.results[0].id);
      localStorage.setItem('userName', `${data.results[0].first_name} ${data.results[0].last_name}`);
      localStorage.setItem('email', email);
      localStorage.setItem('firstName', data.results[0].first_name);
      localStorage.setItem('lastName', data.results[0].last_name);

      alert(`Welcome back, ${data.results[0].first_name}!`);
      window.location.href = '/static/patient/patient.html';
      return;
    }

    // Check if doctor
    response = await fetch(`${baseUrl}doctors/?email=${email}`);
    data = await response.json();
    if (data.results.length > 0) {
      // Set authentication data
      localStorage.setItem('authToken', `doctor_${data.results[0].id}_${Date.now()}`);
      localStorage.setItem('userRole', 'doctor');
      localStorage.setItem('userId', data.results[0].id);
      localStorage.setItem('userName', `Dr. ${data.results[0].first_name} ${data.results[0].last_name}`);
      localStorage.setItem('email', email);
      localStorage.setItem('firstName', data.results[0].first_name);
      localStorage.setItem('lastName', data.results[0].last_name);

      alert(`Welcome back, Dr. ${data.results[0].first_name}!`);
      window.location.href = '/static/doctor/doctor.html';
      return;
    }

    alert('User not found.');
  } catch (error) {
    console.error('Error:', error);
    alert('Network error: ' + error.message);
  }
});

// Function to create 50 test users
async function createBatchUsers() {
  const baseUrl = 'http://127.0.0.1:8001/api/';
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

// Expose function to console for testing
window.createBatchUsers = createBatchUsers;
