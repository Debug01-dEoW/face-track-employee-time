
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between z-10">
      <div className="flex items-center">
        <Button onClick={toggleSidebar} variant="ghost" size="icon" className="lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </Button>
        <Link to="/" className="font-bold text-xl text-brand-700 ml-2 lg:ml-0">FaceTrack</Link>
      </div>
      
      {user && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <User size={16} />
            <span className="hidden md:inline">{user.name}</span>
          </Button>
          
          <Button onClick={logout} variant="ghost" size="icon">
            <LogOut size={16} />
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
