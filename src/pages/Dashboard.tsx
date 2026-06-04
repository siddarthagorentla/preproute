import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTestStore } from '../store/useTestStore';
import { 
  FileText, 
  CheckCircle, 
  FileEdit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  HelpCircle, 
  Clock, 
  Award, 
  Plus,
  AlertTriangle
} from 'lucide-react';
import type { Test, Subject } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tests, 
    subjects, 
    isLoading, 
    error, 
    fetchTests, 
    fetchSubjects, 
    deleteTest,
    clearCurrentTest
  } = useTestStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Delete Confirmation Modal State
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTests();
    fetchSubjects();
    clearCurrentTest();
  }, [fetchTests, fetchSubjects, clearCurrentTest]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeleteClick = (e: React.MouseEvent, test: Test) => {
    e.stopPropagation();
    setTestToDelete(test);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;
    setIsDeleting(true);
    const success = await deleteTest(testToDelete._id);
    setIsDeleting(false);
    if (success) {
      toast.success('Test deleted successfully');
    }
    setTestToDelete(null);
  };

  // Get Subject Name Helper
  const getSubjectName = (subjectRef: Subject | string | null | undefined) => {
    if (typeof subjectRef === 'object' && subjectRef !== null) {
      return subjectRef.name;
    }
    const found = subjects.find(s => s._id === subjectRef);
    return found ? found.name : 'General';
  };

  // Calculations for dashboard stats
  const totalTests = tests.length;
  const publishedTests = tests.filter(t => t.status === 'published').length;
  const draftTests = tests.filter(t => t.status === 'draft').length;
  const totalQuestions = tests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

  // Filtered tests
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Subject filter
    const subjectId = typeof test.subject === 'object' && test.subject !== null 
      ? test.subject._id 
      : test.subject;
    const matchesSubject = selectedSubject === 'all' || subjectId === selectedSubject;
    
    // Status filter
    const matchesStatus = selectedStatus === 'all' || test.status === selectedStatus;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div>
      {/* Welcome & Action section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to your test management panel.</p>
        </div>
        <button 
          onClick={() => navigate('/tests/new')} 
          className="btn btn-primary"
          id="btn-create-test-top"
        >
          <Plus size={20} />
          <span>Create New Test</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{totalTests}</div>
            <div className="stat-label">Total Tests</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-glow)', color: 'var(--success-hover)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{publishedTests}</div>
            <div className="stat-label">Published Tests</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-glow)', color: 'var(--warning-hover)' }}>
            <FileEdit size={24} />
          </div>
          <div>
            <div className="stat-value">{draftTests}</div>
            <div className="stat-label">Draft Tests</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{totalQuestions}</div>
            <div className="stat-label">Total MCQ Questions</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search tests by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-search-tests"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter by Subject */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                className="form-select" 
                style={{ width: '160px', padding: '0.5rem 2rem 0.5rem 1rem' }}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                id="select-filter-subject"
              >
                <option value="all">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <select 
              className="form-select" 
              style={{ width: '140px', padding: '0.5rem 2rem 0.5rem 1rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              id="select-filter-status"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests Grid List */}
      {isLoading && tests.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="card" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
              <div className="spinner-loader" style={{
                width: '30px',
                height: '30px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderStyle: 'dashed',
          borderWidth: '2px'
        }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Tests Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all' 
              ? 'No tests match your current search queries or filters. Try resetting them.'
              : 'You have not created any tests yet. Click the button below to get started!'}
          </p>
          {(searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all') ? (
            <button className="btn btn-secondary" onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setSelectedStatus('all');
            }}>
              Clear Filters
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/tests/new')} id="btn-create-test-empty">
              <Plus size={18} />
              <span>Create Your First Test</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease-out' }}>
          {filteredTests.map((test) => (
            <div 
              key={test._id} 
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/tests/${test._id}/preview`)}
              id={`test-card-${test._id}`}
            >
              {/* Test Info */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{test.title}</h3>
                  <span className={`badge badge-${test.status}`}>
                    {test.status}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {test.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Award size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{getSubjectName(test.subject)}</span>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>{test.duration} mins</span>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Award size={14} />
                    <span>{test.totalMarks} Marks</span>
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <HelpCircle size={14} />
                    <span>{test.questions?.length || 0} Questions</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div 
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} 
                onClick={(e) => e.stopPropagation()} // Prevent card click redirect
              >
                <button 
                  onClick={() => navigate(`/tests/${test._id}/preview`)}
                  className="btn btn-secondary btn-sm"
                  title="Preview & Publish Test"
                  id={`btn-preview-${test._id}`}
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>

                <button 
                  onClick={() => navigate(`/tests/${test._id}/questions`)}
                  className="btn btn-secondary btn-sm"
                  title="Manage MCQ Questions"
                  id={`btn-questions-${test._id}`}
                >
                  <HelpCircle size={16} />
                  <span>Questions ({test.questions?.length || 0})</span>
                </button>

                <button 
                  onClick={() => navigate(`/tests/${test._id}/edit`)}
                  className="btn btn-secondary btn-sm"
                  title="Edit Test Details"
                  id={`btn-edit-${test._id}`}
                  disabled={test.status === 'published'}
                >
                  <FileEdit size={16} />
                  <span>Edit</span>
                </button>

                <button 
                  onClick={(e) => handleDeleteClick(e, test)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.5rem' }}
                  title="Delete Test"
                  id={`btn-delete-${test._id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {testToDelete && (
        <div className="modal-overlay" onClick={() => setTestToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700 }}>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              Are you sure you want to delete the test <strong style={{ color: 'var(--text-primary)' }}>"{testToDelete.title}"</strong>? 
              This action is permanent and will delete all associated MCQ questions.
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setTestToDelete(null)}
                disabled={isDeleting}
                id="btn-delete-cancel"
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete}
                disabled={isDeleting}
                id="btn-delete-confirm"
              >
                {isDeleting ? 'Deleting...' : 'Delete Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
