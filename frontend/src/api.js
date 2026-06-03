import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

export const getPosts = (status, platform, brandId) =>
  API.get('/posts/', { params: { status, platform, brand_id: brandId } });

export const generatePost = (data) =>
  API.post('/posts/generate', data);

export const generateBatch = (brandId) =>
  API.post('/posts/generate-batch', null, { params: { brand_id: brandId } });

export const approvePost = (id) =>
  API.post(`/posts/${id}/approve`);

export const approveAll = (brandId) =>
  API.post('/posts/approve-all', null, { params: { brand_id: brandId } });

export const pausePost = (id) =>
  API.post(`/posts/${id}/pause`);

export const updatePost = (id, data) =>
  API.put(`/posts/${id}`, data);

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
