import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import Sidebar from '@/components/chat/Sidebar';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import UserPanel from '@/components/chat/UserPanel';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  username: string | null;
  public_key: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  ciphertext: string;
  created_at: string;
  decryptedText?: string;
}

const Chat = () => {
  const { user, privateKey, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user:', error);
        return;
      }

      setCurrentUserData(data);
    };

    fetchCurrentUserData();
  }, [user]);

  // Fetch and decrypt messages
  useEffect(() => {
    if (!selectedUser || !privateKey || !currentUserData) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          try {
            const isSent = msg.sender_id === user?.id;
            const otherUserKey = isSent ? selectedUser.public_key : selectedUser.public_key;
            
            const decryptedText = await decryptMessage(
              msg.ciphertext,
              otherUserKey,
              privateKey
            );

            return { ...msg, decryptedText };
          } catch (error) {
            console.error('Error decrypting message:', error);
            return { ...msg, decryptedText: '[Decryption failed]' };
          }
        })
      );

      setMessages(decryptedMessages);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id}))`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          try {
            const decryptedText = await decryptMessage(
              newMessage.ciphertext,
              selectedUser.public_key,
              privateKey
            );

            setMessages((prev) => [...prev, { ...newMessage, decryptedText }]);
          } catch (error) {
            console.error('Error decrypting new message:', error);
            setMessages((prev) => [...prev, { ...newMessage, decryptedText: '[Decryption failed]' }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, user, privateKey, currentUserData]);

  const handleSendMessage = async (message: string) => {
    if (!selectedUser || !privateKey || !currentUserData) return;

    try {
      // Encrypt message
      const encryptedMessage = await encryptMessage(
        message,
        selectedUser.public_key,
        privateKey
      );

      // Send to database
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: selectedUser.id,
        ciphertext: encryptedMessage,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      
      <div className="flex flex-1 flex-col">
        {selectedUser ? (
          <>
            <div className="flex h-16 items-center border-b border-border bg-card px-6">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedUser.username || selectedUser.email.split('@')[0]}
              </h2>
            </div>
            <MessageList messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Bonfire</h2>
              <p className="text-muted-foreground">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <UserPanel />
    </div>
  );
};

export default Chat;
