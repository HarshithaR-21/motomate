import React from 'react';
import { Wrench, CalendarDays, AlertCircle, ShieldCheck, Zap, AlertTriangle, Star } from 'lucide-react';

// Vehicle type-specific brands
export const VEHICLE_BRANDS = {
    Car: [
        'Hyundai', 'Honda Cars', 'Toyota', 'Tata', 'Maruti Suzuki', 
        'Mahindra', 'Kia', 'MG', 'Skoda', 'Volkswagen', 
        'Renault', 'Nissan', 'Ford', 'Chevrolet', 'BMW',
        'Mercedes-Benz', 'Audi', 'Jaguar', 'Land Rover', 'Volvo'
    ],
    Bike: [
        'Honda Bikes', 'Yamaha', 'Bajaj', 'TVS', 'Royal Enfield',
        'KTM', 'Suzuki', 'Hero', 'Kawasaki', 'Ducati',
        'Benelli', 'Triumph', 'Harley-Davidson', 'Indian', 'BMW Motorrad'
    ]
};

// Vehicle models by brand (simplified for demo - can be expanded)
export const VEHICLE_MODELS = {
    'Hyundai': ['i20', 'Creta', 'Verna', 'Venue', 'Alcazar', 'Tucson'],
    'Honda Cars': ['City', 'Amaze', 'Civic', 'CR-V', 'HR-V'],
    'Toyota': ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Hilux'],
    'Tata': ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Punch'],
    'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Vitara Brezza', 'Ertiga'],
    'Mahindra': ['Thar', 'XUV700', 'Scorpio', 'XUV300', 'Bolero'],
    'Kia': ['Seltos', 'Sonet', 'Seltos', 'Carnival', 'EV6'],
    'MG': ['Hector', 'Astor', 'Gloster', 'ZS EV', 'Comet'],
    'Skoda': ['Octavia', 'Superb', 'Slavia', 'Kushaq', 'Kodiaq'],
    'Volkswagen': ['Polo', 'Vento', 'Taigun', 'Tiguan', 'Virtus'],
    'Renault': ['Kwid', 'Triber', 'Duster', 'Kiger', 'Captur'],
    'Nissan': ['Magnite', 'Kick', 'Sunny', 'Terrano', 'Leaf'],
    'Ford': ['EcoSport', 'Figo', 'Endeavour', 'Mustang', 'Aspire'],
    'Chevrolet': ['Beat', 'Sail', 'Cruze', 'Enjoy', 'Trailblazer'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
    'Audi': ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
    'Jaguar': ['XE', 'XF', 'F-Pace', 'F-Type', 'I-Pace'],
    'Land Rover': ['Range Rover', 'Discovery', 'Defender', 'Evoque', 'Velar'],
    'Volvo': ['XC40', 'XC60', 'XC90', 'S60', 'S90'],
    'Honda Bikes': ['Activa', 'Dio', 'Shine', 'Unicorn', 'CBR'],
    'Yamaha': ['MT-15', 'R15', 'FZ', 'Ray ZR', 'Fascino'],
    'Bajaj': ['Pulsar', 'Dominar', 'Avenger', 'CT 100', 'Platina'],
    'TVS': ['Apache', 'Jupiter', 'Sport', 'Radeon', 'Wego'],
    'Royal Enfield': ['Classic 350', 'Bullet 350', 'Himalayan', 'Interceptor', 'Meteor'],
    'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure'],
    'Suzuki': ['Gixxer', 'Access', 'Hayabusa', 'Burgman', 'V-Strom'],
    'Hero': ['Splendor', 'Passion', 'HF Deluxe', 'Glamour', 'Xpulse'],
    'Kawasaki': ['Ninja', 'Z900', 'Vulcan', 'Versys', 'KLR650'],
    'Ducati': ['Panigale', 'Monster', 'Multistrada', 'Diavel', 'Scrambler'],
    'Benelli': ['TNT', 'TRK', 'Leoncino', 'Imperiale', '502C'],
    'Triumph': ['Bonneville', 'Tiger', 'Street Triple', 'Daytona', 'Rocket'],
    'Harley-Davidson': ['Street 750', 'Iron 883', 'Fat Boy', 'Road King', 'Ultra Classic'],
    'Indian': ['Scout', 'Chief', 'Chieftain', 'Roadmaster', 'FTR'],
    'BMW Motorrad': ['G 310', 'S 1000', 'R 1250', 'K 1600', 'F 900']
};

// Fallback static services (used in Estimate & Confirm if no live services loaded yet)
export const SERVICE_OPTIONS = [
    { id: 'General Service',      label: 'General Service',      price: 500,  icon: <Wrench size={20} /> },
    { id: 'Periodic Maintenance', label: 'Periodic Maintenance', price: 800,  icon: <CalendarDays size={20} /> },
    { id: 'Oil Change',           label: 'Oil Change',           price: 300,  icon: <AlertCircle size={20} /> },
    { id: 'Brake Service',        label: 'Brake Service',        price: 600,  icon: <ShieldCheck size={20} /> },
    { id: 'Battery Issue',        label: 'Battery Issue',        price: 400,  icon: <Zap size={20} /> },
    { id: 'Tyre Issue',           label: 'Tyre Issue',           price: 250,  icon: <AlertTriangle size={20} /> },
    { id: 'Engine Check',         label: 'Engine Check',         price: 700,  icon: <Wrench size={20} /> },
    { id: 'Electrical Repair',    label: 'Electrical Repair',    price: 550,  icon: <Zap size={20} /> },
    { id: 'AC Service',           label: 'AC Service',           price: 450,  icon: <Star size={20} /> },
];

// New flow:
// 1 Vehicle → 2 Services → 3 Service Center → 4 Location → 5 Schedule → 6 Estimate → 7 Notes → 8 Confirm → 9 Done
export const STEPS = [
    'Vehicle',
    'Services',
    'Service Center',
    'Location',
    'Schedule',
    'Estimate',
    'Notes',
    'Confirm',
    'Done',
];

export const INITIAL_FORM = {
    userId:                 '',
    // User's registered address (for distance calculation in Step 3)
    userAddress:            { area: '', city: '', state: '', pinCode: '' },
    // Step 1 – Vehicle
    vehicleType:            '',
    selectedVehicle:        '',
    brand:                  '',
    model:                  '',
    fuelType:               '',
    vehicleNumber:          '',
    // Step 2 – Services (names only at this stage; IDs resolved after center picked)
    selectedServiceNames:   [],   // service name strings chosen in step 2
    // Step 3 – Service Center
    serviceCenterId:        '',   // ownerId of the selected center
    serviceCenterName:      '',
    // Step 3b – resolved service IDs after center is picked (sent to backend)
    selectedServices:       [],   // SCOService IDs from the chosen center
    selectedServiceObjects: [],   // full objects { id, name, price, durationMinutes }
    // Step 4 – Location
    serviceLocation:        '',
    manualAddress:          '',
    serviceMode:            '',
    // Step 5 – Schedule
    selectedDate:           '',
    selectedTime:           '',
    urgency:                'Normal',
    // Step 7 – Notes
    additionalNotes:        '',
    uploadedFiles:          [],
};
