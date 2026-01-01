import { forwardRef } from 'react';

interface PrintHeaderProps {
  logoUrl?: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  subtitle?: string;
}

export const PrintHeader = forwardRef<HTMLDivElement, PrintHeaderProps>(
  ({ logoUrl, clinicName, clinicAddress, clinicPhone, subtitle }, ref) => {
    return (
      <div ref={ref} className="text-center mb-4 print-header">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={clinicName} 
            className="w-12 h-12 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-xl font-bold uppercase tracking-wide">{clinicName}</h1>
        {clinicAddress && (
          <p className="text-xs text-gray-600 mt-1">{clinicAddress}</p>
        )}
        {clinicPhone && (
          <p className="text-xs text-gray-600">{clinicPhone}</p>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    );
  }
);

PrintHeader.displayName = 'PrintHeader';
