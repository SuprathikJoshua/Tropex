import axios from "axios";

const api = axios.create({
	baseURL: process.env.BACKEND_URL || "http://localhost:8000/api/v1",
	withCredentials: true,
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const original = error.config;

		if (error.response?.status === 401 && !original._retry) {
			original._retry = true;
		}
		try {
			await api.post("/auth/refresh");
			return api(original);
		} catch (error) {
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export default api;
