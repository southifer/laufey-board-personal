import React, { useCallback, memo } from "react";
import { ListCollapse } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../../../lib/supabase";
import { useUser } from "../../../../context/UserContext";

interface DialogComponentProps {
  details: {
    mac: string;
    rid: string;
  };
}

interface BotBackupProps {
  username: string;
  password: string;
  recovery: string;
  mac: string;
  rid: string;
  proxy: string;
  id: number;
  proxyCount: number;
  server: string;
}

const DialogComponent = ({ details }: DialogComponentProps) => {
  const { user } = useUser();
  
  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_data")
        .select("bot_backup")
        .eq("username", user?.username)
        .eq("password", user?.password);
      
      if (error) {
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        throw new Error("Bot backup data is not in the expected format.");
      }
      
      const botBackup = data
        .map((row: { bot_backup: string | object }) =>
          typeof row.bot_backup === "string" ? JSON.parse(row.bot_backup) : row.bot_backup
        )
        .flat();
      
      const findBot = botBackup.find(
        (item: BotBackupProps) => item.mac === details.mac && item.rid === details.rid
      );
      
      if (!findBot) {
        throw new Error("No matching bot found.");
      }
      
      return findBot;
    } catch (err) {
      console.error("Error loading data:", err);
      throw err instanceof Error ? err : new Error("Failed to load data.");
    }
  }, [user, details]);
  
  const handleOpenChange = useCallback(() => {
    Swal.fire({
      title: "Loading data...",
      text: "Please wait while we load the bot details.",
      showConfirmButton: false,
      allowOutsideClick: false,
      background: "#1a1a1a",
      customClass: {
        popup: "!border-2 !border-solid !border-secondary !bg-main",
        title: "!text-white",
        htmlContainer: "!text-white",
      },
      didOpen: () => {
        loadData()
          .then((botData) => {
            Swal.close();
            
            const botDetailsHtml = Object.entries(botData)
              .map(([key, value]) => `
                <div class="capitalize text-left mb-2">
                  <strong>${key}:</strong> ${value}
                </div>
              `)
              .join("");
            
            Swal.fire({
              html: `<div class="mt-4">${botDetailsHtml}</div>`,
              confirmButtonText: "Close",
              background: "#1a1a1a",
              customClass: {
                popup: "!border-2 !border-solid !border-secondary !bg-main",
                title: "!text-white",
                htmlContainer: "!text-white",
              },
            });
          })
          .catch((err) => {
            Swal.close();
            Swal.fire({
              title: "Error",
              text: err.message,
              icon: "error",
              confirmButtonText: "Close",
              background: "#1a1a1a",
              customClass: {
                popup: "!border-2 !border-solid !border-secondary !bg-main",
                title: "!text-white",
                htmlContainer: "!text-white",
              },
            });
          });
      },
    });
  }, [loadData]);
  
  return (
    <div>
      <div
        onClick={handleOpenChange}
        className="text-white font-medium rounded text-sm px-5 py-2.5 hover:bg-white cursor-pointer"
      >
        <ListCollapse className="w-5 h-5 hover:text-main" />
      </div>
    </div>
  );
};

export default memo(DialogComponent);