export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}