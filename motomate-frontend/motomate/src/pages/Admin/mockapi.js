// ─────────────────────────────────────────────────────────────────
//  mockApi.js  –  Drop-in replacement for api.js during development
//  Every function matches the real api.js signature exactly.
//  Toggle between mock and real by changing the import in each page.
// ─────────────────────────────────────────────────────────────────

const delay = (ms = 600) => new Promise(r => setTimeout(r, ms));

// ── Helpers ───────────────────────────────────────────────────────
const paginate = (arr, page = 1, limit = 10) => ({
  data: arr.slice((page - 1) * limit, page * limit),
  total: arr.length,
});

const applyFilters = (arr, filters = {}) => {
  let result = [...arr];
  if (filters.status)   result = result.filter(i => !filters.status   || i.status?.toLowerCase()   === filters.status.toLowerCase());
  if (filters.category) result = result.filter(i => !filters.category || i.category?.toLowerCase() === filters.category.toLowerCase());
  if (filters.industry) result = result.filter(i => !filters.industry || i.industryType?.toLowerCase().includes(filters.industry.toLowerCase()));
  if (filters.serviceType) result = result.filter(i => !filters.serviceType || i.serviceType?.toLowerCase().includes(filters.serviceType.toLowerCase()));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(i =>
      Object.values(i).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
    );
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────
//  SEED DATA
// ─────────────────────────────────────────────────────────────────

const SERVICE_CENTERS = [
  {
    _id: 'sc001', centerName: 'Speedy Auto Works', centerType: 'Multi-Brand Service Center',
    ownerName: 'Ramesh Nair', email: 'ramesh@speedyauto.in', phone: '9876543210',
    address: '12, MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
    landmark: 'Opp. Forum Mall', website: 'https://speedyauto.in',
    description: 'Premium multi-brand service center specializing in sedans and SUVs.',
    services: ['General Servicing', 'Oil Change', 'Brake Repair', 'AC Repair'],
    vehicleTypes: ['Cars', 'SUVs'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    openTime: '09:00', closeTime: '20:00', emergencyService: true,
    gstNumber: '29ABCDE1234F1Z5', panNumber: 'ABCDE1234F', licenseNumber: 'KA-TRADE-2019-4521',
    yearsInBusiness: '8', totalBays: '12', status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Trade License.pdf', url: '#' }],
  },
  {
    _id: 'sc002', centerName: 'QuickFix Garage', centerType: 'Garage / Workshop',
    ownerName: 'Priya Sharma', email: 'priya@quickfix.in', phone: '9123456780',
    address: '88, Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002',
    landmark: 'Near Spencer Plaza', website: '',
    description: 'Fast-turnaround garage for bikes and small cars.',
    services: ['General Servicing', 'Oil Change', 'Tyre Replacement', 'Battery Service'],
    vehicleTypes: ['Cars', 'Bikes'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    openTime: '08:00', closeTime: '18:00', emergencyService: false,
    gstNumber: '33FGHIJ5678K1Z2', panNumber: 'FGHIJ5678K', licenseNumber: 'TN-TRADE-2021-8833',
    yearsInBusiness: '4', totalBays: '6', status: 'approved',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }],
  },
  {
    _id: 'sc003', centerName: 'EV Elite Service', centerType: 'EV Specialist',
    ownerName: 'Arjun Patel', email: 'arjun@evelite.in', phone: '9988776655',
    address: '5, SG Highway', city: 'Ahmedabad', state: 'Gujarat', pincode: '380054',
    landmark: 'Near ISKCON Temple',
    description: 'India\'s first dedicated EV servicing center on the highway corridor.',
    services: ['EV Servicing', 'Battery Service', 'General Servicing'],
    vehicleTypes: ['EVs'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    openTime: '07:00', closeTime: '22:00', emergencyService: true,
    gstNumber: '24PQRST9012U1Z8', panNumber: 'PQRST9012U', licenseNumber: 'GJ-TRADE-2022-1100',
    yearsInBusiness: '2', totalBays: '8', status: 'pending',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    documents: [],
  },
  {
    _id: 'sc004', centerName: 'AutoCare Plus', centerType: 'Authorized Service Center',
    ownerName: 'Vikram Reddy', email: 'vikram@autocareplus.in', phone: '9870123456',
    address: '22, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033',
    landmark: 'Near Road No. 36',
    description: 'Authorized Maruti Suzuki and Hyundai service center.',
    services: ['General Servicing', 'Engine Repair', 'Bodywork & Denting', 'Painting'],
    vehicleTypes: ['Cars'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    openTime: '09:00', closeTime: '19:00', emergencyService: false,
    gstNumber: '36UVWXY3456Z1Z3', panNumber: 'UVWXY3456Z', licenseNumber: 'TS-TRADE-2018-0092',
    yearsInBusiness: '12', totalBays: '20', status: 'rejected',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Authorization Letter.pdf', url: '#' }],
  },
  {
    _id: 'sc005', centerName: 'RoadMaster Workshop', centerType: 'Mobile Service Unit',
    ownerName: 'Sunita Joshi', email: 'sunita@roadmaster.in', phone: '9654321098',
    address: '3, Linking Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050',
    landmark: 'Bandra West',
    description: 'Mobile service unit covering South Mumbai and Bandra.',
    services: ['General Servicing', 'Oil Change', 'Emergency SOS', 'Fuel Delivery'],
    vehicleTypes: ['Cars', 'Bikes', 'EVs'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    openTime: '06:00', closeTime: '23:00', emergencyService: true,
    gstNumber: '27ABCXY1234A1Z9', panNumber: 'ABCXY1234A', licenseNumber: 'MH-TRADE-2023-5567',
    yearsInBusiness: '1', totalBays: '0', status: 'pending',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    documents: [],
  },
  {
    _id: 'sc006', centerName: 'TurboTech Garage', centerType: 'Multi-Brand Service Center',
    ownerName: 'Deepak Gupta', email: 'deepak@turbotech.in', phone: '9011223344',
    address: '77, Ring Road', city: 'Delhi', state: 'Delhi', pincode: '110044',
    landmark: 'Lajpat Nagar',
    description: 'Performance tuning and general servicing for premium cars.',
    services: ['General Servicing', 'Engine Repair', 'Transmission Repair', 'AC Repair'],
    vehicleTypes: ['Cars', 'SUVs'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    openTime: '10:00', closeTime: '20:00', emergencyService: false,
    gstNumber: '07DELHG5678H1Z1', panNumber: 'DELHG5678H', licenseNumber: 'DL-TRADE-2020-3341',
    yearsInBusiness: '6', totalBays: '10', status: 'approved',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Trade License.pdf', url: '#' }, { name: 'Shop Photo.jpg', url: '#' }],
  },
  {
    _id: 'sc007', centerName: 'Bike Doctor Pune', centerType: 'Garage / Workshop',
    ownerName: 'Kavitha Menon', email: 'kavitha@bikedoctor.in', phone: '9345678901',
    address: '14, FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004',
    landmark: 'Near Fergusson College',
    description: 'Specialist two-wheeler workshop handling all major brands.',
    services: ['General Servicing', 'Engine Repair', 'Tyre Replacement'],
    vehicleTypes: ['Bikes'], openDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    openTime: '09:00', closeTime: '18:00', emergencyService: false,
    gstNumber: '27MENON6789M1Z4', panNumber: 'MENON6789M', licenseNumber: 'MH-TRADE-2017-2211',
    yearsInBusiness: '10', totalBays: '4', status: 'approved',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }],
  },
];

const FLEET_MANAGERS = [
  {
    _id: 'fm001', companyName: 'Rapid Logistics Pvt Ltd', industryType: 'Logistics & Delivery',
    managerName: 'Suresh Kumar', designation: 'Operations Head',
    email: 'suresh@rapidlogistics.in', phone: '9871234560',
    companyAddress: '45, KIADB Industrial Area', city: 'Bengaluru', state: 'Karnataka', pincode: '560099',
    companyWebsite: 'https://rapidlogistics.in',
    companyDescription: 'Pan-India last-mile delivery fleet with 200+ vehicles.',
    totalVehicles: '220', vehicleCategories: ['Vans / Tempos', 'Pickup Trucks', 'Motorcycles'],
    serviceNeeds: ['Scheduled Maintenance', 'Tyre Management', 'Emergency Breakdown'],
    primaryGarage: 'Peenya, Bengaluru', preferredServiceTime: 'Early Morning (5AM–8AM)',
    hasDedicatedMechanic: true,
    gstNumber: '29RAPID1234F1Z5', panNumber: 'RAPID1234F', cinNumber: 'U63090KA2015PTC081234',
    altPhone: '9980001122', contactPersonAlt: 'Meena Pillai',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Company PAN.pdf', url: '#' }],
  },
  {
    _id: 'fm002', companyName: 'CityRide Cabs', industryType: 'Cab Aggregator / Taxi',
    managerName: 'Anita Desai', designation: 'Fleet Manager',
    email: 'anita@cityride.in', phone: '9765432100',
    companyAddress: '10, Karol Bagh', city: 'Delhi', state: 'Delhi', pincode: '110005',
    companyWebsite: 'https://cityride.in',
    companyDescription: 'Delhi NCR cab aggregator with 800 vehicles.',
    totalVehicles: '820', vehicleCategories: ['Sedans', 'SUVs', 'Hatchbacks'],
    serviceNeeds: ['Scheduled Maintenance', 'Battery Replacement', 'GPS & Telematics'],
    primaryGarage: 'Dwarka, Delhi', preferredServiceTime: 'Night (8PM–11PM)',
    hasDedicatedMechanic: true,
    gstNumber: '07CITY5678C1Z2', panNumber: 'CITY5678C', cinNumber: 'U60220DL2013PTC254321',
    altPhone: '9110002233', contactPersonAlt: 'Raj Malhotra',
    status: 'approved',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }],
  },
  {
    _id: 'fm003', companyName: 'GreenWheels Transport', industryType: 'Corporate Employee Transport',
    managerName: 'Nilesh Patil', designation: 'Transport Manager',
    email: 'nilesh@greenwheels.in', phone: '9823456709',
    companyAddress: '88, Hinjewadi IT Park', city: 'Pune', state: 'Maharashtra', pincode: '411057',
    companyDescription: 'IT park employee shuttle service with 100% EV fleet.',
    totalVehicles: '60', vehicleCategories: ['Buses / Minibuses', 'Electric Vehicles (EV)'],
    serviceNeeds: ['EV Servicing', 'Scheduled Maintenance', 'Driver Management'],
    primaryGarage: 'Hinjewadi Phase 3', preferredServiceTime: 'Morning (8AM–12PM)',
    hasDedicatedMechanic: false,
    gstNumber: '27GREEN3456G1Z7', panNumber: 'GREEN3456G', cinNumber: '',
    altPhone: '', contactPersonAlt: '',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    documents: [],
  },
  {
    _id: 'fm004', companyName: 'SkyTours & Travels', industryType: 'Tourism & Travel',
    managerName: 'Fatima Shaikh', designation: 'CEO',
    email: 'fatima@skytours.in', phone: '9654780123',
    companyAddress: '2, Marine Drive', city: 'Mumbai', state: 'Maharashtra', pincode: '400020',
    companyWebsite: 'https://skytours.in',
    companyDescription: 'Premium tourism fleet servicing Goa, Kerala and Maharashtra routes.',
    totalVehicles: '35', vehicleCategories: ['SUVs', 'Buses / Minibuses'],
    serviceNeeds: ['Scheduled Maintenance', 'Emergency Breakdown', 'Fuel Delivery'],
    primaryGarage: 'Andheri East, Mumbai', preferredServiceTime: 'Flexible',
    hasDedicatedMechanic: false,
    gstNumber: '27SKYTR7890S1Z3', panNumber: 'SKYTR7890S', cinNumber: '',
    altPhone: '9820003344', contactPersonAlt: 'Ravi Kapoor',
    status: 'rejected',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Authorization Letter.pdf', url: '#' }],
  },
  {
    _id: 'fm005', companyName: 'MedResponse Ambulance', industryType: 'Healthcare / Ambulance',
    managerName: 'Dr. Kiran Rao', designation: 'Operations Director',
    email: 'kiran@medresponse.in', phone: '9988001122',
    companyAddress: '33, Nampally', city: 'Hyderabad', state: 'Telangana', pincode: '500001',
    companyDescription: 'Emergency ambulance network covering Greater Hyderabad.',
    totalVehicles: '45', vehicleCategories: ['Vans / Tempos'],
    serviceNeeds: ['Emergency Breakdown', 'Scheduled Maintenance', 'Tyre Management'],
    primaryGarage: 'Nampally Depot, Hyderabad', preferredServiceTime: 'Early Morning (5AM–8AM)',
    hasDedicatedMechanic: true,
    gstNumber: '36MEDRE2345M1Z6', panNumber: 'MEDRE2345M', cinNumber: 'U85110TS2018NPL124567',
    altPhone: '9900112233', contactPersonAlt: 'Nurse Padma',
    status: 'approved',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    documents: [{ name: 'GST Certificate.pdf', url: '#' }, { name: 'Vehicle RC Book.pdf', url: '#' }],
  },
];

const QUERIES = [
  {
    _id: 'q001', ticketId: 'TKT-0001', subject: 'Service worker did not arrive on time',
    message: 'I booked a general servicing for 10 AM but the worker arrived at 12:30 PM with no prior notification. This is unacceptable. I had to reschedule my entire day.',
    userName: 'Rohit Verma', userEmail: 'rohit.verma@gmail.com', userPhone: '9876501234',
    category: 'Service', status: 'open',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Hi Rohit, we sincerely apologize for the delay. We are investigating this with the assigned worker and service center. We will update you within 24 hours.', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
      { sender: 'user', message: 'Please ensure this does not happen again. I would like a partial refund.', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
  },
  {
    _id: 'q002', ticketId: 'TKT-0002', subject: 'Unable to apply promo code MOTO20',
    message: 'I received an email about promo code MOTO20 but it is not working at checkout. It says "Invalid code" every time I try.',
    userName: 'Preethi Nambiar', userEmail: 'preethi.n@yahoo.com', userPhone: '9654321780',
    category: 'Billing', status: 'resolved',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Hi Preethi, the code MOTO20 is valid for new users only. Since you have used our platform before, this code does not apply. We have added a ₹150 credit to your wallet as compensation.', createdAt: new Date(Date.now() - 20 * 3600000).toISOString() },
    ],
  },
  {
    _id: 'q003', ticketId: 'TKT-0003', subject: 'App crashes during payment on Android 14',
    message: 'Whenever I reach the payment page and try to pay via UPI, the app crashes immediately. I am using Samsung Galaxy S23 with Android 14. Please fix this.',
    userName: 'Aryan Mehta', userEmail: 'aryan.m@hotmail.com', userPhone: '9012345678',
    category: 'Technical', status: 'open',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    replies: [],
  },
  {
    _id: 'q004', ticketId: 'TKT-0004', subject: 'Request to change registered email address',
    message: 'I want to change my email from old@email.com to new@email.com. I no longer have access to my old email.',
    userName: 'Sneha Pillai', userEmail: 'old@email.com', userPhone: '9870001234',
    category: 'Account', status: 'closed',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Hi Sneha, for security reasons we need you to verify your identity. Please visit the nearest MotoMate partner center with a valid ID to complete this change.', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { sender: 'user', message: 'Done, I visited the center. Email has been updated. Thank you.', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
  },
  {
    _id: 'q005', ticketId: 'TKT-0005', subject: 'Worker was rude and unprofessional',
    message: 'The assigned mechanic Raju (Worker ID W-2234) was extremely rude during the service. He argued with me when I pointed out some additional issues. I want action taken against him.',
    userName: 'Dilip Shetty', userEmail: 'dilip.shetty@gmail.com', userPhone: '9321456780',
    category: 'Service', status: 'open',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Dear Dilip, we take such feedback very seriously. This has been escalated to the Service Quality team and the worker\'s account has been temporarily suspended pending investigation.', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    ],
  },
  {
    _id: 'q006', ticketId: 'TKT-0006', subject: 'Overcharged for tyre replacement',
    message: 'I was quoted ₹1800 for two tyre replacements but was charged ₹2600 at the end without any explanation of the extra charges.',
    userName: 'Lakshmi Gopal', userEmail: 'lakshmi.g@gmail.com', userPhone: '9543219870',
    category: 'Billing', status: 'resolved',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Hi Lakshmi, we reviewed the invoice. The extra ₹800 was for wheel balancing which was added without your consent. We have issued a full refund of ₹800 to your original payment method.', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
  },
  {
    _id: 'q007', ticketId: 'TKT-0007', subject: 'How to schedule recurring service reminders?',
    message: 'I want to set up automatic reminders for every 3 months for my car service. Is there a feature for this in the app?',
    userName: 'Amit Shah', userEmail: 'amit.shah@gmail.com', userPhone: '9810234567',
    category: 'Other', status: 'resolved',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    replies: [
      { sender: 'admin', message: 'Hi Amit! Yes, you can set recurring reminders. Go to My Vehicles → Select Vehicle → Service Reminders → Set Schedule. You can choose monthly, quarterly or custom intervals.', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
  },
  {
    _id: 'q008', ticketId: 'TKT-0008', subject: 'GPS tracking not updating during service',
    message: 'The live tracking on the map was stuck at one location for the entire 2 hours of service. I could not see the worker\'s real location.',
    userName: 'Pooja Iyer', userEmail: 'pooja.iyer@gmail.com', userPhone: '9445678901',
    category: 'Technical', status: 'open',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    replies: [],
  },
];

const SERVICES = [
  {
    _id: 'svc001', bookingId: 'BK-20241201-001', serviceType: 'General Servicing',
    customerName: 'Harish Nair', customerPhone: '9876543210', customerEmail: 'harish.nair@gmail.com',
    location: 'Koramangala, Bengaluru',
    workerName: 'Suresh Mechanic', workerPhone: '9765432100', serviceCenterName: 'Speedy Auto Works',
    vehicleMake: 'Maruti Suzuki', vehicleModel: 'Swift', vehicleNumber: 'KA01AB1234', vehicleType: 'Car', vehicleYear: '2021',
    status: 'ongoing', scheduledAt: new Date(Date.now() - 90 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 80 * 60000).toISOString(), completedAt: null,
    amount: 2500, paymentStatus: 'pending', notes: 'Customer requested synthetic oil.',
  },
  {
    _id: 'svc002', bookingId: 'BK-20241201-002', serviceType: 'Battery Replacement',
    customerName: 'Meera Krishnan', customerPhone: '9654321789', customerEmail: 'meera.k@gmail.com',
    location: 'Anna Nagar, Chennai',
    workerName: 'Bala Mechanic', workerPhone: '9543210876', serviceCenterName: 'QuickFix Garage',
    vehicleMake: 'Honda', vehicleModel: 'City', vehicleNumber: 'TN09CD5678', vehicleType: 'Car', vehicleYear: '2019',
    status: 'ongoing', scheduledAt: new Date(Date.now() - 45 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 40 * 60000).toISOString(), completedAt: null,
    amount: 4200, paymentStatus: 'pending', notes: '',
  },
  {
    _id: 'svc003', bookingId: 'BK-20241130-003', serviceType: 'EV Servicing',
    customerName: 'Ravi Patel', customerPhone: '9898765432', customerEmail: 'ravi.p@gmail.com',
    location: 'Satellite, Ahmedabad',
    workerName: 'EV Specialist Rahul', workerPhone: '9787654321', serviceCenterName: 'EV Elite Service',
    vehicleMake: 'Tata', vehicleModel: 'Nexon EV', vehicleNumber: 'GJ01EF9012', vehicleType: 'EV', vehicleYear: '2023',
    status: 'completed', scheduledAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 86400000 + 30 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 86400000 + 150 * 60000).toISOString(),
    amount: 3800, paymentStatus: 'paid', notes: 'Battery health check + software update.',
  },
  {
    _id: 'svc004', bookingId: 'BK-20241130-004', serviceType: 'Emergency SOS - Breakdown',
    customerName: 'Divya Reddy', customerPhone: '9432109876', customerEmail: 'divya.r@gmail.com',
    location: 'ORR near Narsingi, Hyderabad',
    workerName: 'Emergency Response Team A', workerPhone: '9321098765', serviceCenterName: 'AutoCare Plus',
    vehicleMake: 'Hyundai', vehicleModel: 'Creta', vehicleNumber: 'TS07GH3456', vehicleType: 'Car', vehicleYear: '2022',
    status: 'completed', scheduledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    startedAt: new Date(Date.now() - 2 * 86400000 + 15 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 86400000 + 75 * 60000).toISOString(),
    amount: 1200, paymentStatus: 'paid', notes: 'Flat tyre replaced on-site.',
  },
  {
    _id: 'svc005', bookingId: 'BK-20241201-005', serviceType: 'Oil Change',
    customerName: 'Ajay Sharma', customerPhone: '9210987654', customerEmail: 'ajay.s@gmail.com',
    location: 'Bandra West, Mumbai',
    workerName: 'Prakash Yadav', workerPhone: '9109876543', serviceCenterName: 'RoadMaster Workshop',
    vehicleMake: 'Toyota', vehicleModel: 'Fortuner', vehicleNumber: 'MH02IJ7890', vehicleType: 'Car', vehicleYear: '2020',
    status: 'scheduled', scheduledAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    startedAt: null, completedAt: null,
    amount: 1800, paymentStatus: 'paid', notes: 'Premium full-synthetic 5W-30.',
  },
  {
    _id: 'svc006', bookingId: 'BK-20241129-006', serviceType: 'Brake Repair',
    customerName: 'Kavya Singh', customerPhone: '9098765432', customerEmail: 'kavya.s@gmail.com',
    location: 'Lajpat Nagar, Delhi',
    workerName: 'Mukesh Tiwari', workerPhone: '8987654321', serviceCenterName: 'TurboTech Garage',
    vehicleMake: 'Kia', vehicleModel: 'Seltos', vehicleNumber: 'DL8CKL1234', vehicleType: 'Car', vehicleYear: '2023',
    status: 'completed', scheduledAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    startedAt: new Date(Date.now() - 4 * 86400000 + 20 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 86400000 + 100 * 60000).toISOString(),
    amount: 3200, paymentStatus: 'paid', notes: 'Front and rear brake pads replaced.',
  },
  {
    _id: 'svc007', bookingId: 'BK-20241201-007', serviceType: 'Tyre Replacement',
    customerName: 'Suresh Bhat', customerPhone: '8876543210', customerEmail: 'suresh.b@gmail.com',
    location: 'FC Road, Pune',
    workerName: 'Ganesh Bike Expert', workerPhone: '8765432109', serviceCenterName: 'Bike Doctor Pune',
    vehicleMake: 'Royal Enfield', vehicleModel: 'Classic 350', vehicleNumber: 'MH12MN4567', vehicleType: 'Bike', vehicleYear: '2022',
    status: 'ongoing', scheduledAt: new Date(Date.now() - 60 * 60000).toISOString(),
    startedAt: new Date(Date.now() - 50 * 60000).toISOString(), completedAt: null,
    amount: 2200, paymentStatus: 'pending', notes: '',
  },
  {
    _id: 'svc008', bookingId: 'BK-20241201-008', serviceType: 'AC Repair',
    customerName: 'Nithya Raghavan', customerPhone: '8654321098', customerEmail: 'nithya.r@gmail.com',
    location: 'JP Nagar, Bengaluru',
    workerName: 'AC Specialist Kumar', workerPhone: '8543210987', serviceCenterName: 'Speedy Auto Works',
    vehicleMake: 'Mahindra', vehicleModel: 'XUV700', vehicleNumber: 'KA05PQ6789', vehicleType: 'Car', vehicleYear: '2023',
    status: 'cancelled', scheduledAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    startedAt: null, completedAt: null,
    amount: 0, paymentStatus: 'refunded', notes: 'Customer cancelled — rescheduled for next week.',
  },
];

const REPORTS = [
  {
    _id: 'rep001', reportId: 'RPT-2024-001', type: 'revenue',
    dateRangeLabel: 'Nov 1 – Nov 30, 2024', generatedBy: 'Admin',
    status: 'completed', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    fileSize: '245 KB', filename: 'revenue_nov_2024.pdf',
  },
  {
    _id: 'rep002', reportId: 'RPT-2024-002', type: 'services',
    dateRangeLabel: 'Oct 1 – Oct 31, 2024', generatedBy: 'Admin',
    status: 'completed', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    fileSize: '388 KB', filename: 'services_oct_2024.pdf',
  },
  {
    _id: 'rep003', reportId: 'RPT-2024-003', type: 'users',
    dateRangeLabel: 'Sep 1 – Sep 30, 2024', generatedBy: 'Admin',
    status: 'completed', createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    fileSize: '182 KB', filename: 'users_sep_2024.pdf',
  },
  {
    _id: 'rep004', reportId: 'RPT-2024-004', type: 'verifications',
    dateRangeLabel: 'Oct 1 – Nov 30, 2024', generatedBy: 'Admin',
    status: 'completed', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    fileSize: '97 KB', filename: 'verifications_oct_nov_2024.pdf',
  },
  {
    _id: 'rep005', reportId: 'RPT-2024-005', type: 'queries',
    dateRangeLabel: 'Nov 15 – Nov 30, 2024', generatedBy: 'Admin',
    status: 'processing', createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    fileSize: null, filename: null,
  },
];

// ── Generate chart data ───────────────────────────────────────────
const genDailyDates = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  }
  return dates;
};

