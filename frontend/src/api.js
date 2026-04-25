import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // Адрес твоего Django сервера
});

export const loginUser = async (email, password) => {
    try {
        const response = await api.post('/api/token/', {
            email: email,
            password: password
        });
        
        // Сохраняем токены в локальное хранилище браузера
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        console.log('Успешный вход!', response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при входе:', error.response?.data || error.message);
        throw error;
    }
};

export default api;