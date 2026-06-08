import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';
export const AUTH_TOKEN_KEY = 'social_ai_auth_token';
export const AUTH_USER_KEY = 'social_ai_auth_user';

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const saveAuthSession = ({ access_token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use(config => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && !requestUrl.startsWith('/auth/')) {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const fullUrl = `${API_BASE_URL}${url}`;
  const token = getStoredToken();
  if (!token) return fullUrl;

  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}access_token=${encodeURIComponent(token)}`;
};

export const registerUser = (data) =>
  API.post('/auth/register', data);

export const loginUser = (data) =>
  API.post('/auth/login', data);

export const getGoogleOAuthUrl = () =>
  API.get('/auth/google/oauth-url');

export const getCurrentUser = () =>
  API.get('/auth/me');

export const getPosts = (status, platform, brandId) =>
  API.get('/posts/', { params: { status, platform, brand_id: brandId } });

export const generatePost = (data) =>
  API.post('/posts/generate', data);

export const generateBatch = (brandId) =>
  API.post('/posts/generate-batch', null, { params: { brand_id: brandId } });

export const approvePost = (id) =>
  API.post(`/posts/${id}/approve`);

export const updatePost = (id, data) =>
  API.put(`/posts/${id}`, data);

export const approveAll = (brandId) =>
  API.post('/posts/approve-all', null, { params: { brand_id: brandId } });

export const pausePost = (id) =>
  API.post(`/posts/${id}/pause`);

export const resumePost = (id) =>
  API.post(`/posts/${id}/resume`);

export const deletePost = (id) =>
  API.delete(`/posts/${id}`);

export const getBrand = () =>
  API.get('/brand/');

export const saveBrand = (data) =>
  API.post('/brand/', data);

export const getBrands = () =>
  API.get('/brands/');

export const createBrand = (data) =>
  API.post('/brands/', data);

export const updateBrand = (id, data) =>
  API.put(`/brands/${id}`, data);

export const deleteBrand = (id) =>
  API.delete(`/brands/${id}`);

export const getSocialAccounts = (brandId) =>
  API.get('/social-accounts/', { params: { brand_id: brandId } });

export const saveSocialAccount = (data) =>
  API.post('/social-accounts/', data);

export const updateSocialAccount = (id, data) =>
  API.put(`/social-accounts/${id}`, data);

export const deleteSocialAccount = (id) =>
  API.delete(`/social-accounts/${id}`);

export const getMetaOAuthUrl = (brandId) =>
  API.get('/social-accounts/meta/oauth-url', { params: { brand_id: brandId } });

export const getInstagramOAuthUrl = (brandId) =>
  API.get('/social-accounts/instagram/oauth-url', { params: { brand_id: brandId } });

export const getLinkedInOAuthUrl = (brandId) =>
  API.get('/social-accounts/linkedin/oauth-url', { params: { brand_id: brandId } });

export const getXOAuthUrl = (brandId) =>
  API.get('/social-accounts/x/oauth-url', { params: { brand_id: brandId } });
