console.log('login.js loaded successfully');

// Show alert notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f00; color: #fff; padding: 10px; border-radius: 5px; z-index: 1000;';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Validation
function validateForm(username, password) {
  if (!username) return showNotification('Enter username or email');
  if (!password || password.length < 4) return showNotification('Password must be at least 4 characters');
  return true;
}

// Login form submit
document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  console.log("Input username/email:", username);
  const password = document.getElementById("password").value.trim();

  if (!validateForm(username, password)) return;

  try {
    const res = await fetch("https://credibe-backends.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("isBlocked", data.user.isBlocked); // 🚫 store block status
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("lastLogin", new Date().toLocaleString());

      // 🔄 Remove static login date once logged in
      const staticLoginInfo = document.getElementById("static-login-info");
      if (staticLoginInfo) staticLoginInfo.remove();

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
    en: { login: 'Login', username: 'Username or Email' },
    fr: { login: 'Connexion', username: 'Nom d’utilisateur ou email' }
  };
  const loginButton = document.getElementById("login-button");
  const usernameInput = document.getElementById("username");

  languageSwitcher.addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang in translations) {
      loginButton.textContent = translations[lang].login;
      usernameInput.placeholder = translations[lang].username;
    }
  });
}
