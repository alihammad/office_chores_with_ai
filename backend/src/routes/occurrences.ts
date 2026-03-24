import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// GET /api/occurrences?year=2024&month=3
router.get('/', (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10);
  const month = parseInt(req.query.month as string, 10); // 1-based

  if (!year || !month || month < 1 || month > 12) {
    res.status(400).json({ error: 'valid year and month (1-12) are required' });
    return;
  }

  const firstDay = isoDate(year, month, 1);
  const lastDay = isoDate(year, month, daysInMonth(year, month));

  // Fetch all chores relevant to this month
  const chores = db.prepare(`
    SELECT c.*, m.name AS assignee_name, m.color AS assignee_color
    FROM chores c
    LEFT JOIN team_members m ON c.assignee_id = m.id
    WHERE c.start_date <= ? AND (c.end_date IS NULL OR c.end_date >= ?)
  `).all(lastDay, firstDay) as Array<{
    id: number;
    title: string;
    description: string | null;
    assignee_id: number | null;
    assignee_name: string | null;
    assignee_color: string | null;
    is_recurring: number;
    start_date: string;
    end_date: string | null;
  }>;

  const totalDays = daysInMonth(year, month);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO chore_occurrences (chore_id, due_date) VALUES (?, ?)'
  );

  const toInsert: Array<[number, string]> = [];

  for (const chore of chores) {
    if (chore.is_recurring === 1) {
      // Daily: one occurrence per day in month (clamped to chore's date range)
      for (let d = 1; d <= totalDays; d++) {
        const date = isoDate(year, month, d);
        if (date >= chore.start_date && (chore.end_date === null || date <= chore.end_date)) {
          toInsert.push([chore.id, date]);
        }
      }
    } else {
      // One-off: only on start_date if it falls in this month
      if (chore.start_date >= firstDay && chore.start_date <= lastDay) {
        toInsert.push([chore.id, chore.start_date]);
      }
    }
  }

  db.exec('BEGIN');
  try {
    for (const [choreId, date] of toInsert) {
      insert.run(choreId, date);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  // Return all occurrences for the month joined with chore + member data
  const occurrences = db.prepare(`
    SELECT
      o.id, o.chore_id, o.due_date, o.completed, o.completed_at,
      c.title, c.description, c.is_recurring,
      c.assignee_id, m.name AS assignee_name, m.color AS assignee_color
    FROM chore_occurrences o
    JOIN chores c ON o.chore_id = c.id
    LEFT JOIN team_members m ON c.assignee_id = m.id
    WHERE o.due_date >= ? AND o.due_date <= ?
    ORDER BY o.due_date, o.id
  `).all(firstDay, lastDay);

  res.json(occurrences);
});

// PATCH /api/occurrences/:id/toggle
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;

  const occ = db.prepare('SELECT * FROM chore_occurrences WHERE id = ?').get(id) as
    | { id: number; completed: number }
    | undefined;

  if (!occ) {
    res.status(404).json({ error: 'occurrence not found' });
    return;
  }

  const newCompleted = occ.completed === 0 ? 1 : 0;
  const completedAt = newCompleted === 1 ? new Date().toISOString() : null;

  db.prepare(
    'UPDATE chore_occurrences SET completed = ?, completed_at = ? WHERE id = ?'
  ).run(newCompleted, completedAt, id);

  res.json({ id: occ.id, completed: newCompleted, completed_at: completedAt });
});

export default router;
