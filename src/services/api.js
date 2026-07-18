const API_BASE = 'https://ieeenuwebsite-b6bfh8dfg3bqfue6.francecentral-01.azurewebsites.net/api';

export const getToken = () => localStorage.getItem('ieee_token');

export const getMember = () => {
  try {
    const m = localStorage.getItem('ieee_member');
    return m ? JSON.parse(m) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token, member) => {
  localStorage.setItem('ieee_token', token);
  localStorage.setItem('ieee_member', JSON.stringify(member));
};

export const clearSession = () => {
  localStorage.removeItem('ieee_token');
  localStorage.removeItem('ieee_member');
};

const getHeaders = (isJson = true) => {
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.title || 'Request failed');
  }
  return data;
};

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/Auth/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  getCommittees: async () => {
    const res = await fetch(`${API_BASE}/Committees`);
    return handleResponse(res);
  },

  applyRecruitment: async (payload) => {
    const res = await fetch(`${API_BASE}/Recruitment/Apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  submitContact: async (payload) => {
    const res = await fetch(`${API_BASE}/Contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getEvents: async () => {
    const res = await fetch(`${API_BASE}/Events`);
    return handleResponse(res);
  },

  createEvent: async (payload) => {
    const res = await fetch(`${API_BASE}/Events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  updateEvent: async (id, payload) => {
    const res = await fetch(`${API_BASE}/Events/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  deleteEvent: async (id) => {
    const res = await fetch(`${API_BASE}/Events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  getBlogPosts: async () => {
    const res = await fetch(`${API_BASE}/Blog`);
    return handleResponse(res);
  },

  createBlogPost: async (payload) => {
    const res = await fetch(`${API_BASE}/Blog`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  updateBlogPost: async (id, payload) => {
    const res = await fetch(`${API_BASE}/Blog/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  deleteBlogPost: async (id) => {
    const res = await fetch(`${API_BASE}/Blog/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/Upload`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData
    });
    return handleResponse(res);
  },

  getMyTasks: async () => {
    const res = await fetch(`${API_BASE}/Tasks/MyTasks`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateMyTaskStatus: async (taskId, status) => {
    const res = await fetch(`${API_BASE}/Tasks/${taskId}/Status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  getAdminTasks: async () => {
    const res = await fetch(`${API_BASE}/Tasks`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAdminTaskMembers: async () => {
    const res = await fetch(`${API_BASE}/Tasks/Members`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createAdminTask: async (payload) => {
    const res = await fetch(`${API_BASE}/Tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  updateAdminTask: async (id, payload) => {
    const res = await fetch(`${API_BASE}/Tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  deleteAdminTask: async (id) => {
    const res = await fetch(`${API_BASE}/Tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  getMyAttendance: async () => {
    const res = await fetch(`${API_BASE}/Attendance/MyAttendance`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAttendanceForEvent: async (eventId) => {
    const res = await fetch(`${API_BASE}/Attendance/Event/${eventId}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  saveAttendanceForEvent: async (eventId, records) => {
    const res = await fetch(`${API_BASE}/Attendance/Event/${eventId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ records })
    });
    return handleResponse(res);
  },

  getMembers: async () => {
    const res = await fetch(`${API_BASE}/Members`, {
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  updateMember: async (id, payload) => {
    const res = await fetch(`${API_BASE}/Members/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  updateMyProfile: async (payload) => {
    const res = await fetch(`${API_BASE}/Members/Me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  toggleMemberStatus: async (id, isActive) => {
    const res = await fetch(`${API_BASE}/Members/${id}/Status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isActive })
    });
    return handleResponse(res);
  },

  deleteMember: async (id) => {
    const res = await fetch(`${API_BASE}/Members/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  getApplications: async () => {
    const res = await fetch(`${API_BASE}/Recruitment`, {
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  acceptApplication: async (id) => {
    const res = await fetch(`${API_BASE}/Recruitment/${id}/Accept`, {
      method: 'POST',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  rejectApplication: async (id) => {
    const res = await fetch(`${API_BASE}/Recruitment/${id}/Reject`, {
      method: 'POST',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  }
};
