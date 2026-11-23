import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from 'react'
import { type Person, useLogout } from '@/reception/api'
import logo from '@/reception/brand/anterus-logo-ru.png'
// логотип прототипа (её assets/logo.png)
import { initials, readFlag, saveFlag } from '@/reception/format'
import {
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  UserRound,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useNavIndicator } from './nav-indicator'
import { popoverPlace, useDismiss } from './popover'

const MSK = { timeZone: 'Europe/Moscow' } as const

/** «Чт, 29 октября 2026» и «29.10.2026» — как в шапке прототипа, по Москве. */
function todayLabels(now = new Date()): { full: string; short: string } {
  const full = new Intl.DateTimeFormat('ru-RU', {
    ...MSK,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(now)
    .replace(/\s*г\.$/, '')
  return {
    full: full.charAt(0).toUpperCase() + full.slice(1),
    short: new Intl.DateTimeFormat('ru-RU', MSK).format(now),
  }
}

// Куда экран кладёт своё название, кнопки и шестерёнку — в шапку страницы (шаг А, 29.10.2026).
// Вне оболочки (тест одного экрана) слотов нет — название рисуется на месте.
const PageSlots = createContext<{
  title: HTMLElement | null
  actions: HTMLElement | null
  tools: HTMLElement | null
}>({ title: null, actions: null, tools: null })

export type CreateItem = {
  label: string
  icon?: ReactNode // её иконка пункта; у «Задачи» и листа ожидания её нет
  onSelect: () => void
}

/** Оболочка окон сотрудников — разметка и стили CRM-прототипа компаньона один в один
 *  (решение владельца 29.10.2026, стили — crm-shell.css, снятые с её прототипа): светлое меню
 *  слева — логотип, разделы, «Свернуть меню», внизу профиль; на телефоне меню выезжает по
 *  кнопке. Шапка страницы — внутри страницы: название слева, справа кнопки окна, дата,
 *  шестерёнка экрана и «+» (что создать — решает окно). fill — экран во всю высоту окна
 *  (доски, переписка): листается сам экран, а не страница. */
export function AppShell({
  me,
  role,
  caption,
  switcher,
  toolbar,
  create,
  collapseKey,
  fill = false,
  nav,
  onLogout,
  onPassword,
  children,
}: {
  me: Person | Pick<Person, 'full_name'>
  role?: string // подпись под именем — передаёт само окно
  caption: ReactNode
  switcher?: ReactNode
  toolbar?: ReactNode
  create?: CreateItem[] // пункты «+»; пусто — кнопки нет
  collapseKey: string // у каждого окна своё «свёрнуто», как было
  fill?: boolean
  nav: (collapsed: boolean) => ReactNode
  // своё «Выйти» и «Сменить пароль»; без onPassword пункта смены пароля нет
  onLogout?: () => void
  onPassword?: () => void
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(() => readFlag(collapseKey, false))
  const [menuOpen, setMenuOpen] = useState(false) // телефон: меню выехало
  const [profile, setProfile] = useState(false)
  const [creating, setCreating] = useState<ReturnType<
    typeof popoverPlace
  > | null>(null)
  const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null)
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null)
  const [toolsSlot, setToolsSlot] = useState<HTMLElement | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLDivElement>(null)
  const logout = useLogout()
  const signOut = onLogout ?? (() => logout.mutate())
  const date = todayLabels()

  useDismiss(profile, () => setProfile(false), profileRef)
  const { nav: navRef, mark: markRef } = useNavIndicator()
  useDismiss(creating !== null, () => setCreating(null), createRef)

  const toggleNav = () => {
    setCollapsed(!collapsed)
    saveFlag(collapseKey, !collapsed)
  }

  return (
    <div className='crm'>
      <div
        className={cn(
          'crm-layout reference-shell',
          collapsed && 'collapsed',
          menuOpen && 'menu-open',
          fill && 'board-workspace'
        )}
      >
        <header className='mobile-header'>
          <button
            type='button'
            className='button icon-button mobile-menu'
            aria-label='Открыть меню'
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className='icon' aria-hidden />
          </button>
          <span>АНТЕРУС · CRM</span>
        </header>
        <button
          type='button'
          className='menu-backdrop'
          aria-label='Закрыть меню'
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />
        <div className='shell'>
          <aside className='sidebar' aria-label='Меню кабинета'>
            <div className='sidebar-top'>
              <div className='sidebar-brand'>
                <img
                  className='logo'
                  src={logo}
                  alt='АНТЕРУС — центр ментального здоровья'
                />
              </div>
              <button
                type='button'
                className='mobile-sidebar-close'
                aria-label='Закрыть меню'
                onClick={() => setMenuOpen(false)}
              >
                <X className='icon' aria-hidden />
              </button>
              {switcher}
            </div>
            <div className='sidebar-scroll'>
              {/* выбор раздела на телефоне закрывает меню */}
              <nav
                ref={navRef}
                aria-label='Разделы'
                onClick={() => setMenuOpen(false)}
              >
                <span ref={markRef} className='nav-indicator' aria-hidden />
                {nav(collapsed)}
              </nav>
              <div className='sidebar-bottom'>
                <button
                  type='button'
                  className='nav-btn sidebar-collapse'
                  aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
                  aria-expanded={!collapsed}
                  title={collapsed ? 'Развернуть меню' : undefined}
                  onClick={toggleNav}
                >
                  {collapsed ? (
                    <PanelLeftOpen className='icon' aria-hidden />
                  ) : (
                    <PanelLeftClose className='icon' aria-hidden />
                  )}
                  <span className='nav-text'>Свернуть меню</span>
                </button>
              </div>
            </div>
            <div className='sidebar-account' ref={profileRef}>
              <div className='profile-menu' role='menu' hidden={!profile}>
                {onPassword && (
                  <button
                    type='button'
                    role='menuitem'
                    className='button profile-menu-item'
                    onClick={() => {
                      setProfile(false)
                      onPassword()
                    }}
                  >
                    <KeyRound className='icon' aria-hidden />
                    <span>Сменить пароль</span>
                  </button>
                )}
                <button
                  type='button'
                  role='menuitem'
                  className='button profile-menu-item'
                  onClick={signOut}
                >
                  <UserRound className='icon' aria-hidden />
                  <span>Сменить пользователя</span>
                </button>
                <button
                  type='button'
                  role='menuitem'
                  className='button profile-menu-item'
                  onClick={signOut}
                >
                  <LogOut className='icon' aria-hidden />
                  <span>Выйти</span>
                </button>
              </div>
              <button
                type='button'
                className='user profile-trigger'
                aria-label={`Профиль: ${me.full_name}`}
                aria-expanded={profile}
                onClick={() => setProfile(!profile)}
              >
                <span className='avatar' aria-hidden>
                  {initials(me.full_name)}
                </span>
                <span className='user-details'>
                  <strong>{me.full_name}</strong>
                  {role && <small>{role}</small>}
                  <small className='demo-caption'>{caption}</small>
                </span>
                <ChevronDown className='icon' aria-hidden />
              </button>
            </div>
          </aside>

          <main id='main' className='main standard-screen'>
            <header className='head reference-head'>
              <div className='page-heading' ref={setTitleSlot} />
              <div className='actions page-actions'>
                {toolbar}
                <div ref={setActionsSlot} className='contents' />
              </div>
              <div className='page-tools'>
                <time className='page-date'>
                  <span className='header-date-full'>{date.full}</span>
                  <span className='header-date-short'>{date.short}</span>
                </time>
                <div ref={setToolsSlot} className='contents' />
                {!!create?.length && (
                  <div className='creation-control' ref={createRef}>
                    <button
                      type='button'
                      className='button primary header-create creation-trigger'
                      aria-label='Создать'
                      aria-expanded={creating !== null}
                      onClick={(e) => {
                        // один пункт — его форма сразу, без меню (как у неё)
                        if (create.length === 1) return create[0].onSelect()
                        setCreating(
                          creating ? null : popoverPlace(e.currentTarget)
                        )
                      }}
                    >
                      <Plus className='icon' aria-hidden />
                    </button>
                    {creating && (
                      <div
                        className='creation-menu'
                        role='menu'
                        aria-label='Создание'
                        style={creating}
                      >
                        {create.map((item) => (
                          <button
                            key={item.label}
                            type='button'
                            role='menuitem'
                            className='creation-item'
                            onClick={() => {
                              setCreating(null)
                              item.onSelect()
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </header>
            <PageSlots.Provider
              value={{
                title: titleSlot,
                actions: actionsSlot,
                tools: toolsSlot,
              }}
            >
              {children}
            </PageSlots.Provider>
          </main>
        </div>
      </div>
    </div>
  )
}

/** Название страницы, её кнопки и шестерёнка — в шапку страницы, как в прототипе. */
export function PageTitle({
  title,
  subtitle,
  actions,
  tools,
}: {
  title: ReactNode
  subtitle?: ReactNode // у неё в шапке подписи нет — строкой .screen-context над экраном
  actions?: ReactNode
  tools?: ReactNode // шестерёнка «Настройки страницы» — справа, перед «+»
}) {
  const slots = useContext(PageSlots)
  const head = <h1>{title}</h1>
  const context = subtitle && <p className='screen-context'>{subtitle}</p>
  if (!slots.title)
    return (
      <>
        <header className='head reference-head'>
          <div className='page-heading'>{head}</div>
          {actions && <div className='actions page-actions'>{actions}</div>}
          {tools && <div className='page-tools'>{tools}</div>}
        </header>
        {context}
      </>
    )
  return (
    <>
      {context}
      {createPortal(head, slots.title)}
      {actions && slots.actions && createPortal(actions, slots.actions)}
      {tools && slots.tools && createPortal(tools, slots.tools)}
    </>
  )
}

/** Пункт меню прототипа: значок, подпись, число справа; выбранный — мягкий фон и полоска. */
export function NavItem({
  icon,
  label,
  count,
  active,
  collapsed,
  alert,
  onClick,
}: {
  icon: ReactNode
  label: string
  count?: number
  active: boolean
  collapsed: boolean
  alert?: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={[label, alert].filter(Boolean).join(', ')}
      title={collapsed ? label : undefined}
      className={cn('nav-btn', active && 'active')}
    >
      {icon}
      <span className='nav-text'>
        {label}
        {alert && <span className='nav-alert'>{alert}</span>}
      </span>
      {!!count && <span className='count'>{count}</span>}
    </button>
  )
}
