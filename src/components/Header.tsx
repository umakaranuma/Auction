import React from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header>
      <div className="header-icon">🏏</div>
      <div>
        <h1>{title || 'Cricket Auction'}</h1>
        <p>{subtitle || 'TOURNAMENT MANAGEMENT SYSTEM'}</p>
      </div>
    </header>
  );
}
