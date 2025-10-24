import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AssessmentsTable } from '@/components/assessment/AssessmentsTable';

const assessmentSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required'),
  patient_age: z.string().optional(),
  patient_gender: z.string().optional(),
  chief_complaint: z.string().min(1, 'Chief complaint is required'),
  history_present_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  review_of_systems: z.string().optional(),
  investigation: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  appointment_date: z.date().optional(),
  notes: z.string().optional(),
});

type AssessmentForm = z.infer<typeof assessmentSchema>;

const DoctorAssessment = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssessmentForm>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      patient_name: '',
      patient_age: '',
      patient_gender: '',
      chief_complaint: '',
      history_present_illness: '',
      past_medical_history: '',
      review_of_systems: '',
      investigation: '',
      diagnosis: '',
      treatment: '',
      notes: '',
    },
  });

  const onSubmit = async (data: AssessmentForm) => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from('assessments').insert({
        patient_name: data.patient_name,
        patient_age: data.patient_age ? parseInt(data.patient_age) : null,
        patient_gender: data.patient_gender,
        chief_complaint: data.chief_complaint,
        history_present_illness: data.history_present_illness,
        past_medical_history: data.past_medical_history,
        review_of_systems: data.review_of_systems,
        investigation: data.investigation,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        appointment_date: data.appointment_date?.toISOString(),
        notes: data.notes,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Assessment saved successfully');
      form.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Doctor's Assessment</h2>
        <p className="text-muted-foreground">Record patient assessment and treatment plan</p>
      </div>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">New Assessment</TabsTrigger>
          <TabsTrigger value="view">View All Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
        <CardHeader>
          <CardTitle>Patient Assessment Form</CardTitle>
          <CardDescription>Complete the patient evaluation and treatment details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Information */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="patient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patient_age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Age" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patient_gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Chief Complaint */}
              <FormField
                control={form.control}
                name="chief_complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Primary reason for visit" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* History of Present Illness */}
              <FormField
                control={form.control}
                name="history_present_illness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History of Present Illness</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Timeline and details of current condition" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Past Medical or Surgical History */}
              <FormField
                control={form.control}
                name="past_medical_history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Past Medical or Surgical History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Previous medical conditions, surgeries, etc." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Review of Systems */}
              <FormField
                control={form.control}
                name="review_of_systems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review of Systems</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Systematic review of body systems" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Investigation */}
              <FormField
                control={form.control}
                name="investigation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investigation</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Lab tests, imaging, diagnostic procedures" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Diagnosis */}
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Medical diagnosis" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Treatment */}
              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Treatment plan and medications" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Appointment */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="appointment_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Follow-up Appointment</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional information" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? 'Saving...' : 'Save Assessment'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="view">
          <AssessmentsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAssessment;
