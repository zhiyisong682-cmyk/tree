import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreeParticlesProps {
  onClick?: () => void;
}

const TreeParticles: React.FC<TreeParticlesProps> = ({ onClick }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  // Change cursor to pointer when hovering the tree
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  // Configuration
  const particleCount = 4500;
  const treeHeight = 12;
  const maxRadius = 5.5;

  // Colors
  const colorPalette = [
    new THREE.Color('#2f5e38'), // Matte Green
    new THREE.Color('#2f5e38'), // More Green (weighting)
    new THREE.Color('#1a4223'), // Darker Green
    new THREE.Color('#d4af37'), // Metallic Gold
    new THREE.Color('#b91c1c'), // Christmas Red
  ];

  const { positions, colors, sizes } = useMemo(() => {
    const p = new Float32Array(particleCount * 3);
    const c = new Float32Array(particleCount * 3);
    const s = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Normalize height (0 to 1)
      const yRatio = Math.random(); 
      // y coordinate: bottom (-height/2) to top (height/2)
      // We want the tree to sit roughly on the grid, so let's shift it up
      const y = yRatio * treeHeight - (treeHeight / 2) + 2; 

      // Cone radius at this height (tapers as y goes up)
      // Use 1 - yRatio^0.8 to create a slightly fuller bottom
      const rAtHeight = maxRadius * (1 - Math.pow(yRatio, 0.9));

      // Random radius within the cone volume (with density bias towards outer edge for definition)
      const r = rAtHeight * Math.sqrt(Math.random()); 
      
      // Spiral angle for better distribution
      const theta = Math.random() * Math.PI * 2;

      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = z;

      // Color selection
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;

      // Size distribution (1px to 8px approximately)
      // Larger particles at the bottom/inside, smaller detail particles on outside
      const baseSize = Math.random() * 0.4 + 0.1;
      s[i] = baseSize;
    }

    return { positions: p, colors: c, sizes: s };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      // Subtle rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group>
        {/* The Visual Particles */}
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={colors.length / 3}
              array={colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={sizes.length}
              array={sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Invisible Hit Volume for easy interaction */}
        <mesh 
            visible={false} 
            position={[0, 2, 0]} 
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Cone geometry matching the particle tree dimensions */}
            {/* RadiusTop: 0, RadiusBottom: 5.5, Height: 12 */}
            <cylinderGeometry args={[0, maxRadius, treeHeight, 16]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    </group>
  );
};

export default TreeParticles;