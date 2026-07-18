import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, getMember, clearSession } from '../services/api';

export default function Admin() {
  const navigate = useNavigate();
  const [member, setMember] = useState(getMember());

  const [activeSection, setActiveSection] = useState('events');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [events, setEvents] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [applications, setApplications] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [adminTasks, setAdminTasks] = useState([]);
  const [taskMembers, setTaskMembers] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [saveAttendanceLoading, setSaveAttendanceLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, title: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [eventModal, setEventModal] = useState({ show: false, id: null, title: '', description: '', eventDate: '', location: '', maxAttendees: 0, isPublic: true, file: null, preview: '' });
  const [eventSaveLoading, setEventSaveLoading] = useState(false);

  const [blogModal, setBlogModal] = useState({ show: false, id: null, title: '', content: '', isPublished: false, file: null, preview: '' });
  const [blogSaveLoading, setBlogSaveLoading] = useState(false);

  const [memberModal, setMemberModal] = useState({ show: false, id: null, fullName: '', email: '', phone: '', nuid: '', academicYear: 'Freshman', faculty: '', major: '', committeeId: '', role: 'Member', password: '' });
  const [memberSaveLoading, setMemberSaveLoading] = useState(false);

  const [appModal, setAppModal] = useState({ show: false, app: null });
  const [appActionLoading, setAppActionLoading] = useState(false);

  const [taskModal, setTaskModal] = useState({ show: false, id: null, title: '', description: '', assignedMemberId: '', dueDate: '', status: 'ToDo' });
  const [taskSaveLoading, setTaskSaveLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [feedback, setFeedback] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    const t = getToken();
    const m = getMember();
    if (!t || !m) {
      navigate('/login');
      return;
    }
    const role = (m.role || '').toLowerCase();
    if (!['admin', 'board', 'media', 'moderator'].includes(role)) {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    setDataLoading(true);
    if (activeSection === 'events') {
      loadEvents();
    } else if (activeSection === 'blog') {
      loadBlogPosts();
    } else if (activeSection === 'members') {
      loadMembers();
      loadCommittees();
    } else if (activeSection === 'applications') {
      loadApplications();
    } else if (activeSection === 'attendance') {
      loadEvents();
    } else if (activeSection === 'tasks') {
      loadAdminTasks();
      loadTaskMembers();
    }
  }, [activeSection]);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    try {
      const data = await api.getBlogPosts();
      setBlogPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadCommittees = async () => {
    try {
      const data = await api.getCommittees();
      setCommittees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadAdminTasks = async () => {
    try {
      const data = await api.getAdminTasks();
      setAdminTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadTaskMembers = async () => {
    try {
      const data = await api.getAdminTaskMembers();
      setTaskMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendanceForEvent = async (eventId) => {
    setSelectedEventId(eventId);
    if (!eventId) {
      setAttendanceRecords([]);
      return;
    }
    try {
      const data = await api.getAttendanceForEvent(eventId);
      setAttendanceRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedEventId) return;
    setSaveAttendanceLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    try {
      const records = attendanceRecords.map(r => ({
        memberId: r.memberId,
        attended: !!r.attended
      }));
      await api.saveAttendanceForEvent(selectedEventId, records);
      setFeedback({ show: true, type: 'success', message: 'Attendance records saved successfully!' });
    } catch (err) {
      console.error(err);
      setFeedback({ show: true, type: 'error', message: err.message || 'Failed to save attendance.' });
    } finally {
      setSaveAttendanceLoading(false);
    }
  };

  const handleAttendanceCheckboxChange = (memberId, checked) => {
    setAttendanceRecords(prev => prev.map(r => r.memberId === memberId ? { ...r, attended: checked } : r));
  };

  const handleDeleteClick = (type, id, title) => {
    setDeleteModal({ show: true, type, id, title });
  };

  const handleExecuteDelete = async () => {
    setDeleteLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    const type = deleteModal.type;
    const id = deleteModal.id;
    const originalEvents = [...events];
    const originalBlogPosts = [...blogPosts];
    const originalMembers = [...members];
    const originalAdminTasks = [...adminTasks];

    if (type === 'event') setEvents(prev => prev.filter(e => e.id !== id));
    else if (type === 'blog') setBlogPosts(prev => prev.filter(p => p.id !== id));
    else if (type === 'member') setMembers(prev => prev.filter(m => m.id !== id));
    else if (type === 'task') setAdminTasks(prev => prev.filter(t => t.id !== id));

    setDeleteModal({ show: false, type: '', id: null, title: '' });

    try {
      if (type === 'event') {
        await api.deleteEvent(id);
      } else if (type === 'blog') {
        await api.deleteBlogPost(id);
      } else if (type === 'member') {
        await api.deleteMember(id);
      } else if (type === 'task') {
        await api.deleteAdminTask(id);
      }
      showToast('Item deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      if (type === 'event') setEvents(originalEvents);
      else if (type === 'blog') setBlogPosts(originalBlogPosts);
      else if (type === 'member') setMembers(originalMembers);
      else if (type === 'task') setAdminTasks(originalAdminTasks);
      showToast(err.message || 'Deletion failed. Reverting change.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTogglePublish = async (post) => {
    setFeedback({ show: false, type: '', message: '' });
    const originalBlogPosts = [...blogPosts];
    setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPublished: !post.isPublished } : p));
    try {
      const payload = {
        title: post.title,
        content: post.content,
        isPublished: !post.isPublished,
        imageUrl: post.imageUrl || null
      };
      await api.updateBlogPost(post.id, payload);
      showToast(`Post ${post.isPublished ? 'unpublished' : 'published'} successfully.`, 'success');
    } catch (err) {
      console.error(err);
      setBlogPosts(originalBlogPosts);
      showToast('Failed to update publication status. Reverting change.', 'error');
    }
  };

  const handleToggleMemberStatus = async (id, currentStatus) => {
    setFeedback({ show: false, type: '', message: '' });
    const originalMembers = [...members];
    setMembers(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));
    try {
      await api.toggleMemberStatus(id, !currentStatus);
      showToast('Member status updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      setMembers(originalMembers);
      showToast(err.message || 'Failed to update member status. Reverting change.', 'error');
    }
  };

  const handleEventModalOpen = (event = null) => {
    if (event) {
      setEventModal({
        show: true,
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate.split('.')[0].slice(0, 16),
        location: event.location,
        maxAttendees: event.maxAttendees,
        isPublic: event.isPublic,
        file: null,
        preview: event.imageUrl || ''
      });
    } else {
      setEventModal({
        show: true,
        id: null,
        title: '',
        description: '',
        eventDate: '',
        location: '',
        maxAttendees: 0,
        isPublic: true,
        file: null,
        preview: ''
      });
    }
  };

  const handleEventSave = async (e) => {
    e.preventDefault();
    setEventSaveLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    try {
      let imageUrl = eventModal.preview;
      if (eventModal.file) {
        const uploadRes = await api.uploadImage(eventModal.file);
        imageUrl = uploadRes.url;
      }

      const payload = {
        title: eventModal.title,
        description: eventModal.description,
        eventDate: new Date(eventModal.eventDate).toISOString(),
        location: eventModal.location,
        maxAttendees: parseInt(eventModal.maxAttendees, 10),
        isPublic: eventModal.isPublic,
        imageUrl: imageUrl || null
      };

      if (eventModal.id) {
        await api.updateEvent(eventModal.id, payload);
      } else {
        await api.createEvent(payload);
      }

      setEventModal(prev => ({ ...prev, show: false }));
      await loadEvents();
      setFeedback({ show: true, type: 'success', message: 'Event details saved successfully!' });
    } catch (err) {
      console.error(err);
      setFeedback({ show: true, type: 'error', message: err.message || 'Failed to save event.' });
    } finally {
      setEventSaveLoading(false);
    }
  };

  const handleBlogModalOpen = (post = null) => {
    if (post) {
      setBlogModal({
        show: true,
        id: post.id,
        title: post.title,
        content: post.content,
        isPublished: post.isPublished,
        file: null,
        preview: post.imageUrl || ''
      });
    } else {
      setBlogModal({
        show: true,
        id: null,
        title: '',
        content: '',
        isPublished: false,
        file: null,
        preview: ''
      });
    }
  };

  const handleBlogSave = async (e) => {
    e.preventDefault();
    setBlogSaveLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    try {
      let imageUrl = blogModal.preview;
      if (blogModal.file) {
        const uploadRes = await api.uploadImage(blogModal.file);
        imageUrl = uploadRes.url;
      }

      const payload = {
        title: blogModal.title,
        content: blogModal.content,
        isPublished: blogModal.isPublished,
        imageUrl: imageUrl || null
      };

      if (blogModal.id) {
        await api.updateBlogPost(blogModal.id, payload);
      } else {
        await api.createBlogPost(payload);
      }

      setBlogModal(prev => ({ ...prev, show: false }));
      await loadBlogPosts();
      setFeedback({ show: true, type: 'success', message: 'Blog post details saved successfully!' });
    } catch (err) {
      console.error(err);
      setFeedback({ show: true, type: 'error', message: err.message || 'Failed to save blog post.' });
    } finally {
      setBlogSaveLoading(false);
    }
  };

  const handleMemberModalOpen = (m) => {
    setMemberModal({
      show: true,
      id: m.id,
      fullName: m.fullName || '',
      email: m.email || '',
      phone: m.phone || '',
      nuid: m.nuid || '',
      academicYear: m.academicYear || 'Freshman',
      faculty: m.faculty || '',
      major: m.major || '',
      committeeId: m.committeeId || '',
      role: m.role || 'Member',
      password: ''
    });
  };

  const handleMemberSave = async (e) => {
    e.preventDefault();
    setMemberSaveLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    try {
      const payload = {
        fullName: memberModal.fullName,
        email: memberModal.email,
        phone: memberModal.phone,
        nuid: memberModal.nuid,
        academicYear: memberModal.academicYear,
        faculty: memberModal.faculty,
        major: memberModal.major,
        committeeId: memberModal.committeeId ? parseInt(memberModal.committeeId, 10) : null,
        role: memberModal.role
      };

      if (memberModal.password) {
        payload.password = memberModal.password;
      }

      await api.updateMember(memberModal.id, payload);
      setMemberModal(prev => ({ ...prev, show: false }));
      await loadMembers();
      setFeedback({ show: true, type: 'success', message: 'Member account updated successfully!' });
    } catch (err) {
      console.error(err);
      setFeedback({ show: true, type: 'error', message: err.message || 'Failed to update member account.' });
    } finally {
      setMemberSaveLoading(false);
    }
  };

  const handleAppDecision = async (id, accept) => {
    setAppActionLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    const originalApplications = [...applications];
    const targetStatus = accept ? 'Approved' : 'Rejected';
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: targetStatus } : a));
    setAppModal({ show: false, app: null });
    try {
      if (accept) {
        await api.acceptApplication(id);
        showToast('Application approved! Registered as a branch member.', 'success');
      } else {
        await api.rejectApplication(id);
        showToast('Application rejected.', 'success');
      }
    } catch (err) {
      console.error(err);
      setApplications(originalApplications);
      showToast(err.message || 'Application update failed. Reverting change.', 'error');
    } finally {
      setAppActionLoading(false);
    }
  };

  const handleTaskModalOpen = (task = null) => {
    if (task) {
      setTaskModal({
        show: true,
        id: task.id,
        title: task.title,
        description: task.description,
        assignedMemberId: task.assignedMemberId || '',
        dueDate: task.dueDate.split('T')[0],
        status: task.status
      });
    } else {
      setTaskModal({
        show: true,
        id: null,
        title: '',
        description: '',
        assignedMemberId: '',
        dueDate: '',
        status: 'ToDo'
      });
    }
  };

  const handleTaskSave = async (e) => {
    e.preventDefault();
    setTaskSaveLoading(true);
    setFeedback({ show: false, type: '', message: '' });
    try {
      const payload = {
        title: taskModal.title,
        description: taskModal.description,
        assignedMemberId: parseInt(taskModal.assignedMemberId, 10),
        dueDate: new Date(taskModal.dueDate).toISOString(),
        status: taskModal.status
      };

      if (taskModal.id) {
        await api.updateAdminTask(taskModal.id, payload);
      } else {
        await api.createAdminTask(payload);
      }

      setTaskModal(prev => ({ ...prev, show: false }));
      await loadAdminTasks();
      setFeedback({ show: true, type: 'success', message: 'Task configuration saved successfully!' });
    } catch (err) {
      console.error(err);
      setFeedback({ show: true, type: 'error', message: err.message || 'Failed to save task.' });
    } finally {
      setTaskSaveLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (!member) return null;
  const role = (member.role || '').toLowerCase();

  const showMembersTab = role === 'admin';
  const showApplicationsTab = role === 'admin';
  const showAttendanceTab = ['admin', 'board', 'moderator'].includes(role);
  const showTasksTab = ['admin', 'board', 'moderator'].includes(role);

  return (
    <div className="dashboard-wrapper">
      <div className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`} id="dashSidebar">
        <div className="sidebar-brand">
          <a href="/">IEEE Nile University</a>
        </div>
        <div className="sidebar-nav">
          <button
            className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'events' ? 'active' : ''}`}
            onClick={() => { setActiveSection('events'); setIsSidebarOpen(false); }}
          >
            <i className="bi bi-calendar-event"></i> Events Manager
          </button>
          <button
            className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'blog' ? 'active' : ''}`}
            onClick={() => { setActiveSection('blog'); setIsSidebarOpen(false); }}
          >
            <i className="bi bi-journal-text"></i> Blog Manager
          </button>
          {showMembersTab && (
            <button
              className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'members' ? 'active' : ''}`}
              onClick={() => { setActiveSection('members'); setIsSidebarOpen(false); }}
            >
              <i className="bi bi-people"></i> Members Manager
            </button>
          )}
          {showApplicationsTab && (
            <button
              className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'applications' ? 'active' : ''}`}
              onClick={() => { setActiveSection('applications'); setIsSidebarOpen(false); }}
            >
              <i className="bi bi-file-earmark-person"></i> Applications Manager
            </button>
          )}
          {showAttendanceTab && (
            <button
              className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'attendance' ? 'active' : ''}`}
              onClick={() => { setActiveSection('attendance'); setIsSidebarOpen(false); }}
            >
              <i className="bi bi-calendar-check"></i> Attendance Desk
            </button>
          )}
          {showTasksTab && (
            <button
              className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'tasks' ? 'active' : ''}`}
              onClick={() => { setActiveSection('tasks'); setIsSidebarOpen(false); }}
            >
              <i className="bi bi-list-task"></i> Task Manager
            </button>
          )}
          <button
            className="dash-nav-item btn btn-link w-100 text-start border-0"
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-person-gear"></i> Member Dashboard
          </button>
        </div>
        <div className="sidebar-footer">
          <button className="btn btn-ieee btn-ieee-outline w-100 py-2" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {isSidebarOpen && <div className="sidebar-overlay show" onClick={() => setIsSidebarOpen(false)}></div>}

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="d-flex align-items-center gap-2">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <i className="bi bi-list"></i>
            </button>
            <span className="topbar-title">Admin Console</span>
          </div>
          <div className="topbar-user">
            <span>{member.fullName} ({member.role})</span>
          </div>
        </div>

        <div className="dash-content">
          {feedback.show && (
            <div className={`feedback-panel mb-4 text-center ${feedback.type} show`}>
              {feedback.message}
            </div>
          )}

          {activeSection === 'events' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>Events & Workshops</h3>
                <button className="btn btn-ieee btn-ieee-primary py-2 px-3" onClick={() => handleEventModalOpen()}>
                  Add Event
                </button>
              </div>
              <div className="table-responsive">
                <table className="table admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Limit</th>
                      <th>Scope</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      [1, 2, 3].map(n => (
                        <tr key={n}>
                          <td><div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '4px' }}></div></td>
                          <td><div className="skeleton skeleton-text medium mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td>
                            <div className="d-flex gap-1">
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : events.length > 0 ? (
                      events.map(ev => {
                        const dateStr = new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                          <tr key={ev.id}>
                            <td>
                              {ev.imageUrl ? (
                                <img src={ev.imageUrl} className="table-thumb" alt="" />
                              ) : (
                                <span className="table-thumb-placeholder"><i className="bi bi-calendar-event"></i></span>
                              )}
                            </td>
                            <td className="fw-semibold">{ev.title}</td>
                            <td>{dateStr}</td>
                            <td>{ev.location}</td>
                            <td>{ev.maxAttendees === 0 ? 'Unlimited' : ev.maxAttendees}</td>
                            <td>
                              <span className={`admin-badge ${ev.isPublic ? 'public' : 'private'}`}>
                                {ev.isPublic ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td>
                              <button className="table-action-btn" title="Edit" onClick={() => handleEventModalOpen(ev)}><i className="bi bi-pencil"></i></button>
                              <button className="table-action-btn danger" title="Delete" onClick={() => handleDeleteClick('event', ev.id, ev.title)}><i className="bi bi-trash"></i></button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No events found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'blog' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>Blog Posts</h3>
                <button className="btn btn-ieee btn-ieee-primary py-2 px-3" onClick={() => handleBlogModalOpen()}>
                  New Post
                </button>
              </div>
              <div className="table-responsive">
                <table className="table admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Published</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      [1, 2, 3].map(n => (
                        <tr key={n}>
                          <td><div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '4px' }}></div></td>
                          <td><div className="skeleton skeleton-text medium mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td>
                            <div className="d-flex gap-1">
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : blogPosts.length > 0 ? (
                      blogPosts.map(p => {
                        const dateStr = new Date(p.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                          <tr key={p.id}>
                            <td>
                              {p.imageUrl ? (
                                <img src={p.imageUrl} className="table-thumb" alt="" />
                              ) : (
                                <span className="table-thumb-placeholder"><i className="bi bi-journal-text"></i></span>
                              )}
                            </td>
                            <td className="fw-semibold">{p.title}</td>
                            <td>{p.author ? p.author.fullName : 'Unknown'}</td>
                            <td>{dateStr}</td>
                            <td>
                              <span className={`admin-badge ${p.isPublished ? 'published' : 'draft'}`}>
                                {p.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <button className="table-action-btn" title="Edit" onClick={() => handleBlogModalOpen(p)}><i className="bi bi-pencil"></i></button>
                              <button className="table-action-btn" title={p.isPublished ? 'Unpublish' : 'Publish'} onClick={() => handleTogglePublish(p)}>
                                <i className={`bi ${p.isPublished ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              </button>
                              <button className="table-action-btn danger" title="Delete" onClick={() => handleDeleteClick('blog', p.id, p.title)}><i className="bi bi-trash"></i></button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="6" className="text-center text-muted py-4">No posts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'members' && showMembersTab && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>Branch Members</h3>
              </div>
              <div className="table-responsive">
                <table className="table admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact Details</th>
                      <th>NU ID</th>
                      <th>Faculty & Major</th>
                      <th>Committee</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      [1, 2, 3].map(n => (
                        <tr key={n}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }}></div>
                              <div className="skeleton skeleton-text short mb-0" style={{ width: '120px' }}></div>
                            </div>
                          </td>
                          <td>
                            <div className="skeleton skeleton-text medium mb-1"></div>
                            <div className="skeleton skeleton-text short mb-0"></div>
                          </td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '60px' }}></div></td>
                          <td>
                            <div className="skeleton skeleton-text medium mb-1"></div>
                            <div className="skeleton skeleton-text short mb-0"></div>
                          </td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '85px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '70px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '60px', height: '1.25rem' }}></div></td>
                          <td>
                            <div className="d-flex gap-1">
                              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : members.length > 0 ? (
                      members.map(m => {
                        const isSelf = member.id === m.id;
                        return (
                          <tr key={m.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {m.profilePictureUrl ? (
                                  <img src={m.profilePictureUrl} className="table-img rounded-circle" alt="" />
                                ) : (
                                  <div className="table-img-placeholder rounded-circle">
                                    {(m.fullName || 'M').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="fw-semibold">{m.fullName}</span>
                              </div>
                            </td>
                            <td>
                              <div>{m.email}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.phone}</div>
                            </td>
                            <td><code>{m.nuid}</code></td>
                            <td>
                              <div>{m.faculty}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.major} ({m.academicYear})</div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{m.committeeName || 'None'}</span></td>
                            <td><span className="badge bg-info-subtle text-primary border border-info-subtle">{m.role}</span></td>
                            <td>
                              <span className={`badge ${m.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                                {m.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {!isSelf && (
                                <button className="btn btn-sm btn-link p-0 me-2" onClick={() => handleToggleMemberStatus(m.id, m.isActive)} title="Toggle status">
                                  <i className={`bi ${m.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'}`} style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              )}
                              <button className="table-action-btn" title="Edit" onClick={() => handleMemberModalOpen(m)}><i className="bi bi-pencil"></i></button>
                              {!isSelf && (
                                <button className="table-action-btn danger" title="Delete" onClick={() => handleDeleteClick('member', m.id, m.fullName)}><i className="bi bi-trash"></i></button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="8" className="text-center text-muted py-4">No members found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'applications' && showApplicationsTab && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>Recruitment Applications</h3>
              </div>
              <div className="table-responsive">
                <table className="table admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Contact Details</th>
                      <th>NU ID</th>
                      <th>1st Choice</th>
                      <th>2nd Choice</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      [1, 2, 3].map(n => (
                        <tr key={n}>
                          <td><div className="skeleton skeleton-text short mb-0"></div></td>
                          <td><div className="skeleton skeleton-text medium mb-0" style={{ width: '120px' }}></div></td>
                          <td>
                            <div className="skeleton skeleton-text medium mb-1"></div>
                            <div className="skeleton skeleton-text short mb-0"></div>
                          </td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '60px' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '80px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '80px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '70px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-button" style={{ width: '70px', height: '1.5rem' }}></div></td>
                        </tr>
                      ))
                    ) : applications.length > 0 ? (
                      applications.map(a => {
                        const dateStr = new Date(a.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        let badgeClass = 'bg-warning-subtle text-warning border border-warning-subtle';
                        if (a.status.toLowerCase() === 'approved') badgeClass = 'bg-success-subtle text-success border border-success-subtle';
                        else if (a.status.toLowerCase() === 'rejected') badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
                        return (
                          <tr key={a.id}>
                            <td><span className="text-muted" style={{ fontSize: '0.82rem' }}>{dateStr}</span></td>
                            <td className="fw-semibold">{a.fullName}</td>
                            <td>
                              <div>{a.email}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{a.phone}</div>
                            </td>
                            <td><code>{a.nuid}</code></td>
                            <td><span className="badge bg-light text-dark border">{a.firstChoiceCommitteeName}</span></td>
                            <td><span className="badge bg-light text-dark border">{a.secondChoiceCommitteeName || 'None'}</span></td>
                            <td><span className={`badge ${badgeClass}`}>{a.status}</span></td>
                            <td>
                              <button className="btn btn-ieee btn-ieee-primary py-1 px-2" style={{ fontSize: '0.75rem' }} onClick={() => setAppModal({ show: true, app: a })}>
                                <i className="bi bi-eye me-1"></i> View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="8" className="text-center text-muted py-4">No applications found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'attendance' && showAttendanceTab && (
            <div className="admin-table-card p-4">
              <h3 className="mb-4">Log Attendance</h3>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ieee-secondary)' }}>Select Target Event</label>
                  <select className="form-select" value={selectedEventId} onChange={(e) => loadAttendanceForEvent(e.target.value)}>
                    <option value="">-- Choose Event --</option>
                    {events.map(e => {
                      const dateStr = new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return <option key={e.id} value={e.id}>{e.title} ({dateStr})</option>;
                    })}
                  </select>
                </div>
              </div>

              {selectedEventId ? (
                attendanceRecords.length > 0 ? (
                  <>
                    <div className="table-responsive mb-4">
                      <table className="table admin-table mb-0">
                        <thead>
                          <tr>
                            <th>Full Name</th>
                            <th>Contact Details</th>
                            <th>NU ID & Committee</th>
                            <th style={{ textAlign: 'center' }}>Attended</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map(r => (
                            <tr key={r.memberId}>
                              <td className="fw-semibold">{r.fullName}</td>
                              <td>
                                <div>{r.email}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.phone}</div>
                              </td>
                              <td>
                                <div><code>{r.nuid}</code></div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.committeeName}</div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!r.attended}
                                  style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                                  onChange={(e) => handleAttendanceCheckboxChange(r.memberId, e.target.checked)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button className="btn btn-ieee btn-ieee-primary" onClick={handleSaveAttendance} disabled={saveAttendanceLoading}>
                      <span className="btn-text">Save Attendance</span>
                      {saveAttendanceLoading && <span className="btn-spinner d-inline-block"></span>}
                    </button>
                  </>
                ) : (
                  <div className="text-muted text-center py-4">No active members found to log attendance.</div>
                )
              ) : (
                <div className="text-muted text-center py-4">Please select an event from the dropdown above.</div>
              )}
            </div>
          )}

          {activeSection === 'tasks' && showTasksTab && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>Task Manager</h3>
                <button className="btn btn-ieee btn-ieee-primary py-2 px-3" onClick={() => handleTaskModalOpen()}>
                  Create Task
                </button>
              </div>
              <div className="table-responsive">
                <table className="table admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Title & Description</th>
                      <th>Assigned To</th>
                      <th>Committee</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      [1, 2, 3].map(n => (
                        <tr key={n}>
                          <td>
                            <div className="skeleton skeleton-text medium mb-1" style={{ height: '1rem' }}></div>
                            <div className="skeleton skeleton-text short mb-0"></div>
                          </td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '100px' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '80px', height: '1.25rem' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '80px' }}></div></td>
                          <td><div className="skeleton skeleton-text short mb-0" style={{ width: '80px', height: '1.25rem' }}></div></td>
                          <td>
                            <div className="d-flex gap-1">
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : adminTasks.length > 0 ? (
                      adminTasks.map(t => {
                        const dateStr = new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        let badgeClass = 'bg-secondary';
                        if (t.status === 'ToDo') badgeClass = 'bg-danger';
                        else if (t.status === 'InProgress') badgeClass = 'bg-warning text-dark';
                        else if (t.status === 'Completed') badgeClass = 'bg-success';

                        return (
                          <tr key={t.id}>
                            <td>
                              <div className="fw-semibold">{t.title}</div>
                              <div className="text-muted text-truncate" style={{ maxWidth: '250px', fontSize: '0.75rem' }}>{t.description}</div>
                            </td>
                            <td className="fw-medium">{t.assignedMemberName}</td>
                            <td><span className="badge bg-light text-dark border">{t.assignedMemberCommittee}</span></td>
                            <td>{dateStr}</td>
                            <td><span className={`badge ${badgeClass}`}>{t.status === 'ToDo' ? 'To Do' : t.status === 'InProgress' ? 'In Progress' : 'Completed'}</span></td>
                            <td>
                              <button className="table-action-btn" title="Edit" onClick={() => handleTaskModalOpen(t)}><i className="bi bi-pencil"></i></button>
                              <button className="table-action-btn danger" title="Delete" onClick={() => handleDeleteClick('task', t.id, t.title)}><i className="bi bi-trash"></i></button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="6" className="text-center text-muted py-4">No tasks configured.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {deleteModal.show && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteModal({ show: false, type: '', id: null, title: '' })}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "{deleteModal.title}"? This action is permanent and cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setDeleteModal({ show: false, type: '', id: null, title: '' })}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleExecuteDelete} disabled={deleteLoading}>
                  <span className="btn-text">Delete Item</span>
                  {deleteLoading && <span className="btn-spinner d-inline-block"></span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventModal.show && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleEventSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{eventModal.id ? 'Edit Event' : 'Add Event'}</h5>
                  <button type="button" className="btn-close" onClick={() => setEventModal(prev => ({ ...prev, show: false }))}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Cover Image</label>
                    <div className="image-upload-box" onClick={() => document.getElementById('eventCoverInput').click()}>
                      {eventModal.preview ? (
                        <img src={eventModal.preview} alt="Preview" />
                      ) : (
                        <>
                          <div className="upload-icon"><i className="bi bi-image"></i></div>
                          <div className="upload-label"><strong>Click to upload</strong> cover photo</div>
                        </>
                      )}
                      <input
                        type="file"
                        id="eventCoverInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setEventModal(prev => ({ ...prev, file, preview: event.target.result }));
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="eventTitleInput"
                      placeholder="Title"
                      value={eventModal.title}
                      onChange={(e) => setEventModal(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                    <label htmlFor="eventTitleInput">Event Title</label>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="eventDescInput"
                      placeholder="Description"
                      style={{ height: '100px' }}
                      value={eventModal.description}
                      onChange={(e) => setEventModal(prev => ({ ...prev, description: e.target.value }))}
                      required
                    ></textarea>
                    <label htmlFor="eventDescInput">Event Description</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="eventDateInput"
                      value={eventModal.eventDate}
                      onChange={(e) => setEventModal(prev => ({ ...prev, eventDate: e.target.value }))}
                      required
                    />
                    <label htmlFor="eventDateInput">Date & Time</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="eventLocInput"
                      placeholder="Location"
                      value={eventModal.location}
                      onChange={(e) => setEventModal(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                    <label htmlFor="eventLocInput">Location</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="number"
                      className="form-control"
                      id="eventMaxInput"
                      placeholder="Max Attendees"
                      value={eventModal.maxAttendees}
                      onChange={(e) => setEventModal(prev => ({ ...prev, maxAttendees: e.target.value }))}
                      required
                    />
                    <label htmlFor="eventMaxInput">Max Attendees (0 for unlimited)</label>
                  </div>

                  <div className="form-check form-switch form-check-ieee mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="eventPublicCheck"
                      checked={eventModal.isPublic}
                      onChange={(e) => setEventModal(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                    <label className="form-check-label ms-2" htmlFor="eventPublicCheck" style={{ fontSize: '0.88rem' }}>Make Event Public</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setEventModal(prev => ({ ...prev, show: false }))}>Cancel</button>
                  <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={eventSaveLoading}>
                    <span className="btn-text">Save Event</span>
                    {eventSaveLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {blogModal.show && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleBlogSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{blogModal.id ? 'Edit Post' : 'New Post'}</h5>
                  <button type="button" className="btn-close" onClick={() => setBlogModal(prev => ({ ...prev, show: false }))}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Cover Image</label>
                    <div className="image-upload-box" onClick={() => document.getElementById('blogCoverInput').click()}>
                      {blogModal.preview ? (
                        <img src={blogModal.preview} alt="Preview" />
                      ) : (
                        <>
                          <div className="upload-icon"><i className="bi bi-image"></i></div>
                          <div className="upload-label"><strong>Click to upload</strong> cover photo</div>
                        </>
                      )}
                      <input
                        type="file"
                        id="blogCoverInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setBlogModal(prev => ({ ...prev, file, preview: event.target.result }));
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="blogTitleInput"
                      placeholder="Title"
                      value={blogModal.title}
                      onChange={(e) => setBlogModal(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                    <label htmlFor="blogTitleInput">Post Title</label>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="blogContentInput"
                      placeholder="Content"
                      style={{ height: '200px' }}
                      value={blogModal.content}
                      onChange={(e) => setBlogModal(prev => ({ ...prev, content: e.target.value }))}
                      required
                    ></textarea>
                    <label htmlFor="blogContentInput">Post Content</label>
                  </div>

                  <div className="form-check form-switch form-check-ieee mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="blogPublishedCheck"
                      checked={blogModal.isPublished}
                      onChange={(e) => setBlogModal(prev => ({ ...prev, isPublished: e.target.checked }))}
                    />
                    <label className="form-check-label ms-2" htmlFor="blogPublishedCheck" style={{ fontSize: '0.88rem' }}>Publish Immediately</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setBlogModal(prev => ({ ...prev, show: false }))}>Cancel</button>
                  <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={blogSaveLoading}>
                    <span className="btn-text">Save Post</span>
                    {blogSaveLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {memberModal.show && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleMemberSave}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Member Account</h5>
                  <button type="button" className="btn-close" onClick={() => setMemberModal(prev => ({ ...prev, show: false }))}></button>
                </div>
                <div className="modal-body">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="memberFullnameInput"
                      placeholder="Full Name"
                      value={memberModal.fullName}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberFullnameInput">Full Name</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="memberEmailInput"
                      placeholder="Email"
                      value={memberModal.email}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberEmailInput">Email Address</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="tel"
                      className="form-control"
                      id="memberPhoneInput"
                      placeholder="Phone"
                      value={memberModal.phone}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberPhoneInput">Phone Number</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="memberNuidInput"
                      placeholder="NU ID"
                      value={memberModal.nuid}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, nuid: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberNuidInput">NU ID</label>
                  </div>

                  <div className="form-floating mb-3">
                    <select
                      className="form-select"
                      id="memberAcademicYearInput"
                      value={memberModal.academicYear}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, academicYear: e.target.value }))}
                      required
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                    </select>
                    <label htmlFor="memberAcademicYearInput">Academic Year</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="memberFacultyInput"
                      placeholder="Faculty"
                      value={memberModal.faculty}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, faculty: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberFacultyInput">Faculty</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="memberMajorInput"
                      placeholder="Major"
                      value={memberModal.major}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, major: e.target.value }))}
                      required
                    />
                    <label htmlFor="memberMajorInput">Major</label>
                  </div>

                  <div className="form-floating mb-3">
                    <select
                      className="form-select"
                      id="memberCommitteeInput"
                      value={memberModal.committeeId}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, committeeId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>-- Choose Committee --</option>
                      {committees.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <label htmlFor="memberCommitteeInput">Branch Committee</label>
                  </div>

                  <div className="form-floating mb-3">
                    <select
                      className="form-select"
                      id="memberRoleInput"
                      value={memberModal.role}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, role: e.target.value }))}
                      required
                    >
                      <option value="Member">Member</option>
                      <option value="board">Board</option>
                      <option value="media">Media</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <label htmlFor="memberRoleInput">System Access Role</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="memberPasswordInput"
                      placeholder="New Password"
                      value={memberModal.password}
                      onChange={(e) => setMemberModal(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <label htmlFor="memberPasswordInput">New Password (leave blank to keep current)</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setMemberModal(prev => ({ ...prev, show: false }))}>Cancel</button>
                  <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={memberSaveLoading}>
                    <span className="btn-text">Save Changes</span>
                    {memberSaveLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {appModal.show && appModal.app && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Details</h5>
                <button type="button" className="btn-close" onClick={() => setAppModal({ show: false, app: null })}></button>
              </div>
              <div className="modal-body" style={{ color: '#000' }}>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Applicant Name</div>
                    <div className="fw-bold">{appModal.app.fullName}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">NU ID</div>
                    <div className="fw-bold"><code>{appModal.app.nuid}</code></div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Contact Email</div>
                    <div className="fw-bold">{appModal.app.email}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Phone Number</div>
                    <div className="fw-bold">{appModal.app.phone}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Faculty & Major</div>
                    <div className="fw-bold">{appModal.app.faculty} / {appModal.app.major} ({appModal.app.academicYear})</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Committee Preferences</div>
                    <div className="fw-bold text-primary">1st Choice: {appModal.app.firstChoiceCommitteeName}</div>
                    <div className="fw-bold text-secondary">2nd Choice: {appModal.app.secondChoiceCommitteeName || 'None'}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Bio & Background Details</div>
                  <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>{appModal.app.bio || 'No details provided.'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Previous Student Activities</div>
                  <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>{appModal.app.pastExperience || 'No past activities listed.'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Why do you want to join IEEE?</div>
                  <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>{appModal.app.whyJoin || 'Not answered.'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">What do you know about IEEE?</div>
                  <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>{appModal.app.whatDoYouKnow || 'Not answered.'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Application Status</div>
                  <div>
                    <span className={`badge ${appModal.app.status.toLowerCase() === 'approved' ? 'bg-success' : appModal.app.status.toLowerCase() === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {appModal.app.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setAppModal({ show: false, app: null })}>Close</button>
                {appModal.app.status.toLowerCase() === 'pending' && (
                  <>
                    <button type="button" className="btn btn-danger" onClick={() => handleAppDecision(appModal.app.id, false)} disabled={appActionLoading}>
                      <span className="btn-text">Reject Application</span>
                      {appActionLoading && <span className="btn-spinner d-inline-block"></span>}
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => handleAppDecision(appModal.app.id, true)} disabled={appActionLoading}>
                      <span className="btn-text">Approve & Register</span>
                      {appActionLoading && <span className="btn-spinner d-inline-block"></span>}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {taskModal.show && (
        <div className="modal fade show d-block modal-admin" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleTaskSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{taskModal.id ? 'Edit Task' : 'Create Task'}</h5>
                  <button type="button" className="btn-close" onClick={() => setTaskModal(prev => ({ ...prev, show: false }))}></button>
                </div>
                <div className="modal-body">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="taskTitleInput"
                      placeholder="Title"
                      value={taskModal.title}
                      onChange={(e) => setTaskModal(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                    <label htmlFor="taskTitleInput">Task Title</label>
                  </div>

                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      id="taskDescInput"
                      placeholder="Description"
                      style={{ height: '100px' }}
                      value={taskModal.description}
                      onChange={(e) => setTaskModal(prev => ({ ...prev, description: e.target.value }))}
                      required
                    ></textarea>
                    <label htmlFor="taskDescInput">Task Description</label>
                  </div>

                  <div className="form-floating mb-3">
                    <select
                      className="form-select"
                      id="taskAssigneeInput"
                      value={taskModal.assignedMemberId}
                      onChange={(e) => setTaskModal(prev => ({ ...prev, assignedMemberId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>-- Choose Member --</option>
                      {taskMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName} ({m.committeeName})</option>
                      ))}
                    </select>
                    <label htmlFor="taskAssigneeInput">Assigned Member</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="date"
                      className="form-control"
                      id="taskDueDateInput"
                      value={taskModal.dueDate}
                      onChange={(e) => setTaskModal(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                    <label htmlFor="taskDueDateInput">Due Date</label>
                  </div>

                  <div className="form-floating mb-3">
                    <select
                      className="form-select"
                      id="taskStatusInput"
                      value={taskModal.status}
                      onChange={(e) => setTaskModal(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="ToDo">To Do</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <label htmlFor="taskStatusInput">Task Status</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setTaskModal(prev => ({ ...prev, show: false }))}>Cancel</button>
                  <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={taskSaveLoading}>
                    <span className="btn-text">Save Task</span>
                    {taskSaveLoading && <span className="btn-spinner d-inline-block"></span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-alert ${t.type}`}>
            <i className={`bi ${t.type === 'success' ? 'bi-check-circle-fill text-success' : t.type === 'error' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-info-circle-fill text-primary'}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
