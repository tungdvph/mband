interface EventCardProps {
  title: string;
  date: Date;
  location: string;
  image: string;
  price: number;
  availableTickets: number;
}

const EventCard = ({ title, date, location, image, price, availableTickets }: EventCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-600 mt-2">
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-gray-600">{location}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-lg font-bold">${price}</span>
          <span className="text-sm text-gray-500">
            {availableTickets} tickets left
          </span>
        </div>
        <button className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default EventCard;