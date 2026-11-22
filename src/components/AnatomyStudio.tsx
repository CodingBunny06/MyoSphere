import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type MuscleGroup = "All" | "Chest" | "Shoulders" | "Arms" | "Core" | "Legs";
type ModelState = "loading" | "ready" | "missing" | "error";
const muscleGroups: MuscleGroup[] = ["All", "Chest", "Shoulders", "Arms", "Core", "Legs"];

const regionToGroup: Record<string, MuscleGroup> = {
  Chest: "Chest",
  Shoulder: "Shoulders",
  Upper_Arm: "Arms",
  Forearm: "Arms",
  Hand: "Arms",
  Abdomen: "Core",
  Back_Upper: "Core",
  Back_Spine: "Core",
  Pelvis_Hip: "Core",
  Thigh: "Legs",
  Lower_Leg: "Legs",
  Foot: "Legs",
};

function regionFor(mesh: THREE.Object3D): string {
  let parent = mesh.parent;
  while (parent) {
    if (["Head", "Neck", "Heart", "Chest", "Shoulder", "Upper_Arm", "Forearm", "Hand", "Back_Upper", "Back_Spine", "Abdomen", "Pelvis_Hip", "Thigh", "Lower_Leg", "Foot"].includes(parent.name)) {
      return parent.name;
    }
    parent = parent.parent;
  }
  return "Other";
}

function AnatomyStudio() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const muscleMeshesRef = useRef<THREE.Mesh[]>([]);
  const [selected, setSelected] = useState<MuscleGroup>("All");
  const [modelState, setModelState] = useState<ModelState>("loading");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("Select a muscle on the model");
  const [loadProgress, setLoadProgress] = useState(0);

  const muscleCount = useMemo(() => muscleMeshesRef.current.length, [modelState]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      setModelState("error");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 1.1, 3.6);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffe6df, 0x30232b, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffb0a0, 1.7);
    fillLight.position.set(-4, 1, 2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x91d8ff, 2.2);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    modelRef.current = modelRoot;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 7;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.42;

    const loader = new GLTFLoader();
    let disposed = false;
    loader.load(
      "/models/myosphere_muscles_bp3d.glb",
      (gltf) => {
        if (disposed) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          return;
        }

        modelRoot.add(gltf.scene);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 2.65 / maxDimension;
        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.set(-center.x * scale, -center.y * scale + 0.8, -center.z * scale);

        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = false;
          object.receiveShadow = false;
          object.userData.region = regionFor(object);
          object.userData.muscleGroup = regionToGroup[object.userData.region] ?? "All";
          object.userData.originalMaterials = (Array.isArray(object.material) ? object.material : [object.material]).map((material) => material.clone());
          object.material = Array.isArray(object.material)
            ? object.material.map((material) => material.clone())
            : object.material.clone();
          meshes.push(object);
        });
        muscleMeshesRef.current = meshes;
        setModelState("ready");
        controls.target.set(0, 0.8, 0);
        const fitDistance = Math.max(size.y * scale * 1.45, 2.9);
        camera.position.set(0, 0.8, fitDistance);
        camera.near = Math.max(0.005, fitDistance / 1000);
        camera.far = fitDistance * 20;
        camera.updateProjectionMatrix();
        controls.update();
      },
      (event) => {
        if (event.total > 0) setLoadProgress(Math.round((event.loaded / event.total) * 100));
      },
      (error) => {
        console.error("MyoSphere anatomy model failed to load.", error);
        if (!disposed) setModelState("missing");
      },
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(muscleMeshesRef.current, false);
      if (hits.length) {
        const hit = hits[0].object;
        setSelectedMuscle(String(hit.userData.englishName ?? hit.name.replace(/_[LR]$/, "").replaceAll("_", " ")));
        const group = hit.userData.muscleGroup as MuscleGroup;
        if (group && group !== "All") setSelected(group);
        controls.autoRotate = false;
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let animationId = 0;
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      modelRoot.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      mount.replaceChildren();
      muscleMeshesRef.current = [];
      modelRef.current = null;
    };
  }, []);

  useEffect(() => {
    muscleMeshesRef.current.forEach((mesh) => {
      const active = selected === "All" || mesh.userData.muscleGroup === selected;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial;
        if ("emissive" in standard) {
          standard.emissive.set(active ? "#2b0808" : "#090d13");
          standard.emissiveIntensity = active ? 0.12 : 0.015;
        }
        standard.transparent = !active;
        standard.opacity = active ? 1 : 0.2;
      });
    });
  }, [selected, modelState]);

  return (
    <section className="studio-page">
      <div className="studio-heading">
        <div><span className="eyebrow">MYOSPHERE / ANATOMY LAB</span><h1>Explore the <em>human form.</em></h1><p>Rotate the anatomical model, select individual muscles and isolate major muscle regions.</p></div>
        <span className="studio-status"><i /> {modelState === "ready" ? "ANATOMY MODEL LOADED" : modelState === "loading" ? "LOADING ANATOMY" : "MODEL ASSET NEEDED"}</span>
      </div>
      <div className="studio-layout">
        <div className="studio-model-card">
          <div className="studio-model-top"><span>BODY PARTS 3D · MUSCLE LAYERS</span><span>DRAG TO ROTATE · SCROLL / PINCH TO ZOOM</span></div>
          <div className="studio-canvas" ref={mountRef} aria-label="Interactive 3D anatomical muscle model" />
          {modelState !== "ready" && <div className="studio-load-overlay">
            <strong>{modelState === "loading" ? "Preparing the anatomy model…" : modelState === "missing" ? "Anatomy asset not installed yet" : "3D rendering unavailable"}</strong>
            <p>{modelState === "loading" ? (loadProgress ? `Loading model · ${loadProgress}%` : "The detailed model is approximately 21 MB.") : modelState === "missing" ? "Place myosphere_muscles_bp3d.glb in public/models/ to activate the full anatomy studio." : "Try a recent version of Safari or Chrome with WebGL enabled."}</p>
          </div>}
          <div className="studio-model-foot"><span>{modelState === "ready" ? `${muscleCount} SEPARATE MUSCLE MESHES` : "BODY PARTS 3D · CC BY 4.0"}</span><span>ROTATABLE MODEL <b>●</b></span></div>
        </div>
        <aside className="studio-controls">
          <span className="eyebrow">MUSCLE GROUPS</span><h2>Focus view</h2><p>Select a region to highlight it on the model. Tap a visible muscle for its label.</p>
          <div className="muscle-selector">{muscleGroups.map((group) => <button key={group} className={selected === group ? "muscle-chip selected" : "muscle-chip"} onClick={() => setSelected(group)} aria-pressed={selected === group}><span />{group}</button>)}</div>
          <div className="studio-note"><span>✳</span><div><strong>{selectedMuscle}</strong><p>{modelState === "ready" ? "Tap another muscle on the model to inspect its anatomical label. The region filter dims unrelated structures." : "Individual muscle selection and region highlighting become available when the GLB asset is installed."}</p></div></div>
          <p className="studio-asset-credit">Anatomy: BodyParts3D © DBCLS · CC BY 4.0</p>
        </aside>
      </div>
    </section>
  );
}

export default AnatomyStudio;
