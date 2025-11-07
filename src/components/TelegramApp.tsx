import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import EmojiPicker from './EmojiPicker';

const CHATS_API = 'https://functions.poehali.dev/628587d6-f135-40d3-a212-47d3ffbcd16b';

interface Chat {
  id: number;
  type: string;
  title: string;
  avatar_url?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSender?: string;
  messageCount: number;
}

interface Message {
  id: number;
  text: string;
  createdAt: string;
  edited: boolean;
  replyTo?: number;
  user: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
}

interface TelegramAppProps {
  user: {
    userId: string;
    phone: string;
    name: string;
  };
}

export default function TelegramApp({ user }: TelegramAppProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await fetch(`${CHATS_API}?action=get_chats`, {
        headers: { 'X-User-Id': user.userId }
      });
      const data = await response.json();
      setChats(data.chats || []);
      
      if (data.chats && data.chats.length > 0 && !selectedChatId) {
        setSelectedChatId(data.chats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${CHATS_API}?action=get_messages&chat_id=${chatId}`, {
        headers: { 'X-User-Id': user.userId }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedChatId) return;
    
    setLoading(true);
    try {
      const response = await fetch(CHATS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId
        },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: selectedChatId,
          text: inputValue
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInputValue('');
        await loadMessages(selectedChatId);
        await loadChats();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const getInitials = (title: string) => {
    return title?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const filteredChats = chats.filter(chat =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0e1419]">
      <div className="w-full md:w-[400px] flex flex-col bg-[#1e2329] border-r border-[#2b2f36]">
        <div className="p-4 space-y-4 border-b border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-[#2b2f36] rounded">
              <Icon name="Menu" size={24} className="text-[#8d969e]" />
            </button>
            <div className="text-white text-sm font-medium">Telegram</div>
            <button className="p-2 hover:bg-[#2b2f36] rounded">
              <Icon name="Search" size={20} className="text-[#8d969e]" />
            </button>
          </div>
          
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d969e]" />
            <Input
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0e1419] border-none text-white placeholder:text-[#8d969e] h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#8d969e]">
              <Icon name="MessageSquare" size={48} className="mb-4 opacity-50" />
              <p>Нет чатов</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[#2b2f36] transition-colors ${
                    selectedChatId === chat.id ? 'bg-[#2b2f36]' : ''
                  }`}
                >
                  <div className="h-12 w-12 flex-shrink-0 rounded-full bg-[#5288c1] text-white flex items-center justify-center text-lg font-medium">
                    {getInitials(chat.title)}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white truncate">
                        {chat.title}
                      </span>
                      <span className="text-xs text-[#8d969e] ml-2 flex-shrink-0">
                        {formatChatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#8d969e] truncate">
                        {chat.lastSender && <span>{chat.lastSender}: </span>}
                        {chat.lastMessage || 'Нет сообщений'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-[#0e1419]">
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#2b2f36] bg-[#1e2329]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5288c1] text-white flex items-center justify-center font-medium">
                {getInitials(selectedChat.title)}
              </div>
              <div>
                <h2 className="font-medium text-sm text-white">{selectedChat.title}</h2>
                <p className="text-xs text-[#8d969e]">
                  {selectedChat.type === 'group' ? 'группа' : 'в сети'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8d969e] hover:text-white hover:bg-[#2b2f36]">
                <Icon name="Search" size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8d969e] hover:text-white hover:bg-[#2b2f36]">
                <Icon name="Phone" size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8d969e] hover:text-white hover:bg-[#2b2f36]">
                <Icon name="MoreVertical" size={20} />
              </Button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
          >
            {messages.map((message, index) => {
              const isOwn = message.user.id.toString() === user.userId;
              const showSender = !isOwn && selectedChat.type === 'group' && (
                index === 0 || messages[index - 1].user.id !== message.user.id
              );

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-[#2b5278] text-white'
                        : 'bg-[#1e2329] text-white'
                    }`}
                  >
                    {showSender && (
                      <div className="text-xs font-medium mb-1 text-[#5288c1]">
                        {message.user.username}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs text-[#8d969e]">
                        {formatTime(message.createdAt)}
                      </span>
                      {isOwn && (
                        <Icon name="CheckCheck" size={14} className="text-[#8d969e]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#2b2f36] bg-[#1e2329] px-4 py-3">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0 text-[#8d969e] hover:text-white hover:bg-[#2b2f36]"
              >
                <Icon name="Paperclip" size={20} />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Сообщение..."
                  className="pr-10 bg-[#0e1419] border-none text-white placeholder:text-[#8d969e]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#8d969e] hover:text-white"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Icon name="Smile" size={18} />
                </Button>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || loading}
                size="icon"
                className="h-9 w-9 flex-shrink-0 bg-[#5288c1] hover:bg-[#5288c1]/90"
              >
                <Icon name="Send" size={18} />
              </Button>
            </div>

            {showEmojiPicker && (
              <div className="mt-2">
                <EmojiPicker onEmojiSelect={(emoji) => setInputValue(inputValue + emoji)} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0e1419] text-[#8d969e]">
          <div className="text-center">
            <Icon name="MessageSquare" size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Выберите чат для начала общения</p>
          </div>
        </div>
      )}
    </div>
  );
}
