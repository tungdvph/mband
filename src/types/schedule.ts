export interface Venue {
  name: string;
  address: string;
  city: string;
}

export interface Schedule {
  _id: string;
  eventName: string;
  date: Date;
  startTime: string;
  endTime?: string;
  venue: Venue;
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}