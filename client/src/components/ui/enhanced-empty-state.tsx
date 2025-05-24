import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EnhancedEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EnhancedEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EnhancedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center ${className}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      </div>
      
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="btn-mobile focus-enhanced"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}