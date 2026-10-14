interface PulseLogoProps {
  className?: string;
}

export function PulseLogo({ className = "h-5 w-5" }: PulseLogoProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#e5484d" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12.5h4.5l2.5-6.5 4 13 2.5-6.5H21" />
    </svg>
  );
}
