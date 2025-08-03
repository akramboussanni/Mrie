import type { Metadata } from 'next'
import Home from '@/components/pages/Home'

export const metadata: Metadata = {
  title: 'home - mrie',
  description: 'multipurpose repository of internet-accessible essentials',
}

export default function HomePage() {
  return <Home />
} 