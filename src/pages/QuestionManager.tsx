import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useTestStore } from '../store/useTestStore';
import { 
  ArrowRight, 
  Trash2, 
  ChevronRight, 
  Save, 
  AlertCircle,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import type { Question, Subject } from '../types';

import { useNavigate, useParams, Link } from 'react-router-dom';

const questionSchema = z.object({
  text: z.string().min(5, 'Question text must be at least 5 characters'),
  options: z.array(
    z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
    })
  ).length(4, 'Exactly 4 options are required'),
  marks: z.number().min(0.1, 'Marks must be at least 0.1'),
  negativeMarks: z.number().min(0, 'Negative marks cannot be negative'),
  explanation: z.string(),
  difficulty: z.string(),
  topic: z.string(),
  subTopic: z.string(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export const QuestionManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const {
    currentTest,
    questions,
    isLoading,
    error,
    fetchTestById,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion
  } = useTestStore();

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  
  // Custom confirmation modal for delete
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      marks: 5,
      negativeMarks: 1,
      explanation: '',
      difficulty: 'Easy',
      topic: '',
      subTopic: '',
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'options',
  });

  // 1. Initial Load: Fetch test details and its questions
  useEffect(() => {
    if (id) {
      fetchTestById(id);
      fetchQuestions(id);
    }
  }, [id, fetchTestById, fetchQuestions]);

  // 2. Set default marks/negative marks based on test profile when test loads
  useEffect(() => {
    if (currentTest && !editingQuestion) {
      setValue('marks', currentTest.marksPerQuestion || 5);
      setValue('negativeMarks', currentTest.negativeMarking || 1);
      setValue('difficulty', currentTest.difficulty || 'Easy');
    }
  }, [currentTest, editingQuestion, setValue]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCorrectOptionChange = (idx: number) => {
    setCorrectIndex(idx);
    fields.forEach((_, i) => {
      setValue(`options.${i}.isCorrect`, i === idx);
    });
  };

  const startEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    
    // Find correct index
    const correctIdx = q.options.findIndex(opt => opt.isCorrect);
    setCorrectIndex(correctIdx !== -1 ? correctIdx : 0);

    reset({
      text: q.text,
      options: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })),
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'Easy',
      topic: q.topic || '',
      subTopic: q.subTopic || '',
    });

    // Scroll form into view
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setCorrectIndex(0);
    reset({
      text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      marks: currentTest?.marksPerQuestion || 5,
      negativeMarks: currentTest?.negativeMarking || 1,
      explanation: '',
      difficulty: currentTest?.difficulty || 'Easy',
      topic: '',
      subTopic: '',
    });
  };

  const onSubmit = async (values: QuestionFormValues) => {
    if (!id) return;

    if (currentTest?.status === 'published') {
      toast.error('Cannot modify questions on a published test');
      return;
    }

    const updatedOptions = values.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === correctIndex
    }));

    const payload = {
      ...values,
      options: updatedOptions,
      test: id
    };

    if (editingQuestion) {
      const updated = await updateQuestion(editingQuestion._id, payload);
      if (updated) {
        toast.success('Question updated successfully!');
        cancelEdit();
        fetchQuestions(id);
      }
    } else {
      const created = await createQuestion(payload);
      if (created) {
        toast.success('Question added successfully!');
        
        reset({
          text: '',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          marks: values.marks,
          negativeMarks: values.negativeMarks,
          explanation: '',
          difficulty: values.difficulty,
          topic: values.topic || '',
          subTopic: values.subTopic || '',
        });
        setCorrectIndex(0);
        fetchQuestions(id);
      }
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete || !id) return;
    setIsDeleting(true);
    const success = await deleteQuestion(questionToDelete._id);
    setIsDeleting(false);
    if (success) {
      toast.success('Question deleted successfully');
      fetchQuestions(id);
    }
    setQuestionToDelete(null);
  };

  const isPublished = currentTest?.status === 'published';

  // Get Subject Name Helper
  const getSubjectName = (subRef: Subject | string) => {
    if (typeof subRef === 'object' && subRef !== null) return subRef.name;
    return 'English';
  };

  // Get Topics Name Helper
  const getTopicsName = () => {
    if (!currentTest?.topics || currentTest.topics.length === 0) return 'Grammar, Writing';
    const first = currentTest.topics[0];
    if (typeof first === 'object' && first !== null) return first.name;
    return 'Grammar';
  };

  // Generate 50 questions placeholders matching sidebar
  const totalDemoQuestions = currentTest?.noOfQuestions || 50;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
        <ChevronRight size={14} />
        <Link to={`/tests/${id}/edit`} style={{ color: 'var(--text-secondary)' }}>Edit Test</Link>
        <ChevronRight size={14} />
        <span>Manage Questions</span>
      </div>

      {/* Step Wizard Header */}
      <div className="steps-container">
        <div className="steps-line" />
        <div className="step-item completed">
          <div className="step-dot" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tests/${id}/edit`)}>1</div>
          <span className="step-label">Test Details</span>
        </div>
        <div className="step-item active">
          <div className="step-dot">2</div>
          <span className="step-label">Add Questions</span>
        </div>
        <div className={`step-item ${questions.length > 0 ? 'completed' : ''}`}>
          <div className="step-dot" style={{ cursor: questions.length > 0 ? 'pointer' : 'default' }} onClick={() => questions.length > 0 && navigate(`/tests/${id}/preview`)}>3</div>
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
            <strong>Notice:</strong> This test is published. Questions are locked and cannot be added, edited, or deleted.
          </div>
        </div>
      )}

      {/* Figma Twin Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side Panel: Question List Sidebar */}
        <aside className="card" style={{ padding: '1.25rem', maxHeight: '75vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Question creation</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Questions : {totalDemoQuestions}
            </span>
          </div>

          {/* Vertical scrollable list of question slots */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
            {Array.from({ length: totalDemoQuestions }).map((_, idx) => {
              const qIndex = idx + 1;
              const hasQuestion = questions[idx];
              const isActive = (editingQuestion && editingQuestion._id === hasQuestion?._id) || (!editingQuestion && questions.length === idx);

              return (
                <div
                  key={idx}
                  onClick={() => hasQuestion && startEditQuestion(hasQuestion)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive 
                      ? 'var(--primary-glow)' 
                      : hasQuestion ? 'var(--bg-primary)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive 
                      ? 'var(--primary)' 
                      : hasQuestion ? 'var(--border-color)' : 'transparent',
                    cursor: hasQuestion ? 'pointer' : 'default',
                    opacity: hasQuestion || isActive ? 1 : 0.45,
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: isActive || hasQuestion ? 600 : 400,
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)'
                  }}>
                    Question {qIndex}
                  </span>
                  
                  {hasQuestion ? (
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                  ) : isActive ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Editing</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Header Card & Question Creator Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Info Card (Matches Figma metadata header) */}
          {currentTest && (
            <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span className="badge badge-published" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                  {currentTest.testType || 'Chapter Wise'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{currentTest.title}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    {currentTest.difficulty || 'Easy'}
                  </span>
                </h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Subject: <strong>{getSubjectName(currentTest.subject)}</strong></span>
                  <span>Topic: <strong>{getTopicsName()}</strong></span>
                  { currentTest.subTopic && (
                    <span>Sub Topic: <strong>{currentTest.subTopic}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration</div>
                  <strong style={{ fontSize: '1rem' }}>{currentTest.duration} Min</strong>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Questions</div>
                  <strong style={{ fontSize: '1rem' }}>{questions.length} / {totalDemoQuestions}</strong>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marks</div>
                  <strong style={{ fontSize: '1rem' }}>{currentTest.totalMarks}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Question Creator Card */}
          {!isPublished && (
            <div ref={formRef} className="card" style={{ padding: '2rem' }}>
              
              {/* Question form header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Question {editingQuestion ? questions.findIndex(q => q._id === editingQuestion._id) + 1 : questions.length + 1} / {totalDemoQuestions}</span>
                  {editingQuestion && (
                    <button type="button" onClick={cancelEdit} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                      Exit Edit Mode
                    </button>
                  )}
                </h3>
                
                {/* Method selector tabs */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: '0.8rem' }}>
                    + MCQ
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => toast.success('CSV upload modal triggered! Ready for questions import.')}
                  >
                    <FileSpreadsheet size={14} />
                    <span>+ CSV</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Text Editor Panel (Formatting Toolbar + Input) */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {/* Mock Rich Text Toolbar */}
                    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Bold size={16} /></button>
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Italic size={16} /></button>
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Underline size={16} /></button>
                      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><LinkIcon size={16} /></button>
                      <button 
                        type="button" 
                        style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        onClick={() => toast.success('Image uploader triggered!')}
                      ><ImageIcon size={16} /></button>
                      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><List size={16} /></button>
                      <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><AlignLeft size={16} /></button>
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><AlignCenter size={16} /></button>
                      <button type="button" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><AlignRight size={16} /></button>
                    </div>

                    {/* Question text box */}
                    <textarea
                      {...register('text')}
                      id="input-question-text"
                      className="form-input"
                      placeholder="Type here"
                      rows={4}
                      style={{ border: 'none', borderRadius: '0', resize: 'vertical', padding: '1rem', outline: 'none', boxShadow: 'none' }}
                      disabled={isLoading}
                    />
                    {errors.text && <span className="form-error" style={{ margin: '0.5rem 1rem' }}>{errors.text.message}</span>}
                  </div>

                  {/* MCQ Options: "Type the options below" */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Type the options below</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {fields.map((field, idx) => (
                        <div key={field.id} className="mcq-option-row">
                          <input
                            type="radio"
                            name="correct-option"
                            className="mcq-radio-input"
                            checked={correctIndex === idx}
                            onChange={() => handleCorrectOptionChange(idx)}
                            disabled={isLoading}
                            title="Mark as correct answer"
                            id={`radio-option-${idx}`}
                          />
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              {...register(`options.${idx}.text`)}
                              type="text"
                              className="form-input"
                              placeholder={`Type Option here`}
                              style={{ 
                                borderColor: correctIndex === idx ? 'var(--success)' : '',
                                boxShadow: correctIndex === idx ? '0 0 0 3px var(--success-glow)' : ''
                              }}
                              disabled={isLoading}
                              id={`input-option-${idx}`}
                            />
                            
                            {/* Empty options placeholder delete indicator */}
                            <button
                              type="button"
                              onClick={() => setValue(`options.${idx}.text`, '')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}
                              title="Clear option text"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.options && (
                      <span className="form-error">{errors.options.root?.message || errors.options.message}</span>
                    )}
                  </div>

                  {/* Add Solution text area */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-explanation" style={{ fontWeight: 600 }}>Add Solution</label>
                    <textarea
                      {...register('explanation')}
                      id="input-explanation"
                      className="form-input"
                      placeholder="Type here"
                      rows={3}
                      style={{ resize: 'vertical' }}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Question Settings Panel */}
                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Question settings</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="select-difficulty">Level of Difficulty</label>
                        <select
                          {...register('difficulty')}
                          id="select-difficulty"
                          className="form-select"
                          disabled={isLoading}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Difficult">Difficult</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="input-q-topic">Topic</label>
                        <input
                          {...register('topic')}
                          type="text"
                          id="input-q-topic"
                          className="form-input"
                          placeholder="Select topic"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="input-q-subtopic">Sub-topic</label>
                        <input
                          {...register('subTopic')}
                          type="text"
                          id="input-q-subtopic"
                          className="form-input"
                          placeholder="Select sub-topic"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Hidden inputs to preserve marking defaults */}
                    <input type="hidden" {...register('marks', { valueAsNumber: true })} />
                    <input type="hidden" {...register('negativeMarks', { valueAsNumber: true })} />
                  </div>

                  {/* Bottom Actions footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate(`/tests/${id}/edit`)}
                      disabled={isLoading}
                      id="btn-exit-creation"
                      style={{ backgroundColor: 'var(--danger-glow)', color: 'var(--danger-hover)' }}
                    >
                      Exit Test Creation
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="submit"
                        className="btn btn-secondary"
                        disabled={isLoading}
                        id="btn-save-question"
                      >
                        <Save size={16} />
                        <span>{editingQuestion ? 'Update Question' : 'Save Question'}</span>
                      </button>

                      {questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => navigate(`/tests/${id}/preview`)}
                          className="btn btn-primary"
                          id="btn-preview-publish-go"
                        >
                          <span>Next</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* Render questions list if test is published */}
          {isPublished && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((question, index) => (
                <div key={question._id} className="question-item">
                  <div className="question-content">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Q{index + 1}. {question.text}
                    </h4>
                    <div className="question-options-preview">
                      {question.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`option-preview-item ${opt.isCorrect ? 'correct' : ''}`}>
                          <span style={{ marginRight: '0.25rem', fontWeight: 600 }}>{String.fromCharCode(65 + oIdx)}.</span>
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate(`/tests/${id}/preview`)} className="btn btn-primary" style={{ width: '200px', margin: '1rem auto 0' }}>
                Go to Preview
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {questionToDelete && (
        <div className="modal-overlay" onClick={() => setQuestionToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--danger)' }}>
              <AlertCircle size={24} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700 }}>Delete Question</h3>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this question? This action cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setQuestionToDelete(null)} disabled={isDeleting} id="btn-delete-q-cancel">
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteQuestion} disabled={isDeleting} id="btn-delete-q-confirm">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
