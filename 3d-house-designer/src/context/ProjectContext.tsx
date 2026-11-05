import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Project,
  Wall,
  Room,
  Door,
  WindowItem,
  FurnitureItem,
  ToolMode,
  CameraMode,
  UnitType,
  Point2D,
  MaterialType,
  BlueprintOverlay
} from '../types/floorplan';
import { getStoredProjects, saveProjectsToStorage, INITIAL_DEMO_PROJECTS } from '../utils/storage';
import { FURNITURE_CATALOG } from '../utils/furnitureCatalog';
import { calculateOverlayBounds } from '../utils/geometry';
import { generateConfiguredProject } from '../utils/planGenerator';
import { api } from '../services/api';

interface SelectedElement {
  id: string;
  type: 'wall' | 'room' | 'door' | 'window' | 'furniture';
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  activeView: '2D' | '3D';
  cameraMode: CameraMode;
  toolMode: ToolMode;
  selectedFurnitureCatalogId: string | null;
  selectedElement: SelectedElement | null;
  lightingMode: 'day' | 'night';
  showGrid: boolean;
  snapGrid: boolean;
  gridSize: number;
  showCeiling: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // State Setters & Actions
  setActiveView: (view: '2D' | '3D') => void;
  setCameraMode: (mode: CameraMode) => void;
  setToolMode: (mode: ToolMode) => void;
  setSelectedFurnitureCatalogId: (catalogId: string | null) => void;
  setSelectedElement: (elem: SelectedElement | null) => void;
  setLightingMode: (mode: 'day' | 'night') => void;
  setShowGrid: (show: boolean) => void;
  setSnapGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setShowCeiling: (show: boolean) => void;

  // Project CRUD
  createProject: (
    name: string,
    houseType: string,
    plotWidth: number,
    plotLength: number,
    unit: UnitType,
    floorsCount: number,
    buildingDetails?: { targetSqFt?: number; bedrooms?: number; bathrooms?: number }
  ) => Project;
  selectProject: (id: string) => void;
  saveCurrentProject: () => Promise<boolean>;
  saveProjectAs: (newName: string) => Promise<Project | null>;
  renameCurrentProject: (newName: string) => Promise<boolean>;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void;
  lastSavedTime: Date | null;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  importProjectJSON: (jsonStr: string) => boolean;

