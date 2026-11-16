const API = 'https://backend-rust-kappa-28.vercel.app/api/todos';

async function loadTodos() {
  const res = await fetch(API);
  const todos = await res.json();
  const list = document.getElementById('todoList');
  list.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');
    li.innerHTML = `<span onclick="toggleTodo(${todo.id})" style="cursor:pointer">${todo.text} - [${todo.category || 'Personal'}]</span> <button onclick="deleteTodo(${todo.id})">Delete</button>`;
    list.appendChild(li);
  });
}

async function addTodo() {
  const input = document.getElementById('todoInput');
  const categoryInput = document.getElementById('categoryInput');
  const dateInput = document.getElementById('dueDateInput');
  if (!input.value.trim()) return;
  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text: input.value,
      category: categoryInput ? categoryInput.value : 'Personal',
      dueDate: dateInput ? dateInput.value : ''
    })
  });
  input.value = '';
  loadTodos();
}

async function toggleTodo(id) {
  await fetch(`${API}/${id}`, { method: 'PUT' });
  loadTodos();
}

async function deleteTodo(id) {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadTodos();
}

loadTodos();