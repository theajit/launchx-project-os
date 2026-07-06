import { useEffect, useMemo, useState } from 'react';
import { Archive, Check, Circle, ClipboardList, Command, Download, FileText, FolderKanban, Moon, Plus, Search, Settings, Sparkles, Sun, Target, Trash2, Upload, Users } from 'lucide-react';

type View = 'Dashboard' | 'Projects' | 'Notes' | 'Tasks' | 'Decisions' | 'Weekly' | 'People' | 'Templates' | 'Activity' | 'Settings';
type Role = 'CEO' | 'CTO' | 'CTPO' | 'CGO';
type Priority = 'Low' | 'Medium' | 'High';
type ProjectStatus = 'Idea' | 'Active' | 'Paused' | 'Completed';
type TaskStatus = 'Todo' | 'In Progress' | 'Done';

type Project = { id: string; name: string; description: string; status: ProjectStatus; priority: Priority; owner: string };
type Note = { id: string; projectId: string; title: string; content: string };
type Task = { id: string; projectId: string; title: string; description: string; status: TaskStatus; priority: Priority; assignedTo?: string; assignedExternalId?: string; dueDate?: string };
type Decision = { id: string; projectId: string; title: string; decision: string; consequences: string };
type Weekly = { id: string; projectId: string; title: string; done: boolean };
type Member = { id: string; name: string; email: string; role: Role };
type Stakeholder = { id: string; projectId: string; name: string; company: string; email: string; phone: string; stakeholderType: string; role: string; status: string; notes: string };
type Activity = { id: string; entity_type: string; action: string; created_at: string; name?: string; email?: string };
type Store = { projects: Project[]; notes: Note[]; tasks: Task[]; decisions: Decision[]; weekly: Weekly[]; stakeholders: Stakeholder[] };

type SeedTemplate = { name: string; description: string; tasks: string[]; decisions: string[]; weekly: string[]; notes: string[]; stakeholders?: string[] };

const KEY = 'launchx-project-os:v1';
const TOKEN_KEY = 'launchx-project-os:api-token';
const API_KEY = 'launchx-project-os:api-base';
const defaultApi = import.meta.env.VITE_API_BASE_URL || 'https://api.launchx.in';
const uid = () => crypto.randomUUID();

const seed: Store = {
  projects: [{ id: 'p1', name: 'LaunchX Project OS', description: 'Shared CXO workspace for execution.', status: 'Active', priority: 'High', owner: 'CEO' }],
  notes: [{ id: 'n1', projectId: 'p1', title: 'Product thesis', content: '## Server-backed Project OS\nCEO creates workspace. CTO, CTPO and CGO contribute.' }],
  tasks: [{ id: 't1', projectId: 'p1', title: 'Validate collaboration flow', description: 'Login from another browser and confirm shared data.', status: 'Todo', priority: 'High' }],
  decisions: [{ id: 'd1', projectId: 'p1', title: 'ADR-001: CEO-owned workspace', decision: 'CEO owns workspace bootstrap and destructive sync.', consequences: 'Team can contribute without overwriting source of truth.' }],
  weekly: [{ id: 'w1', projectId: 'p1', title: 'Ship stable collaboration v1', done: false }],
  stakeholders: [],
};

