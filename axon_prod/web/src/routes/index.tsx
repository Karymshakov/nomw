import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/auth-context'
import {
  ArrowRight,
  Bot,
  BarChart3,
  MessageSquare,
  BookOpen,
  Check,
  Zap,
  Target,
  TrendingUp,
  Users,
  Building2,
  Dumbbell,
  ShoppingCart,
  Sparkles,
  Shield,
  Globe,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" />
  return <LandingPage />
}

// ---------------------------------------------------------------------------
// LANDING PAGE ROOT
// ---------------------------------------------------------------------------

function LandingPage() {
  return (
    <div
      className="bg-[#F8FAFF] text-gray-900"
      style={{ fontFamily: "'Ubuntu', system-ui, sans-serif", colorScheme: 'light' }}
    >
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Industries />
      <AIAgentSpotlight />
      <CTASection />
      <Footer />
    </div>
  )
}

// ---------------------------------------------------------------------------
// NAVBAR
// ---------------------------------------------------------------------------

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2461FF] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className="font-bold text-xl text-[#0A1628]"
              style={{ fontFamily: "'Ubuntu', sans-serif" }}
            >
              OmniOS
            </span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Возможности</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">Как это работает</a>
            <a href="#industries" className="hover:text-slate-900 transition-colors">Отрасли</a>
            <a href="#ai-agent" className="hover:text-slate-900 transition-colors">ИИ-агент</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Войти
          </Link>
          <Link to="/register">
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#2461FF] to-[#7C3AED] hover:opacity-90 text-white border-0 shadow-lg shadow-blue-500/20 font-semibold"
            >
              Начать бесплатно
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// HERO
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Animated gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blob-anim-1"
          style={{ background: 'radial-gradient(ellipse, rgba(36,97,255,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-20 -right-40 w-[600px] h-[400px] rounded-full blob-anim-2"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full blob-anim-3"
          style={{ background: 'radial-gradient(ellipse, rgba(36,97,255,0.06) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-blue-200/60">
            <Zap className="w-3 h-3 fill-current" />
            ИИ-CRM нового поколения
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-center text-5xl md:text-6xl lg:text-[72px] font-bold text-[#0A1628] leading-[1.08] tracking-tight mb-6"
          style={{ fontFamily: "'Ubuntu', sans-serif" }}
        >
          CRM, которая{' '}
          <span className="bg-gradient-to-r from-[#2461FF] via-[#5B8EFF] to-[#7C3AED] bg-clip-text text-transparent">
            закрывает сделки
          </span>
          <br />
          пока вы спите
        </h1>

        {/* Subheadline */}
        <p className="text-center text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Автоматически отвечайте на заявки, квалифицируйте лидов и доводите их до оплаты — без участия менеджера
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <Link to="/register">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-[#2461FF] to-[#7C3AED] hover:opacity-90 text-white border-0 shadow-xl shadow-blue-500/25"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-medium border-slate-200 bg-white/70 hover:bg-white text-slate-700"
            >
              Войти
            </Button>
          </Link>
        </div>
        <p className="text-center text-sm text-slate-400 mb-16">Бесплатно · Без кредитной карты · Быстрая настройка</p>

        {/* Dashboard Mockup */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 -inset-y-8 rounded-3xl blur-3xl" style={{ background: 'linear-gradient(to bottom, rgba(36,97,255,0.10), rgba(124,58,237,0.05), transparent)' }} />

          <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/12 border border-slate-200/80 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#F5F6FA] border-b border-slate-200/80">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="flex-1 max-w-xs mx-4 bg-white rounded-full px-4 py-1 text-xs text-slate-400 border border-slate-200 font-mono">
                app.omnios.ai
              </div>
            </div>

            {/* Mock dashboard */}
            <div className="flex h-[360px] overflow-hidden">
              {/* Sidebar */}
              <div className="w-44 bg-[#0A1628] flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-violet-500 rounded-md flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white text-sm font-bold" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
                    OmniOS
                  </span>
                </div>
                <div className="flex-1 p-2 space-y-0.5">
                  {[
                    { label: 'Дашборд', active: true },
                    { label: 'Лиды' },
                    { label: 'Контакты' },
                    { label: 'Сообщения' },
                    { label: 'Настройки' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        item.active ? 'bg-[#2461FF] text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="m-2 p-2.5 rounded-xl bg-gradient-to-r from-[#2461FF]/20 to-[#7C3AED]/20 border border-white/10">
                  <div className="text-[9px] font-bold text-blue-300 mb-0.5 uppercase tracking-wider">ИИ-агент</div>
                  <div className="text-[8px] text-slate-400">3 задачи выполняются</div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 bg-slate-50 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Ubuntu', sans-serif" }}>
                      Дашборд
                    </div>
                    <div className="text-[10px] text-slate-400">Вторник, 24 фев</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    ИИ активен
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Всего лидов', value: '247', trend: '+12%' },
                    { label: 'В воронке', value: '89', trend: '+5%' },
                    { label: 'Закрыто', value: '42', trend: '+18%' },
                    { label: 'Конверсия', value: '17%', trend: '+3%' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-sm">
                      <div className="text-[9px] text-slate-400 mb-1">{stat.label}</div>
                      <div className="text-base font-bold text-slate-900">{stat.value}</div>
                      <div className="text-[9px] text-emerald-600 font-medium">{stat.trend}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom panels */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2 bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-sm">
                    <div className="text-[9px] font-semibold text-slate-600 mb-2">Этапы воронки</div>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Новые', pct: 75, color: '#2461FF' },
                        { label: 'Контакт', pct: 52, color: '#7C3AED' },
                        { label: 'Думают', pct: 35, color: '#06B6D4' },
                        { label: 'Сделка', pct: 20, color: '#10B981' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <div className="text-[8px] text-slate-400 w-16 shrink-0 truncate">{s.label}</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-3 bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-[#2461FF] to-[#7C3AED] flex items-center justify-center">
                        <span className="text-[6px] text-white font-bold">AI</span>
                      </div>
                      <div className="text-[9px] font-semibold text-slate-600">Активность ИИ-агента</div>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { icon: '🤖', text: 'Отправил follow-up Алие К. — этап Предложение', time: '2м' },
                        { icon: '📞', text: 'Разобрал звонок: Nomad Camp — 3 задачи', time: '8м' },
                        { icon: '🎯', text: 'Максат переведён на этап Переговоры', time: '15м' },
                        { icon: '💬', text: 'WhatsApp авто-ответ: Grand Hotel', time: '32м' },
                      ].map((a, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[9px] mt-px shrink-0">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[8.5px] text-slate-600 leading-tight truncate">{a.text}</div>
                          </div>
                          <div className="text-[8px] text-slate-300 shrink-0">{a.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// TRUSTED BY
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FEATURES
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    Icon: Bot,
    colorFrom: 'from-blue-500',
    colorTo: 'to-blue-600',
    glow: 'shadow-blue-500/25',
    tag: 'ИИ-агент',
    title: 'Отвечает за вас',
    description:
      'ИИ-агент читает сообщения, отвечает на вопросы о ценах, номерах и услугах, и сам доводит клиента до бронирования. Без скриптов, без шаблонов.',
    bullets: ['Автоматическое продвижение по воронке', 'Отработка возражений', 'Цели и сценарии разговора'],
  },
  {
    Icon: BarChart3,
    colorFrom: 'from-violet-500',
    colorTo: 'to-violet-600',
    glow: 'shadow-violet-500/25',
    tag: 'Воронка',
    title: 'Видите всю воронку',
    description:
      'Все лиды на одном экране: кто только написал, кто уже думает, кто готов платить. Перетаскивайте карточки, меняйте статусы, не теряйте никого.',
    bullets: ['Kanban и таблица', 'Поиск и фильтры в реальном времени', 'Редактирование и групповые действия'],
  },
  {
    Icon: MessageSquare,
    colorFrom: 'from-cyan-500',
    colorTo: 'to-blue-500',
    glow: 'shadow-cyan-500/25',
    tag: 'Коммуникации',
    title: 'Пишет везде где удобно клиенту',
    description:
      'Telegram, WhatsApp, Instagram — в одном интерфейсе. Отправляйте фото, документы и ссылки прямо из CRM.',
    bullets: ['Telegram и WhatsApp', 'Instagram DM', 'SMS через RingCentral'],
  },
  {
    Icon: BookOpen,
    colorFrom: 'from-emerald-500',
    colorTo: 'to-teal-500',
    glow: 'shadow-emerald-500/25',
    tag: 'База знаний',
    title: 'Знает ваш продукт',
    description:
      'Загрузите прайс, фото, политики и FAQ. ИИ сам разберётся что, кому и когда отправить.',
    bullets: ['Загрузка прайсов и документов', 'Автоматическая отправка фото', 'Контекстные ответы на вопросы'],
  },
]

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-blue-200/60 mb-5">
            <Target className="w-3 h-3" />
            Возможности
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#0A1628] tracking-tight mb-4"
            style={{ fontFamily: "'Ubuntu', sans-serif" }}
          >
            Всё что нужно команде,{' '}
            <span className="bg-gradient-to-r from-[#2461FF] to-[#7C3AED] bg-clip-text text-transparent">
              автоматически
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            От первого сообщения до закрытой сделки — OmniOS берёт рутину на себя, а команда занимается отношениями с клиентами.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map(feat => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/60 transition-all"
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.colorFrom} ${feat.colorTo} flex items-center justify-center shadow-lg ${feat.glow} flex-shrink-0`}
                >
                  <feat.Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{feat.tag}</div>
                  <h3
                    className="text-xl font-bold text-[#0A1628]"
                    style={{ fontFamily: "'Ubuntu', sans-serif" }}
                  >
                    {feat.title}
                  </h3>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{feat.description}</p>
              <ul className="space-y-2">
                {feat.bullets.map(bullet => (
                  <li key={bullet} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#2461FF] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// HOW IT WORKS
// ---------------------------------------------------------------------------

const STEPS = [
  {
    number: '01',
    Icon: Users,
    title: 'Добавьте лидов',
    description:
      'Вручную или через интеграции. Укажите откуда пришёл клиент, что его интересует.',
  },
  {
    number: '02',
    Icon: Bot,
    title: 'ИИ берёт работу на себя',
    description:
      'Отвечает на сообщения, отправляет фото и прайсы, двигает лида по воронке, создаёт задачи для менеджеров.',
  },
  {
    number: '03',
    Icon: TrendingUp,
    title: 'Вы закрываете сделки',
    description:
      'Менеджер подключается только когда клиент готов. Остальное — ИИ.',
  },
]

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6 bg-gradient-to-b from-[#F0F4FF] to-[#F8FAFF]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-violet-200/60 mb-5">
            <Activity className="w-3 h-3" />
            Как это работает
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#0A1628] tracking-tight mb-4"
            style={{ fontFamily: "'Ubuntu', sans-serif" }}
          >
            Ваш полный цикл продаж
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Три простых шага от первого контакта до постоянного клиента — полностью автоматически.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-[#2461FF]/30 via-[#7C3AED]/30 to-[#2461FF]/30" />

          {STEPS.map(step => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl p-7 border border-slate-200/60 shadow-sm text-center"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#2461FF] to-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">
                {step.number}
              </div>
              <div className="w-12 h-12 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-slate-200/60 flex items-center justify-center">
                <step.Icon className="w-6 h-6 text-[#2461FF]" />
              </div>
              <h3
                className="text-lg font-bold text-[#0A1628] mb-3"
                style={{ fontFamily: "'Ubuntu', sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// INDUSTRIES
// ---------------------------------------------------------------------------

const HOTEL_BULLETS = [
  'Гости пишут в Telegram — ИИ отвечает на вопросы о номерах, ценах и питании',
  'Отправляет фото и закрывает бронирование без участия менеджера',
  'Менеджер получает уже готового клиента',
  'Мультиобъектная воронка в одном интерфейсе',
]

const FITNESS_BULLETS = [
  'Новый клиент написал в Instagram? ИИ расскажет про абонементы',
  'Ответит на вопросы и напомнит о пробном занятии',
  'Вы получаете запись — не переписку',
  'Автоматические напоминания о продлении абонемента',
]

const ECOMMERCE_BULLETS = [
  'ИИ следит за лидами и напоминает о брошенных корзинах',
  'Отвечает на вопросы о доставке и помогает с выбором товара',
  'Прямо в мессенджере клиента — без звонков',
  'Автоматические follow-up для повторных покупок',
]

function Industries() {
  return (
    <section id="industries" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-200/60 mb-5">
            <Globe className="w-3 h-3" />
            Для каких отраслей
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#0A1628] tracking-tight mb-4"
            style={{ fontFamily: "'Ubuntu', sans-serif" }}
          >
Создан для вашей отрасли
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            OmniOS разработан для бизнесов, где доход строится на отношениях с клиентами.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Отели и гостиницы */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] to-[#132344] rounded-2xl p-8 text-white border border-white/10">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(36,97,255,0.35) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2461FF] to-[#5B8EFF] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Отрасль</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Ubuntu', sans-serif" }}
              >
                Отели и гостиницы
              </h3>
              <p className="text-blue-200 text-sm font-medium mb-4">Больше броней, меньше звонков</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Гости пишут в Telegram — ИИ отвечает на вопросы о номерах, ценах и питании, отправляет фото и закрывает бронирование. Менеджер получает уже готового клиента.
              </p>
              <ul className="space-y-3">
                {HOTEL_BULLETS.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-[#2461FF]/30 border border-[#2461FF]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-300" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Ubuntu', sans-serif" }}>до 80%</div>
                <div className="text-xs text-slate-400 mt-0.5">запросов обрабатывает ИИ</div>
              </div>
            </div>
          </div>

          {/* Фитнес-центры */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1A0A28] to-[#2A1044] rounded-2xl p-8 text-white border border-white/10">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-2">Отрасль</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Ubuntu', sans-serif" }}
              >
                Фитнес-центры
              </h3>
              <p className="text-violet-200 text-sm font-medium mb-4">Записывайте клиентов без администратора</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Новый клиент написал в Instagram? ИИ расскажет про абонементы, ответит на вопросы и напомнит о пробном занятии. Вы получаете запись — не переписку.
              </p>
              <ul className="space-y-3">
                {FITNESS_BULLETS.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-violet-300" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Ubuntu', sans-serif" }}>в 3 раза</div>
                <div className="text-xs text-slate-400 mt-0.5">быстрее обработка заявок</div>
              </div>
            </div>
          </div>

          {/* Интернет-магазины */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F1A] to-[#0D2E26] rounded-2xl p-8 text-white border border-white/10">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.30) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2">Отрасль</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Ubuntu', sans-serif" }}
              >
                Интернет-магазины
              </h3>
              <p className="text-emerald-200 text-sm font-medium mb-4">Возвращайте клиентов и увеличивайте повторные продажи</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                ИИ следит за лидами, напоминает о брошенных корзинах, отвечает на вопросы о доставке и помогает с выбором товара — прямо в мессенджере клиента.
              </p>
              <ul className="space-y-3">
                {ECOMMERCE_BULLETS.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-300" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Ubuntu', sans-serif" }}>+40%</div>
                <div className="text-xs text-slate-400 mt-0.5">к повторным покупкам</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// AI AGENT SPOTLIGHT
// ---------------------------------------------------------------------------

const AUTONOMY_FEATURES = [
  {
    Icon: Target,
    title: 'Сам двигает сделки',
    description:
      'Анализирует переписку и переводит лида на следующий этап воронки когда видит интерес.',
  },
  {
    Icon: Shield,
    title: 'Отрабатывает возражения',
    description:
      'Цена высокая? Надо подумать? ИИ знает как ответить, используя ваши материалы.',
  },
  {
    Icon: TrendingUp,
    title: 'Создаёт задачи',
    description:
      'После каждого касания ИИ создаёт задачи для менеджеров: позвонить, уточнить, отправить КП.',
  },
  {
    Icon: Zap,
    title: 'Не забывает никого',
    description:
      'Сам пишет лидам которые замолчали, по расписанию, без напоминаний.',
  },
]

function AIAgentSpotlight() {
  return (
    <section id="ai-agent" className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(36,97,255,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 bg-[#2461FF]/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-[#2461FF]/30 mb-5">
            <Bot className="w-3 h-3" />
            ИИ-агент
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: "'Ubuntu', sans-serif" }}
          >
            Что делает{' '}
            <span className="bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] bg-clip-text text-transparent">
              ИИ-агент
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            OmniOS не отправляет шаблонные сообщения — он понимает контекст, определяет намерение и действует чтобы двигать сделки вперёд.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {AUTONOMY_FEATURES.map(feat => (
            <div
              key={feat.title}
              className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2461FF]/30 to-[#7C3AED]/30 border border-white/10 flex items-center justify-center mb-4">
                <feat.Icon className="w-5 h-5 text-blue-300" />
              </div>
              <h3
                className="text-base font-bold text-white mb-2"
                style={{ fontFamily: "'Ubuntu', sans-serif" }}
              >
                {feat.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* Stats banner */}
        <div className="bg-gradient-to-r from-[#2461FF]/20 to-[#7C3AED]/20 rounded-2xl p-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { value: '24/7', label: 'работает без выходных' },
              { value: 'до 80%', label: 'запросов без менеджера' },
              { value: 'в 3 раза', label: 'быстрее обработка заявок' },
            ].map(stat => (
              <div key={stat.value}>
                <div
                  className="text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: "'Ubuntu', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// CTA SECTION
// ---------------------------------------------------------------------------

function CTASection() {
  return (
    <section className="py-24 px-6 bg-[#F8FAFF] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(36,97,255,0.08) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2
          className="text-4xl md:text-5xl font-bold text-[#0A1628] tracking-tight mb-6"
          style={{ fontFamily: "'Ubuntu', sans-serif" }}
        >
          Готовы перестать{' '}
          <span className="bg-gradient-to-r from-[#2461FF] to-[#7C3AED] bg-clip-text text-transparent">
            терять лидов?
          </span>
        </h2>
        <p className="text-lg text-slate-500 mb-10">
          Подключите OmniOS и ваш ИИ-агент начнёт работать уже сегодня
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <Link to="/register">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-[#2461FF] to-[#7C3AED] hover:opacity-90 text-white border-0 shadow-2xl shadow-blue-500/25"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-400">Бесплатно · Без кредитной карты · Быстрая настройка</p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FOOTER
// ---------------------------------------------------------------------------

function Footer() {
  const links = [
    { label: 'Возможности', href: '#features' },
    { label: 'Как это работает', href: '#how-it-works' },
    { label: 'Отрасли', href: '#industries' },
    { label: 'Войти', href: '/login' },
  ]
  return (
    <footer className="bg-[#0A1628] py-12 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-[#2461FF] to-[#7C3AED] rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="text-white font-bold text-lg"
              style={{ fontFamily: "'Ubuntu', sans-serif" }}
            >
              OmniOS
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">CRM, которая работает пока вы спите</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {links.map(link => (
            <a key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <p className="text-slate-500 text-sm">© 2025 OmniOS. Все права защищены.</p>
      </div>
    </footer>
  )
}
