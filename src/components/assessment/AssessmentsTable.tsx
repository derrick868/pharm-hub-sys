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
import { Eye } from 'lucide-react';

interface Assessment {
  id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint: string;
  history_present_illness?: string;
  past_medical_history?: string;
  review_of_systems?: string;
  investigation?: string;
  diagnosis?: string;
  treatment?: string;
  appointment_date?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export const AssessmentsTable = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchAssessments();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No assessments found.</p>
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
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(assessment.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{assessment.patient_name}</TableCell>
                    <TableCell>{assessment.patient_age || 'N/A'}</TableCell>
                    <TableCell className="capitalize">{assessment.patient_gender || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{assessment.chief_complaint}</TableCell>
                    <TableCell className="max-w-xs truncate">{assessment.diagnosis || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAssessment(assessment)}
                          >
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
                                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                                  <p className="font-medium">{assessment.patient_age || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                  <p className="font-medium capitalize">{assessment.patient_gender || 'N/A'}</p>
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

                              {assessment.past_medical_history && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Past Medical History</p>
                                  <p className="text-sm">{assessment.past_medical_history}</p>
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
                                  <Badge variant="outline">
                                    {format(new Date(assessment.appointment_date), 'PPP')}
                                  </Badge>
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
