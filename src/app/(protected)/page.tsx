"use client";

import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LogoutButton } from "@/features";
import { useUser } from "@/shared";
import Image from "next/image";

export default function Home() {
  const user = useUser();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="absolute top-4 right-4 flex gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>

      {/* Информация о пользователе */}
      <div className="absolute top-4 left-4 bg-card border rounded-lg px-4 py-2 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Авторизован как:{" "}
          <span className="font-semibold text-foreground">
            {user?.username || "Гость"}
          </span>
        </p>
      </div>
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div className="bg-card border rounded-lg p-6 shadow-lg max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">🎉 Авторизация настроена!</h2>
          <ol className="font-mono list-inside list-decimal text-sm/6 space-y-2">
            <li className="tracking-[-.01em]">
              ✅ NextAuth v5 с CredentialsProvider
            </li>
            <li className="tracking-[-.01em]">
              ✅ Middleware защищает маршруты
            </li>
            <li className="tracking-[-.01em]">✅ Bcrypt хеширование паролей</li>
            <li className="tracking-[-.01em]">
              ✅ TypeScript строгая типизация
            </li>
          </ol>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-2">
              📝 Данные для входа (тест):
            </p>
            <code className="text-xs block">
              Username: admin
              <br />
              Password: admin123
            </code>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Смотрите{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded">
              AUTH_SETUP.md
            </code>{" "}
            для подробной информации
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
