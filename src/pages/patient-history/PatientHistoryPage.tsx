import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, User, Calendar, Eye, Pill, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { format } from 'date-fns';

export default function PatientHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: history, isLoading: historyLoading } = usePatientHistory(selectedPatientId);

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  const getTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'same' | null }) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-destructive" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-green-500" />;
    if (trend === 'same') return <Minus className="h-3 w-3 text-muted-foreground" />;
    return null;
  };

  return (
    <AppShell>
      <PageHeader
        title="Patient History"
        description="Search patients and view their complete medical history"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Search */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Patients
            </CardTitle>
            <CardDescription>Find a patient by name or phone</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="h-[400px]">
              {patientsLoading ? (
                <p className="text-sm text-muted-foreground">Loading patients...</p>
              ) : filteredPatients?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients found</p>
              ) : (
                <div className="space-y-2">
                  {filteredPatients?.map((patient) => (
                    <Button
                      key={patient.id}
                      variant={selectedPatientId === patient.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start h-auto py-3"
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{patient.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {patient.phone} • {patient.age}y • {patient.gender}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Patient History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedPatient ? `${selectedPatient.name}'s History` : 'Patient History'}
            </CardTitle>
            <CardDescription>
              {selectedPatient
                ? `Registered: ${format(new Date(selectedPatient.created_at), 'PPP')}`
                : 'Select a patient to view their history'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPatientId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mb-4" />
                <p>Select a patient from the list to view their history</p>
              </div>
            ) : historyLoading ? (
              <p className="text-sm text-muted-foreground">Loading history...</p>
            ) : !history || history.visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4" />
                <p>No visit history found for this patient</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{history.totalVisits}</p>
                    <p className="text-xs text-muted-foreground">Total Visits</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{history.totalPrescriptions}</p>
                    <p className="text-xs text-muted-foreground">Prescriptions</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">
                      {history.visits[0]?.eye_measurement?.iop_right ?? '-'}/
                      {history.visits[0]?.eye_measurement?.iop_left ?? '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Latest IOP (R/L)</p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Visit History */}
                <Accordion type="multiple" className="space-y-4">
                  {history.visits.map((visit, index) => {
                    const previousVisit = history.visits[index + 1];
                    const iopRightTrend = getTrend(
                      visit.eye_measurement?.iop_right ?? null,
                      previousVisit?.eye_measurement?.iop_right ?? null
                    );
                    const iopLeftTrend = getTrend(
                      visit.eye_measurement?.iop_left ?? null,
                      previousVisit?.eye_measurement?.iop_left ?? null
                    );

                    return (
                      <AccordionItem
                        key={visit.id}
                        value={visit.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4 text-left">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(visit.created_at), 'PPP')}
                              </span>
                            </div>
                            <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'}>
                              {visit.status}
                            </Badge>
                            {visit.prescription && (
                              <Badge variant="outline">
                                <Pill className="h-3 w-3 mr-1" />
                                Prescribed
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          {/* Eye Measurements */}
                          {visit.eye_measurement && (
                            <div>
                              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                <Eye className="h-4 w-4" />
                                Eye Measurements
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Eye</TableHead>
                                    <TableHead>Visual Acuity</TableHead>
                                    <TableHead>SPH</TableHead>
                                    <TableHead>CYL</TableHead>
                                    <TableHead>Axis</TableHead>
                                    <TableHead>IOP</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-medium">Right</TableCell>
                                    <TableCell>
                                      {visit.eye_measurement.visual_acuity_right || '-'}
                                    </TableCell>
                                    <TableCell>{visit.eye_measurement.right_sph ?? '-'}</TableCell>
                                    <TableCell>{visit.eye_measurement.right_cyl ?? '-'}</TableCell>
                                    <TableCell>
                                      {visit.eye_measurement.right_axis ?? '-'}°
                                    </TableCell>
                                    <TableCell className="flex items-center gap-1">
                                      {visit.eye_measurement.iop_right ?? '-'}
                                      <TrendIcon trend={iopRightTrend} />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-medium">Left</TableCell>
                                    <TableCell>
                                      {visit.eye_measurement.visual_acuity_left || '-'}
                                    </TableCell>
                                    <TableCell>{visit.eye_measurement.left_sph ?? '-'}</TableCell>
                                    <TableCell>{visit.eye_measurement.left_cyl ?? '-'}</TableCell>
                                    <TableCell>{visit.eye_measurement.left_axis ?? '-'}°</TableCell>
                                    <TableCell className="flex items-center gap-1">
                                      {visit.eye_measurement.iop_left ?? '-'}
                                      <TrendIcon trend={iopLeftTrend} />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                              {visit.eye_measurement.pd && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  PD: {visit.eye_measurement.pd}mm
                                </p>
                              )}
                              {visit.eye_measurement.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Notes: {visit.eye_measurement.notes}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Prescription */}
                          {visit.prescription && (
                            <div>
                              <Separator className="my-4" />
                              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                                <Pill className="h-4 w-4" />
                                Prescription
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium">Diagnosis: </span>
                                  <span className="text-sm">{visit.prescription.diagnosis}</span>
                                </div>
                                {visit.prescription.prescription_medicines?.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium">Medicines:</span>
                                    <ul className="mt-1 space-y-1">
                                      {visit.prescription.prescription_medicines.map((med) => (
                                        <li
                                          key={med.id}
                                          className="text-sm text-muted-foreground ml-4"
                                        >
                                          • {med.medicine_name} - {med.quantity}x ({med.dosage})
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {visit.prescription.follow_up_note && (
                                  <div>
                                    <span className="text-sm font-medium">Follow-up: </span>
                                    <span className="text-sm text-muted-foreground">
                                      {visit.prescription.follow_up_note}
                                    </span>
                                  </div>
                                )}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>
                                    Created: {format(new Date(visit.prescription.created_at), 'Pp')}
                                  </span>
                                  {visit.prescription.dispensed && visit.prescription.dispensed_at && (
                                    <span>
                                      Dispensed:{' '}
                                      {format(new Date(visit.prescription.dispensed_at), 'Pp')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
