import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { UserProvider } from "./context/UserContext";
import { Toaster } from "react-hot-toast";

const Login = lazy(() => import('./component/login/login'));
const Dashboard = lazy(() => import('./component/dashboard/dashboard'));
const Controller = lazy(() => import('./component/controller/controller'));

function App() {
  return (
      <UserProvider>
        <Router>
          <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 5000,
                className: 'dark:bg-[#0A0A0A] dark:text-white dark:border dark:border-[#262626] text-sm',
              }}
          />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/controller"
                  element={
                    <ProtectedRoute>
                      <Controller />
                    </ProtectedRoute>
                  }
              />
            </Routes>
          </Suspense>
        </Router>
      </UserProvider>
  );
}

export default App;