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
  patient_age: z.string().optional(),
  patient_gender: z.string().optional(),
  patient_contact: z.string().optional(),
  chief_complaint: z.string().min(1, 'Chief complaint is required'),
  history_present_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  review_of_systems: z.string().optional(),
  investigation: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  appointment_date: z.date().optional(),
  notes: z.string().optional(),
  // New fields (optional)
  blood_pressure: z.string().optional(),
  pulse_rate: z.string().optional(),
  respiratory_rate: z.string().optional(),
  spo2: z.string().optional(),
  obstetrics_gyne_history: z.string().optional(),
  family_social_history: z.string().optional(),
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
      patient_age: '',
      patient_gender: '',
      patient_contact: '',
      chief_complaint: '',
      history_present_illness: '',
      past_medical_history: '',
      review_of_systems: '',
      investigation: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      blood_pressure: '',
      pulse_rate: '',
      respiratory_rate: '',
      spo2: '',
      obstetrics_gyne_history: '',
      family_social_history: '',
    },
  });

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
      // Only add fields that exist or have values
      const payload: any = {
        patient_name: data.patient_name,
        patient_age: data.patient_age ? parseInt(data.patient_age) : null,
        patient_gender: data.patient_gender || null,
        patient_contact: data.patient_contact || null,
        chief_complaint: data.chief_complaint,
        history_present_illness: data.history_present_illness || null,
        past_medical_history: data.past_medical_history || null,
        review_of_systems: data.review_of_systems || null,
        investigation: data.investigation || null,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        appointment_date: data.appointment_date?.toISOString() || null,
        notes: data.notes || null,
        created_by: user.id,
      };

      // Safely add new optional fields
      if (data.blood_pressure) payload.blood_pressure = data.blood_pressure;
      if (data.pulse_rate) payload.pulse_rate = data.pulse_rate;
      if (data.respiratory_rate) payload.respiratory_rate = data.respiratory_rate;
      if (data.spo2) payload.spo2 = data.spo2;
      if (data.obstetrics_gyne_history) payload.obstetrics_gyne_history = data.obstetrics_gyne_history;
      if (data.family_social_history) payload.family_social_history = data.family_social_history;

      const { error } = await (supabase as any).from('assessments').insert(payload);
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
                  <div className="grid gap-4 md:grid-cols-2">
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
                          <FormLabel>Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone or email" {...field} />
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

                  {/* Vital Signs (optional) */}
                  <div className="grid gap-4 md:grid-cols-4">
                  {['blood_pressure', 'pulse_rate', 'respiratory_rate', 'spo2'].map((fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as keyof AssessmentForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{fieldName.replace('_', ' ').toUpperCase()}</FormLabel>
                            <FormControl>
                              <Input placeholder={fieldName.replace('_', ' ')} {...field} value={field.value as string || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
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

                  {/* Optional sections */}
                  {[
                    { name: 'history_present_illness', label: 'History of Present Illness', rows: 4 },
                    { name: 'obstetrics_gyne_history', label: 'Obstetrics/Gynecology History', rows: 3 },
                    { name: 'past_medical_history', label: 'Past Medical History', rows: 3 },
                    { name: 'family_social_history', label: 'Family/Social History', rows: 3 },
                    { name: 'review_of_systems', label: 'Review of Systems', rows: 4 },
                    { name: 'investigation', label: 'Investigation', rows: 3 },
                    { name: 'diagnosis', label: 'Diagnosis', rows: 2 },
                    { name: 'treatment', label: 'Treatment', rows: 4 },
                  ].map((section) => (
                    <FormField
                      key={section.name}
                      control={form.control}
                      name={section.name as keyof AssessmentForm}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{section.label}</FormLabel>
                          <FormControl>
                            <Textarea rows={section.rows} {...field} value={field.value as string || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  {/* Appointment & Notes */}
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
