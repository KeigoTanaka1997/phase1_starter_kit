// ----- Supabase client -----
const db = window.supabase;

// ----- DOM -----
const $form = document.getElementById("todo-form");
const $input = document.getElementById("todo-input");
const $list = document.getElementById("todo-list");
const $filter = document.getElementById("filter");
const $clearCompleted = document.getElementById("clear-completed");
const $leftCount = document.getElementById("left-count");

const $email = document.getElementById("email");
const $signin = document.getElementById("signin");
const $signout = document.getElementById("signout");
const $whoami = document.getElementById("whoami");
const $secOut = document.getElementById("auth-when-signed-out");
const $secIn  = document.getElementById("auth-when-signed-in");

// ----- state -----
let todos = [];
let currentFilter = "all"; // all | active | completed
let session = null;

// ----- helpers -----
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

function requireLogin() {
  if (!session?.user) {
    alert("先にログインしてください（メールでログインボタン）");
    return false;
  }
  return true;
}

// ----- CRUD (RLSにより自分のレコードのみ) -----
async function fetchTodos() {
  if (!requireLogin()) return;
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); alert("読み込みに失敗しました"); return; }
  todos = data;
  render();
}

async function add(title) {
  if (!requireLogin()) return;
  const clean = title.trim();
  if (!clean) return;
  // user_id は DB 側の default auth.uid() が自動で入れてくれる
  const { error } = await db.from("todos").insert({ title: clean, completed: false });
  if (error) { console.error(error); alert("追加に失敗しました"); return; }
  await fetchTodos();
}

async function toggle(id, completed) {
  if (!requireLogin()) return;
  const { error } = await db.from("todos").update({ completed }).eq("id", id);
  if (error) { console.error(error); alert("更新に失敗しました"); return; }
  await fetchTodos();
}

async function updateTitle(id, title) {
  if (!requireLogin()) return;
  const { error } = await db.from("todos").update({ title }).eq("id", id);
  if (error) { console.error(error); alert("更新に失敗しました"); return; }
  await fetchTodos();
}

async function remove(id) {
  if (!requireLogin()) return;
  const { error } = await db.from("todos").delete().eq("id", id);
  if (error) { console.error(error); alert("削除に失敗しました"); return; }
  await fetchTodos();
}

async function clearCompleted() {
  if (!requireLogin()) return;
  const { error } = await db.from("todos").delete().eq("completed", true);
  if (error) { console.error(error); alert("一括削除に失敗しました"); return; }
  await fetchTodos();
}

// ----- auth ui -----
function renderAuth() {
  const user = session?.user || null;
  if (user) {
    $secOut.style.display = "none";
    $secIn.style.display = "flex";
    $whoami.textContent = `Logged in: ${user.email ?? user.id}`;
  } else {
    $secOut.style.display = "flex";
    $secIn.style.display = "none";
    $whoami.textContent = "";
  }
}

$signin?.addEventListener("click", async () => {
  const email = ($email.value || "").trim();
  if (!email) return alert("メールアドレスを入力してください");
  // マジックリンク（または6桁コード）を送る
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) { console.error(error); alert("メール送信に失敗しました"); return; }
  alert("ログイン用のメールを送りました。受信ボックスを確認してください。");
});

$signout?.addEventListener("click", async () => {
  await db.auth.signOut();
});

// 初期セッション取得 & 変更監視
(async () => {
  const { data: { session: s } } = await db.auth.getSession();
  session = s;
  renderAuth();
  if (session?.user) await fetchTodos();

  db.auth.onAuthStateChange(async (_event, s2) => {
    session = s2;
    renderAuth();
    if (session?.user) await fetchTodos();
    else { todos = []; render(); }
  });
})();

// ----- events (todo ui) -----
$form.addEventListener("submit", (e) => {
  e.preventDefault();
  add($input.value);
  $input.value = "";
  $input.focus();
});
$filter.addEventListener("change", (e) => { currentFilter = e.target.value; render(); });
$clearCompleted.addEventListener("click", clearCompleted);
