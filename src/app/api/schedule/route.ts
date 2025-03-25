import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToDatabase();
    const schedules = await Schedule.find().sort({ date: -1 });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error fetching schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const scheduleData = {
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
      status: formData.get('status') || 'scheduled'
    };
    
    const schedule = new Schedule(scheduleData);
    const savedSchedule = await schedule.save();
    return NextResponse.json({ schedule: savedSchedule });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating schedule' }, { status: 500 });
  }
}