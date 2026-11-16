const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'todos.json');

let todos = [];
let id = 1;

// Load saved todos on startup
try {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    todos = data.todos || [];
    id = data.nextId || 1;
    if (todos.length > 0) id = Math.max(...todos.map(t => t.id)) + 1;
    // Give old todos a category if they don't have one
    todos.forEach(t => { if (!t.category) t.category = 'Personal'; });
  }
} catch (e) { console.log('No saved file, starting fresh'); }

function saveTodos() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ todos, nextId: id }, null, 2));
  } catch (e) {
    // On Vercel the filesystem is read-only / ephemeral, so saving will fail.
    // Don't crash the request - todos still work in memory for this session.
    console.log('Could not save to file (expected on Vercel):', e.message);
  }
}

// Health check - fixes your GET / 404
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'todo-backend' });
});

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { text, dueDate, category } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const todo = { id: id++, text, done: false, dueDate: dueDate || null, category: category || 'Personal' };
  todos.push(todo);
  saveTodos();
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id == req.params.id);
  if (!todo) return res.status(404).json({ error: 'Not found' });
  if (req.body.done !== undefined) {
    todo.done = req.body.done;
  } else if (req.body.dueDate === undefined && req.body.text === undefined && req.body.category === undefined) {
    todo.done = !todo.done;
  }
  if (req.body.dueDate !== undefined) todo.dueDate = req.body.dueDate;
  if (req.body.text !== undefined) todo.text = req.body.text;
  if (req.body.category !== undefined) todo.category = req.body.category;
  saveTodos();
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  todos = todos.filter(t => t.id != req.params.id);
  saveTodos();
  res.json({ success: true });
});

module.exports = app;

// Only listen when running locally - Vercel uses the exported app
if (require.main === module) {
  app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
}