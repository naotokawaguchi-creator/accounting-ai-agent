import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const TASKS_FILE = path.resolve('data/tasks/tasks.json');

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  category: 'finance' | 'accounting' | 'cashflow' | 'plan' | 'general';
  source: 'ai_analysis' | 'chat' | 'manual';
  sourceId?: string;        // 分析IDやチャットメッセージID
  dueDate?: string;         // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
}

/**
 * タスク管理サービス
 *
 * AIが生成したタスクやユーザーが手動で追加したタスクを管理する。
 * 将来的に秘書AIや外部システムへの連携用APIを提供。
 */
class TaskService {
  private tasks: Task[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (fs.existsSync(TASKS_FILE)) {
      this.tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
    }
  }

  private save(): void {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(this.tasks, null, 2), 'utf-8');
  }

  /** タスク追加 */
  add(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(newTask);
    this.save();
    logger.info(`タスク追加: ${newTask.title}`);
    return newTask;
  }

  /** 複数タスクを一括追加 */
  addBatch(tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Task[] {
    return tasks.map(t => this.add(t));
  }

  /** 全タスク取得（新しい順） */
  list(filter?: { status?: string; category?: string }): Task[] {
    let result = [...this.tasks];
    if (filter?.status) result = result.filter(t => t.status === filter.status);
    if (filter?.category) result = result.filter(t => t.category === filter.category);
    return result.sort((a, b) => {
      // 期日順（期日なしは後ろ） → 優先度順
      const aDate = a.dueDate || '9999-12-31';
      const bDate = b.dueDate || '9999-12-31';
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }

  /** タスク取得 */
  get(id: string): Task | null {
    return this.tasks.find(t => t.id === id) || null;
  }

  /** タスク更新 */
  update(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'category' | 'dueDate'>>): Task | null {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    if (updates.status === 'done') task.completedAt = new Date().toISOString();
    this.save();
    return task;
  }

  /** タスク削除 */
  delete(id: string): boolean {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    this.save();
    return true;
  }

  /** サマリー */
  getSummary(): TaskSummary {
    return {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === 'todo').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      done: this.tasks.filter(t => t.status === 'done').length,
      highPriority: this.tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
    };
  }

  /**
   * 財務分析結果からタスクを自動生成
   */
  generateFromAnalysis(analysisId: string, actions: { priority: string; content: string; effect: string; timeframe: string }[]): Task[] {
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = { high: 'high', medium: 'medium', low: 'low' };
    const newTasks = actions.map(a => ({
      title: a.content,
      description: `効果: ${a.effect}\n期間: ${a.timeframe}`,
      priority: priorityMap[a.priority] || 'medium' as const,
      status: 'todo' as const,
      category: 'finance' as const,
      source: 'ai_analysis' as const,
      sourceId: analysisId,
    }));
    return this.addBatch(newTasks);
  }

  /**
   * チャットからタスクを追加
   */
  addFromChat(title: string, description: string = ''): Task {
    return this.add({
      title,
      description,
      priority: 'medium',
      status: 'todo',
      category: 'general',
      source: 'chat',
    });
  }

  /**
   * 秘書AI連携用：全タスクをエクスポート
   */
  exportForAssistant(): {
    summary: TaskSummary;
    activeTasks: Task[];
    completedTasks: Task[];
  } {
    return {
      summary: this.getSummary(),
      activeTasks: this.tasks.filter(t => t.status !== 'done'),
      completedTasks: this.tasks.filter(t => t.status === 'done'),
    };
  }
}

export const taskService = new TaskService();
