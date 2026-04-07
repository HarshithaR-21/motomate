import React from 'react';
import { STEPS } from '../constants';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const steps = STEPS;
    return (
        <div className="mb-8 overflow-x-auto">
            <div className="flex items-center min-w-max mx-auto px-2">
                {steps.map((label, i) => {
                    const num    = i + 1;
                    const done   = num < currentStep;
                    const active = num === currentStep;
                    return (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center shrink-0">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300
                                    ${done   ? 'bg-blue-600 text-white'
                                    : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                             : 'bg-slate-200 text-slate-400'}`}>
                                    {done ? '✓' : num}
                                </div>
                                <span className={`text-[9px] mt-1 font-medium hidden sm:block whitespace-nowrap
                                    ${active ? 'text-blue-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mb-4 mx-1 min-w-[16px] transition-all duration-300
                                    ${done ? 'bg-blue-500' : 'bg-slate-200'}`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressBar;
