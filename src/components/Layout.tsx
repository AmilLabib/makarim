import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, CalendarCheck, Briefcase, Calendar } from "lucide-react";

const Layout: React.FC = () => {
  const location = useLocation();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { path: "/todos", label: "Tasks", icon: <CheckSquare size={18} /> },
    { path: "/jobs", label: "Jobs", icon: <Briefcase size={18} /> },
    { path: "/absen", label: "Absen", icon: <CalendarCheck size={18} /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
          <div className="mb-10">
            <h1 className="text-xl font-medium text-gray-900 tracking-tight">
              Makarim OS
            </h1>
            <p className="text-xs text-gray-500 mt-1">{today}</p>
          </div>
          
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-gray-100">
             <div className="text-[10px] text-gray-400 uppercase tracking-widest">
              Minimalist Freelance OS
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
