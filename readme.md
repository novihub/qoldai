# QoldAI - AI Help Desk

**IT FEST 2025 Hackathon Project**

Система поддержки клиентов с AI-классификацией обращений.

## Проблема

Операторы тратят большую часть времени на рутинные вопросы. Клиенты долго ждут ответа.

## Решение

QoldAI автоматически классифицирует обращения, предлагает готовые ответы и работает с несколькими каналами связи.

## Возможности

- AI-классификация тикетов по категории и приоритету (GPT-4o-mini)
- Подсказки ответов для операторов
- Автоматическое резюме переписок
- Анализ тональности обращений
- Мультиязычность: казахский, русский, английский
- Каналы: Web-портал, Email (IMAP)
- Дашборд оператора со статистикой

## Технологии

- Frontend: Next.js 16, React 19, TailwindCSS 4
- Backend: NestJS 11, Prisma 6, PostgreSQL
- AI: OpenAI GPT-4o-mini
- Email: IMAP, Resend API
- Auth: JWT, Google OAuth, GitHub OAuth

## Запуск

```bash
# установка
git clone https://github.com/Novitech-Labs/hackathon-itfest-2025.git
cd hackathon-itfest-2025
npm install

# настройка
cp apps/api/.env.example apps/api/.env
# добавить OPENAI_API_KEY и DATABASE_URL

# база данных
docker-compose -f docker-compose.dev.yml up -d
cd apps/api
npx prisma migrate dev
npx prisma db seed

# запуск
npm run dev
```

Frontend: http://localhost:3000  
API: http://localhost:4000  
Swagger: http://localhost:4000/docs

## Тестовые аккаунты

Пароль для всех: `password123`

- Admin: admin@qoldai.kz
- Operator: operator@qoldai.kz
- Client: client@example.com

## Структура

```
apps/
├── api/          # NestJS backend
│   ├── src/
│   │   ├── auth/     # Авторизация
│   │   ├── ticket/   # Тикеты, AI
│   │   └── mail/     # Email канал
│   └── prisma/       # БД, миграции
└── web/          # Next.js frontend
    └── src/
        ├── app/
        │   ├── tickets/   # Портал клиента
        │   └── operator/  # Дашборд оператора
        └── lib/
            └── i18n.ts    # Переводы
```

## Команда

Novitech Labs

## Лицензия

MIT
