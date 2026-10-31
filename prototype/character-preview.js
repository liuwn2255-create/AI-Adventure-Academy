import { createExplorerCharacter3D } from './explorerCharacter3d.js';

const status = document.getElementById('status');
const fallback = document.getElementById('fallback');
let character;

try {
  character = createExplorerCharacter3D(document.getElementById('preview'), {
    onLoaded: ({ clips, height }) => {
      fallback.hidden = true;
      status.textContent = `模型載入完成；原始高度約 ${height.toFixed(2)} 單位。動畫：${clips.join('、') || '無'}`;
      character.setActive(true);
    },
    onError: (error) => {
      status.classList.add('error');
      status.textContent = `模型載入失敗：${error.message}`;
      fallback.hidden = false;
      fallback.textContent = '目前無法顯示 GLB，請檢查模型與伺服器回應。';
    },
  });
  await character.ready;
} catch (error) {
  status.classList.add('error');
  status.textContent = `預覽無法啟動：${error?.message || '發生未知錯誤'}`;
  fallback.hidden = false;
  fallback.textContent = '角色預覽目前無法啟動，請查看狀態訊息。';
}

document.querySelectorAll('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    character?.face(button.dataset.direction);
    status.textContent = `目前朝向：${button.textContent}。`;
  });
});

document.querySelectorAll('[data-motion]').forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.motion;
    if (mode === 'stop') {
      character?.stop();
      status.textContent = '角色已停止，回到靜止姿勢（GLB 沒有 Idle 動畫）。';
      return;
    }
    const started = character?.move('down', mode);
    status.textContent = started
      ? `正在播放：${mode === 'run' ? 'Running' : 'Walking'}。`
      : `模型不含 ${mode === 'run' ? 'Running' : 'Walking'} 動畫。`;
  });
});

window.addEventListener('pagehide', () => character?.dispose(), { once: true });
