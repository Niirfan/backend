import axios from 'axios';

const api = axios.create({
    baseURL: 'https://pavestone-hexagram-emphasize.ngrok-free.dev', // เช็กให้ชัวร์ว่าตรงกับที่ Backend ของคุณรันอยู่
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;