import React, { useCallback, memo } from "react";
import { ListCollapse } from "lucide-react";
import { GetBotDetails } from "./api/GetBotDetails";
import Swal from "sweetalert2";

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

  const loadData = useCallback(async () => {
    try {
      const response = await GetBotDetails("admin", "admin");
      
      if (!response.success) {
        throw new Error(response.message || "Failed to load data.");
      }
      
      if (!Array.isArray(response.botBackup)) {
        throw new Error("Bot backup data is not in the expected format.");
      }
      
      const findBot = response.botBackup.find(
        (item: BotBackupProps) => item.mac === details.mac && item.rid === details.rid
      );
      
      console.table(findBot);
      
      if (!findBot) {
        throw new Error("No matching bot found.");
      }
      
      return findBot;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to load data.");
    }
  }, [details.mac, details.rid]);
  
  const handleOpenChange = useCallback(() => {
    Swal.fire({
      title: 'Loading data...',
      text: 'Please wait while we load the bot details.',
      showConfirmButton: false,
      allowOutsideClick: false,
      background: '#1a1a1a',
      customClass: {
        popup: '!border-2 !border-solid !border-secondary !bg-main',
        title: '!text-white',
        htmlContainer: '!text-white',
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
              .join('');
            
            Swal.fire({
              html: `<div class="mt-4">${botDetailsHtml}</div>`,
              confirmButtonText: 'Close',
              background: '#1a1a1a',
              customClass: {
                popup: '!border-2 !border-solid !border-secondary !bg-main',
                title: '!text-white',
                htmlContainer: '!text-white',
              },
            });
          })
          .catch((err) => {
            Swal.close();
            Swal.fire({
              title: 'Error',
              text: err.message,
              icon: 'error',
              confirmButtonText: 'Close',
              background: '#1a1a1a',
              customClass: {
                popup: '!border-2 !border-solid !border-secondary !bg-main',
                title: '!text-white',
                htmlContainer: '!text-white',
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