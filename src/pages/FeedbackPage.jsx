import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDate, getInitials, generateAvatarColor } from '../utils/helpers';
import { TableSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readonly && onChange && onChange(star)}
        className={`text-2xl transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'} ${star <= value ? 'text-amber-400' : 'text-gray-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const FeedbackPage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks]         = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [selectedTask, setSelectedTask]   = useState(null);
  const [rating, setRating]               = useState(0);
  const [comment, setComment]             = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [tab, setTab]                     = useState('received'); // received | given | give

  const isManager  = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fbRes, taskRes] = await Promise.all([
        api.get('/feedback'),
        api.get('/tasks?status=completed&limit=50'),
      ]);
      setFeedbacks(fbRes.data.feedbacks || []);
      setCompletedTasks(taskRes.data.tasks || []);
    } catch { toast.error('Failed to load feedback data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openFeedbackModal = (task) => {
    setSelectedTask(task);
    setRating(0);
    setComment('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const type = isManager ? 'manager_to_employee' : 'employee_to_task';
      await api.post('/feedback', { taskId: selectedTask._id, rating, comment, type });
      toast.success('Feedback submitted!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSubmitting(false); }
  };

  // Tasks eligible to give feedback on
  const pendingFeedbackTasks = completedTasks.filter((task) => {
    const alreadyGiven = feedbacks.some(
      (fb) => fb.task?._id === task._id && fb.givenBy?._id === user?._id
    );
    if (isManager) return task.assignedBy?._id === user?._id && !alreadyGiven;
    if (isEmployee) return task.assignedTo?._id === user?._id && !alreadyGiven;
    return false;
  });

  const givenFeedbacks    = feedbacks.filter((fb) => fb.givenBy?._id === user?._id);
  const receivedFeedbacks = feedbacks.filter((fb) => fb.givenTo?._id === user?._id);

  const avgRating = receivedFeedbacks.length
    ? (receivedFeedbacks.reduce((s, f) => s + f.rating, 0) / receivedFeedbacks.length).toFixed(1)
    : null;

  const FeedbackCard = ({ fb }) => {
    const person = tab === 'received' ? fb.givenBy : fb.givenTo;
    const color  = generateAvatarColor(person?.name || '');
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: color }}>
              {getInitials(person?.name || '?')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{person?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{person?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <StarRating value={fb.rating} readonly />
        </div>
        {fb.task && (
          <Link to={`/tasks/${fb.task._id}`}
            className="text-xs text-blue-600 hover:underline font-medium block mb-2">
            📋 {fb.task.title}
          </Link>
        )}
        {fb.comment && <p className="text-sm text-gray-600 italic">"{fb.comment}"</p>}
        <p className="text-xs text-gray-400 mt-2">{formatDate(fb.createdAt)}</p>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-gray-500 mt-1">
          {isManager ? 'Rate your employees and see feedback on task clarity' : 'See your ratings and give feedback on task clarity'}
        </p>
      </div>

      {/* Stats row */}
      {avgRating && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-amber-500">{avgRating} <span className="text-amber-400">★</span></p>
            <p className="text-xs text-gray-400 mt-1">From {receivedFeedbacks.length} review{receivedFeedbacks.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Feedback Given</p>
            <p className="text-3xl font-bold text-blue-600">{givenFeedbacks.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Pending to Give</p>
            <p className="text-3xl font-bold text-green-600">{pendingFeedbackTasks.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['received', 'given', 'give'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'received' ? `Received (${receivedFeedbacks.length})`
              : t === 'given' ? `Given (${givenFeedbacks.length})`
              : `Give Feedback (${pendingFeedbackTasks.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3"><TableSkeleton rows={4} /></div>
      ) : tab === 'received' ? (
        receivedFeedbacks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-500">No feedback received yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {receivedFeedbacks.map((fb) => <FeedbackCard key={fb._id} fb={fb} />)}
          </div>
        )
      ) : tab === 'given' ? (
        givenFeedbacks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500">You haven't given any feedback yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {givenFeedbacks.map((fb) => <FeedbackCard key={fb._id} fb={fb} />)}
          </div>
        )
      ) : (
        // Give Feedback tab
        pendingFeedbackTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-500 font-medium">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No completed tasks waiting for feedback</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingFeedbackTasks.map((task) => {
              const person = isManager ? task.assignedTo : task.assignedBy;
              const color  = generateAvatarColor(person?.name || '');
              return (
                <div key={task._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}>
                    {getInitials(person?.name || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      {isManager ? `Assigned to ${person?.name}` : `Assigned by ${person?.name}`} · Completed {formatDate(task.completedAt)}
                    </p>
                  </div>
                  <button onClick={() => openFeedbackModal(task)}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-all whitespace-nowrap">
                    ★ Rate
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Feedback Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isManager ? 'Rate Employee Work' : 'Rate Task Clarity'}
            </h2>
            <p className="text-gray-500 text-sm mb-2">Task: <strong>{selectedTask.title}</strong></p>
            <p className="text-gray-400 text-xs mb-6">
              {isManager
                ? 'How well did the employee perform on this task?'
                : 'How clear and well-defined was this task?'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][rating]}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
                <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-500 resize-none focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || rating === 0}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
