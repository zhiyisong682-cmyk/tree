import React from 'react';
import { GreetingCardData } from '../types';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

interface TreeAttachmentsProps {
  cards: GreetingCardData[];
}

const TreeAttachments: React.FC<TreeAttachmentsProps> = ({ cards }) => {
  if (cards.length === 0) return null;

  return (
    <Instances range={cards.length}>
        <planeGeometry args={[0.8, 0.6]} /> {/* Aspect ratio of a small envelope */}
        <meshStandardMaterial 
            color="#7f1d1d" // Red-900 like
            roughness={0.4}
            metalness={0.1}
            emissive="#b91c1c"
            emissiveIntensity={0.2}
            side={THREE.DoubleSide}
        />
        
        {cards.map((card) => (
            <Instance
                key={card.id}
                position={card.position}
                rotation={card.rotation}
                onClick={(e) => {
                    e.stopPropagation();
                    // Future interaction: Zoom into card?
                    console.log(`Clicked card from ${card.name}`);
                }}
            />
        ))}
    </Instances>
  );
};

export default TreeAttachments;