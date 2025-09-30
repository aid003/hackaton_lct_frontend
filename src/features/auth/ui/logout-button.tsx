'use client';

/**
 * Кнопка выхода из системы
 */

import { signOut } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { LogOut } from 'lucide-react';
import { useUserActions } from '@/shared';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LogoutButton({ variant = 'outline', size = 'default' }: LogoutButtonProps) {
  const { resetUser } = useUserActions();
  const handleClick = () => {
    resetUser();
    void signOut({ callbackUrl: '/login' });
  };
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleClick}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Выйти
    </Button>
  );
}
