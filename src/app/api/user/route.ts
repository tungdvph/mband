import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const formData = await request.formData();

        const userData = {
            username: formData.get('username')?.toString(),
            email: formData.get('email')?.toString(),
            password: formData.get('password')?.toString(),
            fullName: formData.get('fullName')?.toString(),
            role: formData.get('role')?.toString(),
            isActive: formData.get('isActive') === 'true',
            avatar: formData.get('avatar')?.toString() || '/default-avatar.png'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        return NextResponse.json({ 
            user: {
                ...savedUser.toObject(),
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
        await connectToDatabase();
        const users = await User.find().lean();
        
        const transformedUsers = users.map(user => ({
            ...user,
            avatar: user.avatar || '/default-avatar.png'
        }));
        
        return NextResponse.json(transformedUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}