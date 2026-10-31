import test from 'node:test';
import assert from 'node:assert/strict';
import { open, readFile, stat } from 'node:fs/promises';
import { EXPLORER_FACING_YAW, EXPLORER_LOCOMOTION_TIME_SCALE, EXPLORER_MODEL_FORWARD_YAW_OFFSET, findLocomotionClip, getExplorerFacingYaw } from '../prototype/explorerCharacter3d.js';

const modelPath = new URL('../prototype/assets/characters/Meshy_AI_First_Day_Smiles_All_Animations.glb', import.meta.url);

async function readGlbJson() {
  const file = await open(modelPath, 'r');
  try {
    const header = Buffer.alloc(20);
    await file.read(header, 0, header.length, 0);
    assert.equal(header.toString('ascii', 0, 4), 'glTF', 'GLB magic header');
    assert.equal(header.readUInt32LE(4), 2, 'glTF 2.0 version');
    assert.equal(header.readUInt32LE(16), 0x4e4f534a, 'JSON chunk type');
    const jsonLength = header.readUInt32LE(12);
    const jsonBuffer = Buffer.alloc(jsonLength);
    await file.read(jsonBuffer, 0, jsonLength, 20);
    return JSON.parse(jsonBuffer.toString('utf8'));
  } finally {
    await file.close();
  }
}

test('the imported character is a valid glTF 2.0 binary file', async () => {
  const fileStat = await stat(modelPath);
  const file = await open(modelPath, 'r');
  try {
    const header = Buffer.alloc(12);
    await file.read(header, 0, header.length, 0);
    assert.equal(header.toString('ascii', 0, 4), 'glTF');
    assert.equal(header.readUInt32LE(4), 2);
    assert.equal(header.readUInt32LE(8), fileStat.size);
  } finally {
    await file.close();
  }
});

test('the imported character contains a skinned mesh with joint and weight data', async () => {
  const gltf = await readGlbJson();
  assert.ok(gltf.skins?.length > 0);
  assert.ok(gltf.skins[0].joints.length > 0);
  const skinnedNode = gltf.nodes.find((node) => Number.isInteger(node.skin) && Number.isInteger(node.mesh));
  assert.ok(skinnedNode, 'a mesh node references a skin');
  const primitive = gltf.meshes[skinnedNode.mesh].primitives[0];
  assert.ok(primitive.attributes.JOINTS_0 !== undefined);
  assert.ok(primitive.attributes.WEIGHTS_0 !== undefined);
});

test('walking and running are independently available; no idle clip is assumed', async () => {
  const gltf = await readGlbJson();
  assert.deepEqual(gltf.animations.map((clip) => clip.name), ['Running', 'Walking']);
  assert.equal(findLocomotionClip(gltf.animations, 'walk').name, 'Walking');
  assert.equal(findLocomotionClip(gltf.animations, 'run').name, 'Running');
  assert.equal(findLocomotionClip(gltf.animations, 'idle'), null);
});

test('all animation channels point to existing nodes and use supported transform paths', async () => {
  const gltf = await readGlbJson();
  for (const clip of gltf.animations) {
    assert.ok(clip.channels.length > 0, `${clip.name} has animation channels`);
    for (const channel of clip.channels) {
      assert.ok(gltf.nodes[channel.target.node], `${clip.name} target node exists`);
      assert.ok(['translation', 'rotation', 'scale', 'weights'].includes(channel.target.path));
      assert.ok(clip.samplers[channel.sampler]);
    }
  }
});

test('the four exploration directions map to the corrected GLB forward orientation', () => {
  assert.deepEqual(Object.keys(EXPLORER_FACING_YAW).sort(), ['down', 'left', 'right', 'up']);
  assert.equal(new Set(Object.values(EXPLORER_FACING_YAW)).size, 4);
  assert.equal(EXPLORER_MODEL_FORWARD_YAW_OFFSET, Math.PI);
  assert.equal(EXPLORER_FACING_YAW.up, Math.PI);
  assert.equal(EXPLORER_FACING_YAW.down, Math.PI * 2);
  assert.equal(EXPLORER_FACING_YAW.right, Math.PI / 2);
  assert.equal(EXPLORER_FACING_YAW.left, Math.PI * 1.5);
  for (const [direction, expected] of Object.entries(EXPLORER_FACING_YAW)) {
    assert.equal(getExplorerFacingYaw(direction), expected);
    assert.equal(getExplorerFacingYaw(direction, 0.25), expected + 0.25);
  }
  assert.equal(EXPLORER_LOCOMOTION_TIME_SCALE.walk, 0.7);
  assert.equal(EXPLORER_LOCOMOTION_TIME_SCALE.run, 1);
});

