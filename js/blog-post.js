/**
 * IEEE Nile University — Blog Post (Single Article) Page Logic
 * Handles: article fetching by ID, reading progress bar, social sharing
 */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5126/api';
  const ENDPOINTS = {
    blogPost: (id) => `${API_BASE}/Blog/${id}`,
    committees: `${API_BASE}/Committees`,
  };

  window.addEventListener('DOMContentLoaded', () => {
    loadArticle();
    loadFooterCommittees();
    initReadingProgress();
  });

  // ── Load Article ──
  async function loadArticle() {
    const container = document.getElementById('article-container');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
      renderError(container, 'No article specified. Please select an article from the blog.');
      return;
    }

    try {
      const res = await fetch(ENDPOINTS.blogPost(postId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const post = await res.json();
      renderArticle(container, post);
      // Update page title
      document.title = `${post.title} | IEEE Nile University`;
    } catch (err) {
      console.error('Article fetch error:', err);
      renderError(container, 'Unable to load this article. It may not exist or the backend may be offline.');
    }
  }

  function renderArticle(container, post) {
    const authorName = post.author ? post.author.fullName : 'IEEE Team';
    const authorInitial = authorName.charAt(0).toUpperCase();
    const date = formatDate(post.publishedDate);
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(post.title);

    container.innerHTML = `
      <!-- Article Header -->
      <div class="article-header">
        <h1>${escapeHTML(post.title)}</h1>
        <div class="article-meta">
          <span class="author-badge">
            <span class="author-avatar"><i class="bi bi-person"></i></span>
            ${escapeHTML(authorName)}
          </span>
          <span><i class="bi bi-calendar3 me-1"></i> ${date}</span>
          <span id="readTime"><i class="bi bi-clock me-1"></i> Calculating...</span>
        </div>
      </div>

      ${post.imageUrl ? `<img src="${escapeHTML(post.imageUrl)}" alt="${escapeHTML(post.title)}" class="article-feature-image" />` : ''}

      <!-- Article Body -->
      <div class="article-body" id="articleBody">
        ${post.content}
      </div>

      <!-- Share Bar -->
      <div class="share-bar">
        <span class="share-label">Share</span>
        <button class="share-btn" onclick="shareLinkedIn()" title="Share on LinkedIn" aria-label="Share on LinkedIn">
          <i class="bi bi-linkedin"></i>
        </button>
        <button class="share-btn" onclick="shareTwitter()" title="Share on X" aria-label="Share on X">
          <i class="bi bi-twitter-x"></i>
        </button>
        <button class="share-btn" onclick="copyLink()" title="Copy link" aria-label="Copy article link" id="copyLinkBtn">
          <i class="bi bi-link-45deg"></i>
        </button>
      </div>
    `;

    // Calculate read time
    const bodyEl = document.getElementById('articleBody');
    if (bodyEl) {
      const text = bodyEl.textContent || '';
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      document.getElementById('readTime').innerHTML = `<i class="bi bi-clock me-1"></i> ${minutes} min read`;
    }
  }

  function renderError(container, message) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 6rem 2rem;">
        <i class="bi bi-journal-x d-block" style="font-size: 3rem; color: rgba(var(--ieee-primary-rgb), 0.3); margin-bottom: 1rem;"></i>
        <p style="color: var(--ieee-secondary);">${message}</p>
        <a href="blog.html" class="btn btn-ieee btn-ieee-primary mt-3" style="padding: 0.6rem 1.5rem; font-size: 0.85rem;">
          <span class="btn-text">Browse All Articles</span>
        </a>
      </div>`;
  }

  // ── Reading Progress Bar ──
  function initReadingProgress() {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${Math.min(100, progress)}%`;
    }, { passive: true });
  }

  // ── Social Sharing ──
  window.shareLinkedIn = function () {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=500');
  };

  window.shareTwitter = function () {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
  };

  window.copyLink = function () {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const btn = document.getElementById('copyLinkBtn');
      if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
        btn.style.background = 'var(--ieee-primary)';
        btn.style.color = 'var(--ieee-white)';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);
      }
    }).catch(() => {
      // Fallback: select and copy
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

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

  // ── Helpers ──
  function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
})();
