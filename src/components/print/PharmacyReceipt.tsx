import { forwardRef } from 'react';
import { PrintHeader } from './PrintHeader';

interface ReceiptItem {
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PharmacyReceiptProps {
  clinicName?: string;
  clinicLogo?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  date: Date;
  receiptNumber: string;
  patientName: string;
  tokenNumber: number;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
}

export const PharmacyReceipt = forwardRef<HTMLDivElement, PharmacyReceiptProps>(
  ({ clinicName = 'Eye Care Clinic', clinicLogo, clinicAddress, clinicPhone, date, receiptNumber, patientName, tokenNumber, items, totalAmount, paymentMethod }, ref) => {
    return (
      <div ref={ref} className="p-4 bg-white text-black w-[80mm] font-mono text-xs print-thermal">
        <PrintHeader clinicName={clinicName} logoUrl={clinicLogo} clinicAddress={clinicAddress} clinicPhone={clinicPhone} subtitle="Pharmacy Receipt" />
        <p className="text-center text-[10px] text-gray-500 -mt-2">Receipt #: {receiptNumber}</p>

        <div className="border-t border-dashed border-gray-400 py-2 text-[10px] mt-2">
          <div className="flex justify-between"><span>Date:</span><span>{date.toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span>Time:</span><span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div className="flex justify-between"><span>Patient:</span><span>{patientName}</span></div>
          <div className="flex justify-between"><span>Token:</span><span>#{tokenNumber}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2">
          <table className="w-full text-[10px]">
            <thead><tr><th className="text-left">Item</th><th className="text-center">Qty</th><th className="text-right">Price</th></tr></thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}><td className="py-1">{item.medicineName}</td><td className="py-1 text-center">{item.quantity}</td><td className="py-1 text-right">${item.totalPrice.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2">
          <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>${totalAmount.toFixed(2)}</span></div>
          <div className="flex justify-between text-[10px] mt-1"><span>Payment:</span><span className="uppercase">{paymentMethod}</span></div>
        </div>

        <div className="mt-3 text-center text-[10px] text-gray-500">
          <p>Thank you! Get well soon.</p>
        </div>
      </div>
    );
  }
);

PharmacyReceipt.displayName = 'PharmacyReceipt';
