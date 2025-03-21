'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import BookingForm from '@/components/forms/BookingForm';

interface Event {
  _id: string;
  title: string;
  date: Date;
  location: string;
  price: number;
  availableTickets: number;
}

export default function BookingPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/schedule?available=true');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          if (data.length > 0) {
            setSelectedEvent(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleBooking = async (data: any) => {
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Booking successful!');
      } else {
        alert('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Error making booking:', error);
      alert('Error making booking. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Book an Event</h1>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : events.length > 0 ? (
            <>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event
                </label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  onChange={(e) => {
                    const event = events.find(evt => evt._id === e.target.value);
                    setSelectedEvent(event || null);
                  }}
                >
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEvent && (
                <BookingForm
                  eventId={selectedEvent._id}
                  price={selectedEvent.price}
                  onSubmit={handleBooking}
                />
              )}
            </>
          ) : (
            <p className="text-center text-gray-600">No events available for booking.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}