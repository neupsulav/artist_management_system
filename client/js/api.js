const BASE_URL = "http://localhost:3000/api";

const api = {
  get: async (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return await handleResponse(response);
  },

  post: async (endpoint, body) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });
    return await handleResponse(response);
  },

  put: async (endpoint, body, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });
    return await handleResponse(response);
  },

  delete: async (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return await handleResponse(response);
  },

  importCSV: async (endpoint, csvData) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/csv",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: csvData,
    });
    return await handleResponse(response);
  },
};

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

window.api = api;
