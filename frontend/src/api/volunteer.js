import api from "./axios";

export const createVolunteerProfile = async (form) => {
  const { data } = await api.post("/volunteer/create", form);
  return data;
};
