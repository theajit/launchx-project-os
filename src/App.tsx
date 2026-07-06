import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Archive, Check, Circle, ClipboardList, Command, Download, FileText, FolderKanban, Moon, MoreHorizontal, Plus, Search, Settings, Sparkles, Sun, Target, Trash2, Upload } from 'lucide-react';

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

type Editor =
  | { type: 'project'; id: string }
  | { type: 'note'; id: string }
  | { type: 'task'; id: string }
  | { type: 'decision'; id: string }
  | { type: 'weekly'; id: string }
  | null;

const STORAGE_KEY = 'launchx-project-os:v2';
const OLD_STORAGE_KEY = 'launchx-project-os:v1';
const THEME_KEY = 'launchx-project-os:theme';
const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

const seedData: Workspace = {
  projects: [
    { id: 'p-launchx-os', name: 'LaunchX Project OS', description: 'Premium local-first cockpit for projects, notes, decisions, tasks, and weekly execution.', status: 'Active', priority: 'High', owner: 'Ajit', createdAt: today() },
    { id: 'p-kitchen-os', name: 'KitchenOS POS', description: 'Restaurant operating system with POS, kitchen workflows, and practical SaaS discipline.', status: 'Idea', priority: 'Medium', owner: 'LaunchX', createdAt: today() }
  ],
  notes: [{ id: 'n-1', projectId: 'p-launchx-os', title: 'Product thesis', content: '## Local-first by design\nOne cockpit for founder-led execution. No backend until the workflow proves itself.\n\n- Ship fast\n- Keep data portable\n- Add sync later', updatedAt: today() }],
  tasks: [
    { id: 't-1', projectId: 'p-launchx-os', title: 'Ship premium UI v2', description: 'Mobile-first shell, task board, markdown notes, command palette, and JSON backup.', status: 'In Progress', priority: 'High', dueDate: today() },
    { id: 't-2', projectId: 'p-launchx-os', title: 'Evaluate GitHub sync', description: 'ADR after local-first workflow is battle-tested.', status: 'Todo', priority: 'Medium', dueDate: '' }
  ],
  decisions: [{ id: 'd-1', projectId: 'p-launchx-os', title: 'ADR-001: Start local-first', context: 'The product needs rapid iteration without auth, backend, or infra friction.', decision: 'Use browser storage for v1/v2 and add import/export backup.', consequences: 'Faster launch and lower cost. Sync can be added after usage patterns are clear.', date: today() }],
  weekly: [
    { id: 'w-1', title: 'Use Project OS daily for LaunchX execution', projectId: 'p-launchx-os', done: false },
    { id: 'w-2', title: 'Move ideas into decisions or tasks', projectId: 'p-launchx-os', done: false }
  ]
};

