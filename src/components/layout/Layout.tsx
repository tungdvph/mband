import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Band Name</h3>
              <p>Professional music band available for events and performances.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul>
                <li>About Us</li>
                <li>Schedule</li>
                <li>Book Us</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <p>Email: contact@bandname.com</p>
              <p>Phone: (123) 456-7890</p>
              <p>Address: Your City, Country</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <p>© {new Date().getFullYear()} Band Name. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;