const genRevenue = (days) =>
  genDailyDates(days).map(date => ({
    date,
    revenue: Math.floor(15000 + Math.random() * 45000),
    target: 35000,
  }));

const genServices = (days) =>
  genDailyDates(days).map(date => ({
    date,
    completed: Math.floor(8 + Math.random() * 22),
    cancelled: Math.floor(Math.random() * 4),
  }));

const genUserGrowth = (days) =>
  genDailyDates(days).map((date, i) => ({
    date,
    customers: 1200 + i * 12 + Math.floor(Math.random() * 20),
    workers:   320  + i * 3  + Math.floor(Math.random() * 5),
    partners:  80   + i * 1  + Math.floor(Math.random() * 3),
  }));

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 90 };

// ─────────────────────────────────────────────────────────────────
//  EXPORTED MOCK FUNCTIONS  (same signatures as api.js)
// ─────────────────────────────────────────────────────────────────

export const adminLogin = async ({ email, password }) => {
  await delay(800);
  if (email === 'admin@motomate.com' && password === 'admin123') {
    return { token: 'mock-token-xyz', admin: { name: 'Admin', email } };
  }
  throw new Error('Invalid email or password');
};

export const fetchDashboardStats = async () => {
  await delay(700);
  return {
    totalUsers: 14820,
    ongoingServices: 34,
    pendingVerifications: SERVICE_CENTERS.filter(s => s.status === 'pending').length + FLEET_MANAGERS.filter(f => f.status === 'pending').length,
    openQueries: QUERIES.filter(q => q.status === 'open').length,
    totalServiceCenters: SERVICE_CENTERS.filter(s => s.status === 'approved').length,
    pendingServiceCenters: SERVICE_CENTERS.filter(s => s.status === 'pending').length,
    totalFleetManagers: FLEET_MANAGERS.filter(f => f.status === 'approved').length,
    pendingFleetManagers: FLEET_MANAGERS.filter(f => f.status === 'pending').length,
    monthlyRevenue: 1247800,
    revenueGrowth: 18.4,
    totalCompleted: 10432,
    newUsersToday: 47,
    completedToday: 21,
    resolvedToday: 5,
    recentVerifications: [
      ...SERVICE_CENTERS.slice(0, 3).map(s => ({ _id: s._id, name: s.centerName, type: 'service-center', city: s.city, status: s.status })),
      ...FLEET_MANAGERS.slice(0, 2).map(f => ({ _id: f._id, name: f.companyName, type: 'fleet-manager', city: f.city, status: f.status })),
    ],
    recentQueries: QUERIES.slice(0, 4).map(q => ({ _id: q._id, subject: q.subject, userName: q.userName, status: q.status, createdAt: q.createdAt })),
    recentServices: SERVICES.slice(0, 4).map(s => ({ _id: s._id, serviceType: s.serviceType, customerName: s.customerName, workerName: s.workerName, status: s.status })),
    alerts: [
      { severity: 'high',   title: '3 Pending Verifications > 48hrs', message: 'Service center requests sc001, sc003, sc005 have been waiting over 2 days.' },
      { severity: 'medium', title: 'App crash reports on Android 14', message: '12 users reported payment page crashes. Engineering team notified.' },
      { severity: 'low',    title: 'Server response time elevated', message: 'API p95 latency is 320ms — above the 200ms threshold. Monitoring.' },
    ],
  };
};

