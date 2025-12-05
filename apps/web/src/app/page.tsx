import Link from 'next/link';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect('/tickets');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              QoldAI
            </h1>
          </div>
          <p className="mt-3 text-lg text-gray-600">
            Интеллектуальная система поддержки клиентов
          </p>
          <p className="mt-2 text-sm text-gray-500">
            AI Help Desk для IT FEST 2025
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 py-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-left shadow-sm">
            <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-medium text-gray-900">ИИ Классификация</h3>
            <p className="text-xs text-gray-500 mt-1">Автоматическое определение категории и приоритета</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-left shadow-sm">
            <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="font-medium text-gray-900">Авто-ответы</h3>
            <p className="text-xs text-gray-500 mt-1">Мгновенные ответы на типовые вопросы</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-left shadow-sm">
            <svg className="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="font-medium text-gray-900">Аналитика</h3>
            <p className="text-xs text-gray-500 mt-1">Статистика и отчёты в реальном времени</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-left shadow-sm">
            <svg className="w-8 h-8 text-yellow-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-gray-900">SLA Контроль</h3>
            <p className="text-xs text-gray-500 mt-1">Отслеживание дедлайнов и эскалация</p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="w-full flex justify-center py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Создать аккаунт
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Разработано командой NOVITECH для IT FEST 2025
        </p>
      </div>
    </main>
  );
}
