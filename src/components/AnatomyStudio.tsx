import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type MuscleGroup = "All" | "Chest" | "Shoulders" | "Arms" | "Core" | "Legs";
const muscleGroups: MuscleGroup[] = ["All", "Chest", "Shoulders", "Arms", "Core", "Legs"];

function AnatomyStudio() {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const [selected, setSelected] = useState<MuscleGroup>("All");
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.65, 7.2);
    camera.lookAt(0, 0.55, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x9acbdf, 1.8));
    const keyLight = new THREE.DirectionalLight(0x8ff7ff, 3.2);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xff4fd8, 24, 12);
    rimLight.position.set(-3, 1.5, -2);
    scene.add(rimLight);

    const body = new THREE.Group();
    body.scale.setScalar(0.88);
    body.position.y = -0.12;
    scene.add(body);
    const meshes: THREE.Mesh[] = [];

    const addEllipsoid = (name: string, muscleGroup: string, position: [number, number, number], scale: [number, number, number]) => {
      const material = new THREE.MeshStandardMaterial({ color: "#28516a", roughness: 0.42, metalness: 0.28, emissive: "#071c2a", emissiveIntensity: 0.22 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), material);
      mesh.name = name;
      mesh.userData.muscleGroup = muscleGroup;
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      body.add(mesh);
      meshes.push(mesh);
    };

    const addLimb = (name: string, muscleGroup: string, start: THREE.Vector3, end: THREE.Vector3, radius: number) => {
      const direction = new THREE.Vector3().subVectors(end, start);
      const material = new THREE.MeshStandardMaterial({ color: "#28516a", roughness: 0.46, metalness: 0.24, emissive: "#071c2a", emissiveIntensity: 0.2 });
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius, direction.length(), 20), material);
      mesh.name = name;
      mesh.userData.muscleGroup = muscleGroup;
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      body.add(mesh);
      meshes.push(mesh);
    };

    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    addEllipsoid("Head", "Structure", [0, 2.72, 0], [0.22, 0.27, 0.2]);
    addLimb("Neck", "Structure", v(0, 2.28, 0), v(0, 2.48, 0), 0.13);
    addEllipsoid("Torso", "Structure", [0, 1.68, 0], [0.55, 0.78, 0.32]);
    addEllipsoid("Pelvis", "Structure", [0, 0.72, 0], [0.43, 0.31, 0.29]);

    addEllipsoid("Left pectoral", "Chest", [-0.27, 2.0, 0.25], [0.3, 0.22, 0.15]);
    addEllipsoid("Right pectoral", "Chest", [0.27, 2.0, 0.25], [0.3, 0.22, 0.15]);
    for (const x of [-0.15, 0.15]) for (const y of [1.57, 1.31, 1.05]) {
      addEllipsoid("Abdominal muscle", "Core", [x, y, 0.29], [0.13, 0.105, 0.075]);
    }

    for (const side of [-1, 1]) {
      addEllipsoid("Deltoid", "Shoulders", [side * 0.65, 2.05, 0], [0.27, 0.28, 0.27]);
      addLimb("Upper arm", "Arms", v(side * 0.72, 1.92, 0), v(side * 0.86, 1.2, 0), 0.145);
      addEllipsoid("Biceps", "Arms", [side * 0.83, 1.53, 0.12], [0.16, 0.31, 0.15]);
      addLimb("Forearm", "Arms", v(side * 0.86, 1.18, 0), v(side * 0.93, 0.52, 0.02), 0.105);
      addEllipsoid("Hand", "Arms", [side * 0.94, 0.39, 0.04], [0.11, 0.16, 0.09]);
    }

    for (const side of [-1, 1]) {
      addLimb("Thigh", "Legs", v(side * 0.25, 0.63, 0), v(side * 0.34, -0.48, 0), 0.22);
      addEllipsoid("Quadriceps", "Legs", [side * 0.3, 0.08, 0.14], [0.18, 0.43, 0.14]);
      addLimb("Lower leg", "Legs", v(side * 0.34, -0.48, 0), v(side * 0.36, -1.47, 0), 0.13);
      addEllipsoid("Calf", "Legs", [side * 0.35, -0.98, -0.04], [0.15, 0.34, 0.14]);
      addEllipsoid("Foot", "Legs", [side * 0.36, -1.57, 0.12], [0.15, 0.1, 0.27]);
    }

    const floorGrid = new THREE.GridHelper(7, 28, 0x286078, 0x173248);
    floorGrid.position.y = -1.63;
    body.add(floorGrid);
    meshesRef.current = meshes;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.55, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.2;
    controls.maxDistance = 9;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);
    let animationId = 0;
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      controls.dispose();
      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      floorGrid.geometry.dispose();
      (floorGrid.material as THREE.Material).dispose();
      renderer.dispose();
      mount.replaceChildren();
      meshesRef.current = [];
    };
  }, []);

  useEffect(() => {
    meshesRef.current.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const highlighted = selected === "All" || mesh.userData.muscleGroup === selected;
      material.color.set(highlighted ? "#28627b" : "#142c40");
      material.emissive.set(highlighted ? "#087c94" : "#07111f");
      material.emissiveIntensity = highlighted ? 0.48 : 0.12;
    });
  }, [selected]);

  return (
    <section className="studio-page">
      <div className="studio-heading">
        <div><span className="eyebrow">MYOSPHERE / ANATOMY LAB</span><h1>Explore the <em>human form.</em></h1><p>Rotate the model and isolate muscle groups to explore the anatomy concept.</p></div>
        <span className="studio-status"><i /> INTERACTIVE PROTOTYPE</span>
      </div>
      <div className="studio-layout">
        <div className="studio-model-card">
          <div className="studio-model-top"><span>3D MUSCLE MAP</span><span>DRAG TO ROTATE · PINCH TO ZOOM</span></div>
          {webglError ? <div className="studio-fallback">3D rendering isn't available in this browser. Try opening MyoSphere in the latest version of Safari or Chrome.</div> : <div className="studio-canvas" ref={mountRef} aria-label="Interactive 3D anatomical mannequin" />}
          <div className="studio-model-foot"><span>BODY PRESET · CONCEPT 01</span><span>LIVE ROTATION <b>●</b></span></div>
        </div>
        <aside className="studio-controls">
          <span className="eyebrow">MUSCLE GROUPS</span><h2>Focus view</h2><p>Select a region to highlight it on the model.</p>
          <div className="muscle-selector">{muscleGroups.map((group) => <button key={group} className={selected === group ? "muscle-chip selected" : "muscle-chip"} onClick={() => setSelected(group)} aria-pressed={selected === group}><span />{group}</button>)}</div>
          <div className="studio-note"><span>✳</span><div><strong>In development</strong><p>This is a lightweight procedural prototype. Detailed anatomical meshes, individual muscle labels and exercise animations are planned next.</p></div></div>
        </aside>
      </div>
    </section>
  );
}

export default AnatomyStudio;
