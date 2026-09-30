import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  // Successful response
  (response) => {
    return response;
  },

  // Failed response
  async (error) => {
    const originalRequest = error.config;

    // If access token expired
    // AND this wasn't already the /refresh request
    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/refresh"
    ) {
      try {
        // Ask backend for a new access token
        const response = await api.post("/refresh");

        const newAccessToken = response.data.access_token;

        // Save the new access token
        localStorage.setItem("access_token", newAccessToken);

        // Put new token into the original request
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token is also invalid/expired
        localStorage.removeItem("access_token");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;