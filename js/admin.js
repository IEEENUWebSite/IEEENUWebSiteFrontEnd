/**
 * IEEE Nile University — Admin Desk Logic
 * Modules: Auth + role guard, Events CRUD, Blog CRUD, Image Upload
 */
(function () {
  'use strict';

  const API_BASE = 'https://localhost:7105/api';
  const ENDPOINTS = {
    events: `${API_BASE}/Events`,
    blog: `${API_BASE}/Blog`,
    upload: `${API_BASE}/Upload`,
  };

  const ADMIN_ROLES = ['admin', 'board', 'media'];

  // ── Auth ──
  function getToken() { return localStorage.getItem('ieee_token'); }
  function getMember() { try { return JSON.parse(localStorage.getItem('ieee_member')); } catch { return null; } }
  function authHeaders(json) {
    const h = { 'Authorization': `Bearer ${getToken()}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }
  function logout() { localStorage.removeItem('ieee_token'); localStorage.removeItem('ieee_member'); window.location.href = '../login.html'; }

  // ── Init ──
  window.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    const member = getMember();
    if (!token || !member) { window.location.href = '../login.html'; return; }

    const role = (member.role || '').toLowerCase();
    if (!ADMIN_ROLES.includes(role)) { window.location.href = 'dashboard.html'; return; }

    initTopbar(member);
    initSidebar();
    initLogout();
    loadEvents();
    loadBlog();
    initEventModal();
    initBlogModal();
    initImageUploadPreviews();
  });

  function initTopbar(member) {
    const nameEl = document.getElementById('topbarUserName');
    const avatarEl = document.getElementById('topbarAvatar');
    if (nameEl) nameEl.textContent = member.fullName || '';
    if (avatarEl) {
      if (member.profilePictureUrl) {
        avatarEl.innerHTML = `<img src="${member.profilePictureUrl}" alt="" class="topbar-avatar-img" />`;
      } else {
        avatarEl.textContent = (member.fullName || 'A').charAt(0).toUpperCase();
      }
    }
  }

  function initSidebar() {
    const navItems = document.querySelectorAll('.dash-nav-item[data-section]');
    const titleEl = document.getElementById('topbarTitle');
    const titles = { events: 'Events Manager', blog: 'Blog Manager' };
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const s = item.dataset.section;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(`section-${s}`);
        if (target) target.classList.add('active');
        if (titleEl) titleEl.textContent = titles[s] || '';
        closeMobileSidebar();
      });
    });
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('dashSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (toggle) toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
    if (overlay) overlay.addEventListener('click', closeMobileSidebar);
  }
  function closeMobileSidebar() {
    const sb = document.getElementById('dashSidebar');
    const ov = document.getElementById('sidebarOverlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('show');
  }
  function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  // ══════════════════════════════════════════
  //  IMAGE UPLOAD PREVIEWS
  // ══════════════════════════════════════════

  function initImageUploadPreviews() {
    setupImagePreview('eventImageFile', 'eventImagePreview');
    setupImagePreview('blogImageFile', 'blogImagePreview');
  }

  function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => { preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`; };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(fileInput) {
    const file = fileInput.files[0];
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(ENDPOINTS.upload, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
    if (!res.ok) throw new Error('Image upload failed.');
    const data = await res.json();
    return data.url;
  }

  // ══════════════════════════════════════════
  //  EVENTS MANAGER
  // ══════════════════════════════════════════

  let allEvents = [];

  async function loadEvents() {
    const tbody = document.getElementById('eventsTableBody');
    try {
      const res = await fetch(ENDPOINTS.events, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allEvents = await res.json();
      renderEventsTable();
    } catch (err) {
      console.error('Events load error:', err);
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Failed to load events.</td></tr>';
    }
  }

  function renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (allEvents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No events found. Click "Add Event" to create one.</td></tr>';
      return;
    }
    tbody.innerHTML = allEvents.map(ev => {
      const dateStr = new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const imgCell = ev.imageUrl
        ? `<img src="${escapeAttr(ev.imageUrl)}" class="table-thumb" alt="" />`
        : `<span class="table-thumb-placeholder"><i class="bi bi-calendar-event"></i></span>`;
      return `<tr>
        <td>${imgCell}</td>
        <td style="font-weight: 600;">${escapeHTML(ev.title)}</td>
        <td>${dateStr}</td>
        <td>${escapeHTML(ev.location)}</td>
        <td>${ev.maxAttendees === 0 ? 'Unlimited' : ev.maxAttendees}</td>
        <td><span class="admin-badge ${ev.isPublic ? 'public' : 'private'}">${ev.isPublic ? 'Public' : 'Private'}</span></td>
        <td>
          <button class="table-action-btn" title="Edit" onclick="editEvent(${ev.id})"><i class="bi bi-pencil"></i></button>
          <button class="table-action-btn danger" title="Delete" onclick="confirmDelete('event', ${ev.id}, '${escapeAttr(ev.title)}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }

  function initEventModal() {
    document.getElementById('addEventBtn').addEventListener('click', () => openEventModal());
    document.getElementById('eventSaveBtn').addEventListener('click', saveEvent);
  }

  function openEventModal(event) {
    document.getElementById('eventId').value = event ? event.id : '';
    document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'Add Event';
    document.getElementById('eventTitle').value = event ? event.title : '';
    document.getElementById('eventDescription').value = event ? event.description : '';
    document.getElementById('eventDate').value = event ? toLocalISOString(event.eventDate) : '';
    document.getElementById('eventLocation').value = event ? event.location : '';
    document.getElementById('eventMaxAttendees').value = event ? event.maxAttendees : 0;
    document.getElementById('eventIsPublic').checked = event ? event.isPublic : true;
    document.getElementById('eventImageFile').value = '';

    const preview = document.getElementById('eventImagePreview');
    if (event && event.imageUrl) {
      preview.innerHTML = `<img src="${event.imageUrl}" alt="Current" />`;
    } else {
      preview.innerHTML = '<div class="upload-icon"><i class="bi bi-image"></i></div><div class="upload-label"><strong>Click to upload</strong> or drag an image</div>';
    }

    hideFeedback('eventFormFeedback');
    new bootstrap.Modal(document.getElementById('eventModal')).show();
  }

  window.editEvent = function (id) {
    const ev = allEvents.find(e => e.id === id);
    if (ev) openEventModal(ev);
  };

  async function saveEvent() {
    const btn = document.getElementById('eventSaveBtn');
    const feedback = document.getElementById('eventFormFeedback');
    hideFeedback(feedback);

    const id = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const location = document.getElementById('eventLocation').value.trim();
    const maxAttendees = parseInt(document.getElementById('eventMaxAttendees').value, 10) || 0;
    const isPublic = document.getElementById('eventIsPublic').checked;

    if (!title || !description || !eventDate || !location) {
      showFeedback(feedback, 'error', 'Please fill in all required fields.');
      return;
    }

    setButtonLoading(btn, true);

    try {
      let imageUrl = null;
      const fileInput = document.getElementById('eventImageFile');
      if (fileInput.files[0]) {
        imageUrl = await uploadImage(fileInput);
      }

      const payload = { title, description, eventDate, location, maxAttendees, isPublic };
      if (imageUrl) payload.imageUrl = imageUrl;
      else if (id) {
        const existing = allEvents.find(e => e.id === parseInt(id, 10));
        if (existing && existing.imageUrl) payload.imageUrl = existing.imageUrl;
      }

      let res;
      if (id) {
        res = await fetch(`${ENDPOINTS.events}/${id}`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(payload) });
      } else {
        res = await fetch(ENDPOINTS.events, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(payload) });
      }

      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || d.title || 'Save failed.'); }

      bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
      await loadEvents();
      showFeedback('eventsFeedback', 'success', id ? 'Event updated successfully.' : 'Event created successfully.');
    } catch (err) {
      console.error('Event save error:', err);
      showFeedback(feedback, 'error', err.message || 'Failed to save event.');
    } finally {
      setButtonLoading(btn, false);
    }
  }

  // ══════════════════════════════════════════
  //  BLOG MANAGER
  // ══════════════════════════════════════════

  let allPosts = [];

  async function loadBlog() {
    const tbody = document.getElementById('blogTableBody');
    try {
      const res = await fetch(ENDPOINTS.blog, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allPosts = await res.json();
      renderBlogTable();
    } catch (err) {
      console.error('Blog load error:', err);
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Failed to load posts.</td></tr>';
    }
  }

  function renderBlogTable() {
    const tbody = document.getElementById('blogTableBody');
    if (allPosts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No posts found. Click "New Post" to create one.</td></tr>';
      return;
    }
    tbody.innerHTML = allPosts.map(p => {
      const dateStr = new Date(p.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const authorName = p.author ? p.author.fullName : 'Unknown';
      const imgCell = p.imageUrl
        ? `<img src="${escapeAttr(p.imageUrl)}" class="table-thumb" alt="" />`
        : `<span class="table-thumb-placeholder"><i class="bi bi-journal-text"></i></span>`;
      return `<tr>
        <td>${imgCell}</td>
        <td style="font-weight: 600;">${escapeHTML(p.title)}</td>
        <td>${escapeHTML(authorName)}</td>
        <td>${dateStr}</td>
        <td><span class="admin-badge ${p.isPublished ? 'published' : 'draft'}">${p.isPublished ? 'Published' : 'Draft'}</span></td>
        <td>
          <button class="table-action-btn" title="Edit" onclick="editPost(${p.id})"><i class="bi bi-pencil"></i></button>
          <button class="table-action-btn" title="${p.isPublished ? 'Unpublish' : 'Publish'}" onclick="togglePublish(${p.id})"><i class="bi ${p.isPublished ? 'bi-eye-slash' : 'bi-eye'}"></i></button>
          <button class="table-action-btn danger" title="Delete" onclick="confirmDelete('blog', ${p.id}, '${escapeAttr(p.title)}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }

  function initBlogModal() {
    document.getElementById('addBlogBtn').addEventListener('click', () => openBlogModal());
    document.getElementById('blogSaveBtn').addEventListener('click', saveBlogPost);
  }

  function openBlogModal(post) {
    document.getElementById('blogId').value = post ? post.id : '';
    document.getElementById('blogModalTitle').textContent = post ? 'Edit Post' : 'New Post';
    document.getElementById('blogTitle').value = post ? post.title : '';
    document.getElementById('blogContent').value = post ? post.content : '';
    document.getElementById('blogIsPublished').checked = post ? post.isPublished : false;
    document.getElementById('blogImageFile').value = '';

    const preview = document.getElementById('blogImagePreview');
    if (post && post.imageUrl) {
      preview.innerHTML = `<img src="${post.imageUrl}" alt="Current" />`;
    } else {
      preview.innerHTML = '<div class="upload-icon"><i class="bi bi-image"></i></div><div class="upload-label"><strong>Click to upload</strong> or drag an image</div>';
    }

    hideFeedback('blogFormFeedback');
    new bootstrap.Modal(document.getElementById('blogModal')).show();
  }

  window.editPost = function (id) {
    const post = allPosts.find(p => p.id === id);
    if (post) openBlogModal(post);
  };

  window.togglePublish = async function (id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    try {
      const payload = { title: post.title, content: post.content, isPublished: !post.isPublished };
      if (post.imageUrl) payload.imageUrl = post.imageUrl;
      const res = await fetch(`${ENDPOINTS.blog}/${id}`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(payload) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Toggle failed.');
      await loadBlog();
      showFeedback('blogFeedback', 'success', `Post ${post.isPublished ? 'unpublished' : 'published'} successfully.`);
    } catch (err) {
      console.error('Toggle publish error:', err);
      showFeedback('blogFeedback', 'error', 'Failed to update publish status.');
    }
  };

  async function saveBlogPost() {
    const btn = document.getElementById('blogSaveBtn');
    const feedback = document.getElementById('blogFormFeedback');
    hideFeedback(feedback);

    const id = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const isPublished = document.getElementById('blogIsPublished').checked;

    if (!title || !content) {
      showFeedback(feedback, 'error', 'Please fill in the title and content.');
      return;
    }

    setButtonLoading(btn, true);

    try {
      let imageUrl = null;
      const fileInput = document.getElementById('blogImageFile');
      if (fileInput.files[0]) {
        imageUrl = await uploadImage(fileInput);
      }

      const payload = { title, content, isPublished };
      if (imageUrl) payload.imageUrl = imageUrl;
      else if (id) {
        const existing = allPosts.find(p => p.id === parseInt(id, 10));
        if (existing && existing.imageUrl) payload.imageUrl = existing.imageUrl;
      }

      let res;
      if (id) {
        res = await fetch(`${ENDPOINTS.blog}/${id}`, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(payload) });
      } else {
        res = await fetch(ENDPOINTS.blog, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(payload) });
      }

      if (res.status === 401) { logout(); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || d.title || 'Save failed.'); }

      bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide();
      await loadBlog();
      showFeedback('blogFeedback', 'success', id ? 'Post updated successfully.' : 'Post created successfully.');
    } catch (err) {
      console.error('Blog save error:', err);
      showFeedback(feedback, 'error', err.message || 'Failed to save post.');
    } finally {
      setButtonLoading(btn, false);
    }
  }

  // ══════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════

  let deleteTarget = { type: '', id: 0 };

  window.confirmDelete = function (type, id, title) {
    deleteTarget = { type, id };
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  };

  (function initDelete() {
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('deleteConfirmBtn');
      if (btn) btn.addEventListener('click', executeDelete);
    });
  })();

  async function executeDelete() {
    const btn = document.getElementById('deleteConfirmBtn');
    setButtonLoading(btn, true);

    try {
      const endpoint = deleteTarget.type === 'event' ? ENDPOINTS.events : ENDPOINTS.blog;
      const res = await fetch(`${endpoint}/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Delete failed.');

      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();

      if (deleteTarget.type === 'event') {
        await loadEvents();
        showFeedback('eventsFeedback', 'success', 'Event deleted successfully.');
      } else {
        await loadBlog();
        showFeedback('blogFeedback', 'success', 'Post deleted successfully.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      const feedbackId = deleteTarget.type === 'event' ? 'eventsFeedback' : 'blogFeedback';
      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      showFeedback(feedbackId, 'error', 'Failed to delete. Please try again.');
    } finally {
      setButtonLoading(btn, false);
    }
  }

  // ── Helpers ──
  function escapeHTML(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function escapeAttr(str) { return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
  function toLocalISOString(dateStr) {
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
  function showFeedback(elOrId, type, msg) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.className = `feedback-panel feedback-panel-light text-center ${type} show`;
    el.textContent = msg;
  }
  function hideFeedback(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.className = 'feedback-panel feedback-panel-light text-center';
    el.textContent = '';
  }
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('btn-loading', loading);
    btn.disabled = loading;
  }
})();
