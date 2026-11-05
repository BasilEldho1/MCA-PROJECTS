import * as THREE from 'three';
import { WindowItem, Door } from '../../types/floorplan';

/**
 * Creates an authentic architectural 3D Window Mesh Assembly
 * Includes:
 * - Extended projecting exterior sill with beveled stool
 * - Surrounding casing / trim jambs & head
 * - Double-hung / sliding sash frames with realistic depth
 * - Architectural muntin grids (divided light panes)
 * - Photorealistic glass with physical transmission and refraction
 * - Brass/chrome sash lock hardware
 */
export const createWindow3DMesh = (win: WindowItem, wallThickness: number): THREE.Group => {
  const group = new THREE.Group();
  const width = win.width || 4.0;
  const height = win.height || 4.5;
  const sillHeight = win.sillHeight ?? 3.0;

  // Window frame & trim materials
  const frameColor = new THREE.Color(win.color || '#f8fafc');
  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.35,
    metalness: 0.08
  });

  const sillMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.05
  });

  // Architectural Glass Material: Physical glass with realistic light transmission & reflection
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xecfeff,      // Soft crystal ice/sky tint
    transparent: true,
    opacity: 0.35,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.92,   // Light passes cleanly through glass
    ior: 1.52,            // Real glass index of refraction
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  // Hardware metal (architectural brass lock/latches)
  const hardwareMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 0.85
  });

  // 1. EXTENDED PROJECTING WINDOW SILL
  // Authentic architectural sill extending beyond the wall opening
  const sillThickness = 0.2;
  const sillDepth = wallThickness + 0.32;
  const sillWidth = width + 0.35;
  const sillGeo = new THREE.BoxGeometry(sillWidth, sillThickness, sillDepth);
  const sillMesh = new THREE.Mesh(sillGeo, sillMat);
  sillMesh.position.set(0, sillHeight - sillThickness / 2, 0);
  sillMesh.castShadow = true;
  sillMesh.receiveShadow = true;
  group.add(sillMesh);

  // 2. SURROUNDING CASING / WINDOW JAMB & HEAD FRAME
  const trimThickness = 0.14;
  const trimDepth = wallThickness + 0.1;

  // Top header jamb
  const topHeadGeo = new THREE.BoxGeometry(width, trimThickness, trimDepth);
  const topHead = new THREE.Mesh(topHeadGeo, frameMat);
  topHead.position.set(0, sillHeight + height - trimThickness / 2, 0);
  topHead.castShadow = true;
  group.add(topHead);

  // Left jamb
  const leftJambGeo = new THREE.BoxGeometry(trimThickness, height, trimDepth);
  const leftJamb = new THREE.Mesh(leftJambGeo, frameMat);
  leftJamb.position.set(-width / 2 + trimThickness / 2, sillHeight + height / 2, 0);
  leftJamb.castShadow = true;
  group.add(leftJamb);

  // Right jamb
  const rightJambGeo = new THREE.BoxGeometry(trimThickness, height, trimDepth);
  const rightJamb = new THREE.Mesh(rightJambGeo, frameMat);
  rightJamb.position.set(width / 2 - trimThickness / 2, sillHeight + height / 2, 0);
  rightJamb.castShadow = true;
  group.add(rightJamb);

  // 3. INNER SASH PROFILES, PANES & MULTI-LITE MUNTIN GRIDS
  const innerW = width - trimThickness * 2;
  const innerH = height - trimThickness * 2;
  const centerY = sillHeight + trimThickness + innerH / 2;
  const sashBorder = 0.1;
  const sashDepth = wallThickness * 0.55;

  if (win.windowType === 'picture') {
    // Panoramic Picture Window: single clean glass pane with slim perimeter frame
    const glassGeo = new THREE.BoxGeometry(innerW, innerH, 0.06);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, centerY, 0);
    group.add(glass);

    // Slim perimeter sash frame
    const pTop = new THREE.Mesh(new THREE.BoxGeometry(innerW, sashBorder, sashDepth), frameMat);
    pTop.position.set(0, centerY + innerH / 2 - sashBorder / 2, 0);
    const pBot = new THREE.Mesh(new THREE.BoxGeometry(innerW, sashBorder, sashDepth), frameMat);
    pBot.position.set(0, centerY - innerH / 2 + sashBorder / 2, 0);
    group.add(pTop, pBot);
  } else if (win.windowType === 'sliding') {
    // Sliding 2-panel window: Left & Right sash with realistic depth offset
    const paneW = (innerW / 2) + sashBorder * 0.5;

    // Left Sash (offset forward)
    const leftGlass = new THREE.Mesh(
      new THREE.BoxGeometry(paneW - sashBorder * 1.5, innerH - sashBorder * 1.5, 0.05),
      glassMat
    );
    leftGlass.position.set(-innerW / 4, centerY, 0.04);
    group.add(leftGlass);

    const leftStile = new THREE.Mesh(new THREE.BoxGeometry(sashBorder, innerH, sashDepth * 0.7), frameMat);
    leftStile.position.set(-sashBorder / 2, centerY, 0.04);
    group.add(leftStile);

    // Right Sash (offset backward)
    const rightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(paneW - sashBorder * 1.5, innerH - sashBorder * 1.5, 0.05),
      glassMat
    );
    rightGlass.position.set(innerW / 4, centerY, -0.04);
    group.add(rightGlass);

    const rightStile = new THREE.Mesh(new THREE.BoxGeometry(sashBorder, innerH, sashDepth * 0.7), frameMat);
    rightStile.position.set(sashBorder / 2, centerY, -0.04);
    group.add(rightStile);

    // Center lock handle
    const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.12), hardwareMat);
    lockMesh.position.set(0, centerY, 0.07);
    group.add(lockMesh);
  } else {
    // Standard / Classic Architectural Window with Meeting Rail and Muntin Grid
    // Center horizontal meeting rail
    const meetingRail = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, sashBorder * 1.25, sashDepth * 1.05),
      frameMat
    );
    meetingRail.position.set(0, centerY, 0);
    meetingRail.castShadow = true;
    group.add(meetingRail);

    // Sash lock in the center
    const sashLock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.14), hardwareMat);
    sashLock.position.set(0, centerY + 0.07, 0.03);
    group.add(sashLock);

    const upperH = (innerH - sashBorder) / 2;
    const lowerH = upperH;

    // Upper Glass Pane (sits slightly back in frame)
    const upperGlass = new THREE.Mesh(
      new THREE.BoxGeometry(innerW - sashBorder * 0.5, upperH - sashBorder * 0.5, 0.05),
      glassMat
    );
    upperGlass.position.set(0, centerY + upperH / 2 + 0.02, -0.03);
    group.add(upperGlass);

    // Lower Glass Pane (sits slightly forward in frame)
    const lowerGlass = new THREE.Mesh(
      new THREE.BoxGeometry(innerW - sashBorder * 0.5, lowerH - sashBorder * 0.5, 0.05),
      glassMat
    );
    lowerGlass.position.set(0, centerY - lowerH / 2 - 0.02, 0.03);
    group.add(lowerGlass);

    // Architectural Muntin Dividing Grid (Vertical and Horizontal bars)
    // Upper vertical divider
    const upperMullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, upperH, 0.07), frameMat);
    upperMullionV.position.set(0, centerY + upperH / 2 + 0.02, -0.03);
    group.add(upperMullionV);

    // Upper horizontal divider
    const upperMullionH = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.05, 0.07), frameMat);
    upperMullionH.position.set(0, centerY + upperH / 2 + 0.02, -0.03);
    group.add(upperMullionH);

    // Lower vertical divider
    const lowerMullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, lowerH, 0.07), frameMat);
    lowerMullionV.position.set(0, centerY - lowerH / 2 - 0.02, 0.03);
    group.add(lowerMullionV);

    // Lower horizontal divider
    const lowerMullionH = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.05, 0.07), frameMat);
    lowerMullionH.position.set(0, centerY - lowerH / 2 - 0.02, 0.03);
    group.add(lowerMullionH);
  }

  return group;
};

