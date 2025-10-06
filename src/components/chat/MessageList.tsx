import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  ciphertext: string;
  created_at: string;
  decryptedText?: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => {
          const isSent = message.sender_id === user?.id;
          const timestamp = format(new Date(message.created_at), 'HH:mm');

          return (
            <div
              key={message.id}
              className={`flex animate-fade-in ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isSent
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <p className="text-sm break-words">{message.decryptedText || '🔒 Encrypted'}</p>
                <span className="mt-1 block text-xs opacity-70">{timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default MessageList;
