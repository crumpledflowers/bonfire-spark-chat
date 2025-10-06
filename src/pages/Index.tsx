import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Flame, Shield, Lock, Zap } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-fade-in">
        <Flame className="h-12 w-12 text-white" />
      </div>

      <h1 className="mb-4 text-5xl font-bold text-foreground animate-fade-in">
        Welcome to Bonfire
      </h1>
      <p className="mb-8 max-w-md text-center text-lg text-muted-foreground animate-fade-in">
        Secure, encrypted messaging powered by end-to-end encryption. Your conversations, your privacy.
      </p>

      <div className="mb-12 flex gap-4 animate-fade-in">
        <Button
          onClick={() => navigate('/signup')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
        >
          Get Started
        </Button>
        <Button
          onClick={() => navigate('/login')}
          variant="outline"
          className="border-border text-foreground hover:bg-secondary"
        >
          Sign In
        </Button>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-elevated">
          <Shield className="mx-auto mb-3 h-8 w-8 text-accent" />
          <h3 className="mb-2 font-semibold text-foreground">End-to-End Encryption</h3>
          <p className="text-sm text-muted-foreground">
            Messages are encrypted on your device using X25519 cryptography
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-elevated">
          <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold text-foreground">Zero Knowledge</h3>
          <p className="text-sm text-muted-foreground">
            Your private keys never leave your device
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-elevated">
          <Zap className="mx-auto mb-3 h-8 w-8 text-accent" />
          <h3 className="mb-2 font-semibold text-foreground">Real-time Sync</h3>
          <p className="text-sm text-muted-foreground">
            Instant message delivery with live updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
