import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define a User data type
interface UserData {
  username: string;
  password: string;
  isadmin: boolean;
  serverlist: string[];
  routerlist: string[];
  bot_backup: string[];
}

interface UserContextType {
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// UserContext provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  // Get the user data from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('userRecord');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
      <UserContext.Provider value={{ user, setUser }}>
        {children}
      </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};