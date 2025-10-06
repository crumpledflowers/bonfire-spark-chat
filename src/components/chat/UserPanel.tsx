import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Shield } from 'lucide-react';

const UserPanel = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const username = user.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-full w-64 flex-col border-l border-border bg-sidebar-background">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <h2 className="text-sm font-semibold text-sidebar-foreground">User Info</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarFallback className="bg-gradient-primary text-white text-2xl">
            {username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h3 className="text-lg font-semibold text-sidebar-foreground mb-1">{username}</h3>
        <p className="text-sm text-muted-foreground mb-6">{user.email}</p>

        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-sidebar-foreground">
            <Shield className="h-4 w-4 text-accent" />
            <span>E2E Encrypted</span>
          </div>

          <Button
            onClick={signOut}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
