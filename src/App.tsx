import { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Circle, ClipboardList, Download, FolderKanban, Moon, Plus, Search, Sparkles, Sun, Target, Trash2, Upload } from 'lucide-react';

type ProjectStatus = 'Idea' | 'Active' | 'Paused' | 'Completed';
type Priority = 'Low' | 'Medium' | 'High';
type TaskStatus = 'Todo' | 'In Progress' | 'Done';
type View = 'Dashboard' | 'Projects' | 'Notes' | 'Tasks' | 'Decisions' | 'Weekly' | 'Settings';
type Project = { id: string; name: string; description: string; status: ProjectStatus; priority: Priority; owner: string; createdAt: string };
type Note = { id: string; projectId: string; title: string; content: string; updatedAt: string };
type Task = { id: string; projectId: string; title: string; description: string; status: TaskStatus; priority: Priority; dueDate: string };
type Decision = { id: string; projectId: string; title: string; context: string; decision: string; consequences: string; date: string };
type WeeklyPriority = { id: string; title: string; projectId: string; done: boolean };
type Workspace = { projects: Project[]; notes: Note[]; tasks: Task[]; decisions: Decision[]; weekly: WeeklyPriority[] };

const STORAGE_KEY = 'launchx-project-os:v1';
const THEME_KEY = 'launchx-project-os:theme';
const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

const seedData: Workspace = {
  projects: [
    { id: 'p-launchx-os', name: 'LaunchX Project OS', description: 'Local-first command center for projects, notes, decisions, tasks, and weekly execution.', status: 'Active', priority: 'High', owner: 'Ajit', createdAt: today() },
    { id: 'p-kitchen-os', name: 'KitchenOS POS', description: 'Restaurant operating system with POS, kitchen workflows, and practical SaaS discipline.', status: 'Idea', priority: 'Medium', owner: 'LaunchX', createdAt: today() }
  ],
  notes: [{ id: 'n-1', projectId: 'p-launchx-os', title: 'Product thesis', content: 'One cockpit for founder-led execution. No backend until the workflow proves itself.', updatedAt: today() }],
  tasks: [
    { id: 't-1', projectId: 'p-launchx-os', title: 'Ship local-first MVP', description: 'Dashboard, projects, notes, tasks, ADRs, weekly priorities, import/export.', status: 'In Progress', priority: 'High', dueDate: today() },
    { id: 't-2', projectId: 'p-launchx-os', title: 'Add GitHub sync later', description: 'Keep v1 simple. Add sync only after the cockpit is useful daily.', status: 'Todo', priority: 'Medium', dueDate: '' }
  ],
  decisions: [{ id: 'd-1', projectId: 'p-launchx-os', title: 'ADR-001: Start local-first', context: 'The product needs rapid iteration without auth, backend, or infra friction.', decision: 'Use browser storage for v1 and add export/import backup.', consequences: 'Faster launch, lower cost, simpler UX. Sync can be added after usage patterns are clear.', date: today() }],
  weekly: [
    { id: 'w-1', title: 'Stabilize Project OS MVP', projectId: 'p-launchx-os', done: false },
    { id: 'w-2', title: 'Use it daily for LaunchX decisions', projectId: 'p-launchx-os', done: false }
  ]
};

