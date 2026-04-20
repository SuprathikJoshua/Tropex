import axios, { AxiosError, AxiosInstance } from "axios";

const API_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

const apiClient: AxiosInstance = axios.create({
	baseURL: API_URL,
	withCredentials: true,
	// timeout: 10000,
});

// Response interceptor for handling 401 and token refresh
apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config as any;

		// If 401 and not already retried, attempt token refresh
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// Attempt to refresh the token
				await apiClient.post("/auth/refresh");

				// Retry the original request
				return apiClient(originalRequest);
			} catch (refreshError) {
				// Refresh failed, redirect to login
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default apiClient;
