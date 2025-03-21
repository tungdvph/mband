import { ObjectId } from 'mongodb';

export interface Member {
    _id: string | ObjectId; // Cho phép cả string và ObjectId
    name: string;
    role: string;
    description?: string;
    image?: string;
    isActive: boolean;
    socialLinks: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}