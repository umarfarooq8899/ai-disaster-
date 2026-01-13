import axios from "./client"; // your axios instance

// Create volunteer profile
export const createVolunteer = async (form, token) => {
  try {
    const { data } = await axios.post("/volunteer/create", form, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (err) {
    return {
      success: false,
      message: err?.response?.data?.message || "Failed to create volunteer profile",
    };
  }
};

// Get logged-in volunteer profile
export const getMyVolunteerProfile = async (token) => {
  try {
    const { data } = await axios.get("/volunteer/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (err) {
    return {
      success: false,
      message: err?.response?.data?.message || "Failed to fetch volunteer profile",
    };
  }
};
