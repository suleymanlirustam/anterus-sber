import { type ReactNode, useEffect, useState } from 'react'
import { type Person } from '@/reception/api'
import { AppShell, NavItem } from '@/shell/app-shell'
import { CalendarDays, LayoutDashboard, Wallet } from 'lucide-react'
import { useLiveSchedule } from './api'
import { ScheduleScreen } from './calendar'
import { EarningsScreen, TodayScreen } from './screens'

// Окно врача: оболочка — общая с окнами сотрудников, разделы — «Сегодня», «Расписание»,
// «Заработок». Сюда встраивается ИИ-агент «расшифровка приёма → черновик медкарты».
// В копии для внешней команды служебные разделы клиники убраны.
const SECTIONS = [
  { id: 'today', label: 'Сегодня', icon: <LayoutDashboard className='icon' /> },
  {
    id: 'schedule',
    label: 'Расписание',
    icon: <CalendarDays className='icon' />,
  },
  { id: 'earnings', label: 'Заработок', icon: <Wallet className='icon' /> },
] as const

type Section = (typeof SECTIONS)[number]['id']

export function DoctorShell({
  me,
  switcher,
}: {
  me: Person
  switcher?: ReactNode
}) {
  const [section, setSection] = useState<Section>('today')
  useLiveSchedule()

  useEffect(() => {
    document.title = 'Окно врача'
  }, [])

  return (
    <AppShell
      me={me}
      role='Врач'
      caption={
        <p>
          Внутренняя CRM клиники
          <br />
          Окно врача
        </p>
      }
      switcher={switcher}
      collapseKey='doctor-nav-collapsed'
      nav={(collapsed) =>
        SECTIONS.map((s) => (
          <NavItem
            key={s.id}
            icon={s.icon}
            label={s.label}
            active={section === s.id}
            collapsed={collapsed}
            onClick={() => setSection(s.id)}
          />
        ))
      }
    >
      {section === 'today' ? (
        <TodayScreen />
      ) : section === 'schedule' ? (
        <ScheduleScreen />
      ) : (
        <EarningsScreen />
      )}
    </AppShell>
  )
}
