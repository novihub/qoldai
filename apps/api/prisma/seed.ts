import { PrismaClient, UserRole, TicketStatus, TicketPriority, Channel, Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Очистка существующих данных (в правильном порядке)
  await prisma.ticketMessage.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.department.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Хэширование паролей
  const passwordHash = await bcrypt.hash('password123', 10);

  // Создание системного пользователя для AI сообщений
  const aiBot = await prisma.user.create({
    data: {
      email: 'ai-bot@qoldai.kz',
      name: 'QoldAI Bot',
      password: passwordHash,
      role: UserRole.OPERATOR,
      emailVerified: new Date(),
    },
  });

  // Создание пользователей
  const admin = await prisma.user.create({
    data: {
      email: 'admin@qoldai.kz',
      name: 'Админ Системы',
      password: passwordHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const operator1 = await prisma.user.create({
    data: {
      email: 'operator@qoldai.kz',
      name: 'Айдана Оператор',
      password: passwordHash,
      role: UserRole.OPERATOR,
      emailVerified: new Date(),
    },
  });

  const operator2 = await prisma.user.create({
    data: {
      email: 'support@qoldai.kz',
      name: 'Арман Поддержка',
      password: passwordHash,
      role: UserRole.OPERATOR,
      emailVerified: new Date(),
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: 'client@example.com',
      name: 'Нурлан Клиент',
      password: passwordHash,
      role: UserRole.CLIENT,
      emailVerified: new Date(),
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Асель Пользователь',
      password: passwordHash,
      role: UserRole.CLIENT,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created users');

  // Создание департаментов
  const techSupport = await prisma.department.create({
    data: {
      name: 'Техническая поддержка',
      description: 'Помощь с техническими вопросами и проблемами',
    },
  });

  const billing = await prisma.department.create({
    data: {
      name: 'Биллинг и оплата',
      description: 'Вопросы по счетам, оплате и подпискам',
    },
  });

  const general = await prisma.department.create({
    data: {
      name: 'Общие вопросы',
      description: 'Общая информация и консультации',
    },
  });

  const sales = await prisma.department.create({
    data: {
      name: 'Продажи',
      description: 'Информация о продуктах и услугах',
    },
  });

  console.log('✅ Created departments');

  // Создание тикетов
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: 'Не могу войти в аккаунт',
      description: 'Не могу войти в свой аккаунт. Пишет "неверный пароль", хотя я уверен что ввожу правильно.',
      clientId: client1.id,
      operatorId: operator1.id,
      departmentId: techSupport.id,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      channel: Channel.WEB,
      language: Language.RU,
      aiCategory: 'Авторизация',
      aiSentiment: 'negative',
      aiSummary: 'Клиент не может войти в аккаунт, ошибка "неверный пароль" при правильных данных.',
      messages: {
        create: [
          {
            content: 'Здравствуйте! Я не могу войти в свой аккаунт. Пишет "неверный пароль", хотя я уверен что ввожу правильно. Помогите пожалуйста!',
            senderId: client1.id,
            isAiGenerated: false,
          },
          {
            content: 'Здравствуйте! Я получил ваше обращение и уже работаю над решением. Ваша проблема связана с авторизацией - это частый вопрос, и я постараюсь помочь вам как можно быстрее. Пожалуйста, ожидайте ответа оператора.',
            senderId: aiBot.id,
            isAiGenerated: true,
          },
          {
            content: 'Добрый день! Я проверил ваш аккаунт. Попробуйте сбросить пароль через форму восстановления. Если не поможет - напишите, я сброшу вручную.',
            senderId: operator1.id,
            isAiGenerated: false,
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: 'Вопрос по оплате подписки',
      description: 'Хотела уточнить, какие способы оплаты вы принимаете? И есть ли скидки для студентов?',
      clientId: client2.id,
      departmentId: billing.id,
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.RU,
      aiCategory: 'Оплата',
      aiSentiment: 'neutral',
      aiSummary: 'Клиент интересуется способами оплаты и наличием скидок.',
      messages: {
        create: [
          {
            content: 'Добрый день! Хотела уточнить, какие способы оплаты вы принимаете? И есть ли скидки для студентов?',
            senderId: client2.id,
            isAiGenerated: false,
          },
          {
            content: 'Здравствуйте! Спасибо за обращение. Ваш вопрос касается оплаты - это важная тема, и я помогу разобраться. Оператор скоро предоставит подробную информацию о способах оплаты и скидках.',
            senderId: aiBot.id,
            isAiGenerated: true,
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      subject: 'Приложение вылетает при запуске',
      description: 'СРОЧНО! Приложение падает сразу после запуска! Ничего не могу сделать, работа стоит!',
      clientId: client1.id,
      operatorId: operator2.id,
      departmentId: techSupport.id,
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.URGENT,
      channel: Channel.WEB,
      language: Language.RU,
      aiCategory: 'Баг',
      aiSentiment: 'negative',
      aiSummary: 'Критическая проблема - приложение крашится. Решено обновлением версии.',
      resolvedAt: new Date(),
      messages: {
        create: [
          {
            content: 'СРОЧНО! Приложение падает сразу после запуска! Ничего не могу сделать, работа стоит!',
            senderId: client1.id,
            isAiGenerated: false,
          },
          {
            content: 'Здравствуйте! Я вижу что у вас критическая проблема с приложением. Это приоритетное обращение, и оператор свяжется с вами в ближайшее время.',
            senderId: aiBot.id,
            isAiGenerated: true,
          },
          {
            content: 'Здравствуйте! Это известная проблема в версии 2.1.0. Пожалуйста, обновите приложение до версии 2.1.1 - проблема исправлена.',
            senderId: operator2.id,
            isAiGenerated: false,
          },
          {
            content: 'Спасибо огромное! Обновил, всё работает!',
            senderId: client1.id,
            isAiGenerated: false,
          },
        ],
      },
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      subject: 'Қызметті қалай қосуға болады?',
      description: 'Сәлеметсіз бе! Қызметті қалай қосуға болады? Толық ақпарат берсеңіз.',
      clientId: client2.id,
      departmentId: general.id,
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      channel: Channel.WEB,
      language: Language.KZ,
      aiCategory: 'Консультация',
      aiSentiment: 'positive',
      aiSummary: 'Клиент интересуется подключением услуги на казахском языке.',
      messages: {
        create: [
          {
            content: 'Сәлеметсіз бе! Қызметті қалай қосуға болады? Толық ақпарат берсеңіз.',
            senderId: client2.id,
            isAiGenerated: false,
          },
          {
            content: 'Сәлеметсіз бе! Сіздің өтінішіңізді қабылдадым. Оператор жақын арада сізге толық ақпарат береді.',
            senderId: aiBot.id,
            isAiGenerated: true,
          },
        ],
      },
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      subject: 'Запрос на интеграцию с CRM',
      description: 'Мы рассматриваем ваш сервис для нашей компании. Есть ли возможность интеграции с нашей CRM (Битрикс24)?',
      clientId: client1.id,
      departmentId: sales.id,
      status: TicketStatus.WAITING_CLIENT,
      priority: TicketPriority.MEDIUM,
      channel: Channel.EMAIL,
      language: Language.RU,
      aiCategory: 'Интеграция',
      aiSentiment: 'positive',
      aiSummary: 'B2B клиент интересуется API интеграцией с их CRM системой.',
      messages: {
        create: [
          {
            content: 'Добрый день! Мы рассматриваем ваш сервис для нашей компании. Есть ли возможность интеграции с нашей CRM (Битрикс24)? Нужна документация по API.',
            senderId: client1.id,
            isAiGenerated: false,
          },
          {
            content: 'Здравствуйте! Благодарим за интерес к нашему сервису. Ваш запрос передан в отдел продаж, менеджер свяжется с вами для обсуждения интеграции.',
            senderId: aiBot.id,
            isAiGenerated: true,
          },
          {
            content: 'Добрый день! Да, у нас есть готовая интеграция с Битрикс24. Отправляю вам документацию на почту. Также могу организовать демо-звонок для обсуждения деталей. Когда вам удобно?',
            senderId: operator1.id,
            isAiGenerated: false,
          },
        ],
      },
    },
  });

  console.log('✅ Created tickets with messages');

  // Добавляем больше тикетов для красивых графиков
  const additionalTickets = [
    // Тикеты за последние 7 дней для timeline графика
    { subject: 'Не работает функция экспорта', days: 0, status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: 'technical', sentiment: 'negative', channel: Channel.WEB },
    { subject: 'Вопрос по тарифам', days: 0, status: TicketStatus.OPEN, priority: TicketPriority.LOW, category: 'billing', sentiment: 'neutral', channel: Channel.EMAIL },
    { subject: 'Ошибка 500 при загрузке', days: 1, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.URGENT, category: 'technical', sentiment: 'negative', channel: Channel.WEB },
    { subject: 'Как изменить пароль?', days: 1, status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, category: 'account', sentiment: 'neutral', channel: Channel.TELEGRAM, resolved: true },
    { subject: 'Проблема с уведомлениями', days: 1, status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, category: 'technical', sentiment: 'negative', channel: Channel.WEB },
    { subject: 'Спасибо за помощь!', days: 2, status: TicketStatus.CLOSED, priority: TicketPriority.LOW, category: 'general', sentiment: 'positive', channel: Channel.WEB, resolved: true },
    { subject: 'Не приходят письма', days: 2, status: TicketStatus.RESOLVED, priority: TicketPriority.HIGH, category: 'technical', sentiment: 'negative', channel: Channel.EMAIL, resolved: true },
    { subject: 'Қолдау қызметі', days: 2, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.MEDIUM, category: 'general', sentiment: 'neutral', channel: Channel.WEB, lang: Language.KZ },
    { subject: 'Refund request', days: 3, status: TicketStatus.RESOLVED, priority: TicketPriority.HIGH, category: 'billing', sentiment: 'negative', channel: Channel.EMAIL, resolved: true, lang: Language.EN },
    { subject: 'API rate limits', days: 3, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.MEDIUM, category: 'technical', sentiment: 'neutral', channel: Channel.WEB, lang: Language.EN },
    { subject: 'Медленная загрузка страниц', days: 3, status: TicketStatus.RESOLVED, priority: TicketPriority.MEDIUM, category: 'technical', sentiment: 'negative', channel: Channel.WEB, resolved: true },
    { subject: 'Возврат средств', days: 4, status: TicketStatus.CLOSED, priority: TicketPriority.HIGH, category: 'billing', sentiment: 'negative', channel: Channel.EMAIL, resolved: true },
    { subject: 'Консультация по продукту', days: 4, status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, category: 'sales', sentiment: 'positive', channel: Channel.TELEGRAM, resolved: true },
    { subject: 'Баг в мобильном приложении', days: 4, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'technical', sentiment: 'negative', channel: Channel.WEB, resolved: true },
    { subject: 'Где найти документацию?', days: 5, status: TicketStatus.CLOSED, priority: TicketPriority.LOW, category: 'general', sentiment: 'neutral', channel: Channel.WEB, resolved: true },
    { subject: 'Не могу скачать отчёт', days: 5, status: TicketStatus.RESOLVED, priority: TicketPriority.MEDIUM, category: 'technical', sentiment: 'negative', channel: Channel.EMAIL, resolved: true },
    { subject: 'Предложение по улучшению', days: 5, status: TicketStatus.CLOSED, priority: TicketPriority.LOW, category: 'general', sentiment: 'positive', channel: Channel.WEB, resolved: true },
    { subject: 'Оплата картой не проходит', days: 6, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'billing', sentiment: 'negative', channel: Channel.WEB, resolved: true },
    { subject: 'Двойное списание', days: 6, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'billing', sentiment: 'negative', channel: Channel.EMAIL, resolved: true },
    { subject: 'Отличный сервис!', days: 6, status: TicketStatus.CLOSED, priority: TicketPriority.LOW, category: 'general', sentiment: 'positive', channel: Channel.TELEGRAM, resolved: true },
  ];

  const clients = [client1, client2];
  const operators = [operator1, operator2];
  const depts = [techSupport, billing, general, sales];

  for (const t of additionalTickets) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - t.days);
    createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const resolvedAt = t.resolved ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null;
    
    await prisma.ticket.create({
      data: {
        subject: t.subject,
        description: `Описание обращения: ${t.subject}`,
        clientId: clients[Math.floor(Math.random() * clients.length)].id,
        operatorId: t.status !== TicketStatus.OPEN ? operators[Math.floor(Math.random() * operators.length)].id : null,
        departmentId: depts[Math.floor(Math.random() * depts.length)].id,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        language: t.lang || Language.RU,
        aiCategory: t.category,
        aiSentiment: t.sentiment,
        createdAt,
        resolvedAt,
        slaDeadline: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ Created ${additionalTickets.length} additional tickets for charts`);

  // Статистика
  console.log('\n📊 Seed Summary:');
  console.log(`   Users: 6 (1 AI bot, 1 admin, 2 operators, 2 clients)`);
  console.log(`   Departments: 4`);
  console.log(`   Tickets: ${5 + additionalTickets.length}`);
  console.log('\n🔐 Test Accounts (password: password123):');
  console.log('   Admin:    admin@qoldai.kz');
  console.log('   Operator: operator@qoldai.kz');
  console.log('   Operator: support@qoldai.kz');
  console.log('   Client:   client@example.com');
  console.log('   Client:   user@example.com');
  console.log('\n✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
