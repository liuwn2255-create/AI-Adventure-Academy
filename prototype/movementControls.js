export const MOVEMENT_KEYS = Object.freeze({
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
});

export function createMovementHoldController(move, {
  intervalMs = 140,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
} = {}) {
  let timer = null;
  let direction = null;
  let timerGeneration = 0;

  const stop = () => {
    timerGeneration += 1;
    if (timer !== null) clearIntervalFn(timer);
    timer = null;
    direction = null;
  };

  return Object.freeze({
    start(nextDirection) {
      stop();
      direction = nextDirection;
      const generation = timerGeneration;
      move(nextDirection);
      timer = setIntervalFn(() => {
        if (generation === timerGeneration && direction === nextDirection) move(nextDirection);
      }, intervalMs);
    },
    stop,
    isMoving() { return direction !== null; },
  });
}
