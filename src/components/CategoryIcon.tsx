import React from 'react';
import {
  Cross,
  Droplets,
  HeartPulse,
  Microscope,
  Pill,
  Sparkles,
  Syringe,
  Thermometer,
} from 'lucide-react';
import type { MedicineCategory } from '../types';

interface CategoryIconProps {
  category: MedicineCategory;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = '',
  size = 22,
}) => {
  switch (category) {
    case 'pain':
      return <Pill size={size} className={className} />;
    case 'cold':
      return <Thermometer size={size} className={className} />;
    case 'gastro':
      return <HeartPulse size={size} className={className} />;
    case 'skin':
      return <Droplets size={size} className={className} />;
    case 'firstaid':
      return <Cross size={size} className={className} />;
    case 'antibiotic':
      return <Microscope size={size} className={className} />;
    case 'vitamins':
      return <Sparkles size={size} className={className} />;
    case 'supplies':
      return <Syringe size={size} className={className} />;
    default:
      return <Pill size={size} className={className} />;
  }
};

export const CATEGORY_STYLE: Record<
  MedicineCategory,
  { bg: string; text: string; bar: string }
> = {
  pain: {
    bg: 'bg-primary-fixed/70 dark:bg-sky-950/70',
    text: 'text-primary dark:text-sky-300',
    bar: 'bg-primary',
  },
  cold: {
    bg: 'bg-tertiary-fixed/70 dark:bg-amber-950/60',
    text: 'text-tertiary dark:text-amber-300',
    bar: 'bg-tertiary',
  },
  gastro: {
    bg: 'bg-secondary-container/70 dark:bg-teal-950/70',
    text: 'text-secondary dark:text-teal-300',
    bar: 'bg-secondary',
  },
  skin: {
    bg: 'bg-cyan-100/80 dark:bg-cyan-950/60',
    text: 'text-cyan-800 dark:text-cyan-300',
    bar: 'bg-cyan-600',
  },
  firstaid: {
    bg: 'bg-rose-100/80 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-600',
  },
  antibiotic: {
    bg: 'bg-indigo-100/80 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    bar: 'bg-indigo-600',
  },
  vitamins: {
    bg: 'bg-amber-100/80 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  supplies: {
    bg: 'bg-slate-200/80 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    bar: 'bg-slate-500',
  },
};
