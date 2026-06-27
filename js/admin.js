/**
 * IEEE Nile University — Admin Desk Logic
 * Modules: Auth + role guard, Events CRUD, Blog CRUD, Image Upload
 */
(function () {
  'use strict';

  const API_BASE = 'https://ieeenuwebsite-b6bfh8dfg3bqfue6.francecentral-01.azurewebsites.net/api';
  const ENDPOINTS = {
    events: `${API_BASE}/Events`,
    blog: `${API_BASE}/Blog`,
    upload: `${API_BASE}/Upload`,
    members: `${API_BASE}/Members`,
    committees: `${API_BASE}/Committees`,
    recruitment: `${API_BASE}/Recruitment`,
    attendance: `${API_BASE}/Attendance`,
    tasks: `${API_BASE}/Tasks`
  };

  const ADMIN_ROLES = ['admin', 'board', 'media', 'moderator'];

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

    if (role === 'admin' || role === 'board' || role === 'moderator') {
      const navAttendance = document.getElementById('nav-attendance');
      if (navAttendance) navAttendance.style.display = 'block';
      const navTasks = document.getElementById('nav-tasks');
      if (navTasks) navTasks.style.display = 'block';

      loadEventsForAttendanceDropdown();
      loadTasks();
      initAttendanceDesk();
      initTaskDesk();
    }

    if (role === 'admin') {
      const navMembers = document.getElementById('nav-members');
      if (navMembers) navMembers.style.display = 'block';
      const navApplications = document.getElementById('nav-applications');
      if (navApplications) navApplications.style.display = 'block';
      loadMembers();
      loadCommitteesForDropdown();
      initMemberModal();
      loadApplications();
      initApplicationModal();
    }
  });

  function initTopbar(member) {
    const nameEl = document.getElementById('topbarUserName');
    const avatarEl = document.getElementById('topbarAvatar');
    if (nameEl) nameEl.textContent = member.fullName || '';
    if (avatarEl) {
      if (member.profilePictureUrl) {
        avatarEl.innerHTML = `<img src="${member.profilePictureUrl}" alt="" class="topbar-avatar-img" style="width: 36px; height: 36px; object-fit: cover; border-radius: 50%;" />`;
      } else {
        avatarEl.textContent = (member.fullName || 'A').charAt(0).toUpperCase();
      }
    }
  }

  function initSidebar() {
    const navItems = document.querySelectorAll('.dash-nav-item[data-section]');
    const titleEl = document.getElementById('topbarTitle');
    const titles = {
      events: 'Events Manager',
      blog: 'Blog Manager',
      members: 'Members Manager',
      applications: 'Applications Manager',
      attendance: 'Attendance Desk',
      tasks: 'Task Manager'
    };
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
      let endpoint;
      if (deleteTarget.type === 'event') endpoint = ENDPOINTS.events;
      else if (deleteTarget.type === 'member') endpoint = ENDPOINTS.members;
      else endpoint = ENDPOINTS.blog;

      const res = await fetch(`${endpoint}/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Delete failed.');
      }

      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();

      if (deleteTarget.type === 'event') {
        await loadEvents();
        showFeedback('eventsFeedback', 'success', 'Event deleted successfully.');
      } else if (deleteTarget.type === 'member') {
        await loadMembers();
        showFeedback('membersFeedback', 'success', 'Member deleted successfully.');
      } else {
        await loadBlog();
        showFeedback('blogFeedback', 'success', 'Post deleted successfully.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      let feedbackId = 'blogFeedback';
      if (deleteTarget.type === 'event') feedbackId = 'eventsFeedback';
      else if (deleteTarget.type === 'member') feedbackId = 'membersFeedback';

      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      showFeedback(feedbackId, 'error', err.message || 'Failed to delete. Please try again.');
    } finally {
      setButtonLoading(btn, false);
    }
  }

  // ══════════════════════════════════════════
  //  MEMBERS MANAGEMENT
  // ══════════════════════════════════════════
  let allCommittees = [];

  async function loadCommitteesForDropdown() {
    try {
      const res = await fetch(ENDPOINTS.committees);
      if (!res.ok) throw new Error('Failed to load committees');
      allCommittees = await res.json();
      const select = document.getElementById('memberCommittee');
      if (select) {
        select.innerHTML = allCommittees.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMembers() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    try {
      const res = await fetch(ENDPOINTS.members, { headers: authHeaders() });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to fetch members.');
      const members = await res.json();

      if (members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No members found.</td></tr>`;
        return;
      }

      tbody.innerHTML = members.map(m => {
        const isSelf = getMember() && getMember().id === m.id;
        const statusBadge = m.isActive 
          ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Active</span>` 
          : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Inactive</span>`;
        
        const toggleStatusBtn = isSelf 
          ? '' 
          : `<button onclick="toggleMemberStatus(${m.id}, ${m.isActive})" class="btn btn-sm btn-link p-0 text-decoration-none me-2" title="Toggle Active Status">
               <i class="bi ${m.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'}" style="font-size: 1.25rem;"></i>
             </button>`;

        const deleteBtn = isSelf 
          ? '' 
          : `<button onclick="confirmDeleteMember(${m.id}, '${escapeAttr(m.fullName)}')" class="btn btn-action btn-action-delete" title="Delete Member">
               <i class="bi bi-trash"></i>
             </button>`;

        const avatarMarkup = m.profilePictureUrl
          ? `<img src="${m.profilePictureUrl}" class="table-img rounded-circle" style="width: 36px; height: 36px; object-fit: cover; flex-shrink: 0;" alt="" />`
          : `<div class="table-img-placeholder rounded-circle" style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: rgba(0, 102, 204, 0.15); color: #0066cc; font-weight: 600; font-size: 0.85rem; flex-shrink: 0; border: 1px solid rgba(0, 102, 204, 0.25);">${(m.fullName || 'M').charAt(0).toUpperCase()}</div>`;

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${avatarMarkup}
                <span class="fw-semibold">${escapeHTML(m.fullName)}</span>
              </div>
            </td>
            <td>
              <div style="font-size: 0.85rem;">${escapeHTML(m.email)}</div>
              <div style="font-size: 0.75rem; color: var(--ieee-secondary);">${escapeHTML(m.phone)}</div>
            </td>
            <td><code>${escapeHTML(m.nuid)}</code></td>
            <td>
              <div style="font-size: 0.85rem;">${escapeHTML(m.faculty)}</div>
              <div style="font-size: 0.75rem; color: var(--ieee-secondary);">${escapeHTML(m.major)} (${escapeHTML(m.academicYear)})</div>
            </td>
            <td><span class="badge bg-light text-dark border">${escapeHTML(m.committeeName || 'None')}</span></td>
            <td><span class="badge bg-info-subtle text-primary border border-info-subtle">${escapeHTML(m.role)}</span></td>
            <td>${statusBadge}</td>
            <td>
              <div class="d-flex align-items-center gap-1">
                ${toggleStatusBtn}
                <button onclick="openEditMemberModal(${escapeAttr(JSON.stringify(m))})" class="btn btn-action btn-action-edit" title="Edit Member">
                  <i class="bi bi-pencil"></i>
                </button>
                ${deleteBtn}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error loading members.</td></tr>`;
    }
  }

  window.toggleMemberStatus = async function (id, currentStatus) {
    try {
      const res = await fetch(`${ENDPOINTS.members}/${id}/Status`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update member status.');
      }
      await loadMembers();
      showFeedback('membersFeedback', 'success', 'Member status updated successfully.');
    } catch (err) {
      console.error(err);
      showFeedback('membersFeedback', 'error', err.message || 'Failed to toggle status.');
    }
  };

  window.openEditMemberModal = function (member) {
    hideFeedback('memberFormFeedback');
    document.getElementById('memberId').value = member.id;
    document.getElementById('memberFullName').value = member.fullName || '';
    document.getElementById('memberEmail').value = member.email || '';
    document.getElementById('memberPhone').value = member.phone || '';
    document.getElementById('memberNuid').value = member.nuid || '';
    document.getElementById('memberAcademicYear').value = member.academicYear || 'Freshman';
    document.getElementById('memberFaculty').value = member.faculty || '';
    document.getElementById('memberMajor').value = member.major || '';
    document.getElementById('memberCommittee').value = member.committeeId || '';
    document.getElementById('memberRole').value = member.role || 'Member';
    document.getElementById('memberPassword').value = '';

    new bootstrap.Modal(document.getElementById('memberModal')).show();
  };

  window.confirmDeleteMember = function (id, name) {
    deleteTarget = { type: 'member', id };
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete member "${name}"? This action cannot be undone.`;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  };

  function initMemberModal() {
    const saveBtn = document.getElementById('memberSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const form = document.getElementById('memberForm');
        if (!form) return;
        hideFeedback('memberFormFeedback');

        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const id = document.getElementById('memberId').value;
        const payload = {
          fullName: document.getElementById('memberFullName').value,
          email: document.getElementById('memberEmail').value,
          phone: document.getElementById('memberPhone').value,
          nuid: document.getElementById('memberNuid').value,
          academicYear: document.getElementById('memberAcademicYear').value,
          faculty: document.getElementById('memberFaculty').value,
          major: document.getElementById('memberMajor').value,
          committeeId: parseInt(document.getElementById('memberCommittee').value),
          role: document.getElementById('memberRole').value
        };

        const pwdVal = document.getElementById('memberPassword').value;
        if (pwdVal) {
          payload.password = pwdVal;
        }

        setButtonLoading(saveBtn, true);
        try {
          const res = await fetch(`${ENDPOINTS.members}/${id}`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify(payload)
          });

          if (res.status === 401) { logout(); return; }
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to update member.');
          }

          bootstrap.Modal.getInstance(document.getElementById('memberModal')).hide();
          await loadMembers();
          showFeedback('membersFeedback', 'success', 'Member details updated successfully.');
        } catch (err) {
          console.error(err);
          showFeedback('memberFormFeedback', 'error', err.message || 'Error updating member details.');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      });
    }
  }

  // ── Applications Manager ──
  let allApplications = [];

  async function loadApplications() {
    const tbody = document.getElementById('applicationsTableBody');
    if (!tbody) return;
    try {
      const res = await fetch(ENDPOINTS.recruitment, { headers: authHeaders() });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to fetch applications.');
      allApplications = await res.json();

      if (allApplications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No applications found.</td></tr>`;
        return;
      }

      tbody.innerHTML = allApplications.map(a => {
        const dateStr = new Date(a.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let statusBadge = '';
        if (a.status.toLowerCase() === 'pending') {
          statusBadge = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle">Pending</span>`;
        } else if (a.status.toLowerCase() === 'approved') {
          statusBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle">Approved</span>`;
        } else {
          statusBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">${escapeHTML(a.status)}</span>`;
        }

        return `
          <tr>
            <td><span class="text-muted" style="font-size: 0.85rem;">${dateStr}</span></td>
            <td><span class="fw-semibold">${escapeHTML(a.fullName)}</span></td>
            <td>
              <div style="font-size: 0.85rem;">${escapeHTML(a.email)}</div>
              <div style="font-size: 0.75rem; color: var(--ieee-secondary);">${escapeHTML(a.phone)}</div>
            </td>
            <td><code>${escapeHTML(a.nuid)}</code></td>
            <td><span class="badge bg-light text-dark border">${escapeHTML(a.firstChoiceCommitteeName)}</span></td>
            <td><span class="badge bg-light text-dark border">${escapeHTML(a.secondChoiceCommitteeName)}</span></td>
            <td>${statusBadge}</td>
            <td>
              <button onclick="openApplicationDetailsModal(${a.id})" class="btn btn-ieee btn-ieee-primary py-1 px-2" style="font-size: 0.75rem;">
                <i class="bi bi-eye me-1"></i> View Details
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error loading applications.</td></tr>`;
    }
  }

  window.openApplicationDetailsModal = function (id) {
    hideFeedback('applicationFormFeedback');
    const app = allApplications.find(a => a.id === id);
    if (!app) return;

    document.getElementById('appDetailsId').value = app.id;
    document.getElementById('appDetailsName').textContent = app.fullName;
    document.getElementById('appDetailsEmail').textContent = app.email;
    document.getElementById('appDetailsPhone').textContent = app.phone;
    document.getElementById('appDetailsNuid').textContent = app.nuid;
    document.getElementById('appDetailsAcademicYear').textContent = app.academicYear;
    document.getElementById('appDetailsFacultyMajor').textContent = `${app.faculty} / ${app.major}`;
    document.getElementById('appDetailsCommittees').innerHTML = `
      <div style="font-size: 0.85rem;"><span class="fw-semibold text-primary">1st Choice:</span> ${escapeHTML(app.firstChoiceCommitteeName)}</div>
      <div style="font-size: 0.85rem;"><span class="fw-semibold text-secondary">2nd Choice:</span> ${escapeHTML(app.secondChoiceCommitteeName)}</div>
    `;

    document.getElementById('appDetailsBio').textContent = app.bio || 'No bio provided.';
    document.getElementById('appDetailsExperience').textContent = app.pastExperience || 'No past experience listed.';
    document.getElementById('appDetailsWhyJoin').textContent = app.whyJoin || 'Not answered.';
    document.getElementById('appDetailsWhatKnow').textContent = app.whatDoYouKnow || 'Not answered.';

    const statusBadgeEl = document.getElementById('appDetailsStatusBadge');
    let badgeClass = 'bg-warning-subtle text-warning border border-warning-subtle';
    if (app.status.toLowerCase() === 'approved') {
      badgeClass = 'bg-success-subtle text-success border border-success-subtle';
    } else if (app.status.toLowerCase() === 'rejected') {
      badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
    }
    statusBadgeEl.innerHTML = `<span class="badge ${badgeClass}">${escapeHTML(app.status)}</span>`;

    const acceptBtn = document.getElementById('appAcceptBtn');
    const rejectBtn = document.getElementById('appRejectBtn');
    if (app.status.toLowerCase() === 'pending') {
      acceptBtn.style.display = '';
      rejectBtn.style.display = '';
    } else {
      acceptBtn.style.display = 'none';
      rejectBtn.style.display = 'none';
    }

    new bootstrap.Modal(document.getElementById('applicationModal')).show();
  };

  function initApplicationModal() {
    const acceptBtn = document.getElementById('appAcceptBtn');
    const rejectBtn = document.getElementById('appRejectBtn');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', async () => {
        const id = document.getElementById('appDetailsId').value;
        setButtonLoading(acceptBtn, true);
        hideFeedback('applicationFormFeedback');
        try {
          const res = await fetch(`${ENDPOINTS.recruitment}/${id}/Accept`, {
            method: 'POST',
            headers: authHeaders()
          });
          if (res.status === 401) { logout(); return; }
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to accept application.');
          }

          bootstrap.Modal.getInstance(document.getElementById('applicationModal')).hide();
          await loadApplications();
          if (typeof loadMembers === 'function') await loadMembers();
          showFeedback('applicationsFeedback', 'success', 'Application approved successfully! Member account is registered.');
        } catch (err) {
          console.error(err);
          showFeedback('applicationFormFeedback', 'error', err.message || 'Error accepting application.');
        } finally {
          setButtonLoading(acceptBtn, false);
        }
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', async () => {
        const id = document.getElementById('appDetailsId').value;
        setButtonLoading(rejectBtn, true);
        hideFeedback('applicationFormFeedback');
        try {
          const res = await fetch(`${ENDPOINTS.recruitment}/${id}/Reject`, {
            method: 'POST',
            headers: authHeaders()
          });
          if (res.status === 401) { logout(); return; }
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to reject application.');
          }

          bootstrap.Modal.getInstance(document.getElementById('applicationModal')).hide();
          await loadApplications();
          showFeedback('applicationsFeedback', 'success', 'Application rejected successfully.');
        } catch (err) {
          console.error(err);
          showFeedback('applicationFormFeedback', 'error', err.message || 'Error rejecting application.');
        } finally {
          setButtonLoading(rejectBtn, false);
        }
      });
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

  // ══════════════════════════════════════════
  //  ATTENDANCE DESK
  // ══════════════════════════════════════════

  async function loadEventsForAttendanceDropdown() {
    const select = document.getElementById('attendanceEventSelect');
    if (!select) return;
    try {
      const res = await fetch(ENDPOINTS.events, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load events.');
      const events = await res.json();
      
      select.innerHTML = '<option value="">-- Choose Event --</option>';
      events.forEach(e => {
        const date = new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.title} (${date})`;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      showFeedback('attendanceFeedback', 'error', 'Error loading events dropdown list.');
    }
  }

  function initAttendanceDesk() {
    const select = document.getElementById('attendanceEventSelect');
    const saveBtn = document.getElementById('saveAttendanceBtn');
    
    if (select) {
      select.addEventListener('change', () => {
        const val = select.value;
        if (!val) {
          document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Please select an event from the dropdown above.</td></tr>';
          document.getElementById('attendanceSaveContainer').style.setProperty('display', 'none', 'important');
          return;
        }
        loadAttendanceForEvent(val);
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const eventId = select.value;
        if (!eventId) return;
        setButtonLoading(saveBtn, true);
        hideFeedback('attendanceFeedback');
        try {
          const rows = document.querySelectorAll('#attendanceTableBody tr');
          const records = [];
          rows.forEach(row => {
            const chk = row.querySelector('.attendance-check');
            if (chk) {
              records.push({
                memberId: parseInt(chk.dataset.memberId),
                attended: chk.checked
              });
            }
          });
          
          const res = await fetch(`${ENDPOINTS.attendance}/Event/${eventId}`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ records })
          });
          
          if (res.status === 401) { logout(); return; }
          if (!res.ok) {
             const errData = await res.json().catch(() => ({}));
             throw new Error(errData.message || 'Failed to save attendance.');
          }
          
          showFeedback('attendanceFeedback', 'success', 'Attendance saved successfully!');
        } catch (err) {
          console.error(err);
          showFeedback('attendanceFeedback', 'error', err.message || 'Error saving attendance.');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      });
    }
  }

  async function loadAttendanceForEvent(eventId) {
    const tbody = document.getElementById('attendanceTableBody');
    const saveContainer = document.getElementById('attendanceSaveContainer');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Loading attendance records...</td></tr>';
    saveContainer.style.setProperty('display', 'none', 'important');
    
    try {
      const res = await fetch(`${ENDPOINTS.attendance}/Event/${eventId}`, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load attendance.');
      const records = await res.json();
      
      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No active members found to log attendance.</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      records.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="fw-semibold">${escapeHTML(r.fullName)}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem;">${escapeHTML(r.email)}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${escapeHTML(r.phone)}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem;"><code class="text-dark">${escapeHTML(r.nuid)}</code></div>
            <div class="text-muted" style="font-size: 0.75rem;">${escapeHTML(r.committeeName)}</div>
          </td>
          <td style="text-align: center;">
            <input type="checkbox" class="form-check-input attendance-check" data-member-id="${r.memberId}" ${r.attended ? 'checked' : ''} style="transform: scale(1.2);" />
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      saveContainer.style.removeProperty('display');
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">${escapeHTML(err.message || 'Error loading attendance.')}</td></tr>`;
    }
  }

  // ══════════════════════════════════════════
  //  TASK BOARD MANAGER
  // ══════════════════════════════════════════

  let allTasks = [];

  async function loadTasks() {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    try {
      const res = await fetch(ENDPOINTS.tasks, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load tasks.');
      allTasks = await res.json();
      
      if (allTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tasks found.</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      allTasks.forEach(t => {
        const tr = document.createElement('tr');
        const date = new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let badgeClass = 'bg-secondary';
        let statusText = t.status;
        if (t.status === 'ToDo') { badgeClass = 'bg-danger'; statusText = 'To Do'; }
        else if (t.status === 'InProgress') { badgeClass = 'bg-warning text-dark'; statusText = 'In Progress'; }
        else if (t.status === 'Completed') { badgeClass = 'bg-success'; statusText = 'Completed'; }
        
        tr.innerHTML = `
          <td>
            <div class="fw-semibold">${escapeHTML(t.title)}</div>
            <div class="text-muted text-truncate" style="max-width: 250px; font-size: 0.75rem;">${escapeHTML(t.description)}</div>
          </td>
          <td>
            <div class="fw-medium" style="font-size: 0.85rem;">${escapeHTML(t.assignedMemberName)}</div>
          </td>
          <td>
            <span class="badge bg-light text-dark border">${escapeHTML(t.assignedMemberCommittee)}</span>
          </td>
          <td>
            <div style="font-size: 0.85rem;">${date}</div>
          </td>
          <td>
            <span class="badge ${badgeClass}">${statusText}</span>
          </td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-ieee btn-ieee-outline edit-task-btn" data-id="${t.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-ieee edit-task-btn" data-id="${t.id}" data-action="delete" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #dc3545; color: #fff;"><i class="bi bi-trash"></i></button>
            </div>
          </td>
        `;
        
        tr.querySelector('.btn-ieee-outline').addEventListener('click', () => editTask(t.id));
        tr.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDeleteTask(t.id));
        
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error: ${escapeHTML(err.message)}</td></tr>`;
    }
  }

  function initTaskDesk() {
    const addBtn = document.getElementById('addTaskBtn');
    const saveBtn = document.getElementById('taskSaveBtn');
    
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        document.getElementById('taskModalTitle').textContent = 'Create Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        hideFeedback('taskFormFeedback');
        loadMembersForTaskDropdown();
        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const form = document.getElementById('taskForm');
        if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
        
        setButtonLoading(saveBtn, true);
        hideFeedback('taskFormFeedback');
        
        const taskId = document.getElementById('taskId').value;
        const isEdit = !!taskId;
        
        const payload = {
          title: document.getElementById('taskTitle').value,
          description: document.getElementById('taskDescription').value,
          assignedMemberId: parseInt(document.getElementById('taskAssignedMemberId').value),
          dueDate: new Date(document.getElementById('taskDueDate').value).toISOString(),
          status: document.getElementById('taskStatus').value
        };
        
        try {
          const url = isEdit ? `${ENDPOINTS.tasks}/${taskId}` : ENDPOINTS.tasks;
          const method = isEdit ? 'PUT' : 'POST';
          
          const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload)
          });
          
          if (res.status === 401) { logout(); return; }
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to save task.');
          }
          
          bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
          await loadTasks();
          showFeedback('tasksFeedback', 'success', `Task ${isEdit ? 'updated' : 'created'} successfully!`);
        } catch (err) {
          console.error(err);
          showFeedback('taskFormFeedback', 'error', err.message || 'Error saving task.');
        } finally {
          setButtonLoading(saveBtn, false);
        }
      });
    }
  }

  async function loadMembersForTaskDropdown(selectedId) {
    const select = document.getElementById('taskAssignedMemberId');
    if (!select) return;
    select.innerHTML = '<option value="">Loading members...</option>';
    try {
      const res = await fetch(`${ENDPOINTS.tasks}/Members`, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load members.');
      const members = await res.json();
      
      select.innerHTML = '<option value="">-- Choose Member --</option>';
      members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.fullName} (${m.committeeName})`;
        if (selectedId && m.id === selectedId) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      select.innerHTML = '<option value="">Error loading members</option>';
    }
  }

  async function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDueDate').value = task.dueDate.split('T')[0];
    document.getElementById('taskStatus').value = task.status;
    hideFeedback('taskFormFeedback');
    
    await loadMembersForTaskDropdown(task.assignedMemberId);
    
    const modal = new bootstrap.Modal(document.getElementById('taskModal'));
    modal.show();
  }

  function confirmDeleteTask(taskId) {
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    if (!confirmBtn) return;
    
    document.getElementById('deleteMessage').textContent = 'Are you sure you want to delete this task? This action cannot be undone.';
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
    
    newConfirmBtn.addEventListener('click', async () => {
      setButtonLoading(newConfirmBtn, true);
      try {
        const res = await fetch(`${ENDPOINTS.tasks}/${taskId}`, {
          method: 'DELETE',
          headers: authHeaders()
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to delete task.');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        await loadTasks();
        showFeedback('tasksFeedback', 'success', 'Task deleted successfully.');
      } catch (err) {
        console.error(err);
        alert(err.message || 'Error deleting task.');
      } finally {
        setButtonLoading(newConfirmBtn, false);
      }
    });
  }
})();
