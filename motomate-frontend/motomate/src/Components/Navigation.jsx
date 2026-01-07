import { Link } from "react-router-dom";
import { Car } from "lucide-react";

const Navigation = () => {
    return (
        <nav className="relative z-50 px-6 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Car size={24} className="text-white" />
                    </div>
                    <Link to={'/'}><span className="text-2xl font-bold text-gray-900 tracking-tight">
                        Moto<span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Mate</span>
                    </span></Link>
                </div>
            </div>
        </nav>
    )
};
export default Navigation;