import axios, { AxiosError } from 'axios';
import { config } from '../config';
import {
  AuthRequest,
  RegisterRequest,
  CreateRoomRequest,
  Room,
  DocumentVersion,
  ApiError
} from '../types';
import { isDevMode, getMockResponse, isDevAuthenticated, DEV_TOKEN } from '../utils/devUtils';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Don't redirect in dev mode if using dev token
      if (!isDevAuthenticated()) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Dev mode mock responses
const createDevResponse = <T>(data: T): Promise<{ data: T }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, 300); // Simulate network delay
  });
};

export const authService = {
  login: async (data: AuthRequest) => {
    // In dev mode, use mock response
    if (isDevMode) {
      localStorage.setItem('token', DEV_TOKEN);
      return { token: DEV_TOKEN, user: { username: data.username } };
    }

    const response = await api.post('/auth', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    // In dev mode, use mock response
    if (isDevMode) {
      localStorage.setItem('token', DEV_TOKEN);
      return { token: DEV_TOKEN, user: { username: data.username } };
    }

    const response = await api.post('/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    // In dev mode, just clear token
    if (isDevMode) {
      localStorage.removeItem('token');
      return;
    }

    await api.post('/logout');
    localStorage.removeItem('token');
  },

  getProfile: async () => {
    // In dev mode, use mock response
    if (isDevMode) {
      return { username: 'dev_user', email: 'dev@example.com', id: 1 };
    }

    const response = await api.get('/profile');
    return response.data;
  },
};

export const roomService = {
  create: async (data: CreateRoomRequest) => {
    // In dev mode, use mock response
    if (isDevMode) {
      const mockRoom = {
        guid: `room-${Date.now()}-dev`,
        name: data.name,
        created_at: new Date().toISOString(),
        owner_id: 1,
      };
      return mockRoom;
    }

    const response = await api.post('/rooms', data);
    return response.data;
  },

  list: async () => {
    // In dev mode, use mock response
    if (isDevMode) {
      return [
        {
          guid: 'room-1-dev',
          name: 'Development Room 1',
          created_at: new Date().toISOString(),
          owner_id: 1,
        },
        {
          guid: 'room-2-dev',
          name: 'Development Room 2',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          owner_id: 1,
        },
      ];
    }

    const response = await api.get('/rooms');
    return response.data as Room[];
  },

  delete: async (guid: string) => {
    // In dev mode, just return success
    if (isDevMode) {
      return;
    }

    await api.delete(`/rooms/${guid}`);
  },

  getVersions: async (guid: string) => {
    // In dev mode, use mock response
    if (isDevMode) {
      return [
        {
          version: 1,
          content: '// Initial version\nconsole.log("Hello, World!");',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          version: 2,
          content: '// Updated version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          version: 3,
          content: '// Latest version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");\nconsole.log("Testing collaborative editor!");',
          created_at: new Date().toISOString(),
        },
      ];
    }

    const response = await api.get(`/rooms/${guid}/versions`);
    return response.data as DocumentVersion[];
  },

  getVersion: async (guid: string, version: number) => {
    // In dev mode, use mock response
    if (isDevMode) {
      const mockVersions = [
        {
          version: 1,
          content: '// Initial version\nconsole.log("Hello, World!");',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          version: 2,
          content: '// Updated version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          version: 3,
          content: '// Latest version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");\nconsole.log("Testing collaborative editor!");',
          created_at: new Date().toISOString(),
        },
      ];
      return mockVersions.find(v => v.version === version) || mockVersions[2];
    }

    const response = await api.get(`/rooms/${guid}/versions/${version}`);
    return response.data as DocumentVersion;
  },

  createVersion: async (guid: string, content: string) => {
    // In dev mode, use mock response
    if (isDevMode) {
      const mockVersion = {
        version: Math.floor(Math.random() * 100) + 4,
        content: content,
        created_at: new Date().toISOString(),
      };
      return mockVersion;
    }

    const response = await api.post(`/rooms/${guid}/versions`, { content });
    return response.data as DocumentVersion;
  },
};

export default api;