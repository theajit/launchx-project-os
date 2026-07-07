import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Circle, ClipboardList, Command, Download, FileText, FolderKanban, Moon, Plus, Search, Sparkles, Sun, Target, Trash2, Upload } from 'lucide-react';

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

type EditTarget =
  | { type: 'project'; id: string }
  | { type: 'note'; id: string }
  | { type: 'task'; id: string }
  | { type: 'decision'; id: string }
  | { type: 'weekly'; id: string };

const STORAGE_KEY = 'launchx-project-os:v1-stable';
const THEME_KEY = 'launchx-project-os:theme';
const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

const seedData: Workspace = {
  projects: [
    { id: 'p-launchx-os', name: 'LaunchX Project OS', description: 'Local-first command center for projects, notes, decisions, tasks, and weekly execution.', status: 'Active', priority: 'High', owner: 'Ajit', createdAt: today() },
    { id: 'p-kitchen-os', name: 'KitchenOS POS', description: 'Restaurant operating system with POS, kitchen workflows, and practical SaaS discipline.', status: 'Idea', priority: 'Medium', owner: 'LaunchX', createdAt: today() }
  ],
  notes: [{ id: 'n-1', projectId: 'p-launchx-os', title: 'Product thesis', content: '## Local-first by design\nOne cockpit for founder-led execution.\n\n- Projects\n- Notes\n- Tasks\n- Decisions\n- Weekly priorities', updatedAt: today() }],
  tasks: [
    { id: 't-1', projectId: 'p-launchx-os', title: 'Ship stable V1', description: 'Dashboard, CRUD, Markdown notes, task board, ADRs, priorities, backup, shortcuts.', status: 'In Progress', priority: 'High', dueDate: today() },
    { id: 't-2', projectId: 'p-launchx-os', title: 'Add GitHub sync later', description: 'Keep V1 stable. Add sync only after local workflow is useful daily.', status: 'Todo', priority: 'Medium', dueDate: '' }
  ],
  decisions: [{ id: 'd-1', projectId: 'p-launchx-os', title: 'ADR-001: Start local-first', context: 'The product needs rapid iteration without auth, backend, or infra friction.', decision: 'Use browser storage for V1 and add export/import backup.', consequences: 'Faster launch, lower cost, simpler UX. Sync can be added after usage patterns are clear.', date: today() }],
  weekly: [
    { id: 'w-1', title: 'Stabilize Project OS MVP', projectId: 'p-launchx-os', done: false },
    { id: 'w-2', title: 'Use it daily for LaunchX decisions', projectId: 'p-launchx-os', done: false }
  ]
};

function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Workspace : seedData;
  } catch {
    return seedData;
  }
}

function projectName(projects: Project[], id: string) {
  return projects.find((p) => p.id === id)?.name ?? 'Unassigned';
}

function badgeClass(value: string) {
  return `badge ${value.toLowerCase().replaceAll(' ', '-')}`;
}

