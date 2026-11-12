import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RotateCw, RefreshCw, Eye } from 'lucide-react';

export default function Car3DViewer({ car, neonColorHex = '#00F0FF' }) {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [modelType, setModelType] = useState('procedural');

  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const neonLightRef = useRef(null);
  const underglowMeshRef = useRef(null);

  // Determine car paint color from car data
  const getCarColor = (car) => {
    const raw = (car?.color || '').toLowerCase();
    const brand = (car?.brand || '').toLowerCase();

    if (raw.includes('rojo') || raw.includes('rosso') || brand.includes('ferrari')) return 0xdf1111;
    if (raw.includes('verde') || raw.includes('green') || raw.includes('highland')) return 0x1b4332;
    if (raw.includes('azul') || raw.includes('blue') || brand.includes('bmw')) return 0x005bbb;
    if (raw.includes('blanco') || raw.includes('white')) return 0xf3f4f6;
    if (raw.includes('amarillo') || raw.includes('yellow')) return 0xfacc15;
    if (raw.includes('negro') || raw.includes('black')) return 0x18181b;
    return 0xe5e7eb;
  };

  // Build tailor-made procedural 3D model for cars without a .glb file
  const buildVehicleSpecificModel = (car) => {
    const carGroup = new THREE.Group();
    const brand = (car?.brand || '').toLowerCase();
    const modelName = (car?.model || car?.name || '').toLowerCase();
    const paintColor = getCarColor(car);

    // High gloss clearcoat paint
    const paintMaterial = new THREE.MeshPhysicalMaterial({
      color: paintColor,
      metalness: 0.75,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.85
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0f,
      metalness: 0.9,
      roughness: 0.05,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 0.98,
      roughness: 0.05
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.9,
      metalness: 0.1
    });

    const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // --- CASE 1: FORD MUSTANG 1967 FASTBACK (Classic American Muscle) ---
    if (brand.includes('ford') || modelName.includes('mustang')) {
      // Long muscular lower chassis with recessed sides
      const chassisGeo = new THREE.BoxGeometry(2.15, 0.52, 4.6);
      const chassis = new THREE.Mesh(chassisGeo, paintMaterial);
      chassis.position.y = 0.54;
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      carGroup.add(chassis);

      // Fastback Sloping Cabin
      const cabinGeo = new THREE.BoxGeometry(1.65, 0.45, 2.2);
      const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
      cabin.position.set(0, 0.96, -0.3);
      carGroup.add(cabin);

      // Long Muscle Car Hood with twin power scoops
      const hoodGeo = new THREE.BoxGeometry(1.95, 0.12, 1.6);
      const hood = new THREE.Mesh(hoodGeo, paintMaterial);
      hood.position.set(0, 0.68, 1.4);
      hood.rotation.x = -0.04;
      carGroup.add(hood);

      // Dual Hood Air Scoops
      const scoopGeo = new THREE.BoxGeometry(0.28, 0.06, 0.45);
      const leftScoop = new THREE.Mesh(scoopGeo, carbonMaterial);
      leftScoop.position.set(-0.35, 0.77, 1.4);
      const rightScoop = new THREE.Mesh(scoopGeo, carbonMaterial);
      rightScoop.position.set(0.35, 0.77, 1.4);
      carGroup.add(leftScoop);
      carGroup.add(rightScoop);

      // Chrome Classic Bumper in Front & Deep Chrome Grille
      const frontBumperGeo = new THREE.BoxGeometry(2.18, 0.14, 0.18);
      const frontBumper = new THREE.Mesh(frontBumperGeo, chromeMaterial);
      frontBumper.position.set(0, 0.35, 2.32);
      carGroup.add(frontBumper);

      // Round Classic Dual Headlights
      const roundHeadlightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
      roundHeadlightGeo.rotateX(Math.PI / 2);
      const hlLeft = new THREE.Mesh(roundHeadlightGeo, ledMaterial);
      hlLeft.position.set(-0.72, 0.6, 2.31);
      const hlRight = new THREE.Mesh(roundHeadlightGeo, ledMaterial);
      hlRight.position.set(0.72, 0.6, 2.31);
      carGroup.add(hlLeft);
      carGroup.add(hlRight);

      // Iconic 1967 Mustang Triple Vertical Taillights!
      for (let i = -1; i <= 1; i++) {
        const barGeo = new THREE.BoxGeometry(0.06, 0.22, 0.04);
        const barL = new THREE.Mesh(barGeo, taillightMaterial);
        barL.position.set(-0.75 + (i * 0.1), 0.6, -2.31);
        const barR = new THREE.Mesh(barGeo, taillightMaterial);
        barR.position.set(0.75 + (i * 0.1), 0.6, -2.31);
        carGroup.add(barL);
        carGroup.add(barR);
      }

      // Classic Chrome Rear Bumper
      const rearBumperGeo = new THREE.BoxGeometry(2.18, 0.14, 0.18);
      const rearBumper = new THREE.Mesh(rearBumperGeo, chromeMaterial);
      rearBumper.position.set(0, 0.35, -2.32);
      carGroup.add(rearBumper);

      // 4 Wheels: Deep-dish classic chrome rims
      const wheelPos = [[-1.05, 0.38, 1.3], [1.05, 0.38, 1.3], [-1.05, 0.38, -1.3], [1.05, 0.38, -1.3]];
      wheelPos.forEach(([x, y, z]) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(x, y, z);
        const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24);
        tireGeo.rotateZ(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeo, tireMaterial);
        wGroup.add(tire);
        const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.31, 16);
        rimGeo.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, chromeMaterial);
        wGroup.add(rim);
        carGroup.add(wGroup);
      });

      return carGroup;
    }

    // --- CASE 2: BMW M3 (G80) - German High Performance Sport Sedan ---
    if (brand.includes('bmw') || modelName.includes('m3')) {
      const chassisGeo = new THREE.BoxGeometry(2.1, 0.5, 4.4);
      const chassis = new THREE.Mesh(chassisGeo, paintMaterial);
      chassis.position.y = 0.52;
      chassis.castShadow = true;
      carGroup.add(chassis);

      // Sedan 4-door greenhouse cabin
      const cabinGeo = new THREE.BoxGeometry(1.68, 0.44, 2.4);
      const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
      cabin.position.set(0, 0.94, -0.1);
      carGroup.add(cabin);

      // Carbon M-Power Roof
      const roofGeo = new THREE.BoxGeometry(1.62, 0.04, 2.1);
      const roof = new THREE.Mesh(roofGeo, carbonMaterial);
      roof.position.set(0, 1.16, -0.1);
      carGroup.add(roof);

      // Iconic BMW Dual Kidney Grille in Front
      const kidneyGeo = new THREE.BoxGeometry(0.25, 0.32, 0.08);
      const leftKidney = new THREE.Mesh(kidneyGeo, carbonMaterial);
      leftKidney.position.set(-0.16, 0.45, 2.21);
      const rightKidney = new THREE.Mesh(kidneyGeo, carbonMaterial);
      rightKidney.position.set(0.16, 0.45, 2.21);
      carGroup.add(leftKidney);
      carGroup.add(rightKidney);

      // Angular BMW Laser Headlights
      const hlGeo = new THREE.BoxGeometry(0.42, 0.12, 0.05);
      const hlL = new THREE.Mesh(hlGeo, ledMaterial);
      hlL.position.set(-0.75, 0.58, 2.2);
      const hlR = new THREE.Mesh(hlGeo, ledMaterial);
      hlR.position.set(0.75, 0.58, 2.2);
      carGroup.add(hlL);
      carGroup.add(hlR);

      // M Carbon Quad Exhausts (4 pipes in the back)
      for (let i = 0; i < 4; i++) {
        const offset = (i < 2 ? -0.7 : 0.5) + ((i % 2) * 0.18);
        const exGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 16);
        exGeo.rotateX(Math.PI / 2);
        const ex = new THREE.Mesh(exGeo, chromeMaterial);
        ex.position.set(offset, 0.28, -2.2);
        carGroup.add(ex);
      }

      // 4 Wheels
      const wheelPos = [[-1.02, 0.36, 1.25], [1.02, 0.36, 1.25], [-1.02, 0.36, -1.25], [1.02, 0.36, -1.25]];
      wheelPos.forEach(([x, y, z]) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(x, y, z);
        const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24);
        tireGeo.rotateZ(Math.PI / 2);
        wGroup.add(new THREE.Mesh(tireGeo, tireMaterial));
        const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16);
        rimGeo.rotateZ(Math.PI / 2);
        wGroup.add(new THREE.Mesh(rimGeo, carbonMaterial));
        carGroup.add(wGroup);
      });

      return carGroup;
    }

    // --- CASE 3: TOYOTA COROLLA / STANDARD COMPACT URBAN SEDAN ---
    const chassisGeo = new THREE.BoxGeometry(1.95, 0.48, 4.3);
    const chassis = new THREE.Mesh(chassisGeo, paintMaterial);
    chassis.position.y = 0.5;
    carGroup.add(chassis);

    const cabinGeo = new THREE.BoxGeometry(1.58, 0.46, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.94, -0.1);
    carGroup.add(cabin);

    // Horizontal Modern LED Headlights
    const hlGeo = new THREE.BoxGeometry(0.4, 0.08, 0.05);
    const hlL = new THREE.Mesh(hlGeo, ledMaterial);
    hlL.position.set(-0.68, 0.54, 2.15);
    const hlR = new THREE.Mesh(hlGeo, ledMaterial);
    hlR.position.set(0.68, 0.54, 2.15);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // 4 Wheels
    const wheelPos = [[-0.96, 0.34, 1.2], [0.96, 0.34, 1.2], [-0.96, 0.34, -1.2], [0.96, 0.34, -1.2]];
    wheelPos.forEach(([x, y, z]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);
      const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.25, 20);
      tireGeo.rotateZ(Math.PI / 2);
      wGroup.add(new THREE.Mesh(tireGeo, tireMaterial));
      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.26, 16);
      rimGeo.rotateZ(Math.PI / 2);
      wGroup.add(new THREE.Mesh(rimGeo, chromeMaterial));
      carGroup.add(wGroup);
    });

    return carGroup;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.08);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(4.5, 2.2, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 2.5;
    controls.maxDistance = 8.5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.SpotLight(0xffffff, 4.0);
    keyLight.position.set(3, 6, 4);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.6;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const neonLight = new THREE.PointLight(new THREE.Color(neonColorHex), 4.5, 6.0, 1.5);
    neonLight.position.set(0, 0.12, 0);
    scene.add(neonLight);
    neonLightRef.current = neonLight;

    // --- Floor: Wet Tarmac ---
    const floorGeo = new THREE.PlaneGeometry(35, 35);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.22,
      metalness: 0.55
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ringGeo = new THREE.RingGeometry(2.4, 2.52, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    const underglowGeo = new THREE.CircleGeometry(1.6, 32);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(neonColorHex),
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
    underglowMesh.rotation.x = -Math.PI / 2;
    underglowMesh.position.y = 0.01;
    scene.add(underglowMesh);
    underglowMeshRef.current = underglowMat;

    // --- RESOLVE ACCURATE 3D MODEL FOR THIS SPECIFIC VEHICLE ---
    const cleanBrand = (car?.brand || '').toLowerCase();
    const cleanModel = (car?.model || car?.name || '').toLowerCase();

    let targetGlb = null;
    if (car?.model3dUrl && car.model3dUrl.endsWith('.glb')) {
      targetGlb = car.model3dUrl;
    } 
    // Complete Argentine Popular & Street Cars Mapping (49 authentic .GLB models)
    // --- VOLKSWAGEN ---
    else if (cleanBrand.includes('volkswagen') || cleanBrand.includes('vw')) {
      if (cleanModel.includes('gol')) targetGlb = '/models/vw_gol.glb';
      else if (cleanModel.includes('golf')) targetGlb = '/models/vw_golf.glb';
      else if (cleanModel.includes('beetle') || cleanModel.includes('fusca') || cleanModel.includes('escarabajo')) targetGlb = '/models/vw_beetle.glb';
      else if (cleanModel.includes('amarok')) targetGlb = '/models/vw_amarok.glb';
      else if (cleanModel.includes('bora') || cleanModel.includes('vento')) targetGlb = '/models/vw_bora.glb';
      else targetGlb = '/models/vw_gol.glb';
    }
    // --- FIAT ---
    else if (cleanBrand.includes('fiat')) {
      if (cleanModel.includes('600') || cleanModel.includes('fitito')) targetGlb = '/models/fiat_600.glb';
      else if (cleanModel.includes('147') || cleanModel.includes('spazio')) targetGlb = '/models/fiat_147.glb';
      else if (cleanModel.includes('uno')) targetGlb = '/models/fiat_uno.glb';
      else if (cleanModel.includes('palio') || cleanModel.includes('siena')) targetGlb = '/models/fiat_palio.glb';
      else if (cleanModel.includes('128')) targetGlb = '/models/fiat_128.glb';
      else targetGlb = '/models/fiat_600.glb';
    }
    // --- CITROËN ---
    else if (cleanBrand.includes('citroen') || cleanBrand.includes('citroën')) {
      if (cleanModel.includes('2cv') || cleanModel.includes('3cv')) targetGlb = '/models/citroen_2cv.glb';
      else if (cleanModel.includes('berlingo') || cleanModel.includes('partner')) targetGlb = '/models/citroen_berlingo.glb';
      else targetGlb = '/models/citroen_2cv.glb';
    }
    // --- HONDA ---
    else if (cleanBrand.includes('honda')) {
      if (cleanModel.includes('civic')) targetGlb = '/models/honda_civic.glb';
      else if (cleanModel.includes('fit')) targetGlb = '/models/honda_fit.glb';
      else targetGlb = '/models/honda_civic.glb';
    }
    // --- PEUGEOT ---
    else if (cleanModel.includes('206')) {
      targetGlb = '/models/peugeot_206.glb';
    } else if (cleanModel.includes('208')) {
      targetGlb = '/models/peugeot_208.glb';
    } else if (cleanModel.includes('308')) {
      targetGlb = '/models/peugeot_308.glb';
    } else if (cleanModel.includes('405')) {
      targetGlb = '/models/peugeot_405.glb';
    } else if (cleanModel.includes('504')) {
      targetGlb = '/models/peugeot_504.glb';
    } else if (cleanBrand.includes('peugeot')) {
      targetGlb = '/models/peugeot_206.glb';
    }
    // --- RENAULT ---
    else if (cleanModel.includes('12') || (cleanBrand.includes('renault') && cleanModel.includes('12'))) {
      targetGlb = '/models/renault_12.glb';
    } else if (cleanModel.includes('torino')) {
      targetGlb = '/models/renault_torino.glb';
    } else if (cleanModel.includes('fuego')) {
      targetGlb = '/models/renault_fuego.glb';
    } else if (cleanModel.includes('duster')) {
      targetGlb = '/models/renault_duster.glb';
    } else if (cleanModel.includes('kangoo')) {
      targetGlb = '/models/renault_kangoo.glb';
    } else if (cleanModel.includes('clio')) {
      targetGlb = '/models/renault_clio.glb';
    } else if (cleanModel.includes('megane')) {
      targetGlb = '/models/renault_megane.glb';
    } else if (cleanModel.includes('laguna')) {
      targetGlb = '/models/renault_laguna.glb';
    } else if (cleanBrand.includes('renault')) {
      targetGlb = '/models/renault_clio.glb';
    }
    // --- CHEVROLET ---
    else if (cleanModel.includes('corsa') || cleanModel.includes('classic')) {
      targetGlb = '/models/chevrolet_corsa.glb';
    } else if (cleanModel.includes('astra')) {
      targetGlb = '/models/chevrolet_astra.glb';
    } else if (cleanModel.includes('onix') || cleanModel.includes('prisma')) {
      targetGlb = '/models/chevrolet_onix.glb';
    } else if (cleanBrand.includes('chevrolet')) {
      targetGlb = '/models/chevrolet_corsa.glb';
    }
    // --- FORD ---
    else if (cleanModel.includes('falcon')) {
      targetGlb = '/models/ford_falcon.glb';
    } else if (cleanModel.includes('ranger')) {
      targetGlb = '/models/ford_ranger.glb';
    } else if (cleanModel.includes('ecosport')) {
      targetGlb = '/models/ford_ecosport.glb';
    } else if (cleanModel.includes('ka')) {
      targetGlb = '/models/ford_ka.glb';
    } else if (cleanModel.includes('fiesta')) {
      targetGlb = '/models/ford_fiesta.glb';
    } else if (cleanModel.includes('focus')) {
      targetGlb = '/models/ford_focus.glb';
    } else if (cleanModel.includes('mustang')) {
      targetGlb = '/models/mustang_1965.glb';
    }
    // --- TOYOTA ---
    else if (cleanBrand.includes('toyota')) {
      if (cleanModel.includes('hilux')) targetGlb = '/models/toyota_hilux.glb';
      else if (cleanModel.includes('yaris')) targetGlb = '/models/toyota_yaris.glb';
      else targetGlb = '/models/toyota_corolla.glb';
    }
    // --- SUBARU ---
    else if (cleanBrand.includes('subaru') && cleanModel.includes('forester')) {
      targetGlb = '/models/subaru_forester.glb';
    } else if (cleanBrand.includes('subaru') && cleanModel.includes('xv')) {
      targetGlb = '/models/subaru_xv.glb';
    } else if (cleanBrand.includes('subaru') || cleanModel.includes('impreza')) {
      targetGlb = '/models/subaru_impreza.glb';
    }
    // --- LADA ---
    else if (cleanBrand.includes('lada') || cleanModel.includes('niva')) {
      targetGlb = '/models/lada_niva.glb';
    }
    // --- MITSUBISHI ---
    else if (cleanBrand.includes('mitsubishi') && (cleanModel.includes('pajero') || cleanModel.includes('montero'))) {
      targetGlb = '/models/mitsubishi_pajero.glb';
    } else if (cleanBrand.includes('mitsubishi') || cleanModel.includes('lancer')) {
      targetGlb = '/models/mitsubishi_lancer.glb';
    }
    // --- BMW (Classics & Street Fleet) ---
    else if (cleanBrand.includes('bmw')) {
      if (cleanModel.includes('2002')) targetGlb = '/models/bmw_2002.glb';
      else if (cleanModel.includes('e30')) targetGlb = '/models/bmw_e30.glb';
      else if (cleanModel.includes('e36')) targetGlb = '/models/bmw_e36.glb';
      else if (cleanModel.includes('e46') || cleanModel.includes('330')) targetGlb = '/models/bmw_e46.glb';
      else if (cleanModel.includes('e39') || cleanModel.includes('530') || cleanModel.includes('m5')) targetGlb = '/models/bmw_e39.glb';
      else if (cleanModel.includes('1') || cleanModel.includes('128') || cleanModel.includes('135')) targetGlb = '/models/bmw_1series.glb';
      else if (cleanModel.includes('x5') || cleanModel.includes('x3')) targetGlb = '/models/bmw_x5.glb';
      else if (cleanModel.includes('g80') || cleanModel.includes('m3')) targetGlb = '/models/bmw_m3.glb';
      else targetGlb = '/models/bmw_e30.glb';
    }
    // --- AUDI ---
    else if (cleanBrand.includes('audi')) {
      if (cleanModel.includes('a4') || cleanModel.includes('s4') || cleanModel.includes('rs4')) targetGlb = '/models/audi_a4.glb';
      else targetGlb = '/models/audi_a3.glb';
    }
    // --- MERCEDES-BENZ ---
    else if (cleanBrand.includes('mercedes') || cleanBrand.includes('amg')) {
      if (cleanModel.includes('190') || cleanModel.includes('190e')) targetGlb = '/models/mercedes_190e.glb';
      else targetGlb = '/models/mercedes_cclass.glb';
    }
    // --- ALFA ROMEO ---
    else if (cleanBrand.includes('alfa')) {
      targetGlb = '/models/alfa_147.glb';
    }
    // --- SPORTS & SUPERCARS ---
    else if (cleanBrand.includes('porsche') || cleanModel.includes('911') || cleanModel.includes('gt3')) {
      targetGlb = '/models/porsche_911.glb';
    } else if (cleanBrand.includes('ferrari')) {
      targetGlb = '/models/ferrari.glb';
    }

    let isMounted = true;
    let activeDracoLoader = null;

    if (targetGlb) {
      setLoading(true);
      setLoadProgress(0);

      activeDracoLoader = new DRACOLoader();
      activeDracoLoader.setDecoderPath('/draco/');

      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(activeDracoLoader);

      gltfLoader.load(
        targetGlb,
        (gltf) => {
          if (!isMounted) return;
          const model = gltf.scene;

          // Auto-orientation check: detect if vehicle was exported on its nose/tail (Z-up vs Y-up)
          const initialBox = new THREE.Box3().setFromObject(model);
          const initialSize = new THREE.Vector3();
          initialBox.getSize(initialSize);

          if (initialSize.y > initialSize.z && initialSize.y > initialSize.x) {
            model.rotation.x = -Math.PI / 2;
            model.updateMatrixWorld(true);
          }
          
          // Auto center and scale model cleanly
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 4.2 / maxDim;
          model.scale.set(scale, scale, scale);
          model.updateMatrixWorld(true);

          const updatedBox = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          updatedBox.getCenter(center);
          model.position.x = -center.x;
          model.position.z = -center.z;
          model.position.y = -updatedBox.min.y + 0.02;

          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          scene.add(model);
          setModelType('real-glb');
          setLoadProgress(100);
          setLoading(false);
        },
        (xhr) => {
          if (!isMounted) return;
          if (xhr.total > 0) {
            setLoadProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          }
        },
        (err) => {
          if (!isMounted) return;
          console.warn('Failed loading target GLB, building specific procedural vehicle:', err);
          const customMesh = buildVehicleSpecificModel(car);
          scene.add(customMesh);
          setModelType('procedural');
          setLoading(false);
        }
      );
    } else {
      // Build distinct procedural model for Mustang, BMW M3, Corolla, etc.
      const customMesh = buildVehicleSpecificModel(car);
      scene.add(customMesh);
      setModelType('procedural');
      setLoading(false);
    }

    // --- Animation Loop (pauses automatically when minimized/backgrounded) ---
    let animationFrameId = null;
    const animate = () => {
      if (document.hidden) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleVisibilityChange = () => {
      if (!document.hidden && animationFrameId === null && isMounted) {
        animate();
      } else if (document.hidden && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleContextLost = (e) => {
      e.preventDefault();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    const handleContextRestored = () => {
      if (isMounted && animationFrameId === null) {
        animate();
      }
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost, false);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored, false);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

      // Dispose all Three.js geometries, materials, and textures to free GPU memory
      scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat) => {
            if (!mat) return;
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'envMap', 'alphaMap'].forEach((prop) => {
              if (mat[prop]) mat[prop].dispose();
            });
            mat.dispose();
          });
        }
      });

      if (activeDracoLoader) {
        activeDracoLoader.dispose();
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [car]);

  // Update neon live
  useEffect(() => {
    if (neonLightRef.current) {
      neonLightRef.current.color.set(neonColorHex);
    }
    if (underglowMeshRef.current) {
      underglowMeshRef.current.color.set(neonColorHex);
    }
  }, [neonColorHex]);

  // Toggle Auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const cleanBrand = (car?.brand || '').toLowerCase();
  const cleanModel = (car?.model || car?.name || '').toLowerCase();
  const isPorsche = cleanBrand.includes('porsche') || cleanModel.includes('911');
  const isFerrari = cleanBrand.includes('ferrari');
  const isMustang = cleanBrand.includes('ford') || cleanModel.includes('mustang');
  const isBmw = cleanBrand.includes('bmw') || cleanModel.includes('m3');

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden bg-[#06070a]">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-xs font-mono font-bold text-zinc-200 gap-2.5 z-30">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-transparent rounded-full animate-spin"></div>
          <span>
            {loadProgress > 0 ? `Cargando Modelo 3D (${loadProgress}%)...` : 'Cargando Malla 3D Oficial...'}
          </span>
        </div>
      )}

      {/* 3D Viewport Controls Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{`${(car?.brand || 'AUTO').toUpperCase()} ${(car?.model || car?.name || '').toUpperCase()} 3D (.GLB)`}</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-xl border backdrop-blur-md text-xs transition ${
            autoRotate
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white'
          }`}
          title={autoRotate ? 'Pausar rotación automática' : 'Activar rotación automática'}
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={resetCamera}
          className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-400 hover:text-white backdrop-blur-md transition text-xs"
          title="Centrar cámara"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Gesture Hint at the Bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-400 pointer-events-none flex items-center gap-1.5 shadow">
        <Eye className="w-3.5 h-3.5 text-zinc-300" />
        Arrastra para girar 360° • Zoom con rueda o pinza
      </div>
    </div>
  );
}
