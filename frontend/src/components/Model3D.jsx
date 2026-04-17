import { useRef, Suspense, useMemo, Component } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, useGLTF, Stage } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import * as THREE from 'three';

// Capture les erreurs de chargement de modèle et affiche un fallback
class ModelErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

/**
 * Centre et normalise un Object3D pour qu'il tienne dans un cube de 2 unités.
 * Indispensable pour les fichiers 3MF/OBJ qui utilisent souvent des coordonnées en mm.
 */
function normalizeObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim > 0) {
    const scale = 2 / maxDim;
    object.scale.setScalar(scale);
    // Recalcul après mise à l'échelle pour centrer précisément
    new THREE.Box3().setFromObject(object).getCenter(center);
    object.position.sub(center);
  }
}

function GltfModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ObjModel({ url, color }) {
  const obj = useLoader(OBJLoader, url);
  useMemo(() => {
    normalizeObject(obj);
    if (color) {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
        }
      });
    }
  }, [obj, color]);
  return <primitive object={obj} />;
}

function MfModel({ url }) {
  const object = useLoader(ThreeMFLoader, url);
  useMemo(() => {
    normalizeObject(object);
    // S'assurer que tous les meshes sont visibles avec double-face
    object.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [object]);
  return <primitive object={object} />;
}

function StlModel({ url, color }) {
  const geom = useLoader(STLLoader, url);
  useMemo(() => {
    geom.computeBoundingBox();
    const box = geom.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geom.translate(-center.x, -center.y, -center.z);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const s = 2 / maxDim;
      geom.scale(s, s, s);
    }
    geom.computeVertexNormals();
  }, [geom]);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color={color || '#cccccc'} side={THREE.DoubleSide} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

function Model({ url, rotation = [0, 0, 0], color }) {
  // Extraire l'extension proprement (ignorer les query params éventuels)
  const ext = url.split('?')[0].split('.').pop().toLowerCase();

  let ModelComponent = null;
  if (ext === 'gltf' || ext === 'glb') ModelComponent = <GltfModel url={url} />;
  else if (ext === 'obj') ModelComponent = <ObjModel url={url} color={color} />;
  else if (ext === 'stl') ModelComponent = <StlModel url={url} color={color} />;
  else if (ext === '3mf') ModelComponent = <MfModel url={url} />;
  else return null;

  return <group rotation={rotation}>{ModelComponent}</group>;
}

function RotatingMesh({ type, color }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        {type === 'cube'   && <boxGeometry args={[2.2, 2.2, 2.2]} />}
        {type === 'torus'  && <torusKnotGeometry args={[0.8, 0.3, 100, 16]} />}
        {type === 'sphere' && <icosahedronGeometry args={[1.5, 0]} />}
        {type === 'cone'   && <coneGeometry args={[1.4, 2.8, 6]} />}
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
    </Float>
  );
}

function GenericScene({ type, color }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} />
      <ambientLight intensity={1.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={1} />
      <RotatingMesh type={type} color={color} />
    </>
  );
}

export default function Model3D({ type = 'cube', color = '#4338ca', modelPath, rotation = [0, 0, 0] }) {
  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
      <Canvas shadows dpr={[1, 2]}>
        {modelPath ? (
          <ModelErrorBoundary fallback={<GenericScene type="cube" color={color} />}>
            <Suspense fallback={<RotatingMesh type="sphere" color="#cccccc" />}>
              <Stage environment="city" intensity={1.8} adjustCamera shadows={false}>
                <Model url={modelPath} rotation={rotation} color={color} />
              </Stage>
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <GenericScene type={type} color={color} />
        )}
        <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
