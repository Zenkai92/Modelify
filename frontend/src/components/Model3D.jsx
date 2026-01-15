import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, useGLTF, Stage } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import * as THREE from 'three';

function GltfModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ObjModel({ url, color }) {
  const obj = useLoader(OBJLoader, url);
  
  // Appliquer la couleur si fournie
  useMemo(() => {
    if (color) {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.5,
            metalness: 0.1 
          });
        }
      });
    }
  }, [obj, color]);

  return <primitive object={obj} />;
}

function MfModel({ url }) {
  const object = useLoader(ThreeMFLoader, url);
  return <primitive object={object} />;
}

function StlModel({ url, color }) {
  const geom = useLoader(STLLoader, url);
  
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial 
        color={color || "#cccccc"} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

function Model({ url, rotation = [0, 0, 0], color }) {
  const ext = url.split('.').pop().toLowerCase();

  let ModelComponent = null;
  if (ext === 'gltf' || ext === 'glb') ModelComponent = <GltfModel url={url} />;
  else if (ext === 'obj') ModelComponent = <ObjModel url={url} color={color} />;
  else if (ext === 'stl') ModelComponent = <StlModel url={url} color={color} />;
  else if (ext === '3mf') ModelComponent = <MfModel url={url} />;
  else return null;

  return (
    <group rotation={rotation}>
        {ModelComponent}
    </group>
  );
}

function RotatingMesh({ type, color }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        {type === 'cube' && <boxGeometry args={[2.2, 2.2, 2.2]} />}
        {type === 'torus' && <torusKnotGeometry args={[0.8, 0.3, 100, 16]} />}
        {type === 'sphere' && <icosahedronGeometry args={[1.5, 0]} />}
        
        <meshStandardMaterial 
            color={color} 
            roughness={0.3} 
            metalness={0.2} 
        />
      </mesh>
    </Float>
  );
}

export default function Model3D({ 
  type = 'cube', 
  color = '#4338ca', 
  modelPath, 
  rotation = [0, 0, 0],
}) {
  
  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={<RotatingMesh type="sphere" color="#cccccc" />}>
           {modelPath ? (
             <Stage environment="city" intensity={1.8} adjustCamera shadows={false}>
                <Model url={modelPath} rotation={rotation} color={color} />
             </Stage>
           ) : (
             <>
                <PerspectiveCamera makeDefault position={[0, 0, 6]} />
                <ambientLight intensity={1.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={1} />
                <RotatingMesh type={type} color={color} />
             </>
           )}
        </Suspense>
        
        <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
