import { useState } from 'react';
import { Car, ChevronRight, Eye, EyeOff, User, Wrench, Building, Users, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const userRoles = [
        { icon: User, title: "Customer", description: "Book services, track progress, access emergency support" },
        { icon: Wrench, title: "Worker", description: "Accept jobs, navigate to locations, manage earnings" },
        { icon: Building, title: "Service Center Owner", description: "Manage business, workers, and service requests" },
        { icon: Users, title: "Fleet Manager", description: "Oversee multiple vehicles and bulk servicing" },
        { icon: ShieldCheck, title: "Admin", description: "Full platform control, analytics, and verification" },
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        navigate(`/login/${role.toLowerCase()}`);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error on change
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Simulate successful login
            toast.success(`Logged in as ${selectedRole} successfully!`);
            // Reset form or redirect
            setFormData({
                email: '',
                password: '',
            });
            setSelectedRole(null);
        } else {
            toast.error('Please fix the errors below');
        }
    };

    const handleBack = () => {
        setSelectedRole(null);
        setFormData({
            email: '',
            password: '',
        });
        setErrors({});
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
            <Toaster position="top-right" />
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

            {/* Login Section */}
            <section className="relative z-10 px-6 py-24">
                <div className="max-w-4xl mx-auto">
                    {!selectedRole ? (
                        <>
                            <div className="text-center mb-8">
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
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    Login as <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{selectedRole}</span>
                                </h1>
                                <p className="text-gray-600">Welcome back! Please sign in to your account</p>
                                <button onClick={handleBack} className="mt-4 text-blue-600 hover:underline text-sm">Change Role</button>
                            </div>

                            <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
                                {/* Email */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? <EyeOff size={20} className="text-gray-400" /> : <Eye size={20} className="text-gray-400" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    Login
                                    <ChevronRight size={20} />
                                </button>
                            </form>

                            <p className="text-center mt-6 text-gray-600">
                                Don't have an account? <a href="#" className="text-blue-600 hover:underline">Sign Up</a>
                            </p>
                        </>
                    )}
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
                            © 2024 MotoMate. Smart Vehicle Service Platform. All rights reserved.
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

export default Login;