/**
 * Creates an authentic architectural 3D Door Mesh Assembly with door jambs, panel reliefs, and metallic handles
 */
export const createDoor3DMesh = (door: Door, wallThickness: number): THREE.Group => {
  const group = new THREE.Group();
  const width = door.width || 3.0;
  const height = door.height || 7.0;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Rich architectural warm wood or trim
    roughness: 0.45
  });

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.55
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Polished brass lever
    metalness: 0.85,
    roughness: 0.2
  });

  const jambThickness = 0.12;
  const jambDepth = wallThickness + 0.1;

  // Door Jamb - Top
  const topJamb = new THREE.Mesh(new THREE.BoxGeometry(width, jambThickness, jambDepth), frameMat);
  topJamb.position.set(0, height - jambThickness / 2, 0);
  topJamb.castShadow = true;
  group.add(topJamb);

  // Door Jamb - Left
  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(jambThickness, height, jambDepth), frameMat);
  leftJamb.position.set(-width / 2 + jambThickness / 2, height / 2, 0);
  leftJamb.castShadow = true;
  group.add(leftJamb);

  // Door Jamb - Right
  const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(jambThickness, height, jambDepth), frameMat);
  rightJamb.position.set(width / 2 - jambThickness / 2, height / 2, 0);
  rightJamb.castShadow = true;
  group.add(rightJamb);

  // Door Panel
  const panelW = width - jambThickness * 2;
  const panelH = height - jambThickness;
  const panelThick = wallThickness * 0.45;
  const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelThick), panelMat);
  panelMesh.position.set(0, panelH / 2, 0);
  panelMesh.castShadow = true;
  group.add(panelMesh);

  // Decorative Inset Bevel Panels (Classic 2-panel interior door styling)
  const insetMat = new THREE.MeshStandardMaterial({
    color: 0x3b1402,
    roughness: 0.6
  });
  const upperInset = new THREE.Mesh(
    new THREE.BoxGeometry(panelW * 0.75, panelH * 0.42, panelThick * 1.08),
    insetMat
  );
  upperInset.position.set(0, panelH * 0.68, 0);
  const lowerInset = new THREE.Mesh(
    new THREE.BoxGeometry(panelW * 0.75, panelH * 0.32, panelThick * 1.08),
    insetMat
  );
  lowerInset.position.set(0, panelH * 0.24, 0);
  group.add(upperInset, lowerInset);

  // Door Lever / Handle with rosette backplate
  const handleBackplate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.03), handleMat);
  handleBackplate.position.set(panelW * 0.38, 3.0, panelThick / 2 + 0.015);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.06), handleMat);
  lever.position.set(panelW * 0.38 - 0.08, 3.0, panelThick / 2 + 0.04);
  group.add(handleBackplate, lever);

  return group;
};
