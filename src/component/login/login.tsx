import React, {useState} from "react";
import { ScanFace } from "lucide-react";
import { supabase } from '../../lib/supabase'
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Authenticating...");
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError;
      if (!authData.user?.email) throw new Error("No email found.");

      const { data: userData, error: userError } = await supabase
        .from('user_data')
        .select('username, password, isadmin, serverlist, routerlist, bot_backup')
        .eq('username', authData.user.email)
        .single()

      if (userError) throw userError;

      localStorage.setItem("userRecord", JSON.stringify(userData));
      toast.success(userData.isadmin ? `Welcome ${userData.username}!` : `Welcome ${userData.username}`);

      Cookies.set("auth_token", authData.session?.access_token, {
        expires: 1,
        path: '/',
        sameSite: 'Strict',
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    }
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-main">
        <div className="w-full max-w-md bg-main p-6 rounded shadow-md border border-secondary">
          <div className="flex flex-row gap-1 items-center mb-2">
            <ScanFace className="w-6 h-6 text-white"/>
            <h1 className="text-lg text-white">Welcome</h1>
          </div>
          <form onSubmit={onSubmit}>
            <div className="mb-2">
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                id="text"
                placeholder="Username"
                className="bg-main text-sm text-white rounded block w-full p-2.5 outline-none border border-secondary"
              />
            </div>
            <div className="mb-6">
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="password"
                placeholder="Password"
                className="bg-main text-sm text-white rounded block w-full p-2.5 outline-none border border-secondary"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
  );
};

export default Login;