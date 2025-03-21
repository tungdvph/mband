'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/ui/EventCard';

interface Event {
  _id: string;
  title: string;
  date: Date;
  location: string;
  image: string;
  price: number;
  availableTickets: number;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/schedule');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Event Schedule</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard
                key={event._id}
                title={event.title}
                date={new Date(event.date)}
                location={event.location}
                image={event.image}
                price={event.price}
                availableTickets={event.availableTickets}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}