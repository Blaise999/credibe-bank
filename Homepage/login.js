console.log('login.js loaded successfully');

// ----- UI helpers -----
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText =
    'position:fixed;top:10px;right:10px;background:#ef4444;color:#fff;padding:10px 12px;border-radius:8px;z-index:1000;box-shadow:0 10px 24px rgba(0,0,0,.35);font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3200);
}

function validateForm(username, password) {
  if (!username) return showNotification('Enter username or email');
  if (!password || password.length < 4) return showNotification('Password must be at least 4 characters');
  return true;
}

// ----- Login submit -----
const form = document.getElementById("login-form");
if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!validateForm(username, password)) return;

    try {
      const res = await fetch("https://credibe-backends.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password })
      });

      // If the server returns non-JSON on error, guard with try/catch
      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok || !data) {
        return showNotification((data && (data.error || data.message)) || "Login failed");
      }

      // ---- BLOCK CHECK (🔥 your requirement) ----
      const isBlocked = !!(data && data.user && data.user.isBlocked === true);
      if (isBlocked) {
        // Clean any previous auth; carry a tiny hint for the blocked page
        localStorage.clear();
        sessionStorage.setItem("blockedEmail", username);
        // Optional: include a simple reason if API provides one
        if (data.user.blockedReason) sessionStorage.setItem("blockedReason", data.user.blockedReason);
        // Redirect to dedicated page
        window.location.href = "blockedd.html";
        return; // stop here
      }

      // ---- Normal login flow ----
      if (data.token) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userId", data.user?._id || "");
        localStorage.setItem("isBlocked", String(!!data.user?.isBlocked)); // for extra guards if you want
        localStorage.setItem("lastLogin", new Date().toISOString());

        // Short session demo (5 min)
        const logoutAt = Date.now() + (5 * 60 * 1000);
        localStorage.setItem("logoutAt", String(logoutAt));
        setTimeout(() => {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "login.html";
        }, 5 * 60 * 1000);

        // Remove any static login info node
        const staticLoginInfo = document.getElementById("static-login-info");
        if (staticLoginInfo) staticLoginInfo.remove();

        // Your existing loan redirect hook stays intact
        const fromLoan = sessionStorage.getItem("fromLoan");
        if (fromLoan === "true") {
          sessionStorage.removeItem("fromLoan");
          window.location.href = "ineligible.html";
          return;
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
}

// ----- Password toggle -----
const togglePassword = document.getElementById('toggle-password');
if (togglePassword) {
  const passwordInput = document.getElementById("password");
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "🙈" : "👁️";
  });
}

// ----- Language switcher (unchanged) -----
const languageSwitcher = document.getElementById('language-switcher');
if (languageSwitcher) {
  const translations = {
    en: { login: 'Sign in', username: 'Username or Email' },
    fr: { login: 'Connexion', username: 'Nom d’utilisateur ou email' }
  };
  const loginButton = document.getElementById("login-button");
  const usernameInput = document.getElementById("username");

  languageSwitcher.addEventListener('change', (e) => {
    const lang = e.target.value;
    if (translations[lang]) {
      loginButton.textContent = translations[lang].login;
      usernameInput.placeholder = translations[lang].username;
    }
  });
}
