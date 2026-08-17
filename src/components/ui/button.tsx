import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-98',
  {
    variants: {
      variant: {
        default: 'bg-[#0284C7] text-white hover:bg-sky-700 shadow-xs',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-xs',
        outline:
          'border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] hover:text-[#1E293B] text-slate-700',
        secondary:
          'bg-[#F1F5F9] text-[#1E293B] hover:bg-slate-200',
        ghost: 'hover:bg-[#F1F5F9] hover:text-[#1E293B] text-slate-700',
        link: 'text-[#0284C7] underline-offset-4 hover:underline',
        navy: 'bg-[#0F172A] text-white hover:bg-[#1E293B]',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-[11px]',
        lg: 'h-10 rounded-md px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
