
import React from 'react';
import realignLogoFull from '@assets/realign logo.png';
import realignLogoIcon from '@assets/realign icon logo (64 x 64 px).png';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
};

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', variant = 'full' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  
  const logoSrc = variant === 'icon' ? realignLogoIcon : realignLogoFull;
  
  return (
    <img 
      src={logoSrc} 
      alt="ReAlign Logo" 
      className={`${sizeClasses[size]} ${className || ''}`} 
    />
  );
};
