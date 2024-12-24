import { AgGridReact } from 'ag-grid-react';
import { RowSelectionOptions, Grid, GridOptions } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

import { useEffect, useState, useMemo, useCallback } from "react";
import { gridOptions } from "./config/gridOptions";
import { themes } from "./config/theme/themes";
import { supabase } from '../../../lib/supabase';
import { useUser } from '../../../context/UserContext';

import axios from 'axios';
import Swal from 'sweetalert2';

interface InventoryItem {
  id: number;
  name: string;
  amount: number;
  is_clothes: boolean;
}

interface BotDetails {
  age: number;
  console: string[];
  gems: number;
  google_status: string;
  index: number;
  inventory: object;
  is_account_secured: boolean;
  is_resting: boolean;
  is_script_run: boolean;
  mac: string;
  mail: string;
  malady: string;
  malady_expiration: number;
  name: string;
  obtained_gems: number;
  online_time: string;
  ping: number;
  playtime: number;
  position: string;
  proxy: string;
  rid: string;
  status: string;
  task: string;
  world: string;
}

interface DataItem {
  id: number;
  details: BotDetails
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

const Table = ({ dataObject, getSelected }: { dataObject: any, getSelected: any}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
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
    const selectedIds = event.api.getSelectedRows().map((row: any) => row.index);
    setSelectedRows(selectedIds);
    getSelected(selectedIds)
  }, []);
  
  if (!mounted) {
    return null;
  }

  const ContextMenu = (params: any) => {
    if (!params || !params.node || !params.node.data) {
      return [{name: 'Run Command'}]
    }
    return [
      {
        name: 'Reconnect',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" /></svg>',
        action: async () => {
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.reconnectBot();
        },
      },
      {
        name: 'Disconnect',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>',
        action: async () => {
          const selectedNodes = params.api.getSelectedNodes();
          params.api.refreshCells({ rowNodes: selectedNodes});

          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.disconnectBot();
          
        },
      },
      {
        name: 'Warp',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" /></svg>',
        action: async () => {
          await Swal.fire({
            input: 'text',
            inputLabel: 'Enter world name',
            inputPlaceholder: 'Enter world name',
            confirmButtonText: 'Warp',
            showLoaderOnConfirm: true,
            inputAttributes: {
              style: `
                border: #424242 1px solid;
                background-color: #0F1015;
                color: #FFFFFF;
                outline: none;
                text-align: left;
              `,
              autocapitalize: "on",
              class: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
            },
            customClass: {
              popup: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
              title: 'dark:text-white',
              htmlContainer: 'dark:text-white',
            },
            preConfirm: async (world) => {
              if (!world) {
                Swal.showValidationMessage('Please enter world name!');
                return;
              }
              const script = `
                  for _,i in pairs({${selectedRows.join(',')}}) do
                      bot = getBot(i)
                      bot:warp("${world}")
                  end
              `
              try {
                await axios.post(`http://${params.node.data.server}/bot/runScript`, script, {
                  headers: { 'Content-Type': 'text/plain' },
                });
              } catch (error: any) {
                Swal.showValidationMessage(`Error: ${error.message}`);
              }
            },
            allowOutsideClick: () => !Swal.isLoading(),
          })
        }
      },
      "separator",
      {
        name: 'Logs',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
        action: async () => {
          const { default: SeeLogs } = await import('./event/PreviewLogs');
          const seeLogs = new SeeLogs();
          seeLogs.showLogs(params);
        }
      },
      {
        name: 'Inventory',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>',
        subMenu: params.node.data.inventory.map((item: InventoryItem) => ({
            name: `${item.id} | ${item.name} (x${item.amount})`,
            subMenu: [
              {
                name: 'Trash',
                action: async () => {
                  const {default: Interface } = await import('./event/InterfaceEvent');
                  const interfaceEvent = new Interface(params.node.data.server, params.node.data.index, item.id);
                  interfaceEvent.trash()
                }
              },
              {
                name: 'Wear',
                action: async () => {
                  const {default: Interface } = await import('./event/InterfaceEvent');
                  const interfaceEvent = new Interface(params.node.data.server, params.node.data.index, item.id);
                  interfaceEvent.wear()
                }
              },
              {
                name: 'Drop',
                action: async () => {
                  const {default: Interface } = await import('./event/InterfaceEvent');
                  const interfaceEvent = new Interface(params.node.data.server, params.node.data.index, item.id);
                  interfaceEvent.drop()
                }
              },
            ]
          })
        )
      },
      {
        name: 'Run Command',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>',
        action: async () => {
          const { default: RunCommand } = await import('./event/RunCommand');
          await RunCommand(params, selectedRows)
        }
      },
      {
        name: 'Stop Script',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>',
        action: async () => {
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.stopScript();
        },
      },
      "separator",
      {
        name: 'View details',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>',
        action: async () => {
          try {
            const { data, error } = await supabase
              .from("user_data")
              .select("bot_backup")
              .eq("username", user?.username)
              .eq("password", user?.password);
      
            if (error) {
              throw new Error(error.message);
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
              (item: BotBackupProps) => item.mac === params.node.data.mac && item.rid === params.node.data.rid
            );

            const replaceBot = {
              Server: findBot.server,
              Username: findBot.username,
              Password: findBot.password,
              Recovery: findBot.recovery,
              Mac: params.node.data.mac,
              Rid: params.node.data.rid,
              Status: params.node.data.status,
              Proxy: params.node.data.proxy
            }

            if (!findBot) {
              Swal.fire({
                icon: 'error',
                title: 'Bot Not Found',
                text: 'No matching bot details were found.',
              });
              return;
            }
      
            // Display AG Grid inside SweetAlert2
            Swal.fire({
              html: `<div id="ag-grid-container" class="ag-theme-alpine-dark" style="height: 400px; width: 100%;"></div>`,
              width: 600,
              inputAttributes: {
                style: `
                  border: #424242 1px solid;
                  height: 400px;
                  background-color: #0F1015;
                  color: #FFFFFF;
                  outline: none;
                  text-align: left;
                `,
                class: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
              },
              customClass: {
                popup: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-white',
              },
              didOpen: () => {
                const container = document.getElementById("ag-grid-container");
                if (!container) {
                  console.error("AG Grid container not found");
                  return;
                }
              
                const gridOptions: GridOptions = {
                  columnDefs: [
                    { headerName: '#', field: 'field', flex: 1, cellStyle: { textAlign: 'left' }},
                    { headerName: 'Data', field: 'value', flex: 2, cellStyle: { textAlign: 'left' }},
                  ],
                  rowData: Object.entries(replaceBot).map(([field, value]) => ({ field, value })),
                  defaultColDef: {
                    sortable: true,
                    filter: true,
                  },
                };
              
                new Grid(container, gridOptions);
              },              
              confirmButtonText: 'Close',
            });
      
          } catch (err) {
            console.error("Error loading data:", err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err instanceof Error ? err.message : 'Failed to load data.',
            });
            throw err;
          }
        }
      },
      "separator",
      {
        name: 'Leveling',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>',
        subMenu: [
          {
            name: 'Start',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startLeveling();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.stopScript();
            },
          }
        ]
      },
      {
        name: 'Rotasi',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>',
        subMenu: [
          {
            name: 'Start',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startRotasi();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.stopScript();
            },
          }
        ]
      },
      {
        name: 'Tutorial',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" /></svg>',
        subMenu: [
          {
            name: 'Start',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startTutorial();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('./event/InteractionEvent');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.stopTutorial();
            },
          }
        ],
      },
      "separator",
      "copy",
      {
        name: 'Remove Bot',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>',
        action: async () => {
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.removeBot();
        },
      }
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
    '--ag-header-font-weight': '1400',
    '--ag-header-foreground-color': currentTheme.header.color,
    '--ag-foreground-color': currentTheme.text.color,
    '--ag-borders': 'solid 1px',
    '--ag-row-border-width': '1px',
    '--ag-row-border-color': themeColors.borderColor,
    '--ag-borders-critical': 'solid 1px',
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
    <div
      className="ag-theme-alpine-dark h-[900px] rounded-xl overflow-y-scroll scrollbar-hide"
      style={gridStyles}
    >
      <AgGridReact
        rowData={dataObject?.map((item: DataItem) => ({
          ...item.details,
          id: item.id,
        }))}
        getRowId={(params) => params.data.name}
        gridOptions={gridOptions}
        pagination
        paginationPageSize={200}
        rowSelection={rowSelection}
        getContextMenuItems={ContextMenu}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
};

export default Table;