import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useProject } from '../../context/ProjectContext';
import { createFurniture3DMesh } from './FurnitureLibrary3D';
import { createWindow3DMesh, createDoor3DMesh } from './Window3D';
import { distance2D, angle2D, getPolygonCenter } from '../../utils/geometry';

export const Canvas3D: React.FC = () => {
  const { 
    currentProject, 
    cameraMode, 
    setCameraMode, 
    lightingMode, 
    setLightingMode, 
    showCeiling,
    setActiveView
  } = useProject();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // First-Person Walkthrough state
  const fpvPos = useRef<THREE.Vector3>(new THREE.Vector3(15, 5.5, 15));
  const fpvYaw = useRef<number>(0);
  const fpvPitch = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const cameraModeRef = useRef(cameraMode);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const [fps, setFps] = useState<number>(60);

  // Initialize Three.js Scene, Renderer & Cameras (runs on mount only)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    camera.position.set(30, 35, 45);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controlsRef.current = controls;

    // Keyboard handlers for FPV Walkthrough
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse pointer handlers for FPV look-around
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (cameraModeRef.current !== 'firstPerson') return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (cameraModeRef.current !== 'firstPerson' || !isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      fpvYaw.current -= dx * 0.0035;
      fpvPitch.current = Math.max(-1.3, Math.min(1.3, fpvPitch.current - dy * 0.0035));
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      // FPS counter
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      const currentMode = cameraModeRef.current;

      // First-Person Walkthrough Keyboard & Mouse Navigation
      if (currentMode === 'firstPerson' && cameraRef.current) {
        const isShift = keysPressed.current['shift'];
        const speed = isShift ? 0.6 : 0.32;
        const cam = cameraRef.current;

        // Q/E or Left/Right arrow keys rotate yaw smoothly
        if (keysPressed.current['q'] || keysPressed.current['arrowleft']) {
          fpvYaw.current += 0.035;
        }
        if (keysPressed.current['e'] || keysPressed.current['arrowright']) {
          fpvYaw.current -= 0.035;
        }

        const sinY = Math.sin(fpvYaw.current);
        const cosY = Math.cos(fpvYaw.current);
        const cosP = Math.cos(fpvPitch.current);
        const sinP = Math.sin(fpvPitch.current);

        // Direction facing in horizontal XZ plane
        const forwardXZ = new THREE.Vector3(-sinY, 0, -cosY);
        const rightXZ = new THREE.Vector3(cosY, 0, -sinY);

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
          fpvPos.current.addScaledVector(forwardXZ, speed);
        }
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
          fpvPos.current.addScaledVector(forwardXZ, -speed);
        }
        if (keysPressed.current['a']) {
          fpvPos.current.addScaledVector(rightXZ, -speed);
        }
        if (keysPressed.current['d']) {
          fpvPos.current.addScaledVector(rightXZ, speed);
        }

        // Lock eye level to 5.5 ft inside the house
        fpvPos.current.y = 5.5;
        cam.position.copy(fpvPos.current);

        // Compute 3D look direction using yaw and pitch
        const lookDir = new THREE.Vector3(
          -sinY * cosP,
          sinP,
          -cosY * cosP
        );
        cam.lookAt(fpvPos.current.clone().add(lookDir));
      } else if (currentMode === 'orbit360' && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 2.0;
        controlsRef.current.update();
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate(performance.now());

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Camera Target & Mode Transitions smoothly without rebuilding scene
  useEffect(() => {
    if (!currentProject || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const centerX = currentProject.plotWidth / 2;
    const centerZ = currentProject.plotLength / 2;
    const maxDim = Math.max(currentProject.plotWidth, currentProject.plotLength, 30);

    if (cameraMode === 'top') {
      camera.position.set(centerX, maxDim * 1.5, centerZ + 0.001);
      controls.target.set(centerX, 0, centerZ);
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.update();
    } else if (cameraMode === 'side') {
      camera.position.set(centerX + maxDim * 1.35, 12, centerZ);
      controls.target.set(centerX, 5, centerZ);
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.update();
    } else if (cameraMode === 'isometric') {
      camera.position.set(centerX + maxDim * 0.95, maxDim * 0.85, centerZ + maxDim * 0.95);
      controls.target.set(centerX, 3, centerZ);
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.update();
    } else if (cameraMode === 'front') {
      camera.position.set(centerX, 14, centerZ + maxDim * 1.25);
      controls.target.set(centerX, 5, centerZ);
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.update();
    } else if (cameraMode === 'perspective' || cameraMode === 'orbit360') {
      camera.position.set(centerX + maxDim * 0.65, maxDim * 0.65, centerZ + maxDim * 0.8);
      controls.target.set(centerX, 2, centerZ);
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.update();
    } else if (cameraMode === 'firstPerson') {
      // Start walkthrough inside the first room or center of house
      if (currentProject.rooms && currentProject.rooms.length > 0 && currentProject.rooms[0].polygon?.length) {
        const firstRoom = currentProject.rooms[0];
        const center = getPolygonCenter(firstRoom.polygon);
        fpvPos.current.set(center.x, 5.5, center.y);
      } else {
        fpvPos.current.set(centerX, 5.5, centerZ);
      }
      fpvYaw.current = 0;
      fpvPitch.current = 0;
      controls.enabled = false;
    }

    if (cameraMode !== 'firstPerson') {
      controls.enabled = true;
    }
  }, [cameraMode, currentProject]);

  // Rebuild 3D Scene Geometry whenever Project, Lights, or Ceilings change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !currentProject) return;

    // Clear existing objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // 1. Environment & Sky / Background Color
    if (lightingMode === 'day') {
      // Crisp daylight sky with subtle fresh architectural atmosphere
      scene.background = new THREE.Color(0xf0fdf4);
      scene.fog = new THREE.FogExp2(0xf0fdf4, 0.0015);
    } else {
      // Midnight emerald architectural glow
      scene.background = new THREE.Color(0x06281e);
      scene.fog = new THREE.FogExp2(0x06281e, 0.003);
    }

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(
      lightingMode === 'day' ? 0xf0fdf4 : 0x064e3b,
      lightingMode === 'day' ? 1.05 : 0.45
    );
    scene.add(ambientLight);

    if (lightingMode === 'day') {
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
      sunLight.position.set(60, 90, 50);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 250;
      const d = 50;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      scene.add(sunLight);

      // Subtle warm green/teal bounce fill light
      const fillLight = new THREE.DirectionalLight(0x34d399, 0.25);
      fillLight.position.set(-50, 40, -50);
      scene.add(fillLight);
    } else {
      const moonLight = new THREE.DirectionalLight(0xa7f3d0, 0.7);
      moonLight.position.set(-40, 70, -30);
      moonLight.castShadow = true;
      scene.add(moonLight);
    }

    // 3. Ground / Architectural Floor Plane & CAD Grid
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      // Lush natural lawn green for architectural daylight rendering
      color: lightingMode === 'day' ? 0x15803d : 0x064e3b,
      roughness: 0.85
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(currentProject.plotWidth / 2, -0.05, currentProject.plotLength / 2);
    ground.receiveShadow = true;
    scene.add(ground);

    // Architectural CAD Grid on ground
    const gridHelper = new THREE.GridHelper(
      200, 
      40, 
      lightingMode === 'day' ? 0x10b981 : 0x34d399, 
      lightingMode === 'day' ? 0x86efac : 0x065f46
    );
    gridHelper.position.set(currentProject.plotWidth / 2, 0, currentProject.plotLength / 2);
    scene.add(gridHelper);

    // 3.5. 2D Blueprint Projection Underlay (if uploaded & visible)
    if (currentProject.blueprintOverlay?.imageUrl && currentProject.blueprintOverlay.visible) {
      const overlay = currentProject.blueprintOverlay;
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        overlay.imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const overlayGeo = new THREE.PlaneGeometry(overlay.width, overlay.height);
          const overlayMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: Math.max(0.2, overlay.opacity || 0.65),
            depthWrite: false
          });
          const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
          overlayMesh.rotation.x = -Math.PI / 2;
          overlayMesh.position.set(
            overlay.x + overlay.width / 2,
            0.01,
            overlay.y + overlay.height / 2
          );
          scene.add(overlayMesh);
        },
        undefined,
        (err) => console.warn('Could not load 3D blueprint underlay texture', err)
      );
    }

    // 4. Build Room Floors & Indoor Lights
    currentProject.rooms.forEach(room => {
      if (!room.polygon || room.polygon.length < 3) return;

      const shape = new THREE.Shape();
      shape.moveTo(room.polygon[0].x, room.polygon[0].y);
      for (let i = 1; i < room.polygon.length; i++) {
        shape.lineTo(room.polygon[i].x, room.polygon[i].y);
      }
      shape.closePath();

      const floorGeo = new THREE.ShapeGeometry(shape);
      const floorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(room.floorColor || '#854d0e'),
        roughness: 0.5,
        side: THREE.DoubleSide
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = Math.PI / 2;
      floorMesh.position.y = 0.02;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      // Night Mode Point Lights inside each room
      if (lightingMode === 'night') {
        const center = getPolygonCenter(room.polygon);
        const roomLight = new THREE.PointLight(0xfbbf24, 1.2, 25);
        roomLight.position.set(center.x, 8.0, center.y);
        roomLight.castShadow = true;
        scene.add(roomLight);
      }

      // Optional Ceilings
      if (showCeiling) {
        const ceilMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.9,
          side: THREE.DoubleSide
        });
        const ceilMesh = new THREE.Mesh(floorGeo, ceilMat);
        ceilMesh.rotation.x = Math.PI / 2;
        ceilMesh.position.y = 9.5;
        scene.add(ceilMesh);
      }
    });

    // 5. Build 3D Walls with Physical Cutouts for Doors and Windows
    currentProject.walls.forEach(wall => {
      const wallLen = distance2D(wall.start, wall.end);
      if (wallLen < 0.1) return;
      const wallAngle = angle2D(wall.start, wall.end);
      const midX = (wall.start.x + wall.end.x) / 2;
      const midZ = (wall.start.y + wall.end.y) / 2;

      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(wall.color || '#cbd5e1'),
        roughness: 0.7
      });

      const wallGroup = new THREE.Group();
      wallGroup.position.set(midX, 0, midZ);
      wallGroup.rotation.y = -wallAngle;

      const doorsOnWall = currentProject.doors.filter(d => d.wallId === wall.id);
      const windowsOnWall = currentProject.windows.filter(w => w.wallId === wall.id);

      if (doorsOnWall.length === 0 && windowsOnWall.length === 0) {
        // Solid wall segment without openings
        const wallGeo = new THREE.BoxGeometry(wallLen, wall.height, wall.thickness);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(0, wall.height / 2, 0);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallGroup.add(wallMesh);
      } else {
        // Build wall segments with true rectangular openings for doors and windows
        interface WallOpening {
          type: 'door' | 'window';
          start: number;
          end: number;
          bottom: number;
          top: number;
          doorItem?: typeof currentProject.doors[0];
          windowItem?: typeof currentProject.windows[0];
        }

        const openings: WallOpening[] = [];

        doorsOnWall.forEach(door => {
          const center = door.positionRatio * wallLen;
          const w = door.width || 3.0;
          const h = Math.min(door.height || 7.0, wall.height);
          openings.push({
            type: 'door',
            start: Math.max(0, center - w / 2),
            end: Math.min(wallLen, center + w / 2),
            bottom: 0,
            top: h,
            doorItem: door
          });
        });

        windowsOnWall.forEach(win => {
          const center = win.positionRatio * wallLen;
          const w = win.width || 4.0;
          const sillH = Math.min(win.sillHeight ?? 3.0, wall.height - 1.0);
          const h = Math.min(win.height || 4.5, wall.height - sillH);
          openings.push({
            type: 'window',
            start: Math.max(0, center - w / 2),
            end: Math.min(wallLen, center + w / 2),
            bottom: sillH,
            top: sillH + h,
            windowItem: win
          });
        });

        // Sort openings along wall length
        openings.sort((a, b) => a.start - b.start);

        let currentX = 0;

        openings.forEach(op => {
          // 1. Solid wall section before opening
          if (op.start > currentX + 0.02) {
            const segLen = op.start - currentX;
            const segMesh = new THREE.Mesh(
              new THREE.BoxGeometry(segLen, wall.height, wall.thickness),
              wallMat
            );
            segMesh.position.set(
              (currentX + op.start) / 2 - wallLen / 2,
              wall.height / 2,
              0
            );
            segMesh.castShadow = true;
            segMesh.receiveShadow = true;
            wallGroup.add(segMesh);
          }

          const opWidth = op.end - op.start;
          const opLocalX = (op.start + op.end) / 2 - wallLen / 2;

          // 2. Wall section below opening (window sill wall)
          if (op.bottom > 0.05) {
            const bottomMesh = new THREE.Mesh(
              new THREE.BoxGeometry(opWidth, op.bottom, wall.thickness),
              wallMat
            );
            bottomMesh.position.set(opLocalX, op.bottom / 2, 0);
            bottomMesh.castShadow = true;
            bottomMesh.receiveShadow = true;
            wallGroup.add(bottomMesh);
          }

          // 3. Wall section above opening (header / lintel wall)
          if (op.top < wall.height - 0.05) {
            const topH = wall.height - op.top;
            const topMesh = new THREE.Mesh(
              new THREE.BoxGeometry(opWidth, topH, wall.thickness),
              wallMat
            );
            topMesh.position.set(opLocalX, op.top + topH / 2, 0);
            topMesh.castShadow = true;
            topMesh.receiveShadow = true;
            wallGroup.add(topMesh);
          }

          // 4. Place 3D Architectural Window or Door Assembly in the cutout
          if (op.type === 'window' && op.windowItem) {
            const winAssembly = createWindow3DMesh(op.windowItem, wall.thickness);
            winAssembly.position.set(opLocalX, 0, 0);
            wallGroup.add(winAssembly);
          } else if (op.type === 'door' && op.doorItem) {
            const doorAssembly = createDoor3DMesh(op.doorItem, wall.thickness);
            doorAssembly.position.set(opLocalX, 0, 0);
            wallGroup.add(doorAssembly);
          }

          currentX = Math.max(currentX, op.end);
        });

        // Final solid wall section after last opening
        if (currentX < wallLen - 0.02) {
          const segLen = wallLen - currentX;
          const segMesh = new THREE.Mesh(
            new THREE.BoxGeometry(segLen, wall.height, wall.thickness),
            wallMat
          );
          segMesh.position.set(
            (currentX + wallLen) / 2 - wallLen / 2,
            wall.height / 2,
            0
          );
          segMesh.castShadow = true;
          segMesh.receiveShadow = true;
          wallGroup.add(segMesh);
        }
      }

      scene.add(wallGroup);
    });

    // 6. Build 3D Furniture Objects
    currentProject.furniture.forEach(item => {
      const meshGroup = createFurniture3DMesh(item);
      scene.add(meshGroup);
    });
  }, [currentProject, lightingMode, showCeiling]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-50 select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Interactive 3D Camera Controls Floating Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-1.5 shadow-xl text-xs text-slate-700">
        <button
          onClick={() => setCameraMode('perspective')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'perspective'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Standard 3D Perspective View"
        >
          3D Perspective
        </button>

        <button
          onClick={() => setCameraMode('top')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'top'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Direct Overhead Top-down View (2D-style 3D)"
        >
          Top View
        </button>

        <button
          onClick={() => setCameraMode('side')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'side'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Side Architectural Elevation View"
        >
          Side View
        </button>

        <button
          onClick={() => setCameraMode('isometric')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'isometric'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Isometric Axonometric View"
        >
          Isometric
        </button>

        <button
          onClick={() => setCameraMode('firstPerson')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'firstPerson'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Walk Inside the House (WASD + Mouse Look)"
        >
          🚶 Walkthrough
        </button>

        <button
          onClick={() => setCameraMode('orbit360')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            cameraMode === 'orbit360'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Automatic 360° Rotating Showcase"
        >
          360° Orbit
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          onClick={() => setActiveView('2D')}
          className="px-2.5 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition font-bold cursor-pointer"
        >
          📐 Switch to 2D
        </button>
      </div>

      {/* FPS & Active 3D Mode Overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-emerald-100 rounded-xl px-4 py-2 text-xs text-slate-700 shadow-xl">
        <span className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          WebGL 3D Engine ({fps} FPS)
        </span>
        <div className="h-3 w-px bg-slate-200" />
        <span className="text-emerald-700 font-mono font-bold capitalize">
          Mode: {cameraMode === 'firstPerson' ? 'Walkthrough' : cameraMode}
        </span>
      </div>

      {/* Walkthrough Interactive HUD */}
      {cameraMode === 'firstPerson' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-white font-medium text-xs px-5 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Walkthrough Mode
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="text-slate-300">
            <span className="text-white font-bold">WASD / Arrow Keys</span> to Walk •{' '}
            <span className="text-white font-bold">Drag Mouse</span> to Look •{' '}
            <span className="text-white font-bold">Q / E</span> to Turn •{' '}
            <span className="text-white font-bold">Shift</span> to Sprint
          </div>
          <button
            onClick={() => setCameraMode('perspective')}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow transition"
          >
            Exit Walkthrough
          </button>
        </div>
      )}
    </div>
  );
};