test('the main exploration scene mounts the 3D character in the existing movable avatar host', async () => {
  const [app, html] = await Promise.all([
    readFile(new URL('../prototype/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../prototype/index.html', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(app, /import\s*\{\s*createExplorerCharacter3D\s*\}\s*from\s*['"]\.\/explorerCharacter3d\.js['"]/);
  assert.match(app, /import\(['"]\.\/explorerCharacter3d\.js['"]\)/);
  assert.match(app, /function ensureExplorerCharacter\(\)/);
  assert.match(app, /if\s*\(explorerCharacterLoad\)\s*return explorerCharacterLoad/);
  assert.match(app, /explorerCharacter\.move\(direction,\s*'walk'\)/);
  assert.match(app, /explorerCharacter\?\.setActive\(name === 'explore'\)/);
  assert.match(app, /moveExplorer\(explorerPosition, direction\)/);
  assert.match(html, /<script\s+type="importmap">\s*\{\s*"imports"\s*:\s*\{\s*"three"\s*:/);
  assert.match(html, /id="explorer-avatar"[^>]*>[\s\S]*id="explorer-avatar-fallback"/);
  assert.doesNotMatch(html, /id="explorer-avatar"[^>]*>\s*<span[^>]*>🧭/);
});

test('the browser Three.js module dependency graph includes its split core and mapped bare specifier', async () => {
  const vendorRoot = new URL('../prototype/vendor/', import.meta.url);
  const [threeModule, threeCore, loader, html] = await Promise.all([
    readFile(new URL('three.module.js', vendorRoot), 'utf8'),
    readFile(new URL('three.core.js', vendorRoot), 'utf8'),
    readFile(new URL('loaders/GLTFLoader.js', vendorRoot), 'utf8'),
    readFile(new URL('../prototype/index.html', import.meta.url), 'utf8'),
  ]);
  assert.match(threeModule, /from\s+['"]\.\/three\.core\.js['"]/);
  assert.match(threeCore, /const REVISION = '186'/);
  assert.match(loader, /from\s+['"]three['"]/);
  assert.match(loader, /from\s+['"]\.\.\/utils\/BufferGeometryUtils\.js['"]/);
  assert.match(loader, /from\s+['"]\.\.\/utils\/SkeletonUtils\.js['"]/);
  assert.match(html, /"three"\s*:\s*"\.\/vendor\/three\.module\.js"/);
});

test('the home start handler is registered before initial screen rendering and is independent of 3D loading', async () => {
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  const startHandler = app.indexOf("document.getElementById('start-button').addEventListener");
  const firstInitialRender = app.indexOf('renderMapProgress();');
  assert.ok(startHandler >= 0);
  assert.ok(firstInitialRender >= 0);
  assert.ok(startHandler < firstInitialRender, 'the home button is bound before initial rendering');
  assert.ok(startHandler < app.indexOf("import('./explorerCharacter3d.js')"), '3D import only occurs later when entering exploration');
  assert.match(app, /3D 角色載入失敗，仍可繼續探索/);
});

test('the main-game avatar host has a readable load failure fallback without replacing exploration controls', async () => {
  const [app, html] = await Promise.all([
    readFile(new URL('../prototype/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../prototype/index.html', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /3D 角色載入失敗，仍可繼續探索/);
  assert.match(html, /id="interact-button"/);
  assert.match(html, /data-move="up"/);
  assert.match(html, /data-move="left"/);
  assert.match(html, /data-move="down"/);
  assert.match(html, /data-move="right"/);
});
