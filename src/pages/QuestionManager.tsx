import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useTestStore } from '../store/useTestStore';
import { 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  HelpCircle, 
  ChevronRight, 
  Save, 
  AlertCircle,
  X 
} from 'lucide-react';
import type { Question } from '../types';

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
  explanation: z.string().optional().or(z.literal('')),
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
      marks: 4,
      negativeMarks: 1,
      explanation: '',
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
      setValue('marks', currentTest.marksPerQuestion);
      setValue('negativeMarks', currentTest.negativeMarking);
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
      marks: currentTest?.marksPerQuestion || 4,
      negativeMarks: currentTest?.negativeMarking || 1,
      explanation: '',
    });
  };

  const onSubmit = async (values: QuestionFormValues) => {
    if (!id) return;

    if (currentTest?.status === 'published') {
      toast.error('Cannot modify questions on a published test');
      return;
    }

    // Force verify the correct indices
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
        fetchQuestions(id); // Reload
      }
    } else {
      const created = await createQuestion(payload);
      if (created) {
        toast.success('Question added successfully!');
        
        // Reset only question text and options, keep marks configurations
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
        });
        setCorrectIndex(0);
        fetchQuestions(id); // Reload
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

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
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

      {/* Twin Panel Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isPublished ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Question Builder Form (Only visible if not published) */}
        {!isPublished && (
          <div ref={formRef} className="card" style={{ padding: '1.75rem', position: 'sticky', top: '90px' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={22} style={{ color: 'var(--primary)' }} />
              <span>{editingQuestion ? 'Edit Question' : 'Add MCQ Question'}</span>
              {editingQuestion && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <X size={14} />
                  <span>Cancel Edit</span>
                </button>
              )}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Question Text */}
                <div className="form-group">
                  <label className="form-label" htmlFor="input-question-text">Question Text*</label>
                  <textarea
                    {...register('text')}
                    id="input-question-text"
                    className="form-input"
                    placeholder="Enter question statement here..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                    disabled={isLoading}
                  />
                  {errors.text && <span className="form-error">{errors.text.message}</span>}
                </div>

                {/* MCQ Options with Selectors */}
                <div className="form-group">
                  <label className="form-label">Options & Correct Answer* (Mark correct option with radio button)</label>
                  <div className="mcq-builder-container">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="mcq-option-row">
                        <input
                          type="radio"
                          name="correct-option"
                          className="mcq-radio-input"
                          checked={correctIndex === idx}
                          onChange={() => handleCorrectOptionChange(idx)}
                          disabled={isLoading}
                          title="Mark this option as correct"
                          id={`radio-option-${idx}`}
                        />
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            {...register(`options.${idx}.text`)}
                            type="text"
                            className="form-input"
                            placeholder={`Option ${idx + 1}`}
                            style={{ 
                              borderColor: correctIndex === idx ? 'var(--success)' : '',
                              boxShadow: correctIndex === idx ? '0 0 0 3px var(--success-glow)' : ''
                            }}
                            disabled={isLoading}
                            id={`input-option-${idx}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.options && (
                    <span className="form-error">{errors.options.root?.message || errors.options.message}</span>
                  )}
                </div>

                {/* Score Schemes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-question-marks">Marks*</label>
                    <input
                      {...register('marks', { valueAsNumber: true })}
                      type="number"
                      id="input-question-marks"
                      className="form-input"
                      step="any"
                      min={0.1}
                      disabled={isLoading}
                    />
                    {errors.marks && <span className="form-error">{errors.marks.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-question-negative">Negative Marks*</label>
                    <input
                      {...register('negativeMarks', { valueAsNumber: true })}
                      type="number"
                      id="input-question-negative"
                      className="form-input"
                      step="any"
                      min={0}
                      disabled={isLoading}
                    />
                    {errors.negativeMarks && <span className="form-error">{errors.negativeMarks.message}</span>}
                  </div>
                </div>

                {/* Explanation */}
                <div className="form-group">
                  <label className="form-label" htmlFor="input-explanation">Explanation / Solution (Optional)</label>
                  <textarea
                    {...register('explanation')}
                    id="input-explanation"
                    className="form-input"
                    placeholder="Provide a step-by-step solution to this question..."
                    rows={2}
                    style={{ resize: 'vertical' }}
                    disabled={isLoading}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isLoading}
                  id="btn-question-submit"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add to Test'}</span>
                </button>

              </div>
            </form>
          </div>
        )}

        {/* Right Column: Question Bank / List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header Summary */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Question Bank</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Currently has <strong style={{ color: 'var(--text-primary)' }}>{questions.length}</strong> questions in this test. 
              {currentTest && (
                <span> Target total marks: <strong>{currentTest.totalMarks}</strong>.</span>
              )}
            </p>
          </div>

          {/* List items */}
          {isLoading && questions.length === 0 ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="spinner-loader" style={{
                width: '30px',
                height: '30px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : questions.length === 0 ? (
            <div className="card" style={{ 
              padding: '3rem 1.5rem', 
              textAlign: 'center', 
              borderStyle: 'dashed', 
              borderWidth: '2px', 
              color: 'var(--text-muted)'
            }}>
              <HelpCircle size={40} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>No Questions Added Yet</p>
              <p style={{ fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto' }}>
                Fill out the form on the left to add MCQ-format questions to this examination.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((question, index) => (
                <div key={question._id} className="question-item" id={`question-item-${question._id}`}>
                  <div className="question-content">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Q{index + 1}. {question.text}
                    </h4>

                    {/* Options list */}
                    <div className="question-options-preview">
                      {question.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx} 
                          className={`option-preview-item ${opt.isCorrect ? 'correct' : ''}`}
                        >
                          <span style={{ marginRight: '0.25rem', fontWeight: 600 }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt.text}
                        </div>
                      ))}
                    </div>

                    {/* Marking / Info stats */}
                    <div className="question-meta">
                      <span style={{ color: 'var(--success-hover)', fontWeight: 500 }}>
                        +{question.marks} Marks
                      </span>
                      <span>•</span>
                      <span style={{ color: 'var(--danger-hover)', fontWeight: 500 }}>
                        -{question.negativeMarks} Negative
                      </span>
                      {question.explanation && (
                        <>
                          <span>•</span>
                          <span title={question.explanation} style={{ textDecoration: 'underline', cursor: 'help' }}>
                            Has explanation
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions for Question */}
                  {!isPublished && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => startEditQuestion(question)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.4rem' }}
                        title="Edit Question"
                        id={`btn-edit-question-${question._id}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setQuestionToDelete(question)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.4rem' }}
                        title="Delete Question"
                        id={`btn-delete-question-${question._id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Navigation Controls bottom */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <button
              onClick={() => navigate(`/tests/${id}/edit`)}
              className="btn btn-secondary"
              id="btn-questions-back"
            >
              <ArrowLeft size={16} />
              <span>Back to Details</span>
            </button>

            {questions.length > 0 && (
              <button
                onClick={() => navigate(`/tests/${id}/preview`)}
                className="btn btn-primary"
                id="btn-questions-continue"
              >
                <span>Preview & Publish</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Delete Question Confirmation Modal */}
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
              <button 
                className="btn btn-secondary" 
                onClick={() => setQuestionToDelete(null)}
                disabled={isDeleting}
                id="btn-delete-q-cancel"
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteQuestion}
                disabled={isDeleting}
                id="btn-delete-q-confirm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin style */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
