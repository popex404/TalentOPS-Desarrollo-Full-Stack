// MÓDULO PRINCIPAL (ESM)
const STORAGE_KEY = "todo_pro_v2_v1";

// Utilidades
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* --------------------------
   ELEMENTOS
---------------------------*/
const formAdd = $('#form-add');
const inputText = $('#task-text');
const inputTags = $('#task-tags');
const selectPriority = $('#task-priority');
const btnClear = $('#btn-clear');

const todoList = $('#todo-list');
const emptyEl = $('#empty');

const searchInput = $('#search');
const filters = $('#filters');
const tagList = $('#tag-list');

const btnExportJSON = $('#btn-export-json');
const btnImportJSON = $('#btn-import-json');
const importJsonInput = $('#import-json');
const btnExportCSV = $('#btn-export-csv');

const btnDark = $('#btn-darkmode');

const statTotal = $('#stat-total');
const statCompleted = $('#stat-completed');
const statPending = $('#stat-pending');

/* --------------------------
   ESTADO
---------------------------*/
let tasks = loadTasks();
let filterMode = 'all';
let activeTag = null;
let dragSrcId = null;
let debounceTimer = null;

/* --------------------------
   INICIALIZACIÓN
---------------------------*/
renderAll();

/* --------------------------
   FUNCIONES DE PERSISTENCIA
---------------------------*/
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Error parse localStorage", e);
    return [];
  }
}

/* --------------------------
   RENDER (optimizado con fragment)
---------------------------*/
function renderAll(){
  renderStats();
  renderTagList();
  renderTasks();
}

function renderStats(){
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = total - completed;
}

function uniqueTags(){
  const set = new Set();
  tasks.forEach(t => (t.tags||[]).forEach(tag => set.add(tag)));
  return Array.from(set).sort();
}

function renderTagList(){
  const tags = uniqueTags();
  tagList.innerHTML = '';
  if(tags.length===0){
    tagList.innerHTML = '<small>No hay etiquetas</small>';
    return;
  }
  const frag = document.createDocumentFragment();
  tags.forEach(tag=>{
    const b = document.createElement('button');
    b.className='chip';
    b.dataset.tag = tag;
    b.textContent = tag;
    if(activeTag===tag) b.classList.add('active');
    frag.appendChild(b);
  });
  tagList.appendChild(frag);
}

/* Filtrado + búsqueda */
function matchesSearch(t, q){
  if(!q) return true;
  q = q.toLowerCase();
  return t.text.toLowerCase().includes(q) ||
         (t.tags||[]).some(tag=>tag.toLowerCase().includes(q));
}

function getFilteredTasks(){
  const q = (searchInput.value || '').trim();
  return tasks.filter(t=>{
    if(filterMode==='pending' && t.done) return false;
    if(filterMode==='completed' && !t.done) return false;
    if(activeTag && !(t.tags||[]).includes(activeTag)) return false;
    return matchesSearch(t,q);
  });
}

function renderTasks(){
  const list = getFilteredTasks();
  todoList.innerHTML = '';
  if(list.length===0){
    emptyEl.style.display = '';
    return;
  } else {
    emptyEl.style.display = 'none';
  }

  const frag = document.createDocumentFragment();
  list.forEach(task=>{
    frag.appendChild(createTaskElement(task));
  });
  todoList.appendChild(frag);
}

/* --------------------------
   CREACIÓN ELEMENTOS (delegables)
---------------------------*/
function createTaskElement(task){
  const el = document.createElement('div');
  el.className = 'task';
  el.draggable = true;
  el.dataset.id = task.id;

  el.innerHTML = `
    <div class="handle" title="Arrastrar"></div>
    <input class="checkbox" type="checkbox" ${task.done?'checked':''} aria-label="marcar tarea" />
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.text)}</div>
      <input class="title-edit" value="${escapeHtml(task.text)}" />
      <div class="task-meta">
        <div class="task-tags">${(task.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        <small> • ${task.priority || 'normal'}</small>
        <small> • ${new Date(task.createdAt).toLocaleString()}</small>
      </div>
    </div>
    <div class="actions">
      <button class="icon-btn btn-edit" title="Editar">✏️</button>
      <button class="icon-btn btn-delete" title="Eliminar">🗑️</button>
    </div>
  `;
  if(task.done) el.classList.add('done');
  if(task.editing) el.classList.add('editing');
  return el;
}

