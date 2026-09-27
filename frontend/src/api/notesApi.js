import { refreshAccessToken } from './authApi';

const API_URL = '/api/notes';

const getAuthHeaders = () => {
  const token = localStorage.getItem('notes_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = '';
    let errorCode = '';

    try {
      const rawText = await response.text();
      try {
        const data = JSON.parse(rawText);
        errorMessage = data.error || data.message || data.detail;
        errorCode = data.code;
      } catch {
        if (rawText && !rawText.includes('<html') && !rawText.includes('<!DOCTYPE')) {
          errorMessage = rawText.trim();
        }
      }
    } catch {
      // Ignored
    }

    if (!errorMessage) {
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid request data.';
          break;
        case 401:
          errorMessage = 'Please sign in to access your notes.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Note not found.';
          break;
        case 413:
          errorMessage = 'File size exceeds the 20 MB limit.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please slow down.';
          break;
        case 500:
          errorMessage = 'Server error occurred while processing the request.';
          break;
        case 502:
        case 503:
          errorMessage = 'Backend service is unavailable. Please try again shortly.';
          break;
        default:
          errorMessage = `Server error (${response.statusText || 'Error ' + response.status})`;
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const apiRequest = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const storedRefreshToken = localStorage.getItem('notes_refresh_token');
      if (storedRefreshToken) {
        try {
          const refreshResult = await refreshAccessToken(storedRefreshToken);
          if (refreshResult && refreshResult.accessToken) {
            localStorage.setItem('notes_access_token', refreshResult.accessToken);
            headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
            response = await fetch(url, { ...options, headers });
          }
        } catch {
          localStorage.removeItem('notes_access_token');
          localStorage.removeItem('notes_refresh_token');
          localStorage.removeItem('notes_user');
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    }

    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check your network connection.');
    }
    throw err;
  }
};

export const fetchNotes = async () => {
  return apiRequest(API_URL);
};

export const createNote = async (payload) => {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };

  return apiRequest(API_URL, options);
};

export const updateNote = async (id, payload) => {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'PUT',
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };

  return apiRequest(`${API_URL}/${id}`, options);
};

export const deleteNote = async (id) => {
  return apiRequest(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
};
