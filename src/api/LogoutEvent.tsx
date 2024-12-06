import Cookies from "js-cookie";
import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import React from "react";

interface LogoutEventProps {
  isOpen: boolean;
}

const LogoutEvent: React.FC<LogoutEventProps> = ({ isOpen }) => {
  const handleLogout = () => {
    toast.success("Logged Out!");
    localStorage.removeItem("userRecord");
    Cookies.remove("auth_token");
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center white gap-2 ${isOpen ? 'justify-start' : 'justify-center'}`}
    >
      <LogOut className="w-5 h-5 white hover:white transition duration-150 flex-shrink-0"/>
      {isOpen && 'Logout'}
    </button>
  );
};

export default LogoutEvent;