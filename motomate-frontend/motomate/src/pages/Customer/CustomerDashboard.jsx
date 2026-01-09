import React from 'react';
import { motion } from 'framer-motion';
import { Car, History, Clock, User, TriangleAlert, UserCircle } from 'lucide-react'; // Using react-icons for icons
import Footer from '../../Components/Footer';
import Navigation from '../../Components/Navigation';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // Main options data
  const options = [
    {
      id: 1,
      title: 'Vehicle Services',
      description: 'Book and customize services for your vehicle.',
      icon: <Car className="text-blue-600 text-3xl" />,
      link: 'vehicle-services', // Placeholder link
    },
    {
      id: 2,
      title: 'Service History',
      description: 'View past services and maintenance records.',
      icon: <History className="text-blue-600 text-3xl" />,
      link: 'service-history',
    },
    {
      id: 3,
      title: 'Current Service Status',
      description: 'Check the status of your ongoing services.',
      icon: <Clock className="text-blue-600 text-3xl" />,
      link: 'current-status',
    },
    {
      id: 4,
      title: 'Customer Profile',
      description: 'Manage your profile and preferences.',
      icon: <User className="text-gray-600 text-3xl" />,
      link: 'profile',
    },
    {
      id: 5,
      title: 'Emergency SOS',
      description: 'Quick access to emergency assistance.',
      icon: <TriangleAlert className="text-red-500 text-3xl" />, // Red for emergency
      link: 'emergency-sos',
    },
  ];

  return (
    <div>
        <Navigation />
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-blue-600 text-white p-4 shadow-md"
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vehicle Servicing Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Customer</span>
            {/* <img
              src="https://via.placeholder.com/40" // Placeholder avatar
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-white"
            /> */}

                <UserCircle className="text-gray-200" size={32}/> 
            
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto p-6"
      >
        <h2 className="text-3xl font-semibold text-blue-800 mb-8 text-center">
          Your Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <motion.div
              key={option.id}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-blue-200 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => navigate(`/dashboard/customer/${option.link}`)} 
            >
              <div className="flex items-center mb-4">
                {option.icon}
                <h3 className="text-xl font-semibold text-blue-800 ml-4">
                  {option.title}
                </h3>
              </div>
              <p className="text-gray-600">{option.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Additional Section: Quick Stats or Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 bg-blue-50 p-6 rounded-lg shadow-md"
        >
          <h3 className="text-2xl font-semibold text-blue-800 mb-4">
            Quick Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">5</p>
              <p className="text-gray-600">Active Services</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-gray-600">Completed Services</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">2</p>
              <p className="text-gray-600">Pending Notifications</p>
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

export default CustomerDashboard;