// /types/schedule.ts

// Interface cho địa điểm phía Client
export interface Venue {
  name: string;
  address: string;
  city: string;
}

// Interface chính cho Schedule phía Client
export interface Schedule {
  _id: string; // _id thường là string ở client
  eventName: string;
  date: string;      // Ngày tháng là string sau khi serialize từ API
  startTime: string;
  endTime?: string;
  venue: Venue;      // Sử dụng interface Venue ở trên
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  price?: number;
  createdAt: string; // Ngày tháng là string sau khi serialize từ API
  updatedAt: string; // Ngày tháng là string sau khi serialize từ API
}
