// components/Logo.tsx
import React from 'react'
import Image from 'next/image'

interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-28',
    md: 'w-40',
    lg: 'w-52',
  }

  return (
    <div className="flex flex-col items-center justify-center select-none bg-transparent">
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        <Image
          src="/logo.png"
          alt="Youbit Logo"
          width={400}
          height={315}
          priority
          className="w-full h-auto object-contain drop-shadow-md"
        />
      </div>
    </div>
  )
}