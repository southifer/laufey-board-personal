import axios from "axios";

export const GetBotDetails = async (username: string, password: string) => {
  try {
    const response = await axios.get("https://api.laufey.my.id/view-bot-backup", {
      params: { username, password },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};