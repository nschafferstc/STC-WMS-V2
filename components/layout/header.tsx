'use client'
import { signOut } from 'next-auth/react'
import { LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ROLE_LABELS: Record<string, string> = {
  STC_EXECUTIVE: 'STC Executive',
  STC_OPS_MANAGER: 'STC Ops Manager',
  STC_COORDINATOR: 'STC Coordinator',
  STC_READ_ONLY: 'Read Only',
  WAREHOUSE_OPS: 'Warehouse Ops',
  CLIENT_USER: 'Client',
}

interface HeaderProps {
  user: { name?: string | null; email?: string | null; role?: string; image?: string | null }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-3">
              <div className="h-7 w-7 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0) ?? 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-none">{user.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{ROLE_LABELS[user.role ?? ''] ?? user.role}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
