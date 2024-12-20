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
        action: async () => {
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.reconnectBot();
        },
      },
      {
        name: 'Disconnect',
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
                await axios.post(`http://${params.node.data.server}:8000/bot/runScript`, script, {
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
        action: async () => {
          const { default: SeeLogs } = await import('./event/PreviewLogs');
          const seeLogs = new SeeLogs();
          seeLogs.showLogs(params);
        }
      },
      {
        name: 'Inventory',
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
        action: async () => {
          const { default: RunCommand } = await import('./event/RunCommand');
          await RunCommand(params, selectedRows)
        }
      },
      {
        name: 'Stop Script',
        action: async () => {
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.stopScript();
        },
      },
      "separator",
      {
        name: 'View details',
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
              server: findBot.server,
              username: findBot.username,
              password: findBot.password,
              recovery: findBot.recovery,
              mac: params.node.data.mac,
              rid: params.node.data.rid,
              status: params.node.data.status,
              proxy: params.node.data.proxy
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