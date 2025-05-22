
import React from 'react';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  
  return (
    <img 
      src="/images/logo.png" 
      alt="ReAlign Logo" 
      className={`${sizeClasses[size]} ${className || ''}`} 
    />
  );
};
