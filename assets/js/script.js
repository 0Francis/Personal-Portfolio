/**
 * Main Script - Handles AOS, navigation, Feather icons, and animations
 */

// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            // Re-initialize feather icons for mobile menu
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        });

        // Close mobile menu when clicking on a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Typewriter effect for titles
    initTypewriter();
});

/**
 * Typewriter effect - types out titles one by one
 */
function initTypewriter() {
    const titles = [
        'Product Engineer',
        'Full-Stack Developer', 
        'Clean Energy Innovator'
    ];
    
    const typewriterElement = document.querySelector('.typewriter');
    if (!typewriterElement) return;
    
    let titleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;
    
    const typeSpeed = 100;      // Speed of typing
    const deleteSpeed = 50;     // Speed of deleting
    const pauseTime = 2000;     // Pause at end of word
    const pauseBetween = 500;   // Pause between words
    
    function type() {
        const currentTitle = titles[titleIndex];
        
        if (isPaused) {
            setTimeout(type, pauseBetween);
            isPaused = false;
            return;
        }
        
        if (isDeleting) {
            // Deleting characters
            typewriterElement.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                titleIndex = (titleIndex + 1) % titles.length;
                isPaused = true;
            }
            
            setTimeout(type, deleteSpeed);
        } else {
            // Typing characters
            typewriterElement.textContent = currentTitle.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === currentTitle.length) {
                isDeleting = true;
                setTimeout(type, pauseTime);
                return;
            }
            
            setTimeout(type, typeSpeed);
        }
    }
    
    // Start the typewriter effect
    setTimeout(type, 1000);
}