/* --------------------------
   EVENT DELEGATION (una sola zona para clicks)
---------------------------*/
document.addEventListener('click', (e)=>{
  const taskEl = e.target.closest('.task');
  // Actions en tareas
  if(e.target.matches('.btn-delete') || e.target.closest('.btn-delete')){
    if(!taskEl) return;
    const id = Number(taskEl.dataset.id);
    removeTask(id);
    return;
  }
  if(e.target.matches('.btn-edit') || e.target.closest('.btn-edit')){
    if(!taskEl) return;
    toggleEditing(taskEl);
    return;
  }
  // Tag click (delegado desde tag-list)
  if(e.target.closest('#tag-list button')){
    const btn = e.target.closest('#tag-list button');
    activeTag = activeTag===btn.dataset.tag ? null : btn.dataset.tag;
    // update visuals
    $$('#tag-list button').forEach(b=>b.classList.toggle('active', b===btn && activeTag));
    renderTasks();
    renderStats();
    return;
  }
  // Filters (chips)
  if(e.target.closest('#filters .chip')){
    const chip = e.target.closest('#filters .chip');
    $('#filters .chip.active')?.classList.remove('active');
    chip.classList.add('active');
    filterMode = chip.dataset.filter;
    renderTasks();
    renderStats();
    return;
  }
});

/* Delegated change (checkbox) + editing save on blur handled by input listeners */
document.addEventListener('change', (e)=>{
  const taskEl = e.target.closest('.task');
  if(e.target.matches('.checkbox') && taskEl){
    const id = Number(taskEl.dataset.id);
    toggleDone(id, e.target.checked);
  }
});

/* Delegated key events for inline edit (Enter to save, Esc cancel) */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && e.target.matches('.title-edit')){
    e.preventDefault();
    const taskEl = e.target.closest('.task');
    saveEdit(taskEl, e.target.value.trim());
    return;
  }
  if(e.key === 'Escape' && e.target.matches('.title-edit')){
    const taskEl = e.target.closest('.task');
    cancelEdit(taskEl);
    return;
  }
});

/* Save on blur */
document.addEventListener('focusout', (e)=>{
  if(e.target.matches('.title-edit')){
    const taskEl = e.target.closest('.task');
    // slight delay so click handlers on save/delete won't be interrupted
    setTimeout(()=> saveEdit(taskEl, e.target.value.trim()), 100);
  }
});

/* --------------------------
   Add task
---------------------------*/
formAdd.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = inputText.value.trim();
  if(!text) return;
  const tags = parseTags(inputTags.value);
  const priority = selectPriority.value;
  const newTask = {
    id: Date.now(),
    text,
    tags,
    priority,
    done:false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  saveTasks();
  // render minimal: append element
  todoList.appendChild(createTaskElement(newTask));
  renderAll();
  formAdd.reset();
});

/* Clear form helper */
btnClear.addEventListener('click', ()=> formAdd.reset());

/* --------------------------
   CRUD helpers
---------------------------*/
function removeTask(id){
  tasks = tasks.filter(t=>t.id!==id);
  document.querySelector(`.task[data-id="${id}"]`)?.remove();
  saveTasks();
  renderAll();
}

function toggleDone(id, value){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  t.done = value;
  saveTasks();
  renderAll();
}

/* Editing helpers */
function toggleEditing(taskEl){
  const id = Number(taskEl.dataset.id);
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  if(taskEl.classList.contains('editing')){
    // save
    const input = taskEl.querySelector('.title-edit');
    saveEdit(taskEl, input.value.trim());
  } else {
    taskEl.classList.add('editing');
    const input = taskEl.querySelector('.title-edit');
    input.focus();
    input.select();
  }
}
function saveEdit(taskEl, value){
  if(!taskEl) return;
  const id = Number(taskEl.dataset.id);
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  if(!value){
    // if empty, cancel and restore
    taskEl.classList.remove('editing');
    taskEl.querySelector('.title-edit').value = t.text;
    return;
  }
  if(t.text !== value){
    t.text = value;
    saveTasks();
  }
  taskEl.classList.remove('editing');
  renderAll();
}
function cancelEdit(taskEl){
  if(!taskEl) return;
  taskEl.classList.remove('editing');
  const id = Number(taskEl.dataset.id);
  const t = tasks.find(x=>x.id===id);
  taskEl.querySelector('.title-edit').value = t.text;
}

/* --------------------------
   Drag & Drop (delegated using container events)
   - uses dataset.id on .task
---------------------------*/
todoList.addEventListener('dragstart', (e)=>{
  const task = e.target.closest('.task');
  if(!task) return;
  dragSrcId = task.dataset.id;
  task.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', dragSrcId); } catch(e){}
});

todoList.addEventListener('dragend', (e)=>{
  todoList.querySelectorAll('.task').forEach(el=>el.classList.remove('dragging'));
  // clean placeholders
  todoList.querySelectorAll('.placeholder').forEach(p=>p.remove());
  dragSrcId = null;
  saveTasks();
  renderAll();
});

