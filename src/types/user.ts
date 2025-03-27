export interface User {
  _id: string;
  username: string;  // Bỏ trường name
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
  avatar?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}