function markdown(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [view, setView] = useState<View>('Dashboard');
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [selectedProjectId, setSelectedProjectId] = useState(workspace.projects[0]?.id ?? '');
  const [commandOpen, setCommandOpen] = useState(false);
  const [edit, setEdit] = useState<EditTarget | null>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)), [workspace]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const update = (next: Partial<Workspace>) => setWorkspace((current) => ({ ...current, ...next }));
  const mutate = <T extends { id: string }>(key: keyof Workspace, id: string, patch: Partial<T>) => update({ [key]: (workspace[key] as T[]).map((item) => item.id === id ? { ...item, ...patch } : item) } as Partial<Workspace>);
  const remove = (key: keyof Workspace, id: string) => update({ [key]: (workspace[key] as { id: string }[]).filter((item) => item.id !== id) } as Partial<Workspace>);

  const addProject = () => { const item: Project = { id: uid(), name: 'New LaunchX Initiative', description: 'Describe the outcome, owner, and execution thesis.', status: 'Idea', priority: 'Medium', owner: 'Ajit', createdAt: today() }; update({ projects: [item, ...workspace.projects] }); setSelectedProjectId(item.id); setView('Projects'); setEdit({ type: 'project', id: item.id }); };
  const addNote = () => { const item: Note = { id: uid(), projectId: selectedProjectId, title: 'New note', content: '## New note\nWrite in Markdown.', updatedAt: today() }; update({ notes: [item, ...workspace.notes] }); setView('Notes'); setEdit({ type: 'note', id: item.id }); };
  const addTask = (status: TaskStatus = 'Todo') => { const item: Task = { id: uid(), projectId: selectedProjectId, title: 'New task', description: 'Define next action.', status, priority: 'Medium', dueDate: '' }; update({ tasks: [item, ...workspace.tasks] }); setView('Tasks'); setEdit({ type: 'task', id: item.id }); };
  const addDecision = () => { const item: Decision = { id: uid(), projectId: selectedProjectId, title: 'ADR: New decision', context: 'Context', decision: 'Decision', consequences: 'Consequences', date: today() }; update({ decisions: [item, ...workspace.decisions] }); setView('Decisions'); setEdit({ type: 'decision', id: item.id }); };
  const addWeekly = () => { const item: WeeklyPriority = { id: uid(), title: 'New weekly priority', projectId: selectedProjectId, done: false }; update({ weekly: [item, ...workspace.weekly] }); setView('Weekly'); setEdit({ type: 'weekly', id: item.id }); };

  const actions = [
    ['New project', addProject], ['New note', addNote], ['New task', () => addTask('Todo')], ['New ADR', addDecision], ['New weekly priority', addWeekly], ['Export JSON', exportJson]
  ] as const;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); return; }
      if (event.key === 'Escape') { setCommandOpen(false); setEdit(null); return; }
      if (isTyping) return;
      if (event.key.toLowerCase() === 'p') addProject();
      if (event.key.toLowerCase() === 'n') addNote();
      if (event.key.toLowerCase() === 't') addTask('Todo');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const stats = useMemo(() => [
    { label: 'Projects', value: workspace.projects.length, icon: FolderKanban },
    { label: 'Open tasks', value: workspace.tasks.filter((t) => t.status !== 'Done').length, icon: ClipboardList },
    { label: 'ADRs', value: workspace.decisions.length, icon: Archive },
    { label: 'Weekly done', value: `${workspace.weekly.filter((w) => w.done).length}/${workspace.weekly.length}`, icon: Target }
  ], [workspace]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `launchx-project-os-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setWorkspace(JSON.parse(String(reader.result)) as Workspace); }
      catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
  }

  return <div className="app-shell">
    <aside className="sidebar"><Brand /><Nav view={view} setView={setView} /><button className="command-hint" onClick={() => setCommandOpen(true)}><Command size={15}/> Ctrl K</button></aside>
    <main>
      <header className="topbar"><div><p className="eyebrow"><Sparkles size={14}/>Founder execution cockpit</p><h1>{view}</h1><p className="subhead">{projectName(workspace.projects, selectedProjectId)}</p></div><div className="top-actions"><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="ghost" onClick={() => setCommandOpen(true)}><Search size={16}/> Command</button><button className="icon-button" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="primary" onClick={() => view === 'Notes' ? addNote() : view === 'Tasks' ? addTask('Todo') : view === 'Decisions' ? addDecision() : view === 'Weekly' ? addWeekly() : addProject()}><Plus size={16}/>Add</button></div></header>
      {view === 'Dashboard' && <section className="grid"><div className="hero card"><span className="pill"><Sparkles size={14}/> Premium local-first OS</span><h2>Run LaunchX like a product, not a WhatsApp group.</h2><p>Projects, notes, tasks, ADRs, and weekly execution stay local-first in your browser with JSON backup.</p></div>{stats.map((s) => <div className="stat card" key={s.label}><s.icon size={22}/><span>{s.label}</span><strong>{s.value}</strong></div>)}<Panel title="Weekly priorities" action="Add" onAction={addWeekly}>{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onToggle={() => mutate<WeeklyPriority>('weekly', w.id, { done: !w.done })} onOpen={() => setEdit({ type: 'weekly', id: w.id })} />)}</Panel><Panel title="Recent decisions">{workspace.decisions.slice(0, 4).map((d) => <button className="list-card" key={d.id} onClick={() => setEdit({ type: 'decision', id: d.id })}><strong>{d.title}</strong><span>{d.decision}</span></button>)}</Panel></section>}
      {view === 'Projects' && <section className="cards">{workspace.projects.map((p) => <article className="entity-card" key={p.id} onClick={() => setEdit({ type: 'project', id: p.id })}><h3>{p.name}</h3><p>{p.description}</p><div className="meta-row"><span className={badgeClass(p.status)}>{p.status}</span><span className={badgeClass(p.priority)}>{p.priority}</span><small>{p.owner}</small></div></article>)}</section>}
      {view === 'Notes' && <section><div className="searchbar"><label><Search size={16}/><input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)}/></label><button className="primary" onClick={addNote}><Plus size={16}/>Note</button></div><div className="cards">{workspace.notes.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase())).map((n) => <article className="entity-card note-card" key={n.id} onClick={() => setEdit({ type: 'note', id: n.id })}><h3>{n.title}</h3><div className="markdown compact" dangerouslySetInnerHTML={{ __html: markdown(n.content) }} /><div className="meta-row"><small>{projectName(workspace.projects, n.projectId)}</small></div></article>)}</div></section>}
      {view === 'Tasks' && <section className="board">{(['Todo','In Progress','Done'] as TaskStatus[]).map((status) => <div className="column" key={status}><div className="column-head"><h3>{status}</h3><button onClick={() => addTask(status)}><Plus size={15}/></button></div>{workspace.tasks.filter((t) => t.status === status).map((t) => <article className="task-card" key={t.id} onClick={() => setEdit({ type: 'task', id: t.id })}><strong>{t.title}</strong><p>{t.description}</p><div className="meta-row"><span className={badgeClass(t.priority)}>{t.priority}</span>{t.dueDate && <small>{t.dueDate}</small>}</div></article>)}</div>)}</section>}
      {view === 'Decisions' && <section className="timeline">{workspace.decisions.map((d) => <article className="decision-card" key={d.id} onClick={() => setEdit({ type: 'decision', id: d.id })}><h3>{d.title}</h3><p><strong>Context:</strong> {d.context}</p><p><strong>Decision:</strong> {d.decision}</p><p><strong>Impact:</strong> {d.consequences}</p></article>)}</section>}
      {view === 'Weekly' && <section className="weekly">{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onToggle={() => mutate<WeeklyPriority>('weekly', w.id, { done: !w.done })} onOpen={() => setEdit({ type: 'weekly', id: w.id })} />)}</section>}
      {view === 'Settings' && <section className="settings"><h2>Local-first storage</h2><p>Your data is stored in this browser. Export JSON before changing device or clearing browser data.</p><div className="settings-grid"><button onClick={exportJson}><Download size={16}/>Export JSON</button><label className="button-like"><Upload size={16}/>Import JSON<input type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])}/></label><button onClick={() => setWorkspace(seedData)}>Reset sample data</button></div><div className="shortcut-card"><strong>Shortcuts</strong><span>Ctrl/Cmd K · P project · N note · T task · Esc close</span></div></section>}
    </main>
    <nav className="bottom-nav"><Nav view={view} setView={setView} compact /><button onClick={() => setCommandOpen(true)}>•••<span>More</span></button></nav>
    {edit && <Editor edit={edit} workspace={workspace} mutate={mutate} remove={remove} close={() => setEdit(null)} />}
    {commandOpen && <div className="overlay" onClick={() => setCommandOpen(false)}><div className="palette" onClick={(e) => e.stopPropagation()}><div className="palette-head"><Command size={18}/><input autoFocus placeholder="Type a command" /></div>{actions.map(([label, run]) => <button key={label} onClick={() => { run(); setCommandOpen(false); }}>{label}</button>)}</div></div>}
  </div>;
}

function Brand() { return <div className="brand"><div className="brand-mark">LX</div><div><strong>LaunchX</strong><span>Project OS</span></div></div>; }
function Nav({ view, setView, compact }: { view: View; setView: (view: View) => void; compact?: boolean }) { const items: [View, ReactNode][] = [['Dashboard', <Sparkles/>], ['Projects', <FolderKanban/>], ['Notes', <FileText/>], ['Tasks', <ClipboardList/>], ['Decisions', <Archive/>], ['Weekly', <Target/>], ['Settings', <Command/>]]; return <>{items.slice(0, compact ? 5 : 7).map(([item, icon]) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{icon}<span>{item}</span></button>)}</>; }
function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) { return <section className="card panel"><div className="panel-head"><h3>{title}</h3>{action && <button onClick={onAction}><Plus size={15}/>{action}</button>}</div>{children}</section>; }
function Row({ title, meta, done, onToggle, onOpen }: { title: string; meta: string; done: boolean; onToggle: () => void; onOpen: () => void }) { return <div className="row"><button className="check" onClick={onToggle}>{done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}</button><button className="row-main" onClick={onOpen}><strong>{title}</strong><span>{meta}</span></button></div>; }

function Editor({ edit, workspace, mutate, remove, close }: { edit: EditTarget; workspace: Workspace; mutate: <T extends { id: string }>(key: keyof Workspace, id: string, patch: Partial<T>) => void; remove: (key: keyof Workspace, id: string) => void; close: () => void }) {
  return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><h2>Edit {edit.type}</h2><button onClick={close}>Close</button></div>
    {edit.type === 'project' && workspace.projects.filter((x) => x.id === edit.id).map((x) => <div className="editor-card" key={x.id}><input value={x.name} onChange={(e) => mutate<Project>('projects', x.id, { name: e.target.value })}/><textarea value={x.description} onChange={(e) => mutate<Project>('projects', x.id, { description: e.target.value })}/><div className="form-grid"><select value={x.status} onChange={(e) => mutate<Project>('projects', x.id, { status: e.target.value as ProjectStatus })}><option>Idea</option><option>Active</option><option>Paused</option><option>Completed</option></select><select value={x.priority} onChange={(e) => mutate<Project>('projects', x.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select><input value={x.owner} onChange={(e) => mutate<Project>('projects', x.id, { owner: e.target.value })}/></div><button className="danger" onClick={() => { remove('projects', x.id); close(); }}><Trash2 size={16}/>Delete</button></div>)}
    {edit.type === 'note' && workspace.notes.filter((x) => x.id === edit.id).map((x) => <div className="editor-card" key={x.id}><input value={x.title} onChange={(e) => mutate<Note>('notes', x.id, { title: e.target.value, updatedAt: today() })}/><select value={x.projectId} onChange={(e) => mutate<Note>('notes', x.id, { projectId: e.target.value })}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea className="xl" value={x.content} onChange={(e) => mutate<Note>('notes', x.id, { content: e.target.value, updatedAt: today() })}/><div className="markdown preview" dangerouslySetInnerHTML={{ __html: markdown(x.content) }}/><button className="danger" onClick={() => { remove('notes', x.id); close(); }}><Trash2 size={16}/>Delete</button></div>)}
    {edit.type === 'task' && workspace.tasks.filter((x) => x.id === edit.id).map((x) => <div className="editor-card" key={x.id}><input value={x.title} onChange={(e) => mutate<Task>('tasks', x.id, { title: e.target.value })}/><select value={x.projectId} onChange={(e) => mutate<Task>('tasks', x.id, { projectId: e.target.value })}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea value={x.description} onChange={(e) => mutate<Task>('tasks', x.id, { description: e.target.value })}/><div className="form-grid"><select value={x.status} onChange={(e) => mutate<Task>('tasks', x.id, { status: e.target.value as TaskStatus })}><option>Todo</option><option>In Progress</option><option>Done</option></select><select value={x.priority} onChange={(e) => mutate<Task>('tasks', x.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select><input type="date" value={x.dueDate} onChange={(e) => mutate<Task>('tasks', x.id, { dueDate: e.target.value })}/></div><button className="danger" onClick={() => { remove('tasks', x.id); close(); }}><Trash2 size={16}/>Delete</button></div>)}
    {edit.type === 'decision' && workspace.decisions.filter((x) => x.id === edit.id).map((x) => <div className="editor-card" key={x.id}><input value={x.title} onChange={(e) => mutate<Decision>('decisions', x.id, { title: e.target.value })}/><select value={x.projectId} onChange={(e) => mutate<Decision>('decisions', x.id, { projectId: e.target.value })}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea value={x.context} onChange={(e) => mutate<Decision>('decisions', x.id, { context: e.target.value })}/><textarea value={x.decision} onChange={(e) => mutate<Decision>('decisions', x.id, { decision: e.target.value })}/><textarea value={x.consequences} onChange={(e) => mutate<Decision>('decisions', x.id, { consequences: e.target.value })}/><button className="danger" onClick={() => { remove('decisions', x.id); close(); }}><Trash2 size={16}/>Delete</button></div>)}
    {edit.type === 'weekly' && workspace.weekly.filter((x) => x.id === edit.id).map((x) => <div className="editor-card" key={x.id}><input value={x.title} onChange={(e) => mutate<WeeklyPriority>('weekly', x.id, { title: e.target.value })}/><select value={x.projectId} onChange={(e) => mutate<WeeklyPriority>('weekly', x.id, { projectId: e.target.value })}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><label className="toggle"><input type="checkbox" checked={x.done} onChange={(e) => mutate<WeeklyPriority>('weekly', x.id, { done: e.target.checked })}/>Done</label><button className="danger" onClick={() => { remove('weekly', x.id); close(); }}><Trash2 size={16}/>Delete</button></div>)}
  </aside></div>;
}
