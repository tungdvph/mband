export interface News {
  _id: string;
  title: string;
  content: string;
  image: string;
  author: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;
}