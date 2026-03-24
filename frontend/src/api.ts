import type { Chore, Member, Occurrence } from './types';

const BASE = '/api';

// Members
export async function getMembers(): Promise<Member[]> {
  const res = await fetch(`${BASE}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function addMember(name: string, color: string): Promise<Member> {
  const res = await fetch(`${BASE}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error('Failed to add member');
  return res.json();
}

export async function deleteMember(id: number): Promise<void> {
  await fetch(`${BASE}/members/${id}`, { method: 'DELETE' });
}

// Chores
export async function getChores(): Promise<Chore[]> {
  const res = await fetch(`${BASE}/chores`);
  if (!res.ok) throw new Error('Failed to fetch chores');
  return res.json();
}

export interface ChorePayload {
  title: string;
  description?: string;
  assignee_id?: number | null;
  is_recurring: boolean;
  start_date: string;
  end_date?: string | null;
}

export async function createChore(payload: ChorePayload): Promise<Chore> {
  const res = await fetch(`${BASE}/chores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create chore');
  return res.json();
}

export async function updateChore(id: number, payload: ChorePayload): Promise<Chore> {
  const res = await fetch(`${BASE}/chores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update chore');
  return res.json();
}

export async function deleteChore(id: number): Promise<void> {
  await fetch(`${BASE}/chores/${id}`, { method: 'DELETE' });
}

// Occurrences
export async function getOccurrences(year: number, month: number): Promise<Occurrence[]> {
  const res = await fetch(`${BASE}/occurrences?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('Failed to fetch occurrences');
  return res.json();
}

export async function toggleOccurrence(
  id: number
): Promise<{ id: number; completed: number; completed_at: string | null }> {
  const res = await fetch(`${BASE}/occurrences/${id}/toggle`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle occurrence');
  return res.json();
}
