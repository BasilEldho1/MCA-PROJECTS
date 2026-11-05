import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../../context/ProjectContext';
import {
  convertBlueprintToFloorPlan,
  PRESET_BLUEPRINTS,
  BlueprintConversionOptions,
  ConvertedFloorPlanResult
} from '../../../utils/blueprintConverter';
import { processMultiRepresentationPipeline, MultiRepresentationMaps } from '../../../utils/detection/preprocessingPipeline';
import { calculateOverlayBounds } from '../../../utils/geometry';
import { DetectionValidationView } from './DetectionValidationView';
import {
  Sparkles,
  Box,
  Layers,
  Sliders,
  X,
  Upload,
  RefreshCw,
  Eye,
  Maximize2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Convert2Dto3DModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Convert2Dto3DModal: React.FC<Convert2Dto3DModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, applyConvertedFloorPlan } = useProject();

  const [selectedSourceId, setSelectedSourceId] = useState<string>('current');
  const [sensitivity, setSensitivity] = useState<number>(50);
  const [wallThickness, setWallThickness] = useState<number>(0.75);
  const [wallHeight, setWallHeight] = useState<number>(9.5);
  const [autoDetectRooms, setAutoDetectRooms] = useState<boolean>(true);
  const [autoDetectOpenings, setAutoDetectOpenings] = useState<boolean>(true);
  const [projectBlueprintIn3D, setProjectBlueprintIn3D] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [conversionResult, setConversionResult] = useState<ConvertedFloorPlanResult | null>(null);
  const [showDetectedOverlay, setShowDetectedOverlay] = useState<boolean>(true);
  const [previewTab, setPreviewTab] = useState<'3d' | '2d' | 'validation'>('3d');

  const mount3DRef = useRef<HTMLDivElement | null>(null);
  const scene3DRef = useRef<THREE.Scene | null>(null);
  const renderer3DRef = useRef<THREE.WebGLRenderer | null>(null);
  const camera3DRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controls3DRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customUploadedUrl, setCustomUploadedUrl] = useState<string | null>(null);

  const activeImageUrl =
    selectedSourceId === 'current'
      ? customUploadedUrl || currentProject?.blueprintOverlay?.imageUrl || PRESET_BLUEPRINTS[0].svgDataUrl
      : PRESET_BLUEPRINTS.find(p => p.id === selectedSourceId)?.svgDataUrl || PRESET_BLUEPRINTS[0].svgDataUrl;

  useEffect(() => {
    if (!isOpen || !currentProject) return;
    let isMounted = true;
    const runAnalysis = async () => {
      setIsProcessing(true);
      try {
        const options: BlueprintConversionOptions = {
          sensitivity,
          wallThickness,
          wallHeight,
          snapOrthogonal: true,
          autoDetectRooms,
          autoDetectOpenings,
          projectBlueprintIn3D,
          plotWidth: currentProject.plotWidth,
          plotLength: currentProject.plotLength,
          unit: currentProject.unit
        };
        const res = await convertBlueprintToFloorPlan(activeImageUrl, options);
        if (isMounted) setConversionResult(res);
      } catch (err) {
        console.error('Error during blueprint conversion analysis:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };
    runAnalysis();
    return () => { isMounted = false; };
  }, [isOpen, activeImageUrl, sensitivity, wallThickness, wallHeight, autoDetectRooms, autoDetectOpenings, projectBlueprintIn3D, currentProject]);

  const rendererRefClear = (container: HTMLDivElement) => {
    while (container.firstChild) container.removeChild(container.firstChild);
  };

  const controlsRefClear = () => {
    if (controls3DRef.current) { controls3DRef.current.dispose(); controls3DRef.current = null; }
  };

  useEffect(() => {
    if (!isOpen || previewTab !== '3d') return;
    const container = mount3DRef.current;
    if (!container) return;
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene3DRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(35, 30, 45);
    camera3DRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRefClear(container);
    container.appendChild(renderer.domElement);
    renderer3DRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controlsRefClear();
    controls3DRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    rimLight.position.set(-30, 40, -20);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      rendererRefClear(container);
    };
  }, [isOpen, previewTab]);

  useEffect(() => {
    const scene = scene3DRef.current;
    if (!scene || !conversionResult || !currentProject) return;

    const objectsToRemove: THREE.Object3D[] = [];
    scene.children.forEach(c => { if (c.name === 'previewGeneratedObject') objectsToRemove.push(c); });
    objectsToRemove.forEach(o => scene.remove(o));

    const centerX = currentProject.plotWidth / 2;
    const centerZ = currentProject.plotLength / 2;
    if (controls3DRef.current) controls3DRef.current.target.set(centerX, 2, centerZ);

    conversionResult.rooms.forEach(room => {
      if (!room.polygon || room.polygon.length < 3) return;
      const shape = new THREE.Shape();
      shape.moveTo(room.polygon[0].x, room.polygon[0].y);
      for (let i = 1; i < room.polygon.length; i++) shape.lineTo(room.polygon[i].x, room.polygon[i].y);
      shape.closePath();
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(room.floorColor || '#92400e'), roughness: 0.5, side: THREE.DoubleSide })
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.name = 'previewGeneratedObject';
      scene.add(mesh);
    });

    conversionResult.walls.forEach(wall => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const midX = (wall.start.x + wall.end.x) / 2;
      const midZ = (wall.start.y + wall.end.y) / 2;
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(len, wall.height, wall.thickness),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(wall.color || '#cbd5e1'), roughness: 0.6 })
      );
      wallMesh.position.set(midX, wall.height / 2, midZ);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = true;
      wallMesh.name = 'previewGeneratedObject';
      scene.add(wallMesh);
    });

    if (projectBlueprintIn3D && activeImageUrl) {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(activeImageUrl, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const bMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(currentProject.plotWidth * 0.9, currentProject.plotLength * 0.9),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false })
        );
        bMesh.rotation.x = -Math.PI / 2;
        bMesh.position.set(centerX, 0.01, centerZ);
        bMesh.name = 'previewGeneratedObject';
        scene.add(bMesh);
      });
    }
  }, [conversionResult, currentProject, projectBlueprintIn3D, activeImageUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) { setCustomUploadedUrl(ev.target.result as string); setSelectedSourceId('current'); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate3D = () => {
    if (!conversionResult || !currentProject) return;
    applyConvertedFloorPlan(conversionResult.walls, conversionResult.rooms, conversionResult.doors, conversionResult.windows,
      { imageUrl: activeImageUrl, visible: projectBlueprintIn3D, opacity: 0.5 }, true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
    onClose();
  };

  const handleApplyTo2D = () => {
    if (!conversionResult || !currentProject) return;
    applyConvertedFloorPlan(conversionResult.walls, conversionResult.rooms, conversionResult.doors, conversionResult.windows,
      { imageUrl: activeImageUrl, visible: true, opacity: 0.5 }, false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 select-none overflow-y-auto">
      <div className="bg-white border border-emerald-100 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Convert 2D Blueprint to 3D Floor Plan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">AUTO-VECTORIZER</span>
              </h2>
              <p className="text-xs text-slate-500">Transform blueprint image lines into solid 3D walls, room floors, doors &amp; windows.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-emerald-50 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider mr-1">Source:</span>
            <button
              onClick={() => setSelectedSourceId('current')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${selectedSourceId === 'current' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'}`}
            >
              <Upload size={13} />
              <span>{currentProject?.blueprintOverlay?.imageUrl || customUploadedUrl ? 'Active / Uploaded File' : 'Upload File'}</span>
            </button>
            {PRESET_BLUEPRINTS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedSourceId(p.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${selectedSourceId === p.id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'}`}
              >
                <span>{p.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75">({p.type})</span>
              </button>
            ))}
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-300 transition flex items-center gap-1">
              <Upload size={12} />
              <span>Browse New File</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        {previewTab === 'validation' && conversionResult?.multiRepresentationMaps ? (
          <div className="flex-1 min-h-[500px] overflow-hidden">
            <DetectionValidationView
              maps={conversionResult.multiRepresentationMaps}
              walls={conversionResult.walls}
              rooms={conversionResult.rooms}
              doors={conversionResult.doors}
              windows={conversionResult.windows}
              plotWidth={currentProject?.plotWidth || 40}
              plotLength={currentProject?.plotLength || 30}
              unit={currentProject?.unit || 'feet'}
              onApplyTo2D={(w, r, d, win) => { applyConvertedFloorPlan(w, r, d, win, { imageUrl: activeImageUrl, visible: true, opacity: 0.5 }, false); onClose(); }}
              onGenerate3D={(w, r, d, win) => { applyConvertedFloorPlan(w, r, d, win, { imageUrl: activeImageUrl, visible: projectBlueprintIn3D, opacity: 0.5 }, true); confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } }); onClose(); }}
              onClose={onClose}
            />
          </div>
        ) : (
          <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
            {/* Left: Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreviewTab('3d')} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${previewTab === '3d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                    <Box size={14} /><span>Interactive 3D Preview</span>
                  </button>
                  <button onClick={() => setPreviewTab('2d')} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${previewTab === '2d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                    <Layers size={14} /><span>2D Blueprint Overlay</span>
                  </button>
                  <button onClick={() => setPreviewTab('validation')} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${previewTab === 'validation' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-600 hover:bg-purple-50'}`}>
                    <Maximize2 size={14} /><span>Side-by-Side Validation</span>
                  </button>
                </div>
                {previewTab === '2d' && (
                  <button onClick={() => setShowDetectedOverlay(!showDetectedOverlay)} className={`px-2 py-1 text-[11px] rounded flex items-center gap-1 font-semibold transition ${showDetectedOverlay ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Eye size={12} /><span>{showDetectedOverlay ? 'Hide Skeleton' : 'Show Skeleton'}</span>
                  </button>
                )}
              </div>

              <div className="relative w-full h-80 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                {isProcessing && (
                  <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2">
                    <RefreshCw className="animate-spin text-emerald-600" size={24} />
                    <span className="text-xs text-emerald-800 font-semibold">Extracting 3D geometry...</span>
                  </div>
                )}
                <div ref={mount3DRef} className={`w-full h-full cursor-grab active:cursor-grabbing ${previewTab === '3d' ? 'block' : 'hidden'}`} />
                {previewTab === '2d' && (
                  <div className="relative w-full h-full p-4 flex items-center justify-center bg-slate-100">
                    {(() => {
                      const plotW = currentProject?.plotWidth || 40;
                      const plotL = currentProject?.plotLength || 30;
                      const maps = conversionResult?.multiRepresentationMaps;
                      const bounds = maps ? calculateOverlayBounds(maps.width, maps.height, plotW, plotL) : { x: 0, y: 0, width: plotW, height: plotL };
                      return (
                        <svg className="w-full h-full max-h-full object-contain bg-slate-900 border border-slate-800 rounded-xl" viewBox={`0 0 ${plotW} ${plotL}`}>
                          <image href={activeImageUrl} x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} opacity={0.85} preserveAspectRatio="none" />
                          {showDetectedOverlay && conversionResult && (
                            <>
                              {conversionResult.rooms.map((room, idx) => (
                                <polygon key={idx} points={room.polygon.map(p => `${p.x},${p.y}`).join(' ')} fill={room.floorColor || '#10b981'} fillOpacity="0.25" stroke="#059669" strokeWidth="0.4" strokeDasharray="1,1" />
                              ))}
                              {conversionResult.walls.map((w, idx) => (
                                <line key={idx} x1={w.start.x} y1={w.start.y} x2={w.end.x} y2={w.end.y} stroke={w.isExterior ? '#059669' : '#10b981'} strokeWidth={w.thickness || 0.6} strokeLinecap="round" />
                              ))}
                            </>
                          )}
                        </svg>
                      );
                    })()}
                  </div>
                )}
                <div className="absolute bottom-2 left-3 z-10 text-[10px] text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200 backdrop-blur shadow-xs">
                  {previewTab === '3d' ? 'Drag to orbit 3D house • Scroll to zoom' : 'Dark Green: Extracted 3D Walls • Mint: Detected Rooms'}
                </div>
              </div>

              {conversionResult && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[11px]">3D Walls</div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">{conversionResult.detectedWallsCount} Extruded</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[11px]">Enclosed Rooms</div>
                    <div className="text-sm font-bold text-emerald-600 font-mono">{conversionResult.detectedRoomsCount} Rooms</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[11px]">Living Space</div>
                    <div className="text-sm font-bold text-teal-700 font-mono">{conversionResult.estimatedLivingArea} {currentProject?.unit === 'feet' ? 'sq ft' : 'm²'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs pb-1 border-b border-slate-200">
                  <Sliders size={14} className="text-emerald-600" />
                  <span>Detection &amp; Extrusion Parameters</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Wall Line Contrast Sensitivity</span>
                    <span className="font-mono text-emerald-700 font-bold">{sensitivity}%</span>
                  </div>
                  <input type="range" min="20" max="80" step="5" value={sensitivity} onChange={e => setSensitivity(parseInt(e.target.value))} className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 mb-1">Wall Thickness ({currentProject?.unit})</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[{ label: 'Standard (0.5)', val: 0.5 }, { label: 'Medium (0.75)', val: 0.75 }, { label: 'Thick (1.0)', val: 1.0 }].map(item => (
                      <button key={item.val} type="button" onClick={() => setWallThickness(item.val)}
                        className={`py-1.5 px-2 rounded-lg font-semibold transition text-center text-[11px] ${wallThickness === item.val ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 mb-1">Extruded Wall Height ({currentProject?.unit})</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[{ label: '8.5 ft', val: 8.5 }, { label: '9.5 ft (Default)', val: 9.5 }, { label: '11.0 ft (High)', val: 11.0 }].map(item => (
                      <button key={item.val} type="button" onClick={() => setWallHeight(item.val)}
                        className={`py-1.5 px-2 rounded-lg font-semibold transition text-center text-[11px] ${wallHeight === item.val ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input type="checkbox" checked={autoDetectRooms} onChange={e => setAutoDetectRooms(e.target.checked)} className="accent-emerald-600 w-3.5 h-3.5 rounded" />
                    <span>Auto-detect &amp; texture room floors</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input type="checkbox" checked={autoDetectOpenings} onChange={e => setAutoDetectOpenings(e.target.checked)} className="accent-emerald-600 w-3.5 h-3.5 rounded" />
                    <span>Auto-place doors &amp; windows on perimeter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input type="checkbox" checked={projectBlueprintIn3D} onChange={e => setProjectBlueprintIn3D(e.target.checked)} className="accent-emerald-600 w-3.5 h-3.5 rounded" />
                    <span>Project 2D blueprint texture on 3D ground plane</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button type="button" onClick={handleGenerate3D} disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50">
                  <Sparkles size={16} />
                  <span>✨ Generate 3D Model &amp; Open 3D View</span>
                </button>
                <button type="button" onClick={handleApplyTo2D} disabled={isProcessing}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Check size={14} />
                  <span>Apply Walls to 2D Plan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
