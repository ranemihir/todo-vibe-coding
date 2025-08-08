const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 1234;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory todo store
let todos = [];

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// API routes
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }
  const todo = { id: genId(), text: text.trim(), completed: false, createdAt: Date.now() };
  todos.unshift(todo);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body || {};
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (typeof text === 'string') todos[idx].text = text.trim();
  if (typeof completed === 'boolean') todos[idx].completed = completed;
  res.json(todos[idx]);
});

app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = todos.splice(idx, 1);
  res.json(removed);
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TODO app listening on http://localhost:${PORT}`);
});
