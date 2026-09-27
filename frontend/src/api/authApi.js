const AUTH_BASE = '/api/auth';
const USERS_BASE = '/api/users';

const getHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  const activeToken = token || localStorage.getItem('notes_access_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
};

const handleAuthResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = '';
    let errorCode = '';

    try {
      const data = await response.json();
      errorMessage = data.error;
      errorCode = data.code;
    } catch {
      // Ignored
    }

    if (!errorMessage) {
      if (response.status === 401) errorMessage = 'Invalid credentials or session expired.';
      else if (response.status === 403) errorMessage = 'Access forbidden.';
      else if (response.status === 422) errorMessage = 'Invalid input data.';
      else if (response.status === 429) errorMessage = 'Too many requests. Please try again later.';
      else errorMessage = `Request failed (${response.status})`;
    }

    const err = new Error(errorMessage);
    err.code = errorCode;
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
};

export const register = async (email, password) => {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleAuthResponse(res);
};

export const login = async (email, password) => {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleAuthResponse(res);
};

export const refreshAccessToken = async (refreshToken) => {
  const res = await fetch(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleAuthResponse(res);
};

export const logout = async (refreshToken) => {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Ignore error on logout
  }
};

export const getMe = async () => {
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: getHeaders(),
  });
  return handleAuthResponse(res);
};

export const getSessions = async () => {
  const res = await fetch(`${AUTH_BASE}/sessions`, {
    headers: getHeaders(),
  });
  return handleAuthResponse(res);
};

export const revokeSession = async (id) => {
  const res = await fetch(`${AUTH_BASE}/sessions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleAuthResponse(res);
};

export const revokeOtherSessions = async (currentSessionId) => {
  const res = await fetch(`${AUTH_BASE}/sessions`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ currentSessionId }),
  });
  return handleAuthResponse(res);
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${AUTH_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleAuthResponse(res);
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${AUTH_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return handleAuthResponse(res);
};

export const getUsers = async () => {
  const res = await fetch(USERS_BASE, {
    headers: getHeaders(),
  });
  return handleAuthResponse(res);
};

export const updateUserRole = async (userId, role) => {
  const res = await fetch(`${USERS_BASE}/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleAuthResponse(res);
};

export const toggleBlockUser = async (userId) => {
  const res = await fetch(`${USERS_BASE}/${userId}/block`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  return handleAuthResponse(res);
};
