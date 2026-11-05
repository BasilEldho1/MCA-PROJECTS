import * as THREE from 'three';
import { FurnitureItem } from '../../types/floorplan';

/**
 * Creates high-detail, realistic 3D architectural furniture and fixtures
 */
export const createFurniture3DMesh = (item: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();
  const baseColor = new THREE.Color(item.color || '#475569');

  // Core Material Palette
  const matStandard = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.45,
    metalness: 0.1
  });

  const matWoodDark = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.55,
    metalness: 0.05
  });

  const matWoodWarm = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.5,
    metalness: 0.05
  });

  const matWoodLight = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.6,
    metalness: 0.02
  });

  const matFabric = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.85,
    metalness: 0.0
  });

  const matFabricAccent = new THREE.MeshStandardMaterial({
    color: baseColor.clone().offsetHSL(0.08, 0.1, -0.05),
    roughness: 0.8,
    metalness: 0.0
  });

  const matLinenWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
    metalness: 0.0
  });

  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.15
  });

  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25
  });

  const matBlackMetal = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.35
  });

  const matPorcelain = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.05
  });

  const matMarble = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.2,
    metalness: 0.08
  });

  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xecfeff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.52,
    clearcoat: 1.0
  });

  const matMirror = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.95,
    roughness: 0.05
  });

  switch (item.catalogId) {
    // ──────────────────────────────────────────
    // BEDROOM
    // ──────────────────────────────────────────
    case 'single_bed':
    case 'double_bed':
    case 'king_bed': {
      const isDouble = item.catalogId !== 'single_bed';
      const w = item.width;
      const l = item.length;

      // 1. Bed Frame Base with Plinth
      const frameThick = 0.5;
      const frameGeo = new THREE.BoxGeometry(w, frameThick, l);
      const frameMesh = new THREE.Mesh(frameGeo, matWoodDark);
      frameMesh.position.y = 0.35;
      frameMesh.castShadow = true;
      group.add(frameMesh);

      // 4 Corner Legs
      const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8);
      const legPos = [
        [-w / 2 + 0.2, -l / 2 + 0.2],
        [w / 2 - 0.2, -l / 2 + 0.2],
        [-w / 2 + 0.2, l / 2 - 0.2],
        [w / 2 - 0.2, l / 2 - 0.2]
      ];
      legPos.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, matWoodDark);
        leg.position.set(lx, 0.2, lz);
        leg.castShadow = true;
        group.add(leg);
      });

      // 2. High Plush Mattress
      const matW = w * 0.94;
      const matL = l * 0.92;
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(matW, 0.9, matL), matLinenWhite);
      mattress.position.set(0, 1.05, 0.05);
      mattress.castShadow = true;
      group.add(mattress);

      // 3. Luxurious Duvet / Comforter (Folded lower 60%)
      const duvetL = matL * 0.65;
      const duvet = new THREE.Mesh(new THREE.BoxGeometry(matW * 1.02, 0.94, duvetL), matFabric);
      duvet.position.set(0, 1.08, (matL - duvetL) / 2);
      duvet.castShadow = true;
      group.add(duvet);

      // Duvet Fold Overlap
      const duvetFold = new THREE.Mesh(new THREE.BoxGeometry(matW * 1.02, 0.15, 0.6), matFabricAccent);
      duvetFold.position.set(0, 1.58, (matL - duvetL) / 2 - duvetL / 2 + 0.3);
      group.add(duvetFold);

      // 4. Tufted Padded Headboard
      const hbH = 3.2;
      const hbD = 0.4;
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, hbH, hbD), matWoodDark);
      headboard.position.set(0, hbH / 2, -l / 2 + hbD / 2);
      headboard.castShadow = true;
      group.add(headboard);

      // Upholstered Headboard Center Cushion
      const hbPad = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, hbH * 0.75, 0.15), matFabric);
      hbPad.position.set(0, hbH * 0.55, -l / 2 + hbD + 0.05);
      group.add(hbPad);

      // 5. Plush Bed Pillows
      const pillowW = isDouble ? w * 0.38 : w * 0.65;
      const pillowGeo = new THREE.BoxGeometry(pillowW, 0.35, 1.3);
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });

      if (isDouble) {
        // Left & Right pillows (primary)
        const p1 = new THREE.Mesh(pillowGeo, pillowMat);
        p1.position.set(-w * 0.23, 1.62, -l * 0.3);
        p1.rotation.x = -0.2;
        p1.castShadow = true;

        const p2 = new THREE.Mesh(pillowGeo, pillowMat);
        p2.position.set(w * 0.23, 1.62, -l * 0.3);
        p2.rotation.x = -0.2;
        p2.castShadow = true;

        // Front accent cushions
        const accPillow = new THREE.BoxGeometry(pillowW * 0.75, 0.3, 0.8);
        const p3 = new THREE.Mesh(accPillow, matFabricAccent);
        p3.position.set(-w * 0.23, 1.7, -l * 0.18);
        p3.rotation.x = -0.35;

        const p4 = new THREE.Mesh(accPillow, matFabricAccent);
        p4.position.set(w * 0.23, 1.7, -l * 0.18);
        p4.rotation.x = -0.35;

        group.add(p1, p2, p3, p4);
      } else {
        const p1 = new THREE.Mesh(pillowGeo, pillowMat);
        p1.position.set(0, 1.62, -l * 0.3);
        p1.rotation.x = -0.2;
        p1.castShadow = true;
        group.add(p1);
      }
      break;
    }

    case 'wardrobe': {
      const w = item.width;
      const h = item.height || 7.0;
      const d = item.length;

      // Carcass Cabinet Box
      const carcass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matWoodWarm);
      carcass.position.y = h / 2;
      carcass.castShadow = true;
      group.add(carcass);

      // Top Crown Trim
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.2, d + 0.15), matWoodDark);
      crown.position.y = h + 0.1;
      group.add(crown);

      // 2 Shaker Panel Doors
      const doorW = (w - 0.1) / 2;
      const doorH = h * 0.94;
      const doorThick = 0.08;

      [-1, 1].forEach(side => {
        const door = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.04, doorH, doorThick), matWoodWarm);
        door.position.set(side * (doorW / 2 + 0.02), h / 2, d / 2 + 0.02);
        group.add(door);

        // Recessed Panel Relief
        const panelRelief = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.75, doorH * 0.85, 0.02), matWoodDark);
        panelRelief.position.set(side * (doorW / 2 + 0.02), h / 2, d / 2 + 0.04);
        group.add(panelRelief);

        // Modern Vertical Bar Handles
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.06), matBrass);
        handle.position.set(side * 0.15, h / 2, d / 2 + 0.08);
        group.add(handle);
      });
      break;
    }

    case 'bedside_table': {
      const w = item.width;
      const h = item.height || 2.0;
      const d = item.length;

      // Cabinet box
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.65, d), matWoodDark);
      box.position.y = h * 0.675;
      box.castShadow = true;
      group.add(box);

      // 4 Metal Spindle Legs
      const legGeo = new THREE.CylinderGeometry(0.04, 0.03, h * 0.35, 8);
      const legX = w / 2 - 0.15;
      const legZ = d / 2 - 0.15;
      [
        [-legX, -legZ],
        [legX, -legZ],
        [-legX, legZ],
        [legX, legZ]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, matBrass);
        leg.position.set(lx, h * 0.175, lz);
        group.add(leg);
      });

      // 2 Drawers with Brass Knobs
      [-1, 1].forEach((level, idx) => {
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matBrass);
        knob.position.set(0, h * 0.55 + idx * (h * 0.25), d / 2 + 0.03);
        group.add(knob);
      });

      // Tabletop Lamp
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16), matBrass);
      lampBase.position.set(0, h + 0.05, 0);
      const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.5, 16), matLinenWhite);
      lampShade.position.set(0, h + 0.45, 0);
      group.add(lampBase, lampShade);
      break;
    }

    case 'dressing_table': {
      const w = item.width;
      const d = item.length;
      const tableH = 2.6;
      const mirrorH = 2.8;

      // Table Top
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), matWoodWarm);
      top.position.y = tableH;
      group.add(top);

      // Dual Drawer Cabinet under top
      const drawers = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.6, d * 0.9), matWoodDark);
      drawers.position.y = tableH - 0.35;
      group.add(drawers);

      // 4 Slender Legs
      const legGeo = new THREE.CylinderGeometry(0.06, 0.04, tableH - 0.65, 8);
      [
        [-w / 2 + 0.2, -d / 2 + 0.2],
        [w / 2 - 0.2, -d / 2 + 0.2],
        [-w / 2 + 0.2, d / 2 - 0.2],
        [w / 2 - 0.2, d / 2 - 0.2]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, matBrass);
        leg.position.set(lx, (tableH - 0.65) / 2, lz);
        group.add(leg);
      });

      // Upright Framed Mirror
      const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, mirrorH, 0.1), matBrass);
      mirrorFrame.position.set(0, tableH + mirrorH / 2 + 0.1, -d / 2 + 0.1);
      const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, mirrorH * 0.88, 0.05), matMirror);
      mirrorGlass.position.set(0, tableH + mirrorH / 2 + 0.1, -d / 2 + 0.14);
      group.add(mirrorFrame, mirrorGlass);
      break;
    }

    // ──────────────────────────────────────────
    // LIVING ROOM
    // ──────────────────────────────────────────
    case 'sofa_3seater':
    case 'modern_sofa':
    case 'armchair': {
      const isArmchair = item.catalogId === 'armchair';
      const w = item.width;
      const d = item.length;
      const seatH = 1.4;

      // 1. Sofa Main Base Plinth with angled legs
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), matWoodDark);
      plinth.position.y = 0.5;
      plinth.castShadow = true;
      group.add(plinth);

      // 4 Tapered Modern Legs
      const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.45, 8);
      [
        [-w / 2 + 0.3, -d / 2 + 0.3],
        [w / 2 - 0.3, -d / 2 + 0.3],
        [-w / 2 + 0.3, d / 2 - 0.3],
        [w / 2 - 0.3, d / 2 - 0.3]
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, matWoodDark);
        leg.position.set(lx, 0.22, lz);
        group.add(leg);
      });

      // 2. Thick Individual Seat Cushions
      const numCushions = isArmchair ? 1 : 3;
      const armW = 0.65;
      const availableW = w - armW * 2;
      const cushionW = availableW / numCushions;
      const cushionD = d * 0.72;

      for (let i = 0; i < numCushions; i++) {
        const posX = -availableW / 2 + (i + 0.5) * cushionW;
        const seatCushion = new THREE.Mesh(
          new THREE.BoxGeometry(cushionW - 0.06, 0.65, cushionD),
          matFabric
        );
        seatCushion.position.set(posX, 1.05, 0.1);
        seatCushion.castShadow = true;
        group.add(seatCushion);

        // Plush Back Cushion
        const backCushion = new THREE.Mesh(
          new THREE.BoxGeometry(cushionW - 0.06, 1.35, 0.45),
          matFabric
        );
        backCushion.position.set(posX, 1.85, -d / 2 + 0.35);
        backCushion.rotation.x = -0.15;
        backCushion.castShadow = true;
        group.add(backCushion);
      }

      // 3. Low Armrests
      [-1, 1].forEach(side => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(armW, 1.3, d * 0.95), matFabric);
        arm.position.set(side * (w / 2 - armW / 2), 1.25, 0);
        arm.castShadow = true;
        group.add(arm);
      });

      // 4. Accent Throw Pillows (Lumbar Cushions)
      if (!isArmchair) {
        [-1, 1].forEach(side => {
          const throwPillow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.25), matFabricAccent);
          throwPillow.position.set(side * (w / 2 - armW - 0.35), 1.5, -0.15);
          throwPillow.rotation.y = side * 0.3;
          throwPillow.rotation.z = -side * 0.2;
          group.add(throwPillow);
        });
      }
      break;
    }

    case 'sofa_lshape': {
      const w = item.width;
      const d = item.length;
      const mainW = w * 0.65;
      const chaiseW = w - mainW;

      // Main Section Base
      const mainBase = new THREE.Mesh(new THREE.BoxGeometry(mainW, 0.5, d * 0.55), matFabric);
      mainBase.position.set(-w / 2 + mainW / 2, 0.5, -d * 0.2);
      mainBase.castShadow = true;

      // Chaise Lounge Section
      const chaiseBase = new THREE.Mesh(new THREE.BoxGeometry(chaiseW, 0.5, d), matFabric);
      chaiseBase.position.set(w / 2 - chaiseW / 2, 0.5, 0);
      chaiseBase.castShadow = true;
      group.add(mainBase, chaiseBase);

      // Backrests
      const backH = 1.8;
      const mainBack = new THREE.Mesh(new THREE.BoxGeometry(w, backH, 0.5), matFabric);
      mainBack.position.set(0, 1.5, -d / 2 + 0.25);
      mainBack.castShadow = true;
      group.add(mainBack);

      // Cushions
      const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(mainW / 2 - 0.08, 0.6, d * 0.48), matFabricAccent);
      cushion1.position.set(-w / 2 + mainW * 0.25, 1.0, -d * 0.18);
      const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(mainW / 2 - 0.08, 0.6, d * 0.48), matFabricAccent);
      cushion2.position.set(-w / 2 + mainW * 0.75, 1.0, -d * 0.18);
      const chaiseCushion = new THREE.Mesh(new THREE.BoxGeometry(chaiseW - 0.08, 0.6, d * 0.85), matFabricAccent);
      chaiseCushion.position.set(w / 2 - chaiseW / 2, 1.0, 0.05);
      group.add(cushion1, cushion2, chaiseCushion);
      break;
    }

    case 'coffee_table': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 1.5;

      // Thick Wood / Marble Tabletop
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), matMarble);
      top.position.y = h;
      top.castShadow = true;
      group.add(top);

      // Brass / Black Frame Legs with Crossbars
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, h - 0.12, 8);
      const lx = w / 2 - 0.25;
      const lz = d / 2 - 0.25;
      [
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz]
      ].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeo, matBrass);
        leg.position.set(x, (h - 0.12) / 2, z);
        leg.castShadow = true;
        group.add(leg);
      });

      // Lower Storage Shelf
      const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.06, d * 0.85), matWoodDark);
      lowerShelf.position.y = h * 0.35;
      group.add(lowerShelf);
      break;
    }

    case 'tv_stand': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 2.0;

      // Low Credenza Cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matWoodDark);
      cabinet.position.y = h / 2;
      cabinet.castShadow = true;
      group.add(cabinet);

      // Cabinet Door Divisions & Brass Handles
      const numDoors = 3;
      const doorW = w / numDoors;
      for (let i = 0; i < numDoors; i++) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), matBrass);
        handle.position.set(-w / 2 + (i + 0.5) * doorW, h / 2, d / 2 + 0.02);
        group.add(handle);
      }

      // Ultra-Thin Widescreen OLED TV on Stand
      const tvW = w * 0.85;
      const tvH = 2.4;
      // TV Base
      const tvBase = new THREE.Mesh(new THREE.BoxGeometry(tvW * 0.4, 0.05, 0.6), matBlackMetal);
      tvBase.position.set(0, h + 0.03, 0);
      // TV Stem
      const tvStem = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), matBlackMetal);
      tvStem.position.set(0, h + 0.2, 0);
      // TV Screen Panel
      const tvPanel = new THREE.Mesh(new THREE.BoxGeometry(tvW, tvH, 0.08), matBlackMetal);
      tvPanel.position.set(0, h + tvH / 2 + 0.4, 0);
      tvPanel.castShadow = true;
      // Glowing Screen Glass
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.85
      });
      const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(tvW * 0.96, tvH * 0.94, 0.02), screenMat);
      tvScreen.position.set(0, h + tvH / 2 + 0.4, 0.045);

      group.add(tvBase, tvStem, tvPanel, tvScreen);
      break;
    }

    case 'bookshelf': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 6.5;

      // Outer Frame
      const outerMat = matWoodDark;
      const sideThick = 0.1;
      const leftSide = new THREE.Mesh(new THREE.BoxGeometry(sideThick, h, d), outerMat);
      leftSide.position.set(-w / 2 + sideThick / 2, h / 2, 0);
      const rightSide = new THREE.Mesh(new THREE.BoxGeometry(sideThick, h, d), outerMat);
      rightSide.position.set(w / 2 - sideThick / 2, h / 2, 0);
      const backBoard = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), outerMat);
      backBoard.position.set(0, h / 2, -d / 2 + 0.025);
      group.add(leftSide, rightSide, backBoard);

      // 5 Shelves with Books
      const numShelves = 5;
      const bookColors = [0x991b1b, 0x1e40af, 0x166534, 0x854d0e, 0x374151];

      for (let s = 0; s < numShelves; s++) {
        const shelfY = (s + 0.5) * (h / numShelves);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - sideThick * 2, 0.08, d), outerMat);
        shelf.position.set(0, shelfY, 0);
        group.add(shelf);

        // Books on Shelf
        const bookCount = 6 + (s % 3);
        const startX = -w / 2 + sideThick + 0.2;
        for (let b = 0; b < bookCount; b++) {
          const bookH = 0.7 + (b % 4) * 0.12;
          const bookW = 0.15;
          const bookD = d * 0.7;
          const bookMat = new THREE.MeshStandardMaterial({
            color: bookColors[(s + b) % bookColors.length],
            roughness: 0.6
          });
          const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bookW, bookH, bookD), bookMat);
          bookMesh.position.set(startX + b * 0.2, shelfY + bookH / 2 + 0.04, 0);
          group.add(bookMesh);
        }
      }
      break;
    }

    // ──────────────────────────────────────────
    // DINING
    // ──────────────────────────────────────────
    case 'dining_table_4':
    case 'dining_table_6': {
      const isSix = item.catalogId === 'dining_table_6';
      const w = item.width;
      const d = item.length;
      const h = item.height || 2.6;

      // 1. Solid Hardwood Tabletop with Beveled Chamfer
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), matWoodWarm);
      top.position.y = h;
      top.castShadow = true;
      group.add(top);

      // 4 Turned / Tapered Table Legs
      const legGeo = new THREE.CylinderGeometry(0.12, 0.08, h - 0.14, 8);
      const lx = w / 2 - 0.3;
      const lz = d / 2 - 0.3;
      [
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz]
      ].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeo, matWoodDark);
        leg.position.set(x, (h - 0.14) / 2, z);
        leg.castShadow = true;
        group.add(leg);
      });

      // 2. Surrounding Dining Chairs with Cushions
      const chairPositions: { x: number; z: number; rotY: number }[] = [];
      if (isSix) {
        chairPositions.push(
          { x: -w * 0.28, z: d / 2 + 0.45, rotY: Math.PI },
          { x: 0, z: d / 2 + 0.45, rotY: Math.PI },
          { x: w * 0.28, z: d / 2 + 0.45, rotY: Math.PI },
          { x: -w * 0.28, z: -d / 2 - 0.45, rotY: 0 },
          { x: 0, z: -d / 2 - 0.45, rotY: 0 },
          { x: w * 0.28, z: -d / 2 - 0.45, rotY: 0 }
        );
      } else {
        chairPositions.push(
          { x: -w * 0.22, z: d / 2 + 0.45, rotY: Math.PI },
          { x: w * 0.22, z: d / 2 + 0.45, rotY: Math.PI },
          { x: -w * 0.22, z: -d / 2 - 0.45, rotY: 0 },
          { x: w * 0.22, z: -d / 2 - 0.45, rotY: 0 }
        );
      }

      chairPositions.forEach(cp => {
        const chairGroup = new THREE.Group();
        // Seat cushion
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.2), matFabric);
        seat.position.y = 1.5;
        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), matWoodWarm);
        back.position.set(0, 2.1, -0.55);
        // 4 Legs
        const cLegGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.4, 6);
        [
          [-0.45, -0.45],
          [0.45, -0.45],
          [-0.45, 0.45],
          [0.45, 0.45]
        ].forEach(([cx, cz]) => {
          const cl = new THREE.Mesh(cLegGeo, matWoodDark);
          cl.position.set(cx, 0.7, cz);
          chairGroup.add(cl);
        });

        chairGroup.add(seat, back);
        chairGroup.position.set(cp.x, 0, cp.z);
        chairGroup.rotation.y = cp.rotY;
        group.add(chairGroup);
      });
      break;
    }

    // ──────────────────────────────────────────
    // KITCHEN
    // ──────────────────────────────────────────
    case 'kitchen_counter':
    case 'kitchen_island': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 3.0;

      // Base Cabinet with Recessed Plinth (Toe Kick)
      const toeKick = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.3, d * 0.88), matBlackMetal);
      toeKick.position.set(0, 0.15, 0);
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h - 0.45, d * 0.94), matStandard);
      cabinet.position.set(0, (h - 0.45) / 2 + 0.3, 0);
      cabinet.castShadow = true;
      group.add(toeKick, cabinet);

      // Shaker Doors with Chrome Pulls
      const numUnits = Math.max(2, Math.round(w / 2.0));
      const unitW = (w * 0.96) / numUnits;
      for (let i = 0; i < numUnits; i++) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.06), matChrome);
        handle.position.set(-w / 2 + (i + 0.5) * unitW, h - 0.4, d / 2 + 0.02);
        group.add(handle);
      }

      // Overhanging Polished Marble / Quartz Countertop
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), matMarble);
      counterTop.position.set(0, h + 0.075, 0);
      counterTop.castShadow = true;
      group.add(counterTop);
      break;
    }

    case 'kitchen_sink': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 3.0;

      // Counter base
      const counter = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matMarble);
      counter.position.y = h / 2;
      group.add(counter);

      // Stainless Steel Double Sink Basins
      [-0.45, 0.45].forEach(offsetX => {
        const basin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 1.1), matChrome);
        basin.position.set(offsetX, h - 0.18, 0);
        group.add(basin);
      });

      // Arched Gooseneck Chrome Faucet
      const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8), matChrome);
      faucetBase.position.set(0, h + 0.1, -0.6);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), matChrome);
      neck.position.set(0, h + 0.55, -0.6);
      const spout = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.45), matChrome);
      spout.position.set(0, h + 0.95, -0.4);
      group.add(faucetBase, neck, spout);
      break;
    }

    case 'refrigerator': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 6.2;

      // Stainless Steel Fridge Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matChrome);
      body.position.y = h / 2;
      body.castShadow = true;
      group.add(body);

      // French Door Split Line
      const upperH = h * 0.62;
      const lowerH = h - upperH;

      // Vertical Handles
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.8, 0.08), matBlackMetal);
      h1.position.set(-0.15, h - upperH / 2, d / 2 + 0.06);
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.8, 0.08), matBlackMetal);
      h2.position.set(0.15, h - upperH / 2, d / 2 + 0.06);
      // Freezer Drawer Handle
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.08), matBlackMetal);
      h3.position.set(0, lowerH * 0.75, d / 2 + 0.06);
      group.add(h1, h2, h3);

      // Water/Ice Dispenser Panel on Left Door
      const dispenser = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.04), matBlackMetal);
      dispenser.position.set(-w * 0.25, h * 0.65, d / 2 + 0.02);
      group.add(dispenser);
      break;
    }

    case 'stove_oven': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 3.0;

      // Range Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matChrome);
      body.position.y = h / 2;
      group.add(body);

      // 4 Black Stovetop Burners
      const burnerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16);
      [
        [-w * 0.25, -d * 0.25],
        [w * 0.25, -d * 0.25],
        [-w * 0.25, d * 0.25],
        [w * 0.25, d * 0.25]
      ].forEach(([bx, bz]) => {
        const burner = new THREE.Mesh(burnerGeo, matBlackMetal);
        burner.position.set(bx, h + 0.02, bz);
        group.add(burner);
      });

      // Front Oven Door with Glass Window
      const ovenGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, h * 0.45, 0.04), matBlackMetal);
      ovenGlass.position.set(0, h * 0.4, d / 2 + 0.02);
      const ovenHandle = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.06, 0.1), matChrome);
      ovenHandle.position.set(0, h * 0.68, d / 2 + 0.08);
      group.add(ovenGlass, ovenHandle);
      break;
    }

    // ──────────────────────────────────────────
    // BATHROOM
    // ──────────────────────────────────────────
    case 'toilet': {
      const w = item.width;
      const d = item.length;

      // Cistern Water Tank with Flush Button
      const tankH = 1.4;
      const tank = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, tankH, 0.6), matPorcelain);
      tank.position.set(0, 1.8, -d / 2 + 0.3);
      const flushButton = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8), matChrome);
      flushButton.position.set(0, 1.8 + tankH / 2 + 0.02, -d / 2 + 0.3);
      group.add(tank, flushButton);

      // Ergonomic Bowl Base
      const bowlPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 16), matPorcelain);
      bowlPedestal.position.set(0, 0.4, 0.1);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, 0.32, 0.6, 16), matPorcelain);
      bowl.position.set(0, 0.9, 0.15);
      // Toilet Seat Lid
      const seat = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, 0.08, d * 0.58), matLinenWhite);
      seat.position.set(0, 1.24, 0.2);
      group.add(bowlPedestal, bowl, seat);
      break;
    }

    case 'wash_basin': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 2.8;

      // Vanity Cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.85, d), matWoodWarm);
      cabinet.position.y = (h * 0.85) / 2;
      group.add(cabinet);

      // Porcelain Basin Vessel
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.35, w * 0.25, 0.4, 16), matPorcelain);
      basin.position.set(0, h + 0.2, 0);
      // Chrome Faucet
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), matChrome);
      tap.position.set(0, h + 0.45, -d * 0.3);
      group.add(basin, tap);

      // Framed Vanity Wall Mirror
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 2.0, 0.08), matMirror);
      mirror.position.set(0, h + 1.8, -d / 2);
      group.add(mirror);
      break;
    }

    case 'bathtub': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 2.0;

      // Smooth Ergonomic Oval Soaking Tub
      const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.48, d * 0.42, h, 24), matPorcelain);
      tubOuter.scale.set(w / d, 1, 1);
      tubOuter.position.y = h / 2;
      tubOuter.castShadow = true;

      // Interior Tub Cavity
      const tubInner = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.42, d * 0.36, h * 0.85, 24), matPorcelain);
      tubInner.scale.set(w / d, 1, 1);
      tubInner.position.y = h * 0.55;

      // Freestanding Chrome Tub Filler Faucet
      const filler = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h + 0.8, 8), matChrome);
      filler.position.set(-w / 2 + 0.2, (h + 0.8) / 2, 0);
      group.add(tubOuter, tubInner, filler);
      break;
    }

    case 'shower_cabin': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 6.8;

      // White Acrylic Shower Tray Base
      const tray = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), matPorcelain);
      tray.position.y = 0.125;
      group.add(tray);

      // Corner Tempered Glass Enclosure Panels
      const glassH = h - 0.25;
      const glass1 = new THREE.Mesh(new THREE.BoxGeometry(w, glassH, 0.06), matGlass);
      glass1.position.set(0, glassH / 2 + 0.25, d / 2 - 0.03);
      const glass2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, glassH, d), matGlass);
      glass2.position.set(w / 2 - 0.03, glassH / 2 + 0.25, 0);
      group.add(glass1, glass2);

      // Chrome Frame Corner Post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, glassH, 0.1), matChrome);
      post.position.set(w / 2, glassH / 2 + 0.25, d / 2);

      // Overhead Rainfall Shower Head
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), matChrome);
      pipe.position.set(-w / 2 + 0.4, h - 0.4, -d / 2 + 0.4);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), matChrome);
      head.position.set(-w / 2 + 0.4, h - 0.45, -d / 2 + 0.4);
      group.add(post, pipe, head);
      break;
    }

    // ──────────────────────────────────────────
    // OFFICE & STUDY
    // ──────────────────────────────────────────
    case 'study_desk': {
      const w = item.width;
      const d = item.length;
      const h = item.height || 2.5;

      // Wooden Desktop
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), matWoodWarm);
      deskTop.position.y = h;
      deskTop.castShadow = true;
      group.add(deskTop);

      // Side 3-Drawer Pedestal
      const pedW = w * 0.32;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(pedW, h - 0.12, d * 0.9), matWoodDark);
      ped.position.set(w / 2 - pedW / 2 - 0.1, (h - 0.12) / 2, 0);
      group.add(ped);

      // Left Metal Frame Legs
      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, h - 0.12, 8);
      [-d / 2 + 0.2, d / 2 - 0.2].forEach(lz => {
        const leg = new THREE.Mesh(legGeo, matBlackMetal);
        leg.position.set(-w / 2 + 0.2, (h - 0.12) / 2, lz);
        group.add(leg);
      });

      // Sleek Open Laptop on Desk
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.8), matBlackMetal);
      laptopBase.position.set(-0.2, h + 0.08, 0.1);
      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.03), matBlackMetal);
      laptopScreen.position.set(-0.2, h + 0.45, -0.28);
      laptopScreen.rotation.x = 0.2;
      group.add(laptopBase, laptopScreen);
      break;
    }

    case 'office_chair': {
      // 5-Star Caster Wheel Base
      const starRadius = 0.8;
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, starRadius), matChrome);
        spoke.position.set(Math.sin(ang) * (starRadius / 2), 0.15, Math.cos(ang) * (starRadius / 2));
        spoke.rotation.y = -ang;
        group.add(spoke);
      }

      // Hydraulic Stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), matChrome);
      stem.position.y = 0.55;
      group.add(stem);

      // Ergonomic Contoured Mesh Seat & Back
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), matBlackMetal);
      seat.position.y = 1.0;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.15), matBlackMetal);
      back.position.set(0, 1.9, -0.65);
      back.rotation.x = -0.1;
      group.add(seat, back);

      // Armrests
      [-0.75, 0.75].forEach(side => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.8), matBlackMetal);
        arm.position.set(side, 1.45, -0.1);
        group.add(arm);
      });
      break;
    }

    // ──────────────────────────────────────────
    // MISC & DECOR
    // ──────────────────────────────────────────
    case 'potted_plant': {
      const w = item.width;
      const h = item.height || 3.5;

      // Minimalist Terracotta / Ceramic Planter Pot
      const potH = h * 0.42;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.32, potH, 16), matPorcelain);
      pot.position.y = potH / 2;
      pot.castShadow = true;

      // Dark Soil Surface
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.42, 0.05, 16), matWoodDark);
      soil.position.y = potH - 0.02;

      // Organic Lush Foliage (Layered Leaves)
      const plantGroup = new THREE.Group();
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.6,
        metalness: 0.05
      });
      const numLeaves = 8;
      for (let i = 0; i < numLeaves; i++) {
        const ang = (i * Math.PI * 2) / numLeaves;
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(w * 0.32, 1), leafMat);
        leaf.scale.set(0.6, 1.2, 0.3);
        leaf.position.set(Math.sin(ang) * (w * 0.28), potH + 0.4 + (i % 3) * 0.25, Math.cos(ang) * (w * 0.28));
        leaf.rotation.set((i % 2) * 0.3, ang, (i % 3) * 0.2);
        leaf.castShadow = true;
        plantGroup.add(leaf);
      }

      group.add(pot, soil, plantGroup);
      break;
    }

    case 'floor_lamp': {
      const h = item.height || 5.5;

      // Heavy Weighted Base Plinth
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.08, 16), matBrass);
      base.position.y = 0.04;
      group.add(base);

      // Slender Brass Rod Stem
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h * 0.82, 8), matBrass);
      rod.position.y = (h * 0.82) / 2;
      group.add(rod);

      // Elegant Drum Shade
      const shadeH = 1.1;
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, shadeH, 16, 1, true), matLinenWhite);
      shade.position.y = h - shadeH / 2;
      shade.castShadow = true;
      group.add(shade);

      // Warm Cozy Ambient Bulb Light
      const bulbLight = new THREE.PointLight(0xfffbeb, 1.2, 16);
      bulbLight.position.y = h - shadeH / 2;
      group.add(bulbLight);
      break;
    }

    case 'straight_stairs': {
      const stepsCount = 12;
      const stepH = item.height / stepsCount;
      const stepL = item.length / stepsCount;

      for (let i = 0; i < stepsCount; i++) {
        // Wooden Step Tread
        const tread = new THREE.Mesh(new THREE.BoxGeometry(item.width, 0.1, stepL * 1.05), matWoodWarm);
        tread.position.set(0, (i + 1) * stepH, (i + 0.5) * stepL - item.length / 2);
        tread.castShadow = true;

        // White Riser
        const riser = new THREE.Mesh(new THREE.BoxGeometry(item.width, stepH, 0.06), matLinenWhite);
        riser.position.set(0, (i + 0.5) * stepH, i * stepL - item.length / 2);
        group.add(tread, riser);
      }

      // Handrail on side
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, item.length * 1.15), matWoodDark);
      rail.position.set(item.width / 2 - 0.1, item.height / 2 + 2.5, 0);
      rail.rotation.x = Math.atan2(item.height, item.length);
      group.add(rail);
      break;
    }

    default: {
      // Elegant architectural case-good fallback
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(item.width, item.height, item.length),
        matWoodWarm
      );
      box.position.y = item.height / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      break;
    }
  }

  // Set world position & rotation
  group.position.set(item.x, item.z || 0, item.y);
  group.rotation.y = -(item.rotation * Math.PI) / 180;

  return group;
};
