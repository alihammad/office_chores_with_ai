import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const members = db.prepare('SELECT * FROM team_members ORDER BY id').all();
  res.json(members);
});

router.post('/', (req: Request, res: Response) => {
  const { name, color } = req.body as { name: string; color: string };
  if (!name?.trim() || !color?.trim()) {
    res.status(400).json({ error: 'name and color are required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO team_members (name, color) VALUES (?, ?)')
    .run(name.trim(), color.trim());
  res.status(201).json({ id: Number(result.lastInsertRowid), name: name.trim(), color: color.trim() });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
