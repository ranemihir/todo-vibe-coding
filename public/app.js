const API = {
  list: () => fetch('/api/todos').then(r => r.json()),
  add: (text) => fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).then(r => r.json()),
  update: (id, patch) => fetch(`/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(r => r.json()),
  remove: (id) => fetch(`/api/todos/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

const state = {
  todos: [],
  showCompleted: true,
};

const els = {
  form: document.getElementById('add-form'),
  input: document.getElementById('new-todo'),
  list: document.getElementById('todo-list'),
  count: document.getElementById('count'),
  showCompleted: document.getElementById('show-completed'),
  clearCompleted: document.getElementById('clear-completed'),
};

function escapeHtml(str) {
  return str.replace(/[&<>"]+/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s]));
}

function render() {
  const items = state.todos.filter(t => state.showCompleted || !t.completed);
  els.list.innerHTML = '';

  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No items';
    els.list.appendChild(li);
  } else {
    for (const t of items) {
      const li = document.createElement('li');
      li.className = 'todo' + (t.completed ? ' completed' : '');
      li.dataset.id = t.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = t.completed;
      cb.addEventListener('change', async () => {
        const updated = await API.update(t.id, { completed: cb.checked });
        const idx = state.todos.findIndex(x => x.id === t.id);
        if (idx !== -1) state.todos[idx] = updated;
        render();
      });

      const label = document.createElement('label');
      label.appendChild(cb);

      const textSpan = document.createElement('span');
      textSpan.className = 'text';
      textSpan.textContent = t.text;
      textSpan.title = 'Click to edit';
      label.appendChild(textSpan);

      // Inline editing
      label.addEventListener('dblclick', () => startEdit(li, t));

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => startEdit(li, t));

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        await API.remove(t.id);
        state.todos = state.todos.filter(x => x.id !== t.id);
        render();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(label);
      li.appendChild(actions);
      els.list.appendChild(li);
    }
  }

  const activeCount = state.todos.filter(t => !t.completed).length;
  els.count.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
}

function startEdit(li, todo) {
  if (!li || !todo) return;
  li.innerHTML = '';
  li.classList.remove('completed');
  li.classList.add('todo');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = todo.completed;
  cb.disabled = true;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = todo.text;
  input.autofocus = true;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'icon-btn';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'icon-btn';
  cancelBtn.textContent = 'Cancel';

  const formSubmit = async () => {
    const text = input.value.trim();
    if (!text) return cancelEdit();
    const updated = await API.update(todo.id, { text });
    const idx = state.todos.findIndex(x => x.id === todo.id);
    if (idx !== -1) state.todos[idx] = updated;
    render();
  };

  const cancelEdit = () => render();

  saveBtn.addEventListener('click', formSubmit);
  cancelBtn.addEventListener('click', cancelEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') formSubmit();
    if (e.key === 'Escape') cancelEdit();
  });

  li.appendChild(cb);
  li.appendChild(input);
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  li.appendChild(actions);

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

async function bootstrap() {
  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    const created = await API.add(text);
    state.todos.unshift(created);
    els.input.value = '';
    render();
  });

  els.showCompleted.addEventListener('change', () => {
    state.showCompleted = els.showCompleted.checked;
    render();
  });

  els.clearCompleted.addEventListener('click', async () => {
    const completed = state.todos.filter(t => t.completed);
    for (const t of completed) {
      await API.remove(t.id);
    }
    state.todos = state.todos.filter(t => !t.completed);
    render();
  });

  state.todos = await API.list();
  render();
}

bootstrap();
