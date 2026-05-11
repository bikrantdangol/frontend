'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '../../lib/context'
import PageShell from '../../components/shared/PageShell'
import UserSidebar from '../../components/user/UserSidebar'

const TITLES = {
  '/user/dashboard':  { en: 'Home',          np: 'होम'            },
  '/user/attendance': { en: 'My Attendance', np: 'मेरो उपस्थिति'  },
  '/user/leave':      { en: 'Leave',         np: 'बिदा'           },
  '/user/profile':    { en: 'Profile',       np: 'प्रोफाइल'       },
}

export default function UserLayout({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, lang } = useApp()

  useEffect(() => {
    if (!user) router.replace('/')
    else if (user.role === 'admin') router.replace('/admin/dashboard')
  }, [user, router])

  if (!user || user.role === 'admin') return null

  const np    = lang === 'np'
  const entry = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))
  const title = entry ? (np ? entry[1].np : entry[1].en) : 'Portal'

  return (
    <PageShell SidebarComp={UserSidebar} title={title}>
      {children}
    </PageShell>
  )
}