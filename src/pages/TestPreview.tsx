import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTestStore } from '../store/useTestStore';
import { 
  ArrowLeft, 
  Check, 
  Send, 
  Award, 
  Clock, 
  HelpCircle, 
  BookOpen, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  FileEdit
} from 'lucide-react';
import type { Subject, Topic } from '../types';

export const TestPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentTest,
    questions,
    subjects,
    topics,
    isLoading,
    error,
    fetchTestById,
    fetchQuestions,
    fetchSubjects,
    fetchTopics,
    publishTest
  } = useTestStore();

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [liveUntil, setLiveUntil] = useState<'always' | '1week' | '2weeks' | '3weeks' | '1month' | 'custom'>('always');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('12:00 PM');

  // 1. Initial Load
  useEffect(() => {
    if (id) {
      fetchTestById(id);
      fetchQuestions(id);
      fetchSubjects();
      fetchTopics();
    }
  }, [id, fetchTestById, fetchQuestions, fetchSubjects, fetchTopics]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePublishClick = () => {
    if (questions.length === 0) {
      toast.error('You cannot publish a test with no questions. Please add at least one question.');
      return;
    }
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!id) return;

    setIsPublishing(true);
    const updated = await publishTest(id);
    setIsPublishing(false);
    
    if (updated) {
      toast.success('Congratulations! The test has been published successfully.');
      setShowPublishModal(false);
      navigate('/dashboard');
    }
  };

  // Lookups for Subject and Topics
  const getSubjectName = (subjectRef: Subject | string | null | undefined) => {
    if (typeof subjectRef === 'object' && subjectRef !== null) {
      return subjectRef.name;
    }
    const found = subjects.find(s => s._id === subjectRef);
    return found ? found.name : 'General';
  };

  const getTopicNames = () => {
    if (!currentTest?.topics) return [];
    return currentTest.topics.map((t: Topic | string) => {
      if (typeof t === 'object' && t !== null) {
        return t.name;
      }
      const found = topics.find(topic => topic._id === t);
      return found ? found.name : t;
    });
  };

  const isPublished = currentTest?.status === 'published';
  const topicNames = getTopicNames();

  return (
    <div className="preview-container">
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
        <ChevronRight size={14} />
        <Link to={`/tests/${id}/edit`} style={{ color: 'var(--text-secondary)' }}>Edit Test</Link>
        <ChevronRight size={14} />
        <Link to={`/tests/${id}/questions`} style={{ color: 'var(--text-secondary)' }}>Questions</Link>
        <ChevronRight size={14} />
        <span>Preview & Publish</span>
      </div>

      {/* Step Wizard Header */}
      <div className="steps-container">
        <div className="steps-line" />
        
        <div className="step-item completed">
          <div className="step-dot" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tests/${id}/edit`)}>1</div>
          <span className="step-label">Test Details</span>
        </div>
        
        <div className="step-item completed">
          <div className="step-dot" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tests/${id}/questions`)}>2</div>
          <span className="step-label">Add Questions</span>
        </div>
        
        <div className="step-item active">
          <div className="step-dot">3</div>
          <span className="step-label">Preview & Publish</span>
        </div>
      </div>

      {/* Warning/Success Banner */}
      {isPublished ? (
        <div style={{
          backgroundColor: 'var(--success-glow)',
          color: 'var(--success-hover)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle size={24} />
          <div>
            <h4 style={{ color: 'var(--success-hover)', fontSize: '1rem', marginBottom: '0.25rem' }}>This test is Published</h4>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              The test is now live. It cannot be edited or deleted unless archived.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--primary-glow)',
          color: 'var(--primary)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          border: '1px solid var(--primary-glow)'
        }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>Review before Publishing</h4>
            <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-secondary)' }}>
              Please review all test parameters and questions below. Once published, the exam will be locked.
            </p>
          </div>
        </div>
      )}

      {isLoading && !currentTest ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner-loader" style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : currentTest ? (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Test Profile Summary Card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <div className="preview-header">
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{currentTest.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
                {currentTest.description || 'No description available for this test.'}
              </p>
            </div>

            {/* Meta badges / grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subject</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                  {getSubjectName(currentTest.subject)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Duration</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={16} />
                  {currentTest.duration} Minutes
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Marking System</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Award size={16} />
                  +{currentTest.marksPerQuestion} / -{currentTest.negativeMarking} Marks
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Questions</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <HelpCircle size={16} />
                  {questions.length} / {currentTest.totalMarks / currentTest.marksPerQuestion} Target
                </span>
              </div>
            </div>

            {/* Topics covered */}
            {topicNames.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Syllabus / Topics Covered</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {topicNames.map((name, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Questions Section */}
          <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Question Paper Review ({questions.length} Items)
          </h3>

          {questions.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <HelpCircle size={40} style={{ marginBottom: '1rem' }} />
              <p>No questions have been added to this test yet.</p>
              <button 
                onClick={() => navigate(`/tests/${id}/questions`)} 
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
              >
                Go Add Questions
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {questions.map((question, index) => (
                <div key={question._id} className="preview-question-card" id={`preview-question-${question._id}`}>
                  
                  {/* Header info for each question */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                      Q{index + 1}. {question.text}
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge-published" style={{ fontSize: '0.7rem' }}>
                        +{question.marks}
                      </span>
                      {question.negativeMarks > 0 && (
                        <span className="badge badge-draft" style={{ fontSize: '0.7rem' }}>
                          -{question.negativeMarks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {question.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        className={`preview-option-item ${opt.isCorrect ? 'correct' : ''}`}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: opt.isCorrect ? 'var(--success)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: opt.isCorrect ? 'var(--success)' : 'var(--text-muted)',
                          backgroundColor: opt.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                        }}>
                          {opt.isCorrect ? <Check size={12} strokeWidth={3} /> : String.fromCharCode(65 + oIdx)}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Solution explanation */}
                  {question.explanation && (
                    <div className="preview-explanation">
                      <strong>Solution Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Actions footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '2rem',
            marginTop: '3rem',
            marginBottom: '4rem'
          }}>
            
            <button
              onClick={() => navigate(`/tests/${id}/questions`)}
              className="btn btn-secondary"
              id="btn-preview-back"
            >
              <ArrowLeft size={16} />
              <span>Back to Questions</span>
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {!isPublished && (
                <button
                  onClick={() => navigate(`/tests/${id}/edit`)}
                  className="btn btn-secondary"
                  id="btn-preview-edit-details"
                  disabled={isLoading || isPublishing}
                >
                  <FileEdit size={16} />
                  <span>Edit Details</span>
                </button>
              )}

              {!isPublished ? (
                <button
                  onClick={handlePublishClick}
                  className="btn btn-primary"
                  id="btn-preview-publish"
                  disabled={isLoading || isPublishing || questions.length === 0}
                  style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                >
                  <Send size={16} />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Test'}</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                  id="btn-preview-dashboard"
                >
                  <span>Go to Dashboard</span>
                </button>
              )}
            </div>

          </div>

        </div>
      ) : null}

      {/* Figma Confirm Publish Modal */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Test creation</h3>
              <button onClick={() => setShowPublishModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success-glow)', color: 'var(--success-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <CheckCircle size={18} />
              <span>Test created : All {questions.length} Questions done</span>
            </div>

            {/* Tab choices */}
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => setPublishType('now')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: publishType === 'now' ? 'var(--bg-secondary)' : 'transparent',
                  color: publishType === 'now' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: publishType === 'now' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Publish Now
              </button>
              <button 
                type="button" 
                onClick={() => setPublishType('schedule')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: publishType === 'schedule' ? 'var(--bg-secondary)' : 'transparent',
                  color: publishType === 'schedule' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: publishType === 'schedule' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Schedule Publish
              </button>
            </div>

            {/* Live Until radio options grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Live Until</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Choose how long this test should remain available on the platform</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === 'always' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === 'always' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === 'always'} onChange={() => setLiveUntil('always')} style={{ cursor: 'pointer' }} />
                  <span>Always Available</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === '3weeks' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === '3weeks' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === '3weeks'} onChange={() => setLiveUntil('3weeks')} style={{ cursor: 'pointer' }} />
                  <span>3 Weeks</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === '1week' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === '1week' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === '1week'} onChange={() => setLiveUntil('1week')} style={{ cursor: 'pointer' }} />
                  <span>1 Week</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === '1month' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === '1month' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === '1month'} onChange={() => setLiveUntil('1month')} style={{ cursor: 'pointer' }} />
                  <span>1 Month</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === '2weeks' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === '2weeks' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === '2weeks'} onChange={() => setLiveUntil('2weeks')} style={{ cursor: 'pointer' }} />
                  <span>2 Weeks</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: liveUntil === 'custom' ? 'var(--primary-glow)' : 'var(--bg-primary)', borderColor: liveUntil === 'custom' ? 'var(--primary)' : 'var(--border-color)' }}>
                  <input type="radio" checked={liveUntil === 'custom'} onChange={() => setLiveUntil('custom')} style={{ cursor: 'pointer' }} />
                  <span>Custom Duration</span>
                </label>
              </div>
            </div>

            {/* Custom duration inputs */}
            {(liveUntil === 'custom' || publishType === 'schedule') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Select End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="form-input" 
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Select End Time</label>
                  <select 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="12:00 AM">12:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                  </select>
                </div>
              </div>
            )}

            {/* Confirm Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setShowPublishModal(false)} 
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.5rem' }}
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmPublish} 
                className="btn btn-primary"
                disabled={isPublishing}
                style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
              >
                {isPublishing ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner style */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
