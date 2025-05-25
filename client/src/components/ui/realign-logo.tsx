import React from 'react';

interface ReAlignLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ReAlignLogo: React.FC<ReAlignLogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = false 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-10 w-10 text-xl',
    lg: 'h-12 w-12 text-2xl'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Modern ReAlign Logo */}
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-primary-foreground font-bold shadow-lg`}>
        <span className="transform -rotate-12">R</span>
      </div>
      
      {showText && (
        <span className={`font-bold tracking-tight text-gradient ${textSizeClasses[size]}`}>
          ReAlign
        </span>
      )}
    </div>
  );
};