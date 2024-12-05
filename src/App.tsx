import React, { lazy, Suspense, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { UserProvider } from './context/UserContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../src/component/sidebar/Sidebar';
import { SidebarProvider } from '../src/component/sidebar/Sidebar';
import { SidebarContext } from '../src/component/sidebar/Sidebar';

const Login = lazy(() => import('./component/login/login'));
const Dashboard = lazy(() => import('./component/dashboard/dashboard'));
const Controller = lazy(() => import('./component/controller/controller'));
const BotManagement = lazy(() => import('./component/bot/BotManagement'));

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error('AppContent must be used within a SidebarProvider');
  }
  
  const { sidebarWidth } = context;
  
  return (
    <div className="flex">
      {!isLoginPage && <Sidebar/>}
      <div
        className="flex-grow transition-all duration-150 "
        style={{marginLeft: isLoginPage ? 0 : sidebarWidth}}
      >
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/controller"
              element={
                <ProtectedRoute>
                  <Controller/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bot"
              element={
                <ProtectedRoute>
                  <BotManagement/>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <SidebarProvider>
      <UserProvider>
        <Router>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              className: 'dark:bg-[#0A0A0A] dark:text-white dark:border dark:border-[#262626] text-sm',
            }}
          />
          <AppContent />
        </Router>
      </UserProvider>
    </SidebarProvider>
  );
}

export default App;
