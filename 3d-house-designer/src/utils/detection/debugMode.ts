import { MultiRepresentationMaps } from './preprocessingPipeline';

export type DebugMapType =
  | 'original'
  | 'grayscale'
  | 'binary'
  | 'edgeMap'
  | 'lineMap'
  | 'wallCandidateMap'
  | 'symbolCandidateMap';

export interface DebugInspectionData {
  currentMapType: DebugMapType;
  availableMaps: DebugMapType[];
  mapCanvas: HTMLCanvasElement | null;
  statistics: {
    width: number;
    height: number;
    resolutionQuality: string;
    detectedWallCount: number;
    detectedRoomCount: number;
    detectedDoorCount: number;
    detectedWindowCount: number;
  };
}

/**
 * Returns canvas element corresponding to target debug map representation
 */
export function getDebugMapCanvas(
  maps: MultiRepresentationMaps,
  mapType: DebugMapType
): HTMLCanvasElement | null {
  switch (mapType) {
    case 'grayscale':
      return maps.grayscaleCanvas;
    case 'binary':
      return maps.binaryCanvas;
    case 'edgeMap':
      return maps.edgeMapCanvas;
    case 'lineMap':
      return maps.lineMapCanvas;
    case 'wallCandidateMap':
      return maps.wallCandidateCanvas;
    case 'symbolCandidateMap':
      return maps.symbolCandidateCanvas;
    case 'original':
    default:
      return null;
  }
}
