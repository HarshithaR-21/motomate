import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { User, Users, Wrench, Building, ShieldCheck } from "lucide-react";
import Navigation from "./Navigation";
import Footer from "./Footer";
const RolesPage = ({ setSelectedRole }) => {
    //const [selectedRole, setSelectedRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const userRoles = [
        { icon: User, title: "Customer", description: "Book services, track progress, access emergency support" },
        { icon: Wrench, title: "Worker", description: "Accept jobs, navigate to locations, manage earnings" },
        { icon: Building, title: "Service Center Owner", description: "Manage business, workers, and service requests" },
        { icon: Users, title: "Fleet Manager", description: "Oversee multiple vehicles and bulk servicing" },
        { icon: ShieldCheck, title: "Admin", description: "Full platform control, analytics, and verification" },
    ];

    const handleRoleSelect = (role) => {
        role = role.toLowerCase();
        if (typeof setSelectedRole === 'function') {
            setSelectedRole(role);
        }
        // Decide destination based on current URL (if user is on signup page)
        const isSignup = location.pathname.includes('/signup');
        const base = isSignup ? '/signup' : '/login';
        navigate(`${base}/${role}`);
    };
    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto ">
                    <div className="text-center mb-8 ">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Select Your <span className="bg-linear-to-r from-green-500 to-green-600 bg-clip-text text-transparent">Role</span>
                        </h1>
                        <p className="text-gray-600">Choose your role to proceed with login</p>
                    </div>

                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                        {userRoles.map((role, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleRoleSelect(role.title)}
                                className="p-6 rounded-2xl border transition-all duration-300 text-left group bg-white border-gray-200 hover:border-blue-300 text-gray-900"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600">
                                    <role.icon size={24} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {role.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}
export default RolesPage;