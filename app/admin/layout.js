'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '../../lib/context'
import PageShell from '../../components/shared/PageShell'
import AdminSidebar from '../../components/admin/AdminSidebar'

const TITLES = {
  '/admin/dashboard':  { en: 'Dashboard',         np: 'ड्यासबोर्ड'         },
  '/admin/users':      { en: 'Manage Employees',   np: 'कर्मचारी व्यवस्थापन' },
  '/admin/leave':      { en: 'Leave Management',   np: 'बिदा व्यवस्थापन'    },
  '/admin/attendance': { en: 'Attendance',         np: 'उपस्थिति'           },
  '/admin/settings':   { en: 'Settings',           np: 'सेटिङ'              },
}

export default function AdminLayout({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, lang } = useApp()

  useEffect(() => {
    if (!user) router.replace('/')
    else if (user.role !== 'admin') router.replace('/user/dashboard')
  }, [user, router])

  if (!user || user.role !== 'admin') return null

  const np    = lang === 'np'
  const entry = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))
  const title = entry ? (np ? entry[1].np : entry[1].en) : 'Admin'

  return (
    <PageShell SidebarComp={AdminSidebar} title={title}>
      {children}
    </PageShell>
  )
}