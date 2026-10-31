export const EXPLORER_BOUNDS = Object.freeze({ minX: 8, maxX: 92, minY: 12, maxY: 88 });
export const INTERACTION_RADIUS = 17;
export const EXPLORER_MOVE_STEP = 4.2;
export const ISLAND_OBJECTS = Object.freeze([
  Object.freeze({ id: 'number-obelisk', name: '數字石碑', x: 27, y: 47, kind: 'stone' }),
  Object.freeze({ id: 'treasure-chest', name: '寶箱', x: 74, y: 28, kind: 'chest' }),
  Object.freeze({ id: 'island-star-1', name: '星星收集點', x: 76, y: 76, kind: 'star' }),
]);

export function createExplorerPosition() {
  return { x: 50, y: 68 };
}

export function moveExplorer(position, direction, step = EXPLORER_MOVE_STEP) {
  const safePosition = position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? position
    : createExplorerPosition();
  const safeStep = Number.isFinite(step) ? Math.max(0, Math.min(12, step)) : 6;
  const delta = {
    up: [0, -safeStep],
    down: [0, safeStep],
    left: [-safeStep, 0],
    right: [safeStep, 0],
  }[direction] ?? [0, 0];
  return {
    x: Math.max(EXPLORER_BOUNDS.minX, Math.min(EXPLORER_BOUNDS.maxX, safePosition.x + delta[0])),
    y: Math.max(EXPLORER_BOUNDS.minY, Math.min(EXPLORER_BOUNDS.maxY, safePosition.y + delta[1])),
  };
}

export function getNearbyObject(position, objects = ISLAND_OBJECTS, radius = INTERACTION_RADIUS) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return null;
  return objects
    .map((object) => ({
      object,
      distance: Math.hypot(position.x - object.x, position.y - object.y),
    }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)[0]?.object ?? null;
}

export function interactWithObject(position, object, radius = INTERACTION_RADIUS) {
  if (!object || !Number.isFinite(object.x) || !Number.isFinite(object.y)) {
    return { ok: false, reason: 'unknown_object' };
  }
  const distance = Math.hypot(position.x - object.x, position.y - object.y);
  if (!Number.isFinite(distance) || distance > radius) {
    return { ok: false, reason: 'too_far', distance };
  }
  return { ok: true, objectId: object.id, distance };
}
