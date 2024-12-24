import axios from "axios";

export const GetBotDetails = async (serverList: string[]) => {
  try {
    const promises = serverList.map((server) =>
      axios.get(`http://${server}:8443/bot/get`)
        .catch((err) => {
          console.error(err);
          return null
        })
    );
    
    const responses = await Promise.all(promises);
    return responses;
    
  } catch (error) {
    console.error("Error fetching data:", error); // Better error logging
    throw error;
  }
};