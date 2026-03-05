import { useState, useEffect } from 'react';
import { Car, ChevronRight, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios'
import Navigation from '../../Components/Navigation';
import Footer from '../../Components/Footer';
import LocationSelector from '../../Components/LocationSelector';

const CustomerSignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        area: '',
        city: '',
        state: '',
        pinCode: '',
        role: '',
        password: '',
        confirmPassword: '',
    });

    const { role } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (role) {
            setFormData(prev => ({ ...prev, role: role.toLowerCase() }));
        }
    }, [role]);

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error on change
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return { minLength, hasUpper, hasLower, hasNumber, hasSpecial };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address';
        }


        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be 10 digits';
        }

        // Address validations
        if (!formData.area.trim()) {
            newErrors.area = 'Area is required';
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }
        if (!formData.pinCode.trim()) {
            newErrors.pinCode = 'Pin code is required';
        } else if (!/^\d{6}$/.test(formData.pinCode)) {
            newErrors.pinCode = 'Pin code must be 6 digits';
        }

        // Password validation
        const passwordValidation = validatePassword(formData.password);
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!passwordValidation.minLength) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!passwordValidation.hasUpper || !passwordValidation.hasLower || !passwordValidation.hasNumber || !passwordValidation.hasSpecial) {
            newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
        }

        // Confirm password
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                // Prepare payload with only fields expected by backend
                const payload = {
                    ...formData,
                    role: formData.role.toUpperCase()
                };
                delete payload.confirmPassword; // Remove confirmPassword as backend doesn't need it
                console.log("Submitting payload:", payload);
                const response = await axios.post(
                    'http://localhost:8080/api/auth/signup',
                    payload,
                    { withCredentials: true }
                );

                toast.success('Account created successfully!');
                console.log(response.data);

                setTimeout(() => { navigate(`/login/${role}`), 1500 });
                // Reset form
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    area: '',
                    city: '',
                    state: '',
                    pinCode: '',
                    role: role || '',
                    password: '',
                    confirmPassword: '',
                });

            } catch (error) {
                console.log(error);
                console.log(error.response?.data); // Log backend error
                toast.error(error.response?.data?.error || "Signup failed. Please try again.");
            }
        }
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
            <Navigation />

            {/* Sign Up Section */}
            <section className="relative z-10 px-6 py-24">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Sign Up for <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">MotoMate</span>
                        </h1>
                        <p className="text-gray-600">Create your account to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
                        {/* Name */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your full name"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                        </div>


                        {/* Phone */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your phone number"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        {/* Address */}
                        <LocationSelector formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />
                        {/* Password */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Create a password"
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

                        {/* Confirm Password */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} className="text-gray-400" /> : <Eye size={20} className="text-gray-400" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            Sign Up
                            <ChevronRight size={20} />
                        </button>
                        {/* <div className='text-center text-gray-600 underline mt-4 mb-4'>or</div>
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={() => toast('Google Sign-Up clicked')}
                                className="w-full border border-gray-300 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3"
                            >
                                <img
                                    src="https://developers.google.com/identity/images/g-logo.png"
                                    alt="Google"
                                    className="w-5 h-5"
                                />
                                Sign up with Google
                            </button>
                        </div> */}


                    </form>

                    <p className="text-center mt-6 text-gray-600">
                        Already have an account? <Link to={role ? `/login/${role.toLowerCase()}` : "/login"} className="text-blue-600 hover:underline">Login</Link>
                    </p>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default CustomerSignUp;