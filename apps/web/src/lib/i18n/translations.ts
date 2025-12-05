export const translations = {
  ru: {
    // Common
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      close: 'Закрыть',
      back: 'Назад',
      send: 'Отправить',
      search: 'Поиск',
      filter: 'Фильтр',
      all: 'Все',
      yes: 'Да',
      no: 'Нет',
    },

    // Navigation
    nav: {
      myTickets: 'Мои обращения',
      newTicket: 'Новое обращение',
      operatorPanel: 'Панель оператора',
      logout: 'Выйти',
    },

    // Auth
    auth: {
      login: 'Войти',
      register: 'Регистрация',
      email: 'Email',
      password: 'Пароль',
      name: 'Имя',
      signIn: 'Войти',
      signUp: 'Зарегистрироваться',
      forgotPassword: 'Забыли пароль?',
      orContinueWith: 'Или продолжить через',
      welcomeBack: 'Добро пожаловать',
      createAccount: 'Создать аккаунт',
      alreadyHaveAccount: 'Уже есть аккаунт?',
      dontHaveAccount: 'Нет аккаунта?',
      verifyEmail: 'Подтвердите email',
      enterCode: 'Введите код из письма',
      resendCode: 'Отправить код повторно',
    },

    // Tickets
    tickets: {
      title: 'Мои обращения',
      newTicket: 'Новое обращение',
      createTicket: 'Создать обращение',
      subject: 'Тема',
      description: 'Описание',
      status: 'Статус',
      priority: 'Приоритет',
      category: 'Категория',
      created: 'Создано',
      updated: 'Обновлено',
      noTickets: 'У вас пока нет обращений',
      createFirst: 'Создайте первое обращение',
      messages: 'Сообщения',
      writeMessage: 'Напишите сообщение...',
      aiSuggestion: 'Подсказка ИИ',
      useSuggestion: 'Использовать',
      rejectSuggestion: 'Отклонить',
      problemDescription: 'Описание проблемы',
      ticketInfo: 'Информация',
      client: 'Клиент',
      operator: 'Оператор',
      channel: 'Канал',
      language: 'Язык',
      slaDeadline: 'SLA Дедлайн',
      resolved: 'Решено',
      aiAnalysis: 'ИИ Анализ',
      sentiment: 'Настроение',
      summary: 'Резюме',
      generateSummary: 'Сгенерировать',
      summaryNotCreated: 'Резюме ещё не создано. Нажмите "Сгенерировать" для создания.',
      suggestedReply: 'Предложенный ответ',
      useAsReply: 'Использовать как ответ',
      autoReply: 'Автоматический ответ ИИ',
      attachFiles: 'Прикрепить файлы',
    },

    // Statuses
    status: {
      OPEN: 'Открыт',
      IN_PROGRESS: 'В работе',
      WAITING_CLIENT: 'Ожидает ответа',
      WAITING_OPERATOR: 'Ожидает оператора',
      RESOLVED: 'Решён',
      CLOSED: 'Закрыт',
    },

    // Priorities
    priority: {
      LOW: 'Низкий',
      MEDIUM: 'Средний',
      HIGH: 'Высокий',
      URGENT: 'Срочный',
    },

    // Sentiments
    sentiment: {
      positive: '😊 Позитивное',
      neutral: '😐 Нейтральное',
      negative: '😟 Негативное',
    },

    // Operator Panel
    operator: {
      title: 'Панель оператора',
      subtitle: 'Управляйте обращениями клиентов с помощью ИИ-ассистента',
      totalTickets: 'Всего',
      openTickets: 'Открытые',
      inProgress: 'В работе',
      resolvedTickets: 'Решённые',
      urgentTickets: 'Срочные',
      avgResolutionTime: 'Ср. время решения',
      aiClassification: 'AI Классификация',
      autoResolution: 'Авто-решение',
      responseTime: 'Время отклика',
      slaCompliance: 'SLA Compliance',
      goal: 'Цель',
      current: 'Текущее',
      tickets: 'тикетов',
      avgFirstResponse: 'Среднее время до первого ответа',
      slaBreaches: 'нарушений SLA',
      languageDistribution: 'Языки обращений',
      channelDistribution: 'Каналы обращений',
      sentimentDistribution: 'Настроение клиентов',
      allStatuses: 'Все статусы',
      allPriorities: 'Все приоритеты',
      searchPlaceholder: 'Поиск по теме или описанию...',
      noTicketsFound: 'Нет обращений по заданным фильтрам',
      open: 'Открыть',
      take: 'Взять',
      actions: 'Действия',
    },

    // Languages
    languages: {
      ru: 'Русский',
      kz: 'Қазақша',
      en: 'English',
    },

    // Channels
    channels: {
      web: 'Web',
      email: 'Email',
      telegram: 'Telegram',
    },

    // New Ticket Page
    newTicket: {
      description: 'Опишите вашу проблему, и наш ИИ автоматически классифицирует её и подберёт оптимальное решение',
      helpText: 'Заполните форму ниже. Чем подробнее вы опишете проблему, тем быстрее мы сможем помочь.',
      subjectPlaceholder: 'Например: Не работает оплата на сайте',
      descriptionPlaceholder: 'Подробно опишите вашу проблему...',
      aiAssistant: 'ИИ-ассистент',
      aiInfo: 'После создания обращения наш ИИ автоматически определит категорию, приоритет и предложит первичное решение.',
    },

    // Home
    home: {
      title: 'QoldAI',
      subtitle: 'Интеллектуальная система поддержки клиентов',
      signIn: 'Войти',
      signUp: 'Регистрация',
    },

    // Errors
    errors: {
      somethingWrong: 'Что-то пошло не так',
      tryAgain: 'Попробовать снова',
      notFound: 'Не найдено',
      accessDenied: 'Доступ запрещён',
      invalidCredentials: 'Неверный email или пароль',
    },
  },

  kz: {
    // Common
    common: {
      loading: 'Жүктелуде...',
      error: 'Қате',
      success: 'Сәтті',
      save: 'Сақтау',
      cancel: 'Болдырмау',
      delete: 'Жою',
      edit: 'Өңдеу',
      close: 'Жабу',
      back: 'Артқа',
      send: 'Жіберу',
      search: 'Іздеу',
      filter: 'Сүзгі',
      all: 'Барлығы',
      yes: 'Иә',
      no: 'Жоқ',
    },

    // Navigation
    nav: {
      myTickets: 'Менің өтініштерім',
      newTicket: 'Жаңа өтініш',
      operatorPanel: 'Оператор панелі',
      logout: 'Шығу',
    },

    // Auth
    auth: {
      login: 'Кіру',
      register: 'Тіркелу',
      email: 'Email',
      password: 'Құпия сөз',
      name: 'Аты',
      signIn: 'Кіру',
      signUp: 'Тіркелу',
      forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
      orContinueWith: 'Немесе арқылы жалғастыру',
      welcomeBack: 'Қош келдіңіз',
      createAccount: 'Аккаунт жасау',
      alreadyHaveAccount: 'Аккаунтыңыз бар ма?',
      dontHaveAccount: 'Аккаунтыңыз жоқ па?',
      verifyEmail: 'Email растау',
      enterCode: 'Хаттағы кодты енгізіңіз',
      resendCode: 'Кодты қайта жіберу',
    },

    // Tickets
    tickets: {
      title: 'Менің өтініштерім',
      newTicket: 'Жаңа өтініш',
      createTicket: 'Өтініш жасау',
      subject: 'Тақырып',
      description: 'Сипаттама',
      status: 'Күйі',
      priority: 'Басымдық',
      category: 'Санат',
      created: 'Жасалды',
      updated: 'Жаңартылды',
      noTickets: 'Сізде әлі өтініштер жоқ',
      createFirst: 'Бірінші өтінішті жасаңыз',
      messages: 'Хабарламалар',
      writeMessage: 'Хабарлама жазыңыз...',
      aiSuggestion: 'AI кеңесі',
      useSuggestion: 'Қолдану',
      rejectSuggestion: 'Қабылдамау',
      problemDescription: 'Мәселе сипаттамасы',
      ticketInfo: 'Ақпарат',
      client: 'Клиент',
      operator: 'Оператор',
      channel: 'Арна',
      language: 'Тіл',
      slaDeadline: 'SLA мерзімі',
      resolved: 'Шешілді',
      aiAnalysis: 'AI талдау',
      sentiment: 'Көңіл-күй',
      summary: 'Түйіндеме',
      generateSummary: 'Жасау',
      summaryNotCreated: 'Түйіндеме әлі жасалмаған. "Жасау" батырмасын басыңыз.',
      suggestedReply: 'Ұсынылған жауап',
      useAsReply: 'Жауап ретінде қолдану',
      autoReply: 'AI автоматты жауабы',
      attachFiles: 'Файлдарды тіркеу',
    },

    // Statuses
    status: {
      OPEN: 'Ашық',
      IN_PROGRESS: 'Орындалуда',
      WAITING_CLIENT: 'Жауап күтуде',
      WAITING_OPERATOR: 'Оператор күтуде',
      RESOLVED: 'Шешілді',
      CLOSED: 'Жабық',
    },

    // Priorities
    priority: {
      LOW: 'Төмен',
      MEDIUM: 'Орташа',
      HIGH: 'Жоғары',
      URGENT: 'Шұғыл',
    },

    // Sentiments
    sentiment: {
      positive: '😊 Жағымды',
      neutral: '😐 Бейтарап',
      negative: '😟 Жағымсыз',
    },

    // Operator Panel
    operator: {
      title: 'Оператор панелі',
      subtitle: 'AI көмекшісімен клиент өтініштерін басқарыңыз',
      totalTickets: 'Барлығы',
      openTickets: 'Ашық',
      inProgress: 'Орындалуда',
      resolvedTickets: 'Шешілген',
      urgentTickets: 'Шұғыл',
      avgResolutionTime: 'Орт. шешу уақыты',
      aiClassification: 'AI жіктеу',
      autoResolution: 'Авто-шешу',
      responseTime: 'Жауап уақыты',
      slaCompliance: 'SLA сәйкестігі',
      goal: 'Мақсат',
      current: 'Ағымдағы',
      tickets: 'өтініш',
      avgFirstResponse: 'Бірінші жауапқа дейінгі орташа уақыт',
      slaBreaches: 'SLA бұзушылықтары',
      languageDistribution: 'Өтініш тілдері',
      channelDistribution: 'Өтініш арналары',
      sentimentDistribution: 'Клиент көңіл-күйі',
      allStatuses: 'Барлық күйлер',
      allPriorities: 'Барлық басымдықтар',
      searchPlaceholder: 'Тақырып немесе сипаттама бойынша іздеу...',
      noTicketsFound: 'Сүзгілер бойынша өтініштер табылмады',
      open: 'Ашу',
      take: 'Алу',
      actions: 'Әрекеттер',
    },

    // Languages
    languages: {
      ru: 'Русский',
      kz: 'Қазақша',
      en: 'English',
    },

    // Channels
    channels: {
      web: 'Web',
      email: 'Email',
      telegram: 'Telegram',
    },

    // New Ticket Page
    newTicket: {
      description: 'Мәселеңізді сипаттаңыз, біздің AI оны автоматты түрде жіктеп, оңтайлы шешім ұсынады',
      helpText: 'Төмендегі форманы толтырыңыз. Мәселені неғұрлым егжей-тегжейлі сипаттасаңыз, соғұрлым тезірек көмектесе аламыз.',
      subjectPlaceholder: 'Мысалы: Сайтта төлем жұмыс істемейді',
      descriptionPlaceholder: 'Мәселеңізді егжей-тегжейлі сипаттаңыз...',
      aiAssistant: 'AI көмекші',
      aiInfo: 'Өтініш жасағаннан кейін біздің AI автоматты түрде санатты, басымдықты анықтап, алғашқы шешімді ұсынады.',
    },

    // Home
    home: {
      title: 'QoldAI',
      subtitle: 'Интеллектуалды клиенттерді қолдау жүйесі',
      signIn: 'Кіру',
      signUp: 'Тіркелу',
    },

    // Errors
    errors: {
      somethingWrong: 'Бірдеңе дұрыс болмады',
      tryAgain: 'Қайталап көріңіз',
      notFound: 'Табылмады',
      accessDenied: 'Қатынас тыйым салынған',
      invalidCredentials: 'Қате email немесе құпия сөз',
    },
  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      send: 'Send',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      yes: 'Yes',
      no: 'No',
    },

    // Navigation
    nav: {
      myTickets: 'My Tickets',
      newTicket: 'New Ticket',
      operatorPanel: 'Operator Panel',
      logout: 'Logout',
    },

    // Auth
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      forgotPassword: 'Forgot password?',
      orContinueWith: 'Or continue with',
      welcomeBack: 'Welcome Back',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      verifyEmail: 'Verify Email',
      enterCode: 'Enter the code from email',
      resendCode: 'Resend code',
    },

    // Tickets
    tickets: {
      title: 'My Tickets',
      newTicket: 'New Ticket',
      createTicket: 'Create Ticket',
      subject: 'Subject',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      category: 'Category',
      created: 'Created',
      updated: 'Updated',
      noTickets: 'You have no tickets yet',
      createFirst: 'Create your first ticket',
      messages: 'Messages',
      writeMessage: 'Write a message...',
      aiSuggestion: 'AI Suggestion',
      useSuggestion: 'Use',
      rejectSuggestion: 'Reject',
      problemDescription: 'Problem Description',
      ticketInfo: 'Information',
      client: 'Client',
      operator: 'Operator',
      channel: 'Channel',
      language: 'Language',
      slaDeadline: 'SLA Deadline',
      resolved: 'Resolved',
      aiAnalysis: 'AI Analysis',
      sentiment: 'Sentiment',
      summary: 'Summary',
      generateSummary: 'Generate',
      summaryNotCreated: 'Summary not created yet. Click "Generate" to create.',
      suggestedReply: 'Suggested Reply',
      useAsReply: 'Use as reply',
      autoReply: 'AI Auto-Reply',
      attachFiles: 'Attach files',
    },

    // Statuses
    status: {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      WAITING_CLIENT: 'Waiting for Client',
      WAITING_OPERATOR: 'Waiting for Operator',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
    },

    // Priorities
    priority: {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      URGENT: 'Urgent',
    },

    // Sentiments
    sentiment: {
      positive: '😊 Positive',
      neutral: '😐 Neutral',
      negative: '😟 Negative',
    },

    // Operator Panel
    operator: {
      title: 'Operator Panel',
      subtitle: 'Manage customer requests with AI assistant',
      totalTickets: 'Total',
      openTickets: 'Open',
      inProgress: 'In Progress',
      resolvedTickets: 'Resolved',
      urgentTickets: 'Urgent',
      avgResolutionTime: 'Avg Resolution Time',
      aiClassification: 'AI Classification',
      autoResolution: 'Auto-Resolution',
      responseTime: 'Response Time',
      slaCompliance: 'SLA Compliance',
      goal: 'Goal',
      current: 'Current',
      tickets: 'tickets',
      avgFirstResponse: 'Average time to first response',
      slaBreaches: 'SLA breaches',
      languageDistribution: 'Request Languages',
      channelDistribution: 'Request Channels',
      sentimentDistribution: 'Customer Sentiment',
      allStatuses: 'All Statuses',
      allPriorities: 'All Priorities',
      searchPlaceholder: 'Search by subject or description...',
      noTicketsFound: 'No tickets found for given filters',
      open: 'Open',
      take: 'Take',
      actions: 'Actions',
    },

    // Languages
    languages: {
      ru: 'Русский',
      kz: 'Қазақша',
      en: 'English',
    },

    // Channels
    channels: {
      web: 'Web',
      email: 'Email',
      telegram: 'Telegram',
    },

    // New Ticket Page
    newTicket: {
      description: 'Describe your problem and our AI will automatically classify it and find the optimal solution',
      helpText: 'Fill out the form below. The more details you provide, the faster we can help.',
      subjectPlaceholder: 'Example: Payment not working on website',
      descriptionPlaceholder: 'Describe your problem in detail...',
      aiAssistant: 'AI Assistant',
      aiInfo: 'After creating a ticket, our AI will automatically determine the category, priority and suggest an initial solution.',
    },

    // Home
    home: {
      title: 'QoldAI',
      subtitle: 'Intelligent Customer Support System',
      signIn: 'Sign In',
      signUp: 'Sign Up',
    },

    // Errors
    errors: {
      somethingWrong: 'Something went wrong',
      tryAgain: 'Try again',
      notFound: 'Not found',
      accessDenied: 'Access denied',
      invalidCredentials: 'Invalid email or password',
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations['ru'];

// Helper type for translation values
export type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type Translations = DeepStringify<TranslationKeys>;
