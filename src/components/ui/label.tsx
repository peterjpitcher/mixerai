import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none text-gray-300',
          className
        )}
        {...props}
      />
    )
  }
)

Label.displayName = 'Label'

export { Label } 