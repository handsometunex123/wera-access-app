import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-20 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-6 z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 leading-tight mb-2 drop-shadow-lg">
            Welcome to WERA Estate Management
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-4">
            WERA Estate is a modern, secure, and vibrant community. Our platform empowers residents, guests, and staff to manage access, security, and estate services with ease. Enjoy seamless digital entry codes, real-time notifications, visitor management, payment requests, and more—all in one place.
          </p>
          <ul className="list-disc pl-6 text-gray-800 text-base mb-4 space-y-1">
            <li>Digital access codes for residents & guests</li>
            <li>Visitor and delivery management</li>
            <li>Real-time notifications and alerts</li>
            <li>Profile and household management</li>
            <li>Support ticketing and communication</li>
            <li>Secure payment requests and audit logs</li>
            <li>Admin dashboard for estate oversight</li>
          </ul>
          <Link href="/auth">
            <button className="mt-4 px-8 py-3 bg-emerald-700 text-white rounded-lg font-bold text-lg shadow hover:bg-emerald-800 transition">
              Login to Your Account
            </button>
          </Link>
        </div>
        <div className="flex-1 flex justify-center items-center mt-10 md:mt-0">
          <div className="relative w-[420px] h-[340px] md:w-[520px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-100">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
              alt="WERA Estate Aerial View"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-900/80 to-transparent p-4">
              <span className="text-white text-lg font-semibold drop-shadow">Modern Living, Secure Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center p-6 rounded-xl shadow hover:shadow-lg transition">
            <Image src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80" alt="Access Control" width={80} height={80} className="rounded-full mb-4" />
            <h3 className="text-xl font-bold text-emerald-800 mb-2">Smart Access Control</h3>
            <p className="text-gray-700">Generate, share, and manage digital access codes for residents, guests, and deliveries. Enjoy secure, contactless entry and full control over your estate access.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl shadow hover:shadow-lg transition">
            <Image src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&q=80" alt="Community" width={80} height={80} className="rounded-full mb-4" />
            <h3 className="text-xl font-bold text-emerald-800 mb-2">Community & Support</h3>
            <p className="text-gray-700">Connect with estate management, raise support tickets, and stay updated with real-time notifications. Your voice matters in our thriving community.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl shadow hover:shadow-lg transition">
            <Image src="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80" alt="Payments" width={80} height={80} className="rounded-full mb-4" />
            <h3 className="text-xl font-bold text-emerald-800 mb-2">Payments & Transparency</h3>
            <p className="text-gray-700">Easily manage payment requests, view audit logs, and enjoy full transparency in all estate transactions. Security and trust are our top priorities.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-emerald-900 py-12 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to experience modern estate living?</h2>
        <Link href="/auth">
          <button className="px-8 py-3 bg-white text-emerald-900 font-bold rounded-lg text-lg shadow hover:bg-emerald-100 transition">
            Login to WERA Estate
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} WERA Estate. All rights reserved.
      </footer>
    </div>
  );
}