const epicTemplates: SeedTemplate[] = [
  { name: 'Travel Package Launch', description: 'Plan, price, publish and operate a travel package.', tasks: ['Define package itinerary', 'Confirm suppliers and rates', 'Create map and route plan', 'Publish landing page', 'Create sales script', 'Setup operations checklist'], decisions: ['ADR: Package pricing model', 'ADR: Supplier selection criteria'], weekly: ['Finalize package economics', 'Lock supplier confirmations'], notes: ['Package positioning', 'Customer objections'], stakeholders: ['Hotel Partner', 'Transport Vendor', 'Local Guide'] },
  { name: 'SaaS Product', description: 'Build and ship a SaaS MVP.', tasks: ['Define ICP and pain point', 'Create PRD', 'Build MVP backlog', 'Setup analytics', 'Ship beta', 'Collect feedback'], decisions: ['ADR: Tech architecture', 'ADR: Pricing model'], weekly: ['Ship MVP slice', 'Interview users'], notes: ['Product thesis', 'Launch notes'], stakeholders: ['Beta Customer', 'Design Partner'] },
  { name: 'Restaurant Launch', description: 'Open and stabilize a restaurant/café unit.', tasks: ['Finalize menu', 'Confirm vendors', 'Setup POS', 'Hire staff', 'Run soft launch', 'Launch marketing'], decisions: ['ADR: Menu pricing', 'ADR: Vendor sourcing'], weekly: ['Complete outlet readiness', 'Run trial service'], notes: ['Brand story', 'Daily ops checklist'], stakeholders: ['Interior Vendor', 'Food Supplier', 'Marketing Agency'] },
  { name: 'Marketing Campaign', description: 'Campaign execution with creative, channels and measurement.', tasks: ['Define campaign goal', 'Create creative brief', 'Finalize content calendar', 'Launch ads/posts', 'Track conversions'], decisions: ['ADR: Channel mix', 'ADR: Creative direction'], weekly: ['Publish campaign assets', 'Review performance'], notes: ['Campaign angle', 'Hook bank'], stakeholders: ['Agency', 'Creator', 'Designer'] },
  { name: 'Fundraising', description: 'Investor readiness and outreach pipeline.', tasks: ['Prepare pitch deck', 'Build financial model', 'Create investor list', 'Send outreach', 'Track follow-ups'], decisions: ['ADR: Round structure', 'ADR: Valuation approach'], weekly: ['Close deck v1', 'Send first investor batch'], notes: ['Fundraising narrative'], stakeholders: ['Investor', 'CA Firm', 'Legal Advisor'] },
  { name: 'Hiring', description: 'Role definition to offer rollout.', tasks: ['Define role scorecard', 'Publish job post', 'Screen candidates', 'Run interviews', 'Send offer'], decisions: ['ADR: Compensation band', 'ADR: Hiring channel'], weekly: ['Shortlist candidates', 'Close interviews'], notes: ['Interview rubric'], stakeholders: ['Recruiter', 'Candidate'] },
  { name: 'Customer Implementation', description: 'Enterprise-style onboarding and delivery.', tasks: ['Kickoff call', 'Collect requirements', 'Configure workflow', 'Run UAT', 'Go live', 'Handover'], decisions: ['ADR: Scope boundary', 'ADR: Integration approach'], weekly: ['Complete UAT', 'Close blockers'], notes: ['Implementation notes'], stakeholders: ['Client SPOC', 'Integration Partner'] },
  { name: 'Compliance / Audit', description: 'Evidence, controls and audit readiness.', tasks: ['Define control list', 'Collect evidence', 'Review gaps', 'Remediate findings', 'Submit audit pack'], decisions: ['ADR: Control owner model', 'ADR: Evidence repository'], weekly: ['Close high-risk gaps', 'Prepare evidence pack'], notes: ['Audit scope'], stakeholders: ['Auditor', 'Legal', 'Compliance Consultant'] },
];

const projectTemplates: SeedTemplate[] = [
  { name: 'Triphulu', description: 'Travel SaaS and map-led package discovery platform.', tasks: ['Ship map milestone', 'Define package data model', 'Create supplier onboarding flow', 'Setup booking enquiry funnel'], decisions: ['ADR: Map provider', 'ADR: Package pricing logic'], weekly: ['Complete map by 25th', 'Validate supplier flow'], notes: ['Triphulu launch thesis'], stakeholders: ['Hotel Partner', 'Transport Vendor', 'Travel Guide'] },
  { name: 'LaunchX', description: 'MSME/founder consulting execution workspace.', tasks: ['Package advisory offers', 'Build lead pipeline', 'Create client delivery template'], decisions: ['ADR: Service packages', 'ADR: Delivery model'], weekly: ['Publish offer page', 'Create first client playbook'], notes: ['LaunchX positioning'], stakeholders: ['Client', 'CA Firm', 'Marketing Partner'] },
  { name: 'KitchenOS', description: 'Restaurant SaaS for POS and kitchen workflows.', tasks: ['Define POS workflows', 'Build order board', 'Setup restaurant demo', 'Create pricing page'], decisions: ['ADR: POS module boundary', 'ADR: Offline-first approach'], weekly: ['Ship demo flow', 'Validate restaurant owner feedback'], notes: ['KitchenOS product thesis'], stakeholders: ['Restaurant Owner', 'Kitchen Staff'] },
  { name: 'Pin Code Café', description: 'Dhenkanal café brand and operating system.', tasks: ['Finalize menu', 'Setup café operations', 'Create launch campaign', 'Track daily sales'], decisions: ['ADR: Coffee sourcing', 'ADR: Menu pricing'], weekly: ['Complete café readiness', 'Launch local content'], notes: ['Café brand story'], stakeholders: ['Coffee Supplier', 'Designer', 'Local Creator'] },
  { name: 'Odia Nanaa', description: 'Odia food brand and restaurant growth project.', tasks: ['Finalize seating plan', 'Lock menu economics', 'Create launch offers', 'Setup staff SOP'], decisions: ['ADR: Menu architecture', 'ADR: Expansion model'], weekly: ['Complete outlet setup', 'Finalize vendor list'], notes: ['Odia Nanaa story'], stakeholders: ['Food Supplier', 'Interior Vendor', 'Local Marketing'] },
];

