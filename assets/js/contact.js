/**
 * Contact Form Handler
 * Submits form data to Netlify Function with anti-spam measures and reCAPTCHA v3
 */

// reCAPTCHA site key
const RECAPTCHA_SITE_KEY = '6LeC7SksAAAAAFWlhfvN7cjF3VkmFhLoQKE_ryM5';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const responseMsg = document.getElementById("responseMsg");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const timestampField = document.getElementById("_timestamp");

  // Set timestamp when form loads (for anti-spam timing check)
  if (timestampField) {
    timestampField.value = Date.now().toString();
  }

  if (!form) {
    console.warn("Contact form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable submit button to prevent double submission
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    responseMsg.innerHTML = `<p class="text-gray-500">Verifying and sending message...</p>`;

    // Collect form data as JSON
    const formData = {
      name: form.querySelector("#name")?.value?.trim() || "",
      email: form.querySelector("#email")?.value?.trim() || "",
      subject: form.querySelector("#subject")?.value?.trim() || "",
      message: form.querySelector("#message")?.value?.trim() || "",
      _gotcha: form.querySelector("#_gotcha")?.value || "", // Honeypot
      _timestamp: timestampField?.value || Date.now().toString(),
    };

    // Client-side validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      responseMsg.innerHTML = `<p class="text-red-600 font-medium">Please fill in all fields.</p>`;
      resetButton();
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      responseMsg.innerHTML = `<p class="text-red-600 font-medium">Please enter a valid email address.</p>`;
      resetButton();
      return;
    }

    // Get reCAPTCHA token if available
    try {
      if (typeof grecaptcha !== 'undefined' && RECAPTCHA_SITE_KEY !== '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
        const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact' });
        formData.recaptchaToken = recaptchaToken;
      }
    } catch (recaptchaError) {
      console.warn("reCAPTCHA not available:", recaptchaError);
      // Continue without reCAPTCHA
    }

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.status === "success") {
        responseMsg.innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-green-700 font-medium flex items-center justify-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              ${data.message}
            </p>
          </div>
        `;
        form.reset();
        // Reset timestamp for next submission
        if (timestampField) {
          timestampField.value = Date.now().toString();
        }
      } else {
        responseMsg.innerHTML = `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-700 font-medium flex items-center justify-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              ${data.message}
            </p>
          </div>
        `;
      }
    } catch (err) {
      console.error("Contact form error:", err);
      responseMsg.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700 font-medium">Something went wrong. Please try again later.</p>
        </div>
      `;
    }

    resetButton();
  });

  function resetButton() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  }
});
