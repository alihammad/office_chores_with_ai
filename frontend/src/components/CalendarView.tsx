import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday,
  format,
} from 'date-fns';
import type { Chore, Member, Occurrence } from '../types';
import { getOccurrences, updateChore } from '../api';
import DayCell from './DayCell';
import './CalendarView.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  chores: Chore[];
  members: Member[];
  onAddChore: (startDate: string, endDate?: string) => void;
  onEditChore: (chore: Chore) => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function CalendarView({ chores, members, onAddChore, onEditChore, onRefresh, refreshKey }: Props) {
  const [current, setCurrent] = useState(() => new Date());
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Drag-select state ---
  // selectionRange drives the visual highlight (React state)
  const [selectionRange, setSelectionRange] = useState<{ start: string; end: string } | null>(null);
  // Refs let the global mouseup handler read fresh values without stale closures
  const isSelectingRef = useRef(false);
  const anchorRef = useRef<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const onAddChoreRef = useRef(onAddChore);
  useEffect(() => { onAddChoreRef.current = onAddChore; }, [onAddChore]);

  // --- Drag-drop state (chip → cell) ---
  const dragInfoRef = useRef<{ choreId: number; fromDate: string } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const loadOccurrences = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const data = await getOccurrences(date.getFullYear(), date.getMonth() + 1);
      setOccurrences(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOccurrences(current);
  }, [current, loadOccurrences, refreshKey]);

  // Global mouseup — finalize drag-select
  useEffect(() => {
    function handleMouseUp() {
      if (!isSelectingRef.current) return;
      const anchor = anchorRef.current;
      const hover = hoverRef.current;
      isSelectingRef.current = false;
      anchorRef.current = null;
      hoverRef.current = null;
      setSelectionRange(null);
      if (anchor && hover) {
        const start = anchor <= hover ? anchor : hover;
        const end = anchor <= hover ? hover : anchor;
        onAddChoreRef.current(start, start === end ? undefined : end);
      }
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  function handleToggle(occId: number, newCompleted: number) {
    setOccurrences(prev =>
      prev.map(o => o.id === occId ? { ...o, completed: newCompleted } : o)
    );
  }

  // Drag-select handlers passed to DayCell
  function handleCellMouseDown(dateStr: string) {
    isSelectingRef.current = true;
    anchorRef.current = dateStr;
    hoverRef.current = dateStr;
    setSelectionRange({ start: dateStr, end: dateStr });
  }

  function handleCellMouseEnter(dateStr: string) {
    if (!isSelectingRef.current) return;
    hoverRef.current = dateStr;
    const anchor = anchorRef.current!;
    const start = anchor <= dateStr ? anchor : dateStr;
    const end = anchor <= dateStr ? dateStr : anchor;
    setSelectionRange({ start, end });
  }

  // Chip drag-drop handlers
  function handleChipDragStart(choreId: number, fromDate: string) {
    dragInfoRef.current = { choreId, fromDate };
  }

  function handleCellDragOver(dateStr: string) {
    setDragOverDate(dateStr);
  }

  function handleCellDragLeave() {
    setDragOverDate(null);
  }

  async function handleCellDrop(toDate: string) {
    setDragOverDate(null);
    const info = dragInfoRef.current;
    dragInfoRef.current = null;
    if (!info || info.fromDate === toDate) return;

    const chore = chores.find(c => c.id === info.choreId);
    if (!chore) return;

    const deltaDays = diffDays(info.fromDate, toDate);
    const newStartDate = shiftDate(chore.start_date, deltaDays);
    const newEndDate = chore.end_date ? shiftDate(chore.end_date, deltaDays) : null;

    await updateChore(chore.id, {
      title: chore.title,
      description: chore.description ?? undefined,
      assignee_id: chore.assignee_id,
      is_recurring: chore.is_recurring === 1,
      start_date: newStartDate,
      end_date: newEndDate,
    });

    onRefresh();
  }

  // Build 6-row grid
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const cells: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    cells.push(d);
    d = addDays(d, 1);
  }
  while (cells.length < 42) cells.push(addDays(cells[cells.length - 1], 1));

  // Group occurrences by date
  const byDate: Record<string, Occurrence[]> = {};
  for (const occ of occurrences) {
    (byDate[occ.due_date] ??= []).push(occ);
  }

  return (
    <div className="calendar-view">
      <div className="calendar-nav">
        <button onClick={() => setCurrent(d => subMonths(d, 1))}>‹</button>
        <h1 className="calendar-title">{format(current, 'MMMM yyyy')}</h1>
        <button onClick={() => setCurrent(d => addMonths(d, 1))}>›</button>
        <button className="today-btn" onClick={() => setCurrent(new Date())}>Today</button>
        {loading && <span className="loading-indicator">Loading…</span>}
      </div>

      <div className={`calendar-grid${isSelectingRef.current ? ' selecting' : ''}`}>
        {DAYS.map(day => (
          <div key={day} className="day-name">{day}</div>
        ))}
        {cells.map(cell => {
          const iso = toISODate(cell);
          const isSelected = selectionRange !== null
            && iso >= selectionRange.start
            && iso <= selectionRange.end;
          return (
            <DayCell
              key={iso}
              date={cell}
              isCurrentMonth={isSameMonth(cell, current)}
              isToday={isToday(cell)}
              isSelected={isSelected}
              isDragOver={dragOverDate === iso}
              occurrences={byDate[iso] ?? []}
              onToggle={handleToggle}
              onAddChore={onAddChore}
              onEditChore={onEditChore}
              allChores={chores}
              members={members}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
              onChipDragStart={handleChipDragStart}
              onCellDragOver={handleCellDragOver}
              onCellDragLeave={handleCellDragLeave}
              onCellDrop={handleCellDrop}
            />
          );
        })}
      </div>
    </div>
  );
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diffDays(from: string, to: string): number {
  const fromMs = new Date(from + 'T00:00:00').getTime();
  const toMs = new Date(to + 'T00:00:00').getTime();
  return Math.round((toMs - fromMs) / 86400000);
}

function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
