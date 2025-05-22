
import React from 'react';
import logoImage from '../../assets/logo.png';

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
      src={logoImage} 
      alt="ReAlign Logo" 
      className={`${sizeClasses[size]} ${className || ''}`} 
    />
  );
};
