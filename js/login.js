/**
 * IEEE Nile University — Login Page Logic
 */
(function () {
  'use strict';

  const API_LOGIN = 'http://localhost:5126/api/Auth/Login';

  window.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    if (localStorage.getItem('ieee_token')) {
      window.location.href = 'member/dashboard.html';
      return;
    }
    initLoginForm();
  });

  function initLoginForm() {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');
    const feedback = document.getElementById('loginFeedback');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearValidation(form);
      hideFeedback(feedback);

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      // Validate
      const errors = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) errors.push({ field: 'loginEmail', message: 'Please enter a valid email address.' });
      if (!password) errors.push({ field: 'loginPassword', message: 'Password is required.' });

      if (errors.length > 0) {
        errors.forEach(({ field, message }) => showFieldError(field, message));
        return;
      }

      setButtonLoading(btn, true);

      try {
        const res = await fetch(API_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.token) {
          // Store token and member info
          localStorage.setItem('ieee_token', data.token);
          if (data.member) {
            localStorage.setItem('ieee_member', JSON.stringify(data.member));
          }
          // Redirect to dashboard
          window.location.href = 'member/dashboard.html';
        } else {
          const msg = data.message || data.title || 'Invalid email or password. Please try again.';
          showFeedback(feedback, 'error', msg);
        }
      } catch (err) {
        console.error('Login error:', err);
        showFeedback(feedback, 'error', 'Unable to connect to the server. Please check your connection.');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ── Helpers ──
  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('is-invalid');
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
  }
  function clearValidation(form) {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.validation-message.show').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
  }
  function showFeedback(el, type, msg) {
    if (!el) return;
    el.className = `feedback-panel mt-4 text-center ${type} show`;
    el.textContent = msg;
  }
  function hideFeedback(el) {
    if (!el) return;
    el.className = 'feedback-panel mt-4 text-center';
    el.textContent = '';
  }
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('btn-loading', loading);
    btn.disabled = loading;
  }
})();
