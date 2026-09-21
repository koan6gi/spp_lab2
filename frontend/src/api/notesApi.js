const API_URL = '/api/notes';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Non-JSON response body
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const fetchNotes = async () => {
  const response = await fetch(API_URL);
  return handleResponse(response);
};

export const createNote = async (payload) => {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };

  const response = await fetch(API_URL, options);
  return handleResponse(response);
};

export const updateNote = async (id, payload) => {
  const isFormData = payload instanceof FormData;
  const options = {
    method: 'PUT',
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };

  const response = await fetch(`${API_URL}/${id}`, options);
  return handleResponse(response);
};

export const deleteNote = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};
