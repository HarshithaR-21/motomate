import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion"; // Added Framer Motion for animations
import { User, Users, Wrench, Building, ShieldCheck, Car, Star } from "lucide-react"; // Added more icons for visual appeal
import Navigation from "./Navigation";
import Footer from "./Footer";

const RolesPage = ({ setSelectedRole }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const userRoles = [
        { icon: User, title: "Customer", description: "Book services, track progress, access emergency support", color: "blue" },
        { icon: Wrench, title: "Worker", description: "Accept jobs, navigate to locations, manage earnings", color: "green" },
        { icon: Building, title: "Service Center Owner", description: "Manage business, workers, and service requests", color: "purple" },
        { icon: Users, title: "Fleet Manager", description: "Oversee multiple vehicles and bulk servicing", color: "orange" },
        { icon: ShieldCheck, title: "Admin", description: "Full platform control, analytics, and verification", color: "red" },
    ];

    const handleRoleSelect = (role) => {
        role = role.toLowerCase();
        if (typeof setSelectedRole === 'function') {
            setSelectedRole(role);
        }
        const roleSlug = role.toLowerCase().replace(/\s+/g, '-');
        const isSignup = location.pathname.includes('/signup');
        const base = isSignup ? '/signup' : '/login';
        // Pass the selected role in navigation state so the login/signup
        // page can initialize its local selectedRole immediately.
        navigate(`${base}/${roleSlug}`, { state: { selectedRole: role } });
    };

    // Animation variants
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

    return (
        <div>
            <Navigation/>
            <div className="min-h-screen bg-linear-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <Car className="absolute top-20 left-10 w-32 h-32 text-blue-300" />
                    <Wrench className="absolute bottom-20 right-10 w-24 h-24 text-green-300" />
                    <Building className="absolute top-1/2 left-1/4 w-20 h-20 text-purple-300" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Select Your <span className="bg-linear-to-r from-blue-500 to-green-600 bg-clip-text text-transparent">Role</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Join our vehicle servicing platform tailored for your needs. Whether you're a customer seeking top-notch service or a professional managing operations, we've got you covered.
                        </p>
                        {/* Quick stats or features */}
                        <div className="flex justify-center space-x-8 mb-8">
                            <div className="text-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                                    <Star className="text-blue-600" size={20} />
                                </div>
                                <p className="text-sm text-gray-600">Trusted by 10,000+ Users</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                                    <Car className="text-green-600" size={20} />
                                </div>
                                <p className="text-sm text-gray-600">500+ Service Centers</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                                    <ShieldCheck className="text-purple-600" size={20} />
                                </div>
                                <p className="text-sm text-gray-600">Secure & Reliable</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Roles Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12"
                    >
                        {userRoles.map((role, idx) => (
                            <motion.button
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRoleSelect(role.title)}
                                className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group bg-white border-gray-200 hover:border-${role.color}-300 hover:shadow-xl text-gray-900 relative overflow-hidden`}
                            >
                                {/* Subtle background gradient on hover */}
                                <div className={`absolute inset-0 bg-linear-to-br from-${role.color}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-${role.color}-50 text-${role.color}-600 group-hover:bg-${role.color}-100 transition-colors duration-300`}>
                                        <role.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 group-hover:text-gray-800">{role.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {role.description}
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Additional Content: Testimonials or Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-white rounded-2xl shadow-lg p-8 text-center"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
                        <p className="text-gray-600 mb-6">
                            Experience seamless vehicle servicing with our platform. From booking to completion, we ensure quality and convenience.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">24/7</p>
                                <p className="text-sm text-gray-600">Support</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">Fast</p>
                                <p className="text-sm text-gray-600">Service</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">Secure</p>
                                <p className="text-sm text-gray-600">Payments</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RolesPage;