function load(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as Store; } catch { return seed; }
}
function badge(value: string) { return 'badge ' + String(value || '').toLowerCase().replaceAll(' ', '-'); }
function projectName(data: Store, id?: string) { return data.projects.find((p) => p.id === id)?.name || 'No project'; }
function markdown(value: string) { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/^- (.*)$/gm,'<li>$1</li>').replace(/\n/g,'<br/>'); }
function dateWithinWeek(value?: string) { if (!value) return false; const d = new Date(value); const now = new Date(); const week = new Date(); week.setDate(now.getDate() + 7); return d >= now && d <= week; }
function isOverdue(value?: string) { if (!value) return false; const d = new Date(value); const today = new Date(); today.setHours(0,0,0,0); return d < today; }
function fromWorkspace(w: any): Store {
  return {
    projects: (w.projects || []).map((p: any) => ({ id: p.id, name: p.name, description: p.description || '', status: p.status, priority: p.priority, owner: p.owner_user_id ? 'Team' : 'CEO' })),
    notes: (w.notes || []).map((n: any) => ({ id: n.id, projectId: n.project_id || '', title: n.title, content: n.content || '' })),
    tasks: (w.tasks || []).map((t: any) => ({ id: t.id, projectId: t.project_id || '', title: t.title, description: t.description || '', status: t.status, priority: t.priority, assignedTo: t.assigned_to || undefined, assignedExternalId: t.assigned_external_id || undefined, dueDate: t.due_date || undefined })),
    decisions: (w.decisions || []).map((d: any) => ({ id: d.id, projectId: d.project_id || '', title: d.title, decision: d.decision || '', consequences: d.consequences || '' })),
    weekly: (w.weekly || []).map((x: any) => ({ id: x.id, projectId: x.project_id || '', title: x.title, done: Boolean(x.done) })),
    stakeholders: (w.stakeholders || []).map((s: any) => ({ id: s.id, projectId: s.project_id || '', name: s.name, company: s.company || '', email: s.email || '', phone: s.phone || '', stakeholderType: s.stakeholder_type || 'External', role: s.role || '', status: s.status || 'Active', notes: s.notes || '' })),
  };
}

