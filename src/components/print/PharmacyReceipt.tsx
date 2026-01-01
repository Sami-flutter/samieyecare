import { forwardRef } from 'react';

interface ReceiptItem {
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PharmacyReceiptProps {
  clinicName?: string;
  date: Date;
  receiptNumber: string;
  patientName: string;
  tokenNumber: number;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
}

export const PharmacyReceipt = forwardRef<HTMLDivElement, PharmacyReceiptProps>(
  ({ 
    clinicName = 'Eye Care Clinic', 
    date, 
    receiptNumber,
    patientName, 
    tokenNumber, 
    items,
    totalAmount,
    paymentMethod
  }, ref) => {
    return (
      <div ref={ref} className="p-6 bg-white text-black w-[300px] font-mono text-sm">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase">{clinicName}</h1>
          <p className="text-xs">Pharmacy Receipt</p>
          <p className="text-xs text-gray-500">Receipt #: {receiptNumber}</p>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2 text-xs">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{date.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>Patient:</span>
            <span>{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span>Token:</span>
            <span>#{tokenNumber}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1">{item.medicineName}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2">
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment:</span>
            <span className="uppercase">{paymentMethod}</span>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Thank you for your purchase!</p>
          <p>Get well soon.</p>
        </div>
      </div>
    );
  }
);

PharmacyReceipt.displayName = 'PharmacyReceipt';
