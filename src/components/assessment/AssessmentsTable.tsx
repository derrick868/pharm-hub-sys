import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Assessment {
  id: string;
  patient_name: string;
  patient_contact?: string;
  patient_age?: number;
  patient_gender?: string;
  bp?: string;
  pulse_rate?: string;
  respiratory_rate?: string;
  spo2?: string;
  chief_complaint: string;
  history_present_illness?: string;
  obstetrics_gyne_history?: string;
  past_medical_history?: string;
  family_social_history?: string;
  review_of_systems?: string;
  investigation?: string;
  diagnosis?: string;
  treatment?: string;
  appointment_date?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

interface AssessmentsTableProps {
  searchQuery?: string;
}

export const AssessmentsTable = ({ searchQuery = '' }: AssessmentsTableProps) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchStaff();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
    } else {
      setAssessments(data || []);
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email');

    if (error) {
      console.error('Error fetching staff:', error);
    } else {
      setStaff(data || []);
    }
  };

  const handlePrint = (assessment: Assessment) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Assessment - ${assessment.patient_name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; color: #666; }
              .value { margin-left: 10px; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <h1>Patient Assessment</h1>
            <div class="section">
              <p><span class="label">Date:</span><span class="value">${format(new Date(assessment.created_at), 'PPP')}</span></p>
            </div>
            <div class="grid">
              <div><span class="label">Patient Name:</span><span class="value">${assessment.patient_name}</span></div>
              <div><span class="label">Contact:</span><span class="value">${assessment.patient_contact || 'N/A'}</span></div>
              <div><span class="label">Age:</span><span class="value">${assessment.patient_age || 'N/A'}</span></div>
              <div><span class="label">Gender:</span><span class="value">${assessment.patient_gender || 'N/A'}</span></div>
            </div>
            <div class="grid">
              <div><span class="label">BP:</span><span class="value">${assessment.bp || 'N/A'}</span></div>
              <div><span class="label">Pulse Rate:</span><span class="value">${assessment.pulse_rate || 'N/A'}</span></div>
              <div><span class="label">Respiratory Rate:</span><span class="value">${assessment.respiratory_rate || 'N/A'}</span></div>
              <div><span class="label">Spo2:</span><span class="value">${assessment.spo2 || 'N/A'}</span></div>
            </div>
            ${assessment.chief_complaint ? `<div class="section"><p class="label">Chief Complaint:</p><p>${assessment.chief_complaint}</p></div>` : ''}
            ${assessment.history_present_illness ? `<div class="section"><p class="label">History of Present Illness:</p><p>${assessment.history_present_illness}</p></div>` : ''}
            ${assessment.obstetrics_gyne_history ? `<div class="section"><p class="label">Obstetrics/Gyne History:</p><p>${assessment.obstetrics_gyne_history}</p></div>` : ''}
            ${assessment.past_medical_history ? `<div class="section"><p class="label">Past Medical History:</p><p>${assessment.past_medical_history}</p></div>` : ''}
            ${assessment.family_social_history ? `<div class="section"><p class="label">Family/Social History:</p><p>${assessment.family_social_history}</p></div>` : ''}
            ${assessment.review_of_systems ? `<div class="section"><p class="label">Review of Systems:</p><p>${assessment.review_of_systems}</p></div>` : ''}
            ${assessment.investigation ? `<div class="section"><p class="label">Investigation:</p><p>${assessment.investigation}</p></div>` : ''}
            ${assessment.diagnosis ? `<div class="section"><p class="label">Diagnosis:</p><p><strong>${assessment.diagnosis}</strong></p></div>` : ''}
            ${assessment.treatment ? `<div class="section"><p class="label">Treatment:</p><p>${assessment.treatment}</p></div>` : ''}
            ${assessment.appointment_date ? `<div class="section"><p class="label">Follow-up Appointment:</p><p>${format(new Date(assessment.appointment_date), 'PPP')}</p></div>` : ''}
            ${assessment.notes ? `<div class="section"><p class="label">Additional Notes:</p><p>${assessment.notes}</p></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleForward = async () => {
    if (!selectedAssessment || !selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    const staffMember = staff.find(s => s.id === selectedStaff);
    toast.success(`Assessment forwarded to ${staffMember?.full_name}`);
    setForwardDialogOpen(false);
    setSelectedStaff('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredAssessments = assessments.filter((assessment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      assessment.patient_name.toLowerCase().includes(query) ||
      (assessment.diagnosis && assessment.diagnosis.toLowerCase().includes(query)) ||
      (assessment.chief_complaint && assessment.chief_complaint.toLowerCase().includes(query))
    );
  });

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No assessments found.</p>
        </CardContent>
      </Card>
    );
  }

  if (filteredAssessments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No assessments match your search.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Patient Assessments</CardTitle>
          <CardDescription>View all recorded patient assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>Pulse</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>{format(new Date(assessment.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{assessment.patient_name}</TableCell>
                    <TableCell>{assessment.patient_contact || 'N/A'}</TableCell>
                    <TableCell>{assessment.patient_age || 'N/A'}</TableCell>
                    <TableCell className="capitalize">{assessment.patient_gender || 'N/A'}</TableCell>
                    <TableCell>{assessment.bp || 'N/A'}</TableCell>
                    <TableCell>{assessment.pulse_rate || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{assessment.diagnosis || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePrint(assessment)} title="Print">
                          <Printer className="h-4 w-4" />
                        </Button>
                        {/* Forward Dialog */}
                        <Dialog open={forwardDialogOpen && selectedAssessment?.id === assessment.id} onOpenChange={setForwardDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment)} title="Forward to Staff">
                              <Send className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Forward Assessment</DialogTitle>
                              <DialogDescription>
                                Forward this assessment to a staff member
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="staff">Select Staff Member</Label>
                                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                                  <SelectTrigger id="staff">
                                    <SelectValue placeholder="Choose staff member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {staff.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.full_name} ({member.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleForward}>Forward</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {/* View Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Assessment Details</DialogTitle>
                              <DialogDescription>
                                Patient: {assessment.patient_name} - {format(new Date(assessment.created_at), 'PPP')}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] pr-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                                    <p className="font-medium">{assessment.patient_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Contact</p>
                                    <p className="font-medium">{assessment.patient_contact || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Age</p>
                                    <p className="font-medium">{assessment.patient_age || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                    <p className="font-medium capitalize">{assessment.patient_gender || 'N/A'}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">BP</p>
                                    <p>{assessment.bp || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pulse Rate</p>
                                    <p>{assessment.pulse_rate || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Respiratory Rate</p>
                                    <p>{assessment.respiratory_rate || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Spo2</p>
                                    <p>{assessment.spo2 || 'N/A'}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Chief Complaint</p>
                                  <p className="text-sm">{assessment.chief_complaint}</p>
                                </div>

                                {assessment.history_present_illness && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">History of Present Illness</p>
                                    <p className="text-sm">{assessment.history_present_illness}</p>
                                  </div>
                                )}

                                {assessment.obstetrics_gyne_history && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Obstetrics/Gyne History</p>
                                    <p className="text-sm">{assessment.obstetrics_gyne_history}</p>
                                  </div>
                                )}

                                {assessment.past_medical_history && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Past Medical History</p>
                                    <p className="text-sm">{assessment.past_medical_history}</p>
                                  </div>
                                )}

                                {assessment.family_social_history && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Family/Social History</p>
                                    <p className="text-sm">{assessment.family_social_history}</p>
                                  </div>
                                )}

                                {assessment.review_of_systems && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Review of Systems</p>
                                    <p className="text-sm">{assessment.review_of_systems}</p>
                                  </div>
                                )}

                                {assessment.investigation && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Investigation</p>
                                    <p className="text-sm">{assessment.investigation}</p>
                                  </div>
                                )}

                                {assessment.diagnosis && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</p>
                                    <p className="text-sm font-medium">{assessment.diagnosis}</p>
                                  </div>
                                )}

                                {assessment.treatment && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Treatment</p>
                                    <p className="text-sm">{assessment.treatment}</p>
                                  </div>
                                )}

                                {assessment.appointment_date && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Follow-up Appointment</p>
                                    <Badge variant="outline">{format(new Date(assessment.appointment_date), 'PPP')}</Badge>
                                  </div>
                                )}

                                {assessment.notes && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Additional Notes</p>
                                    <p className="text-sm">{assessment.notes}</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
