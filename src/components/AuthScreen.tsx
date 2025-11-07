import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onAuthSuccess: (phone: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setStep('code');
      setLoading(false);
    }, 1000);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      onAuthSuccess(phone);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center">
            <Icon name="Send" size={64} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-medium mb-2">Telegram</h1>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Пожалуйста, введите номер телефона' 
              : 'Введите код, который мы отправили'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <Input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 text-center text-lg bg-card border-border"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={loading || phone.length < 10}
            >
              {loading ? 'Отправка...' : 'Далее'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Код"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 text-center text-lg bg-card border-border tracking-widest"
                maxLength={5}
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={loading || code.length < 5}
            >
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep('phone')}
            >
              Изменить номер
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
