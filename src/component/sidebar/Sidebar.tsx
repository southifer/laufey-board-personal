import React, {useState, createContext, useContext, ReactNode, Suspense, lazy, useEffect} from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  LayoutDashboard,
  SquareTerminal,
  Bot,
  PackageCheck
} from "lucide-react";
import { useLocation } from 'react-router-dom';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
}

const LogoutEvent = lazy(() => import('../../api/LogoutEvent'));

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const storedIsOpen = localStorage.getItem('sidebarState') === 'true';
  const [isOpen, setIsOpen] = useState<boolean>(storedIsOpen);
  
  useEffect(() => {
    localStorage.setItem('sidebarState', isOpen ? 'true' : 'false');
  }, [isOpen]);
  
  const sidebarWidth = isOpen ? 256 : 64;
  
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error('Sidebar must be used within a SidebarProvider');
  }
  
  const { isOpen, setIsOpen } = context;
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Controller', icon: SquareTerminal, href: '/controller' },
    { name: 'Bot', icon: Bot, href: '/bot' },
    { name: 'Config', icon: PackageCheck, href: '/config' },
  ];
  
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full flex flex-col border-r border-secondary bg-[#18181B] transition-all duration-1550 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <h2
          className={`p-2 text-2xl text-gray-900 dark:text-gray-100 transition-opacity duration-500 ${
            !isOpen ? 'opacity-0 hidden' : 'opacity-100'
          }`}
        >
          Laufey
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 hover:bg-secondary focus:outline-none"
        >
          {isOpen ? (
            <PanelRightOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <PanelRightClose className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="relative group">
              <a
                href={item.href}
                className={`flex items-center rounded p-4 text-gray-400  ${pathname === item.href ? 'bg-main text-[#09EF69]' : 'hover:bg-main'} transition-all duration-500 ${
                  isOpen ? 'justify-start' : 'justify-center'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0`} />
                {isOpen && <span className="ml-3 text-sm font-medium ">{item.name}</span>}
              </a>
              {!isOpen && (
                <div className="absolute left-full top-0 ml-6 hidden group-hover:block rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-gray-400 dark:bg-gray-700">
                  {item.name}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="flex flex-col-reverse text-gray-400 p-4">
        <Suspense fallback={null}>
          <div className="p-2 rounded-lg flex flex-row gap-2 hover:bg-main transition-all duration-500">
            <LogoutEvent isOpen={isOpen} />
          </div>
        </Suspense>
      </div>
    </aside>
  );
};

export default Sidebar;
