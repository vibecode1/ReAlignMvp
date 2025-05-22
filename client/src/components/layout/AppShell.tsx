
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import NotificationPermission from "@/components/notifications/NotificationPermission";

export default function AppShell() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {user && <Sidebar />}
      
      <main className={`flex-1 overflow-auto ${user ? 'ml-64' : ''}`}>
        <Outlet />
        <Toaster />
        {user && <NotificationPermission />}
      </main>
    </div>
  );
}
