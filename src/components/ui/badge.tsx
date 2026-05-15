import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 text-white',
        secondary: 'bg-slate-100 text-slate-700',
        outline: 'border border-slate-200 text-slate-700',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        destructive: 'bg-red-100 text-red-800',
        pending: 'bg-amber-100 text-amber-700',
        open: 'bg-blue-100 text-blue-800',
        partial: 'bg-amber-100 text-amber-800',
        full: 'bg-green-100 text-green-800',
        active: 'bg-slate-100 text-slate-700',
        ended: 'bg-slate-100 text-slate-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
