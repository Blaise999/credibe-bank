document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const passwordStrength = document.getElementById('password-strength');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const otpSection = document.getElementById('otp-section');
  const otpInput = document.getElementById('otp');
  const sendOtpButton = document.getElementById('send-otp');
  const otpMessage = document.getElementById('otp-message');
  const form = document.getElementById('register-form');
  const languageSwitcher = document.getElementById('language-switcher');
  const chatToggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');

  if (!passwordInput || !confirmPasswordInput || !form || !emailInput || !otpInput || !sendOtpButton) {
    console.error('❌ DOM elements missing!');
    return;
  }

  // Password Strength
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let strength = 'Weak';
    let color = 'text-red-500';

    if (val.length >= 12 && /[A-Z]/.test(val) && /\d/.test(val) && /\W/.test(val)) {
      strength = 'Strong';
      color = 'text-green-500';
    } else if (val.length >= 8) {
      strength = 'Medium';
      color = 'text-yellow-500';
    }

    passwordStrength.textContent = `Password Strength: ${strength}`;
    passwordStrength.className = `mt-2 text-sm ${color}`;
  });

  // Toggle Password Visibility
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });

  toggleConfirmPassword.addEventListener('click', () => {
    const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    confirmPasswordInput.type = type;
    toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Email → OTP Section Reveal
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
      otpInput.value = '';
    }
  });

  // Send OTP Button
  sendOtpButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      otpMessage.textContent = 'Invalid email.';
      otpMessage.className = 'mt-2 text-sm text-red-500';
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/send-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ OTP sent:', data);
        otpMessage.textContent = 'OTP sent successfully!';
        otpMessage.className = 'mt-2 text-sm text-green-500';
        otpSection.classList.remove('hidden');
      } else {
        otpMessage.textContent = data.error || 'OTP failed.';
        otpMessage.className = 'mt-2 text-sm text-red-500';
      }
    } catch (err) {
      console.error('❌ OTP send failed:', err);
      otpMessage.textContent = 'Server error. Try again.';
      otpMessage.className = 'mt-2 text-sm text-red-500';
    }
  });

  // Final Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Re-query confirmPasswordInput to handle dynamic DOM changes
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (!confirmPasswordInput) {
      console.error('❌ confirmPasswordInput is missing during form submission!');
      alert('Form configuration error: Confirm password field is missing.');
      return;
    }

    const email = emailInput.value.trim();
    const phone = phoneInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput.value || '';
    const otp = otpInput.value.trim();

    // Validate inputs
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
      // Step 1: Verify OTP
      const verifyRes = await fetch('http://localhost:3000/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const verifyResult = await verifyRes.json();

      if (!verifyRes.ok) {
        alert(verifyResult.error || 'OTP verification failed.');
        otpMessage.textContent = verifyResult.error || 'Invalid OTP.';
        otpMessage.className = 'mt-2 text-sm text-red-500';
        return;
      }

      // Step 2: Register
      document.getElementById('name').value = document.getElementById('full-name')?.value?.trim() || '';
      const name = document.getElementById('name').value;

      const registerRes = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }) // ⬅ No phone included here
      });

      const regData = await registerRes.json();

      if (registerRes.ok) {
        alert('🎉 Registration successful!');

        // Optional: Save user data to localStorage
        localStorage.setItem("userEmail", email);

        // Redirect to dashboard
        window.location.href = "dashboard.html";

        // Optional cleanup
        form.reset();
        otpSection.classList.add('hidden');
        sendOtpButton.classList.add('hidden');
        otpMessage.textContent = '';
      } else {
        alert(regData.error || 'Registration failed.');
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