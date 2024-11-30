import React, { useEffect, useState } from "react";
import Card from "./card/Card";
import { GetBotDetails } from "./api/GetBotDetails";
import {
  TrendingDown,
  TrendingUp,
  Activity,
  UserRoundCheck,
  UserMinus,
  UserRoundX,
  Siren,
  Sparkles,
  SlidersHorizontal,
  Gem,
  ChartSpline,
  QrCode
} from "lucide-react";
import Table from "./table/table";

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
  index: number;
  details: BotDetails
}

interface StatisticNumber {
  totalOnline: number;
  totalOffline: number;
  totalBanned: number;
  totalGems: number;
  totalObtained: number;
  totalCaptcha: number;
}

export default function Controller() {
  const [data, setData] = useState<DataItem[]>([]);  // Explicitly set the type of data to an array of DataItem
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const numberFormat = (number: number) => new Intl.NumberFormat().format(number);
  const serverList: string[] = ['191.96.94.35'];
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const result = await GetBotDetails(serverList);
        if (isMounted) {
          const responseData = result
            .filter((res) => res !== null)
            .map((response, index) =>
              (response?.data as DataItem[]).map((item: DataItem) => ({
                ...item,
                details: {
                  ...item.details,
                  server: serverList[index],
                },
                id: item.details.name
              }))
            )
            .flat();
          
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to fetch data: ${err}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  const statisticNumber = data?.reduce<StatisticNumber>((bots, { details }) => {
    const { status, gems, obtained_gems, google_status } = details;
    
    bots.totalGems += gems;
    bots.totalObtained += obtained_gems;
    
    if (google_status === 'captcha_required') bots.totalCaptcha += 1;
    
    if (status === 'connected' || status === 'changing_subserver') {
      bots.totalOnline += 1;
    } else if (status === 'account_banned') {
      bots.totalBanned += 1;
    } else {
      bots.totalOffline += 1;
    }
    
    return bots;
  }, {
    totalOnline: 0,
    totalOffline: 0,
    totalBanned: 0,
    totalGems: 0,
    totalObtained: 0,
    totalCaptcha: 0,
  }) || { totalOnline: 0, totalOffline: 0, totalBanned: 0, totalGems: 0, totalObtained: 0, totalCaptcha: 0 }; // Fallback value if data is undefined
  
  const bot = loading ? {
    totalOnline: 0,
    totalOffline: 0,
    totalBanned: 0,
    totalGems: 0,
    totalObtained: 0,
    totalCaptcha: 0,
  } : statisticNumber;
  
  return (
    <div className="bg-main text-white p-8 min-h-screen">
      <div className="text-3xl mb-4 font-bold flex gap-2">
        Controller
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full mb-4">
        <Card iconHeader={TrendingUp} headerName="Total Online" iconValue={UserRoundCheck} valueData={numberFormat(bot.totalOnline)}/>
        <Card iconHeader={TrendingDown} headerName="Total Offline" iconValue={UserMinus} valueData={numberFormat(bot.totalOffline)}/>
        <Card iconHeader={Siren} headerName="Total Banned" iconValue={UserRoundX} valueData={numberFormat(bot.totalBanned)}/>
        <Card iconHeader={SlidersHorizontal} headerName="Total Captcha" iconValue={QrCode} valueData={numberFormat(bot.totalCaptcha)}/>
        <Card iconHeader={Activity} headerName="Total Gems" iconValue={Gem} valueData={numberFormat(bot.totalGems)}/>
        <Card iconHeader={ChartSpline} headerName="Obtained Gems" iconValue={Sparkles} valueData={numberFormat(bot.totalObtained)}/>
      </div>
      <div>
        <Table dataObject={data || []}/>
      </div>
    </div>
  );
}