export const fetchServiceCenterRequests = async (params = {}) => {
  await delay(500);
  const filtered = applyFilters(SERVICE_CENTERS, params);
  return paginate(filtered, Number(params.page) || 1, Number(params.limit) || 10);
};

export const fetchFleetManagerRequests = async (params = {}) => {
  await delay(500);
  const filtered = applyFilters(FLEET_MANAGERS, params);
  return paginate(filtered, Number(params.page) || 1, Number(params.limit) || 10);
};

export const approveVerification = async (type, id) => {
  await delay(800);
  const arr = type === 'service-centers' ? SERVICE_CENTERS : FLEET_MANAGERS;
  const item = arr.find(i => i._id === id);
  if (item) item.status = 'approved';
  return { success: true };
};

export const rejectVerification = async (type, id, reason) => {
  await delay(800);
  const arr = type === 'service-centers' ? SERVICE_CENTERS : FLEET_MANAGERS;
  const item = arr.find(i => i._id === id);
  if (item) { item.status = 'rejected'; item.rejectionReason = reason; }
  return { success: true };
};

export const fetchVerificationDetail = async (type, id) => {
  await delay(400);
  const arr = type === 'service-centers' ? SERVICE_CENTERS : FLEET_MANAGERS;
  const item = arr.find(i => i._id === id);
  if (!item) throw new Error('Record not found');
  return item;
};

