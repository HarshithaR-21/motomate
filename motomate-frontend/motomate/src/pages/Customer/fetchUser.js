import axios from "axios";
export const fetchUser = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/auth/me', { withCredentials: true });
        if (response.status === 200) {
            console.log('User data fetched:', response.data);
            return response.data;
        } else {
            toast.error('Failed to fetch user data. Please log in again.');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to fetch user data. Please log in again.');
    }
};