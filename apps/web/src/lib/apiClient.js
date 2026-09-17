// Falls back to whatever host the page itself was loaded from (same port 3000)
// instead of a hardcoded "localhost" — so opening the dev server from a LAN
// IP (e.g. http://10.20.0.3:5173) still reaches the API on that same machine
// instead of trying to hit "localhost" on the viewer's own device.
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

let accessToken = null;
let refreshPromise = null;

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const body = await res.json();
        setAccessToken(body.data.accessToken);
        return body.data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, isFormData = false, skipRetry = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && !skipRetry && path !== '/api/auth/refresh') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, { method, body, isFormData, skipRetry: true });
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message || `Request failed with status ${res.status}`, data?.errors);
  }

  return data;
}

export const apiClient = {
  get(path) {
    return request(path, { method: 'GET' });
  },
  post(path, body) {
    return request(path, { method: 'POST', body });
  },
  patch(path, body) {
    return request(path, { method: 'PATCH', body });
  },
  put(path, body) {
    return request(path, { method: 'PUT', body });
  },
  delete(path) {
    return request(path, { method: 'DELETE' });
  },
  upload(path, formData) {
    return request(path, { method: 'POST', body: formData, isFormData: true });
  },
  // File downloads require an Authorization header, so plain <img src>/<a href>
  // URLs won't carry credentials — fetch the bytes and hand back an object URL instead.
  async fetchFileObjectUrl(fileId) {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const res = await fetch(`${API_URL}/api/files/${fileId}/download`, { headers, credentials: 'include' });
    if (!res.ok) throw new ApiError(res.status, 'Failed to download file');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
