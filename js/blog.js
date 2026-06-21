/**
 * IEEE Nile University — Blog Listing Page Logic
 * Handles: blog fetching, search filter, category filter, newsletter
 */
(function () {
  'use strict';

  const API_BASE = 'https://localhost:7105/api';
  const ENDPOINTS = {
    blog: `${API_BASE}/Blog`,
    committees: `${API_BASE}/Committees`,
  };

  let allPosts = [];
  let activeCategory = 'all';
  let searchQuery = '';

  window.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
    loadFooterCommittees();
    initSearch();
    initCategoryFilter();
    initNewsletter();
    initScrollAnimations();
  });

  // ── Load Blog Posts ──
  async function loadBlogPosts() {
    const grid = document.getElementById('blog-grid');
    try {
      const res = await fetch(ENDPOINTS.blog);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allPosts = await res.json();
      renderPosts(allPosts);
    } catch (err) {
      console.error('Blog fetch error:', err);
      grid.innerHTML = `
        <div class="col-12 empty-state reveal">
          <i class="bi bi-journal-x d-block"></i>
          <p>Unable to load articles. Please ensure the backend is running.</p>
        </div>`;
      initScrollAnimations();
    }
  }

  function renderPosts(posts) {
    const grid = document.getElementById('blog-grid');
    grid.innerHTML = '';

    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="col-12 empty-state reveal">
          <i class="bi bi-journal-text d-block"></i>
          <p>No articles match your search. Try a different keyword or category.</p>
        </div>`;
      initScrollAnimations();
      return;
    }

    posts.forEach((post, idx) => {
      const delay = idx * 60;
      const date = formatDate(post.publishedDate);
      const authorName = post.author ? post.author.fullName : 'IEEE Team';
      const excerpt = truncate(stripHTML(post.content), 130);

      const col = document.createElement('div');
      col.className = 'col-md-6 mb-4';
      col.innerHTML = `
        <div class="blog-card reveal" style="transition-delay: ${delay}ms">
          <div class="blog-image">
            ${post.imageUrl
              ? `<img src="${escapeHTML(post.imageUrl)}" alt="${escapeHTML(post.title)}" />`
              : `<div class="blog-icon-placeholder"><i class="bi bi-journal-richtext"></i></div>`
            }
          </div>
          <div class="blog-body">
            <div class="blog-meta">
              <span class="author-name">${escapeHTML(authorName)}</span>
              <span class="mx-1">/</span>
              <span>${date}</span>
            </div>
            <h3>${escapeHTML(post.title)}</h3>
            <p class="blog-excerpt">${escapeHTML(excerpt)}</p>
            <a href="blog-post.html?id=${post.id}" class="read-more-link">Read Article <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>`;
      grid.appendChild(col);
    });

    initScrollAnimations();
  }

  // ── Search ──
  function initSearch() {
    const input = document.getElementById('blogSearch');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = input.value.trim().toLowerCase();
        applyFilters();
      }, 250);
    });
  }

  // ── Category Filter ──
  function initCategoryFilter() {
    const container = document.getElementById('categoryTags');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-btn');
      if (!btn) return;

      container.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  }

  function applyFilters() {
    let filtered = allPosts;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery) ||
        (p.content && p.content.toLowerCase().includes(searchQuery))
      );
    }

    // Category (soft match on title/content since backend doesn't have category field)
    if (activeCategory !== 'all') {
      const categoryMap = {
        'technical': ['code', 'programming', 'software', 'hardware', 'algorithm', 'technical', 'development'],
        'workshop': ['workshop', 'recap', 'session', 'training', 'hands-on'],
        'career': ['career', 'internship', 'interview', 'resume', 'job', 'professional'],
        'community': ['community', 'event', 'meetup', 'branch', 'team', 'volunteer'],
      };
      const keywords = categoryMap[activeCategory] || [];
      if (keywords.length) {
        filtered = filtered.filter(p => {
          const text = (p.title + ' ' + (p.content || '')).toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
      }
    }

    renderPosts(filtered);
  }

  // ── Newsletter ──
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const feedback = document.getElementById('newsletterFeedback');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        showFeedback(feedback, 'error', 'Please enter a valid email address.');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);

      setTimeout(() => {
        showFeedback(feedback, 'success', 'You have been subscribed. Welcome aboard.');
        form.reset();
        setButtonLoading(btn, false);
      }, 600);
    });
  }

  // ── Footer ──
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
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));
  }

  // ── Helpers ──
  function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function truncate(str, len) { return str && str.length > len ? str.substring(0, len) + '...' : (str || ''); }
  function stripHTML(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || d.innerText || '';
  }
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function showFeedback(el, type, msg) {
    if (!el) return;
    el.className = `feedback-panel text-center ${type} show`;
    el.textContent = msg;
  }
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('btn-loading', loading);
    btn.disabled = loading;
  }
})();
