import React, { useState } from 'react';
import type { Member } from '../types';
import { addMember, deleteMember } from '../api';
import './MembersPanel.css';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface Props {
  members: Member[];
  onMembersChange: () => void;
}

export default function MembersPanel({ members, onMembersChange }: Props) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await addMember(name.trim(), color);
      setName('');
      onMembersChange();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteMember(id);
    onMembersChange();
  }

  return (
    <aside className="members-panel">
      <button className="panel-toggle" onClick={() => setOpen(o => !o)}>
        <span>Team Members</span>
        <span className="toggle-icon">{open ? '◀' : '▶'}</span>
      </button>

      {open && (
        <div className="panel-body">
          <ul className="members-list">
            {members.map(m => (
              <li key={m.id} className="member-item">
                <span className="member-swatch" style={{ background: m.color }} />
                <span className="member-name">{m.name}</span>
                <button
                  className="member-delete"
                  onClick={() => handleDelete(m.id)}
                  title="Remove member"
                >
                  ×
                </button>
              </li>
            ))}
            {members.length === 0 && (
              <li className="no-members">No members yet</li>
            )}
          </ul>

          <form className="add-member-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="color-picker">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? 'Adding…' : '+ Add Member'}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
