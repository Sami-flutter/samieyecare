import { forwardRef } from 'react';

interface ReceptionSlipProps {
  clinicName?: string;
  date: Date;
  patientName: string;
  tokenNumber: number;
  doctorName: string;
  roomNumber: string;
}

export const ReceptionSlip = forwardRef<HTMLDivElement, ReceptionSlipProps>(
  ({ clinicName = 'Eye Care Clinic', date, patientName, tokenNumber, doctorName, roomNumber }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black w-[300px] font-sans">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">{clinicName}</h1>
          <p className="text-sm text-gray-600 mt-1">Patient Visit Slip</p>
        </div>

        <div className="border-t border-b border-dashed border-gray-400 py-4 my-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Token Number</p>
            <p className="text-6xl font-bold my-2">{tokenNumber}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium">{date.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time:</span>
            <span className="font-medium">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Patient:</span>
            <span className="font-medium">{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Doctor:</span>
            <span className="font-medium">{doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Room:</span>
            <span className="font-medium text-lg">{roomNumber}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-gray-400 text-center text-xs text-gray-500">
          <p>Please wait for your token number to be called.</p>
          <p className="mt-1">Thank you for visiting us!</p>
        </div>
      </div>
    );
  }
);

ReceptionSlip.displayName = 'ReceptionSlip';
