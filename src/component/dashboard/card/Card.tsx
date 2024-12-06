interface CardProps {
  index: number;
  server: string;
  data: User[]; // data should be typed as User[]
}

interface UserDetails {
  status: string;
  gems: number;
  obtained_gems: number;
  google_status: string;
}

interface User {
  details: UserDetails;
}

interface Statistic {
  totalOnline: number;
  totalOffline: number;
  totalBanned: number;
  totalGems: number;
  totalObtained: number;
  totalCaptcha: number;
  totalBot: number; // Added totalBot to track the number of bots
}

const Card: React.FC<CardProps> = ({ index, server, data }) => {
  const FormatNumber = (number: number) => new Intl.NumberFormat().format(number);

  const statisticServer = (data: User[]): Statistic => {
    return data.reduce<Statistic>((acc, user) => {
      const { status, gems, obtained_gems, google_status } = user.details;

      acc.totalGems += gems;
      acc.totalObtained += obtained_gems;

      switch (google_status) {
        case 'captcha_required':
          acc.totalCaptcha += 1;
          break;
      }

      switch (status) {
        case 'connected':
        case 'changing_subserver':
          acc.totalOnline += 1;
          break;
        case 'account_banned':
          acc.totalBanned += 1;
          break;
        default:
          acc.totalOffline += 1;
          break;
      }

      acc.totalBot += 1; // Increment totalBot for each user (assuming all are bots)
      return acc;
    }, { totalOnline: 0, totalOffline: 0, totalBanned: 0, totalGems: 0, totalObtained: 0, totalCaptcha: 0, totalBot: 0 });
  };

  const statistic = data ? statisticServer(data) : null;

  return (
      <div key={index} className="rounded p-4 shadow-md select-none bg-[#18181B]">
        <h3 className="text-sm uppercase mb-2 text-gray-300">🎯 - {server}</h3>
        <div className="select-none text-[14px] sm:text-lg md:text-lg lg:text-lg text-gray-300 rounded items-center space-x-2 p-1.5">
          <span>🤖 {FormatNumber(statistic?.totalBot || 0)}</span>
          <span>✅ {FormatNumber(statistic?.totalOnline || 0)}</span>
          <span>❌ {FormatNumber(statistic?.totalOffline || 0)}</span>
          <span>☠️ {FormatNumber(statistic?.totalBanned || 0)}</span>
          <span>💎 {FormatNumber(statistic?.totalGems || 0)}</span>
          <span>⚜️ {FormatNumber(statistic?.totalObtained || 0)}</span>
        </div>
      </div>
  );
};

export default Card;