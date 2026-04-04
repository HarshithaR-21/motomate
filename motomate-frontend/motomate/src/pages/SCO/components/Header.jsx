import { Car } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

function Header() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            const response = await axios.post("http://localhost:8080/api/auth/logout", null, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status === 200) {
                toast.success("Logged out successfully!");
                setTimeout(() => {
                    navigate('/login');
                }, 500);
            } else {
                toast.error("Logout failed. Please try again.");
                console.error("Logout failed:", response);
            }
        } catch (error) {
            toast.error("Logout failed. Please try again.");
            console.error("Logout error:", error);
        }
    }
    return (
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-5 bg-purple-400 backdrop-blur-sm border-b border-gray-200">
            <Toaster />
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* LEFT */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-linear-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Car size={24} className="text-white" />
                    </div>

                    <Link to="/">
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">
                            Moto
                            <span className="bg-white bg-clip-text text-transparent">
                                Mate
                            </span>
                        </span>
                    </Link>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2">
                    <Link
                        to="/dashboard/service-center-owner"
                        className="px-3 py-1 rounded-3xl bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition cursor-pointer"
                    >
                        <div className="p-2 bg-white rounded-2xl">
                            Service center Dashboard
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-700 cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}
export default Header;