function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
    return raw ? { ...seedData, ...JSON.parse(raw) } : seedData;
  } catch {
    return seedData;
  }
}
function projectName(projects: Project[], id: string) { return projects.find((p) => p.id === id)?.name ?? 'No project'; }
function badge(value: string) { return `badge ${value.toLowerCase().replaceAll(' ', '-')}`; }
function escapeHtml(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function markdown(value: string) {
  return escapeHtml(value)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^[-*] (.*)$/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
    .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
}

const nav: { view: View; icon: ReactNode }[] = [
  { view: 'Dashboard', icon: <Sparkles size={17} /> },
  { view: 'Projects', icon: <FolderKanban size={17} /> },
  { view: 'Notes', icon: <FileText size={17} /> },
  { view: 'Tasks', icon: <ClipboardList size={17} /> },
  { view: 'Decisions', icon: <Archive size={17} /> },
  { view: 'Weekly', icon: <Target size={17} /> },
  { view: 'Settings', icon: <Settings size={17} /> }
];

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [view, setView] = useState<View>('Dashboard');
  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState('');
  const [palette, setPalette] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [selectedProjectId, setSelectedProjectId] = useState(() => loadWorkspace().projects[0]?.id ?? '');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)), [workspace]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') { event.preventDefault(); setPalette(true); }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (key === 'p') addProject();
      if (key === 'n') addNote();
      if (key === 't') addTask();
      if (key === 'd') addDecision();
      if (key === 'w') addWeekly();
      if (key === 'escape') { setEditor(null); setPalette(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stats = useMemo(() => [
    { label: 'Projects', value: workspace.projects.length, detail: `${workspace.projects.filter((p) => p.status === 'Active').length} active`, icon: <FolderKanban size={18} /> },
    { label: 'Open tasks', value: workspace.tasks.filter((t) => t.status !== 'Done').length, detail: `${workspace.tasks.filter((t) => t.priority === 'High').length} high priority`, icon: <ClipboardList size={18} /> },
    { label: 'Decisions', value: workspace.decisions.length, detail: 'ADR log', icon: <Archive size={18} /> },
    { label: 'Weekly', value: `${workspace.weekly.filter((w) => w.done).length}/${workspace.weekly.length}`, detail: 'focus closed', icon: <Target size={18} /> }
  ], [workspace]);

  const update = (next: Partial<Workspace>) => setWorkspace((current) => ({ ...current, ...next }));
  const updateProject = (id: string, patch: Partial<Project>) => update({ projects: workspace.projects.map((x) => x.id === id ? { ...x, ...patch } : x) });
  const updateNote = (id: string, patch: Partial<Note>) => update({ notes: workspace.notes.map((x) => x.id === id ? { ...x, ...patch, updatedAt: today() } : x) });
  const updateTask = (id: string, patch: Partial<Task>) => update({ tasks: workspace.tasks.map((x) => x.id === id ? { ...x, ...patch } : x) });
  const updateDecision = (id: string, patch: Partial<Decision>) => update({ decisions: workspace.decisions.map((x) => x.id === id ? { ...x, ...patch } : x) });
  const updateWeekly = (id: string, patch: Partial<WeeklyPriority>) => update({ weekly: workspace.weekly.map((x) => x.id === id ? { ...x, ...patch } : x) });

  function addProject() { const item: Project = { id: uid(), name: 'New project', description: 'Define the execution thesis.', status: 'Idea', priority: 'Medium', owner: 'Ajit', createdAt: today() }; update({ projects: [item, ...workspace.projects] }); setSelectedProjectId(item.id); setView('Projects'); setEditor({ type: 'project', id: item.id }); }
  function addNote() { const item: Note = { id: uid(), projectId: selectedProjectId, title: 'Untitled note', content: '## New note\nWrite in markdown.', updatedAt: today() }; update({ notes: [item, ...workspace.notes] }); setView('Notes'); setEditor({ type: 'note', id: item.id }); }
  function addTask(status: TaskStatus = 'Todo') { const item: Task = { id: uid(), projectId: selectedProjectId, title: 'New task', description: 'Define the next action.', status, priority: 'Medium', dueDate: '' }; update({ tasks: [item, ...workspace.tasks] }); setView('Tasks'); setEditor({ type: 'task', id: item.id }); }
  function addDecision() { const item: Decision = { id: uid(), projectId: selectedProjectId, title: 'ADR: New decision', context: 'Context', decision: 'Decision', consequences: 'Consequences', date: today() }; update({ decisions: [item, ...workspace.decisions] }); setView('Decisions'); setEditor({ type: 'decision', id: item.id }); }
  function addWeekly() { const item: WeeklyPriority = { id: uid(), title: 'New weekly priority', projectId: selectedProjectId, done: false }; update({ weekly: [item, ...workspace.weekly] }); setView('Weekly'); setEditor({ type: 'weekly', id: item.id }); }
  function remove(type: Editor['type'], id: string) { if (!type) return; if (type === 'project') update({ projects: workspace.projects.filter((x) => x.id !== id) }); if (type === 'note') update({ notes: workspace.notes.filter((x) => x.id !== id) }); if (type === 'task') update({ tasks: workspace.tasks.filter((x) => x.id !== id) }); if (type === 'decision') update({ decisions: workspace.decisions.filter((x) => x.id !== id) }); if (type === 'weekly') update({ weekly: workspace.weekly.filter((x) => x.id !== id) }); setEditor(null); }
  function exportJson() { const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `launchx-project-os-${today()}.json`; link.click(); URL.revokeObjectURL(url); }
  function importJson(file?: File) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setWorkspace(JSON.parse(String(reader.result))); } catch { alert('Invalid JSON backup.'); } }; reader.readAsText(file); }

  const selectedProject = workspace.projects.find((p) => p.id === selectedProjectId) ?? workspace.projects[0];
  const actions = [{ label: 'New project', run: addProject }, { label: 'New note', run: addNote }, { label: 'New task', run: () => addTask() }, { label: 'New ADR', run: addDecision }, { label: 'New weekly priority', run: addWeekly }, { label: dark ? 'Light mode' : 'Dark mode', run: () => setDark(!dark) }, { label: 'Export JSON', run: exportJson }];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">LX</div><div><strong>LaunchX</strong><span>Project OS</span></div></div>
      <nav>{nav.map((item) => <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => setView(item.view)}>{item.icon}<span>{item.view}</span></button>)}</nav>
      <button className="command-hint" onClick={() => setPalette(true)}><Command size={15} /> Ctrl K</button>
    </aside>

    <main>
      <header className="topbar">
        <div><p className="eyebrow">Founder execution cockpit</p><h1>{view}</h1><p className="subhead">{selectedProject ? selectedProject.name : 'Local-first workspace'}</p></div>
        <div className="top-actions"><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="ghost" onClick={() => setPalette(true)}><Search size={16} /> Command</button><button className="square" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="primary" onClick={() => view === 'Projects' ? addProject() : view === 'Notes' ? addNote() : view === 'Tasks' ? addTask() : view === 'Decisions' ? addDecision() : view === 'Weekly' ? addWeekly() : addProject()}><Plus size={16} /> Add</button></div>
      </header>

      {view === 'Dashboard' && <section className="dashboard"><div className="hero card"><span className="pill"><Sparkles size={14} /> Premium local-first OS</span><h2>Make every LaunchX idea accountable.</h2><p>Convert scattered founder thoughts into projects, tasks, notes, decisions, and weekly commitments.</p></div>{stats.map((s) => <div className="stat card" key={s.label}>{s.icon}<span>{s.label}</span><strong>{s.value}</strong><small>{s.detail}</small></div>)}<Panel title="This week" action="Add priority" onAction={addWeekly}>{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onToggle={() => updateWeekly(w.id, { done: !w.done })} onOpen={() => setEditor({ type: 'weekly', id: w.id })} />)}</Panel><Panel title="Decision log">{workspace.decisions.slice(0, 4).map((d) => <button className="list-card" key={d.id} onClick={() => setEditor({ type: 'decision', id: d.id })}><strong>{d.title}</strong><span>{d.decision}</span></button>)}</Panel></section>}

      {view === 'Projects' && <section className="cards">{workspace.projects.map((p) => <article className="entity-card" key={p.id} onClick={() => setEditor({ type: 'project', id: p.id })}><div><h3>{p.name}</h3><p>{p.description}</p></div><div className="meta-row"><span className={badge(p.status)}>{p.status}</span><span className={badge(p.priority)}>{p.priority}</span><small>{p.owner}</small></div></article>)}</section>}

      {view === 'Notes' && <section><SearchBar query={query} setQuery={setQuery} onAdd={addNote} label="Note" /><div className="cards">{workspace.notes.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase())).map((n) => <article className="entity-card note-card" key={n.id} onClick={() => setEditor({ type: 'note', id: n.id })}><h3>{n.title}</h3><div className="markdown compact" dangerouslySetInnerHTML={{ __html: markdown(n.content) }} /><div className="meta-row"><small>{projectName(workspace.projects, n.projectId)}</small><small>{n.updatedAt}</small></div></article>)}</div></section>}

      {view === 'Tasks' && <section className="board">{(['Todo','In Progress','Done'] as TaskStatus[]).map((status) => <div className="column" key={status}><div className="column-head"><h3>{status}</h3><button onClick={() => addTask(status)}><Plus size={15} /></button></div>{workspace.tasks.filter((t) => t.status === status).map((t) => <article className="task-card" key={t.id} onClick={() => setEditor({ type: 'task', id: t.id })}><strong>{t.title}</strong><p>{t.description}</p><div className="meta-row"><span className={badge(t.priority)}>{t.priority}</span>{t.dueDate && <small>{t.dueDate}</small>}</div></article>)}</div>)}</section>}

      {view === 'Decisions' && <section className="timeline">{workspace.decisions.map((d) => <article className="decision-card" key={d.id} onClick={() => setEditor({ type: 'decision', id: d.id })}><small>{d.date} · {projectName(workspace.projects, d.projectId)}</small><h3>{d.title}</h3><p><b>Decision:</b> {d.decision}</p><p><b>Impact:</b> {d.consequences}</p></article>)}</section>}

      {view === 'Weekly' && <section className="weekly">{workspace.weekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(workspace.projects, w.projectId)} done={w.done} onToggle={() => updateWeekly(w.id, { done: !w.done })} onOpen={() => setEditor({ type: 'weekly', id: w.id })} />)}</section>}

      {view === 'Settings' && <section className="settings card"><h2>Local-first data layer</h2><p>Data is stored in this browser via localStorage. Export backups before changing device or clearing browser data.</p><div className="settings-grid"><button onClick={exportJson}><Download size={16} /> Export JSON</button><label className="button-like"><Upload size={16} /> Import JSON<input type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} /></label><button onClick={() => setWorkspace(seedData)}>Reset sample data</button></div><div className="shortcut-card"><strong>Keyboard shortcuts</strong><span>Ctrl/Cmd K command palette</span><span>P project · N note · T task · D ADR · W weekly · Esc close</span></div></section>}
    </main>

    <nav className="bottom-nav">{nav.slice(0, 5).map((item) => <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => setView(item.view)}>{item.icon}<span>{item.view}</span></button>)}<button onClick={() => setPalette(true)}><MoreHorizontal size={17} /><span>More</span></button></nav>

    {editor && <EditorPanel editor={editor} workspace={workspace} setEditor={setEditor} updateProject={updateProject} updateNote={updateNote} updateTask={updateTask} updateDecision={updateDecision} updateWeekly={updateWeekly} remove={remove} />}
    {palette && <div className="overlay" onClick={() => setPalette(false)}><div className="palette" onClick={(e) => e.stopPropagation()}><div className="palette-head"><Command size={18} /><input autoFocus placeholder="Type a command..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>{actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())).map((a) => <button key={a.label} onClick={() => { a.run(); setPalette(false); setQuery(''); }}>{a.label}</button>)}</div></div>}
  </div>;
}

