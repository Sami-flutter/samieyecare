import { forwardRef } from 'react';
import { PrintHeader } from './PrintHeader';

interface ReceptionSlipProps {
  clinicName?: string;
  clinicLogo?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  date: Date;
  patientName: string;
  tokenNumber: number;
  doctorName: string;
  roomNumber: string;
}

export const ReceptionSlip = forwardRef<HTMLDivElement, ReceptionSlipProps>(
  ({ clinicName = 'Eye Care Clinic', clinicLogo, clinicAddress, clinicPhone, date, patientName, tokenNumber, doctorName, roomNumber }, ref) => {
    return (
      <div ref={ref} className="p-4 bg-white text-black w-[80mm] font-sans text-xs print-thermal">
        <PrintHeader 
          clinicName={clinicName} 
          logoUrl={clinicLogo}
          clinicAddress={clinicAddress}
          clinicPhone={clinicPhone}
          subtitle="Patient Visit Slip"
        />

        <div className="border-t border-b border-dashed border-gray-400 py-3 my-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Token Number</p>
            <p className="text-4xl font-bold my-1">{tokenNumber}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{date.toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-medium">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Patient:</span><span className="font-medium">{patientName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Doctor:</span><span className="font-medium">{doctorName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Room:</span><span className="font-medium text-base">{roomNumber}</span></div>
        </div>

        <div className="mt-4 pt-3 border-t border-dashed border-gray-400 text-center text-[10px] text-gray-500">
          <p>Please wait for your token to be called.</p>
          <p className="mt-1">Thank you!</p>
        </div>
      </div>
    );
  }
);

ReceptionSlip.displayName = 'ReceptionSlip';
