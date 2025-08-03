import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home as HomeIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'not found - mrie',
  description: 'page not found',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <Card className="border-cottage-warm bg-cottage-cream">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-cottage-brown">
              page not found
            </CardTitle>
            <CardDescription>
              the page you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale">
                <HomeIcon className="w-4 h-4 mr-2" />
                go home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 