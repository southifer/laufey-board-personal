import { ColDef } from 'ag-grid-community';

const numberFormat = (number: number) => new Intl.NumberFormat().format(number);

interface RowData {
  id: number;
  server: string;
  username: string;
  password: string;
  recovery: string;
  mac: string;
  rid: string;
  proxy: string;
  proxyCount: number;
}

export const columns: ColDef<RowData>[] = [
  {
    field: 'id',
    enableCellChangeFlash: true,
    hide: true,
  },
  {
    field: 'server',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'username',
    enableCellChangeFlash: true,
    editable: true,
    filter: 'agTextColumnFilter',
  },
  {
    field: 'password',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'recovery',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'mac',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'rid',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'proxy',
    enableCellChangeFlash: true,
    editable: true,
  },
  {
    field: 'proxyCount',
    enableCellChangeFlash: true,
  },
];