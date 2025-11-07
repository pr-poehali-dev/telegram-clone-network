import { useState } from 'react';
import AuthScreen from '@/components/AuthScreen';
import MessengerScreen from '@/components/MessengerScreen';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ phone: string; name: string } | null>(null);

  const handleAuthSuccess = (phone: string) => {
    setUser({ phone, name: phone });
    setIsAuthenticated(true);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {!isAuthenticated ? (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      ) : (
        <MessengerScreen user={user!} />
      )}
    </div>
  );
}