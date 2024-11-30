import Swal from 'sweetalert2';
import axios from 'axios';
import { ICellRendererParams } from 'ag-grid-community';

interface BotData {
  server: string;
  // Add other bot data properties if needed
}

const RunCommand = async (
  params: ICellRendererParams<BotData>,
  selectedRowIds: number[]
): Promise<void> => {
  try {
    const { value: script } = await Swal.fire({
      input: 'textarea',
      inputLabel: 'Enter your Lua script',
      inputPlaceholder: 'Type your Lua script here...',
      showCancelButton: true,
      confirmButtonText: 'Run Script',
      showLoaderOnConfirm: true,
      inputAttributes: {
        style: `
          border: #424242 1px solid;
          font-size: 11px;
          height: 400px;
          background-color: #0F1015;
          color: #FFFFFF;
          font-family: JetBrains Mono;
          outline: none;
        `,
        class: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
      },
      customClass: {
        popup: 'dark:bg-[#121212] dark:border dark:border-[#262626] dark:text-white',
        title: 'dark:text-white',
        htmlContainer: 'dark:text-white',
      },
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (inputScript) => {
        if (!inputScript) {
          Swal.showValidationMessage('Please enter a script!');
          return;
        }
        try {
          const formattedScript = `
            for _,i in pairs({${selectedRowIds.join(',')}}) do
              bot = getBot(i)
              ${inputScript}
            end
          `;
          const response = await axios.post(
            `http://${params.node.data!.server}:8000/bot/runScript`, formattedScript, {
              headers: { 'Content-Type': 'text/plain' }
            }
          );
          return response.data;
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data || error.message || 'Unknown error');
          }
          throw new Error('Unknown error occurred');
        }
      },
    });
    
    if (script) {
      await Swal.fire({
        icon: 'info',
        text: script === 'nil' ? 'Script Executed!' : script,
        customClass: {
          popup: 'dark:bg-[#0A0A0A] dark:border dark:border-[#262626]',
          title: 'dark:text-white',
        },
      });
    }
  } catch (error) {
    console.error('Error executing command:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Execution Failed',
      text: error instanceof Error ? error.message : 'An unexpected error occurred.',
      customClass: {
        popup: 'dark:bg-[#0A0A0A] dark:border dark:border-[#262626]',
        title: 'dark:text-white',
      },
    });
  }
};

export default RunCommand;