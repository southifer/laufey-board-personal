import React, { useEffect, useState, useMemo } from 'react';
import { themes } from "../table/config/theme/themes";

import { AgGridReact } from 'ag-grid-react';
import { GridOptions, RowSelectionOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DataObject {
  details: {
    name: string;
    google_status: string;
    status: string;
    mac: string;
    rid: string;
    mail: string;
  };
}

interface NotificationProps {
  dataObject: DataObject[];
}

const Notification: React.FC<NotificationProps> = ({ dataObject }) => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const filterData = () => {
      return dataObject?.map((item, index) => ({
        username: item.details.name,
        google: item.details.google_status,
        status: item.details.status,
        mac: item.details.mac,
        rid: item.details.rid,
        mail: item.details.mail,
        id: index
      })).filter(post => post.status === "disconnected" || post.status === "captcha_required");;
    };

    const filteredData = filterData();
    setPosts(filteredData);
  }, [dataObject]);

  const rowSelection: RowSelectionOptions = useMemo(() => {
    return {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: true,
    };
  }, []);

  const columnDefs = [
    { headerName: 'Name', field: 'username' },
    { headerName: 'Email', field: 'mail' },
    { headerName: 'Status', field: 'status' },
    { headerName: 'Google', field: 'google' },
  ];

  const gridOptions: GridOptions = {
    columnDefs: columnDefs,
    rowSelection: rowSelection,
    rowGroupPanelShow: 'always',
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      enableRowGroup: true,
    },
    pagination: true,
    animateRows: true,
    autoGroupColumnDef: {
      minWidth: 300,
    }
  }

  const ContextMenu = (params: any) => [
    {
      name: 'Show '
    },
    'copy',
    'copyWithHeaders',
    'paste',
    'separator',
    'export',
    'separator',
    'chartRange',
  ]

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
    overflow: 'hidden',
    height: '400px',
    width: '100%',
  };

  return (
    <div className="rounded shadow-lg p-4 bg-[#18181B] border-secondary sm:max-w-full lg:max-w-2xl mx-auto h-full">
      <div className="text-xs mb-4 flex items-center gap-1 text-white">
        <span className="font-medium">Important Status</span>
      </div>
      <div className="ag-theme-alpine-dark" style={gridStyles}>
        <AgGridReact
          rowData={posts}
          getRowId={(params) => {
            return String(params.data.id);
          }}
          gridOptions={gridOptions}
          pagination={true}
          getContextMenuItems={ContextMenu}
        />
      </div>
    </div>
  );
};

export default Notification;