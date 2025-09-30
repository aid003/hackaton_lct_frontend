/**
 * Страница авторизации
 */

import { LoginForm } from '@/features';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md px-6">
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Вход в систему</h1>
            <p className="text-muted-foreground">
              Введите свои учетные данные для доступа
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Город 6 - LCT Хакатон</p>
          </div>
        </div>
      </div>
    </div>
  );
}
