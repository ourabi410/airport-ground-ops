import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#0284C7] text-white',
        secondary:
          'border-transparent bg-[#F1F5F9] text-[#1E293B]',
        destructive:
          'border-transparent bg-red-100 text-red-700 font-bold',
        outline: 'text-[#1E293B] border border-[#E2E8F0]',
        success: 'bg-green-100 text-green-700 font-bold',
        warning: 'bg-amber-100 text-amber-700 font-bold',
        navy: 'bg-[#0F172A] text-white',
        alert: 'bg-red-500 text-white animate-pulse'
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'navy' | 'alert';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { badgeVariants };