todoList.addEventListener('dragover', (e)=>{
  e.preventDefault();
  const over = e.target.closest('.task');
  // show placeholder where to drop
  todoList.querySelectorAll('.placeholder').forEach(p=>p.remove());
  const placeholder = document.createElement('div');
  placeholder.className='placeholder';
  if(!over){
    // append at end
    todoList.appendChild(placeholder);
  } else {
    // insert before or after depending mouse position
    const rect = over.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height/2;
    if(after) over.after(placeholder); else over.before(placeholder);
  }
});

todoList.addEventListener('drop', (e)=>{
  e.preventDefault();
  const dst = e.target.closest('.task');
  const srcId = e.dataTransfer.getData('text/plain') || dragSrcId;
  if(!srcId) return;
  // get destination index by reading current DOM order (excluding placeholder)
  const ids = Array.from(todoList.querySelectorAll('.task')).map(el=>Number(el.dataset.id));
  // if placeholder exists, compute new order by placing src where placeholder is
  const placeholder = todoList.querySelector('.placeholder');
  let newOrderIds;
  if(placeholder){
    const children = Array.from(todoList.childNodes).filter(n=>n.nodeType===1); // elements
    newOrderIds = children.map(n=> n.classList.contains('task') ? Number(n.dataset.id) : (n===placeholder ? Number(srcId) : null))
                          .filter(x=>x!==null);
  } else {
    newOrderIds = ids;
  }
  // rearrange tasks array according to newOrderIds
  const srcIdx = tasks.findIndex(t=>t.id===Number(srcId));
  const srcTask = tasks.splice(srcIdx,1)[0];
  // build new array using newOrderIds: replace srcId placeholder with srcTask if missing
  const newTasks = [];
  newOrderIds.forEach(id=>{
    if(id===Number(srcId)) newTasks.push(srcTask);
    else{
      const t = tasks.find(tt=>tt.id===id);
      if(t) newTasks.push(t);
    }
  });
  // if some tasks omitted (shouldn't) append them
  tasks.forEach(t=>{ if(!newTasks.includes(t)) newTasks.push(t) });
  tasks = newTasks;
  // cleanup placeholder (will be removed by render)
  saveTasks();
  renderAll();
});

/* --------------------------
   SEARCH (debounced)
---------------------------*/
searchInput.addEventListener('input', ()=>{
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(()=> {
    renderTasks();
  }, 180);
});

/* --------------------------
   EXPORT / IMPORT JSON & CSV
---------------------------*/
btnExportJSON.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
  downloadBlob(blob, `tareas_${new Date().toISOString().slice(0,19)}.json`);
});

btnExportCSV.addEventListener('click', ()=>{
  const csv = tasksToCSV(tasks);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  downloadBlob(blob, `tareas_${new Date().toISOString().slice(0,19)}.csv`);
});

$('#btn-import-json').addEventListener('click', ()=> importJsonInput.click());
importJsonInput.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data)){
        // merge: keep existing and add new unique ids
        const incoming = data.map(d=>({ ...d, id: d.id || Date.now()+Math.random() }));
        tasks = tasks.concat(incoming);
        saveTasks();
        renderAll();
        alert('Importado con éxito');
      } else alert('JSON inválido');
    }catch(err){ alert('Error parseando JSON'); }
  };
  reader.readAsText(file);
  importJsonInput.value = '';
});

/* --------------------------
   THEME
---------------------------*/
btnDark.addEventListener('click', ()=>{
  const cur = document.body.dataset.theme;
  const next = cur === 'light' ? 'dark' : 'light';
  document.body.dataset.theme = next;
  btnDark.textContent = next==='light' ? '🌙' : '☀️';
});

/* --------------------------
   UTILS
---------------------------*/
function parseTags(raw){
  if(!raw) return [];
  return raw.split(',').map(s=>s.trim()).filter(Boolean).slice(0,6);
}
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

function downloadBlob(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function tasksToCSV(arr){
  const header = ['id','texto','tags','priority','done','createdAt'];
  const rows = arr.map(t => [
    t.id,
    `"${(t.text||'').replace(/"/g,'""')}"`,
    `"${(t.tags||[]).join(';')}"`,
    t.priority||'normal',
    t.done ? '1' : '0',
    t.createdAt||''
  ].join(','));
  return [header.join(','), ...rows].join('\n');
}

/* --------------------------
   UTIL: render minimal initial UI
---------------------------*/
function initialRenderPlaceholder(){
  // show empty or render tasks existing
  renderAll();
}
initialRenderPlaceholder();