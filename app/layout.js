import './globals.css'
import Providers from '../components/Providers'
import { Outfit } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata = {
  title: 'MirmiraHRMS — Human Resource Management',
  description: 'Mirmire Bachat tatha Rin Sahakari Sanstha Ltd., Tokha Kathmandu',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body
        className="font-sans"
        style={{ margin: 0, padding: 0, background: '#F4F7F4' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}