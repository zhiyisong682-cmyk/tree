import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StarParticles: React.FC = () => {
  // Separate refs for the rotating star body and the static halo
  const starBodyRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const haloRef = useRef<THREE.Points>(null);

  // Position at top of tree (Tree base at -4, Top at ~8.5-9)
  // 8.6 local + (-4 global) = 4.6 world height
  const starHeight = 8.6; 

  // --- 1. 3D Star Geometry (Folded Wire Structure) ---
  const { lineGeometry, edgePoints } = useMemo(() => {
    const points = 5;
    const outerRadius = 1.2; // Primary size
    const innerRadius = 0.5; // Deep valleys for sharp star shape
    const halfDepth = 0.35; // The "thickness" creating the 3D fold effect

    // Vertices
    const frontCenter = new THREE.Vector3(0, 0, halfDepth);
    const backCenter = new THREE.Vector3(0, 0, -halfDepth);
    
    const perimeterVertices: THREE.Vector3[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      perimeterVertices.push(
        new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0)
      );
    }

    // Generate Line Segments for the "Wire" look
    const lineVertices: number[] = [];
    
    const addLine = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      lineVertices.push(v1.x, v1.y, v1.z);
      lineVertices.push(v2.x, v2.y, v2.z);
    };

    // Connect vertices to form the faceted star
    for (let i = 0; i < perimeterVertices.length; i++) {
      const current = perimeterVertices[i];
      const next = perimeterVertices[(i + 1) % perimeterVertices.length];

      // 1. Perimeter Edges (The outline)
      addLine(current, next);

      // 2. Front Ridges (Center Front to Perimeter)
      addLine(frontCenter, current);

      // 3. Back Ridges (Center Back to Perimeter)
      addLine(backCenter, current);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

    return { lineGeometry: geometry, edgePoints: lineVertices };
  }, []);

  // --- 2. Generate Particles attached directly to the wires ---
  const { particlePositions, particleSizes, blinkOffsets } = useMemo(() => {
    const pos: number[] = [];
    const sizes: number[] = [];
    const offsets: number[] = [];

    // edgePoints contains pairs of vertices [x1,y1,z1, x2,y2,z2, ...]
    for (let i = 0; i < edgePoints.length; i += 6) {
      const x1 = edgePoints[i], y1 = edgePoints[i+1], z1 = edgePoints[i+2];
      const x2 = edgePoints[i+3], y2 = edgePoints[i+4], z2 = edgePoints[i+5];

      const v1 = new THREE.Vector3(x1, y1, z1);
      const v2 = new THREE.Vector3(x2, y2, z2);
      const dist = v1.distanceTo(v2);

      // High density: ~50 particles per unit length for a solid "encrusted" look
      const numParticles = Math.ceil(dist * 50);

      for (let j = 0; j <= numParticles; j++) {
        const t = j / numParticles;
        
        // Linear interpolation along the wire
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        const pz = z1 + (z2 - z1) * t;

        // Slight jitter to give the wire volume
        const jitter = 0.04;
        pos.push(
          px + (Math.random() - 0.5) * jitter,
          py + (Math.random() - 0.5) * jitter,
          pz + (Math.random() - 0.5) * jitter
        );

        // Random sizes for "diamond dust" effect
        sizes.push(Math.random() * 0.08 + 0.02);
        
        // Random phase for independent blinking
        offsets.push(Math.random() * Math.PI * 2);
      }
    }

    return {
      particlePositions: new Float32Array(pos),
      particleSizes: new Float32Array(sizes),
      blinkOffsets: new Float32Array(offsets)
    };
  }, [edgePoints]);

  // --- 3. Halo Cloud Geometry (Stationary) ---
  const { haloPositions, haloRandoms } = useMemo(() => {
    const count = 400; // Denser cloud
    const radius = 1.8; 
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count); // For independent flickering

    for(let i=0; i<count; i++) {
       const a = (i/count) * Math.PI * 2;
       // Create a volumetric "cloud" band around the star
       const r = radius + (Math.random() - 0.5) * 0.6; 
       const z = (Math.random() - 0.5) * 0.5; 
       
       positions[i*3] = Math.cos(a) * r;
       positions[i*3+1] = Math.sin(a) * r;
       positions[i*3+2] = z;

       randoms[i] = Math.random() * Math.PI * 2;
    }
    return { haloPositions: positions, haloRandoms: randoms };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // A. Rotate ONLY the Star Body (Wires + Attached Particles)
    if (starBodyRef.current) {
        starBodyRef.current.rotation.y = t * 0.3;
    }

    // B. Halo Animation (Fixed Rotation, Subtle Breathing/Flicker)
    if (haloRef.current) {
        // No rotation assignment here to keep it "anchored"
        // Just subtle breathing scale
        const breathe = 1 + Math.sin(t * 1.5) * 0.05;
        haloRef.current.scale.set(breathe, breathe, breathe);
    }

    // C. Blinking Animation for Star Particles (80 BPM)
    // 80 BPM = 1.333 Hz. 
    // Angular frequency = 1.333 * 2PI ≈ 8.37
    const bpm = 80;
    const blinkFreq = (bpm / 60) * Math.PI * 2;

    if (particlesRef.current) {
        const sizes = particlesRef.current.geometry.attributes.size;
        const arr = sizes.array as Float32Array;

        for (let i = 0; i < arr.length; i++) {
             const s = Math.sin(t * blinkFreq + blinkOffsets[i]);
             // Sharp flash pattern
             const scale = 0.5 + Math.pow((s + 1) / 2, 4) * 2.0; 
             arr[i] = particleSizes[i] * scale;
        }
        sizes.needsUpdate = true;
    }
  });

  return (
    <group position={[0, starHeight, 0]}>
        
        {/* ROTATING GROUP: The Star Itself */}
        <group ref={starBodyRef}>
            {/* 1. The Physical Metal Wireframe */}
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial 
                    color="#FDB931" 
                    linewidth={1} 
                    transparent 
                    opacity={0.3} 
                />
            </lineSegments>

            {/* 2. The Encrusted Glowing Particles */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particlePositions.length / 3}
                        array={particlePositions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-size"
                        count={particleSizes.length}
                        array={new Float32Array(particleSizes)}
                        itemSize={1}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#FFD700" 
                    size={1} 
                    sizeAttenuation={true}
                    transparent
                    opacity={1}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>

        {/* STATIC GROUP: The Outer Halo Cloud */}
        {/* Placed outside starBodyRef so it doesn't spin with the star */}
        <points ref={haloRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={haloPositions.length / 3}
                    array={haloPositions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#FDE047"
                size={0.15}
                sizeAttenuation={true}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>

        {/* 4. Core Light Source */}
        <pointLight 
            intensity={2.5} 
            color="#FFD700" 
            distance={6} 
            decay={2} 
        />
    </group>
  );
};

export default StarParticles;