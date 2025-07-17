// ✅ Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('-translate-x-full');
    mobileMenu.classList.toggle('translate-x-0');
  });
}

// ✅ Auto-close menu on desktop resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768 && mobileMenu) {
    mobileMenu.classList.add('-translate-x-full');
    mobileMenu.classList.remove('translate-x-0');
  }
});

// ✅ 3D Tilt Effect for Cards
if (typeof VanillaTilt !== 'undefined') {
  const tiltCards = document.querySelectorAll('.tilt-card');
  if (tiltCards.length > 0) {
    VanillaTilt.init(tiltCards, {
      max: 15,
      speed: 400,
      glare: true,
      'max-glare': 0.5,
    });
    console.log('VanillaTilt initialized for tilt-card elements');
  }
}

// ✅ Animate World Map Path
const mapPaths = document.querySelectorAll('.map-path');
if (mapPaths.length > 0) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.fill = '#00b4d8';
      }
    });
  }, { threshold: 0.1 });

  mapPaths.forEach(path => observer.observe(path));
}

// ✅ Fade-in Animation
const fadeIns = document.querySelectorAll('.fade-in');
if (fadeIns.length > 0) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  fadeIns.forEach(el => observer.observe(el));
}

// ✅ Optional: Form Validation (Disabled if user must log in)
const transferForm = document.getElementById('international-transfer-form');
const submitTransfer = document.getElementById('submit-international-transfer');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');

if (transferForm && submitTransfer && submitText && submitSpinner) {
  transferForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('International Transfer form submitted');

    const recipientName = document.getElementById('recipient-name')?.value.trim();
    const recipientBank = document.getElementById('recipient-bank')?.value.trim();
    const recipientIban = document.getElementById('recipient-iban')?.value.trim();
    const bicSwift = document.getElementById('bic-swift')?.value.trim();
    const amount = parseFloat(document.getElementById('amount')?.value);

    if (!recipientName || !recipientBank || !recipientIban || !bicSwift || isNaN(amount)) {
      alert('Please fill all required fields.');
      return;
    }

    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(recipientIban.replace(/\s/g, ''))) {
      alert('Please enter a valid IBAN (e.g., GB29NWBK60161331926819).');
      return;
    }

    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}$/.test(bicSwift.replace(/\s/g, ''))) {
      alert('Please enter a valid BIC/SWIFT code (e.g., BARCGB22).');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than 0.');
      return;
    }

    // Simulate submission
    submitText.textContent = 'Processing...';
    submitSpinner.classList.remove('hidden');
    submitTransfer.disabled = true;

    setTimeout(() => {
      submitText.textContent = 'Success!';
      submitSpinner.classList.add('hidden');

      setTimeout(() => {
        alert('International Transfer submitted successfully! (Demo)');
        transferForm.reset();
        submitText.textContent = 'Send Now';
        submitTransfer.disabled = false;
      }, 1000);
    }, 2000);
  });
}
