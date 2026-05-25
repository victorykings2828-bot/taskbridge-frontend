import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { CheckCircleIcon, FlagIcon, UploadIcon, ClockIcon, AlertIcon, PlayIcon, EditIcon, TrashIcon, CalendarIcon, XIcon, PaperclipIcon, FileIcon } from '../components/common/icons';
import { formatDateTime, formatDate, timeAgo, getInitials, generateAvatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

// A stored file has a real http(s) URL. "mock://" means storage isn't configured.
const isStored = (url) => /^https?:\/\//.test(url || '');
// Force a download (not in-browser view) for Cloudinary-hosted files.
const toDownloadUrl = (url) =>
  /res\.cloudinary\.com/.test(url) && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/fl_attachment/')
    : url;

const TaskDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [comment, setComment]             = useState('');
  const [comments, setComments]           = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionNote, setRevisionNote]   = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [flagReason, setFlagReason]       = useState('');
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [extensionDate, setExtensionDate]     = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [showExtensionInput, setShowExtensionInput] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch {
      toast.error('Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/tasks/${id}/comments`);
      setComments(res.data.comments || []);
    } catch {
      // silently fail
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [fetchTask, fetchComments]);

  const handleStatusUpdate = async (status) => {
    setActionLoading(true);
    try {
      await api.put(`/tasks/${id}/status`, { status });
      toast.success('Status updated!');
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setActionLoading(false); }
  };

  const handleAcceptOrFlag = async (action) => {
    if (action === 'flag' && !flagReason.trim()) {
      toast.error('Please enter a reason for flagging');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/tasks/${id}/accept`, { action, flagReason });
      toast.success(action === 'accept' ? 'Task accepted! It is now In Progress.' : 'Task flagged — manager notified.');
      setShowFlagInput(false);
      setFlagReason('');
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  const handleReview = async (action) => {
    if (action === 'revision' && !revisionNote.trim()) {
      toast.error('Please provide a revision note');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/tasks/${id}/review`, { action, revisionNote });
      toast.success(action === 'approve' ? 'Task approved!' : 'Revision requested — employee notified.');
      setShowRevisionInput(false);
      setRevisionNote('');
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  const handleExtensionRequest = async () => {
    setActionLoading(true);
    try {
      await api.put(`/tasks/${id}/extension`, { extensionReason, extensionDate });
      toast.success('Extension request sent to manager!');
      setShowExtensionInput(false);
      setExtensionDate(''); setExtensionReason('');
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to request extension'); }
    finally { setActionLoading(false); }
  };

  const handleCancelTask = async () => {
    if (!window.confirm('Cancel this task? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task cancelled');
      navigate('/tasks');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel task'); }
    finally { setActionLoading(false); }
  };

  const handleExtensionReview = async (action) => {
    setActionLoading(true);
    try {
      await api.put(`/tasks/${id}/extension/review`, { action });
      toast.success(action === 'approve' ? 'Extension approved!' : 'Extension rejected');
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/tasks/${id}/comments`, { content: comment.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setComment('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/${id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-3xl">
        <div className="h-6 bg-navy-200 rounded w-32" />
        <div className="h-48 bg-navy-200 rounded-2xl" />
        <div className="h-32 bg-navy-200 rounded-2xl" />
      </div>
    );
  }

  if (!task) return null;

  // Assignee = whoever the task is assigned to (an employee, OR a manager that a
  // super admin assigned it to). Assigner = the manager/super-admin who created it.
  const isAssignee = task.assignedTo?._id === user?._id;
  const isAssigner = (user?.role === 'manager' || user?.role === 'super_admin') && task.assignedBy?._id === user?._id;

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate('/tasks')}
        className="flex items-center gap-2 text-sm text-navy-500 hover:text-navy mb-6 transition-colors">
        ← Back to tasks
      </button>

      {/* Header Card */}
      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-navy mb-3">{task.title}</h1>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isFlagged && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                  <FlagIcon size={11} /> Flagged
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-navy-600 text-sm leading-relaxed mb-5 whitespace-pre-wrap">{task.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-navy-200 pt-4">
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Assigned to</p>
            <p className="font-medium text-navy">{task.assignedTo?.name}</p>
          </div>
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Assigned by</p>
            <p className="font-medium text-navy">{task.assignedBy?.name}</p>
          </div>
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Deadline</p>
            <p className={`font-medium ${task.status === 'overdue' ? 'text-red-600' : 'text-navy'}`}>
              {formatDate(task.deadline)}
            </p>
          </div>
          <div>
            <p className="text-xs text-navy-400 mb-0.5">Created</p>
            <p className="font-medium text-navy">{formatDateTime(task.createdAt)}</p>
          </div>
          {task.acceptedAt && (
            <div>
              <p className="text-xs text-navy-400 mb-0.5">Accepted</p>
              <p className="font-medium text-navy">{formatDate(task.acceptedAt)}</p>
            </div>
          )}
          {task.submittedAt && (
            <div>
              <p className="text-xs text-navy-400 mb-0.5">Submitted</p>
              <p className="font-medium text-navy">{formatDate(task.submittedAt)}</p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <p className="text-xs text-navy-400 mb-0.5">Completed</p>
              <p className="font-medium text-navy">{formatDate(task.completedAt)}</p>
            </div>
          )}
        </div>

        {task.revisionNote && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1"><EditIcon size={12} /> Revision Note from Manager</p>
            <p className="text-sm text-amber-800">{task.revisionNote}</p>
          </div>
        )}
        {task.flagReason && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-1"><FlagIcon size={12} /> Flag Reason</p>
            <p className="text-sm text-orange-800">{task.flagReason}</p>
          </div>
        )}
      </div>

      {/* Employee Actions */}
      {isAssignee && (
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-navy mb-4">Your Actions</h2>

          {task.status === 'not_started' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleAcceptOrFlag('accept')} disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all disabled:opacity-60">
                  <CheckCircleIcon size={16} /> Accept Task
                </button>
                <button onClick={() => setShowFlagInput(!showFlagInput)} disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 text-sm font-semibold rounded-xl hover:bg-orange-100 transition-all">
                  <FlagIcon size={16} /> Flag an Issue
                </button>
              </div>
              {showFlagInput && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Describe the issue (e.g. unclear requirements, missing resources...)"
                    className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:border-orange-400 resize-none"
                  />
                  <button onClick={() => handleAcceptOrFlag('flag')} disabled={actionLoading || !flagReason.trim()}
                    className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-all">
                    Submit Flag
                  </button>
                </div>
              )}
            </div>
          )}

          {task.status === 'in_progress' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleStatusUpdate('under_review')} disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-60">
                  <UploadIcon size={16} /> Submit for Review
                </button>
                <button onClick={() => setShowExtensionInput(!showExtensionInput)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-2 text-navy-600 border border-navy-200 text-sm font-semibold rounded-xl hover:bg-navy-100 transition-all">
                  <CalendarIcon size={16} /> Request Extension
                </button>
              </div>
              {showExtensionInput && (
                <div className="space-y-2 p-4 bg-surface-2 rounded-xl border border-navy-200">
                  <p className="text-xs font-medium text-navy-600">Request a deadline extension</p>
                  <input type="date" value={extensionDate} onChange={(e) => setExtensionDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm outline-none focus:border-brand" />
                  <textarea rows={2} value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="Why do you need more time?"
                    className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-surface text-sm outline-none focus:border-brand resize-none" />
                  <button onClick={handleExtensionRequest} disabled={actionLoading || !extensionDate || !extensionReason.trim()}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-light disabled:opacity-60 transition-all">
                    Submit Request
                  </button>
                </div>
              )}
              {task.extensionStatus === 'pending' && (
                <p className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium"><ClockIcon size={13} /> Extension request pending manager approval...</p>
              )}
            </div>
          )}

          {task.status === 'overdue' && (
            <div className="space-y-3">
              <p className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium"><AlertIcon size={15} /> This task is overdue. You can still work on it.</p>
              <button onClick={() => handleStatusUpdate('in_progress')} disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all disabled:opacity-60">
                <PlayIcon size={15} /> Continue Working
              </button>
            </div>
          )}

          {task.status === 'under_review' && (
            <p className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-medium"><ClockIcon size={15} /> Waiting for manager review...</p>
          )}

          {task.status === 'completed' && (
            <p className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircleIcon size={15} /> This task has been completed and approved!</p>
          )}
        </div>
      )}

      {/* Manager - Edit/Cancel task (only before accepted) */}
      {isAssigner && task.status === 'not_started' && (
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-navy mb-4">Manage Task</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/tasks/${id}/edit`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-all">
              <EditIcon size={16} /> Edit Task
            </button>
            <button onClick={handleCancelTask} disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all disabled:opacity-60">
              <TrashIcon size={16} /> Cancel Task
            </button>
          </div>
          <p className="text-xs text-navy-400 mt-3">Tasks can only be edited or cancelled before the employee accepts them.</p>
        </div>
      )}

      {/* Manager - Extension request pending */}
      {isAssigner && task.extensionStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 mb-1"><CalendarIcon size={15} /> Deadline Extension Requested</p>
          <p className="text-sm text-blue-700 mb-1">
            Employee requested extension to: <strong>{new Date(task.extensionDate).toDateString()}</strong>
          </p>
          <p className="text-sm text-blue-600 mb-3">Reason: {task.extensionReason}</p>
          <div className="flex gap-3">
            <button onClick={() => handleExtensionReview('approve')} disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-all">
              <CheckCircleIcon size={16} /> Approve Extension
            </button>
            <button onClick={() => handleExtensionReview('reject')} disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-60 transition-all">
              <XIcon size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Manager Review Actions */}
      {isAssigner && task.status === 'under_review' && (
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-navy mb-2">Review Submission</h2>
          <p className="text-sm text-navy-500 mb-4">Employee has submitted this task. Please review and decide.</p>
          <div className="flex flex-wrap gap-3 mb-3">
            <button onClick={() => handleReview('approve')} disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-60">
              <CheckCircleIcon size={16} /> Approve Task
            </button>
            <button onClick={() => setShowRevisionInput(!showRevisionInput)} disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold rounded-xl hover:bg-amber-100 transition-all">
              <EditIcon size={16} /> Request Revision
            </button>
          </div>
          {showRevisionInput && (
            <div className="space-y-2">
              <textarea rows={3} value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Describe what needs to be revised or improved..."
                className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:border-amber-400 resize-none"
              />
              <button onClick={() => handleReview('revision')} disabled={actionLoading || !revisionNote.trim()}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-60 transition-all">
                Send Revision Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manager - task is flagged notice */}
      {isAssigner && task.isFlagged && task.status === 'not_started' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-800 mb-1"><FlagIcon size={14} /> Employee flagged this task</p>
          <p className="text-sm text-orange-700">{task.flagReason}</p>
          <p className="text-xs text-orange-500 mt-2">Respond via comments below or edit/cancel the task.</p>
        </div>
      )}

      {/* Files & Deliverables */}
      {(task.files?.length > 0 || task.deliverables?.length > 0 || isAssigner || isAssignee) && (
        <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-navy mb-4">Files & Deliverables</h2>

          {/* Manager: task attachments */}
          {(task.files?.length > 0 || isAssigner) && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">Task Attachments</p>
              {task.files?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {task.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-navy-200">
                      <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0"><PaperclipIcon size={16} /></span>
                      <span className="text-sm text-navy flex-1 truncate">{f.name}</span>
                      {isStored(f.url) ? (
                        <a href={toDownloadUrl(f.url)} target="_blank" rel="noreferrer" download={f.name}
                          className="text-xs text-brand hover:underline font-medium">Download</a>
                      ) : (
                        <span className="text-xs text-navy-400" title="Configure Cloudinary to store files">Not stored</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 mb-3">No attachments yet</p>
              )}
              {isAssigner && (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-navy-200 text-sm font-medium text-navy-600 rounded-xl hover:bg-navy-100 cursor-pointer transition-all">
                  <PaperclipIcon size={16} /> Attach File
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      await api.post(`/tasks/${id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast.success('File attached!');
                      fetchTask();
                    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
                    e.target.value = '';
                  }} />
                </label>
              )}
            </div>
          )}

          {/* Employee: deliverables */}
          {(task.deliverables?.length > 0 || isAssignee) && (
            <div>
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">Deliverables</p>
              {task.deliverables?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {task.deliverables.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="w-8 h-8 rounded-lg bg-green-500/15 text-green-600 flex items-center justify-center flex-shrink-0"><FileIcon size={16} /></span>
                      <span className="text-sm text-navy flex-1 truncate">{f.name}</span>
                      {isStored(f.url) ? (
                        <a href={toDownloadUrl(f.url)} target="_blank" rel="noreferrer" download={f.name}
                          className="text-xs text-brand hover:underline font-medium">Download</a>
                      ) : (
                        <span className="text-xs text-navy-400" title="Configure Cloudinary to store files">Not stored</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 mb-3">No deliverables uploaded yet</p>
              )}
              {isAssignee && ['in_progress', 'under_review'].includes(task.status) && (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-sm font-medium text-green-700 rounded-xl hover:bg-green-100 cursor-pointer transition-all">
                  <UploadIcon size={16} /> Upload Deliverable
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      await api.post(`/tasks/${id}/deliverables`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast.success('Deliverable uploaded!');
                      fetchTask();
                    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
                    e.target.value = '';
                  }} />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="bg-surface rounded-2xl shadow-card border border-navy-200 p-6">
        <h2 className="text-base font-semibold text-navy mb-4">
          Comments
          {comments.length > 0 && <span className="text-navy-400 font-normal text-sm ml-1">({comments.length})</span>}
        </h2>

        {/* Comment Input */}
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1"
              style={{ backgroundColor: generateAvatarColor(user?.name || '') }}>
              {getInitials(user?.name || '')}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 bg-surface-2 text-sm outline-none focus:border-brand focus:bg-surface transition-all"
              />
              <button type="submit" disabled={submitting || !comment.trim()}
                className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all disabled:opacity-60 whitespace-nowrap">
                {submitting ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </form>

        {/* Comment List */}
        {commentsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-navy-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-navy-200 rounded w-24" />
                  <div className="h-4 bg-navy-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-navy-400 py-6">No comments yet. Start the conversation!</p>
        ) : (
          <div className="space-y-5">
            {comments.map((c) => (
              <div key={c._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: generateAvatarColor(c.author?.name || '') }}>
                  {getInitials(c.author?.name || '')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-navy">{c.author?.name}</p>
                    <span className="text-xs text-navy-400 capitalize bg-navy-100 px-2 py-0.5 rounded-full">
                      {c.author?.role?.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-navy-400">{timeAgo(c.createdAt)}</p>
                    {c.author?._id === user?._id && (
                      <button onClick={() => handleDeleteComment(c._id)}
                        className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-navy-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailPage;
