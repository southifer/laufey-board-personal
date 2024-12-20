import React from "react";

interface StatisticNumber {
    totalOnline: number;
    totalOffline: number;
    totalBanned: number;
    totalGems: number;
    totalObtained: number;
    totalCaptcha: number;
}

const StatisticsPanel = ({ statistic }: { statistic: StatisticNumber }) => {
    return (
      <div style={{ padding: "10px" }}>
        <h4>Statistics</h4>
        <p>Total Online: {statistic.totalOnline}</p>
        <p>Total Offline: {statistic.totalOffline}</p>
        <p>Total Banned: {statistic.totalBanned}</p>
        <p>Total Gems: {statistic.totalGems}</p>
        <p>Total Obtained: {statistic.totalObtained}</p>
        <p>Total Captcha: {statistic.totalCaptcha}</p>
      </div>
    );
  };
  
  export default StatisticsPanel;