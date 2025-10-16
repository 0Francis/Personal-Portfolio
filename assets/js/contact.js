document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const responseMsg = document.getElementById("responseMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    responseMsg.innerHTML = `<p class="text-gray-500">Sending message...</p>`;

    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const data = await res.json();

      if (data.status === "success") {
        responseMsg.innerHTML = `<p class="text-green-600 font-medium">${data.message}</p>`;
        form.reset();
      } else {
        responseMsg.innerHTML = `<p class="text-red-600 font-medium">${data.message}</p>`;
      }
    } catch (err) {
      console.error(err);
      responseMsg.innerHTML = `<p class="text-red-600 font-medium">Something went wrong. Please try again later.</p>`;
    }
  });
});
