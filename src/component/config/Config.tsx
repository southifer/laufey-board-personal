import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import Editor from "@monaco-editor/react";
import Table from "../controller/table/table";

interface ConfigData {
  [key: string]: any;
}

const Config = () => {
  const [config, setConfig] = useState<{ script: any; server: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editorValue, setEditorValue] = useState("{}");
  const { user } = useUser();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = user?.serverlist?.map((server) =>
          axios
            .get<ConfigData>(`http://${server}:8000/bot/config`)
            .catch((error) => {
              console.error(error);
              toast.error("Failed to fetch data. Check network or server.");
              return null;
            })
        );
        const responses = await Promise.all(promises || []);
        
        const scriptData = responses.map((item, index) => ({
          script: item?.data || {},
          server: user?.serverlist[index] || `Server ${index + 1}`,
        }));
        
        setConfig(scriptData);
        setEditorValue(JSON.stringify(scriptData[0]?.script || {}, null, 2));
      } catch (error) {
        setError("Error fetching config data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.serverlist]);
  
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = Number(event.target.value);
    setSelectedIndex(newIndex);
    setEditorValue(JSON.stringify(config[newIndex]?.script || {}, null, 2));
  };
  
  const handleEditorChange = (value: string | undefined) => {
    setEditorValue(value || "{}");
  };
  
  const handleEditorMount = (editor: any, monaco: any) => {
    monaco.editor.setTheme('vs-dark'); // Set theme on mount
  };
  
  const handleSave = async () => {
    try {
      const server = config[selectedIndex]?.server;
      const script = JSON.parse(editorValue);
      
      const fetchPromise = axios.post(
        `http://${server}:8000/bot/config`, script, {
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );

      toast.promise(fetchPromise, {
        loading: `Saving script to ${server}...`,
        success: "Script saved successfully!",
        error: "Failed saving script. Please try again.",
      });
      
      const response = await fetchPromise;
      return response.data;
      
    } catch (error) {
      console.error("Error saving script:", error);
      toast.error("An error occurred while updating the config.");
      throw error;
    }
  };
  
  return (
    <div className="bg-main text-white p-8 min-h-screen">
      <div className="text-3xl mb-4 font-bold flex gap-2">Config</div>
      <div className="shadow rounded overflow-x-hidden bg-[#18181B]">
        <div className="p-4">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div>
              <div className="">
                <div className="mb-4">
                  <select
                    id="server-select"
                    value={selectedIndex}
                    onChange={handleSelectChange}
                    className="w-full bg-main  text-gray-200 text-sm pl-3 pr-8 py-2 transition duration-300 ease rounded shadow-sm cursor-pointer"
                  >
                    {config.map((item, index) => (
                      <option key={index} value={index}>
                        {item.server}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Editor
                width="100%"
                height="70vh"
                language="json"
                value={editorValue}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  selectOnLineNumbers: true,
                  theme: "vs-dark",
                  fontSize: 14,
                }}
              />
              <div className="flex flex-row-reverse">
                <button
                  onClick={handleSave}
                  className="text-black mt-4 bg-white py-2 px-4 rounded hover:bg-gray-400 transition"
                >
                  save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Config;