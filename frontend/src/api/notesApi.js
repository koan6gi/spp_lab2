const API_URL = '/api/notes';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = '';

    try {
      const rawText = await response.text();
      try {
        const data = JSON.parse(rawText);
        errorMessage = data.error || data.message || data.detail;
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
        case 404:
          errorMessage = 'Note not found.';
          break;
        case 413:
          errorMessage = 'File size exceeds the 20 MB limit.';
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

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const apiRequest = async (url, options) => {
  try {
    const response = await fetch(url, options);
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
