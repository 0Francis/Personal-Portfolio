AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });

        // Mobile menu toggle
document.getElementById('menu-btn').addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
            feather.replace();
        });

        // Close mobile menu when clicking on a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
            link.addEventListener('click', function() {
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        });

        // Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent default form submission
    const formData = new FormData(this);  // Get form data
    
    fetch(window.location.href, {
        method: 'POST',
        body: formData
    }).then(response => response.json())  // Expect JSON response
      .then(data => {
        if (data.status === 'success') {
            alert(data.message);  // Show success message
            // Optionally, reset the form: this.reset();
        } else {
            alert('Error: ' + data.message);  // Show error message
        }
      }).catch(error => {
        alert('Network error: ' + error.message);
      });
});     

feather.replace();