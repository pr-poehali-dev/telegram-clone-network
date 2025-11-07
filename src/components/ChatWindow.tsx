import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import EmojiPicker from './EmojiPicker';
import { Chat, Message } from './MessengerScreen';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (text: string, chatId: string) => void;
  currentUser: string;
}

export default function ChatWindow({ chat, messages, onSendMessage, currentUser }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue, chat.id);
      setInputValue('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(inputValue + emoji);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
            {chat.avatar}
          </div>
          <div>
            <h2 className="font-medium text-sm">{chat.name}</h2>
            {chat.type === 'group' ? (
              <p className="text-xs text-muted-foreground">{chat.participants} участников</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {chat.online ? 'в сети' : 'был(а) недавно'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Icon name="Search" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Icon name="Phone" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%231a1f2c\'/%3E%3Cpath d=\'M50 0L100 50L50 100L0 50z\' fill=\'%231d232e\' opacity=\'.1\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }}
      >
        {messages.map((message, index) => {
          const showSender = !message.own && (
            index === 0 || 
            messages[index - 1].sender !== message.sender ||
            messages[index - 1].own !== message.own
          );

          return (
            <div
              key={message.id}
              className={`flex ${message.own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  message.own
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground'
                }`}
              >
                {showSender && chat.type === 'group' && (
                  <div className="text-xs font-medium mb-1 text-accent">
                    {message.sender}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-xs ${message.own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {message.time}
                  </span>
                  {message.own && (
                    <Icon 
                      name={message.read ? 'CheckCheck' : 'Check'} 
                      size={14} 
                      className={message.read ? 'text-primary-foreground' : 'text-primary-foreground/70'}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
          >
            <Icon name="Paperclip" size={20} />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              className="pr-10 bg-secondary border-0 resize-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Icon name="Smile" size={18} />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>

        {showEmojiPicker && (
          <div className="mt-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
