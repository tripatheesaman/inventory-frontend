import { Home, LogIn, LogOut, FileText, Search, ClipboardList, Printer, Receipt, Calendar, Printer as PrintIcon, Users, Settings } from "lucide-react";
import { IconName } from "./sidebarConfig";
import { cn } from "@/utils/utils";

interface SidebarIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export const SidebarIcon = ({ name, size = 20, className }: SidebarIconProps) => {
  const icons: Record<IconName, React.ReactNode> = {
    'home': <Home size={size} className={className} />,
    'log-in': <LogIn size={size} className={className} />,
    'log-out': <LogOut size={size} className={className} />,
    'file-text': <FileText size={size} className={className} />,
    'search': <Search size={size} className={className} />,
    'request': <ClipboardList size={size} className={className} />,
    'printer': <Printer size={size} className={className} />,
    'receipt': <Receipt size={size} className={className} />,
    'calendar': <Calendar size={size} className={className} />,
    'print': <PrintIcon size={size} className={className} />,
    'users': <Users size={size} className={className} />,
    'settings': <Settings size={size} className={className} />,
  };

  return icons[name];
}; 