// Dev utilities for development mode

export const isDevMode = process.env.NODE_ENV === 'development';

// Mock token for dev mode
export const DEV_TOKEN = 'dev-token-for-testing';

// Mock user data for dev mode
export const mockUser = {
  id: 1,
  username: 'dev_user',
  email: 'dev@example.com',
  created_at: new Date().toISOString(),
};

// Mock rooms data for dev mode
export const mockRooms: any[] = [
  {
    guid: 'room-1-dev',
    name: 'Development Room 1',
    created_at: new Date().toISOString(),
    owner_id: 1,
  },
  {
    guid: 'room-2-dev',
    name: 'Development Room 2',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    owner_id: 1,
  },
];

// Mock versions data for dev mode
export const mockVersions: any[] = [
  {
    version: 1,
    content: '// Initial version\nconsole.log("Hello, World!");',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    version: 2,
    content: '// Updated version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    version: 3,
    content: '// Latest version\nconsole.log("Hello, World!");\nconsole.log("Development mode!");\nconsole.log("Testing collaborative editor!");',
    created_at: new Date().toISOString(), // Now
  },
];

// Initialize dev mode
export const initDevMode = () => {
  if (!isDevMode) return;
  
  console.log('🚀 Development mode enabled');
  console.log('📝 Mock data available');
  console.log('🔑 Dev token:', DEV_TOKEN);
  
  // Set dev token if not already set
  if (!localStorage.getItem('token')) {
    localStorage.setItem('token', DEV_TOKEN);
  }
};

// Check if dev mode is active and token is set
export const isDevAuthenticated = () => {
  return isDevMode && localStorage.getItem('token') === DEV_TOKEN;
};

// Mock API responses for dev mode
export const getMockResponse = (endpoint: string) => {
  switch (endpoint) {
    case '/profile':
      return { data: mockUser };
    case '/rooms':
      return { data: mockRooms };
    case '/rooms/room-1-dev/versions':
      return { data: mockVersions };
    case '/rooms/room-1-dev/versions/3':
      return { data: mockVersions[2] };
    default:
      return { data: null };
  }
};