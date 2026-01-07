import React from 'react';
import { Car } from "lucide-react";

const Footer = () => {
    return (
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
    )
};

export default Footer;