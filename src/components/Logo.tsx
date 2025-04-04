import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center justify-center">
      <div className="w-[240px] h-[60px] flex items-center">
        <svg viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Triangle shapes */}
          <path d="M0 0L150 300H0V0Z" fill="#FF6B00" /> {/* Orange triangle */}
          <path d="M150 300L300 0H150L0 300H150Z" fill="#0066CC" /> {/* Blue triangle */}
          <path d="M300 0L150 300H300V0Z" fill="#00B4B4" /> {/* Teal triangle */}
          
          {/* MixerAI text */}
          <text x="400" y="200" fontSize="160" fill="white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
            Mixer
            <tspan fill="#00B4B4">AI</tspan>
          </text>
        </svg>
      </div>
    </Link>
  )
} 