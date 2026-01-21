document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }

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

    initTypewriter();
});

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
    
    const typeSpeed = 100;      
    const deleteSpeed = 50;     
    const pauseTime = 2000;     
    const pauseBetween = 500;   
    
    function type() {
        const currentTitle = titles[titleIndex];
        
        if (isPaused) {
            setTimeout(type, pauseBetween);
            isPaused = false;
            return;
        }
        
        if (isDeleting) {
            typewriterElement.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                titleIndex = (titleIndex + 1) % titles.length;
                isPaused = true;
            }
            
            setTimeout(type, deleteSpeed);
        } else {
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
    
    setTimeout(type, 1000);
}