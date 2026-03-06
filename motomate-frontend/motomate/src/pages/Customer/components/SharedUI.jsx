import React from 'react';
import { CheckCircle } from 'lucide-react';

export const CardInput = ({ selected, onClick, children, className = '' }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 flex items-center justify-between
            ${selected
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
            ${className}`}
    >
        {children}
    </div>
);

export const ServiceCard = ({ service, selected, onClick }) => (
    <div
        onClick={() => onClick(service.id)}
        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all duration-200
            ${selected
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600'}`}
    >
        <div className={`mb-2 ${selected ? 'text-white' : 'text-blue-600'}`}>{service.icon}</div>
        <span className="font-medium text-sm">{service.label}</span>
        <span className={`text-xs mt-1 ${selected ? 'text-blue-100' : 'text-gray-500'}`}>₹{service.price}</span>
    </div>
);

export const SectionLabel = ({ children }) => (
    <label className="block text-sm font-bold text-slate-700 mb-3">{children}</label>
);

export const StepHeader = ({ title, subtitle }) => (
    <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 mt-1">{subtitle}</p>
    </div>
);
