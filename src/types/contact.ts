export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;  // Thêm ? để làm field này optional
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;  // Thêm updatedAt
}