
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

import { useEffect, useState, useMemo, useCallback } from "react";
import { gridOptions } from "./config/gridOptions";
import { themes } from "./config/theme/themes";

const Table = ({ dataObject }) => {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState([])
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const rowSelection = useMemo(() => {
    return {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: true,
    };
  }, []);
  
  const onSelectionChanged = useCallback((event) => {
    const selectedIds = event.api.getSelectedRows().map(row => row.index);
    setSelectedRows(selectedIds);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const ContextMenu = (params: object) => {
    if (!params) {
      return [{name: 'Run Command'}]
    }
    return [
      {
        name: 'Reconnect',
        action: async () => {
          const { default: Command } = await import('@/app/controller/table/command/command');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.reconnectBot();
        },
      },
      {
        name: 'Disconnect',
        action: async () => {
          const { default: Command } = await import('@/app/controller/table/command/command');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.disconnectBot();
        },
      },
      {name: 'Warp'},
      "separator",
      {
        name: 'Logs',
        action: async () => {
          const { default: SeeLogs } = await import('@/app/controller/table/command/preview-logs/logs-viewer');
          const seeLogs = new SeeLogs();
          seeLogs.showLogs(params);
        }
      },
      {
        name: 'Inventory',
        subMenu: params.node.data.inventory.map(item => ({
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
          const { default: RunCommand } = await import('@/app/controller/table/command/run-command');
          await RunCommand(params, selectedRows)
        }
      },
      {
        name: 'Stop Script',
        action: async () => {
          const { default: Command } = await import('@/app/controller/table/command/command');
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
              const { default: Command } = await import('@/app/controller/table/command/command');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startLeveling();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('@/app/controller/table/command/command');
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
              const { default: Command } = await import('@/app/controller/table/command/command');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startRotasi();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('@/app/controller/table/command/command');
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
              const { default: Command } = await import('@/app/controller/table/command/command');
              const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
              await command.startTutorial();
            },
          },
          {
            name: 'Stop',
            action: async () => {
              const { default: Command } = await import('@/app/controller/table/command/command');
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
          const { default: Command } = await import('@/app/controller/table/command/command');
          const command = new Command(params.node.data.server, `{${selectedRows.join(',')}}`, '');
          await command.removeBot();
        },
      }
    ]
  }
  
  const currentTheme = theme === 'dark' ? themes.dark : themes.light;
  const themeColors = theme === 'dark' ? currentTheme.darker : currentTheme.lighter;
  
  return (
    <div
      className={`${theme === 'dark' ? 'ag-theme-quartz' : 'ag-theme-quartz'} w-full h-[700px]`}
      style={{
        '--ag-background-color': themeColors.backgroundColor,
        '--ag-border-color': themeColors.borderColor,
        '--ag-header-background-color': themeColors.headerBackgroundColor,
        '--ag-odd-row-background-color': themeColors.oddRowBackgroundColor,
        '--ag-font-family': currentTheme.text.fontFamily,
        '--ag-font-size': currentTheme.text.fontSize,
        '--ag-header-font-family': currentTheme.header.fontFamily,
        '--ag-header-font-size': currentTheme.header.fontSize,
        '--ag-header-font-weight': currentTheme.header.fontWeight,
        '--ag-header-foreground-color': currentTheme.header.color,
        '--ag-foreground-color': currentTheme.text.color,
        '--ag-borders': 'solid 1px',
        '--ag-row-border-width': '1px',
        '--ag-row-border-color': themeColors.borderColor,
        '--ag-border-radius': '0.75rem',
        // Make borders visible on corners
        '--ag-borders-critical': 'solid 1px',
        '--ag-border-color': themeColors.borderColor,
        // Filter styling
        '--ag-header-height': '48px',
        '--ag-header-foreground-color': currentTheme.header.color,
        '--ag-secondary-border-color': themeColors.borderColor,
        // Input styling for filters
        '--ag-input-border-color': themeColors.borderColor,
        '--ag-input-border-width': '1px',
        '--ag-input-border-style': 'solid',
        '--ag-input-border-radius': '1px',
        '--ag-input-focus-box-shadow': '0 0 0 1px ' + themeColors.borderColor,
        '--ag-input-focus-border-color': themeColors.borderColor,
        // Filter and Menu backgrounds
        '--ag-control-panel-background-color': themeColors.backgroundColor,
        '--ag-side-button-selected-background-color': themeColors.menuHoverColor,
        '--ag-header-column-resize-handle-background-color': themeColors.borderColor,
        // Popup/overlay styling
        '--ag-popup-background-color': themeColors.menuBackgroundColor,
        '--ag-modal-overlay-background-color': themeColors.backgroundColor,
        '--ag-popup-shadow': theme === 'dark'
          ? '0 2px 8px rgba(0, 0, 0, 0.5)'
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        // Selection and hover states
        '--ag-selected-row-background-color': '#0a6ebc4D',
        '--ag-row-hover-color': themeColors.menuHoverColor,
        '--ag-column-hover-color': themeColors.menuHoverColor,
        '--ag-range-selection-background-color': themeColors.menuHoverColor,
        '--ag-range-selection-chart-category-background-color': themeColors.menuHoverColor,
        '--ag-range-selection-chart-background-color': themeColors.menuHoverColor,
        // Additional styling
        '--ag-cell-horizontal-border': 'solid 1px ' + themeColors.borderColor,
        '--ag-header-column-separator-display': 'block',
        '--ag-header-column-separator-color': themeColors.borderColor,
        '--ag-header-column-separator-height': '100%',
        // Alpine theme specific overrides
        '--ag-alpine-active-color': themeColors.menuHoverColor,
        overflow: 'hidden',
      }}
    >
      <AgGridReact
        rowData={dataObject?.map((item) => ({
          ...item.details,
          id: item.id
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