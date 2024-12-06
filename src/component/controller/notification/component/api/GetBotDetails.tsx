import { supabase } from "../../../../../lib/supabase";
import { useUser } from "../../../../../context/UserContext";

export const GetBotDetails = async () => {
  const { user } = useUser();
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("bot_backup")
      .eq("username", user?.username)
      .eq("password", user?.password);
    
    if (error) {
      throw error;
    }
    
    return data?.map((row: { bot_backup: string | object }) =>
      typeof row.bot_backup === "string" ? JSON.parse(row.bot_backup) : row.bot_backup
    ).flat();
  } catch (error) {
    console.error("Error fetching bot_backup data:", error);
    throw error;
  }
};