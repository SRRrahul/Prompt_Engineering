import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export default function AtomLogo({ size = 40, className = '' }: Props) {
  return (
    <div 
      className={`atom-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="atom-svg"
      >
        <defs>
          <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-light)" />
            <stop offset="100%" stopColor="var(--secondary-light)" />
          </linearGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-dark)" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Core */}
        <circle cx="50" cy="50" r="8" fill="url(#core-grad)" filter="url(#glow)" />
        
        {/* Orbit 1 */}
        <ellipse 
          cx="50" cy="50" rx="42" ry="14" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          transform="rotate(30 50 50)"
          className="orbit-path orbit-1"
        />
        {/* Orbit 2 */}
        <ellipse 
          cx="50" cy="50" rx="42" ry="14" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          transform="rotate(90 50 50)"
          className="orbit-path orbit-2"
        />
        {/* Orbit 3 */}
        <ellipse 
          cx="50" cy="50" rx="42" ry="14" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          transform="rotate(150 50 50)"
          className="orbit-path orbit-3"
        />

        {/* Electrons */}
        <circle cx="92" cy="50" r="3.5" fill="var(--white)" filter="url(#glow)" className="electron e1" transform="rotate(30 50 50)" />
        <circle cx="50" cy="92" r="3.5" fill="var(--white)" filter="url(#glow)" className="electron e2" transform="rotate(90 50 50)" />
        <circle cx="8" cy="50" r="3.5" fill="var(--white)" filter="url(#glow)" className="electron e3" transform="rotate(150 50 50)" />
      </svg>
    </div>
  );
}
