// --- AUTHENTICATION ---
export interface AuthResponse {
  token: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// --- ENUMS ---
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type GroupRole = 'LEADER' | 'MEMBER';

// --- TASK ---
export interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string; 
  creatAt?: string; 
  updatedAt?: string; 
  status: TaskStatus;
  priority: Priority;
  userId: number; // Người tạo (Owner)
  groupId?: number;

  // Mảng chứa danh sách người được giao việc
  assignees?: {
      userId: number;
      username: string;
  }[];
}

// --- WORK LOG (Mới) ---
export interface WorkLog {
    id: number;
    content: string;
    createdAt: string;
    reporterName: string; // Tên người báo cáo
    taskTitle?: string;   // Tên task (dùng cho báo cáo tổng hợp)
    taskId?: number;
}

// --- GROUP ---
export interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  myRole?: string;
  createdAt?: string;
}

// --- GROUP MEMBER ---
export interface GroupMember {
  userId: number;
  username: string;
  email: string;
  role: GroupRole;
}

// --- CHAT (Bổ sung cái này để sửa lỗi) ---
export interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    username: string;
  };
  group?: {
    id: number;
    name: string;
  };
}