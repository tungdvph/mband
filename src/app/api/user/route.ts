import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

interface UserData {
    username: string | null;
    email: string | null;
    fullName: string | null;
    role: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string | null;
    password?: string | null;
}

export async function POST(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();

        const userData = {
            username: formData.get('username') as string | null,
            email: formData.get('email') as string | null,
            password: formData.get('password') as string | null,
            fullName: formData.get('fullName') as string | null,
            role: formData.get('role') as string | null,
            isActive: formData.get('isActive') === 'true',
            avatar: formData.get('avatar') as string | null,
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
        // Sửa lại collection name thành "users"
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

export async function PUT(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updateData: Partial<UserData> = {
            username: formData.get('username')?.toString() || null,
            email: formData.get('email')?.toString() || null,
            fullName: formData.get('fullName')?.toString() || null,
            role: formData.get('role')?.toString() || null,
            isActive: formData.get('isActive') === 'true',
            avatar: formData.get('avatar')?.toString() || null,
            updatedAt: new Date()
        };

        // If password is provided, update it
        const password = formData.get('password')?.toString();
        if (password) {
            updateData.password = password;
        }

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                ...result,
                avatar: result.avatar || '/default-avatar.png'
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
    }
}