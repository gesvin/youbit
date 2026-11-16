// app/dashboard/layout.tsx
import React from 'react'
import AutoLogoutListener from '@/components/AutoLogoutListener'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AutoLogoutListener />
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </>
  )
}