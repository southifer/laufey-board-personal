import { AgGridReact } from 'ag-grid-react';
import { RowSelectionOptions } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

import { useEffect, useState, useMemo, useCallback } from "react";
import { gridOptions } from "./config/gridOptions";
import { themes } from "./config/theme/themes";

interface InventoryItem {
  id: number;
  name: string;
  amount: number;
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

const Table = ({ dataObject }: { dataObject: any}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState([])
  
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
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const ContextMenu = (params: any) => {
    if (!params) {
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
          const { default: Command } = await import('./event/InteractionEvent');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.disconnectBot();
        },
      },
      {name: 'Warp'},
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
              {name: 'Trash'},
              {name: 'Wear'},
              {name: 'Drop'},
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
        name: 'Remove',
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
    '--ag-header-font-weight': '1200',
    '--ag-header-foreground-color': currentTheme.header.color,
    '--ag-foreground-color': currentTheme.text.color,
    '--ag-borders': 'solid 1px',
    '--ag-row-border-width': '1px',
    '--ag-row-border-color': themeColors.borderColor,
    '--ag-border-radius': '0.75rem',
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
    
    overflow: 'hidden',
  };
  
  return (
    <div
      className="ag-theme-quartz h-[700px] rounded-xl overflow-y-scroll scrollbar-hide"
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
        rowSelection={rowSelection}
        getContextMenuItems={ContextMenu}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  );
};

export default Table;