function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) { return <section className="card panel"><div className="panel-head"><h3>{title}</h3>{action && <button onClick={onAction}><Plus size={14} />{action}</button>}</div>{children}</section>; }
function SearchBar({ query, setQuery, onAdd, label }: { query: string; setQuery: (v: string) => void; onAdd: () => void; label: string }) { return <div className="searchbar"><label><Search size={16} /><input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="primary" onClick={onAdd}><Plus size={16} />{label}</button></div>; }
function Row({ title, meta, done, onToggle, onOpen }: { title: string; meta: string; done: boolean; onToggle: () => void; onOpen: () => void }) { return <div className="row"><button className="check" onClick={onToggle}>{done ? <Check size={16} /> : <Circle size={16} />}</button><button className="row-main" onClick={onOpen}><strong>{title}</strong><span>{meta}</span></button></div>; }

function EditorPanel({ editor, workspace, setEditor, updateProject, updateNote, updateTask, updateDecision, updateWeekly, remove }: { editor: NonNullable<Editor>; workspace: Workspace; setEditor: (e: Editor) => void; updateProject: (id: string, p: Partial<Project>) => void; updateNote: (id: string, p: Partial<Note>) => void; updateTask: (id: string, p: Partial<Task>) => void; updateDecision: (id: string, p: Partial<Decision>) => void; updateWeekly: (id: string, p: Partial<WeeklyPriority>) => void; remove: (type: Editor['type'], id: string) => void }) {
  const projects = workspace.projects;
  return <div className="drawer-backdrop" onClick={() => setEditor(null)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">Edit</span><h2>{editor.type}</h2></div><button onClick={() => setEditor(null)}>Close</button></div>
    {editor.type === 'project' && (() => { const x = workspace.projects.find((i) => i.id === editor.id); return x && <EditorCard onDelete={() => remove('project', x.id)}><input value={x.name} onChange={(e) => updateProject(x.id, { name: e.target.value })} /><textarea value={x.description} onChange={(e) => updateProject(x.id, { description: e.target.value })} /><div className="form-grid"><select value={x.status} onChange={(e) => updateProject(x.id, { status: e.target.value as ProjectStatus })}><option>Idea</option><option>Active</option><option>Paused</option><option>Completed</option></select><select value={x.priority} onChange={(e) => updateProject(x.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></div><input value={x.owner} onChange={(e) => updateProject(x.id, { owner: e.target.value })} /></EditorCard>; })()}
    {editor.type === 'note' && (() => { const x = workspace.notes.find((i) => i.id === editor.id); return x && <EditorCard onDelete={() => remove('note', x.id)}><input value={x.title} onChange={(e) => updateNote(x.id, { title: e.target.value })} /><ProjectSelect projects={projects} value={x.projectId} onChange={(projectId) => updateNote(x.id, { projectId })} /><textarea className="xl" value={x.content} onChange={(e) => updateNote(x.id, { content: e.target.value })} /><div className="markdown preview" dangerouslySetInnerHTML={{ __html: markdown(x.content) }} /></EditorCard>; })()}
    {editor.type === 'task' && (() => { const x = workspace.tasks.find((i) => i.id === editor.id); return x && <EditorCard onDelete={() => remove('task', x.id)}><input value={x.title} onChange={(e) => updateTask(x.id, { title: e.target.value })} /><textarea value={x.description} onChange={(e) => updateTask(x.id, { description: e.target.value })} /><ProjectSelect projects={projects} value={x.projectId} onChange={(projectId) => updateTask(x.id, { projectId })} /><div className="form-grid"><select value={x.status} onChange={(e) => updateTask(x.id, { status: e.target.value as TaskStatus })}><option>Todo</option><option>In Progress</option><option>Done</option></select><select value={x.priority} onChange={(e) => updateTask(x.id, { priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></div><input type="date" value={x.dueDate} onChange={(e) => updateTask(x.id, { dueDate: e.target.value })} /></EditorCard>; })()}
    {editor.type === 'decision' && (() => { const x = workspace.decisions.find((i) => i.id === editor.id); return x && <EditorCard onDelete={() => remove('decision', x.id)}><input value={x.title} onChange={(e) => updateDecision(x.id, { title: e.target.value })} /><ProjectSelect projects={projects} value={x.projectId} onChange={(projectId) => updateDecision(x.id, { projectId })} /><input type="date" value={x.date} onChange={(e) => updateDecision(x.id, { date: e.target.value })} /><textarea value={x.context} onChange={(e) => updateDecision(x.id, { context: e.target.value })} /><textarea value={x.decision} onChange={(e) => updateDecision(x.id, { decision: e.target.value })} /><textarea value={x.consequences} onChange={(e) => updateDecision(x.id, { consequences: e.target.value })} /></EditorCard>; })()}
    {editor.type === 'weekly' && (() => { const x = workspace.weekly.find((i) => i.id === editor.id); return x && <EditorCard onDelete={() => remove('weekly', x.id)}><input value={x.title} onChange={(e) => updateWeekly(x.id, { title: e.target.value })} /><ProjectSelect projects={projects} value={x.projectId} onChange={(projectId) => updateWeekly(x.id, { projectId })} /><label className="toggle"><input type="checkbox" checked={x.done} onChange={(e) => updateWeekly(x.id, { done: e.target.checked })} /> Done</label></EditorCard>; })()}
  </aside></div>;
}
function EditorCard({ children, onDelete }: { children: ReactNode; onDelete: () => void }) { return <div className="editor-card">{children}<button className="danger" onClick={onDelete}><Trash2 size={16} />Delete</button></div>; }
function ProjectSelect({ projects, value, onChange }: { projects: Project[]; value: string; onChange: (v: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>; }
