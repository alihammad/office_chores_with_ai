export interface Member {
  id: number;
  name: string;
  color: string;
}

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_color: string | null;
  is_recurring: number;
  start_date: string;
  end_date: string | null;
}

export interface Occurrence {
  id: number;
  chore_id: number;
  due_date: string;
  completed: number;
  completed_at: string | null;
  title: string;
  description: string | null;
  is_recurring: number;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_color: string | null;
}
