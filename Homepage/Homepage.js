// Force navbar visibility
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  if (header) {
    header.style.display = 'block !important';
    header.style.position = 'fixed !important';
    header.style.top = '0 !important';
    header.style.width = '100% !important';
    header.style.zIndex = '200 !important';
    header.style.visibility = 'visible !important';
    header.style.opacity = '1 !important';
  }

  // Force visibility on scroll, resize, and touch
  ['scroll', 'resize', 'touchmove'].forEach(event => {
    window.addEventListener(event, () => {
      if (header) {
        header.style.display = 'block !important';
        header.style.visibility = 'visible !important';
        header.style.opacity = '1 !important';
      }
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenuBtn = document.getElementById('close-mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.remove('translate-x-full');
      mobileMenu.classList.add('translate-x-0');
      console.log('[Mobile] Menu opened');
    });
  }

  if (closeMenuBtn && mobileMenu) {
    closeMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('translate-x-0');
      mobileMenu.classList.add('translate-x-full');
      // Ensure navbar remains visible
      if (header) {
        header.style.display = 'block !important';
        header.style.visibility = 'visible !important';
        header.style.opacity = '1 !important';
      }
      console.log('[Mobile] Menu closed');
    });
  }

  // Dropdown toggles (mobile)
  const dropdownToggles = document.querySelectorAll('.dropdown-mobile-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        const dropdownMenu = toggle.nextElementSibling;
        document.querySelectorAll('.dropdown-mobile-content').forEach(menu => {
          if (menu !== dropdownMenu) {
            menu.classList.add('hidden');
            menu.classList.remove('block');
          }
        });
        dropdownMenu.classList.toggle('hidden');
        dropdownMenu.classList.toggle('block');
        console.log('[Dropdown] Toggled:', dropdownMenu);
      }
    });
  });

  // Chat toggle
  function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) {
      const isVisible = chatBox.style.display === 'block';
      chatBox.style.display = isVisible ? 'none' : 'block';
      console.log('[Chat] Chat toggled:', !isVisible);
    }
  }

  // Testimonial slider
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevButton = document.querySelector('.slider-prev');
  const nextButton = document.querySelector('.slider-next');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  if (slides.length > 0 && prevButton && nextButton) {
    prevButton.addEventListener('click', () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
      console.log('[Testimonial] Prev Slide:', currentSlide);
    });

    nextButton.addEventListener('click', () => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
      console.log('[Testimonial] Next Slide:', currentSlide);
    });

    showSlide(currentSlide);
  }

  // Hero Swiper
  const heroSwiper = new Swiper('.swiper-container', {
    loop: true,
    autoplay: {
      delay: 6000,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: 1000,
    slidesPerView: 1,
    spaceBetween: 0,
    touchRatio: 1.5,
  });

  // Promo Swiper
  const promoSwiper = new Swiper('.promoSwiper', {
    loop: true,
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
      nextEl: '.promoSwiper .swiper-button-next',
      prevEl: '.promoSwiper .swiper-button-prev',
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    speed: 900,
  });

  // Auto reset mobile menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileMenu) {
      mobileMenu.classList.add('translate-x-full');
      mobileMenu.classList.remove('translate-x-0');
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
      }, 200);
      console.log('[Mobile] Menu closed on resize to desktop');
    }
  });

  // Expose toggleChat globally
  window.toggleChat = toggleChat;
});