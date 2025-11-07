import { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

interface MessengerScreenProps {
  user: {
    phone: string;
    name: string;
  };
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  type: 'personal' | 'group';
  participants?: number;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: string;
  time: string;
  read: boolean;
  own: boolean;
}

export default function MessengerScreen({ user }: MessengerScreenProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>('1');

  const initialChats: Chat[] = [
    {
      id: '1',
      name: 'Ыыы скам ыыы нфт',
      avatar: '👥',
      lastMessage: 'Вы: @Attackyastrebb потом еще в лс отпиши',
      time: '20:08',
      unread: undefined,
      type: 'group',
      participants: 4
    },
    {
      id: '2',
      name: 'People Searcher',
      avatar: '🔍',
      lastMessage: '🎉 Найдено 257 человек с подарками! 🎁 Сложность: ...',
      time: 'Чт',
      type: 'personal',
      online: true
    },
    {
      id: '3',
      name: 'terrifor #WPS rep 25+',
      avatar: '💀',
      lastMessage: 'окак',
      time: '19:50',
      type: 'personal'
    },
    {
      id: '4',
      name: '#WPS INTELEGENTS',
      avatar: '🧠',
      lastMessage: 'terrifor #WPS rep 25+: нзт',
      time: '20:08',
      unread: 14,
      type: 'group'
    },
    {
      id: '5',
      name: '🛸 Шерлок 💥 Sherlock',
      avatar: '🔎',
      lastMessage: '10 человек осталось 🙏',
      time: '19:47',
      type: 'personal'
    },
    {
      id: '6',
      name: 'Архив',
      avatar: '📁',
      lastMessage: 'BotFather, DarkHole, Paul Du Rove, MRKT, VIRU...',
      time: '',
      type: 'personal'
    }
  ];

  const [chats, setChats] = useState<Chat[]>(initialChats);

  const initialMessages: Message[] = [
    {
      id: '1',
      chatId: '1',
      text: 'я те кидал уже',
      sender: 'terrifor #WPS rep 25+',
      time: '19:52',
      read: true,
      own: false
    },
    {
      id: '2',
      chatId: '1',
      text: 'фото',
      sender: 'User',
      time: '19:52',
      read: true,
      own: false
    },
    {
      id: '3',
      chatId: '1',
      text: 'Ирина Владимировна какая-то',
      sender: 'terrifor #WPS rep 25+',
      time: '19:53',
      read: true,
      own: false
    },
    {
      id: '4',
      chatId: '1',
      text: 'волоскова',
      sender: 'User',
      time: '19:53',
      read: true,
      own: false
    },
    {
      id: '5',
      chatId: '1',
      text: 'я те кидал уже\nну я сам решил найти в осинте развиваюсь',
      sender: 'terrifor #WPS rep 25+',
      time: '19:57',
      read: true,
      own: true
    },
    {
      id: '6',
      chatId: '1',
      text: 'ща мать поищу',
      sender: user.name,
      time: '19:52',
      read: true,
      own: true
    },
    {
      id: '7',
      chatId: '1',
      text: 'я еще раз нашел',
      sender: user.name,
      time: '19:53',
      read: true,
      own: true
    }
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSendMessage = (text: string, chatId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      text,
      sender: user.name,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      own: true
    };
    setMessages([...messages, newMessage]);
    
    setChats(chats.map(chat => 
      chat.id === chatId 
        ? { ...chat, lastMessage: `Вы: ${text}`, time: newMessage.time }
        : chat
    ));
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const chatMessages = messages.filter(m => m.chatId === selectedChatId);

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatList 
        chats={chats} 
        selectedChatId={selectedChatId} 
        onSelectChat={setSelectedChatId}
      />
      {selectedChat && (
        <ChatWindow
          chat={selectedChat}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUser={user.name}
        />
      )}
    </div>
  );
}
