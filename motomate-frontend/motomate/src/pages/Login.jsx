import { useState } from 'react';
import { Car, ChevronRight, Eye, EyeOff, User, Wrench, Building, Users, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RolesPage from '../Components/RolesPage';


const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error on change
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit =async (e) => {
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
            try{
                const response = await axios.post('http://localhost:8080/api/auth/login', formData, {withCredentials: true});
                console.log(response.data);
                toast.success("Login successful!"); 
                navigate(`/dashboard/${selectedRole.toLowerCase()}`);
            }
            catch(error)
            {
                console.log(error);
                console.error('Error response:', error.response?.data);
                toast.error('Login failed. Please try again.');
                return;
            }
           
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
        <>
            <Toaster position="top-right" />

            {/* Login Section */}
            <section className="relative z-10 px-6 pt-8 pb-6">
                
                    {!selectedRole ? (
                        <RolesPage setSelectedRole={setSelectedRole} />
                    ) : (
                        <>
                        <div className="max-w-4xl mx-auto">
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
                                Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
                            </p>
                            </div>
                        </>
                    )}
             
            </section>

        </>
    );
};

export default Login;