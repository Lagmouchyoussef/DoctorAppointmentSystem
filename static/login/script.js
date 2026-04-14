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
      alert(`Account created for ${firstName} ${lastName} as ${role}.`);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      localStorage.setItem('userName', `${firstName} ${lastName}`);
      if (role === 'patient') {
        window.location.href = '/static/patient/patient.html';
      } else {
        window.location.href = '/static/doctor/doctor.html';
      }
    } else {
      alert('Error creating account. Email may already exist.');
    }
  } catch (error) {
    alert('Network error.');
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
      localStorage.setItem('role', 'patient');
      localStorage.setItem('email', email);
      localStorage.setItem('userName', `${data.results[0].first_name} ${data.results[0].last_name}`);
      window.location.href = '/static/patient/patient.html';
      return;
    }

    // Check if doctor
    response = await fetch(`${baseUrl}doctors/?email=${email}`);
    data = await response.json();
    if (data.results.length > 0) {
      localStorage.setItem('role', 'doctor');
      localStorage.setItem('email', email);
      localStorage.setItem('userName', `Dr. ${data.results[0].first_name} ${data.results[0].last_name}`);
      window.location.href = '/static/doctor/doctor.html';
      return;
    }

    alert('User not found.');
  } catch (error) {
    alert('Network error.');
  }
});
