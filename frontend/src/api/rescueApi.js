import axios from "./axios"; // your axios instance

// GET Rescue Dashboard stats
export const getDashboard = async (token) => {
  const res = await axios.get("/rescue/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// GET all missions
export const getMissions = async (token) => {
  const res = await axios.get("/rescue/missions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// CREATE a new mission
export const createMission = async (token, missionData) => {
  const res = await axios.post("/rescue/missions", missionData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