export default function App() {
  const [data, setData] = useState<Store>(load);
  const [view, setView] = useState<View>('Dashboard');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [projectId, setProjectId] = useState(() => data.projects[0]?.id || '');
  const [query, setQuery] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [apiBase, setApiBase] = useState(() => localStorage.getItem(API_KEY) || defaultApi);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [email, setEmail] = useState('ajit@theajit.in');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState('');
  const [syncStatus, setSyncStatus] = useState(() => token ? 'Connected' : 'Local only');
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'CTO' as Exclude<Role,'CEO'> });
  const [newStakeholder, setNewStakeholder] = useState({ name: '', company: '', email: '', phone: '', stakeholderType: 'Vendor', role: '', status: 'Active', notes: '' });

  const connected = Boolean(token);
  const isCEO = userRole === 'CEO';
  const currentProject = data.projects.find((p) => p.id === projectId);
  const projectTasks = data.tasks.filter((t) => t.projectId === projectId);
  const projectNotes = data.notes.filter((n) => n.projectId === projectId);
  const projectDecisions = data.decisions.filter((d) => d.projectId === projectId);
  const projectWeekly = data.weekly.filter((w) => w.projectId === projectId);
  const projectStakeholders = data.stakeholders.filter((s) => s.projectId === projectId);
  const myTasks = projectTasks.filter((t) => t.status !== 'Done' && (!userId || t.assignedTo === userId || !t.assignedTo && !t.assignedExternalId)).slice(0, 6);
  const dueThisWeek = projectTasks.filter((t) => t.status !== 'Done' && dateWithinWeek(t.dueDate));
  const overdue = projectTasks.filter((t) => t.status !== 'Done' && isOverdue(t.dueDate));
  const blocked = projectTasks.filter((t) => t.assignedExternalId && t.status !== 'Done');

  const stats = useMemo(() => [
    { label: 'Tasks', value: projectTasks.filter((t) => t.status !== 'Done').length, detail: `${projectTasks.filter((t) => t.priority === 'High').length} high priority`, icon: <ClipboardList />, view: 'Tasks' as View },
    { label: 'People', value: members.length + projectStakeholders.length, detail: `${projectStakeholders.length} external`, icon: <Users />, view: 'People' as View },
    { label: 'ADRs', value: projectDecisions.length, detail: 'project decisions', icon: <Archive />, view: 'Decisions' as View },
    { label: 'Weekly', value: `${projectWeekly.filter((w) => w.done).length}/${projectWeekly.length}`, detail: 'project focus', icon: <Target />, view: 'Weekly' as View },
  ], [projectTasks, projectStakeholders, projectDecisions, projectWeekly, members.length]);

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(data)), [data]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === 'Escape') setCommandOpen(false);
      if (event.key.toLowerCase() === 'p') void addProject();
      if (event.key.toLowerCase() === 'n') void addNote();
      if (event.key.toLowerCase() === 't') void addTask('Todo');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (!token) return;
    void refreshWorkspace();
    const id = setInterval(() => void refreshWorkspace(false), 30000);
    return () => clearInterval(id);
  }, [token]);

  async function api(path: string, body?: unknown, auth = true, method?: string) {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}${path}`, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || 'API request failed');
    return json;
  }
  async function refreshWorkspace(show = true, nextToken = token) {
    if (!nextToken) return;
    try {
      const base = apiBase.replace(/\/$/, '');
      const [meRes, wsRes, actRes] = await Promise.all([
        fetch(`${base}/me`, { headers: { Authorization: `Bearer ${nextToken}` } }),
        fetch(`${base}/workspace`, { headers: { Authorization: `Bearer ${nextToken}` } }),
        fetch(`${base}/activity`, { headers: { Authorization: `Bearer ${nextToken}` } }),
      ]);
      const me = await meRes.json();
      const ws = await wsRes.json();
      const act = await actRes.json();
      if (!wsRes.ok) throw new Error(ws.message || 'Could not load workspace');
      const next = fromWorkspace(ws);
      setData(next);
      setMembers(ws.members || []);
      setActivity(Array.isArray(act) ? act : []);
      setUserRole(me.role || null);
      setUserId(me.id || '');
      if (!next.projects.find((p) => p.id === projectId)) setProjectId(next.projects[0]?.id || '');
      if (show) setSyncStatus(`Auto-synced ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Sync failed');
    }
  }
  async function login() {
    try {
      setSyncStatus('Logging in...');
      const json = await api('/auth/login', { email, password }, false);
      setToken(json.token);
      setUserRole(json.user.role);
      setUserId(json.user.id);
      localStorage.setItem(TOKEN_KEY, json.token);
      localStorage.setItem(API_KEY, apiBase);
      await refreshWorkspace(true, json.token);
    } catch (error) { setSyncStatus(error instanceof Error ? error.message : 'Login failed'); }
  }
  async function bootstrap() {
    try {
      setSyncStatus('Creating CEO workspace...');
      const json = await api('/auth/bootstrap', { organizationName: 'LaunchX', name: 'Ajit Satpathy', email, password, role: 'CEO' }, false);
      setToken(json.token);
      setUserRole('CEO');
      setUserId(json.user.id);
      localStorage.setItem(TOKEN_KEY, json.token);
      localStorage.setItem(API_KEY, apiBase);
      await refreshWorkspace(true, json.token);
    } catch (error) { setSyncStatus(error instanceof Error ? error.message : 'Workspace creation failed'); }
  }
  function logout() { setToken(''); setUserRole(null); setUserId(''); setMembers([]); setActivity([]); localStorage.removeItem(TOKEN_KEY); setSyncStatus('Signed out. Local workspace remains available.'); }
  async function mutate(path: string, body: unknown, local: () => void, method?: string) {
    try { if (token) { await api(path, body, true, method); await refreshWorkspace(); return; } local(); }
    catch (error) { setSyncStatus(error instanceof Error ? error.message : 'Save failed'); local(); }
  }
  async function remove(path: string, local: () => void) {
    try { if (token) { await api(path, undefined, true, 'DELETE'); await refreshWorkspace(); return; } local(); }
    catch (error) { setSyncStatus(error instanceof Error ? error.message : 'Delete failed'); }
  }

  async function addProject(template?: SeedTemplate) {
    const item: Project = { id: uid(), name: template?.name || 'New project', description: template?.description || 'Define the execution thesis.', status: 'Idea', priority: 'Medium', owner: 'CEO' };
    if (token) {
      const created = await api('/projects', { name: item.name, description: item.description, status: item.status, priority: item.priority });
      await hydrateTemplate(created.id, template);
      await refreshWorkspace();
      setProjectId(created.id);
    } else {
      setData((d) => ({ ...d, projects: [item, ...d.projects] }));
      setProjectId(item.id);
    }
    setView('Projects');
  }
  async function hydrateTemplate(targetProjectId: string, template?: SeedTemplate) {
    if (!template || !token) return;
    await Promise.all([
      ...template.tasks.map((title) => api('/tasks', { projectId: targetProjectId, title, description: 'Template task', priority: 'Medium', status: 'Todo' })),
      ...template.decisions.map((title) => api('/decisions', { projectId: targetProjectId, title, decision: 'To be decided', consequences: 'Capture impact before execution.' })),
      ...template.weekly.map((title) => api('/weekly-priorities', { projectId: targetProjectId, title, done: false })),
      ...template.notes.map((title) => api('/notes', { projectId: targetProjectId, title, content: `## ${title}\nUse this note to capture working details.` })),
      ...(template.stakeholders || []).map((name) => api('/stakeholders', { projectId: targetProjectId, name, stakeholderType: 'External', role: 'Stakeholder' })),
    ]);
  }
  async function applyEpicTemplate(template: SeedTemplate) {
    if (!projectId) return;
    await hydrateTemplate(projectId, template);
    await refreshWorkspace();
    setView('Dashboard');
  }
  async function deleteProject(id: string) { await remove(`/projects/${id}`, () => setData((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== id) }))); }
  async function addNote() { const item: Note = { id: uid(), projectId, title: 'Untitled note', content: '## New note\nWrite in markdown.' }; await mutate('/notes', { projectId: token ? projectId : null, title: item.title, content: item.content }, () => setData((d) => ({ ...d, notes: [item, ...d.notes] }))); setView('Notes'); }
  async function deleteNote(id: string) { await remove(`/notes/${id}`, () => setData((d) => ({ ...d, notes: d.notes.filter((x) => x.id !== id) }))); }
  async function addTask(status: TaskStatus) { const assignee = userId || members.find((m) => m.role === 'CTO')?.id; const item: Task = { id: uid(), projectId, title: 'New task', description: 'Define the next action.', status, priority: 'Medium', assignedTo: assignee }; await mutate('/tasks', { projectId: token ? projectId : null, title: item.title, description: item.description, status: item.status, priority: item.priority, assignedTo: assignee || null }, () => setData((d) => ({ ...d, tasks: [item, ...d.tasks] }))); setView('Tasks'); }
  async function assignTask(id: string, target: string) {
    const [type, value] = target.split(':');
    await mutate(`/tasks/${id}/assign`, { assignedTo: type === 'user' ? value : null, assignedExternalId: type === 'external' ? value : null }, () => setData((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === id ? { ...x, assignedTo: type === 'user' ? value : undefined, assignedExternalId: type === 'external' ? value : undefined } : x) })));
  }
  async function moveTask(id: string, status: TaskStatus) { await mutate(`/tasks/${id}/status`, { status }, () => setData((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === id ? { ...x, status } : x) }))); }
  async function deleteTask(id: string) { await remove(`/tasks/${id}`, () => setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }))); }
  async function addDecision() { const item: Decision = { id: uid(), projectId, title: 'ADR: New decision', decision: 'Decision', consequences: 'Expected impact' }; await mutate('/decisions', { projectId: token ? projectId : null, title: item.title, decision: item.decision, consequences: item.consequences }, () => setData((d) => ({ ...d, decisions: [item, ...d.decisions] }))); setView('Decisions'); }
  async function deleteDecision(id: string) { await remove(`/decisions/${id}`, () => setData((d) => ({ ...d, decisions: d.decisions.filter((x) => x.id !== id) }))); }
  async function addWeekly() { const item: Weekly = { id: uid(), projectId, title: 'New weekly priority', done: false }; await mutate('/weekly-priorities', { projectId: token ? projectId : null, title: item.title, done: false }, () => setData((d) => ({ ...d, weekly: [item, ...d.weekly] }))); setView('Weekly'); }
  async function toggleWeekly(id: string) { const item = data.weekly.find((w) => w.id === id); if (!item) return; const done = !item.done; await mutate(`/weekly-priorities/${id}`, { done }, () => setData((d) => ({ ...d, weekly: d.weekly.map((w) => w.id === id ? { ...w, done } : w) })), 'PATCH'); }
  async function deleteWeekly(id: string) { await remove(`/weekly-priorities/${id}`, () => setData((d) => ({ ...d, weekly: d.weekly.filter((x) => x.id !== id) }))); }
  async function createMember() { if (!isCEO) { setSyncStatus('Only CEO can create team members.'); return; } await api('/team/members', newMember); setNewMember({ name: '', email: '', password: '', role: 'CTO' }); await refreshWorkspace(); }
  async function createStakeholder() { const payload = { projectId, ...newStakeholder }; await mutate('/stakeholders', payload, () => setData((d) => ({ ...d, stakeholders: [{ id: uid(), projectId, ...payload }, ...d.stakeholders] }))); setNewStakeholder({ name: '', company: '', email: '', phone: '', stakeholderType: 'Vendor', role: '', status: 'Active', notes: '' }); }
  async function deleteStakeholder(id: string) { await remove(`/stakeholders/${id}`, () => setData((d) => ({ ...d, stakeholders: d.stakeholders.filter((x) => x.id !== id) }))); }
  async function pushLocalData() { if (!isCEO) { setSyncStatus('Only CEO can replace server data.'); return; } await api('/workspace/import', { ...data, replace: true }); await refreshWorkspace(); }
  function exportJson() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'launchx-project-os.json'; a.click(); }
  function importJson(file?: File) { if (!file) return; const r = new FileReader(); r.onload = () => setData(JSON.parse(String(r.result))); r.readAsText(file); }
  function assigneeLabel(task: Task) { if (task.assignedExternalId) return projectStakeholders.find((s) => s.id === task.assignedExternalId)?.name || 'External'; if (task.assignedTo) return members.find((m) => m.id === task.assignedTo)?.name || 'Internal'; return 'Unassigned'; }
  const addForView = () => view === 'Notes' ? addNote() : view === 'Tasks' ? addTask('Todo') : view === 'Decisions' ? addDecision() : view === 'Weekly' ? addWeekly() : view === 'People' ? createStakeholder() : addProject();
  const actions = [['New project', () => addProject()], ['New note', addNote], ['New task', () => addTask('Todo')], ['New ADR', addDecision], ['New stakeholder', createStakeholder], ['Refresh workspace', () => refreshWorkspace()]] as const;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">LX</div><div><b>LaunchX</b><span>Project OS</span></div></div><Nav view={view} setView={setView} /><button className="command-hint" onClick={() => setCommandOpen(true)}><Command size={15}/> Ctrl K</button></aside><main><header className="topbar compact-topbar"><div><p className="eyebrow">{connected ? `${userRole || 'Team'} · auto-sync on` : 'Local-first mode'}</p><h1>{view}</h1><p className="subhead">{currentProject ? `${currentProject.name} · ${syncStatus}` : syncStatus}</p></div><button className="theme-float" onClick={() => setDark(!dark)}>{dark ? <Sun/> : <Moon/>}</button><div className="top-actions"><select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="primary compact-add" onClick={() => void addForView()}><Plus/> Add</button></div></header>

  {view === 'Dashboard' && <section className="dashboard dashboard-compact"><div className="hero card hero-compact"><span className="pill"><Sparkles size={14}/> v1 cockpit</span><h2>{currentProject?.name || 'Select a project'}</h2><p>{currentProject?.description || 'Everything below is scoped to the selected project.'}</p></div><div className="shortcut-grid">{stats.map((s) => <button className="shortcut-card-link" key={s.label} onClick={() => setView(s.view)}>{s.icon}<div><b>{s.value}</b><span>{s.label}</span><small>{s.detail}</small></div></button>)}</div><Panel title="My work">{myTasks.length ? myTasks.map((t) => <button className="list-card" key={t.id} onClick={() => setView('Tasks')}><b>{t.title}</b><span>{assigneeLabel(t)} · {t.status} · {t.priority}</span></button>) : <button className="list-card" onClick={() => void addTask('Todo')}><b>No open tasks for this project</b><span>Create the next project action</span></button>}</Panel><Panel title="Due / blocked"><button className="list-card" onClick={() => setView('Tasks')}><b>{overdue.length} overdue · {dueThisWeek.length} due this week</b><span>{blocked.length} waiting on external stakeholders</span></button></Panel><Panel title="Recent decisions">{projectDecisions.slice(0,4).map((d) => <button className="list-card" key={d.id} onClick={() => setView('Decisions')}><b>{d.title}</b><span>{d.decision}</span></button>)}</Panel><Panel title="Activity timeline">{activity.slice(0,4).map((a) => <button className="list-card" key={a.id} onClick={() => setView('Activity')}><b>{a.name || a.email || 'Team'} {a.action} {a.entity_type}</b><span>{new Date(a.created_at).toLocaleString()}</span></button>)}</Panel></section>}

  {view === 'Projects' && <section className="cards">{data.projects.map((p) => <article className="entity-card" key={p.id}><div><h3>{p.name}</h3><p>{p.description}</p></div><div className="meta-row"><span className={badge(p.status)}>{p.status}</span><span className={badge(p.priority)}>{p.priority}</span><small>{p.owner}</small><button className="mini-danger" onClick={() => void deleteProject(p.id)}><Trash2 size={14}/> Delete</button></div></article>)}</section>}

  {view === 'Notes' && <section><div className="searchbar"><label><Search size={16}/><input placeholder="Search selected project notes" value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="primary" onClick={() => void addNote()}><Plus/> Note</button></div><div className="cards">{projectNotes.filter((n) => (n.title+n.content).toLowerCase().includes(query.toLowerCase())).map((n) => <article className="entity-card note-card" key={n.id}><h3>{n.title}</h3><div className="markdown compact" dangerouslySetInnerHTML={{ __html: markdown(n.content) }} /><div className="meta-row"><small>{projectName(data,n.projectId)}</small><button className="mini-danger" onClick={() => void deleteNote(n.id)}><Trash2 size={14}/> Delete</button></div></article>)}</div></section>}

  {view === 'Tasks' && <section className="board">{(['Todo','In Progress','Done'] as TaskStatus[]).map((status) => <div className="column" key={status}><div className="column-head"><h3>{status}</h3><button onClick={() => void addTask(status)}><Plus size={15}/></button></div>{projectTasks.filter((t) => t.status === status).map((t) => <article className="task-card" key={t.id}><b>{t.title}</b><p>{t.description}</p><span className={badge(t.priority)}>{t.priority}</span><small>{projectName(data,t.projectId)}</small><select value={t.assignedExternalId ? `external:${t.assignedExternalId}` : t.assignedTo ? `user:${t.assignedTo}` : ''} onChange={(e) => void assignTask(t.id, e.target.value)}><option value="">Unassigned</option><optgroup label="Internal">{members.map((m) => <option key={m.id} value={`user:${m.id}`}>{m.name} · {m.role}</option>)}</optgroup><optgroup label="External">{projectStakeholders.map((s) => <option key={s.id} value={`external:${s.id}`}>{s.name} · {s.stakeholderType}</option>)}</optgroup></select><div className="settings-grid"><select value={t.status} onChange={(e) => void moveTask(t.id, e.target.value as TaskStatus)}><option>Todo</option><option>In Progress</option><option>Done</option></select><button className="mini-danger" onClick={() => void deleteTask(t.id)}><Trash2 size={14}/> Delete</button></div><small>Assigned: {assigneeLabel(t)}</small></article>)}</div>)}</section>}

  {view === 'Decisions' && <section className="timeline">{projectDecisions.map((d) => <article className="decision-card" key={d.id}><h3>{d.title}</h3><span className="badge active">{projectName(data,d.projectId)}</span><p><b>Decision:</b> {d.decision}</p><p><b>Impact:</b> {d.consequences}</p><button className="mini-danger" onClick={() => void deleteDecision(d.id)}><Trash2 size={14}/> Delete</button></article>)}</section>}

  {view === 'Weekly' && <section className="weekly">{projectWeekly.map((w) => <Row key={w.id} title={w.title} meta={projectName(data,w.projectId)} done={w.done} onToggle={() => void toggleWeekly(w.id)} onDelete={() => void deleteWeekly(w.id)} />)}</section>}

  {view === 'People' && <section className="settings settings-v2"><h2>People</h2><p>Internal CXOs plus project-scoped external stakeholders.</p><div className="settings-section"><h3><Users size={18}/> Internal CXOs</h3><div className="team-list">{members.map((m) => <div className="member-card" key={m.id}><span className={badge(m.role)}>{m.role}</span><div><b>{m.name}</b><small>{m.email}</small></div></div>)}</div></div><div className="settings-section"><h3>External stakeholders</h3><div className="editor-card"><input placeholder="Name" value={newStakeholder.name} onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}/><input placeholder="Company" value={newStakeholder.company} onChange={(e) => setNewStakeholder({ ...newStakeholder, company: e.target.value })}/><input placeholder="Email" value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}/><input placeholder="Phone" value={newStakeholder.phone} onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}/><select value={newStakeholder.stakeholderType} onChange={(e) => setNewStakeholder({ ...newStakeholder, stakeholderType: e.target.value })}><option>Vendor</option><option>Client</option><option>Agency</option><option>Freelancer</option><option>Consultant</option><option>Partner</option><option>Legal</option><option>Finance</option></select><input placeholder="Role / responsibility" value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}/><button onClick={() => void createStakeholder()}>Add stakeholder</button></div><div className="team-list">{projectStakeholders.map((s) => <div className="member-card" key={s.id}><span className={badge(s.stakeholderType)}>{s.stakeholderType}</span><div><b>{s.name}</b><small>{s.company || s.role || s.email || 'External stakeholder'}</small></div><button className="mini-danger" onClick={() => void deleteStakeholder(s.id)}><Trash2 size={14}/></button></div>)}</div></div></section>}

  {view === 'Templates' && <section className="settings settings-v2"><h2>Templates</h2><p>Create projects or seed the selected project with proven execution playbooks.</p><div className="settings-section"><h3>Project templates</h3><div className="cards">{projectTemplates.map((t) => <article className="entity-card" key={t.name}><h3>{t.name}</h3><p>{t.description}</p><button onClick={() => void addProject(t)}>Create project</button></article>)}</div></div><div className="settings-section"><h3>Epic templates</h3><div className="cards">{epicTemplates.map((t) => <article className="entity-card" key={t.name}><h3>{t.name}</h3><p>{t.description}</p><button onClick={() => void applyEpicTemplate(t)}>Apply to selected project</button></article>)}</div></div></section>}

  {view === 'Activity' && <section className="timeline">{activity.map((a) => <article className="decision-card" key={a.id}><h3>{a.entity_type} · {a.action}</h3><p>{a.name || a.email || 'Team member'} at {new Date(a.created_at).toLocaleString()}</p></article>)}</section>}

  {view === 'Settings' && <SettingsView connected={connected} isCEO={isCEO} apiBase={apiBase} setApiBase={setApiBase} email={email} setEmail={setEmail} password={password} setPassword={setPassword} syncStatus={syncStatus} bootstrap={bootstrap} login={login} logout={logout} pushLocalData={pushLocalData} refreshWorkspace={refreshWorkspace} exportJson={exportJson} importJson={importJson} members={members} newMember={newMember} setNewMember={setNewMember} createMember={createMember}/>}</main><nav className="bottom-nav"><Nav view={view} setView={setView} compact /></nav>{commandOpen && <div className="overlay" onClick={() => setCommandOpen(false)}><div className="palette" onClick={(e) => e.stopPropagation()}><div className="palette-head"><Command/><input autoFocus placeholder="Type a command" /></div>{actions.map(([label, run]) => <button key={label} onClick={() => { void run(); setCommandOpen(false); }}>{label}</button>)}</div></div>}</div>;
}

