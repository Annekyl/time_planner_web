export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string
  priority: 1 | 2 | 3 | 4
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  target_date: string | null
  progress: number
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
}

export interface TimeBlock {
  id: string
  user_id: string
  title: string
  date: string
  start_time: string
  end_time: string
  category_id: string | null
  task_id: string | null
  color: string
  created_at: string
  category?: Category
  task?: Task
}

export interface User {
  id: string
  email: string
}
