import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
  children: React.ReactNode
}

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'default' && 'bg-gray-800 border-gray-700 text-gray-300',
        variant === 'destructive' && 'bg-red-900/50 border-red-700 text-red-300',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        {variant === 'destructive' && (
          <AlertTriangle className="h-5 w-5 text-red-400" />
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
} 