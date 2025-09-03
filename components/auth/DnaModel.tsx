import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Tube } from '@react-three/drei';
import * as THREE from 'three';

const DnaStrand: React.FC<{ curve: THREE.CatmullRomCurve3; color: string }> = ({ curve, color }) => {
    return (
        <Tube args={[curve, 64, 0.02, 8, false]}>
            <meshStandardMaterial attach="material" color={color} metalness={0.5} roughness={0.5} emissive={color} emissiveIntensity={0.5} />
        </Tube>
    );
};

const DnaBars: React.FC<{ curve1: THREE.CatmullRomCurve3; curve2: THREE.CatmullRomCurve3 }> = ({ curve1, curve2 }) => {
    const barCount = 10;
    return (
        <group>
            {Array.from({ length: barCount }).map((_, i) => {
                const t = i / barCount;
                const p1 = curve1.getPoint(t);
                const p2 = curve2.getPoint(t);
                const barCurve = new THREE.LineCurve3(p1, p2);
                
                return (
                    <Tube key={i} args={[barCurve, 1, 0.01, 6, false]}>
                         <meshStandardMaterial attach="material" color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.7} />
                    </Tube>
                );
            })}
        </group>
    );
};

const DnaModel: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);

    const [curve1, curve2] = useMemo(() => {
        const points1 = [];
        const points2 = [];
        const height = 2;
        const turns = 2;
        for (let i = 0; i <= 64; i++) {
            const t = i / 64;
            const angle = 2 * Math.PI * turns * t;
            const x = 0.2 * Math.cos(angle);
            const z = 0.2 * Math.sin(angle);
            const y = height * (t - 0.5);
            points1.push(new THREE.Vector3(x, y, z));
            points2.push(new THREE.Vector3(-x, y, -z));
        }
        return [new THREE.CatmullRomCurve3(points1), new THREE.CatmullRomCurve3(points2)];
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001;
            const t = state.clock.getElapsedTime();
            groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef} scale={1.8} rotation={[0.5, 0, 0]} position={[0, -0.2, 0]}>
            <DnaStrand curve={curve1} color="#38bdf8" />
            <DnaStrand curve={curve2} color="#818cf8" />
            <DnaBars curve1={curve1} curve2={curve2} />
        </group>
    );
};

export default DnaModel;