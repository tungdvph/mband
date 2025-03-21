import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();

        // Handle file upload first
        const file = formData.get('file') as File;
        let imageUrl = null;
        
        if (file?.size > 0) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            
            try {
                console.log('Uploading file:', file.name);
                
                const uploadRes: Response = await fetch('http://localhost:3000/api/upload', {
                    method: 'POST',
                    body: uploadData
                });
                
                console.log('Upload response status:', uploadRes.status);
                
                if (!uploadRes.ok) {
                    const errorData = await uploadRes.text();
                    console.error('Upload response error:', errorData);
                    throw new Error(`Upload failed: ${errorData}`);
                }

                const uploadResult = await uploadRes.json();
                console.log('Upload result:', uploadResult);
                
                if (!uploadResult.url) {
                    throw new Error('Upload response missing URL');
                }
                
                imageUrl = uploadResult.url;
                console.log('Final image URL:', imageUrl);
            } catch (error: any) {
                console.error('Upload error details:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
            }
        } else {
            console.log('No file received or file size is 0'); // Debug log
        }
        
        const memberData = {
            name: formData.get('name'),
            role: formData.get('role'),
            description: formData.get('description'),
            image: imageUrl, // This should be like "/uploads/members/filename.png"
            isActive: true,
            socialLinks: {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Saving member data:', memberData); // Debug log

        const result = await db.collection('members').insertOne(memberData);
        const savedMember = await db.collection('members').findOne({ _id: result.insertedId });
        
        if (!savedMember) {
            throw new Error('Failed to create member');
        }

        console.log('Saved member:', savedMember); // Debug log

        return NextResponse.json({ member: savedMember });

    } catch (error) {
        console.error('Create member error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Error creating member' 
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const members = await db.collection('members').find().toArray();
        
        // Transform each member to include default image if none exists
        const transformedMembers = members.map(member => ({
            ...member,
            image: member.image || '/default-member.png'
        }));
        
        return NextResponse.json(transformedMembers);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching members' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const result = await db.collection('members').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting member' }, { status: 500 });
    }
}