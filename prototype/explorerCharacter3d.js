import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

// The GLB's forward axis is opposite the exploration direction convention.
// Keep movement vectors unchanged and compensate only the rendered model yaw.
export const EXPLORER_MODEL_FORWARD_YAW_OFFSET = Math.PI;
export const EXPLORER_DIRECTION_YAW = Object.freeze({
  up: 0,
  // Horizontal map movement and the model's yaw convention have opposite signs.
  right: -Math.PI / 2,
  down: Math.PI,
  left: Math.PI / 2,
});
export function getExplorerFacingYaw(direction, baseYaw = 0) {
  if (!Object.hasOwn(EXPLORER_DIRECTION_YAW, direction) || !Number.isFinite(baseYaw)) return null;
  return baseYaw + EXPLORER_FACING_YAW[direction];
}
export const EXPLORER_FACING_YAW = Object.freeze(Object.fromEntries(
  Object.entries(EXPLORER_DIRECTION_YAW).map(([direction, yaw]) => [direction, yaw + EXPLORER_MODEL_FORWARD_YAW_OFFSET]),
));
export const EXPLORER_LOCOMOTION_TIME_SCALE = Object.freeze({ walk: 0.7, run: 1 });

export function findLocomotionClip(animations, mode = 'walk') {
  if (!['walk', 'run'].includes(mode)) return null;
  const requested = mode === 'run' ? 'running' : 'walking';
  return animations.find((clip) => clip.name?.toLowerCase() === requested) ?? null;
}

export function createExplorerCharacter3D(container, {
  modelUrl = './assets/characters/Meshy_AI_First_Day_Smiles_All_Animations.glb',
  onLoaded = () => {},
  onError = () => {},
  maxPixelRatio = 2,
} = {}) {
  if (!container) throw new TypeError('A character container is required.');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.02, 3.65);
  camera.lookAt(0, 0.82, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    onError(error);
    throw error;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'explorer-character-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x73908c, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(-2, 4, 5);
  scene.add(keyLight);

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();
  let model = null;
  let mixer = null;
  let activeAction = null;
  let frameId = null;
  let stopped = false;
  let visible = false;
  let resizeObserver = null;
  let baseYaw = 0;
  let loadedClips = [];

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const renderFrame = () => {
    if (stopped || !visible) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    mixer?.update(delta);
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(renderFrame);
  };

  const stopFrame = () => {
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null;
  };

  const controller = {
    ready: null,
    clips: loadedClips,
    setActive(isActive) {
      visible = Boolean(isActive);
      if (visible) {
        resize();
        clock.getDelta();
        if (frameId === null) frameId = window.requestAnimationFrame(renderFrame);
      } else {
        stopFrame();
        this.stop();
      }
    },
    face(direction) {
      const facingYaw = getExplorerFacingYaw(direction, baseYaw);
      if (!model || facingYaw === null) return false;
      model.rotation.y = facingYaw;
      return true;
    },
    move(direction, mode = 'walk') {
      this.face(direction);
      if (!mixer) return false;
      const clip = findLocomotionClip(loadedClips, mode);
      if (!clip) return false;
      if (activeAction?.getClip() === clip && !activeAction.paused) return true;
      const nextAction = mixer.clipAction(clip);
      nextAction.reset().setLoop(THREE.LoopRepeat, Infinity);
      nextAction.timeScale = EXPLORER_LOCOMOTION_TIME_SCALE[mode];
      nextAction.play();
      if (activeAction) activeAction.crossFadeTo(nextAction, 0.16, false);
      activeAction = nextAction;
      return true;
    },
    stop() {
      if (activeAction) {
        activeAction.stop();
        activeAction = null;
      }
      mixer?.update(0);
    },
    setYaw(yaw) {
      if (!Number.isFinite(yaw) || !model) return false;
      baseYaw = yaw;
      model.rotation.y = yaw;
      return true;
    },
    get loaded() { return Boolean(model); },
    get animationNames() { return loadedClips.map((clip) => clip.name); },
    dispose() {
      stopped = true;
      visible = false;
      stopFrame();
      resizeObserver?.disconnect();
      mixer?.stopAllAction();
      model?.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  controller.ready = loader.loadAsync(modelUrl).then((gltf) => {
    model = gltf.scene;
    loadedClips = gltf.animations;
    controller.clips = loadedClips;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('The GLB has no measurable character height.');
    const scale = 1.65 / size.y;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    scene.add(model);
    mixer = new THREE.AnimationMixer(model);
    controller.face('down');
    resize();
    onLoaded({ clips: loadedClips.map((clip) => clip.name), height: size.y, scale });
    if (visible && frameId === null) frameId = window.requestAnimationFrame(renderFrame);
    return controller;
  }).catch((error) => {
    onError(error);
    throw error;
  });

  return controller;
}
