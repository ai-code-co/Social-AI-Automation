import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

const API = axios.create({
  baseURL: API_BASE_URL,
});

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