function loadWorkspace(): Workspace { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : seedData; } catch { return seedData; } }
function projectName(projects: Project[], id: string) { return projects.find((p) => p.id === id)?.name ?? 'Unassigned'; }
function badgeClass(value: string) { return `badge ${value.toLowerCase().replaceAll(' ', '-')}`; }

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [view, setView] = useState<View>('Dashboard');
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [selectedProjectId, setSelectedProjectId] = useState('p-launchx-os');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)), [workspace]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); }, [dark]);

  const stats = useMemo(() => [
    { label: 'Projects', value: workspace.projects.length, icon: FolderKanban },
    { label: 'Open tasks', value: workspace.tasks.filter((t) => t.status !== 'Done').length, icon: ClipboardList },
    { label: 'ADRs', value: workspace.decisions.length, icon: Archive },
    { label: 'Weekly done', value: `${workspace.weekly.filter((w) => w.done).length}/${workspace.weekly.length}`, icon: Target }
  ], [workspace]);

  const update = (next: Partial<Workspace>) => setWorkspace((current) => ({ ...current, ...next }));
  const updateProject = (id: string, patch: Partial<Project>) => update({ projects: workspace.projects.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateNote = (id: string, patch: Partial<Note>) => update({ notes: workspace.notes.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateTask = (id: string, patch: Partial<Task>) => update({ tasks: workspace.tasks.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateDecision = (id: string, patch: Partial<Decision>) => update({ decisions: workspace.decisions.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateWeekly = (id: string, patch: Partial<WeeklyPriority>) => update({ weekly: workspace.weekly.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const removeProject = (id: string) => update({ projects: workspace.projects.filter((item) => item.id !== id) });
  const removeNote = (id: string) => update({ notes: workspace.notes.filter((item) => item.id !== id) });
  const removeTask = (id: string) => update({ tasks: workspace.tasks.filter((item) => item.id !== id) });
  const removeDecision = (id: string) => update({ decisions: workspace.decisions.filter((item) => item.id !== id) });
  const removeWeekly = (id: string) => update({ weekly: workspace.weekly.filter((item) => item.id !== id) });

  const addProject = () => { const project: Project = { id: uid(), name: 'New LaunchX Initiative', description: 'Describe the outcome, owner, and execution thesis.', status: 'Idea', priority: 'Medium', owner: 'Ajit', createdAt: today() }; update({ projects: [project, ...workspace.projects] }); setSelectedProjectId(project.id); setView('Projects'); };
  const addTask = () => update({ tasks: [{ id: uid(), projectId: selectedProjectId, title: 'New task', description: 'Define next action.', status: 'Todo', priority: 'Medium', dueDate: '' }, ...workspace.tasks] });
  const addNote = () => update({ notes: [{ id: uid(), projectId: selectedProjectId, title: 'New note', content: 'Write the raw thought here.', updatedAt: today() }, ...workspace.notes] });
  const addDecision = () => update({ decisions: [{ id: uid(), projectId: selectedProjectId, title: 'ADR: New decision', context: 'Context', decision: 'Decision', consequences: 'Consequences', date: today() }, ...workspace.decisions] });
  const addWeekly = () => update({ weekly: [{ id: uid(), title: 'New weekly priority', projectId: selectedProjectId, done: false }, ...workspace.weekly] });

  const exportJson = () => { const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `launchx-project-os-${today()}.json`; link.click(); URL.revokeObjectURL(url); };
  const importJson = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setWorkspace(JSON.parse(String(reader.result))); } catch { alert('Invalid backup file.'); } }; reader.readAsText(file); };

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">LX</div><div><strong>LaunchX</strong><span>Project OS</span></div></div><nav>{(['Dashboard','Projects','Notes','Tasks','Decisions','Weekly','Settings'] as View[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item}</button>)}</nav></aside>
    <main><header className="topbar"><div><p className="eyebrow"><Sparkles size={14}/>Founder execution cockpit</p><h1>{view}</h1></div><div className="top-actions"><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="icon-button" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="primary" onClick={addProject}><Plus size={16}/>Project</button></div></header>
      {view === 'Dashboard' && <section className="grid"><div className="hero card"><p className="eyebrow">Premium dashboard</p><h2>Run LaunchX like a product, not a WhatsApp group.</h2><p>Projects, notes, tasks, ADRs, and weekly execution stay local-first in your browser with JSON backup.</p></div>{stats.map((s) => <div className="stat card" key={s.label}><s.icon size={22}/><span>{s.label}</span><strong>{s.value}</strong></div>)}<Panel title="Weekly priorities" action="Add" onAction={addWeekly}>{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onToggle={() => updateWeekly(w.id, { done: !w.done })} onDelete={() => removeWeekly(w.id)} />)}</Panel><Panel title="Recent decisions">{workspace.decisions.slice(0,3).map((d) => <article className="mini-card" key={d.id}><strong>{d.title}</strong><p>{d.decision}</p></article>)}</Panel></section>}
      {view === 'Projects' && <section className="cards">{workspace.projects.map((p) => <article className="card project-card" key={p.id}><input value={p.name} onChange={(e) => updateProject(p.id, { name: e.target.value })}/><textarea value={p.description} onChange={(e) => updateProject(p.id, { description: e.target.value })}/><div className="inline"><select value={p.status} onChange={(e) => updateProject(p.id, { status: e.target.value as ProjectStatus })}><option>Idea</option><option>Active</option><option>Paused</option><option>Completed</option></select><select value={p.priority} onChange={(e) => updateProject(p.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></div><div className="card-footer"><span className={badgeClass(p.status)}>{p.status}</span><span className={badgeClass(p.priority)}>{p.priority}</span><button onClick={() => removeProject(p.id)}><Trash2 size={15}/></button></div></article>)}</section>}
      {view === 'Notes' && <section><div className="toolbar"><label><Search size={16}/><input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)}/></label><button className="primary" onClick={addNote}><Plus size={16}/>Note</button></div><div className="cards">{workspace.notes.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase())).map((n) => <article className="card" key={n.id}><input value={n.title} onChange={(e) => updateNote(n.id, { title: e.target.value, updatedAt: today() })}/><textarea className="tall" value={n.content} onChange={(e) => updateNote(n.id, { content: e.target.value, updatedAt: today() })}/><div className="card-footer"><span>{projectName(workspace.projects, n.projectId)}</span><button onClick={() => removeNote(n.id)}><Trash2 size={15}/></button></div></article>)}</div></section>}
      {view === 'Tasks' && <CrudList addLabel="Task" onAdd={addTask}>{workspace.tasks.map((t) => <article className="card" key={t.id}><input value={t.title} onChange={(e) => updateTask(t.id, { title: e.target.value })}/><textarea value={t.description} onChange={(e) => updateTask(t.id, { description: e.target.value })}/><div className="inline"><select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}><option>Todo</option><option>In Progress</option><option>Done</option></select><select value={t.priority} onChange={(e) => updateTask(t.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select><input type="date" value={t.dueDate} onChange={(e) => updateTask(t.id, { dueDate: e.target.value })}/></div><div className="card-footer"><span>{projectName(workspace.projects, t.projectId)}</span><button onClick={() => updateTask(t.id, { status: t.status === 'Done' ? 'Todo' : 'Done' })}>{t.status === 'Done' ? 'Reopen' : 'Done'}</button><button onClick={() => removeTask(t.id)}><Trash2 size={15}/></button></div></article>)}</CrudList>}
      {view === 'Decisions' && <CrudList addLabel="ADR" onAdd={addDecision}>{workspace.decisions.map((d) => <article className="card adr" key={d.id}><input value={d.title} onChange={(e) => updateDecision(d.id, { title: e.target.value })}/><textarea value={d.context} onChange={(e) => updateDecision(d.id, { context: e.target.value })}/><textarea value={d.decision} onChange={(e) => updateDecision(d.id, { decision: e.target.value })}/><textarea value={d.consequences} onChange={(e) => updateDecision(d.id, { consequences: e.target.value })}/><div className="card-footer"><span>{d.date}</span><button onClick={() => removeDecision(d.id)}><Trash2 size={15}/></button></div></article>)}</CrudList>}
      {view === 'Weekly' && <CrudList addLabel="Priority" onAdd={addWeekly}>{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onTitle={(title) => updateWeekly(w.id, { title })} onToggle={() => updateWeekly(w.id, { done: !w.done })} onDelete={() => removeWeekly(w.id)} />)}</CrudList>}
      {view === 'Settings' && <section className="settings card"><h2>Local-first storage</h2><p>Your data is stored in this browser. Export JSON before changing device or clearing browser data.</p><div className="inline"><button onClick={exportJson}><Download size={16}/>Export backup</button><label className="button-like"><Upload size={16}/>Import backup<input type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])}/></label><button onClick={() => setWorkspace(seedData)}>Reset sample data</button></div></section>}
    </main>
  </div>;
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="card panel"><div className="panel-head"><h3>{title}</h3>{action && <button onClick={onAction}><Plus size={15}/>{action}</button>}</div>{children}</section>; }
function CrudList({ addLabel, onAdd, children }: { addLabel: string; onAdd: () => void; children: React.ReactNode }) { return <section><div className="toolbar"><button className="primary" onClick={onAdd}><Plus size={16}/>{addLabel}</button></div><div className="cards">{children}</div></section>; }
function Row({ title, meta, done, onToggle, onDelete, onTitle }: { title: string; meta: string; done: boolean; onToggle: () => void; onDelete: () => void; onTitle?: (value: string) => void }) { return <div className="row"><button onClick={onToggle}>{done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}</button>{onTitle ? <input value={title} onChange={(e) => onTitle(e.target.value)}/> : <strong>{title}</strong>}<span>{meta}</span><button onClick={onDelete}><Trash2 size={15}/></button></div>; }
