import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

interface UpdateUserData {
  username: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  fullName: FormDataEntryValue | null;
  role: FormDataEntryValue | null;
  isActive: boolean;
  avatar: FormDataEntryValue | null;
  updatedAt: Date;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const updateData: UpdateUserData = {
      username: formData.get('username'),
      email: formData.get('email'),
      fullName: formData.get('fullName'),
      role: formData.get('role'),
      isActive: formData.get('isActive') === 'true',
      avatar: formData.get('avatar'),
      updatedAt: new Date()
    };

    // Remove null or undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateUserData] === null || 
          updateData[key as keyof UpdateUserData] === undefined) {
        delete updateData[key as keyof UpdateUserData];
      }
    });

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    // Return updated user
    const updatedUser = await db.collection('users').findOne({ 
      _id: new ObjectId(params.id) 
    });

    return NextResponse.json({ 
      user: {
        ...updatedUser,
        avatar: updatedUser?.avatar || '/default-avatar.png'
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}