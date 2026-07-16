import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Normalize endpoints to include trailing slash if they represent collection roots
  if (config.url) {
    const urlParts = config.url.split('?');
    let path = urlParts[0];
    const query = urlParts[1] ? `?${urlParts[1]}` : '';
    
    // Append trailing slash to root collection endpoints to avoid FastAPI 307 redirects
    const endpointsToSlash = [
      '/doctors',
      '/patients',
      '/nurses',
      '/emergency',
      '/hospitals'
    ];
    
    if (endpointsToSlash.includes(path)) {
      path += '/';
    }
    
    config.url = path + query;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getHospitalsMap = async () => {
  const response = await apiClient.get('/hospitals/map');
  return response.data;
};

export const getHospitalDoctors = async () => {
  const response = await apiClient.get('/hospital-admin/doctors');
  return response.data;
};

export const getHospitalPatients = async () => {
  const response = await apiClient.get('/hospital-admin/patients');
  return response.data;
};

export const getHospitalICUBeds = async () => {
  const response = await apiClient.get('/hospital-admin/icu-beds');
  return response.data;
};

export const getHospitalOperatingRooms = async () => {
  const response = await apiClient.get('/hospital-admin/operating-rooms');
  return response.data;
};

export const getHospitalAmbulances = async () => {
  const response = await apiClient.get('/hospital-admin/ambulances');
  return response.data;
};

