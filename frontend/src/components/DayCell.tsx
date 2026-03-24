import React from 'react';
import type { Occurrence, Chore, Member } from '../types';
import { toggleOccurrence } from '../api';
import './DayCell.css';

interface Props {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  occurrences: Occurrence[];
  onToggle: (occurrenceId: number, newCompleted: number) => void;
  onAddChore: (dateStr: string) => void;
  onEditChore: (chore: Chore) => void;
  allChores: Chore[];
  members: Member[];
  onCellMouseDown: (dateStr: string) => void;
  onCellMouseEnter: (dateStr: string) => void;
  onChipDragStart: (choreId: number, fromDate: string) => void;
  onCellDragOver: (dateStr: string) => void;
  onCellDragLeave: () => void;
  onCellDrop: (dateStr: string) => void;
}

export default function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  isDragOver,
  occurrences,
  onToggle,
  onAddChore,
  onEditChore,
  allChores,
  onCellMouseDown,
  onCellMouseEnter,
  onChipDragStart,
  onCellDragOver,
  onCellDragLeave,
  onCellDrop,
}: Props) {
  const dateStr = toISODate(date);
  const MAX_VISIBLE = 3;
  const visible = occurrences.slice(0, MAX_VISIBLE);
  const overflow = occurrences.length - MAX_VISIBLE;

  async function handleToggle(e: React.MouseEvent, occ: Occurrence) {
    e.stopPropagation();
    const result = await toggleOccurrence(occ.id);
    onToggle(occ.id, result.completed);
  }

  function handleChipClick(e: React.MouseEvent, occ: Occurrence) {
    e.stopPropagation();
    const chore = allChores.find(c => c.id === occ.chore_id);
    if (chore) onEditChore(chore);
  }

  function handleCellMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Only start drag-select on empty cell area, not on chips/buttons
    const target = e.target as HTMLElement;
    if (
      target.closest('.chore-chip') ||
      target.closest('.add-chore-btn') ||
      target.closest('.chip-check')
    ) return;
    e.preventDefault(); // prevent text selection highlight
    onCellMouseDown(dateStr);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // required to allow drop
    onCellDragOver(dateStr);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onCellDrop(dateStr);
  }

  let className = 'day-cell';
  if (!isCurrentMonth) className += ' other-month';
  if (isToday) className += ' today';
  if (isSelected) className += ' selected';
  if (isDragOver) className += ' drag-over';

  return (
    <div
      className={className}
      onMouseDown={handleCellMouseDown}
      onMouseEnter={() => onCellMouseEnter(dateStr)}
      onDragOver={handleDragOver}
      onDragLeave={onCellDragLeave}
      onDrop={handleDrop}
    >
      <div className="day-header">
        <span className="day-number">{date.getDate()}</span>
        {isCurrentMonth && (
          <button
            className="add-chore-btn"
            onMouseDown={e => e.stopPropagation()} // don't trigger drag-select
            onClick={() => onAddChore(dateStr)}
            title="Add chore"
          >
            +
          </button>
        )}
      </div>

      <div className="chore-chips">
        {visible.map(occ => (
          <div
            key={occ.id}
            className={`chore-chip${occ.completed ? ' done' : ''}`}
            style={{ '--chip-color': occ.assignee_color ?? '#6b7280' } as React.CSSProperties}
            draggable
            onDragStart={e => {
              e.stopPropagation();
              onChipDragStart(occ.chore_id, dateStr);
              // Set drag image to the chip itself
              e.dataTransfer.effectAllowed = 'move';
            }}
            onMouseDown={e => e.stopPropagation()} // don't trigger drag-select
            onClick={e => handleChipClick(e, occ)}
            title={`${occ.title}${occ.assignee_name ? ` — ${occ.assignee_name}` : ''}`}
          >
            <input
              type="checkbox"
              checked={occ.completed === 1}
              onChange={() => {}}
              onClick={e => handleToggle(e, occ)}
              className="chip-check"
            />
            <span className="chip-label">{occ.title}</span>
            {occ.assignee_name && (
              <span className="chip-assignee">{occ.assignee_name.charAt(0)}</span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className="overflow-badge">+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
