'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/ui/EventCard';
import { Schedule } from '@/types/schedule';

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/schedule');
        if (response.ok) {
          const data = await response.json();
          // Lọc chỉ lấy các sự kiện concert và đã lên lịch
          const events = data.filter((schedule: Schedule) => 
            schedule.type === 'concert' && schedule.status === 'scheduled'
          );
          setSchedules(events);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Event Schedule</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {schedules.map((schedule) => (
              <EventCard
                key={schedule._id}
                title={schedule.eventName}
                date={new Date(schedule.date)}
                location={`${schedule.venue.name}, ${schedule.venue.city}`}
                description={schedule.description}
                startTime={schedule.startTime}
                endTime={schedule.endTime}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}