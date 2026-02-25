import axios from "axios";

export const createVolunteer = async (form, token) => {
  try {
    const { data } = await axios.post(
      "http://localhost:5000/api/volunteer/create",
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err) {
    console.error("Volunteer API Error:", err.response?.data || err);
    throw err;
  }
};
