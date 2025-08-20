'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Database, Plus } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/jobs', label: 'Jobs' },
    { href: '/jobs/new', label: 'Create Job', icon: Plus },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">Scraper Engine</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center transition-colors hover:text-foreground/80',
                    pathname === link.href ? 'text-foreground' : 'text-foreground/60',
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
