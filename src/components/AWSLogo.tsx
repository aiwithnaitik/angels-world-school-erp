'use client';

import React from 'react';

interface AWSLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withBorder?: boolean;
}

export default function AWSLogo({ className = '', size = 'md', withBorder = true }: AWSLogoProps) {
  const dimensions = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
  };

  const borderStyles = withBorder
    ? 'ring-2 ring-accent-gold/60 border border-primary-500 shadow-lg shadow-primary-500/10'
    : '';

  return (
    <div className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black select-none transition-transform duration-300 hover:scale-105 ${dimensions[size]} ${borderStyles} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpg"
        alt="Angels World School Logo"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
