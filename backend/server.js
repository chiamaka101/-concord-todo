const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

let todos = [];
let id = 1;

// Load saved todos on startup
try {
  if (fs.existsSync('todos.json')) {
    const data = JSON.parse(fs.readFileSync('todos.json', 'utf8'));
    todos = data.todos || [];
    id = data.nextId || 1;
    if (todos.length > 0) id = Math.max(...todos.map(t => t.id)) + 1;
    // Give old todos a category if they don't have one
    todos.forEach(t => { if (!t.category) t.category = 'Personal'; });
  }
} catch (e) { console.log('No saved file, starting fresh'); }

function saveTodos() {
  fs.writeFileSync('todos.json', JSON.stringify({ todos, nextId: id }, null, 2));
}

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

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));