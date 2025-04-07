import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center justify-center', className)}>
      <div className="w-[240px] h-[60px] flex items-center">
        <svg viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
          {/* Triangle shapes */}
          <path d="M0 0L150 300H0V0Z" fill="#FF6B00" /> {/* Orange triangle */}
          <path d="M150 300L300 0H150L0 300H150Z" fill="#0066CC" /> {/* Blue triangle */}
          <path d="M300 0L150 300H300V0Z" fill="#00B4B4" /> {/* Teal triangle */}
          
          {/* MixerAI text */}
          <text x="400" y="200" fontSize="160" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }} className="fill-current">
            Mixer
            <tspan fill="#00B4B4">AI</tspan>
          </text>
        </svg>
      </div>
    </Link>
  )
} 