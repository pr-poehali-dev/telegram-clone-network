import { useState } from 'react';
import AuthScreen from '@/components/AuthScreen';
import TelegramApp from '@/components/TelegramApp';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ phone: string; name: string; userId: string } | null>(null);

  const handleAuthSuccess = (phone: string, userId: string) => {
    setUser({ phone, name: phone, userId });
    setIsAuthenticated(true);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0e1419]">
      {!isAuthenticated ? (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      ) : (
        <TelegramApp user={user!} />
      )}
    </div>
  );
}