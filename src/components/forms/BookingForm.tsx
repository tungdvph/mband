'use client';
import { useState } from 'react';

interface BookingFormProps {
  eventId: string;
  price: number;
  onSubmit: (data: any) => void;
}

const BookingForm = ({ eventId, price, onSubmit }: BookingFormProps) => {
  const [tickets, setTickets] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      eventId,
      tickets,
      totalPrice: price * tickets
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Number of Tickets
        </label>
        <input
          type="number"
          min="1"
          value={tickets}
          onChange={(e) => setTickets(parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <p className="text-sm text-gray-600">Price per ticket: ${price}</p>
        <p className="text-lg font-bold">Total: ${price * tickets}</p>
      </div>

      <button
        type="submit"
        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        Book Now
      </button>
    </form>
  );
};

export default BookingForm;