import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface EnhancedButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, touchOptimized = false, ...props }, ref) => {
    return (
      <Button
        className={cn(
          // Enhanced button states
          "transition-all duration-200 ease-in-out",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus:ring-2 focus:ring-brand-primary/20 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          // Touch optimization for mobile
          touchOptimized && "min-h-[44px] min-w-[44px]", // 44px minimum touch target
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };