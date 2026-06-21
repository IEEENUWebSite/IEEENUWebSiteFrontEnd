/**
 * IEEE Nile University — Events Hub Page Logic
 * Handles: event fetching, filtering, registration modal
 */
(function () {
  'use strict';

  const API_BASE = 'https://localhost:7105/api';
  const ENDPOINTS = {
    events: `${API_BASE}/Events`,
    committees: `${API_BASE}/Committees`,
    register: (id) => `${API_BASE}/Events/${id}/Register`,
  };

  let allEvents = [];

  // ── Init ──
  window.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadFooterCommittees();
    initFilters();
    initRegistration();
    initScrollAnimations();
  });

  // ── Load Events ──
  async function loadEvents() {
    const grid = document.getElementById('events-grid');
    try {
      const res = await fetch(ENDPOINTS.events);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allEvents = await res.json();
      renderEvents(allEvents);
    } catch (err) {
      console.error('Events fetch error:', err);
      grid.innerHTML = `
        <div class="col-12 empty-state reveal">
          <i class="bi bi-calendar-x d-block"></i>
          <p>Unable to load events. Please ensure the backend is running.</p>
        </div>`;
      initScrollAnimations();
    }
  }

  function renderEvents(events) {
    const grid = document.getElementById('events-grid');
    grid.innerHTML = '';

    if (events.length === 0) {
      grid.innerHTML = `
        <div class="col-12 empty-state reveal">
          <i class="bi bi-calendar-event d-block"></i>
          <p>No events match the selected filter. Check back soon for new sessions.</p>
        </div>`;
      initScrollAnimations();
      return;
    }

    events.forEach((event, idx) => {
      const isUpcoming = new Date(event.eventDate) > new Date();
      const formattedDate = formatDate(event.eventDate);
      const delay = idx * 60;
      const excerpt = truncate(event.description, 120);

      const col = document.createElement('div');
      col.className = 'col-lg-4 col-md-6 mb-4';
      col.innerHTML = `
        <div class="event-hub-card reveal" style="transition-delay: ${delay}ms">
          <div class="event-image">
            ${event.imageUrl
              ? `<img src="${escapeHTML(event.imageUrl)}" alt="${escapeHTML(event.title)}" />`
              : `<i class="bi bi-calendar-event event-icon-placeholder"></i>`
            }
            <span class="event-date-badge">${formattedDate}</span>
          </div>
          <div class="event-body">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="event-status-badge ${isUpcoming ? 'upcoming' : 'past'}">${isUpcoming ? 'Upcoming' : 'Completed'}</span>
            </div>
            <h3>${escapeHTML(event.title)}</h3>
            <div class="event-meta">
              <i class="bi bi-geo-alt"></i>${escapeHTML(event.location)}
              ${event.maxAttendees > 0 ? `<span class="ms-3"><i class="bi bi-people"></i> ${event.maxAttendees} spots</span>` : ''}
            </div>
            <p>${escapeHTML(excerpt)}</p>
          </div>
          <div class="event-footer">
            ${isUpcoming
              ? `<button class="btn btn-ieee btn-ieee-primary w-100" style="padding: 0.6rem; font-size: 0.82rem;" onclick="openRegisterModal(${event.id}, '${escapeAttr(event.title)}')">
                  <span class="btn-text">Register Now</span>
                </button>`
              : `<span class="d-block text-center" style="color: var(--ieee-secondary); font-size: 0.85rem; font-family: var(--ieee-font-heading); font-weight: 600;">Event Completed</span>`
            }
          </div>
        </div>`;
      grid.appendChild(col);
    });

    initScrollAnimations();
  }

  // ── Filters ──
  function initFilters() {
    const filterBar = document.getElementById('filterBar');
    if (!filterBar) return;

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const now = new Date();

      let filtered;
      if (filter === 'upcoming') {
        filtered = allEvents.filter(ev => new Date(ev.eventDate) > now);
      } else if (filter === 'past') {
        filtered = allEvents.filter(ev => new Date(ev.eventDate) <= now);
      } else {
        filtered = allEvents;
      }
      renderEvents(filtered);
    });
  }

  // ── Registration Modal ──
  function initRegistration() {
    const submitBtn = document.getElementById('registerSubmitBtn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', handleRegistration);
  }

  // Expose to onclick
  window.openRegisterModal = function (eventId, eventTitle) {
    document.getElementById('registerEventId').value = eventId;
    document.getElementById('registerEventName').textContent = eventTitle;
    document.getElementById('registerFeedback').className = 'feedback-panel text-center';
    document.getElementById('registerFeedback').textContent = '';
    document.getElementById('registerForm').reset();
    clearValidation(document.getElementById('registerForm'));
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
  };

  async function handleRegistration() {
    const form = document.getElementById('registerForm');
    const feedback = document.getElementById('registerFeedback');
    const submitBtn = document.getElementById('registerSubmitBtn');

    clearValidation(form);
    hideFeedback(feedback);

    // Validate
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    if (!val('regFullName').trim()) errors.push({ field: 'regFullName', message: 'Full name is required.' });
    if (!emailRegex.test(val('regEmail'))) errors.push({ field: 'regEmail', message: 'Please enter a valid email address.' });
    if (!phoneRegex.test(val('regPhone'))) errors.push({ field: 'regPhone', message: 'Please enter a valid phone number.' });
    if (!val('regNUID').trim()) errors.push({ field: 'regNUID', message: 'ID is required.' });

    if (errors.length > 0) {
      errors.forEach(({ field, message }) => showFieldError(field, message));
      return;
    }

    const eventId = document.getElementById('registerEventId').value;
    const payload = {
      fullName: val('regFullName'),
      email: val('regEmail'),
      phone: val('regPhone'),
      nuid: val('regNUID'),
    };

    setButtonLoading(submitBtn, true);

    try {
      const res = await fetch(ENDPOINTS.register(eventId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showFeedback(feedback, 'success', 'You have been registered successfully. We look forward to seeing you there.');
        form.reset();
      } else {
        const result = await res.json().catch(() => ({}));
        const msg = result.message || result.title || 'Registration failed. Please try again.';
        showFeedback(feedback, 'error', msg);
      }
    } catch (err) {
      console.error('Registration error:', err);
      showFeedback(feedback, 'error', 'A network error occurred. Please check your connection.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  // ── Footer Committees ──
  async function loadFooterCommittees() {
    const footerList = document.getElementById('footer-committees-list');
    if (!footerList) return;
    try {
      const res = await fetch(ENDPOINTS.committees);
      if (!res.ok) return;
      const committees = await res.json();
      footerList.innerHTML = committees.map(c => `<span class="footer-link">${escapeHTML(c.name)}</span>`).join('');
    } catch (e) { /* silent */ }
  }

  // ── Scroll Animations ──
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
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));
  }

  // ── Helpers ──
  function val(id) { return (document.getElementById(id) || {}).value || ''; }
  function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function escapeAttr(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
  function truncate(str, len) { return str && str.length > len ? str.substring(0, len) + '...' : (str || ''); }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('is-invalid');
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
  }

  function clearValidation(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.validation-message.show').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
  }

  function showFeedback(el, type, msg) {
    if (!el) return;
    el.className = `feedback-panel text-center ${type} show`;
    el.textContent = msg;
  }
  function hideFeedback(el) {
    if (!el) return;
    el.className = 'feedback-panel text-center';
    el.textContent = '';
  }
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('btn-loading', loading);
    btn.disabled = loading;
  }
})();
