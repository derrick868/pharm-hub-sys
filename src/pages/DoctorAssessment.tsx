import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  patient_contact: z.string().default(''),
  patient_age: z.string().default(''),
  patient_gender: z.string().default(''),
  bp: z.string().default(''),
  pulse_rate: z.string().default(''),
  respiratory_rate: z.string().default(''),
  spo2: z.string().default(''),
  chief_complaint: z.string().min(1, 'Chief complaint is required'),
  history_present_illness: z.string().default(''),
  obstetrics_gyne_history: z.string().default(''),
  past_medical_history: z.string().default(''),
  family_social_history: z.string().default(''),
  review_of_systems: z.string().default(''),
  investigation: z.string().default(''),
  diagnosis: z.string().default(''),
  treatment: z.string().default(''),
  appointment_date: z.date().optional(),
  notes: z.string().default(''),
});

type AssessmentForm = z.infer<typeof assessmentSchema>;

const DoctorAssessment = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<AssessmentForm>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      patient_name: '',
      patient_contact: '',
      patient_age: '',
      patient_gender: '',
      bp: '',
      pulse_rate: '',
      respiratory_rate: '',
      spo2: '',
      chief_complaint: '',
      history_present_illness: '',
      obstetrics_gyne_history: '',
      past_medical_history: '',
      family_social_history: '',
      review_of_systems: '',
      investigation: '',
      diagnosis: '',
      treatment: '',
      notes: '',
    },
  });

  const fetchAssessments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id, patient_name, patient_contact, patient_age, patient_gender,
        bp, pulse_rate, respiratory_rate, spo2,
        chief_complaint, history_present_illness, obstetrics_gyne_history,
        past_medical_history, family_social_history, review_of_systems,
        investigation, diagnosis, treatment, appointment_date, notes,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
    } else {
      setAssessments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const onSubmit = async (data: AssessmentForm) => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patient_name: data.patient_name,
        patient_contact: data.patient_contact || null,
        patient_age: data.patient_age ? parseInt(data.patient_age) : null,
        patient_gender: data.patient_gender || null,
        bp: data.bp || null,
        pulse_rate: data.pulse_rate || null,
        respiratory_rate: data.respiratory_rate || null,
        spo2: data.spo2 || null,
        chief_complaint: data.chief_complaint,
        history_present_illness: data.history_present_illness || null,
        obstetrics_gyne_history: data.obstetrics_gyne_history || null,
        past_medical_history: data.past_medical_history || null,
        family_social_history: data.family_social_history || null,
        review_of_systems: data.review_of_systems || null,
        investigation: data.investigation || null,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        appointment_date: data.appointment_date?.toISOString() || null,
        notes: data.notes || null,
        created_by: user.id,
      };

      const { error } = await supabase.from('assessments').insert(payload);

      if (error) throw error;

      toast.success('Assessment saved successfully');
      form.reset();
      fetchAssessments();
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
                  <div className="grid gap-4 md:grid-cols-4">
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
                      name="patient_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telephone Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Patient phone number" {...field} />
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

                  {/* Vital Signs */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="bp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BP</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 120/80 mmHg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pulse_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pulse Rate</FormLabel>
                          <FormControl>
                            <Input placeholder="beats per minute" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="respiratory_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Respiratory Rate</FormLabel>
                          <FormControl>
                            <Input placeholder="breaths per minute" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="spo2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spo2</FormLabel>
                          <FormControl>
                            <Input placeholder="oxygen saturation %" {...field} />
                          </FormControl>
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

                  {/* Obstetrics/Gynecology History */}
                  <FormField
                    control={form.control}
                    name="obstetrics_gyne_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obstetrics/Gynecology History</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Relevant obstetrics or gynecology history" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Past Medical History */}
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

                  {/* Family/Social History */}
                  <FormField
                    control={form.control}
                    name="family_social_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family/Social History</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Family medical history or social habits" rows={3} {...field} />
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

                  {/* Appointment and Notes */}
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
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments by patient name, diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                No assessments found. Add a new one in the “New Assessment” tab.
              </p>
            </div>
          ) : (
            <AssessmentsTable searchQuery={searchQuery} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAssessment;
