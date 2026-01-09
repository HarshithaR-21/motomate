import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Truck, 
  Anchor, 
  Fuel, 
  Battery, 
  CreditCard,
  ChevronRight
} from 'lucide-react'; // Using lucide-react for icons
import Footer from '../../Components/Footer';
import Navigation from '../../Components/Navigation';
import { useNavigate } from 'react-router-dom';

const VehicleServices = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // Services data
  const services = [
    {
      id: 1,
      title: 'Book Service (Car / Bike)',
      description: 'Schedule maintenance or repairs for your vehicle with ease.',
      icon: <Calendar className="text-blue-600 text-4xl" />,
      action: 'Book Now',
      link: 'book-service',
      bgColor: 'bg-blue-50',
    },
    {
      id: 2,
      title: 'Live Service Tracking',
      description: 'Monitor your service in real-time from anywhere.',
      icon: <MapPin className="text-blue-600 text-4xl" />,
      action: 'Track Now',
      link: 'live-tracking',
      bgColor: 'bg-green-50',
    },
    {
      id: 3,
      title: 'Service History & Invoices',
      description: 'View past services and download invoices effortlessly.',
      icon: <FileText className="text-blue-600 text-4xl" />,
      action: 'View History',
      link: 'service-history',
      bgColor: 'bg-purple-50',
    },
    {
      id: 4,
      title: 'Emergency Assistance (SOS)',
      description: 'Get immediate help in emergencies, available 24/7.',
      icon: <AlertTriangle className="text-red-500 text-4xl" />,
      action: 'Call SOS',
      link: 'emergency-sos',
      bgColor: 'bg-red-50',
    },
    {
      id: 5,
      title: 'Roadside Assistance',
      description: 'On-the-spot help for breakdowns and minor issues.',
      icon: <Truck className="text-blue-600 text-4xl" />,
      action: 'Request Help',
      link: 'roadside-assistance',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 6,
      title: 'Towing',
      description: 'Arrange towing services to a service center quickly.',
      icon: <Anchor className="text-blue-600 text-4xl" />,
      action: 'Tow Now',
      link: 'towing',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 7,
      title: 'Fuel Delivery',
      description: 'Get fuel delivered to your location on demand.',
      icon: <Fuel className="text-blue-600 text-4xl" />,
      action: 'Order Fuel',
      link: 'fuel-delivery',
      bgColor: 'bg-orange-50',
    },
    {
      id: 8,
      title: 'Battery Jump-Start / Flat Tyre Help',
      description: 'Quick fixes for battery or tyre issues.',
      icon: <Battery className="text-blue-600 text-4xl" />,
      action: 'Get Help',
      link: 'battery-tyre-help',
      bgColor: 'bg-teal-50',
    },
    {
      id: 9,
      title: 'Payments & Billing',
      description: 'Manage payments and view bills securely.',
      icon: <CreditCard className="text-blue-600 text-4xl" />,
      action: 'View Bills',
      link: 'payments-billing',
      bgColor: 'bg-pink-50',
    },
  ];
  const navigate = useNavigate();
  const handleServiceClick = (link) => {
    navigate(`/dashboard/customer/vehicle-services/${link}`);
  };

  return (
    <div>
    <Navigation />
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className=" bg-blue-50 shadow-sm border-b border-blue-100"
      >
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Vehicle Services</h1>
          <p className="text-gray-600 text-lg">Explore and access all available services for your vehicle. Choose what you need and get started instantly.</p>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 py-12"
      >
        {/* Intro Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How Can We Help You Today?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">From booking services to emergency assistance, we've got everything covered to keep your vehicle running smoothly.</p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="border border-gray-200 rounded-xl shadow-sm p-8 cursor-pointer hover:shadow-lg transition-all duration-300 group"
              onClick={() => handleServiceClick(service.link)}
            >
              <div className={`${service.bgColor} flex flex-col items-center text-center mb-6 rounded-2xl p-6`}>
                <div className="mb-4 p-3 rounded-full bg-white shadow-sm">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center group-hover:bg-blue-700">
                {service.action}
                <ChevronRight className="ml-2 text-sm" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Additional Section: Service Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-20 bg-white rounded-xl shadow-sm p-8 border border-gray-200"
        >
          <h3 className="text-2xl font-semibold text-blue-800 mb-6 text-center">Service Tips & Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Maintenance</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Book services in advance to avoid long waits.</li>
                <li>Regular check-ups can prevent major issues.</li>
                <li>Use live tracking to stay updated on your service status.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Emergency</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                <li>Emergency SOS is available 24/7 for critical situations.</li>
                <li>Keep your contact details updated for faster assistance.</li>
                <li>Payments can be made securely via multiple methods.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <Footer />
      </div>
    </div>
  );
};

export default VehicleServices;