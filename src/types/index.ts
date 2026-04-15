export interface User {
  username: string;
}

export interface Room {
  guid: string;
  name: string;
  created_at: string;
}

export interface DocumentVersion {
  version: number;
  content: string;
  created_at: string;
}

export interface RoomVersion extends DocumentVersion {
  guid: string;
}

export interface ApiError {
  detail: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  password_confirm: string;
}

export interface CreateRoomRequest {
  name: string;
}