const numberFormat = (number: number) => new Intl.NumberFormat().format(number)
export const columns = [
  {
    field: 'server',
    enableCellChangeFlash: true,
    width: 100,
  },
  {
    field: 'is_script_run',
    enableCellChangeFlash: true,
    headerName: 'Script',
    width: 100,
    cellRenderer: (params: boolean) => params.value ? '✅' : '❌'
  },
  {
    field: 'is_account_secured',
    enableCellChangeFlash: true,
    headerName: 'Secured',
    width: 100,
    cellRenderer: (params: boolean) => params.value ? '✅' : '❌'
  },
  {
    field: 'name',
    enableCellChangeFlash: true,
    filter: "agTextColumnFilter",
  },
  {
    field: 'level',
    enableCellChangeFlash: true,
    filter: "agNumberColumnFilter",
    valueFormatter: (params: number) => `Lv. ${params.value}`,
  },
  {
    field: 'age',
    enableCellChangeFlash: true,
    filter: "agNumberColumnFilter",
    valueFormatter: (params: number) => `${params.value} days`,
  },
  {
    field: 'ping',
    enableCellChangeFlash: true,
    filter: "agNumberColumnFilter",
    valueFormatter: (params: number) => `${params.value} ms`,
  },
  {
    field: 'status',
    enableCellChangeFlash: true,
    filter: "agSetColumnFilter",
    valueFormatter: (params) => {
      const iconKey = params.value == "connected" ? "🟢" : "🔴"
      return params.value ? `${iconKey} ${params.value.toUpperCase()}` : '';
    }
  },
  {
    field: 'google_status',
    enableCellChangeFlash: true,
    filter: "agSetColumnFilter",
    valueFormatter: (params) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'mail',
    enableCellChangeFlash: true,
    filter: "agTextColumnFilter"
  },
  {
    field: 'world',
    enableCellChangeFlash: true,
    filter: "agTextColumnFilter"
  },
  {
    field: 'task',
    enableCellChangeFlash: true,
    valueFormatter: (params) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'online_time',
    enableCellChangeFlash: true,
    valueFormatter: (params) => {
      return params.value ? params.value.toUpperCase() : '';
    }
  },
  {
    field: 'malady',
    enableCellChangeFlash: true,
    filter: "agSetColumnFilter"
  },
  {
    field: 'malady_expiration',
    enableCellChangeFlash: true
  },
  {
    field: 'proxy',
    enableCellChangeFlash: true,
    filter: "agSetColumnFilter"
  },
  {
    field: 'position',
    enableCellChangeFlash: true
  },
  {
    field: 'gems',
    enableCellChangeFlash: true,
    filter: "agNumberColumnFilter",
    valueFormatter: params => numberFormat(params .value),
  },
  {
    field: 'obtained_gems',
    enableCellChangeFlash: true,
    filter: "agNumberColumnFilter",
    valueFormatter: params => numberFormat(params.value),
  },
  {
    field: 'mac',
    enableCellChangeFlash: true,
    hide: true,
    filter: "agTextColumnFilter",
  },
  {
    field: 'rid',
    enableCellChangeFlash: true,
    hide: true,
    filter: "agTextColumnFilter",
  },
];