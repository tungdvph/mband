export interface Schedule {
  _id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  type: 'show' | 'practice' | 'meeting' | 'other';
  participants: string[];  // Member IDs
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
}