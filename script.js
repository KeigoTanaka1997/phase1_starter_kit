// ----- storage -----
const STORAGE_KEY = "todos:v1";
const load = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// ----- state -----
let todos = load(); // [{id, title, completed}]
let currentFilter = "all"; // all | active | completed

// ----- dom refs -----
const $form = document.getElementById("todo-form");
const $input = document.getElementById("todo-input");
const $list = document.getElementById("todo-list");
const $filter = document.getElementById("filter");
const $clearCompleted = document.getElementById("clear-completed");
const $leftCount = document.getElementById("left-count");

// ----- helpers -----
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

function render() {
  // filter
  const filtered = todos.filter((t) =>
    currentFilter === "all" ? true :
    currentFilter === "active" ? !t.completed : t.completed
  );

  // list
  $list.innerHTML = "";
  for (const t of filtered) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = t.id;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.completed;
    cb.ariaLabel = "完了切替";
    cb.addEventListener("change", () => toggle(t.id));

    const title = document.createElement("div");
    title.className = "todo-title" + (t.completed ? " completed" : "");
    title.textContent = t.title;
    title.contentEditable = "true";
    title.spellcheck = false;
    title.addEventListener("blur", () => edit(t.id, title.textContent.trim()));

    const del = document.createElement("button");
    del.className = "icon-btn";
    del.title = "削除";
    del.textContent = "✕";
    del.addEventListener("click", () => remove(t.id));

    li.append(cb, title, del);
    $list.appendChild(li);
  }

  // left count
  const left = todos.filter(t => !t.completed).length;
  $leftCount.textContent = `未完了: ${left} 件`;
}

function add(title) {
  const clean = title.trim();
  if (!clean) return;
  todos.unshift({ id: uid(), title: clean, completed: false });
  save(todos);
  render();
}

function toggle(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  save(todos);
  render();
}

function edit(id, nextTitle) {
  const title = (nextTitle || "").trim();
  if (!title) { remove(id); return; }
  todos = todos.map(t => t.id === id ? { ...t, title } : t);
  save(todos);
  render();
}

function remove(id) {
  todos = todos.filter(t => t.id !== id);
  save(todos);
  render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  save(todos);
  render();
}

// ----- events -----
$form.addEventListener("submit", (e) => {
  e.preventDefault();
  add($input.value);
  $input.value = "";
  $input.focus();
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    add($input.value);
    $input.value = "";
  }
});

$filter.addEventListener("change", (e) => {
  currentFilter = e.target.value;
  render();
});

$clearCompleted.addEventListener("click", clearCompleted);

// 初回描画
render();
