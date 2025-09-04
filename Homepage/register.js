document.addEventListener('DOMContentLoaded', () => {
  // DOM References (only the ones that MUST exist on load)
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const passwordStrength = document.getElementById('password-strength');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const otpSection = document.getElementById('otp-section');
  const form = document.getElementById('register-form');
  const languageSwitcher = document.getElementById('language-switcher');
  const chatToggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');

  // ✅ Do NOT require OTP elements at load time
  if (!passwordInput || !confirmPasswordInput || !form || !emailInput) {
    console.error('❌ Core DOM elements missing!');
    return;
  }

  // Safely query OTP bits when needed
  const getOtpEls = () => ({
    otpInput: document.getElementById('otp'),
    sendOtpButton: document.getElementById('send-otp'),
    otpMessage: document.getElementById('otp-message'),
  });

  // Password Strength
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let strength = 'Weak', color = 'text-red-500';
    if (val.length >= 12 && /[A-Z]/.test(val) && /\d/.test(val) && /\W/.test(val)) {
      strength = 'Strong'; color = 'text-green-500';
    } else if (val.length >= 8) {
      strength = 'Medium'; color = 'text-yellow-500';
    }
    passwordStrength.textContent = `Password Strength: ${strength}`;
    passwordStrength.className = `mt-2 text-sm ${color}`;
  });

  // Toggle Password Visibility (guard in case icons aren’t present)
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

  // Email → show OTP UI
  emailInput.addEventListener('input', () => {
    const { sendOtpButton, otpMessage } = getOtpEls();
    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!otpSection || !sendOtpButton || !otpMessage) return; // if OTP UI truly isn’t on the page

    if (isValid) {
      otpSection.classList.remove('hidden');
      sendOtpButton.classList.remove('hidden');
      sendOtpButton.style.display = 'block';
      otpMessage.textContent = 'Please request an OTP.';
      otpMessage.className = 'mt-2 text-sm text-gray-400';
    } else {
      otpSection.classList.add('hidden');
      sendOtpButton.classList.add('hidden');
      sendOtpButton.style.display = 'none';
      otpMessage.textContent = '';
      const { otpInput } = getOtpEls();
      if (otpInput) otpInput.value = '';
    }
  });

  // Send OTP
  {
    const { sendOtpButton, otpMessage } = getOtpEls();
    if (sendOtpButton) {
      sendOtpButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const { otpSection } = { otpSection };
        const { otpMessage } = getOtpEls();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (otpMessage) {
            otpMessage.textContent = 'Invalid email.';
            otpMessage.className = 'mt-2 text-sm text-red-500';
          }
          return;
        }
        try {
          const res = await fetch('https://credibe-backends.onrender.com/api/auth/send-registration-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (res.ok) {
            if (otpMessage) {
              otpMessage.textContent = 'OTP sent successfully!';
              otpMessage.className = 'mt-2 text-sm text-green-500';
            }
            if (otpSection) otpSection.classList.remove('hidden');
          } else {
            if (otpMessage) {
              otpMessage.textContent = data.error || 'OTP failed.';
              otpMessage.className = 'mt-2 text-sm text-red-500';
            }
          }
        } catch (err) {
          console.error('❌ OTP send failed:', err);
          if (otpMessage) {
            otpMessage.textContent = 'Server error. Try again.';
            otpMessage.className = 'mt-2 text-sm text-red-500';
          }
        }
      });
    }
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { otpInput, otpMessage } = getOtpEls();

    const email = emailInput.value.trim();
    const phone = phoneInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';
    const otp = otpInput?.value?.trim() || '';

    if (!password || !confirmPassword || password !== confirmPassword) {
      alert('Passwords do not match or are empty!');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Invalid email format!');
      return;
    }
    if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone)) {
      alert('Invalid phone number!');
      return;
    }
    if (!otp) {
      alert('OTP is required.');
      return;
    }

    try {
      // 1) Verify OTP
      const verifyRes = await fetch('https://credibe-backends.onrender.com/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        alert(verifyResult.error || 'OTP verification failed.');
        if (otpMessage) {
          otpMessage.textContent = verifyResult.error || 'Invalid OTP.';
          otpMessage.className = 'mt-2 text-sm text-red-500';
        }
        return;
      }

      // 2) Register — use fullName (or whatever your API expects)
      const fullName =
        (document.getElementById('full-name')?.value || document.getElementById('name')?.value || '').trim();

      const registerRes = await fetch('https://credibe-backends.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If your API also expects country/phone, include them here.
        body: JSON.stringify({ fullName, email, password /* , phone, country */ }),
      });

      const regData = await registerRes.json();

      if (registerRes.ok) {
        alert('🎉 Registration successful!');
        localStorage.setItem('userEmail', email);
        window.location.href = 'dashboard.html';
        form.reset();
        if (otpSection) otpSection.classList.add('hidden');
        const { sendOtpButton } = getOtpEls();
        if (sendOtpButton) sendOtpButton.classList.add('hidden');
        if (otpMessage) otpMessage.textContent = '';
      } else {
        alert(regData.error || 'Registration failed.');
        console.warn('Registration error payload:', regData);
      }
    } catch (err) {
      console.error('❌ Registration Error:', err);
      alert('Something went wrong. Try again.');
    }
  });

  // Language
  if (languageSwitcher) {
    languageSwitcher.addEventListener('change', (e) => {
      console.log(`🌍 Language changed to: ${e.target.value}`);
    });
  }

  // Chat
  if (chatToggle && chatBox) {
    chatToggle.addEventListener('click', () => {
      chatBox.classList.toggle('hidden');
      console.log('💬 Chat box toggled');
    });
  }
});
