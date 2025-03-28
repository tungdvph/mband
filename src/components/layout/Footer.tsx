import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Band Name</h3>
            <p className="text-gray-300">
              Professional music band available for events and performances.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/member" className="text-gray-300 hover:text-white">Members</Link></li>
              <li><Link href="/schedule" className="text-gray-300 hover:text-white">Schedule</Link></li>
              <li><Link href="/booking" className="text-gray-300 hover:text-white">Book Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: contact@bandname.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Address: Your City, Country</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-300">&copy; {new Date().getFullYear()} Band Name. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;