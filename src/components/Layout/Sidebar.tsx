
import { NavLink } from "react-router-dom";
import { Calendar, User, Users, Clock, PieChart, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Clock className="w-5 h-5" />,
      access: ["employee", "admin"]
    },
    {
      name: "Check In/Out",
      path: "/check-in",
      icon: <Calendar className="w-5 h-5" />,
      access: ["employee", "admin"]
    },
    {
      name: "My Attendance",
      path: "/attendance",
      icon: <Calendar className="w-5 h-5" />,
      access: ["employee", "admin"]
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <PieChart className="w-5 h-5" />,
      access: ["admin"]
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <Users className="w-5 h-5" />,
      access: ["admin"]
    },
    {
      name: "Manual Attendance",
      path: "/manual-attendance",
      icon: <Edit className="w-5 h-5" />,
      access: ["admin"]
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: <User className="w-5 h-5" />,
      access: ["employee", "admin"]
    }
  ];

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return cn(
      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
      isActive 
        ? "bg-brand-100 text-brand-700 font-medium" 
        : "text-gray-600 hover:bg-gray-100"
    );
  };

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 w-64 fixed h-full z-20 transition-transform duration-300 ease-in-out",
        isOpen ? "transform-none" : "-translate-x-full lg:transform-none"
      )}
    >
      <div className="py-6 px-4">
        <h2 className="text-xl font-bold text-brand-700 mb-6">FaceTrack</h2>
        
        <nav className="space-y-1">
          {navLinks
            .filter(link => link.access.includes(user?.role || ""))
            .map((link) => (
              <NavLink 
                key={link.path} 
                to={link.path} 
                className={getNavLinkClass} 
                end={link.path === "/"}
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
