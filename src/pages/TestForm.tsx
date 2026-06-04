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
import type { Topic, CreateTestPayload } from '../types';

const testSchema = z.object({
  title: z.string().min(3, 'Test name must be at least 3 characters'),
  description: z.string(),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  marksPerQuestion: z.number().min(1, 'Correct answer marks must be at least 1'),
  negativeMarking: z.number().min(0, 'Wrong answer negative marks cannot be negative'),
  difficulty: z.string(),
  testType: z.string(),
  subTopic: z.string(),
  unattemptedMarks: z.number(),
  noOfQuestions: z.number().min(1, 'Number of questions must be at least 1'),
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
  const [activeTab, setActiveTab] = useState<string>('Chapter Wise');

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
      description: 'Exam details created via Preproute panel.',
      subject: '',
      topics: [],
      duration: 60,
      totalMarks: 250,
      marksPerQuestion: 5,
      negativeMarking: 1,
      difficulty: 'Easy',
      testType: 'Chapter Wise',
      subTopic: '',
      unattemptedMarks: 0,
      noOfQuestions: 50,
    },
  });

  const watchedSubject = watch('subject');

  // 1. Initial Load
  useEffect(() => {
    fetchSubjects();
    if (isEditMode && id) {
      fetchTestById(id);
    } else {
      clearCurrentTest();
      reset({
        title: '',
        description: 'Exam details created via Preproute panel.',
        subject: '',
        topics: [],
        duration: 60,
        totalMarks: 250,
        marksPerQuestion: 5,
        negativeMarking: 1,
        difficulty: 'Easy',
        testType: 'Chapter Wise',
        subTopic: '',
        unattemptedMarks: 0,
        noOfQuestions: 50,
      });
    }
  }, [id, isEditMode, fetchSubjects, fetchTestById, clearCurrentTest, reset]);

  // 2. Fetch Topics when subject changes
  useEffect(() => {
    if (watchedSubject) {
      fetchTopics(watchedSubject);
      if (selectedSubjectId && watchedSubject !== selectedSubjectId) {
        setValue('topics', []);
      }
      setSelectedSubjectId(watchedSubject);
    } else {
      setSelectedSubjectId('');
    }
  }, [watchedSubject, fetchTopics, setValue, selectedSubjectId]);

  // 3. Populate form in edit mode
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
        description: currentTest.description || 'Exam details created via Preproute panel.',
        subject: subjectId,
        topics: topicIds,
        duration: currentTest.duration,
        totalMarks: currentTest.totalMarks,
        marksPerQuestion: currentTest.marksPerQuestion,
        negativeMarking: currentTest.negativeMarking,
        difficulty: currentTest.difficulty || 'Easy',
        testType: currentTest.testType || 'Chapter Wise',
        subTopic: currentTest.subTopic || '',
        unattemptedMarks: currentTest.unattemptedMarks || 0,
        noOfQuestions: currentTest.noOfQuestions || currentTest.questions?.length || 50,
      });
      setSelectedSubjectId(subjectId);
      setActiveTab(currentTest.testType || 'Chapter Wise');
    }
  }, [currentTest, isEditMode, reset]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setValue('testType', tab);
  };

  const onSubmit = async (values: TestFormValues) => {
    const payload: CreateTestPayload = {
      title: values.title,
      description: values.description || 'Exam details created via Preproute panel.',
      subject: values.subject,
      topics: values.topics,
      duration: values.duration,
      totalMarks: values.totalMarks,
      marksPerQuestion: values.marksPerQuestion,
      negativeMarking: values.negativeMarking,
      // Pass the extra visual fields in the payload as well
      difficulty: values.difficulty,
      testType: values.testType,
      subTopic: values.subTopic,
      unattemptedMarks: values.unattemptedMarks,
      noOfQuestions: values.noOfQuestions
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
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
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

      {/* Form Card (Styled to match Chapter Wise layout exactly) */}
      <div className="card" style={{ padding: '2.5rem' }}>
        
        {/* Form Header Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          {['Chapter Wise', 'PYQ', 'Mock Test'].map((tab) => (
            <button
              key={tab}
              type="button"
              className="btn"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                backgroundColor: activeTab === tab ? 'var(--primary-glow)' : 'var(--bg-primary)',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border-color)',
                fontWeight: 600,
                transition: 'all var(--transition-fast)'
              }}
              onClick={() => !isPublished && handleTabClick(tab)}
              disabled={isPublished}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} id="test-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Grid Row 1: Subject | Name of Test */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="select-subject">Subject*</label>
                <select
                  {...register('subject')}
                  id="select-subject"
                  className="form-select"
                  disabled={isLoading || isPublished}
                >
                  <option value="">Choose from Drop-down</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.subject && <span className="form-error">{errors.subject.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-title">Name of Test*</label>
                <input
                  {...register('title')}
                  type="text"
                  id="input-title"
                  className="form-input"
                  placeholder="Enter name of Test"
                  disabled={isLoading || isPublished}
                />
                {errors.title && <span className="form-error">{errors.title.message}</span>}
              </div>
            </div>

            {/* Grid Row 2: Topic | Sub Topic */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Topic*</label>
                {!watchedSubject ? (
                  <select className="form-select" disabled>
                    <option>Choose from Drop-down</option>
                  </select>
                ) : (
                  <Controller
                    name="topics"
                    control={control}
                    render={({ field }) => (
                      <select
                        className="form-select"
                        value={field.value[0] || ''}
                        onChange={(e) => field.onChange([e.target.value])}
                        disabled={isLoading || isPublished}
                      >
                        <option value="">Choose from Drop-down</option>
                        {topics.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}
                {errors.topics && <span className="form-error">{errors.topics.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-subtopic">Sub Topic</label>
                <input
                  {...register('subTopic')}
                  type="text"
                  id="input-subtopic"
                  className="form-input"
                  placeholder="Choose from Drop-down"
                  disabled={isLoading || isPublished}
                />
              </div>
            </div>

            {/* Grid Row 3: Duration (Minutes) | Test Difficulty Level */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-duration">Duration (Minutes)*</label>
                <input
                  {...register('duration', { valueAsNumber: true })}
                  type="number"
                  id="input-duration"
                  className="form-input"
                  placeholder="Enter the time"
                  min={1}
                  disabled={isLoading || isPublished}
                />
                {errors.duration && <span className="form-error">{errors.duration.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Test Difficulty Level</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                  {['Easy', 'Medium', 'Difficult'].map((level) => (
                    <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input
                        {...register('difficulty')}
                        type="radio"
                        value={level}
                        disabled={isLoading || isPublished}
                        style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Marking Scheme Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                Marking Scheme
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="input-negativeMarking">Wrong Answer*</label>
                  <input
                    {...register('negativeMarking', { valueAsNumber: true })}
                    type="number"
                    id="input-negativeMarking"
                    className="form-input"
                    placeholder="-1"
                    disabled={isLoading || isPublished}
                  />
                  {errors.negativeMarking && <span className="form-error">{errors.negativeMarking.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-unattempted">Unattempted*</label>
                  <input
                    {...register('unattemptedMarks', { valueAsNumber: true })}
                    type="number"
                    id="input-unattempted"
                    className="form-input"
                    placeholder="+0"
                    disabled={isLoading || isPublished}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-marksPerQuestion">Correct Answer*</label>
                  <input
                    {...register('marksPerQuestion', { valueAsNumber: true })}
                    type="number"
                    id="input-marksPerQuestion"
                    className="form-input"
                    placeholder="+5"
                    disabled={isLoading || isPublished}
                  />
                  {errors.marksPerQuestion && <span className="form-error">{errors.marksPerQuestion.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-noOfQuestions">No of Questions*</label>
                  <input
                    {...register('noOfQuestions', { valueAsNumber: true })}
                    type="number"
                    id="input-noOfQuestions"
                    className="form-input"
                    placeholder="Ex: 50"
                    disabled={isLoading || isPublished}
                  />
                  {errors.noOfQuestions && <span className="form-error">{errors.noOfQuestions.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-totalMarks">Total Marks*</label>
                  <input
                    {...register('totalMarks', { valueAsNumber: true })}
                    type="number"
                    id="input-totalMarks"
                    className="form-input"
                    placeholder="Ex: 250"
                    disabled={isLoading || isPublished}
                  />
                  {errors.totalMarks && <span className="form-error">{errors.totalMarks.message}</span>}
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '2rem',
              marginTop: '1.5rem'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
                id="btn-form-cancel"
              >
                <ArrowLeft size={16} />
                <span>Cancel</span>
              </button>

              {!isPublished && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  id="btn-form-submit"
                  style={{ minWidth: '120px' }}
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Saving...' : isEditMode ? 'Save' : 'Next'}</span>
                </button>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
