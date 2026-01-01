import { forwardRef } from 'react';

interface PrescriptionMedicine {
  medicineName: string;
  quantity: number;
  dosage: string;
}

interface PrescriptionPrintProps {
  clinicName?: string;
  date: Date;
  patientName: string;
  patientAge: number;
  patientGender: string;
  tokenNumber: number;
  doctorName: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  followUpNote?: string;
  buyFromClinic: boolean;
}

export const PrescriptionPrint = forwardRef<HTMLDivElement, PrescriptionPrintProps>(
  ({ 
    clinicName = 'Eye Care Clinic', 
    date, 
    patientName, 
    patientAge,
    patientGender,
    tokenNumber, 
    doctorName, 
    diagnosis,
    medicines,
    followUpNote,
    buyFromClinic
  }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black w-[400px] font-sans">
        <div className="text-center mb-4 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold uppercase">{clinicName}</h1>
          <p className="text-sm text-gray-600">Medical Prescription</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div><span className="text-gray-500">Date:</span> {date.toLocaleDateString()}</div>
          <div className="text-right"><span className="text-gray-500">Token:</span> <span className="font-bold">#{tokenNumber}</span></div>
          <div><span className="text-gray-500">Patient:</span> {patientName}</div>
          <div className="text-right"><span className="text-gray-500">Age/Gender:</span> {patientAge}y / {patientGender}</div>
          <div className="col-span-2"><span className="text-gray-500">Doctor:</span> Dr. {doctorName}</div>
        </div>

        <div className="border-t border-gray-300 pt-4 mb-4">
          <p className="text-xs text-gray-500 uppercase mb-1">Diagnosis</p>
          <p className="font-medium">{diagnosis}</p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Rx - Medicines</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">#</th>
                <th className="text-left py-1">Medicine</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-left py-1">Dosage</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2 font-medium">{med.medicineName}</td>
                  <td className="py-2 text-center">{med.quantity}</td>
                  <td className="py-2 text-gray-600">{med.dosage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {followUpNote && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            <p className="text-xs text-gray-500 uppercase mb-1">Follow-up Instructions</p>
            <p>{followUpNote}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-300 text-sm">
          {buyFromClinic ? (
            <p className="text-center font-medium">Please proceed to Pharmacy counter</p>
          ) : (
            <p className="text-center text-gray-600">Patient will purchase medicines outside</p>
          )}
        </div>

        <div className="mt-8 text-right">
          <div className="inline-block border-t border-gray-400 pt-2 px-8">
            <p className="text-sm font-medium">Dr. {doctorName}</p>
            <p className="text-xs text-gray-500">Signature</p>
          </div>
        </div>
      </div>
    );
  }
);

PrescriptionPrint.displayName = 'PrescriptionPrint';
