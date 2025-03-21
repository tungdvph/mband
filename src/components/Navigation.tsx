import Link from 'next/link';

const Navigation = () => {
  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Band Name
        </Link>
        <div className="space-x-4">
          <Link href="/members">Members</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/music">Music</Link>
          <Link href="/booking">Booking</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;