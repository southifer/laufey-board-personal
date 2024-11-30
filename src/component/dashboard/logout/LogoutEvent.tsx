import Cookies from "js-cookie";
import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast";

const LogoutEvent: React.FC = () => {
  const handleLogout = () => {
    toast.success("Logged Out!");
    localStorage.removeItem("userRecord");
    Cookies.remove("auth_token");
    window.location.reload();
  };

  return (
    <button
        onClick={handleLogout}
        className="flex items-center text-white"
    >
      <LogOut className="w-5 h-5 text-white hover:text-gray-400 transition duration-150"/>
    </button>
  );
};

export default LogoutEvent;