document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('signup-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';
  statusEl.className = '';

  const data = {
    firstName: document.getElementById('first-name').value.trim(),
    lastName: document.getElementById('last-name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    level: document.getElementById('level').value
  };

  if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.level) {
    statusEl.textContent = 'Please fill out every field.';
    statusEl.className = 'error';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    const res = await fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Something went wrong. Please try again.');
    }

    statusEl.textContent = "You're in! Redirecting to your book…";
    statusEl.className = 'success';

    window.location.href = `thank-you.html?level=${encodeURIComponent(data.level)}`;
  } catch (err) {
    statusEl.textContent = err.message || 'Something went wrong. Please try again.';
    statusEl.className = 'error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get My Free Book';
  }
});
