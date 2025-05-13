import { Home, LogIn, LogOut, FileText, Search, ClipboardList, Printer, Receipt } from "lucide-react";
import { IconName } from "./sidebarConfig";

interface SidebarIconProps {
  name: IconName;
  size?: number;
}

export const SidebarIcon = ({ name, size = 20 }: SidebarIconProps) => {
  const icons: Record<IconName, React.ReactNode> = {
    'home': <Home size={size} />,
    'log-in': <LogIn size={size} />,
    'log-out': <LogOut size={size} />,
    'file-text': <FileText size={size} />,
    'search': <Search size={size} />,
    'request': <ClipboardList size={size} />,
    'printer': <Printer size={size} />,
    'receipt': <Receipt size={size} />,
  };

  return icons[name];
}; 