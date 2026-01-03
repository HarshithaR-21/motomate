
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, MapPin, Shield, Zap, Wallet, Truck, User, Wrench, Building, Users, ShieldCheck, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: "Doorstep Vehicle Servicing",
    description: "Book car or bike servicing at your location. Our system automatically assigns the nearest available worker using real-time GPS.",
  },
  {
    icon: Shield,
    title: "Emergency SOS & Roadside Assistance",
    description: "Instant SOS alerts with roadside repair, towing support, and on-demand fuel delivery during breakdowns or emergencies.",
  },
  {
    icon: Truck,
    title: "Fleet Management",
    description: "Centralized dashboard for businesses to manage multiple vehicles, schedule bulk services, and track maintenance history.",
  },
  {
    icon: MapPin,
    title: "Real-Time GPS Tracking",
    description: "Track your service professional in real-time and get transparent updates on service progress and completion.",
  },
  {
    icon: Wallet,
    title: "Secure Digital Payments",
    description: "Seamless cashless transactions through UPI, wallets, and cards with complete digital invoices and records.",
  },
  {
    icon: Zap,
    title: "EV Servicing & Mobile Charging",
    description: "Doorstep electric vehicle maintenance and on-demand mobile charging services to reduce range anxiety.",
  },
];

const userRoles = [
  { icon: User, title: "Customer", description: "Book services, track progress, access emergency support" },
  { icon: Wrench, title: "Worker", description: "Accept jobs, navigate to locations, manage earnings" },
  { icon: Building, title: "Service Center Owner", description: "Manage business, workers, and service requests" },
  { icon: Users, title: "Fleet Manager", description: "Oversee multiple vehicles and bulk servicing" },
  { icon: ShieldCheck, title: "Admin", description: "Full platform control, analytics, and verification" },
];

const HomePage = () => {
  const [activeRole, setActiveRole] = useState(null);
  const sectionRef = useRef(null);
  const [highlight, setHighlight] = useState(false);
  const headingRef = useRef(null);
  const upliftTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCTAClick = () => {
    // Scroll to the roles section and briefly highlight/uplift the heading
    scrollToSection();
    setHighlight(true);
    if (upliftTimeoutRef.current) clearTimeout(upliftTimeoutRef.current);
    upliftTimeoutRef.current = setTimeout(() => setHighlight(false), 1200);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHighlight(true);
          // remove highlight after 2s
          setTimeout(() => setHighlight(false), 2000);
        }
      },
      { threshold: 0.5 } // trigger when 50% of section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
      if (upliftTimeoutRef.current) clearTimeout(upliftTimeoutRef.current);
    };
  }, []);

  const handleNavigation = (roleTitle) => {
    console.log("role: " + roleTitle);
    setActiveRole(activeRole === roleTitle ? null : roleTitle);

    // Convert role title → lowercase, replace spaces with hyphens
    const path = `/signup/${roleTitle.toLowerCase().replace(/\s+/g, "-")}`;
    navigate(path);
  };



  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-green-100 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-blue-50 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Car size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Moto<span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Mate</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Features</a>
            <a href="#roles" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">User Roles</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">About</a>
          </div>
          <button className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 font-medium">Smart Vehicle Service Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6 animate-slide-up">
              Your Vehicle,{' '}
              <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Serviced</span>
              <br />
              At Your Doorstep
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              MotoMate connects you with verified service professionals for doorstep vehicle maintenance,
              emergency roadside assistance, and comprehensive fleet management.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <button className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 group">
                Book a Service
                <ChevronRight size={20} />
              </button>
              <button className="bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-300 hover:bg-gray-200 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
            {[
              { value: "10K+", label: "Services Completed" },
              { value: "500+", label: "Verified Workers" },
              { value: "50+", label: "Service Centers" },
              { value: "4.9", label: "Average Rating" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need for seamless vehicle maintenance in one integrated platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" ref={sectionRef} className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              ref={headingRef}
              className={`text-4xl md:text-5xl font-bold mb-4 transform transition-all duration-500 ${highlight ? "text-green-600 animate-pulse -translate-y-2 scale-105" : "text-gray-900 translate-y-0 scale-100"
                }`}
              style={{ willChange: 'transform, color' }}
            >
              Choose Your{" "}
              <span className="bg-linear-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Role
              </span>
            </h2>

            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Sign up as a customer, worker, service center owner, fleet manager, or admin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {userRoles.map((role, idx) => (
              <button
                key={idx}
                onClick={() => handleNavigation(role.title)}
                className={`p-6 rounded-2xl border transition-all duration-300 text-left group ${activeRole === role.title
                  ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg'
                  : 'bg-white border-gray-200 hover:border-blue-300 text-gray-900'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${activeRole === role.title
                  ? 'bg-white/20'
                  : 'bg-blue-50 text-blue-600'
                  }`}>
                  <role.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                <p className={`text-sm ${activeRole === role.title ? 'text-white/80' : 'text-gray-600'
                  }`}>
                  {role.description}
                </p>
              </button>
            ))}
          </div>

          {/* Login/Signup CTA */}
          <div className="bg-white border border-gray-200 rounded-3xl p-10 md:p-14 text-center max-w-3xl mx-auto shadow-lg">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-8">
              Join MotoMate today and experience hassle-free vehicle servicing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleCTAClick} className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg">
                Sign Up Now
              </button>
              <Link to="/login"><button onClick={handleCTAClick} className="bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-300 hover:bg-gray-200 transition-colors">
                Login
              </button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 px-6 py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">MotoMate</span>?
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                MotoMate is a full-stack vehicle service and maintenance platform developed to address
                the limitations of traditional vehicle servicing systems. We eliminate long waiting times,
                lack of transparency, delayed responses, and poor communication.
              </p>
              <div className="space-y-4">
                {[
                  "GPS-based worker assignment for faster service",
                  "Real-time tracking and transparent pricing",
                  "Complete digital service history",
                  "Emergency SOS and roadside support",
                  "Fleet management for businesses",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-900 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-white border border-gray-200 p-8 flex items-center justify-center overflow-hidden shadow-lg">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 bg-blue-100 rounded-full opacity-20 blur-3xl animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                      <Car size={48} className="text-white" />
                      <div className="absolute w-full h-full rounded-2xl border-2 border-blue-300 scale-125" />
                    </div>
                  </div>
                  <div className="absolute top-8 right-8 w-16 h-16 bg-linear-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>
                    <MapPin size={24} />
                  </div>
                  <div className="absolute bottom-8 left-8 w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 border border-gray-300 animate-bounce" style={{ animationDelay: '2s' }}>
                    <Shield size={24} />
                  </div>
                  <div className="absolute bottom-8 right-12 w-12 h-12 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white animate-bounce" style={{ animationDelay: '3s' }}>
                    <Zap size={20} />
                  </div>
                  <div className="absolute top-12 left-12 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 animate-bounce" style={{ animationDelay: '1.5s' }}>
                    <Wallet size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MotoMate</span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              © 2025-26 MotoMate. Smart Vehicle Service Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
