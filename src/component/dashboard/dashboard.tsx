import React, { lazy, Suspense, useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { BookCheck, Bot } from "lucide-react";
import axios, { AxiosResponse } from "axios";

interface UserDetails {
  status: string;
  gems: number;
  obtained_gems: number;
  google_status: string;
}

interface User {
  details: UserDetails;
}

const LogoutEvent = lazy(() => import('./logout/LogoutEvent'));
const Card = lazy(() => import('./card/Card'));

export default function Dashboard() {
  const { user } = useUser();
  const [serverData, setServerData] = useState<User[][]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = (user?.serverlist || []).map((server) =>
            axios.get(`http://${server}:8000/bot/get`)
        );
        const response = await Promise.all(promises);
        const formattedData = response.map((res: AxiosResponse) => res.data as User[]);
        setServerData(formattedData);
      } catch (e) {
        console.error(e);
        setServerData([]); // Or handle some error state
      }
    };

    if (user?.serverlist) {
      fetchData();
    }
  }, [user]);

  return (
      <div className="bg-main text-white p-8 min-h-screen">
        <div className="text-3xl mb-4 font-bold flex gap-2">Dashboard</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full mb-4">
          <div className="rounded shadow p-4 select-none border border border-secondary">
            <h1 className="text-xs flex flex-row gap-1 mb-2">
              <Bot className="w-4 h-4 text-white"/>
              Bot Information
            </h1>
            <div className="flex flex-col gap-1 mb-2 text-sm">
              <div>Router List: {user?.routerlist}</div>
              <div>Server List: {user?.serverlist}</div>
              <div>Total Bots: x{user?.bot_backup.length}</div>
            </div>
          </div>
          <div className="rounded shadow p-4 select-none border border border-secondary">
            <h1 className="text-xs flex flex-row gap-1 mb-2">
              <BookCheck className="w-4 h-4 text-white"/>
              User Information
            </h1>
            <div className="flex flex-col gap-1 mb-2 text-sm">
              <div>Username: {user?.username}</div>
              <div>Password: {user?.password}</div>
            </div>
            <div className="flex flex-row-reverse">
              <Suspense fallback={<div>Loading...</div>}>
                <LogoutEvent/>
              </Suspense>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h1 className="flex items-center text-xs font-bold text-gray-400 mb-2 uppercase">
            Server list
          </h1>
          {user?.serverlist?.length ? (
              user.serverlist.map((server, index) => (
                  <Suspense fallback={<div>Loading...</div>} key={server}>
                    <Card index={index} server={server} data={serverData[index]} />
                  </Suspense>
              ))
          ) : (
              <div>No servers available</div>
          )}
        </div>
      </div>
  );
}
