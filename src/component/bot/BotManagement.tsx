import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../context/UserContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import axios from 'axios';
import Swal from "sweetalert2";
import { AgGridReact } from 'ag-grid-react';
import { RowSelectionOptions } from 'ag-grid-community';
import { gridOptions } from "./config/gridOptions";
import { themes } from "./theme/themes";

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

interface BotBackup {
  id: string;
  server: string;
  username: string;
  password: string;
  recovery: string;
  mac?: string;
  rid?: string;
  proxy?: string;
  proxyCount: number;
}

interface ExportItem {
  username: string;
  password: string;
  recovery: string;
  mac: string;
  rid: string;
}

const BotManagement = () => {
  const controller = new AbortController();
  const { user } = useUser();
  const [data, setData] = useState<BotBackup[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedRowsId, setSelectedRowsId] = useState<string[]>([])
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("bot_backup, proxylist")
          .eq("username", user?.username)
          .eq("password", user?.password);
        
        if (error) {
          throw error;
        }

        if (isMounted && data) {
          const parsedData = data
            .map((row: { bot_backup: string | object }) =>
              typeof row.bot_backup === "string"
                ? JSON.parse(row.bot_backup)
                : row.bot_backup
            )
            .flat();

          setData(parsedData as BotBackup[]);
        }
      } catch (e) {
        if (isMounted) {
          console.error("Error fetching bot_backup data:", e);
          setData([]);
        }
      }
    };
    
    fetchData();
    
    return () => {
      controller.abort();
      isMounted = false;
    };
  }, []);
  
  const rowSelection: RowSelectionOptions = useMemo(() => {
    return {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: true,
    };
  }, []);
  
  const onSelectionChanged = useCallback((event: any) => {
    const selectedIds = event.api.getSelectedRows().map((row: any) => row);
    setSelectedRows(selectedIds);
    setSelectedRowsId(selectedIds.map((row: any) => row.id));
  }, []);
  
  const onCellValueChanged = useCallback((event: any) => {
      const updatedData = data.map((row) =>
        row.id === event.data.id
          ? { ...row, [event.column.colId]: event.value }
          : row
      );
      setData(updatedData);
    },
    [data]
  );
  
  const generate = {
    rid: () => {
      const characters = "0123456789ABCDEF";
      let rid = "";
      for (let i = 0; i < 32; i++) {
        rid += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return rid;
    },
    
    mac: () => {
      const mac = ["02"]; // Setting the first byte to 02
      for (let i = 0; i < 5; i++) {
        const octet = Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, "0");
        mac.push(octet);
      }
      return mac.join(":");
    }
  };
  
  const appendToDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const newBotBackup: BotBackup = {
      id: uuidv4(),
      username: formData.get("username")?.toString() || "",
      password: formData.get("password")?.toString() || "",
      recovery: formData.get("recovery")?.toString() || "",
      mac: formData.get("mac")?.toString() || generate.mac(),
      rid: formData.get("rid")?.toString() || generate.rid(),
      proxy: formData.get("proxy")?.toString() || "",
      server: "",
      proxyCount: 0,
    };
    
    try {
      if (!user?.username) {
        throw new Error("User is not authenticated or lacks a unique identifier.");
      }
      
      const { error } = await supabase
        .from("user_data")
        .update({
          bot_backup: JSON.stringify([...data, newBotBackup]),
        })
        .eq("username", user?.username)
        .eq("password", user?.password);
      
      if (error) {
        console.error("Error adding bot backup:", error);
        return;
      }
      
      setData((prevData) => [...prevData, newBotBackup]);
      toast.success(`${newBotBackup.username} added to database...`);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };
  
  const removeFromDatabase = async (username: string[]) => {
    try {
      if (!user?.username) {
        toast.error("User is not authenticated or lacks a unique identifier.");
      }
      
      const updatedData = data.filter(
        (bot: BotBackup) => !selectedRowsId.includes(bot.id)
      );
      
      const { error } = await supabase
        .from("user_data")
        .update({
          bot_backup: JSON.stringify(updatedData),
        })
        .eq("username", user?.username)
        .eq("password", user?.password);
      
      if (error) {
        console.error("Error removing bot backup:", error);
        return;
      }
      
      toast.success(`${username.length} item(s) successfully removed`);
      
      setData(updatedData);
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async () => {
      const text = reader.result as string;
      const lines = text.split("\n");
      
      const newBotBackups: BotBackup[] = [];
      
      for (const line of lines) {
        const fields = line.trim().split("|");
        
        if (fields.length < 2 || fields.length > 6) {
          toast.error("Invalid format in file.");
          return;
        }
        
        const newBotBackup: BotBackup = {
          id: uuidv4(),
          username: fields[0],
          password: fields[1],
          recovery: fields[2] || "",
          mac: fields[3] || generate.mac(),
          rid: fields[4] || generate.rid(),
          proxy: fields[5] || "",
          server: "",
          proxyCount: 0,
        };
        
        newBotBackups.push(newBotBackup);
      }
      
      try {
        if (!user?.username) {
          throw new Error("User is not authenticated or lacks a unique identifier.");
        }
        
        const { error } = await supabase
          .from("user_data")
          .update({
            bot_backup: JSON.stringify([...data, ...newBotBackups]),
          })
          .eq("username", user?.username)
          .eq("password", user?.password);
        
        if (error) {
          console.error("Error adding bot backups from file:", error);
          return;
        }
        
        setData((prevData) => [...prevData, ...newBotBackups]);
        toast.success(`${newBotBackups.length} bot(s) added from file.`);
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };
    
    reader.readAsText(selectedFile); // Read the selected file
  };
  
  const showModal = (data: any) => {
    if (data.length > 1) {
      Swal.fire({
        icon: "info",
        title: "Confirmation",
        text: `Confirm adding x${data.length} bots?`,
        showCancelButton: true,
        confirmButtonText: "Add Bots",
        background: '#1a1a1a',
        customClass: {
          popup: '!border-2 !border-solid !border-secondary !bg-main',
          title: '!text-white',
          htmlContainer: '!text-white',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          addBot(data);
        }
      });
    } else {
      const bot = data[0];
      Swal.fire({
        icon: "info",
        title: "Confirm Adding Bot",
        html: `
            Are you sure you want to add the following bot?
            <br>Name: <strong>${bot.username}</strong>
            <br>Password: <strong>${bot.password}</strong>
            <br>MAC: <strong>${bot.mac}</strong>
            <br>Recovery: <strong>${bot.recovery}</strong>
            <br>RID: <strong>${bot.rid}</strong>
            <br>Proxy: <strong>${bot.proxy}</strong>
            <br>Server: <strong>${bot.server}</strong>
        `,
        showCancelButton: true,
        confirmButtonText: "Add Bot",
        background: '#1a1a1a',
        customClass: {
          popup: '!border-2 !border-solid !border-secondary !bg-main',
          title: '!text-white',
          htmlContainer: '!text-white',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          addBot(data);
        }
      });
    }
  };
  
  const addBot = async (data: any) => {
    const requests = data.map(async (item: BotBackup) => {
      await axios.post(
        `http://${item.server}:8000/bot/add`,
        null,
        {
          params: {
            name: item.username,
            password: item.password,
            recovery: item.recovery || "",
            mac: item.mac,
            rid: item.rid || "",
            proxy: item.proxy
          }
        }
      );
    });
    
    toast.promise(Promise.all(requests), {
      loading: `Adding bots...`,
      success: "Bots added to client",
      error: "Failed to add bots. Server offline?",
    });
    
    try {
      await Promise.all(requests);
    } catch (error) {
      console.error("Error adding bot:", error);
    }
  };
  
  const exportData = (): void => {
    // Find the full row data from `data` using the IDs from `selectedRowsId`
    const exportItems: ExportItem[] = data
      .filter((row: BotBackup) => selectedRowsId.includes(row.id))
      .map((row: BotBackup) => ({
        username: row.username,
        password: row.password,
        recovery: row.recovery,
        mac: row.mac || '',
        rid: row.rid || '',
      }));
    
    const txtContent = exportItems
      .map(item => Object.values(item).join("|"))
      .join("\n");
    
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exported_data.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const ContextMenu = (params: any) => {
    if (!params) {
      return [{name: 'Run Command'}]
    }
    return [
      {
        name: 'Save',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" /></svg>',
        action: async () => {
          try {
            if (!user?.username) {
              throw new Error("User is not authenticated or lacks a unique identifier.");
            }
            
            const { error } = await supabase
              .from("user_data")
              .update({
                bot_backup: JSON.stringify(data),
              })
              .eq("username", user?.username)
              .eq("password", user?.password);
            
            if (error) {
              console.error("Error saving bot backup:", error);
              return;
            }
            
            toast.success(`${data.length} item(s) saved successfully`);

            params.api.refreshCells({ force: true });

            setData(data);

          } catch (error) {
            console.error("Unexpected error:", error);
          }
        }
      },
      {
        name: 'Remove',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" /></svg>',
        action: () => {
          const selectedIds: any = selectedRows.map((row: string) => row);
          if (selectedIds.length > 0) {
            removeFromDatabase(selectedIds);
          }
        },
        disabled: selectedRows.length === 0,
      },
      {
        name: "Export",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>',
        action: exportData,
        disabled: selectedRows.length === 0,
      },
      "separator",
      {
        name: "Set Server",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>',
        action: async (params: any) => {
          const availableServers = user?.serverlist;
          
          // Check if availableServers is defined and not empty before proceeding
          if (!availableServers) {
            Swal.fire({
              title: "Error",
              text: "No servers available.",
              icon: "error",
              background: '#1a1a1a',
              customClass: {
                popup: '!border-2 !border-solid !border-secondary !bg-main',
                title: '!text-white',
                htmlContainer: '!text-white',
              },
            });
            return;
          }
          
          const { value: selectedServer } = await Swal.fire({
            title: "Choose a server:",
            input: "select",
            inputOptions: availableServers.reduce<{ [key: string]: string }>((options, server) => {
              options[server] = server;
              return options;
            }, {}),
            inputPlaceholder: "Select a server",
            showCancelButton: true,
            confirmButtonText: "Set Server",
            cancelButtonText: "Cancel",
            background: '#1a1a1a',
            customClass: {
              popup: '!border-2 !border-solid !border-secondary !bg-main',
              title: '!text-white',
              htmlContainer: '!text-white',
            },
          });
          
          if (selectedServer && availableServers.includes(selectedServer)) {
            // Function to update server for selected rows
            const updateServerForSelectedRows = (newServerValue: string) => {
              const selectedNodeIds = params.api.getSelectedNodes().map((node: any) => node.data.id);
              const updatedData = data.map((row) =>
                selectedNodeIds.includes(row.id) ? { ...row, server: newServerValue } : row
              );
              setData(updatedData);
            };
            
            updateServerForSelectedRows(selectedServer);
            
            // Refresh the grid after the update to reflect the changes
            const selectedNodes = params.api.getSelectedNodes();
            params.api.refreshCells({ rowNodes: selectedNodes, columns: ['server'] });
          }
        },
      },
      "separator",
      {
        name: 'Add bot',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>',
        action: () => {
          showModal(selectedRows)
        }
      },
      "separator",
      "copy",
    ]
  }
  
  const currentTheme =  themes.dark;
  const themeColors = currentTheme.darker;
  
  const gridStyles: React.CSSProperties & { [key: string]: string } = {
    '--ag-background-color': themeColors.backgroundColor,
    '--ag-border-color': themeColors.borderColor,
    '--ag-header-background-color': themeColors.headerBackgroundColor,
    '--ag-odd-row-background-color': themeColors.oddRowBackgroundColor,
    '--ag-font-family': currentTheme.text.fontFamily,
    '--ag-font-size': currentTheme.text.fontSize,
    '--ag-header-font-family': currentTheme.header.fontFamily,
    '--ag-header-font-size': currentTheme.header.fontSize,
    '--ag-header-font-weight': '1200',
    '--ag-header-foreground-color': currentTheme.header.color,
    '--ag-foreground-color': currentTheme.text.color,
    '--ag-borders': 'solid 1px',
    '--ag-row-border-width': '1px',
    '--ag-row-border-color': themeColors.borderColor,
    '--ag-header-height': '48px',
    '--ag-secondary-border-color': themeColors.borderColor,
    '--ag-input-border-color': themeColors.borderColor,
    '--ag-input-border-width': '1px',
    '--ag-input-border-style': 'solid',
    '--ag-input-border-radius': '1px',
    '--ag-input-focus-box-shadow': '0 0 0 1px ' + themeColors.borderColor,
    '--ag-input-focus-border-color': themeColors.borderColor,
    '--ag-control-panel-background-color': themeColors.backgroundColor,
    '--ag-side-button-selected-background-color': themeColors.menuHoverColor,
    '--ag-header-column-resize-handle-background-color': themeColors.borderColor,
    '--ag-popup-background-color': themeColors.menuBackgroundColor,
    '--ag-modal-overlay-background-color': themeColors.backgroundColor,
    '--ag-popup-shadow': '0 2px 8px rgba(0, 0, 0, 0.5)',
    '--ag-selected-row-background-color': '#0a6ebc4D',
    '--ag-row-hover-color': themeColors.menuHoverColor,
    '--ag-column-hover-color': themeColors.menuHoverColor,
    '--ag-range-selection-background-color': themeColors.menuHoverColor,
    '--ag-range-selection-chart-category-background-color': themeColors.menuHoverColor,
    '--ag-range-selection-chart-background-color': themeColors.menuHoverColor,
    '--ag-cell-horizontal-border': 'solid 1px ' + themeColors.borderColor,
    '--ag-header-column-separator-display': 'block',
    '--ag-header-column-separator-color': themeColors.borderColor,
    '--ag-header-column-separator-height': '100%',
    '--ag-alpine-active-color': themeColors.menuHoverColor,
    '--ag-checkbox-checked-color': '#007bff',
    '--ag-range-selection-highlight-color': '#0963A9',
    overflow: 'hidden',
  };
  
  return (
    <div className="bg-main text-white p-8 min-h-screen">
      <div className="text-3xl mb-4 font-bold flex gap-2">Bot Management</div>
      
      {/* First form for manual bot upload */}
      <div className="w-full bg-[#18181B] p-6 rounded shadow-md mb-4">
        <div className="flex items-center space-x-2 mb-4">
          <input
            onChange={(e) => setUploadFile(e.target.checked)}
            type="checkbox"
            value="checkbox"
            className="w-4 h-4 text-white bg-gray-100 border-gray-300 "
          />
          <label
            htmlFor="helper-checkbox"
            className="text-sm font-medium rounded-xl"
          >
            Centang jika upload file
          </label>
        </div>
        
        {!uploadFile ? (
        <form onSubmit={appendToDatabase}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
            <input
              type="text"
              name="password"
              placeholder="Password"
              required
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
            <input
              type="email"
              name="recovery"
              placeholder="Recovery"
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
            <input
              type="text"
              name="mac"
              placeholder="Mac"
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
            <input
              type="text"
              name="rid"
              placeholder="Rid"
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
            <input
              type="text"
              name="proxy"
              placeholder="Proxy"
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
          </div>
          <div className="flex flex-row-reverse">
            <button
              type="submit"
              className="max-w-full bg-white py-2 px-5 rounded hover:bg-gray-400 transition text-main"
            >
              Add
            </button>
          </div>
        </form>
        ) : (
          <div className="w-full rounded mb-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt"
              className="mb-2 relative m-0 block w-full min-w-0 flex-auto cursor-pointer rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] font-normal leading-[2.15] text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-500 focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100 dark:focus:border-primary"
            />
            <label
              htmlFor="formFileLg"
              className="inline-block text-neutral-700 dark:text-neutral-200"
            >
              Format upload: 
              <div className="text-[0.8em]">USERNAME|PASSWORD|RECOVERY</div>
              <div className="text-[0.8em]">USERNAME|PASSWORD|RECOVERY|MAC|RID</div>
            </label>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleFileUpload}
                className="bg-white text-main py-2 px-5 rounded hover:bg-gray-400 transition"
                >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-[#18181B] p-4 ag-theme-alpine-dark shadow overflow-x-hidden rounded" style={gridStyles}>
        <div className="mb-2 text-[0.9em]">
          selected <u>x{selectedRowsId.length}</u> | double click to edit | right click to save
        </div>
        <div className="h-[900px]">
          <AgGridReact
            rowData={data?.map((item: BotBackup) => ({
              ...item,
              id: item.id,
            }))}
            getRowId={(params) => {
              return String(params.data.id);
            }}
            gridOptions={gridOptions}
            pagination
            rowSelection={rowSelection}
            getContextMenuItems={ContextMenu}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
          />
        </div>
      </div>
    </div>
  );
};

export default BotManagement;