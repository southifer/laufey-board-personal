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
        
        console.log(data)
        
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
  
  const saveData = async () => {
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
  
  const ContextMenu = (params: any) => {
    if (!params) {
      return [{name: 'Run Command'}]
    }
    return [
      {
        name: 'Save',
        action: () => {
          saveData()
        }
      },
      {
        name: 'Remove',
        action: () => {
          const selectedIds: any = selectedRows.map((row: string) => row);
          if (selectedIds.length > 0) {
            removeFromDatabase(selectedIds);
          }
        },
        disabled: selectedRows.length === 0,
      },
      "separator",
      {
        name: "Set Server",
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
    
    overflow: 'hidden',
  };
  
  return (
    <div className="bg-main text-white p-8 min-h-screen">
      <div className="text-3xl mb-4 font-bold flex gap-2">Bot Management</div>
      
      {/* First form for manual bot upload */}
      <div className="w-full bg-main p-6 rounded shadow-md border border-secondary mb-4">
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
          <div className="w-full bg-main p-6 rounded shadow-md border border-secondary mb-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt"
              className="bg-main text-sm text-white rounded block w-full p-3.5 outline-none border border-secondary"
            />
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
      <div className="ag-theme-quartz h-[900px] shadow overflow-x-hidden" style={gridStyles}>
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
  );
};

export default BotManagement;