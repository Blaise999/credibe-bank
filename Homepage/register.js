// register.js
document.addEventListener('DOMContentLoaded', () => {
  // ==============================
  // Config
  // ==============================
  const API_BASE = 'https://credibe-backends.onrender.com/api';
  const ENDPOINTS = {
    sendOtp: `${API_BASE}/auth/send-otp`, // ⬅️ UPDATED
    verifyOtp: `${API_BASE}//auth/verify-registration-otp`,
    register: `${API_BASE}/auth/register`,
  };

  // ==============================
  // DOM Refs (must exist at load)
  // ==============================
  const form = document.getElementById('register-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Optional/aux
  const phoneInput = document.getElementById('phone');
  const fullNameInput = document.getElementById('full-name') || document.getElementById('name');
  const otpSection = document.getElementById('otp-section');

  // UI bits
  const passwordStrength = document.getElementById('password-strength');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
  const languageSwitcher = document.getElementById('language-switcher');
  const chatToggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');

  // Early guard (only core)
  if (!form || !emailInput || !passwordInput || !confirmPasswordInput) {
    console.error('❌ Core DOM elements missing!');
    return;
  }

  // ==============================
  // Helpers
  // ==============================
  const getOtpEls = () => ({
    otpInput: document.getElementById('otp'),
    sendOtpButton: document.getElementById('send-otp'),
    otpMessage: document.getElementById('otp-message'),
  });

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v) => /^\+?[1-9]\d{6,14}$/.test(v);

  const setMessage = (el, text, tone = 'info') => {
    if (!el) return;
    const classes = {
      info: 'text-gray-400',
      success: 'text-green-500',
      error: 'text-red-500',
      warn: 'text-yellow-500',
    };
    el.textContent = text || '';
    el.className = `mt-2 text-sm ${classes[tone] || classes.info}`;
  };

  const setLoading = (btn, isLoading, idleText = 'Send OTP', loadingText = 'Sending...') => {
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.textContent = isLoading ? loadingText : idleText;
  };

  // ==============================
  // Password strength
  // ==============================
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value || '';
    let strength = 'Weak';
    let color = 'text-red-500';

    if (val.length >= 12 && /[A-Z]/.test(val) && /\d/.test(val) && /\W/.test(val)) {
      strength = 'Strong';
      color = 'text-green-500';
    } else if (val.length >= 8) {
      strength = 'Medium';
      color = 'text-yellow-500';
    }

    if (passwordStrength) {
      passwordStrength.textContent = `Password Strength: ${strength}`;
      passwordStrength.className = `mt-2 text-sm ${color}`;
    }
  });

  // ==============================
  // Toggle visibility
  // ==============================
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
      const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
      confirmPasswordInput.type = type;
      toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // ==============================
  // Email -> reveal OTP UI
  // ==============================
  emailInput.addEventListener('input', () => {
    const { sendOtpButton, otpMessage, otpInput } = getOtpEls();
    const email = emailInput.value.trim();
    const valid = isValidEmail(email);

    if (!otpSection || !sendOtpButton || !otpMessage) return;

    if (valid) {
      otpSection.classList.remove('hidden');
      sendOtpButton.classList.remove('hidden');
      sendOtpButton.style.display = 'block';
      setMessage(otpMessage, 'Please request an OTP.', 'info');
    } else {
      otpSection.classList.add('hidden');
      sendOtpButton.classList.add('hidden');
      sendOtpButton.style.display = 'none';
      setMessage(otpMessage, '');
      if (otpInput) otpInput.value = '';
    }
  });

  // ==============================
  // Send OTP
  // ==============================
  {
    const { sendOtpButton, otpMessage } = getOtpEls();
    if (sendOtpButton) {
      sendOtpButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();

        if (!isValidEmail(email)) {
          setMessage(otpMessage, 'Invalid email.', 'error');
          return;
        }

        try {
          setLoading(sendOtpButton, true);
          const res = await fetch(ENDPOINTS.sendOtp, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
           body: JSON.stringify({ email, type: 'registration' }),
          });
          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            setMessage(otpMessage, 'OTP sent successfully!', 'success');
            if (otpSection) otpSection.classList.remove('hidden');
          } else {
            setMessage(otpMessage, data?.error || 'OTP failed.', 'error');
          }
        } catch (err) {
          console.error('❌ OTP send failed:', err);
          setMessage(otpMessage, 'Server error. Try again.', 'error');
        } finally {
          setLoading(sendOtpButton, false);
        }
      });
    }
  }

  // ==============================
  // Submit (verify OTP -> register)
  // ==============================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { otpInput, otpMessage } = getOtpEls();

    const email = emailInput.value.trim();
    const password = passwordInput.value || '';
    const confirmPassword = confirmPasswordInput.value || '';
    const phone = (phoneInput?.value || '').trim();
    const otp = (otpInput?.value || '').trim();

    // Basic validations
    if (!password || !confirmPassword || password !== confirmPassword) {
      alert('Passwords do not match or are empty!');
      return;
    }
    if (!isValidEmail(email)) {
      alert('Invalid email format!');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      alert('Invalid phone number!');
      return;
    }
    if (!otp) {
      alert('OTP is required.');
      return;
    }

    // Button loading state
    const submitBtn = form.querySelector('button[type="submit"], [data-submit]');
    const setSubmitLoading = (loading) => {
      if (!submitBtn) return;
      submitBtn.disabled = !!loading;
      const original = submitBtn.getAttribute('data-text') || submitBtn.textContent;
      if (!submitBtn.getAttribute('data-text')) submitBtn.setAttribute('data-text', original);
      submitBtn.textContent = loading ? 'Creating account…' : submitBtn.getAttribute('data-text');
    };

    try {
      setSubmitLoading(true);

      // 1) Verify OTP
      const verifyRes = await fetch(ENDPOINTS.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        alert(verifyJson?.error || 'OTP verification failed.');
        setMessage(otpMessage, verifyJson?.error || 'Invalid OTP.', 'error');
        return;
      }

      // 2) Register (use fullName key; backend expects fullName, email, password)
      let fullName = (fullNameInput?.value || '').trim();
      if (!fullName) {
        // fallback: derive from email prefix
        fullName = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }

      const registerRes = await fetch(ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        // include optional fields only if you know backend accepts them
        body: JSON.stringify({ fullName, email, password /*, phone, country */ }),
      });
      const regJson = await registerRes.json().catch(() => ({}));

      if (!registerRes.ok) {
        console.warn('Registration error payload:', regJson);
        alert(regJson?.error || 'Registration failed.');
        return;
      }

      // Success
      alert('🎉 Registration successful!');
      // Persist token/user if returned
      if (regJson?.token) localStorage.setItem('credibe_token', regJson.token);
      if (regJson?.user) localStorage.setItem('credibe_user', JSON.stringify(regJson.user));
      localStorage.setItem('userEmail', email);

      // Cleanup + redirect
      form.reset();
      if (otpSection) otpSection.classList.add('hidden');
      const { sendOtpButton } = getOtpEls();
      if (sendOtpButton) sendOtpButton.classList.add('hidden');
      setMessage(otpMessage, '');
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('❌ Registration Error:', err);
      alert('Something went wrong. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  });

  // ==============================
  // Misc
  // ==============================
  if (languageSwitcher) {
    languageSwitcher.addEventListener('change', (e) => {
      console.log(`🌍 Language changed to: ${e.target.value}`);
    });
  }

  if (chatToggle && chatBox) {
    chatToggle.addEventListener('click', () => {
      chatBox.classList.toggle('hidden');
      console.log('💬 Chat box toggled');
    });
  }
});
