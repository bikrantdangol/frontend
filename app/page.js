'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '../lib/context'
import LoginPage from '../components/loginPage'

export default function Root() {
  const router = useRouter()
  const { user } = useApp()

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')
    }
  }, [user, router])

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F7F4',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #D6E4D7',
          borderTopColor: '#2E7D32',
          animation: 'spin .7s linear infinite',
        }}/>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // If not logged in, show login page at root
  return <LoginPage />
}