export const fetchUserQueries = async (params = {}) => {
  await delay(500);
  const filtered = applyFilters(QUERIES, params);
  return paginate(filtered, Number(params.page) || 1, Number(params.limit) || 12);
};

export const fetchQueryDetail = async (id) => {
  await delay(400);
  const q = QUERIES.find(q => q._id === id);
  if (!q) throw new Error('Query not found');
  return q;
};

export const replyToQuery = async (id, message) => {
  await delay(700);
  const q = QUERIES.find(q => q._id === id);
  if (q) {
    q.replies = q.replies || [];
    q.replies.push({ sender: 'admin', message, createdAt: new Date().toISOString() });
    if (q.status === 'open') q.status = 'open'; // stays open until explicitly resolved
  }
  return { success: true };
};

export const updateQueryStatus = async (id, status) => {
  await delay(500);
  const q = QUERIES.find(q => q._id === id);
  if (q) q.status = status;
  return { success: true };
};

export const fetchOngoingServices = async (params = {}) => {
  await delay(500);
  const filtered = applyFilters(SERVICES, params);
  return paginate(filtered, Number(params.page) || 1, Number(params.limit) || 12);
};

export const fetchServiceDetail = async (id) => {
  await delay(400);
  const s = SERVICES.find(s => s._id === id);
  if (!s) throw new Error('Service not found');
  return s;
};

