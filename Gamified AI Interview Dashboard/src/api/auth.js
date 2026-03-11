import API_BASE_URL from "./config";

export const registerUser = async (email, username, password, fullName) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      username,
      password,
      full_name: fullName,
    }),
  });

  if (!response.ok) {
    let errorMsg = "Registration failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // empty response body
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data; // { access_token, token_type, user_id }
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMsg = "Login failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // empty response body
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data; // { access_token, token_type, user_id }
};

export const getMe = async (token) => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorMsg = "Failed to fetch user";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // empty response body
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data;
};