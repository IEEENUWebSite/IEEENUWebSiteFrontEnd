import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, getMember, saveSession, clearSession } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(getToken());
  const [member, setMember] = useState(getMember());

  const [activeSection, setActiveSection] = useState('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [attendance, setAttendance] = useState({ records: [], total: 0, attended: 0, percentage: 0 });
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editFaculty, setEditFaculty] = useState('Computer Science');
  const [editMajor, setEditMajor] = useState('');
  const [editAcademicYear, setEditAcademicYear] = useState('Freshman');
  const [editPassword, setEditPassword] = useState('');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeSection === 'tasks') {
      loadTasks();
    } else if (activeSection === 'attendance') {
      loadAttendance();
    } else if (activeSection === 'profile') {
      populateProfileFields();
    }
  }, [activeSection]);

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const data = await api.getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const data = await api.getMyAttendance();
      const records = data.records || data || [];
      const total = data.totalEvents || records.length;
      const attended = data.attendedEvents || records.filter(r => r.attended).length;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
      setAttendance({ records, total, attended, percentage });
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const populateProfileFields = () => {
    const m = getMember();
    if (m) {
      setEditPhone(m.phone || '');
      setEditFaculty(m.faculty || 'Computer Science');
      setEditMajor(m.major || '');
      setEditAcademicYear(m.academicYear || 'Freshman');
      setEditPassword('');
      setSelectedAvatarFile(null);
      setAvatarPreview(m.profilePictureUrl || '');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setAvatarPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaveLoading(true);
    setProfileFeedback({ show: false, type: '', message: '' });

    try {
      let uploadedUrl = null;
      if (selectedAvatarFile) {
        const uploadRes = await api.uploadImage(selectedAvatarFile);
        uploadedUrl = uploadRes.url;
      }

      const payload = {
        phone: editPhone,
        faculty: editFaculty,
        major: editMajor,
        academicYear: editAcademicYear
      };

      if (uploadedUrl) {
        payload.profilePictureUrl = uploadedUrl;
      }
      if (editPassword) {
        payload.password = editPassword;
      }

      await api.updateMyProfile(payload);

      const currentMember = getMember();
      const updatedMember = {
        ...currentMember,
        phone: editPhone,
        faculty: editFaculty,
        major: editMajor,
        academicYear: editAcademicYear,
        ...(uploadedUrl ? { profilePictureUrl: uploadedUrl } : {})
      };

      saveSession(getToken(), updatedMember);
      setMember(updatedMember);
      setIsEditingProfile(false);
      setProfileFeedback({
        show: true,
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (err) {
      console.error(err);
      setProfileFeedback({
        show: true,
        type: 'error',
        message: err.message || 'Failed to update profile details.'
      });
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      await updateTaskStatus(parseInt(taskId, 10), targetStatus);
    }
  };

  const updateTaskStatus = async (taskId, targetStatus) => {
    try {
      await api.updateMyTaskStatus(taskId, targetStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const normalizeStatus = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '');
    if (s === 'todo' || s === 'to do') return 'ToDo';
    if (s === 'inprogress' || s === 'in progress') return 'InProgress';
    if (s === 'completed' || s === 'done') return 'Completed';
    return 'ToDo';
  };

  const tasksByStatus = {
    ToDo: tasks.filter(t => normalizeStatus(t.status) === 'ToDo'),
    InProgress: tasks.filter(t => normalizeStatus(t.status) === 'InProgress'),
    Completed: tasks.filter(t => normalizeStatus(t.status) === 'Completed')
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const isAdmin = member && ['admin', 'board', 'media', 'moderator'].includes((member.role || '').toLowerCase());

  const circumference = 2 * Math.PI * 76;
  const strokeDashoffset = circumference - (attendance.percentage / 100) * circumference;

  return (
    <div className="dashboard-wrapper">
      <div className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`} id="dashSidebar">
        <div className="sidebar-brand">
          <a href="/">IEEE Nile University</a>
        </div>
        <div className="sidebar-nav">
          <button
            className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'tasks' ? 'active' : ''}`}
            onClick={() => { setActiveSection('tasks'); setIsSidebarOpen(false); }}
          >
            <i className="bi bi-kanban"></i> Task Board
          </button>
          <button
            className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveSection('attendance'); setIsSidebarOpen(false); }}
          >
            <i className="bi bi-calendar-check"></i> Attendance
          </button>
          <button
            className={`dash-nav-item btn btn-link w-100 text-start border-0 ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveSection('profile'); setIsSidebarOpen(false); }}
          >
            <i className="bi bi-person-gear"></i> Profile
          </button>
          {isAdmin && (
            <button
              className="dash-nav-item btn btn-link w-100 text-start border-0"
              onClick={() => navigate('/admin')}
            >
              <i className="bi bi-shield-lock"></i> Admin Panel
            </button>
          )}
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
            <span className="topbar-title">
              {activeSection === 'tasks' && 'Task Board'}
              {activeSection === 'attendance' && 'My Attendance'}
              {activeSection === 'profile' && 'My Profile'}
            </span>
          </div>
          {member && (
            <div className="topbar-user">
              <span>{member.fullName}</span>
              {member.profilePictureUrl ? (
                <img src={member.profilePictureUrl} alt="" className="topbar-avatar-img" />
              ) : (
                <div className="user-avatar">{member.fullName.charAt(0).toUpperCase()}</div>
              )}
            </div>
          )}
        </div>

        <div className="dash-content">
          {activeSection === 'tasks' && (
            <div className="dash-section active">
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="dash-stat-card">
                    <div className="stat-icon blue"><i className="bi bi-list-task"></i></div>
                    <div className="stat-info">
                      <h3>{tasksByStatus.ToDo.length}</h3>
                      <p>To Do</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="dash-stat-card">
                    <div className="stat-icon orange"><i className="bi bi-clock-history"></i></div>
                    <div className="stat-info">
                      <h3>{tasksByStatus.InProgress.length}</h3>
                      <p>In Progress</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="dash-stat-card">
                    <div className="stat-icon green"><i className="bi bi-check-circle"></i></div>
                    <div className="stat-info">
                      <h3>{tasksByStatus.Completed.length}</h3>
                      <p>Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {tasksLoading ? (
                <div className="text-center py-5">
                  <span className="btn-spinner d-inline-block" style={{ borderColor: 'var(--ieee-primary)', borderTopColor: 'transparent' }}></span>
                </div>
              ) : (
                <div className="kanban-board">
                  {['ToDo', 'InProgress', 'Completed'].map(colKey => {
                    const colName = colKey === 'ToDo' ? 'To Do' : colKey === 'InProgress' ? 'In Progress' : 'Completed';
                    const colTasks = tasksByStatus[colKey] || [];
                    return (
                      <div
                        key={colKey}
                        className={`kanban-column col-${colKey.toLowerCase()}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, colKey)}
                      >
                        <div className="kanban-column-header">
                          <h4>{colName}</h4>
                          <span className="task-count">{colTasks.length}</span>
                        </div>
                        <div className="kanban-column-body">
                          {colTasks.length > 0 ? (
                            colTasks.map(t => {
                              const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                              const isOverdue = dueDate && dueDate < new Date() && colKey !== 'Completed';
                              const dateStr = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                              return (
                                <div
                                  key={t.id}
                                  className="kanban-card"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, t.id)}
                                >
                                  <div className="card-title">{t.title}</div>
                                  <div className="card-desc">{t.description}</div>
                                  <div className="card-footer-meta">
                                    <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                                      {dateStr && <><i className="bi bi-clock"></i> {dateStr}</>}
                                      {isOverdue && ' (Overdue)'}
                                    </span>
                                    <span className="status-actions">
                                      {colKey === 'ToDo' && (
                                        <button className="status-move-btn" onClick={() => updateTaskStatus(t.id, 'InProgress')} title="Move to In Progress">
                                          <i className="bi bi-arrow-right"></i>
                                        </button>
                                      )}
                                      {colKey === 'InProgress' && (
                                        <>
                                          <button className="status-move-btn" onClick={() => updateTaskStatus(t.id, 'ToDo')} title="Move to To Do" style={{ marginRight: '4px' }}>
                                            <i className="bi bi-arrow-left"></i>
                                          </button>
                                          <button className="status-move-btn" onClick={() => updateTaskStatus(t.id, 'Completed')} title="Move to Completed">
                                            <i className="bi bi-check-lg"></i>
                                          </button>
                                        </>
                                      )}
                                      {colKey === 'Completed' && (
                                        <button className="status-move-btn" onClick={() => updateTaskStatus(t.id, 'InProgress')} title="Move to In Progress">
                                          <i className="bi bi-arrow-left"></i>
                                        </button>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>No tasks</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === 'attendance' && (
            <div className="dash-section active">
              {attendanceLoading ? (
                <div className="text-center py-5">
                  <span className="btn-spinner d-inline-block" style={{ borderColor: 'var(--ieee-primary)', borderTopColor: 'transparent' }}></span>
                </div>
              ) : (
                <div className="row g-4">
                  <div className="col-lg-5">
                    <div className="attendance-card text-center">
                      <div className="gauge-container">
                        <svg className="gauge-svg">
                          <circle className="gauge-bg" cx="90" cy="90" r="76" />
                          <circle
                            className="gauge-fill"
                            cx="90"
                            cy="90"
                            r="76"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                          />
                          <g className="gauge-text-group">
                            <text className="gauge-percent" x="90" y="95">{attendance.percentage}%</text>
                            <text className="gauge-label" x="90" y="120">Attended</text>
                          </g>
                        </svg>
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <div className="text-muted small">Attended</div>
                          <h4 style={{ color: '#28a745' }}>{attendance.attended}</h4>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small">Missed</div>
                          <h4 style={{ color: '#dc3545' }}>{attendance.total - attendance.attended}</h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="attendance-card" style={{ height: '100%' }}>
                      <h4 className="mb-4">Attendance Log</h4>
                      <div className="attendance-log">
                        {attendance.records.length > 0 ? (
                          attendance.records.map((r, idx) => {
                            const eventTitle = r.event ? r.event.title : (r.eventTitle || 'Event');
                            const eventDate = r.event ? r.event.eventDate : (r.eventDate || r.loggedTime);
                            const dateStr = new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                              <div key={idx} className="attendance-row">
                                <div>
                                  <div className="att-event">{eventTitle}</div>
                                  <div className="att-date">{dateStr}</div>
                                </div>
                                <span className={`att-badge ${r.attended ? 'attended' : 'missed'}`}>
                                  {r.attended ? 'Attended' : 'Missed'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-muted py-4">No attendance records found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'profile' && member && (
            <div className="dash-section active">
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="profile-card">
                    <div className="profile-header">
                      {member.profilePictureUrl ? (
                        <div className="profile-avatar has-image">
                          <img src={member.profilePictureUrl} alt="" />
                        </div>
                      ) : (
                        <div className="profile-avatar">{member.fullName.charAt(0).toUpperCase()}</div>
                      )}
                      <h3>{member.fullName}</h3>
                      <div className="profile-role">{member.role}</div>
                      <button className="profile-edit-btn" onClick={() => { setIsEditingProfile(!isEditingProfile); populateProfileFields(); }} title="Edit Profile Details">
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                    </div>

                    <div className="profile-body">
                      {[
                        { icon: 'bi-envelope', label: 'Email', value: member.email },
                        { icon: 'bi-phone', label: 'Phone', value: member.phone },
                        { icon: 'bi-person-vcard', label: 'NU ID', value: member.nuid },
                        { icon: 'bi-mortarboard', label: 'Faculty', value: member.faculty },
                        { icon: 'bi-book', label: 'Major', value: member.major },
                        { icon: 'bi-calendar-event', label: 'Academic Year', value: member.academicYear },
                        { icon: 'bi-people', label: 'Committee', value: member.committeeName || (member.committee && member.committee.name) || 'None' },
                        { icon: 'bi-clock-history', label: 'Joined', value: member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '' }
                      ].map((f, idx) => f.value && (
                        <div key={idx} className="profile-field">
                          <i className={`bi ${f.icon}`}></i>
                          <div>
                            <div className="field-label">{f.label}</div>
                            <div className="field-value">{f.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  {isEditingProfile && (
                    <div className="profile-card p-4">
                      <h4 className="mb-4">Edit Profile</h4>
                      <form onSubmit={handleProfileSave}>
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ieee-secondary)' }}>Profile Picture</label>
                          <div className="avatar-upload-zone" onClick={() => document.getElementById('avatarInput').click()}>
                            <div className="upload-preview">
                              {avatarPreview ? <img src={avatarPreview} alt="Preview" /> : <i className="bi bi-camera"></i>}
                            </div>
                            <div className="upload-text">
                              <strong>Click to upload</strong> or change photo
                            </div>
                            <input
                              type="file"
                              id="avatarInput"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleAvatarChange}
                            />
                          </div>
                        </div>

                        <div className="form-floating mb-3">
                          <input
                            type="tel"
                            className="form-control"
                            id="editPhoneInput"
                            placeholder="Phone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            maxLength="20"
                            required
                          />
                          <label htmlFor="editPhoneInput" style={{ color: 'var(--ieee-secondary)' }}>Phone Number</label>
                        </div>

                        <div className="form-floating mb-3">
                          <select
                            className="form-select"
                            id="editFacultyInput"
                            value={editFaculty}
                            onChange={(e) => setEditFaculty(e.target.value)}
                            required
                          >
                            <option value="Computer Science">Computer Science</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Business">Business</option>
                            <option value="Biotechnology">Biotechnology</option>
                            <option value="Other">Other</option>
                          </select>
                          <label htmlFor="editFacultyInput" style={{ color: 'var(--ieee-secondary)' }}>Faculty</label>
                        </div>

                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            id="editMajorInput"
                            placeholder="Major"
                            value={editMajor}
                            onChange={(e) => setEditMajor(e.target.value)}
                            maxLength="100"
                            required
                          />
                          <label htmlFor="editMajorInput" style={{ color: 'var(--ieee-secondary)' }}>Major</label>
                        </div>

                        <div className="form-floating mb-3">
                          <select
                            className="form-select"
                            id="editAcademicYearInput"
                            value={editAcademicYear}
                            onChange={(e) => setEditAcademicYear(e.target.value)}
                            required
                          >
                            <option value="Freshman">Freshman</option>
                            <option value="Sophomore">Sophomore</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                          </select>
                          <label htmlFor="editAcademicYearInput" style={{ color: 'var(--ieee-secondary)' }}>Academic Year</label>
                        </div>

                        <div className="form-floating mb-4">
                          <input
                            type="password"
                            className="form-control"
                            id="editPasswordInput"
                            placeholder="New Password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                          />
                          <label htmlFor="editPasswordInput" style={{ color: 'var(--ieee-secondary)' }}>New Password (leave blank to keep current)</label>
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-ieee btn-ieee-primary" disabled={profileSaveLoading}>
                            <span className="btn-text">Save Changes</span>
                            {profileSaveLoading && <span className="btn-spinner d-inline-block"></span>}
                          </button>
                          <button type="button" className="btn btn-ieee btn-ieee-outline text-dark border-secondary" onClick={() => setIsEditingProfile(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>

                      {profileFeedback.show && (
                        <div className={`feedback-panel mt-3 text-center ${profileFeedback.type} show`}>
                          {profileFeedback.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

