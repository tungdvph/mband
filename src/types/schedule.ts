export interface Venue {
  name: string;
  address: string; // Giả sử address là bắt buộc dựa trên model
  city: string;    // Giả sử city là bắt buộc dựa trên model
}

// Interface chính cho Schedule phía Client
export interface Schedule {
  _id: string;
  eventName: string;
  date: string;       // <-- Sửa thành string
  startTime: string;
  endTime?: string;
  venue: Venue;       // Sử dụng interface Venue ở trên
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other'; // Khớp với model
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';                  // Khớp với model
  price: number;      // <<< THÊM trường price
  createdAt: string;  // <-- Sửa thành string
  updatedAt: string;  // <-- Sửa thành string
}