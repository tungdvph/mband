import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const updateData = {
      eventName: formData.get('title'),
      description: formData.get('description'),
      date: new Date(formData.get('date') as string),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      venue: {
        name: formData.get('venueName'),
        address: formData.get('venueAddress'),
        city: formData.get('venueCity')
      },
      type: formData.get('type'),
      status: formData.get('status')
    };

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const schedule = await Schedule.findById(params.id);

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await schedule.deleteOne();
    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting schedule' }, { status: 500 });
  }
}