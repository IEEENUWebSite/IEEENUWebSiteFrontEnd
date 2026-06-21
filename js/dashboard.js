/**
 * IEEE Nile University — Member Dashboard Logic
 * Modules: Auth guard, Sidebar nav, Kanban board, Attendance, Profile + Editor
 */
(function () {
  'use strict';

  const API_BASE = 'https://localhost:7105/api';
  const ENDPOINTS = {
    myTasks: `${API_BASE}/Tasks/MyTasks`,
    taskStatus: (id) => `${API_BASE}/Tasks/${id}/Status`,
    myAttendance: `${API_BASE}/Attendance/MyAttendance`,
    upload: `${API_BASE}/Upload`,
    updateProfile: `${API_BASE}/Members/Me`,
  };

  const STATUSES = ['ToDo', 'InProgress', 'Completed'];
  const ADMIN_ROLES = ['admin', 'board', 'media'];
  let allTasks = [];

  // ── Auth Guard ──
  function getToken() { return localStorage.getItem('ieee_token'); }
  function getMember() {
    try { return JSON.parse(localStorage.getItem('ieee_member')); }
    catch { return null; }
  }
  function saveMember(member) {
    localStorage.setItem('ieee_member', JSON.stringify(member));
  }

  function authHeaders(json) {
    const h = { 'Authorization': `Bearer ${getToken()}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  function logout() {
    localStorage.removeItem('ieee_token');
    localStorage.removeItem('ieee_member');
    window.location.href = '../login.html';
  }

  // ── Init ──
  window.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) { window.location.href = '../login.html'; return; }

    initTopbar();
    initSidebar();
    initLogout();
    initAdminLink();
    loadTasks();
    loadAttendance();
    loadProfile();
    initProfileEditor();
  });

  // ── Topbar ──
  function initTopbar() {
    const member = getMember();
    if (!member) return;
    const nameEl = document.getElementById('topbarUserName');
    const avatarEl = document.getElementById('topbarAvatar');
    if (nameEl) nameEl.textContent = member.fullName || '';
    if (avatarEl) {
      if (member.profilePictureUrl) {
        avatarEl.innerHTML = `<img src="${member.profilePictureUrl}" alt="" class="topbar-avatar-img" />`;
      } else {
        avatarEl.textContent = (member.fullName || 'M').charAt(0).toUpperCase();
      }
    }
  }

  // ── Admin link visibility ──
  function initAdminLink() {
    const member = getMember();
    if (!member) return;
    const role = (member.role || '').toLowerCase();
    if (ADMIN_ROLES.includes(role)) {
      const link = document.getElementById('adminNavLink');
      if (link) link.style.display = '';
    }
  }

  // ── Sidebar Navigation ──
  function initSidebar() {
    const navItems = document.querySelectorAll('.dash-nav-item[data-section]');
    const titleEl = document.getElementById('topbarTitle');
    const sectionTitles = { tasks: 'Task Board', attendance: 'Attendance', profile: 'Profile' };

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`section-${section}`);
        if (target) target.classList.add('active');
        if (titleEl) titleEl.textContent = sectionTitles[section] || '';
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
    const sidebar = document.getElementById('dashSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }

  function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  // ══════════════════════════════════════════
  //  KANBAN BOARD
  // ══════════════════════════════════════════

  async function loadTasks() {
    try {
      const res = await fetch(ENDPOINTS.myTasks, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allTasks = await res.json();
      renderKanban();
    } catch (err) {
      console.error('Tasks fetch error:', err);
      showFeedback('tasksFeedback', 'error', 'Unable to load tasks. Please try refreshing the page.');
    }
  }

  function renderKanban() {
    const counts = { ToDo: 0, InProgress: 0, Completed: 0 };
    STATUSES.forEach(s => { const col = document.getElementById(`col-${s}`); if (col) col.innerHTML = ''; });

    allTasks.forEach(task => {
      const status = normalizeStatus(task.status);
      counts[status] = (counts[status] || 0) + 1;
      const col = document.getElementById(`col-${status}`);
      if (!col) return;
      col.appendChild(createKanbanCard(task, status));
    });

    document.getElementById('stat-todo').textContent = counts.ToDo;
    document.getElementById('stat-progress').textContent = counts.InProgress;
    document.getElementById('stat-done').textContent = counts.Completed;
    document.getElementById('count-todo').textContent = counts.ToDo;
    document.getElementById('count-progress').textContent = counts.InProgress;
    document.getElementById('count-done').textContent = counts.Completed;

    STATUSES.forEach(s => {
      const col = document.getElementById(`col-${s}`);
      if (col && col.children.length === 0) {
        col.innerHTML = '<div class="text-center py-4" style="color: var(--ieee-secondary); font-size: 0.82rem;">No tasks</div>';
      }
    });
    initDragAndDrop();
  }

  function normalizeStatus(status) {
    const s = (status || '').toLowerCase().replace(/\s+/g, '');
    if (s === 'todo' || s === 'to do') return 'ToDo';
    if (s === 'inprogress' || s === 'in progress') return 'InProgress';
    if (s === 'completed' || s === 'done') return 'Completed';
    return 'ToDo';
  }

  function createKanbanCard(task, status) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && status !== 'Completed';
    const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const desc = truncate(task.description || '', 80);

    let moveButtons = '';
    if (status === 'ToDo') {
      moveButtons = `<button class="status-move-btn" title="Move to In Progress" onclick="moveTask(${task.id}, 'InProgress')"><i class="bi bi-arrow-right"></i></button>`;
    } else if (status === 'InProgress') {
      moveButtons = `<button class="status-move-btn" title="Move to To Do" onclick="moveTask(${task.id}, 'ToDo')"><i class="bi bi-arrow-left"></i></button><button class="status-move-btn" title="Move to Completed" onclick="moveTask(${task.id}, 'Completed')"><i class="bi bi-check-lg"></i></button>`;
    } else {
      moveButtons = `<button class="status-move-btn" title="Move to In Progress" onclick="moveTask(${task.id}, 'InProgress')"><i class="bi bi-arrow-left"></i></button>`;
    }

    card.innerHTML = `
      <div class="card-title">${escapeHTML(task.title)}</div>
      <div class="card-desc">${escapeHTML(desc)}</div>
      <div class="card-footer-meta">
        <span class="due-date ${isOverdue ? 'overdue' : ''}">${dueDateStr ? `<i class="bi bi-clock"></i> ${dueDateStr}` : ''}${isOverdue ? ' (Overdue)' : ''}</span>
        <span class="status-actions">${moveButtons}</span>
      </div>`;
    return card;
  }

  function initDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column-body');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.dataset.taskId); e.dataTransfer.effectAllowed = 'move'; });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); columns.forEach(col => col.classList.remove('drag-over')); });
    });
    columns.forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => { col.classList.remove('drag-over'); });
      col.addEventListener('drop', async (e) => {
        e.preventDefault(); col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.closest('.kanban-column').dataset.status;
        if (taskId && newStatus) await updateTaskStatus(parseInt(taskId, 10), newStatus);
      });
    });
  }

  window.moveTask = async function (taskId, newStatus) { await updateTaskStatus(taskId, newStatus); };

  async function updateTaskStatus(taskId, newStatus) {
    try {
      const res = await fetch(ENDPOINTS.taskStatus(taskId), { method: 'PUT', headers: authHeaders(true), body: JSON.stringify({ status: newStatus }) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const task = allTasks.find(t => t.id === taskId);
      if (task) task.status = newStatus;
      renderKanban();
    } catch (err) {
      console.error('Task status update error:', err);
      showFeedback('tasksFeedback', 'error', 'Failed to update task status. Please try again.');
    }
  }

  // ══════════════════════════════════════════
  //  ATTENDANCE
  // ══════════════════════════════════════════

  async function loadAttendance() {
    try {
      const res = await fetch(ENDPOINTS.myAttendance, { headers: authHeaders(true) });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderAttendance(data);
    } catch (err) {
      console.error('Attendance fetch error:', err);
      showFeedback('attendanceFeedback', 'error', 'Unable to load attendance data.');
    }
  }

  function renderAttendance(data) {
    const records = data.records || data || [];
    const isArray = Array.isArray(records);
    const total = data.totalEvents || (isArray ? records.length : 0);
    const attended = data.attendedEvents || (isArray ? records.filter(r => r.attended).length : 0);
    const missed = total - attended;
    const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

    const circumference = 2 * Math.PI * 76;
    const offset = circumference - (percent / 100) * circumference;
    const gaugeFill = document.getElementById('gaugeFill');
    const gaugePercent = document.getElementById('gaugePercent');
    if (gaugeFill) { gaugeFill.setAttribute('stroke-dasharray', circumference); setTimeout(() => { gaugeFill.setAttribute('stroke-dashoffset', offset); }, 200); }
    if (gaugePercent) gaugePercent.textContent = `${percent}%`;
    document.getElementById('att-attended').textContent = attended;
    document.getElementById('att-missed').textContent = missed;

    const logEl = document.getElementById('attendanceLog');
    if (!logEl) return;
    const list = isArray ? records : [];
    if (list.length === 0) { logEl.innerHTML = '<div class="text-center text-muted py-4">No attendance records found.</div>'; return; }

    logEl.innerHTML = list.map(r => {
      const eventTitle = r.event ? r.event.title : (r.eventTitle || 'Event');
      const eventDate = r.event ? r.event.eventDate : (r.eventDate || r.loggedTime);
      const dateStr = new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<div class="attendance-row"><div><div class="att-event">${escapeHTML(eventTitle)}</div><div class="att-date">${dateStr}</div></div><span class="att-badge ${r.attended ? 'attended' : 'missed'}">${r.attended ? 'Attended' : 'Missed'}</span></div>`;
    }).join('');
  }

  // ══════════════════════════════════════════
  //  PROFILE
  // ══════════════════════════════════════════

  function loadProfile() {
    const member = getMember();
    if (!member) return;

    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const roleEl = document.getElementById('profileRole');
    const bodyEl = document.getElementById('profileBody');

    // Avatar: image or initial
    if (avatarEl) {
      if (member.profilePictureUrl) {
        avatarEl.className = 'profile-avatar has-image';
        avatarEl.innerHTML = `<img src="${member.profilePictureUrl}" alt="${escapeHTML(member.fullName)}" />`;
      } else {
        avatarEl.className = 'profile-avatar';
        avatarEl.innerHTML = '';
        avatarEl.textContent = (member.fullName || 'M').charAt(0).toUpperCase();
      }
    }
    if (nameEl) nameEl.textContent = member.fullName || 'Member';
    if (roleEl) roleEl.textContent = member.role || 'Member';

    const fields = [
      { icon: 'bi-envelope', label: 'Email', value: member.email },
      { icon: 'bi-phone', label: 'Phone', value: member.phone },
      { icon: 'bi-person-vcard', label: 'NU ID', value: member.nuid },
      { icon: 'bi-mortarboard', label: 'Faculty', value: member.faculty },
      { icon: 'bi-book', label: 'Major', value: member.major },
      { icon: 'bi-calendar-event', label: 'Academic Year', value: member.academicYear },
      { icon: 'bi-people', label: 'Committee', value: member.committeeName || (member.committee && member.committee.name) },
      { icon: 'bi-clock-history', label: 'Joined', value: member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '' },
    ];

    if (bodyEl) {
      bodyEl.innerHTML = fields.filter(f => f.value).map(f => `
        <div class="profile-field">
          <i class="bi ${f.icon}"></i>
          <div>
            <div class="field-label">${f.label}</div>
            <div class="field-value">${escapeHTML(f.value)}</div>
          </div>
        </div>`).join('');
    }
  }

  // ══════════════════════════════════════════
  //  PROFILE EDITOR
  // ══════════════════════════════════════════

  let pendingAvatarFile = null;

  function initProfileEditor() {
    const toggleBtn = document.getElementById('profileEditToggle');
    const editor = document.getElementById('profileEditor');
    const cancelBtn = document.getElementById('profileCancelBtn');
    const form = document.getElementById('profileEditForm');
    const fileInput = document.getElementById('avatarFileInput');
    const uploadZone = document.getElementById('avatarUploadZone');

    if (!toggleBtn || !editor) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = editor.classList.contains('show');
      if (isOpen) {
        editor.classList.remove('show');
      } else {
        populateEditor();
        editor.classList.add('show');
      }
    });

    cancelBtn.addEventListener('click', () => { editor.classList.remove('show'); pendingAvatarFile = null; });

    // Avatar file picker
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      pendingAvatarFile = file;
      const preview = document.getElementById('avatarPreview');
      const reader = new FileReader();
      reader.onload = (e) => { preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`; };
      reader.readAsDataURL(file);
    });

    // Save
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('profileSaveBtn');
      const feedback = document.getElementById('profileEditFeedback');
      setButtonLoading(btn, true);
      hideFeedback(feedback);

      try {
        let avatarUrl = null;

        // Upload avatar first if selected
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append('file', pendingAvatarFile);
          const uploadRes = await fetch(ENDPOINTS.upload, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
          if (!uploadRes.ok) throw new Error('Image upload failed.');
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.url;
        }

        const payload = {
          phone: document.getElementById('editPhone').value.trim(),
          faculty: document.getElementById('editFaculty').value,
          major: document.getElementById('editMajor').value.trim(),
          academicYear: document.getElementById('editAcademicYear').value,
        };
        if (avatarUrl) payload.profilePictureUrl = avatarUrl;

        const res = await fetch(ENDPOINTS.updateProfile, { method: 'PUT', headers: authHeaders(true), body: JSON.stringify(payload) });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Update failed.'); }

        // Update localStorage
        const member = getMember();
        if (member) {
          if (payload.phone) member.phone = payload.phone;
          if (payload.faculty) member.faculty = payload.faculty;
          if (payload.major) member.major = payload.major;
          if (payload.academicYear) member.academicYear = payload.academicYear;
          if (avatarUrl) member.profilePictureUrl = avatarUrl;
          saveMember(member);
        }

        pendingAvatarFile = null;
        editor.classList.remove('show');
        loadProfile();
        initTopbar();
        showFeedback('profileEditFeedback', 'success', 'Profile updated successfully.');
      } catch (err) {
        console.error('Profile update error:', err);
        showFeedback('profileEditFeedback', 'error', err.message || 'Failed to update profile.');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  function populateEditor() {
    const member = getMember();
    if (!member) return;
    document.getElementById('editPhone').value = member.phone || '';
    document.getElementById('editFaculty').value = member.faculty || 'Computer Science';
    document.getElementById('editMajor').value = member.major || '';
    document.getElementById('editAcademicYear').value = member.academicYear || 'Freshman';

    const preview = document.getElementById('avatarPreview');
    if (member.profilePictureUrl) {
      preview.innerHTML = `<img src="${member.profilePictureUrl}" alt="Current" />`;
    } else {
      preview.innerHTML = '<i class="bi bi-camera"></i>';
    }
    pendingAvatarFile = null;
  }

  // ── Helpers ──
  function escapeHTML(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function truncate(str, len) { return str.length > len ? str.substring(0, len) + '...' : str; }
  function showFeedback(id, type, msg) { const el = document.getElementById(id); if (!el) return; el.className = `feedback-panel feedback-panel-light mt-3 text-center ${type} show`; el.textContent = msg; }
  function hideFeedback(el) { if (typeof el === 'string') el = document.getElementById(el); if (!el) return; el.className = 'feedback-panel feedback-panel-light mt-3 text-center'; el.textContent = ''; }
  function setButtonLoading(btn, loading) { if (!btn) return; btn.classList.toggle('btn-loading', loading); btn.disabled = loading; }
})();
