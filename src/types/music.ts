export interface Music {
  _id: string;
  title: string;
  description?: string;
  artist: string;
  image?: string;
  audio: string; // Thêm trường audio
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}