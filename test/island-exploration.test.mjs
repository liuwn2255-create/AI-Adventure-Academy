import test from 'node:test';
import assert from 'node:assert/strict';
import { awardMissionsForEvent, getMissionBadgeTotal, MISSION_EVENTS } from '../prototype/missions.js';
import {
  createExplorerPosition,
  EXPLORER_BOUNDS,
  EXPLORER_MOVE_STEP,
  getNearbyObject,
  INTERACTION_RADIUS,
  interactWithObject,
  ISLAND_OBJECTS,
  moveExplorer,
} from '../prototype/islandExploration.js';

test('default walking movement is 30 percent slower while object interaction radius is unchanged', () => {
  assert.equal(EXPLORER_MOVE_STEP, 4.2);
  assert.ok(Math.abs(EXPLORER_MOVE_STEP / 6 - 0.7) < 1e-12);
  assert.equal(INTERACTION_RADIUS, 17);
  const moved = moveExplorer(createExplorerPosition(), 'up');
  assert.ok(Math.abs(createExplorerPosition().y - moved.y - EXPLORER_MOVE_STEP) < 1e-12);
});

test('探險家移動會限制在場景邊界內', () => {
  const right = moveExplorer({ x: 90, y: 50 }, 'right', 12);
  const up = moveExplorer({ x: 50, y: 13 }, 'up', 12);
  assert.equal(right.x, EXPLORER_BOUNDS.maxX);
  assert.equal(up.y, EXPLORER_BOUNDS.minY);
  for (const direction of ['up', 'down', 'left', 'right']) {
    const moved = moveExplorer(createExplorerPosition(), direction);
    assert.ok(moved.x >= EXPLORER_BOUNDS.minX && moved.x <= EXPLORER_BOUNDS.maxX);
    assert.ok(moved.y >= EXPLORER_BOUNDS.minY && moved.y <= EXPLORER_BOUNDS.maxY);
  }
});

test('未靠近場景物件不能互動，靠近後可互動', () => {
  const stone = ISLAND_OBJECTS.find((object) => object.id === 'number-obelisk');
  const start = createExplorerPosition();
  assert.equal(getNearbyObject(start)?.id, undefined);
  assert.equal(interactWithObject(start, stone).reason, 'too_far');
  let near = start;
  for (let index = 0; index < 4; index += 1) near = moveExplorer(near, 'left');
  for (let index = 0; index < 3; index += 1) near = moveExplorer(near, 'up');
  assert.equal(getNearbyObject(near)?.id, stone.id);
  assert.equal(interactWithObject(near, stone).ok, true);
});

test('只有實際靠近並互動數字石碑後才完成探索任務，重複互動不重複領章', () => {
  const stone = ISLAND_OBJECTS.find((object) => object.id === 'number-obelisk');
  const farInteraction = interactWithObject(createExplorerPosition(), stone);
  const before = awardMissionsForEvent([], MISSION_EVENTS.FIND_NUMBER_OBELISK, {
    objectId: stone.id,
    nearby: farInteraction.ok,
  });
  assert.equal(before.awardedBadges, 0);

  let near = createExplorerPosition();
  for (let index = 0; index < 4; index += 1) near = moveExplorer(near, 'left');
  for (let index = 0; index < 3; index += 1) near = moveExplorer(near, 'up');
  const interaction = interactWithObject(near, stone);
  const found = awardMissionsForEvent([], MISSION_EVENTS.FIND_NUMBER_OBELISK, {
    objectId: interaction.objectId,
    nearby: interaction.ok,
  });
  const replay = awardMissionsForEvent(found.completedMissionIds, MISSION_EVENTS.FIND_NUMBER_OBELISK, {
    objectId: interaction.objectId,
    nearby: interaction.ok,
  });
  assert.equal(found.awardedBadges, 1);
  assert.equal(replay.awardedBadges, 0);
  assert.equal(getMissionBadgeTotal(replay.completedMissionIds), 1);
});
