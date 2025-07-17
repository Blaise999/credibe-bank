// Homepage.js
// Mobile Menu Toggle
const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.querySelector('#mobile-menu');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
}

// Parallax Effect
window.addEventListener('scroll', () => {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    parallaxSections.forEach(section => {
        const offset = window.pageYOffset;
        section.style.backgroundPositionY = `${offset * 0.5}px`;
    });
});

// Fade-in Effect
const fadeIns = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });
fadeIns.forEach(el => observer.observe(el));

// Stats Counter
const counters = document.querySelectorAll('.stat-counter');
if (counters) {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 0;
        const updateCounter = () => {
            const increment = target / 100;
            if (count < target) {
                count += increment;
                counter.innerText = Math.ceil(count);
                setTimeout(updateCounter, 20);
            } else {
                counter.innerText = target;
            }
        };
        observer.observe(counter);
        counter.addEventListener('animationstart', updateCounter, { once: true });
    });
}

// Rotating Card Effect
const cards = document.querySelectorAll('.rotate-card');
cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'rotateY(180deg) scale(1.05)';
        card.querySelector('.card-back').style.opacity = '1';
        card.querySelector('.card-front').style.opacity = '0';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateY(0deg) scale(1)';
        card.querySelector('.card-back').style.opacity = '0';
        card.querySelector('.card-front').style.opacity = '1';
    });
});

// Timeline Hover Animation
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.querySelector('.timeline-circle').style.transform = 'scale(1.5)';
        item.querySelector('.timeline-content').style.backgroundColor = 'rgba(0, 180, 216, 0.2)';
    });
    item.addEventListener('mouseleave', () => {
        item.querySelector('.timeline-circle').style.transform = 'scale(1)';
        item.querySelector('.timeline-content').style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
});

// SVG Chart Animation Optimization
const svgCircles = document.querySelectorAll('.svg-chart-circle');
svgCircles.forEach(circle => {
    observer.observe(circle);
    circle.addEventListener('animationstart', () => {
        circle.style.transition = 'stroke-dashoffset 2s ease-in-out';
    }, { once: true });
});

// Pulse Animation Enhancement
const pulseElements = document.querySelectorAll('.pulse-badge');
pulseElements.forEach(element => {
    element.addEventListener('animationiteration', () => {
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'pulse 2s infinite';
        });
    });
});

// 3D Tilt Effect
const tiltCards = document.querySelectorAll('.tilt-card');
if (tiltCards.length > 0 && typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(tiltCards, {
        max: 15,
        speed: 400,
        glare: true,
        'max-glare': 0.5,
    });
}

// Progress Bar Animation
const progressBars = document.querySelectorAll('.progress-bar');
progressBars.forEach(bar => {
    observer.observe(bar);
    bar.addEventListener('animationstart', () => {
        const targetWidth = bar.getAttribute('data-width');
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 2s ease-in-out';
            bar.style.width = `${targetWidth}%`;
        }, 100);
    }, { once: true });
});

// Interactive FAQ Toggle
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    item.addEventListener('click', () => {
        const answer = item.querySelector('.faq-answer');
        const chevron = item.querySelector('.faq-chevron');
        answer.classList.toggle('hidden');
        chevron.classList.toggle('rotate-180');
    });
});

// Animated Gradient Border
const gradientBorders = document.querySelectorAll('.gradient-border');
gradientBorders.forEach(border => {
    border.addEventListener('mouseenter', () => {
        border.style.background = 'linear-gradient(45deg, #00b4d8, #00d4ff, #00b4d8)';
        border.style.backgroundSize = '200%';
        border.style.animation = 'gradientShift 3s ease infinite';
    });
    border.addEventListener('mouseleave', () => {
        border.style.background = 'none';
        border.style.animation = 'none';
    });
});

// Hover Zoom Effect
const zoomCards = document.querySelectorAll('.zoom-card');
zoomCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.05)';
        card.style.zIndex = '10';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        card.style.zIndex = '1';
    });
});

// World Map Animation (for International Transfers)
const mapPaths = document.querySelectorAll('.map-path');
mapPaths.forEach(path => {
    observer.observe(path);
    path.addEventListener('animationstart', () => {
        path.style.transition = 'fill 1s ease-in-out';
        path.style.fill = '#00b4d8';
    }, { once: true });
});

// Currency Dropdown Toggle (for International Transfers)
const currencyDropdowns = document.querySelectorAll('.currency-dropdown');
currencyDropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', () => {
        const options = dropdown.querySelector('.dropdown-options');
        options.classList.toggle('hidden');
    });
});


// ==== JS Chat Simulation (Just for live-chat page) ====
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const chatContainer = document.getElementById('chat-container');

    sendBtn.addEventListener('click', function () {
        const message = input.value.trim();
        if (message !== '') {
            // Add user's message
            const userMsg = document.createElement('div');
            userMsg.className = 'flex justify-end';
            userMsg.innerHTML = `
                <div class="bg-gray-700 text-gray-200 p-4 rounded-lg max-w-xs relative">
                    ${message}
                    <div class="absolute -bottom-2 right-4 w-4 h-4 bg-gray-700 transform rotate-45"></div>
                </div>
            `;
            chatContainer.appendChild(userMsg);

            // Simulate bot reply
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'flex justify-start';
                botMsg.innerHTML = `
                    <div class="bg-credibe-blue text-white p-4 rounded-lg max-w-xs relative">
                        Thanks for your message. A representative will join shortly.
                        <div class="absolute -bottom-2 left-4 w-4 h-4 bg-credibe-blue transform rotate-45"></div>
                    </div>
                `;
                chatContainer.appendChild(botMsg);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 1000);

            // Clear input & scroll down
            input.value = '';
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });
});
