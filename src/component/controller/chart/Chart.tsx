import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@mui/material";
import { useState, useEffect } from "react";

interface DataItem {
  details: {
    index: number;
    name: string;
    gems: number;
    obtained_gems: number;
  };
}

interface LineChartComponentProps {
  dataObject: DataItem[];
}

const chartConfig = {
  gems: {
    label: "Gems",
    color: "#FC8F54",  // Custom color for the line
  },
  obtained: {
    label: "Obtained Gems",
    color: "#00FF9C",  // Custom color for the line
  },
};

export function LineChartComponent({ dataObject }: LineChartComponentProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const filterData = () => {
      return dataObject?.map((item) => ({
        id: item.details.index,
        username: item.details.name,
        gems: item.details.gems,
        obtained: item.details.obtained_gems,
      }));
    };
    
    const filteredData = filterData();
    setChartData(filteredData);
  }, [dataObject]);
  
  return (
    <div className="mb-2 mt-4">
      <Card className="max-w-full mx-auto" style={{backgroundColor: '#0A0A0A'}}>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="5 5" stroke="#555"/>
              <XAxis dataKey="id" tickLine={false} axisLine={{stroke: "#555"}}/>
              <YAxis tickLine={false} axisLine={{stroke: "#555"}} tickMargin={2} tick={{fontSize: 14}}/>
              <Tooltip contentStyle={{backgroundColor: "#333", borderRadius: "4px"}}/>
              <Legend wrapperStyle={{color: "#ffffff"}}/>
              <Line type="monotone" dataKey="gems" stroke={chartConfig.gems.color} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="obtained" stroke={chartConfig.obtained.color} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  
  );
}