// ---------- Supabase クライアント（index.html で window.supabase に注入済み） ----------
const db = window.supabase;

// ---------- DOM ----------
const $form = document.getElementById("todo-form");
const $input = document.getElementById("todo-input");
const $list = document.getElementById("todo-list");
const $filter = document.getElementById("filter");
const $clearCompleted = document.getElementById("clear-completed");
const $leftCount = document.getElementById("left-count");

// ---------- state ----------
let todos = [];
let currentFilter = "all"; // all | active | completed

// ---------- helpers ----------
function byFilter(t) {
  if (currentFilter === "active") return !t.completed;
  if (currentFilter === "completed") return t.completed;
  return true;
}

function render() {
  const filtered = todos.filter(byFilter);
  $list.innerHTML = "";
  for (const t of filtered) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = t.id;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.completed;
    cb.addEventListener("change", () => toggle(t.id, !t.completed));

    const title = document.createElement("div");
    title.className = "todo-title" + (t.completed ? " completed" : "");
    title.textContent = t.title;
    title.contentEditable = "true";
    title.spellcheck = false;
    title.addEventListener("blur", () => {
      const next = title.textContent.trim();
      if (!next) return remove(t.id);
      if (next !== t.title) updateTitle(t.id, next);
    });

    const del = document.createElement("button");
    del.className = "icon-btn";
    del.title = "削除";
    del.textContent = "✕";
    del.addEventListener("click", () => remove(t.id));

    li.append(cb, title, del);
    $list.appendChild(li);
  }

  const left = todos.filter((t) => !t.completed).length;
  $leftCount.textContent = `未完了: ${left} 件`;
}

// ---------- CRUD ----------
async function fetchTodos() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    alert("読み込みに失敗しました");
    return;
  }
  todos = data;
  render();
}

async function add(title) {
  const clean = title.trim();
  if (!clean) return;
  const { error } = await db.from("todos").insert({ title: clean, completed: false });
  if (error) {
    console.error(error);
    alert("追加に失敗しました");
    return;
  }
  await fetchTodos();
}

async function toggle(id, completed) {
  const { error } = await db.from("todos").update({ completed }).eq("id", id);
  if (error) {
    console.error(error);
    alert("更新に失敗しました");
    return;
  }
  // ローカル反映の即時性を高めるなら下記2行でもOK（最終的に再取得）
  // todos = todos.map(t => t.id === id ? { ...t, completed } : t);
  // render();
  await fetchTodos();
}

async function updateTitle(id, title) {
  const { error } = await db.from("todos").update({ title }).eq("id", id);
  if (error) {
    console.error(error);
    alert("更新に失敗しました");
    return;
  }
  await fetchTodos();
}

async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("削除に失敗しました");
    return;
  }
  await fetchTodos();
}

async function clearCompleted() {
  const { error } = await db.from("todos").delete().eq("completed", true);
  if (error) {
    console.error(error);
    alert("一括削除に失敗しました");
    return;
  }
  await fetchTodos();
}

// ---------- events ----------
$form.addEventListener("submit", (e) => {
  e.preventDefault();
  add($input.value);
  $input.value = "";
  $input.focus();
});
$filter.addEventListener("change", (e) => {
  currentFilter = e.target.value;
  render();
});
$clearCompleted.addEventListener("click", clearCompleted);

// 初回読み込み
fetchTodos();
