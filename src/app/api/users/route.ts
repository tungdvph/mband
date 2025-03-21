import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface UserData {
    username: FormDataEntryValue | null;
    email: FormDataEntryValue | null;
    fullName: FormDataEntryValue | null;
    role: FormDataEntryValue | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string;
}

export async function POST(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();

        // Handle file upload first
        const file = formData.get('file') as File;
        let avatarUrl = formData.get('avatar') as string;  // Get avatar URL if already uploaded
        
        if (file?.size > 0) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            
            const uploadRes = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: uploadData
            });
            
            if (!uploadRes.ok) {
                throw new Error('Failed to upload avatar');
            }
            
            const data = await uploadRes.json();
            avatarUrl = data.url;
        }

        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            role: formData.get('role'),
            isActive: true,
            avatar: avatarUrl || null,  // Use uploaded URL or null
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(userData);
        const savedUser = await db.collection('users').findOne({ _id: result.insertedId });
        
        if (!savedUser) {
            throw new Error('Failed to create user');
        }

        return NextResponse.json({ 
            user: {
                ...savedUser,
                avatar: savedUser.avatar || '/default-avatar.png'
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const users = await db.collection('users').find().toArray();
        
        // Transform each user to include default avatar if none exists
        const transformedUsers = users.map(user => ({
            ...user,
            avatar: user.avatar || '/default-avatar.png'
        }));
        
        return NextResponse.json(transformedUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}