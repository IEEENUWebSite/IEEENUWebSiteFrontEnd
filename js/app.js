/**
 * IEEE Nile University Student Branch — Frontend Application
 * Modules: Navbar, Committees, Recruitment, Contact, Scroll Animations
 */

(function () {
  'use strict';

  // ── Configuration ──
  const API_BASE = 'https://localhost:7105/api';
  const ENDPOINTS = {
    committees: `${API_BASE}/Committees`,
    apply: `${API_BASE}/Recruitment/Apply`,
  };

  // Committee name → Bootstrap Icon mapping
  const ICON_MAP = {
    'PR':        'bi-megaphone',
    'HR':        'bi-person-badge',
    'Media':     'bi-camera-reels',
    'Marketing': 'bi-graph-up-arrow',
    'Operations':'bi-gear',
    'Hardware':  'bi-cpu',
    'Software':  'bi-code-slash',
  };

  function getCommitteeIcon(name) {
    for (const [key, icon] of Object.entries(ICON_MAP)) {
      if (name.includes(key)) return icon;
    }
    return 'bi-people';
  }

  // ── 1. Navbar Scroll Behavior ──
  function initNavbar() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    const update = () => {
      if (window.scrollY > 50) {
        nav.classList.add('navbar-shrink');
      } else {
        nav.classList.remove('navbar-shrink');
      }
    };

    update();
    document.addEventListener('scroll', update, { passive: true });

    // Collapse mobile menu on link click
    const toggler = nav.querySelector('.navbar-toggler');
    const links = nav.querySelectorAll('#navbarResponsive .nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (toggler && window.getComputedStyle(toggler).display !== 'none') {
          toggler.click();
        }
      });
    });
  }

  // ── 2. Load Committees ──
  async function loadCommittees() {
    const container = document.getElementById('committees-container');
    const firstChoice = document.getElementById('firstChoice');
    const secondChoice = document.getElementById('secondChoice');
    const footerList = document.getElementById('footer-committees-list');

    try {
      const res = await fetch(ENDPOINTS.committees);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const committees = await res.json();

      // Clear skeleton loaders
      container.innerHTML = '';

      // Clear dropdowns
      firstChoice.innerHTML = '<option value="" disabled selected>Select First Choice</option>';
      secondChoice.innerHTML = '<option value="">None</option>';

      if (committees.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center text-muted">
            <p>No committees configured yet.</p>
          </div>`;
        return;
      }

      // Footer committee list
      let footerHTML = '';

      committees.forEach((c, idx) => {
        const icon = getCommitteeIcon(c.name);
        const delay = idx * 80;

        // Committee card
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
          <div class="committee-card reveal" style="transition-delay: ${delay}ms">
            <div class="committee-icon">
              <i class="bi ${icon}"></i>
            </div>
            <h3>${escapeHTML(c.name)}</h3>
            <p>${escapeHTML(c.description || 'No description provided.')}</p>
          </div>`;
        container.appendChild(col);

        // Dropdown options
        const opt1 = new Option(c.name, c.id);
        firstChoice.appendChild(opt1);
        const opt2 = new Option(c.name, c.id);
        secondChoice.appendChild(opt2);

        // Footer list
        footerHTML += `<span class="footer-link">${escapeHTML(c.name)}</span>`;
      });

      if (footerList) footerList.innerHTML = footerHTML;

      // Trigger reveal for newly added cards
      initScrollAnimations();

    } catch (err) {
      console.error('Committees fetch error:', err);
      container.innerHTML = `
        <div class="col-12 text-center" style="color: var(--ieee-secondary);">
          <p>Unable to load committees. Please ensure the backend is running.</p>
        </div>`;
    }
  }

  // ── 3. Recruitment Form ──
  function initRecruitmentForm() {
    const form = document.getElementById('recruitmentForm');
    const submitBtn = document.getElementById('submitBtn');
    const feedback = document.getElementById('formFeedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset feedback
      hideFeedback(feedback);
      clearValidation(form);

      // Validate
      const errors = validateRecruitmentForm();
      if (errors.length > 0) {
        errors.forEach(({ field, message }) => showFieldError(field, message));
        return;
      }

      // Build payload
      const payload = {
        fullName: val('fullName'),
        email: val('email'),
        phone: val('phone'),
        nuid: val('nuid'),
        faculty: val('faculty'),
        major: val('major'),
        academicYear: val('academicYear'),
        firstChoiceCommitteeId: parseInt(val('firstChoice'), 10),
        secondChoiceCommitteeId: val('secondChoice') ? parseInt(val('secondChoice'), 10) : null,
        bio: val('bio'),
        pastExperience: val('pastExperience') || null,
        whyJoin: val('whyJoin'),
        whatDoYouKnow: val('whatDoYouKnow'),
      };

      // Submit
      setButtonLoading(submitBtn, true);

      try {
        const res = await fetch(ENDPOINTS.apply, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (res.ok) {
          showFeedback(feedback, 'success', 'Your application has been submitted successfully. We will review it and get back to you shortly.');
          form.reset();
        } else {
          const msg = result.message || result.title || 'Validation error. Please check your inputs and try again.';
          showFeedback(feedback, 'error', msg);
        }
      } catch (err) {
        console.error('Recruitment submit error:', err);
        showFeedback(feedback, 'error', 'A network error occurred. Please check your connection and try again.');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  function validateRecruitmentForm() {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    if (!val('fullName').trim()) errors.push({ field: 'fullName', message: 'Full name is required.' });
    if (!emailRegex.test(val('email'))) errors.push({ field: 'email', message: 'Please enter a valid email address.' });
    if (!phoneRegex.test(val('phone'))) errors.push({ field: 'phone', message: 'Please enter a valid phone number.' });
    if (!val('nuid').trim()) errors.push({ field: 'nuid', message: 'ID is required.' });
    if (!val('faculty')) errors.push({ field: 'faculty', message: 'Please select a faculty.' });
    if (!val('major').trim()) errors.push({ field: 'major', message: 'Major is required.' });
    if (!val('academicYear')) errors.push({ field: 'academicYear', message: 'Please select your academic year.' });
    if (!val('firstChoice')) errors.push({ field: 'firstChoice', message: 'Please select a first choice committee.' });
    if (!val('bio').trim()) errors.push({ field: 'bio', message: 'Please tell us about yourself.' });
    if (!val('whyJoin').trim()) errors.push({ field: 'whyJoin', message: 'Please explain why you want to join.' });
    if (!val('whatDoYouKnow').trim()) errors.push({ field: 'whatDoYouKnow', message: 'Please share what you know about IEEE.' });

    return errors;
  }

  // ── 4. Contact Form ──
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const btn = document.getElementById('contactSubmitButton');
    const feedback = document.getElementById('contactFeedback');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setButtonLoading(btn, true);

      // Simulate submission delay
      setTimeout(() => {
        showFeedback(feedback, 'success', 'Thank you for your message. We will get back to you shortly.');
        form.reset();
        setButtonLoading(btn, false);
      }, 800);
    });
  }

  // ── 5. Scroll Reveal Animations ──
  function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal:not(.visible)');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    });

    reveals.forEach(el => observer.observe(el));
  }

  // ── Helpers ──
  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }
  }

  function clearValidation(form) {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.validation-message.show').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });
  }

  function showFeedback(el, type, message) {
    if (!el) return;
    el.className = `feedback-panel mt-4 text-center ${type} show`;
    if (el.classList.contains('feedback-panel-light')) {
      el.className = `feedback-panel feedback-panel-light mt-4 text-center ${type} show`;
    }
    el.textContent = message;
  }

  function hideFeedback(el) {
    if (!el) return;
    el.className = el.className.replace(/\b(success|error|show)\b/g, '').trim();
    el.textContent = '';
  }

  function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  }

  // ── Initialize ──
  window.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    loadCommittees();
    initRecruitmentForm();
    initContactForm();
    initScrollAnimations();
  });
})();