  // Canvas Editing
  addWall: (start: Point2D, end: Point2D) => void;
  updateWall: (wallId: string, updated: Partial<Wall>) => void;
  deleteWall: (wallId: string) => void;
  addRoom: (name: string, type: string, polygon: Point2D[]) => void;
  updateRoom: (roomId: string, updated: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addDoor: (wallId: string, positionRatio: number) => void;
  updateDoor: (doorId: string, updated: Partial<Door>) => void;
  deleteDoor: (doorId: string) => void;
  addWindow: (wallId: string, positionRatio: number) => void;
  updateWindow: (windowId: string, updated: Partial<WindowItem>) => void;
  deleteWindow: (windowId: string) => void;
  addFurniture: (
    catalogIdOrItem: string | Partial<FurnitureItem>,
    x?: number,
    y?: number
  ) => void;
  updateFurniture: (furnitureId: string, updated: Partial<FurnitureItem>) => void;
  deleteFurniture: (furnitureId: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;

  // History
  undo: () => void;
  redo: () => void;

  // Unit
  toggleUnit: () => void;

  // Shared Review Mode
  loadExternalProject: (project: Project) => void;
  sharedReviewInfo: { isReviewing: boolean; projectName: string } | null;
  clearReviewMode: () => void;

  // 2D Blueprint Overlay & 3D Conversion
  setBlueprintOverlay: (overlay: BlueprintOverlay | null) => void;
  updateBlueprintOverlay: (updates: Partial<BlueprintOverlay>) => void;
  applyConvertedFloorPlan: (
    walls: Wall[],
    rooms: Room[],
    doors: Door[],
    windows: WindowItem[],
    blueprintOverlayUpdates?: Partial<BlueprintOverlay>,
    switchTo3D?: boolean
  ) => void;
  createProjectFromConvertedPlan: (
    name: string,
    walls: Wall[],
    rooms: Room[],
    doors: Door[],
    windows: WindowItem[],
    blueprintOverlayUpdates?: Partial<BlueprintOverlay>,
    thumbnail?: string,
    targetView?: '2D' | '3D'
  ) => Project;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(getStoredProjects());
  const [currentProject, setCurrentProject] = useState<Project | null>(projects[0] || null);

  // Editor states
  const [activeView, setActiveView] = useState<'2D' | '3D'>('2D');
  const [cameraMode, setCameraMode] = useState<CameraMode>('perspective');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedFurnitureCatalogId, setSelectedFurnitureCatalogId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapGrid, setSnapGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(0.5);
  const [showCeiling, setShowCeiling] = useState<boolean>(false);
  const [sharedReviewInfo, setSharedReviewInfo] = useState<{ isReviewing: boolean; projectName: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Sync projects to storage
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Sync with server projects on mount
  useEffect(() => {
    const fetchRemoteProjects = async () => {
      try {
        const res = await api.getProjects();
        if (res.projects && res.projects.length > 0) {
          setProjects(prev => {
            const map = new Map<string, Project>();
            prev.forEach(p => map.set(p.id, p));
            res.projects.forEach(p => {
              const pid = p.id || (p as any).projectId;
              map.set(pid, { ...p, id: pid });
            });
            const merged = Array.from(map.values());
            saveProjectsToStorage(merged);
            return merged;
          });
        }
      } catch (e) {
        // Local mode fallback
      }
    };
    fetchRemoteProjects();
  }, []);

  // Record history snapshot whenever project modifications occur
  const pushHistory = useCallback((proj: Project) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, JSON.parse(JSON.stringify(proj))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Update current project helper
  const updateCurrentProjectState = (updater: (prev: Project) => Project) => {
    if (!currentProject) return;
    const updated = updater(currentProject);
    updated.updatedAt = new Date().toISOString();
    setCurrentProject(updated);
    pushHistory(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const createProject = (
    name: string,
    houseType: string,
    plotWidth: number,
    plotLength: number,
    unit: UnitType,
    floorsCount: number,
    buildingDetails?: { targetSqFt?: number; bedrooms?: number; bathrooms?: number }
  ): Project => {
    const newProj = generateConfiguredProject({
      name,
      houseType,
      plotWidth,
      plotLength,
      unit,
      floorsCount,
      targetSqFt: buildingDetails?.targetSqFt || (plotWidth * plotLength),
      bedrooms: buildingDetails?.bedrooms ?? 3,
      bathrooms: buildingDetails?.bathrooms ?? 2
    });

    setProjects(prev => [newProj, ...prev]);
    setCurrentProject(newProj);
    setHistory([JSON.parse(JSON.stringify(newProj))]);
    setHistoryIndex(0);
    return newProj;
  };

  const selectProject = (id: string) => {
    const found = projects.find(p => p.id === id);
    if (found) {
      setCurrentProject(found);
      setHistory([JSON.parse(JSON.stringify(found))]);
      setHistoryIndex(0);
      setSelectedElement(null);
      setSharedReviewInfo(null);
    }
  };

  const loadExternalProject = (project: Project) => {
    setCurrentProject(project);
    setHistory([JSON.parse(JSON.stringify(project))]);
    setHistoryIndex(0);
    setSelectedElement(null);
    setActiveView('3D');
    setSharedReviewInfo({
      isReviewing: true,
      projectName: project.name,
    });
  };

  const clearReviewMode = () => {
    setSharedReviewInfo(null);
  };

  const setBlueprintOverlay = (overlay: BlueprintOverlay | null) => {
    if (!currentProject) return;
    const updated = { ...currentProject, blueprintOverlay: overlay };
    setCurrentProject(updated);
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const updateBlueprintOverlay = (updates: Partial<BlueprintOverlay>) => {
    if (!currentProject || !currentProject.blueprintOverlay) return;
    const updatedOverlay = { ...currentProject.blueprintOverlay, ...updates };
    const updated = { ...currentProject, blueprintOverlay: updatedOverlay };
    setCurrentProject(updated);
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const applyConvertedFloorPlan = (
    walls: Wall[],
    rooms: Room[],
    doors: Door[],
    windows: WindowItem[],
    blueprintOverlayUpdates?: Partial<BlueprintOverlay>,
    switchTo3D: boolean = true
  ) => {
    if (!currentProject) return;
    updateCurrentProjectState(prev => {
      let updatedOverlay = prev.blueprintOverlay;

      if (blueprintOverlayUpdates) {
        const defaultBounds = calculateOverlayBounds(4, 3, prev.plotWidth || 40, prev.plotLength || 30);
        const base: BlueprintOverlay = prev.blueprintOverlay || {
          imageUrl: blueprintOverlayUpdates.imageUrl || '',
          opacity: 0.5,
          visible: true,
          x: defaultBounds.x,
          y: defaultBounds.y,
          width: defaultBounds.width,
          height: defaultBounds.height
        };

        updatedOverlay = {
          ...base,
          ...blueprintOverlayUpdates
        };
      }

      return {
        ...prev,
        walls,
        rooms,
        doors,
        windows,
        blueprintOverlay: updatedOverlay
      };
    });

    if (switchTo3D) {
      setActiveView('3D');
    }
  };

  const createProjectFromConvertedPlan = (
    name: string,
    walls: Wall[],
    rooms: Room[],
    doors: Door[],
    windows: WindowItem[],
    blueprintOverlayUpdates?: Partial<BlueprintOverlay>,
    thumbnail?: string,
    targetView: '2D' | '3D' = '2D'
  ): Project => {
    const id = `proj_${Date.now()}`;
    const defaultBounds = calculateOverlayBounds(4, 3, 40, 30);
    const overlay: BlueprintOverlay | undefined = blueprintOverlayUpdates?.imageUrl
      ? {
          imageUrl: blueprintOverlayUpdates.imageUrl,
          opacity: blueprintOverlayUpdates.opacity ?? 0.5,
          visible: blueprintOverlayUpdates.visible ?? true,
          x: blueprintOverlayUpdates.x ?? defaultBounds.x,
          y: blueprintOverlayUpdates.y ?? defaultBounds.y,
          width: blueprintOverlayUpdates.width ?? defaultBounds.width,
          height: blueprintOverlayUpdates.height ?? defaultBounds.height,
          originalFileName: blueprintOverlayUpdates.originalFileName,
          originalFileSize: blueprintOverlayUpdates.originalFileSize,
          originalFileType: blueprintOverlayUpdates.originalFileType
        }
      : undefined;

    const newProject: Project = {
      id,
      name: name.trim() || 'Uploaded Blueprint Plan',
      houseType: 'Modern House',
      plotWidth: 40,
      plotLength: 30,
      unit: 'feet',
      floorsCount: 1,
      buildingDetails: {
        targetSqFt: 1200,
        bedrooms: Math.max(1, rooms.filter(r => r.type.toLowerCase().includes('bed')).length),
        bathrooms: Math.max(1, rooms.filter(r => r.type.toLowerCase().includes('bath')).length),
        floors: 1
      },
      walls,
      rooms,
      doors,
      windows,
      furniture: [],
      blueprintOverlay: overlay,
      thumbnail: thumbnail || overlay?.imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProjects(prev => {
      const updated = [newProject, ...prev];
      saveProjectsToStorage(updated);
      return updated;
    });
    setCurrentProject(newProject);
    setHistory([JSON.parse(JSON.stringify(newProject))]);
    setHistoryIndex(0);
    setActiveView(targetView);
    return newProject;
  };

  const saveCurrentProject = async (): Promise<boolean> => {
    if (!currentProject) return false;
    setSaveStatus('saving');
    try {
      const updated: Project = { ...currentProject, updatedAt: new Date().toISOString() };
      setCurrentProject(updated);
      setProjects(prev => {
        const next = prev.map(p => (p.id === updated.id ? updated : p));
        saveProjectsToStorage(next);
        return next;
      });

      // Try server save
      try {
        await api.saveProject(updated);
      } catch (serverErr) {
        console.warn('[ProjectContext] Server save warning (saved locally):', serverErr);
      }

      setSaveStatus('saved');
      setLastSavedTime(new Date());
      return true;
    } catch (err) {
      setSaveStatus('error');
      return false;
    }
  };

  const saveProjectAs = async (newName: string): Promise<Project | null> => {
    if (!currentProject) return null;
    setSaveStatus('saving');
    try {
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: Project = {
        ...JSON.parse(JSON.stringify(currentProject)),
        id: newId,
        projectId: newId,
        name: newName.trim() || `${currentProject.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setProjects(prev => {
        const next = [duplicated, ...prev];
        saveProjectsToStorage(next);
        return next;
      });
      setCurrentProject(duplicated);
      setHistory([JSON.parse(JSON.stringify(duplicated))]);
      setHistoryIndex(0);

      try {
        await api.saveProject(duplicated);
      } catch (e) {
        console.warn('[ProjectContext] Clone server save warning (saved locally):', e);
      }

      setSaveStatus('saved');
      setLastSavedTime(new Date());
      return duplicated;
    } catch (err) {
      setSaveStatus('error');
      return null;
    }
  };

  const renameCurrentProject = async (newName: string): Promise<boolean> => {
    if (!currentProject || !newName.trim()) return false;
    const cleanName = newName.trim();
    updateCurrentProjectState(prev => ({
      ...prev,
      name: cleanName
    }));

    try {
      await api.renameProject(currentProject.id, cleanName);
    } catch (e) {
      console.warn('[ProjectContext] Server rename warning (saved locally):', e);
    }
    return true;
  };

  const deleteProject = (id: string) => {
    const filtered = projects.filter(p => p.id !== id);
    setProjects(filtered);
    if (currentProject?.id === id) {
      setCurrentProject(filtered[0] || null);
    }
  };

  const duplicateProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const dup: Project = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj_${Date.now()}`,
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects(prev => [dup, ...prev]);
  };

  const importProjectJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as Project;
      if (!parsed.name || !parsed.walls) return false;
      parsed.id = `proj_${Date.now()}`;
      parsed.createdAt = new Date().toISOString();
      parsed.updatedAt = new Date().toISOString();
      setProjects(prev => [parsed, ...prev]);
      setCurrentProject(parsed);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Wall Editing
  const addWall = (start: Point2D, end: Point2D) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      walls: [
        ...prev.walls,
        {
          id: `w_${Date.now()}`,
          start,
          end,
          thickness: 0.5,
          height: 9.5,
          material: 'paint',
          color: '#e2e8f0'
        }
      ]
    }));
  };

  const updateWall = (wallId: string, updated: Partial<Wall>) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      walls: prev.walls.map(w => (w.id === wallId ? { ...w, ...updated } : w))
    }));
  };

  const deleteWall = (wallId: string) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      walls: prev.walls.filter(w => w.id !== wallId),
      doors: prev.doors.filter(d => d.wallId !== wallId),
      windows: prev.windows.filter(win => win.wallId !== wallId)
    }));
    if (selectedElement?.id === wallId) setSelectedElement(null);
  };

  // Room Editing
  const addRoom = (name: string, type: string, polygon: Point2D[]) => {
    let calculatedArea = 0;
    if (polygon.length >= 3) {
      let areaSum = 0;
      for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        areaSum += polygon[i].x * polygon[j].y;
        areaSum -= polygon[j].x * polygon[i].y;
      }
      calculatedArea = Math.round(Math.abs(areaSum) / 2);
    }

    updateCurrentProjectState(prev => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          id: `r_${Date.now()}`,
          name,
          type,
          polygon,
          floorMaterial: 'wood',
          wallMaterial: 'paint',
          floorColor: '#a16207',
          wallColor: '#f8fafc',
          area: calculatedArea || 150
        }
      ]
    }));
  };

  const updateRoom = (roomId: string, updated: Partial<Room>) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => (r.id === roomId ? { ...r, ...updated } : r))
    }));
  };

  const deleteRoom = (roomId: string) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r.id !== roomId)
    }));
    if (selectedElement?.id === roomId) setSelectedElement(null);
  };

  // Door Editing
  const addDoor = (wallId: string, positionRatio: number) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      doors: [
        ...prev.doors,
        {
          id: `d_${Date.now()}`,
          wallId,
          positionRatio,
          width: 3.0,
          height: 6.8,
          doorType: 'single',
          color: '#78350f',
          material: 'wood'
        }
      ]
    }));
  };

  const updateDoor = (doorId: string, updated: Partial<Door>) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      doors: prev.doors.map(d => (d.id === doorId ? { ...d, ...updated } : d))
    }));
  };

  const deleteDoor = (doorId: string) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      doors: prev.doors.filter(d => d.id !== doorId)
    }));
    if (selectedElement?.id === doorId) setSelectedElement(null);
  };

  // Window Editing
  const addWindow = (wallId: string, positionRatio: number) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      windows: [
        ...prev.windows,
        {
          id: `win_${Date.now()}`,
          wallId,
          positionRatio,
          width: 4.0,
          height: 4.0,
          sillHeight: 2.8,
          windowType: 'standard',
          color: '#ffffff'
        }
      ]
    }));
  };

  const updateWindow = (windowId: string, updated: Partial<WindowItem>) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      windows: prev.windows.map(w => (w.id === windowId ? { ...w, ...updated } : w))
    }));
  };

  const deleteWindow = (windowId: string) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      windows: prev.windows.filter(w => w.id !== windowId)
    }));
    if (selectedElement?.id === windowId) setSelectedElement(null);
  };

  // Furniture Editing
  const addFurniture = (
    catalogIdOrItem: string | Partial<FurnitureItem>,
    x?: number,
    y?: number
  ) => {
    if (typeof catalogIdOrItem === 'object') {
      const item = catalogIdOrItem;
      updateCurrentProjectState(prev => ({
        ...prev,
        furniture: [
          ...prev.furniture,
          {
            id: `f_${Date.now()}`,
            catalogId: item.catalogId || 'stairs',
            name: item.name || 'Furniture',
            category: item.category || 'misc',
            x: item.x ?? 10,
            y: item.y ?? 10,
            z: item.z ?? 0,
            width: item.width ?? 4,
            length: item.length ?? 8,
            height: item.height ?? 9,
            rotation: item.rotation ?? 0,
            color: item.color || '#059669'
          }
        ]
      }));
      return;
    }

    const catalogId = catalogIdOrItem;
    const posX = x ?? 10;
    const posY = y ?? 10;
    const catalogItem = FURNITURE_CATALOG.find(c => c.id === catalogId);
    if (!catalogItem) return;

    updateCurrentProjectState(prev => ({
      ...prev,
      furniture: [
        ...prev.furniture,
        {
          id: `f_${Date.now()}`,
          catalogId,
          name: catalogItem.name,
          category: catalogItem.category,
          x: posX,
          y: posY,
          z: 0,
          width: catalogItem.defaultWidth,
          length: catalogItem.defaultLength,
          height: catalogItem.defaultHeight,
          rotation: 0,
          color: catalogItem.defaultColor
        }
      ]
    }));
  };

  const updateFurniture = (furnitureId: string, updated: Partial<FurnitureItem>) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      furniture: prev.furniture.map(f => (f.id === furnitureId ? { ...f, ...updated } : f))
    }));
  };

  const deleteFurniture = (furnitureId: string) => {
    updateCurrentProjectState(prev => ({
      ...prev,
      furniture: prev.furniture.filter(f => f.id !== furnitureId)
    }));
    if (selectedElement?.id === furnitureId) setSelectedElement(null);
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    const { id, type } = selectedElement;
    if (type === 'wall') deleteWall(id);
    else if (type === 'room') deleteRoom(id);
    else if (type === 'door') deleteDoor(id);
    else if (type === 'window') deleteWindow(id);
    else if (type === 'furniture') deleteFurniture(id);
    setSelectedElement(null);
  };

  const duplicateSelected = () => {
    if (!selectedElement || !currentProject) return;
    const { id, type } = selectedElement;
    if (type === 'furniture') {
      const item = currentProject.furniture.find(f => f.id === id);
      if (item) {
        addFurniture(item.catalogId, item.x + 2, item.y + 2);
      }
    }
  };

  // Undo / Redo
  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      setCurrentProject(JSON.parse(JSON.stringify(snapshot)));
      setHistoryIndex(prevIndex);
      setProjects(prev => prev.map(p => p.id === snapshot.id ? snapshot : p));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      setCurrentProject(JSON.parse(JSON.stringify(snapshot)));
      setHistoryIndex(nextIndex);
      setProjects(prev => prev.map(p => p.id === snapshot.id ? snapshot : p));
    }
  };

  const toggleUnit = () => {
    if (!currentProject) return;
    const nextUnit: UnitType = currentProject.unit === 'feet' ? 'meters' : 'feet';
    updateCurrentProjectState(prev => ({ ...prev, unit: nextUnit }));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        activeView,
        cameraMode,
        toolMode,
        selectedFurnitureCatalogId,
        selectedElement,
        lightingMode,
        showGrid,
        snapGrid,
        gridSize,
        showCeiling,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,

        setActiveView,
        setCameraMode,
        setToolMode,
        setSelectedFurnitureCatalogId,
        setSelectedElement,
        setLightingMode,
        setShowGrid,
        setSnapGrid,
        setGridSize,
        setShowCeiling,

        createProject,
        selectProject,
        saveCurrentProject,
        saveProjectAs,
        renameCurrentProject,
        saveStatus,
        setSaveStatus,
        lastSavedTime,
        deleteProject,
        duplicateProject,
        importProjectJSON,

        addWall,
        updateWall,
        deleteWall,
        addRoom,
        updateRoom,
        deleteRoom,
        addDoor,
        updateDoor,
        deleteDoor,
        addWindow,
        updateWindow,
        deleteWindow,
        addFurniture,
        updateFurniture,
        deleteFurniture,
        deleteSelected,
        duplicateSelected,

        undo,
        redo,
        toggleUnit,

        loadExternalProject,
        sharedReviewInfo,
        clearReviewMode,

        setBlueprintOverlay,
        updateBlueprintOverlay,
        applyConvertedFloorPlan,
        createProjectFromConvertedPlan
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
