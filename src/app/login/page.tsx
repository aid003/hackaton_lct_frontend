/**
 * Страница авторизации
 */

import { LoginForm } from '@/features';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md px-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Вход в систему</CardTitle>
            <CardDescription>
              Введите свои учетные данные для доступа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Город 6 - LCT Хакатон</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


