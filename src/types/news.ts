export interface News {
  _id: string;
  title: string;
  author: string;
  content: string;
  image?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}