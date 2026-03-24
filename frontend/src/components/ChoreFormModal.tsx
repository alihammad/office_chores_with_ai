import React, { useEffect, useState } from 'react';
import type { Chore, Member } from '../types';
import { createChore, updateChore, deleteChore } from '../api';
import './ChoreFormModal.css';

interface Props {
  members: Member[];
  initialDate?: string;     // pre-fill start_date when clicking "+" on a day
  initialEndDate?: string;  // pre-fill end_date when drag-selecting a range
  chore?: Chore;            // if provided, we're editing
  onSave: () => void;
  onClose: () => void;
}

export default function ChoreFormModal({ members, initialDate, initialEndDate, chore, onSave, onClose }: Props) {
  const [title, setTitle] = useState(chore?.title ?? '');
  const [description, setDescription] = useState(chore?.description ?? '');
  const [assigneeId, setAssigneeId] = useState<string>(chore?.assignee_id?.toString() ?? '');
  // Pre-check "repeat daily" when a multi-day range was drag-selected
  const [isRecurring, setIsRecurring] = useState(chore ? chore.is_recurring === 1 : !!initialEndDate);
  const [startDate, setStartDate] = useState(chore?.start_date ?? initialDate ?? '');
  const [endDate, setEndDate] = useState(chore?.end_date ?? initialEndDate ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
        is_recurring: isRecurring,
        start_date: startDate,
        end_date: isRecurring && endDate ? endDate : null,
      };
      if (chore) {
        await updateChore(chore.id, payload);
      } else {
        await createChore(payload);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!chore) return;
    if (!confirm(`Delete "${chore.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteChore(chore.id);
      onSave();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{chore ? 'Edit Chore' : 'New Chore'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title *
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Clean kitchen"
              required
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={2}
            />
          </label>

          <label>
            Assign to
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label>
            {startDate ? (isRecurring ? 'Start date *' : 'Date *') : 'Date *'}
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
            />
            Repeat daily
          </label>

          {isRecurring && (
            <label>
              End date (leave blank for no end)
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
              />
            </label>
          )}

          <div className="modal-actions">
            {chore && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
