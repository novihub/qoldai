import { PrismaClient, UserRole, TicketStatus, TicketPriority, Channel, Language, CallDirection, CallStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password once
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============ USERS ============
  console.log('👤 Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@novitech.dev' },
    update: {},
    create: {
      email: 'admin@novitech.dev',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  });

  const maxOperator = await prisma.user.upsert({
    where: { email: 'ceo@novitech.dev' },
    update: {},
    create: {
      email: 'ceo@novitech.dev',
      password: hashedPassword,
      name: 'Максим Оператор',
      role: UserRole.OPERATOR,
    },
  });

  const alisherOperator = await prisma.user.upsert({
    where: { email: 'alisher@novitech.dev' },
    update: {},
    create: {
      email: 'alisher@novitech.dev',
      password: hashedPassword,
      name: 'Алишер Оператор',
      role: UserRole.OPERATOR,
    },
  });

  const maxClient = await prisma.user.upsert({
    where: { email: 'max.client@novitech.dev' },
    update: {},
    create: {
      email: 'max.client@novitech.dev',
      password: hashedPassword,
      name: 'Максим Добрый Клиент',
      role: UserRole.CLIENT,
    },
  });

  const alisherClient = await prisma.user.upsert({
    where: { email: 'alisher.client@novitech.dev' },
    update: {},
    create: {
      email: 'alisher.client@novitech.dev',
      password: hashedPassword,
      name: 'Алишер Злой Клиент',
      role: UserRole.CLIENT,
    },
  });

  const aiBot = await prisma.user.upsert({
    where: { email: 'ai@novitech.dev' },
    update: {},
    create: {
      email: 'ai@novitech.dev',
      password: hashedPassword,
      name: 'QoldAI Bot',
      role: UserRole.OPERATOR,
    },
  });

  console.log('✅ Users created');

  // ============ DEPARTMENTS ============
  console.log('🏢 Creating departments...');

  const itSupport = await prisma.department.upsert({
    where: { name: 'IT Support' },
    update: {},
    create: {
      name: 'IT Support',
      description: 'Technical support and IT issues',
      operators: {
        connect: [{ id: maxOperator.id }, { id: alisherOperator.id }, { id: aiBot.id }],
      },
    },
  });

  const hr = await prisma.department.upsert({
    where: { name: 'HR' },
    update: {},
    create: {
      name: 'HR',
      description: 'Human Resources',
      operators: {
        connect: [{ id: maxOperator.id }],
      },
    },
  });

  const general = await prisma.department.upsert({
    where: { name: 'General' },
    update: {},
    create: {
      name: 'General',
      description: 'General inquiries',
      operators: {
        connect: [{ id: alisherOperator.id }],
      },
    },
  });

  console.log('✅ Departments created');

  // ============ TICKETS (15 total) ============
  console.log('🎫 Creating tickets...');

  // Helper function to create ticket with messages
  const createTicketWithMessages = async (ticketData: any, messages: Array<{ senderId: string; content: string; isAi?: boolean }>) => {
    const ticket = await prisma.ticket.create({
      data: ticketData,
    });

    for (const msg of messages) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: msg.senderId,
          content: msg.content,
          isAiGenerated: msg.isAi || false,
        },
      });
    }

    return ticket;
  };

  // RUSSIAN TICKETS (5) - 2 positive, 3 negative
  // 1. RU - Positive - RESOLVED
  await createTicketWithMessages(
    {
      subject: 'Не работает VPN',
      description: 'Здравствуйте! Не могу подключиться к корпоративному VPN. Помогите, пожалуйста.',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.HIGH,
      channel: Channel.WEB,
      language: Language.RU,
      clientId: maxClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'VPN/Network',
      aiSentiment: 'neutral',
      aiSummary: 'Клиент не может подключиться к корпоративному VPN',
      resolvedAt: new Date('2025-12-05T14:30:00'),
    },
    [
      { senderId: maxClient.id, content: 'Не могу подключиться к VPN уже час' },
      { senderId: maxOperator.id, content: 'Здравствуйте! Проверьте, пожалуйста, правильность логина и пароля' },
      { senderId: maxClient.id, content: 'Спасибо, все заработало!' },
    ]
  );

  // 2. RU - Negative - OPEN
  await createTicketWithMessages(
    {
      subject: 'СРОЧНО! Принтер не печатает!',
      description: 'Это просто кошмар! Принтер не печатает уже третий день! Я не могу работать!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.URGENT,
      channel: Channel.EMAIL,
      language: Language.RU,
      clientId: alisherClient.id,
      departmentId: itSupport.id,
      aiCategory: 'Hardware/Printer',
      aiSentiment: 'negative',
      aiSummary: 'Клиент крайне недоволен, принтер не работает третий день',
      aiSuggestedReply: 'Приносим извинения за неудобства. Мы направим специалиста в течение часа для устранения проблемы.',
    },
    [
      { senderId: alisherClient.id, content: 'Когда уже исправите?! Я жду уже три дня!' },
      { senderId: aiBot.id, content: 'Приносим извинения. Специалист будет направлен в течение часа.', isAi: true },
    ]
  );

  // 3. RU - Positive - CLOSED
  await createTicketWithMessages(
    {
      subject: 'Восстановление пароля от почты',
      description: 'Забыл пароль от корпоративной почты. Можете помочь восстановить?',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.RU,
      clientId: maxClient.id,
      operatorId: alisherOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Email/Password',
      aiSentiment: 'positive',
      aiSummary: 'Запрос на восстановление пароля от корпоративной почты',
      resolvedAt: new Date('2025-12-04T10:20:00'),
    },
    [
      { senderId: maxClient.id, content: 'Забыл пароль от почты' },
      { senderId: alisherOperator.id, content: 'Отправил вам ссылку для сброса пароля на личный email' },
      { senderId: maxClient.id, content: 'Получил, спасибо большое!' },
    ]
  );

  // 4. RU - Negative - IN_PROGRESS
  await createTicketWithMessages(
    {
      subject: 'Медленный интернет',
      description: 'Интернет тормозит невыносимо! Невозможно работать! Сделайте что-нибудь!',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      channel: Channel.PHONE,
      language: Language.RU,
      clientId: alisherClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Network/Performance',
      aiSentiment: 'negative',
      aiSummary: 'Жалоба на низкую скорость интернет-соединения',
    },
    [
      { senderId: alisherClient.id, content: 'Скорость ужасная! Что происходит?' },
      { senderId: maxOperator.id, content: 'Проверяем сетевое оборудование, ожидайте' },
    ]
  );

  // 5. RU - Negative - OPEN
  await createTicketWithMessages(
    {
      subject: 'Не устанавливается программа',
      description: 'Пытаюсь установить 1С, выдает ошибку. Уже все перепробовал!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.RU,
      clientId: alisherClient.id,
      departmentId: itSupport.id,
      aiCategory: 'Software/Installation',
      aiSentiment: 'negative',
      aiSummary: 'Проблема с установкой программы 1С',
      aiSuggestedReply: 'Пожалуйста, предоставьте скриншот ошибки для диагностики проблемы.',
    },
    [
      { senderId: alisherClient.id, content: 'Выдает ошибку при установке, что делать?' },
    ]
  );

  // KAZAKH TICKETS (5) - 3 positive, 2 negative
  // 6. KZ - Positive - RESOLVED
  await createTicketWithMessages(
    {
      subject: 'Email қолжетімді емес',
      description: 'Сәлеметсіз бе! Email-ға кіре алмай жатырмын. Көмектесе аласыз ба?',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.KZ,
      clientId: maxClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Email/Access',
      aiSentiment: 'neutral',
      aiSummary: 'Клиент не может получить доступ к электронной почте',
      resolvedAt: new Date('2025-12-03T16:45:00'),
    },
    [
      { senderId: maxClient.id, content: 'Email ашылмайды' },
      { senderId: maxOperator.id, content: 'Парольді қайта теріп көріңіз' },
      { senderId: maxClient.id, content: 'Рахмет, жұмыс істеп тұр!' },
    ]
  );

  // 7. KZ - Negative - OPEN
  await createTicketWithMessages(
    {
      subject: 'Компьютер өте баяу жұмыс істейді',
      description: 'Компьютер мүлдем тежеліп тұр! Қосылуы 10 минут алады! Бұл қалай?!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      channel: Channel.PHONE,
      language: Language.KZ,
      clientId: alisherClient.id,
      departmentId: itSupport.id,
      aiCategory: 'Hardware/Performance',
      aiSentiment: 'negative',
      aiSummary: 'Жалоба на медленную работу компьютера',
      aiSuggestedReply: 'Специалист придет для диагностики в ближайшее время.',
    },
    [
      { senderId: alisherClient.id, content: 'Компьютер өте баяу! Не істеу керек?' },
      { senderId: aiBot.id, content: 'Маман жақын арада келеді.', isAi: true },
    ]
  );

  // 8. KZ - Positive - CLOSED
  await createTicketWithMessages(
    {
      subject: 'Жаңа бағдарламаны орнату',
      description: 'Zoom бағдарламасын орнатуға көмек керек.',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      channel: Channel.WEB,
      language: Language.KZ,
      clientId: maxClient.id,
      operatorId: alisherOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Software/Installation',
      aiSentiment: 'positive',
      aiSummary: 'Запрос на помощь с установкой Zoom',
      resolvedAt: new Date('2025-12-02T11:00:00'),
    },
    [
      { senderId: maxClient.id, content: 'Zoom қалай орнатамын?' },
      { senderId: alisherOperator.id, content: 'Сілтемені жібердім, орнатып көріңіз' },
      { senderId: maxClient.id, content: 'Орнатылды, рахмет!' },
    ]
  );

  // 9. KZ - Positive - IN_PROGRESS
  await createTicketWithMessages(
    {
      subject: 'Wi-Fi қосылуға көмек',
      description: 'Ұялы телефоннан Wi-Fi-ға қосыла алмай жатырмын.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.MEDIUM,
      channel: Channel.EMAIL,
      language: Language.KZ,
      clientId: maxClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Network/WiFi',
      aiSentiment: 'neutral',
      aiSummary: 'Проблема с подключением к Wi-Fi с мобильного устройства',
    },
    [
      { senderId: maxClient.id, content: 'Телефон Wi-Fi-ды көрмейді' },
      { senderId: maxOperator.id, content: 'Желі атауы мен құпия сөзін тексеріп жатырмын' },
    ]
  );

  // 10. KZ - Negative - OPEN
  await createTicketWithMessages(
    {
      subject: 'Жаңарту қатесі',
      description: 'Windows жаңартуы орнатылмайды! Қате шығады! Шұғыл көмек!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.URGENT,
      channel: Channel.WEB,
      language: Language.KZ,
      clientId: alisherClient.id,
      departmentId: itSupport.id,
      aiCategory: 'Software/Updates',
      aiSentiment: 'negative',
      aiSummary: 'Ошибка при установке обновлений Windows',
      aiSuggestedReply: 'Біз қатені тексереміз және жақын арада шешім табамыз.',
    },
    [
      { senderId: alisherClient.id, content: 'Windows жаңартылмайды! Қате!' },
    ]
  );

  // ENGLISH TICKETS (5) - 3 positive, 2 negative
  // 11. EN - Positive - RESOLVED
  await createTicketWithMessages(
    {
      subject: 'Need access to shared drive',
      description: 'Hello! I need access to the marketing shared drive. Can you help?',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.EN,
      clientId: maxClient.id,
      operatorId: alisherOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Access/Permissions',
      aiSentiment: 'positive',
      aiSummary: 'Request for access to shared drive',
      resolvedAt: new Date('2025-12-05T09:15:00'),
    },
    [
      { senderId: maxClient.id, content: 'I need access to the marketing folder' },
      { senderId: alisherOperator.id, content: 'Access granted. Please check now.' },
      { senderId: maxClient.id, content: 'Perfect! Thank you!' },
    ]
  );

  // 12. EN - Negative - WAITING_CLIENT
  await createTicketWithMessages(
    {
      subject: 'SOFTWARE LICENSE EXPIRED!!!',
      description: 'My Adobe license expired and I CANNOT WORK! This is unacceptable!',
      status: TicketStatus.WAITING_CLIENT,
      priority: TicketPriority.URGENT,
      channel: Channel.EMAIL,
      language: Language.EN,
      clientId: alisherClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Software/License',
      aiSentiment: 'negative',
      aiSummary: 'Клиент недоволен истекшей лицензией Adobe',
    },
    [
      { senderId: alisherClient.id, content: 'My license expired! I need it NOW!' },
      { senderId: maxOperator.id, content: 'Please provide your Adobe account email for renewal' },
      { senderId: aiBot.id, content: 'We are processing your license renewal request.', isAi: true },
    ]
  );

  // 13. EN - Positive - CLOSED
  await createTicketWithMessages(
    {
      subject: 'How to set up email signature',
      description: 'Could you please help me set up my email signature?',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      channel: Channel.WEB,
      language: Language.EN,
      clientId: maxClient.id,
      operatorId: alisherOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Email/Configuration',
      aiSentiment: 'positive',
      aiSummary: 'Помощь с настройкой подписи электронной почты',
      resolvedAt: new Date('2025-12-01T14:30:00'),
    },
    [
      { senderId: maxClient.id, content: 'Need help with email signature' },
      { senderId: alisherOperator.id, content: 'Here is the guide: [link to instructions]' },
      { senderId: maxClient.id, content: 'Got it, thanks!' },
      { senderId: alisherOperator.id, content: 'You\'re welcome!' },
    ]
  );

  // 14. EN - Negative - OPEN
  await createTicketWithMessages(
    {
      subject: 'Keyboard not working properly',
      description: 'Some keys on my keyboard don\'t work. Very frustrating! Need replacement ASAP!',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      channel: Channel.PHONE,
      language: Language.EN,
      clientId: alisherClient.id,
      departmentId: itSupport.id,
      aiCategory: 'Hardware/Keyboard',
      aiSentiment: 'negative',
      aiSummary: 'Клавиатура работает некорректно, требуется замена',
      aiSuggestedReply: 'We will arrange a keyboard replacement within 24 hours.',
    },
    [
      { senderId: alisherClient.id, content: 'Keyboard broken! Letters missing when typing!' },
      { senderId: aiBot.id, content: 'We will arrange a replacement keyboard for you.', isAi: true },
    ]
  );

  // 15. EN - Positive - RESOLVED
  await createTicketWithMessages(
    {
      subject: 'Request for software installation',
      description: 'Hi! Could you please install Microsoft Teams on my computer?',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      channel: Channel.WEB,
      language: Language.EN,
      clientId: maxClient.id,
      operatorId: maxOperator.id,
      departmentId: itSupport.id,
      aiCategory: 'Software/Installation',
      aiSentiment: 'positive',
      aiSummary: 'Запрос на установку Microsoft Teams',
      resolvedAt: new Date('2025-12-06T10:00:00'),
    },
    [
      { senderId: maxClient.id, content: 'Can you install Teams for me?' },
      { senderId: maxOperator.id, content: 'Sure! Installing it now.' },
      { senderId: maxOperator.id, content: 'Done! Teams is installed and ready to use.' },
      { senderId: maxClient.id, content: 'Awesome, thank you so much!' },
    ]
  );

  console.log('✅ Tickets created');

  // ============ CALL LOGS (5) ============
  console.log('📞 Creating call logs...');

  // 1. COMPLETED
  await prisma.callLog.create({
    data: {
      callId: 'KCELL-CALL-001',
      phone: '+77001234567',
      diversion: '1234',
      direction: CallDirection.IN,
      status: CallStatus.COMPLETED,
      userId: 'max_operator_ext',
      ext: '101',
      groupRealName: 'IT Support',
      startedAt: new Date('2025-12-06T09:00:00'),
      answeredAt: new Date('2025-12-06T09:00:15'),
      endedAt: new Date('2025-12-06T09:03:15'),
      duration: 180,
      recordingUrl: 'https://vpbx.kcell.kz/recordings/KCELL-CALL-001.mp3',
      transcription: 'Клиент: Здравствуйте, не работает интернет.\nОператор: Добрый день! Сейчас проверим. Какой у вас адрес?\nКлиент: Офис 405.\nОператор: Понял, проверяю... Проблема в роутере, перезагружаю.\nКлиент: Спасибо, заработало!',
      aiSummary: 'Клиент сообщил о проблеме с интернетом. Оператор диагностировал проблему с роутером и решил перезагрузкой.',
      aiSentiment: 'positive',
      rating: 5,
      operatorId: maxOperator.id,
    },
  });

  // 2. MISSED
  await prisma.callLog.create({
    data: {
      callId: 'KCELL-CALL-002',
      phone: '+77002345678',
      diversion: '1234',
      direction: CallDirection.IN,
      status: CallStatus.MISSED,
      userId: null,
      ext: null,
      groupRealName: 'IT Support',
      startedAt: new Date('2025-12-06T10:30:00'),
      endedAt: new Date('2025-12-06T10:30:45'),
      duration: 0,
    },
  });

  // 3. CANCELLED
  await prisma.callLog.create({
    data: {
      callId: 'KCELL-CALL-003',
      phone: '+77003456789',
      diversion: '1234',
      direction: CallDirection.IN,
      status: CallStatus.CANCELLED,
      userId: 'alisher_operator_ext',
      ext: '102',
      groupRealName: 'IT Support',
      startedAt: new Date('2025-12-06T11:15:00'),
      endedAt: new Date('2025-12-06T11:15:10'),
      duration: 0,
      operatorId: alisherOperator.id,
    },
  });

  // 4. INCOMING
  await prisma.callLog.create({
    data: {
      callId: 'KCELL-CALL-004',
      phone: '+77004567890',
      diversion: '1234',
      direction: CallDirection.IN,
      status: CallStatus.INCOMING,
      userId: null,
      ext: null,
      groupRealName: 'IT Support',
      startedAt: new Date('2025-12-06T12:00:00'),
      duration: 0,
    },
  });

  // 5. ACCEPTED
  await prisma.callLog.create({
    data: {
      callId: 'KCELL-CALL-005',
      phone: '+77005678901',
      diversion: '1234',
      direction: CallDirection.IN,
      status: CallStatus.ACCEPTED,
      userId: 'max_operator_ext',
      ext: '101',
      groupRealName: 'IT Support',
      startedAt: new Date('2025-12-06T13:00:00'),
      answeredAt: new Date('2025-12-06T13:00:08'),
      duration: 0,
      operatorId: maxOperator.id,
    },
  });

  console.log('✅ Call logs created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
