"use client";

/**
 * Форма логина
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { useUserActions } from "@/shared";

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useUserActions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверное имя пользователя или пароль");
        setIsLoading(false);
        return;
      }

      // Обновляем user-store из сессии
      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (sessionRes.ok) {
        const data: {
          user?: {
            id?: string;
            username?: string;
            name?: string | null;
          } | null;
        } = await sessionRes.json();
        const u = data.user;
        if (u && u.id && u.username) {
          setUser({
            id: u.id,
            username: u.username,
            name: u.name ?? undefined,
          });
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="username">Имя пользователя</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Вход..." : "Войти"}
      </Button>
    </form>
  );
}
