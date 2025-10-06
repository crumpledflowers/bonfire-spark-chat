import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-card p-4">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? 'Select a user to start chatting' : 'Type a message...'}
        disabled={disabled}
        className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
