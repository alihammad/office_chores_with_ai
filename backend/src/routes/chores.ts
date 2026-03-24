import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const chores = db.prepare(`
    SELECT c.*, m.name AS assignee_name, m.color AS assignee_color
    FROM chores c
    LEFT JOIN team_members m ON c.assignee_id = m.id
    ORDER BY c.id
  `).all();
  res.json(chores);
});

router.post('/', (req: Request, res: Response) => {
  const { title, description, assignee_id, is_recurring, start_date, end_date } = req.body as {
    title: string;
    description?: string;
    assignee_id?: number | null;
    is_recurring: boolean;
    start_date: string;
    end_date?: string | null;
  };

  if (!title?.trim() || !start_date) {
    res.status(400).json({ error: 'title and start_date are required' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO chores (title, description, assignee_id, is_recurring, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      title.trim(),
      description?.trim() ?? null,
      assignee_id ?? null,
      is_recurring ? 1 : 0,
      start_date,
      end_date ?? null
    );

  const chore = db.prepare(`
    SELECT c.*, m.name AS assignee_name, m.color AS assignee_color
    FROM chores c
    LEFT JOIN team_members m ON c.assignee_id = m.id
    WHERE c.id = ?
  `).get(Number(result.lastInsertRowid));

  res.status(201).json(chore);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, assignee_id, is_recurring, start_date, end_date } = req.body as {
    title: string;
    description?: string;
    assignee_id?: number | null;
    is_recurring: boolean;
    start_date: string;
    end_date?: string | null;
  };

  if (!title?.trim() || !start_date) {
    res.status(400).json({ error: 'title and start_date are required' });
    return;
  }

  db.prepare(`
    UPDATE chores
    SET title = ?, description = ?, assignee_id = ?, is_recurring = ?, start_date = ?, end_date = ?
    WHERE id = ?
  `).run(
    title.trim(),
    description?.trim() ?? null,
    assignee_id ?? null,
    is_recurring ? 1 : 0,
    start_date,
    end_date ?? null,
    id
  );

  // Delete old occurrences so they regenerate with new schedule
  db.prepare('DELETE FROM chore_occurrences WHERE chore_id = ?').run(id);

  const chore = db.prepare(`
    SELECT c.*, m.name AS assignee_name, m.color AS assignee_color
    FROM chores c
    LEFT JOIN team_members m ON c.assignee_id = m.id
    WHERE c.id = ?
  `).get(id);

  res.json(chore);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM chores WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
