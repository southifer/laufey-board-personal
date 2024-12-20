import { ColDef } from 'ag-grid-community';

const numberFormat = (number: number) => new Intl.NumberFormat().format(number);

interface InventoryProps {
  id: number;
  amount: number;
  is_clothes: boolean;
  name: string;
}

interface RowData {
  server: string;
  is_script_run: boolean;
  is_account_secured: boolean;
  name: string;
  level: number;
  age: number;
  ping: number;
  playtime: number;
  status: string;
  google_status: string;
  mail: string;
  world: string;
  task: string;
  inventory: InventoryProps[];
  online_time: string;
  malady: string;
  malady_expiration: string;
  proxy: string;
  position: string;
  gems: number;
  obtained_gems: number;
  mac: string;
  rid: string;
}

export const columns: ColDef<RowData>[] = [
  {
    field: 'server',
    enableCellChangeFlash: true,
    width: 100,
    hide: true
  },
  {
    field: 'is_script_run',
    enableCellChangeFlash: true,
    headerName: 'Script',
    width: 100,
    cellRenderer: (params: { value: boolean }) => params.value ? '✅' : '❌'
  },
  {
    field: 'is_account_secured',
    enableCellChangeFlash: true,
    headerName: 'Secured',
    width: 120,
    cellRenderer: (params: { value: boolean }) => params.value ? '✅' : '❌'
  },
  {
    field: 'name',
    width: 150,
    enableCellChangeFlash: true,
    filter: 'agTextColumnFilter',
  },
  {
    field: 'level',
    width: 100,
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => `Lv. ${params.value}`,
  },
  {
    field: 'age',
    width: 130,
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => `${params.value} days`,
  },
  {
    field: 'playtime',
    width: 130,
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => `${params.value} hours`,
  },
  {
    field: 'ping',
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => `${params.value} ms`,
  },
  {
    field: 'status',
    enableCellChangeFlash: true,
    filter: 'agSetColumnFilter',
    valueFormatter: (params: { value: string }) => {
      const iconKey = params.value === 'connected' ? '🟢' : '🔴';
      return params.value ? `${iconKey} ${params.value.toUpperCase()}` : '';
    }
  },
  {
    field: 'google_status',
    headerName: 'Google',
    enableCellChangeFlash: true,
    filter: 'agSetColumnFilter',
    valueFormatter: (params: { value: string }) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'mail',
    enableCellChangeFlash: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'world',
    enableCellChangeFlash: true,
    filter: 'agTextColumnFilter'
  },
  {
    field: 'task',
    enableCellChangeFlash: true,
    valueFormatter: (params: { value: string }) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'inventory',
    enableCellChangeFlash: true,
    filter: 'agSetColumnFilter',
    valueFormatter: (params: { value: InventoryProps[] }) => {
      return params.value ? String(`x${params.value.length}`) : '0'; // Convert length to string
    },
  },
  {
    field: 'online_time',
    enableCellChangeFlash: true,
    valueFormatter: (params: { value: string }) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'malady',
    enableCellChangeFlash: true,
    filter: 'agSetColumnFilter'
  },
  {
    field: 'malady_expiration',
    enableCellChangeFlash: true
  },
  {
    field: 'proxy',
    enableCellChangeFlash: true,
    filter: 'agSetColumnFilter'
  },
  {
    field: 'position',
    enableCellChangeFlash: true
  },
  {
    field: 'gems',
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => '💎' + numberFormat(params.value),
  },
  {
    field: 'obtained_gems',
    enableCellChangeFlash: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: { value: number }) => '⚜️' + numberFormat(params.value),
  },
  {
    field: 'mac',
    enableCellChangeFlash: true,
    hide: true,
    filter: 'agTextColumnFilter',
  },
  {
    field: 'rid',
    enableCellChangeFlash: true,
    hide: true,
    filter: 'agTextColumnFilter',
  },
];