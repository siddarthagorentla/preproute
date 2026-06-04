import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useTestStore } from '../store/useTestStore';
import { 
  ArrowLeft, 
  Save, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import type { Topic } from '../types';

const testSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  marksPerQuestion: z.number().min(1, 'Marks per question must be at least 1'),
  negativeMarking: z.number().min(0, 'Negative marking cannot be negative'),
});

type TestFormValues = z.infer<typeof testSchema>;

export const TestForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const {
    currentTest,
    subjects,
    topics,
    isLoading,
    error,
    fetchSubjects,
    fetchTopics,
    fetchTestById,
    createTest,
    updateTest,
    clearCurrentTest
  } = useTestStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      topics: [],
      duration: 60,
      totalMarks: 100,
      marksPerQuestion: 4,
      negativeMarking: 1,
    },
  });

  const watchedSubject = watch('subject');

  // 1. Initial Load: Fetch Subjects and Test details (if in edit mode)
  useEffect(() => {
    fetchSubjects();
    if (isEditMode && id) {
      fetchTestById(id);
    } else {
      clearCurrentTest();
      reset({
        title: '',
        description: '',
        subject: '',
        topics: [],
        duration: 60,
        totalMarks: 100,
        marksPerQuestion: 4,
        negativeMarking: 1,
      });
    }
  }, [id, isEditMode, fetchSubjects, fetchTestById, clearCurrentTest, reset]);

  // 2. Fetch Topics when subject changes
  useEffect(() => {
    if (watchedSubject) {
      fetchTopics(watchedSubject);
      // Clear topics selection if user changes subject
      if (selectedSubjectId && watchedSubject !== selectedSubjectId) {
        setValue('topics', []);
      }
      setSelectedSubjectId(watchedSubject);
    } else {
      setSelectedSubjectId('');
    }
  }, [watchedSubject, fetchTopics, setValue, selectedSubjectId]);

  // 3. Populate form in edit mode when currentTest changes
  useEffect(() => {
    if (isEditMode && currentTest) {
      const subjectId = typeof currentTest.subject === 'object' && currentTest.subject !== null
        ? currentTest.subject._id
        : currentTest.subject as string;

      const topicIds = currentTest.topics.map((t: Topic | string) => 
        typeof t === 'object' && t !== null ? t._id : (t as string)
      );

      reset({
        title: currentTest.title,
        description: currentTest.description || '',
        subject: subjectId,
        topics: topicIds,
        duration: currentTest.duration,
        totalMarks: currentTest.totalMarks,
        marksPerQuestion: currentTest.marksPerQuestion,
        negativeMarking: currentTest.negativeMarking,
      });
      setSelectedSubjectId(subjectId);
    }
  }, [currentTest, isEditMode, reset]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (values: TestFormValues) => {
    const payload = {
      ...values,
      description: values.description || '',
    };

    if (isEditMode && id) {
      if (currentTest?.status === 'published') {
        toast.error('Published tests cannot be edited.');
        return;
      }
      const updated = await updateTest(id, payload);
      if (updated) {
        toast.success('Test details updated!');
        navigate(`/tests/${id}/questions`);
      }
    } else {
      const created = await createTest(payload);
      if (created) {
        toast.success('Test created successfully!');
        navigate(`/tests/${created._id}/questions`);
      }
    }
  };

  const isPublished = currentTest?.status === 'published';

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
        <ChevronRight size={14} />
        <span>{isEditMode ? 'Edit Test' : 'Create Test'}</span>
      </div>

      {/* Step Wizard Header */}
      <div className="steps-container">
        <div className="steps-line" />
        
        <div className="step-item active">
          <div className="step-dot">1</div>
          <span className="step-label">Test Details</span>
        </div>
        
        <div className={`step-item ${isEditMode ? 'completed' : ''}`}>
          <div className="step-dot" style={{ cursor: isEditMode ? 'pointer' : 'default' }} onClick={() => isEditMode && navigate(`/tests/${id}/questions`)}>2</div>
          <span className="step-label">Add Questions</span>
        </div>
        
        <div className={`step-item ${isEditMode && currentTest?.questions?.length ? 'completed' : ''}`}>
          <div className="step-dot" style={{ cursor: isEditMode ? 'pointer' : 'default' }} onClick={() => isEditMode && navigate(`/tests/${id}/preview`)}>3</div>
          <span className="step-label">Preview & Publish</span>
        </div>
      </div>

      {/* Warning Banner if published */}
      {isPublished && (
        <div style={{
          backgroundColor: 'var(--warning-glow)',
          color: 'var(--warning-hover)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Notice:</strong> This test is published. Details and questions are locked and cannot be edited.
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} id="test-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-title">Test Title*</label>
              <input
                {...register('title')}
                type="text"
                id="input-title"
                className="form-input"
                placeholder="e.g. React hooks and state management quiz"
                disabled={isLoading || isPublished}
              />
              {errors.title && <span className="form-error">{errors.title.message}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-description">Description</label>
              <textarea
                {...register('description')}
                id="input-description"
                className="form-input"
                placeholder="Provide details about the test syllabus, number of questions, etc."
                rows={3}
                style={{ resize: 'vertical' }}
                disabled={isLoading || isPublished}
              />
              {errors.description && <span className="form-error">{errors.description.message}</span>}
            </div>

            {/* Subject Select */}
            <div className="form-group">
              <label className="form-label" htmlFor="select-subject">Subject*</label>
              <select
                {...register('subject')}
                id="select-subject"
                className="form-select"
                disabled={isLoading || isPublished}
              >
                <option value="">Select a subject...</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {errors.subject && <span className="form-error">{errors.subject.message}</span>}
            </div>

            {/* Topics Multi-Select */}
            <div className="form-group">
              <label className="form-label">Topics* (Select one or more)</label>
              {!watchedSubject ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}>
                  Please select a subject to see topics.
                </div>
              ) : topics.length === 0 ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}>
                  No topics available for this subject.
                </div>
              ) : (
                <>
                  <Controller
                    name="topics"
                    control={control}
                    render={({ field }) => (
                      <div className="topics-grid" id="topics-multi-select">
                        {topics.map((topic) => {
                          const isChecked = field.value.includes(topic._id);
                          return (
                            <label key={topic._id} className="topic-checkbox-label">
                              <input
                                type="checkbox"
                                value={topic._id}
                                checked={isChecked}
                                onChange={() => {
                                  const newValue = isChecked
                                    ? field.value.filter((val) => val !== topic._id)
                                    : [...field.value, topic._id];
                                  field.onChange(newValue);
                                }}
                                disabled={isLoading || isPublished}
                                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                              />
                              <span>{topic.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.topics && <span className="form-error">{errors.topics.message}</span>}
                </>
              )}
            </div>

            {/* Grid for marking scheme fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              
              {/* Duration */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-duration">Duration (minutes)*</label>
                <input
                  {...register('duration', { valueAsNumber: true })}
                  type="number"
                  id="input-duration"
                  className="form-input"
                  min={1}
                  disabled={isLoading || isPublished}
                />
                {errors.duration && <span className="form-error">{errors.duration.message}</span>}
              </div>

              {/* Total Marks */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-totalMarks">Total Marks*</label>
                <input
                  {...register('totalMarks', { valueAsNumber: true })}
                  type="number"
                  id="input-totalMarks"
                  className="form-input"
                  min={1}
                  disabled={isLoading || isPublished}
                />
                {errors.totalMarks && <span className="form-error">{errors.totalMarks.message}</span>}
              </div>

              {/* Marks Per Question */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-marksPerQuestion">Marks Per Question*</label>
                <input
                  {...register('marksPerQuestion', { valueAsNumber: true })}
                  type="number"
                  id="input-marksPerQuestion"
                  className="form-input"
                  min={1}
                  disabled={isLoading || isPublished}
                />
                {errors.marksPerQuestion && <span className="form-error">{errors.marksPerQuestion.message}</span>}
              </div>

              {/* Negative Marking */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-negativeMarking">Negative Marks*</label>
                <input
                  {...register('negativeMarking', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  id="input-negativeMarking"
                  className="form-input"
                  min={0}
                  disabled={isLoading || isPublished}
                />
                {errors.negativeMarking && <span className="form-error">{errors.negativeMarking.message}</span>}
              </div>

            </div>

            {/* Actions Panel */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem',
              marginTop: '1rem'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
                id="btn-form-cancel"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>

              {!isPublished && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  id="btn-form-submit"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Saving...' : 'Save & Continue'}</span>
                </button>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
