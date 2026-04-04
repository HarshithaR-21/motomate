import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

export default function Header() {

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
        <div>
            <Toaster />
            <header className="w-full bg-red-600 border-b border-red-100 shadow-sm">
                <div className="max-w-7xl py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700">
                                    Admin dashboard
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center">
                        <button className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>
        </div>
    );
}
