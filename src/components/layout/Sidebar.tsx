import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionProvider';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Sidebar = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const user = session?.user;
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center text-primary dark:text-white">BRISK</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" end className={navLinkClasses}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/accounts" className={navLinkClasses}>
          <Wallet className="w-5 h-5 mr-3" />
          Cuentas
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;