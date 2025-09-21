const btn = document.getElementById('toggleBtn');
const msg = document.getElementById('message');
let toggled = false;

btn.addEventListener('click', () => {
  toggled = !toggled;
  msg.textContent = toggled ? 'AIと一緒に開発しよう！' : 'ボタンを押すとこのメッセージが変わります。';
});