export const fetchAnalytics = async (range = '30d') => {
  await delay(600);
  return {
    totalRevenue: 1247800,
    totalServices: 10432,
    activeUsers: 8741,
    avgServiceValue: 2340,
    avgCompletionTime: 87,
    avgRating: 4.7,
    repeatRate: 64,
    sosRequests: 182,
    newServiceCenters: 7,
    evServices: 341,
  };
};

export const fetchRevenueChart = async (range = '30d') => {
  await delay(400);
  return { data: genRevenue(RANGE_DAYS[range] || 30) };
};

export const fetchServicesChart = async (range = '30d') => {
  await delay(400);
  return {
    data: genServices(RANGE_DAYS[range] || 30),
    byType: [
      { name: 'General Servicing', value: 3210, percent: '31%' },
      { name: 'Oil Change',        value: 2100, percent: '20%' },
      { name: 'Tyre Replacement',  value: 1540, percent: '15%' },
      { name: 'Battery Service',   value: 980,  percent: '9%' },
      { name: 'Emergency SOS',     value: 870,  percent: '8%' },
      { name: 'EV Servicing',      value: 341,  percent: '3%' },
      { name: 'Other',             value: 1391, percent: '13%' },
    ],
  };
};

export const fetchUserGrowthChart = async (range = '30d') => {
  await delay(400);
  return { data: genUserGrowth(RANGE_DAYS[range] || 30) };
};

export const fetchReports = async (params = {}) => {
  await delay(500);
  return paginate(REPORTS, Number(params.page) || 1, Number(params.limit) || 10);
};

export const generateReport = async (type, dateRange) => {
  await delay(1000);
  const newReport = {
    _id: `rep${Date.now()}`,
    reportId: `RPT-2024-${String(REPORTS.length + 1).padStart(3, '0')}`,
    type,
    dateRangeLabel: `${new Date(dateRange.from).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(dateRange.to).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    generatedBy: 'Admin',
    status: 'processing',
    createdAt: new Date().toISOString(),
    fileSize: null,
    filename: null,
  };
  REPORTS.unshift(newReport);
  // Simulate processing completing after 3 seconds
  setTimeout(() => {
    newReport.status = 'completed';
    newReport.fileSize = `${Math.floor(100 + Math.random() * 300)} KB`;
    newReport.filename = `${type}_report.pdf`;
  }, 3000);
  return { reportId: newReport._id, status: 'processing' };
};

export const downloadReport = async (id) => {
  await delay(500);
  return { url: '#', message: 'Download ready (mock)' };
};