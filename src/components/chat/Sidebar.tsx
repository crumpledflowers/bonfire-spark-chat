import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Flame } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string | null;
  public_key: string;
}

interface SidebarProps {
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

const Sidebar = ({ selectedUser, onSelectUser }: SidebarProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser?.id);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar-background">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-sidebar-foreground">Bonfire</h1>
      </div>

      <div className="px-4 py-3">
        <h2 className="text-xs font-semibold uppercase text-muted-foreground">Direct Messages</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                selectedUser?.id === user.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">
                {user.username || user.email.split('@')[0]}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