function SettingsView(p: any) { return <section className="settings settings-v2"><h2>Workspace Settings</h2><p>CEO creates workspace. CTO, CTPO and CGO contribute. Server replace is CEO-only.</p><div className="settings-section"><span className={p.connected ? 'badge active' : 'badge paused'}>{p.connected ? 'Connected' : 'Local only'}</span><h3>Account & Workspace</h3><input value={p.apiBase} onChange={(e:any) => p.setApiBase(e.target.value)} placeholder="API URL" />{!p.connected && <><input value={p.email} onChange={(e:any) => p.setEmail(e.target.value)} placeholder="Email"/><input type="password" value={p.password} onChange={(e:any) => p.setPassword(e.target.value)} placeholder="Password"/><div className="settings-grid"><button onClick={p.bootstrap}>Create CEO workspace</button><button onClick={p.login}>Login</button></div></>}{p.connected && <div className="settings-grid"><button onClick={p.refreshWorkspace}>Refresh now</button><button className="ghost-button" onClick={p.logout}>Logout</button></div>}<p className="sync-status">{p.syncStatus}</p></div>{p.connected && <div className="settings-section"><h3><Users size={18}/> Team Management</h3><p>Only CEO can create members. Others can contribute to execution data.</p>{p.isCEO && <div className="editor-card"><input placeholder="Name" value={p.newMember.name} onChange={(e:any) => p.setNewMember({ ...p.newMember, name: e.target.value })}/><input placeholder="Email" value={p.newMember.email} onChange={(e:any) => p.setNewMember({ ...p.newMember, email: e.target.value })}/><input type="password" placeholder="Temporary password" value={p.newMember.password} onChange={(e:any) => p.setNewMember({ ...p.newMember, password: e.target.value })}/><select value={p.newMember.role} onChange={(e:any) => p.setNewMember({ ...p.newMember, role: e.target.value })}><option>CTO</option><option>CTPO</option><option>CGO</option></select><button onClick={p.createMember}>Create member</button></div>}<div className="team-list">{p.members.map((m:Member) => <div className="member-card" key={m.id}><span className={badge(m.role)}>{m.role}</span><div><b>{m.name}</b><small>{m.email}</small></div></div>)}</div></div>}<div className="settings-section"><h3>Backup & Restore</h3><div className="settings-grid"><button onClick={p.exportJson}><Download/> Export JSON</button><label className="button-like"><Upload/> Import JSON<input type="file" hidden accept="application/json" onChange={(e:any) => p.importJson(e.target.files?.[0])}/></label></div></div>{p.isCEO && <div className="settings-section danger-zone"><h3>CEO Danger Zone</h3><p>Replace server data with this browser’s local copy. Use only during recovery/migration.</p><button onClick={p.pushLocalData}>Replace server with local</button></div>}</section>; }
function Nav({ view, setView, compact }: { view: View; setView: (v: View) => void; compact?: boolean }) { const items = [['Dashboard', <Sparkles/>], ['Projects', <FolderKanban/>], ['Notes', <FileText/>], ['Tasks', <ClipboardList/>], ['Decisions', <Archive/>], ['Weekly', <Target/>], ['People', <Users/>], ['Templates', <Sparkles/>], ['Activity', <Command/>], ['Settings', <Settings/>]] as const; return <>{items.slice(0, compact ? 10 : 10).map(([v, icon]) => <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v as View)}>{icon}<span>{v}</span></button>)}</>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="card panel"><div className="panel-head"><h3>{title}</h3></div>{children}</section>; }
function Row({ title, meta, done, onToggle, onDelete }: { title: string; meta: string; done: boolean; onToggle: () => void; onDelete: () => void }) { return <div className="row"><button className="check" onClick={onToggle}>{done ? <Check/> : <Circle/>}</button><button className="row-main"><b>{title}</b><span>{meta}</span></button><button className="mini-danger" onClick={onDelete}><Trash2 size={14}/></button></div>; }
