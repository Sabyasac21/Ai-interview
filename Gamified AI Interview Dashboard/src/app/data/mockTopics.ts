
import { Code, Layout, Server, Database, Cpu, MessageSquare, LucideIcon } from 'lucide-react';

export interface MockTopic {
  id: string;
  title: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  totalQuestions: number;
  completedQuestions: number;
  strength: number;
  status: 'locked' | 'unlocked';
}

export const mockTopics: MockTopic[] = [
  {
    id: 'react',
    title: 'React.js',
    slug: 'reactjs',
    icon: Code,
    color: 'text-sky-400',
    totalQuestions: 5,
    completedQuestions: 1,
    strength: 20,
    status: 'unlocked',
  },
  {
    id: 'js',
    title: 'JavaScript',
    slug: 'javascript',
    icon: Layout,
    color: 'text-yellow-400',
    totalQuestions: 3,
    completedQuestions: 0,
    strength: 0,
    status: 'unlocked',
  },
  {
    id: 'dsa',
    title: 'Data Structures',
    slug: 'data-structures',
    icon: Database,
    color: 'text-emerald-400',
    totalQuestions: 2,
    completedQuestions: 0,
    strength: 0,
    status: 'unlocked',
  },
  {
    id: 'algo',
    title: 'Algorithms',
    slug: 'algorithms',
    icon: Cpu,
    color: 'text-red-400',
    totalQuestions: 2,
    completedQuestions: 0,
    strength: 0,
    status: 'unlocked',
  },
  {
    id: 'system-design',
    title: 'System Design',
    slug: 'system-design',
    icon: Server,
    color: 'text-purple-400',
    totalQuestions: 2,
    completedQuestions: 0,
    strength: 0,
    status: 'unlocked',
  },
  {
    id: 'behavioral',
    title: 'Behavioral',
    slug: 'behavioral',
    icon: MessageSquare,
    color: 'text-pink-400',
    totalQuestions: 1,
    completedQuestions: 0,
    strength: 0,
    status: 'unlocked',
  },
];
