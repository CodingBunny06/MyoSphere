import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { ANATOMY_BY_KEY, ATTRIBUTION } from "open-anatomy-3d";
import "./anatomy-v2.css";

type Sex = "male" | "female";
type System = "skin" | "muscles";
const systems: System[] = ["skin", "muscles"];
const palette = ["#ff754f", "#48c7ff", "#b4e65c", "#e98ad2", "#ffbd54", "#8c91ff", "#45d6b0", "#f18b65", "#76a7f7", "#d4e66a"];
const categoryColor = (category: string) => {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
};

export default function AnatomyStudio() {
  const mountRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const [sex, setSex] = useState<Sex>("male");
  const [visible, setVisible] = useState<Record<System, boolean>>({ skin: true, muscles: false });
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [progress, setProgress] = useState(0);
  const [fatPercent, setFatPercent] = useState(20);
  const [query, setQuery] = useState("");

  const selectedInfo = selectedKey ? ANATOMY_BY_KEY[selectedKey as keyof typeof ANATOMY_BY_KEY] : null;
  const catalogMuscles = useMemo(() => Object.values(ANATOMY_BY_KEY).filter((item) => item.system === "muscles" && (!item.sex || item.sex === sex)), [sex]);
  const filteredMuscles = catalogMuscles.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      setLoadError("WebGL is unavailable in this browser.");
      setLoading(false);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    camera.position.set(0, 0.9, 3.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none";
    mount.replaceChildren(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x43505c, 2));
    const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(3, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9dcaff, 1.4); fill.position.set(-3, 2, -3); scene.add(fill);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0); controls.enableDamping = true; controls.dampingFactor = 0.07;
    controls.minDistance = 1.8; controls.maxDistance = 7; controls.enablePan = false;
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    let disposed = false;
    objectsRef.current = [];
    setLoading(true); setLoadError(""); setProgress(0); setSelectedKey("");
    loader.load(`/models/anatomy-${sex}.glb`, (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 2.5 / Math.max(size.x, size.y, size.z);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -bounds.min.y * scale + 0.02, -center.z * scale);
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const keyName = obj.name;
        const info = ANATOMY_BY_KEY[keyName as keyof typeof ANATOMY_BY_KEY];
        obj.userData.structureKey = keyName;
        let systemNode: THREE.Object3D | null = obj.parent;
        while (systemNode && !systems.includes(systemNode.name as System)) systemNode = systemNode.parent;
        obj.userData.system = systemNode?.name as System | undefined;
        if (obj.userData.system === "skin") {
          obj.geometry = obj.geometry.clone();
          obj.geometry.computeVertexNormals();
          const position = obj.geometry.getAttribute("position") as THREE.BufferAttribute;
          const normal = obj.geometry.getAttribute("normal") as THREE.BufferAttribute;
          obj.userData.basePositions = Float32Array.from(position.array as ArrayLike<number>);
          obj.userData.baseNormals = Float32Array.from(normal.array as ArrayLike<number>);
          const skinMats = Array.isArray(obj.material) ? obj.material : [obj.material];
          obj.material = skinMats.map((mat) => { const clone = mat.clone() as THREE.MeshStandardMaterial; clone.color.multiply(new THREE.Color("#e6b49b")); clone.roughness = 0.86; clone.metalness = 0; return clone; });
        }
        if (info?.system === "muscles") {
          const color = categoryColor(info.key);
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          obj.material = mats.map((mat) => {
            const clone = mat.clone() as THREE.MeshStandardMaterial;
            clone.color.set(color); clone.roughness = 0.72; clone.metalness = 0;
            return clone;
          });
        }
        obj.castShadow = false; obj.receiveShadow = false;
        objectsRef.current.push(obj);
      });
      scene.add(root);
      camera.position.set(0, size.y * scale * 0.55, Math.max(2.8, size.y * scale * 1.7));
      controls.target.set(0, size.y * scale * 0.48, 0); controls.update();
      setLoading(false);
    }, (event) => { if (event.total) setProgress(Math.round(event.loaded / event.total * 100)); }, (error) => {
      console.error("Anatomy model load failed", error);
      if (!disposed) { setLoadError("The anatomy model could not be loaded. Try again after refreshing."); setLoading(false); }
    });
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const onClick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(objectsRef.current, false);
      if (hits[0]) {
        const keyName = String(hits[0].object.userData.structureKey || hits[0].object.name);
        setSelectedKey(keyName);
      }
    };
    renderer.domElement.addEventListener("click", onClick);
    const resize = () => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    let raf = 0; const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }; animate();
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); controls.dispose(); renderer.domElement.removeEventListener("click", onClick);
      scene.traverse((obj) => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach((mat) => mat.dispose()); } });
      renderer.dispose(); mount.replaceChildren(); objectsRef.current = [];
    };
  }, [sex]);

  useEffect(() => {
    objectsRef.current.forEach((obj) => {
      const system = obj.userData.system as System;
      if (system && systems.includes(system)) obj.visible = visible[system];
      const keyName = String(obj.userData.structureKey || "");
      const isSelected = keyName === selectedKey;
      const mats = Array.isArray((obj as THREE.Mesh).material) ? (obj as THREE.Mesh).material as THREE.Material[] : [(obj as THREE.Mesh).material];
      mats.forEach((mat) => {
        const standard = mat as THREE.MeshStandardMaterial;
        if ("emissive" in standard) { standard.emissive.set(isSelected ? "#ffffff" : "#000000"); standard.emissiveIntensity = isSelected ? 0.32 : 0; }
      });
    });
  }, [visible, selectedKey, loading]);

  useEffect(() => {
    objectsRef.current.forEach((obj) => {
      if (obj.userData.system !== "skin" || !(obj instanceof THREE.Mesh)) return;
      const geometry = obj.geometry as THREE.BufferGeometry;
      const position = geometry.getAttribute("position") as THREE.BufferAttribute;
      const base = obj.userData.basePositions as Float32Array | undefined;
      const normals = obj.userData.baseNormals as Float32Array | undefined;
      if (!base || !normals) return;
      // A restrained, reversible surface inflation for visual exploration only.
      // It is not a validated mapping between body-fat percentage and anatomy.
      const displacement = ((fatPercent - 20) / 25) * 0.012;
      for (let i = 0; i < position.count; i++) {
        const offset = i * 3;
        position.setXYZ(i, base[offset] + normals[offset] * displacement, base[offset + 1] + normals[offset + 1] * displacement, base[offset + 2] + normals[offset + 2] * displacement);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    });
  }, [fatPercent, loading]);

  return <section className="anatomy-v2">
    <div className="studio-heading"><div><span className="eyebrow">MYOSPHERE / ANATOMY LAB · V2</span><h1>Explore the <em>human form.</em></h1><p>Colour-coded anatomy with separately selectable structures. Educational visualisation, not a diagnostic tool.</p></div></div>
    <div className="anatomy-v2-toolbar">
      <div className="anatomy-v2-toggle"><button className={sex === "male" ? "active" : ""} onClick={() => setSex("male")}>Male</button><button className={sex === "female" ? "active" : ""} onClick={() => setSex("female")}>Female</button></div>
      <span className="anatomy-fat-readout">Illustrative body-fat reference: {fatPercent}%</span>
    </div>
    <div className="anatomy-v2-layout">
      <div className="anatomy-v2-viewer"><div className="anatomy-v2-canvas" ref={mountRef} />
        {loading && <div className="anatomy-v2-loading">Loading {sex} anatomy… {progress}%</div>}
        {loadError && <div className="anatomy-v2-error">{loadError}</div>}
        <div className="anatomy-fat-notice">Appearance preview only. The slider does not measure body fat or reproduce a clinically validated body-composition model.</div>
      </div>
      <aside className="anatomy-v2-panel">
        <div className="anatomy-v2-section"><span className="eyebrow">BODY SYSTEMS</span>{systems.map((system) => <label key={system}><input type="checkbox" checked={visible[system]} onChange={(e) => setVisible((current) => ({ ...current, [system]: e.target.checked }))}/><span className={`anatomy-swatch anatomy-swatch-${system}`}/>{system[0].toUpperCase()+system.slice(1)}</label>)}</div>
        <div className="anatomy-v2-section"><span className="eyebrow">SELECTED STRUCTURE</span><strong>{selectedInfo?.label || "Select a structure"}</strong><small>{selectedInfo ? `${selectedInfo.system} · ${selectedInfo.category}` : "Click a visible structure in the model."}</small></div>
        <div className="anatomy-v2-section"><span className="eyebrow">MUSCLE SEARCH</span><input className="anatomy-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search muscles…"/><div className="anatomy-muscle-results">{filteredMuscles.slice(0, 12).map((item) => <button key={item.key} onClick={() => { setVisible((v) => ({ ...v, muscles: true })); setSelectedKey(item.key); }}>{item.label}</button>)}</div></div>
        <div className="anatomy-v2-section"><span className="eyebrow">BODY-FAT REFERENCE</span><div className="fat-slider-heading"><strong>{fatPercent}%</strong><span>Adjust to your own reference</span></div><input className="anatomy-fat-slider" type="range" min="5" max="45" step="1" value={fatPercent} onChange={(event) => setFatPercent(Number(event.target.value))}/><div className="fat-slider-scale"><span>5%</span><span>45%</span></div><p className="anatomy-fat-copy">This gently changes the outer-surface preview to help visualise a range. Real fat distribution varies by person, sex, age and genetics; this is not a measurement or prediction.</p></div>
        <small className="anatomy-attribution">{ATTRIBUTION}</small>
      </aside>
    </div>
  </section>;
}
