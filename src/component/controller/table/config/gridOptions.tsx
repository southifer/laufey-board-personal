import { columns } from "./columns";

export const gridOptions = {
  columnDefs: columns,
  rowGroupPanelShow: 'always',
  defaultColDef: {
    filter: true,
    floatingFilter: true,
    menuTabs: ['generalMenuTab', 'filterMenuTab', 'columnsMenuTab'],
    resizable: true,
    enableRowGroup: true,
  },
  columnMenu: 'legacy',
  suppressMenuHide: true,
  animateRows: true,
  statusBar: {
    statusPanels: [{ statusPanel: "agSelectedRowCountComponent" }],
  },
  autoGroupColumnDef: {
    minWidth: 300,
  }
};