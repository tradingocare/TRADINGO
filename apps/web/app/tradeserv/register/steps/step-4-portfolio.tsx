'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RegistrationData, Project } from '../types';
import type { StepErrors } from '../validation';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Step4Portfolio({ data, errors, onChange }: Props) {
  const addProject = () => {
    onChange('projects', [...data.projects, { id: genId(), title: '', description: '', url: '' }]);
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    onChange('projects', data.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removeProject = (id: string) => {
    onChange('projects', data.projects.filter((p) => p.id !== id));
  };

  const errorFor = (key: string) => {
    const found = Object.keys(errors).find((k) => {
      if (k.startsWith(key) || k === key) return true;
      return false;
    });
    return found ? errors[found] : undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Projects / Case Studies</h3>
          <p className="mt-1 text-xs text-text-tertiary">Showcase your best work. Add at least one project to build trust with potential clients.</p>
        </div>
        <button onClick={addProject} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
          <Plus size={14} /> Add Project
        </button>
      </div>

      {data.projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-tertiary italic">No projects yet. Click "Add Project" to showcase your work.</p>
        </div>
      )}

      <div className="space-y-4">
        {data.projects.map((p, i) => (
          <div key={p.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Project {i + 1}</span>
              <button onClick={() => removeProject(p.id)} className="p-1 text-text-tertiary hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <input
                value={p.title}
                onChange={(e) => updateProject(p.id, 'title', e.target.value)}
                placeholder="Project Title"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none"
              />
              {errorFor(`projects.${i}.title`) && <p className="text-[10px] text-red-400">{errorFor(`projects.${i}.title`)}</p>}
              <textarea
                value={p.description}
                onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                placeholder="Describe the project, your role, and the outcome..."
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none resize-y"
              />
              {errorFor(`projects.${i}.description`) && <p className="text-[10px] text-red-400">{errorFor(`projects.${i}.description`)}</p>}
              <input
                value={p.url}
                onChange={(e) => updateProject(p.id, 'url', e.target.value)}
                placeholder="Project URL or link (optional)"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
