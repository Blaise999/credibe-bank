console.log('login.js loaded successfully');

let otpSent = false;
let lastOtpRequest = 0;
const otpRequestCooldown = 30 * 1000;

// Show alert notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f00; color: #fff; padding: 10px; border-radius: 5px; z-index: 1000;';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Validation
function validateForm(username, password, phone, otp) {
  if (!username) return showNotification('Enter username or email');
  if (!password || password.length < 4) return showNotification('Password must be at least 4 characters');
  if (!phone) return showNotification('Enter phone number');
  if (!otpSent) return showNotification('Please click "Send OTP" first');
  if (!otp || otp.length !== 6) return showNotification('Enter a valid 6-digit OTP');
  return true;
}

// Send real OTP from backend
document.getElementById("send-otp").addEventListener("click", () => {
  const email = document.getElementById("username").value.trim();
  if (!email) return showNotification("Enter your email/username first");
  if (Date.now() - lastOtpRequest < otpRequestCooldown) return showNotification('Wait before requesting another OTP');
  lastOtpRequest = Date.now();

  fetch("https://credibe-backends.onrender.com/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        otpSent = true;
        showNotification("OTP sent to your email (check console)");
      } else {
        showNotification(data.error || "Failed to send OTP");
      }
    })
    .catch(err => {
      console.error("OTP send error:", err);
      showNotification("Error sending OTP");
    });
});

// Login form submit
document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  console.log("Input username/email:", username);
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const otp = document.getElementById("otp").value.trim();

  if (!validateForm(username, password, phone, otp)) return;

  try {
    const res = await fetch("https://credibe-backends.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password, phone, otp })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userId", data.user._id); // ✅ Save userId for transaction history
      localStorage.setItem("lastLogin", new Date().toLocaleString());
      


      const fromLoan = sessionStorage.getItem("fromLoan");
      if (fromLoan === "true") {
        sessionStorage.removeItem("fromLoan");
        return window.location.href = "ineligible.html";
      }

      window.location.href = "dashboard.html";
    } else {
      showNotification(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    showNotification("Something went wrong");
  }
});

// Password toggle
const togglePassword = document.getElementById('toggle-password');
if (togglePassword) {
  const passwordInput = document.getElementById("password");
  togglePassword.addEventListener("click", () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    togglePassword.textContent = passwordInput.type === "password" ? "👁️" : "🙈";
  });
}

// Language switcher
const languageSwitcher = document.getElementById('language-switcher');
if (languageSwitcher) {
  const translations = {
    en: { login: 'Login', username: 'Username or Email', phone: 'Phone Number', otp: 'Enter OTP', sendOtp: 'Send OTP' },
    fr: { login: 'Connexion', username: 'Nom d’utilisateur ou email', phone: 'Numéro de téléphone', otp: 'Entrez le OTP', sendOtp: 'Envoyer OTP' }
  };
  const loginButton = document.getElementById("login-button");
  const usernameInput = document.getElementById("username");
  const phoneInput = document.getElementById("phone");
  const otpInput = document.getElementById("otp");
  const sendOtpButton = document.getElementById("send-otp");

  languageSwitcher.addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang in translations) {
      loginButton.textContent = translations[lang].login;
      usernameInput.placeholder = translations[lang].username;
      phoneInput.placeholder = translations[lang].phone;
      otpInput.placeholder = translations[lang].otp;
      sendOtpButton.textContent = translations[lang].sendOtp;
    }
  });
}

// Load last login
const lastLoginElement = document.getElementById("last-login");
if (lastLoginElement) {
  const lastLogin = localStorage.getItem("lastLogin");
  lastLoginElement.textContent = lastLogin || "Not available";
}
