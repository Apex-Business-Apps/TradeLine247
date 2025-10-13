/**
 * Centralized Logo Component
 * Uses public folder for consistent asset loading across all environments
 */

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function Logo({ className = '', size }: LogoProps) {
  // If className includes sizing, don't apply sizeMap
  const sizeClass = size && !className.includes('h-') ? sizeMap[size] : '';
  const combinedClassName = `${sizeClass} ${className}`.trim();
  
  // Fallback to styled div if image doesn't load
  return (
    <div 
      className={`${combinedClassName} rounded-full bg-primary flex items-center justify-center font-bold text-white`}
      aria-label="AutoRepAi Logo"
    >
      <span className="text-2xl">A</span>
    </div>
  );
}

export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold text-primary ${className}`}>
      AutoRepAi
    </span>
  );
}
