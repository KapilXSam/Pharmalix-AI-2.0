import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../lib/supabaseClient';
import type { DashboardAnalysis } from '../types';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { X } from 'lucide-react';

// Maps analyzer types to body part positions and names
const analyzerPositions: Record<string, { position: [number, number, number]; name: string }> = {
    xray: { position: [0, 1, 0], name: 'Chest X-Ray Analysis' },
    ct_scan: { position: [0, 1, 0], name: 'CT Scan Analysis' },
    ecg: { position: [0, 1.1, 0], name: 'ECG Analysis' },
    mri_scan: { position: [0, 1.8, 0], name: 'MRI Scan Analysis' },
    eeg: { position: [0, 1.8, 0], name: 'EEG Analysis' },
    pain_locator: { position: [0.5, 0.5, 0], name: 'Pain Location Analysis' },
    derma_scan: { position: [-0.5, 0.5, 0], name: 'Derma Scan Analysis' },
    diabetic_retinopathy: { position: [0, 1.9, 0], name: 'Diabetic Retinopathy Analysis' },
};

const HumanModel = () => {
    const bodyMaterial = <meshStandardMaterial color="#C2A7FF" transparent opacity={0.3} roughness={0.5} />;
    return (
        <group>
            {/* Head */}
            <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.3, 32, 32]} />
                {bodyMaterial}
            </mesh>
            {/* Torso */}
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.5, 0.4, 1.2, 32]} />
                {bodyMaterial}
            </mesh>
            {/* Hips */}
             <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
                {bodyMaterial}
            </mesh>
            {/* Legs */}
            <mesh position={[-0.25, -0.5, 0]}>
                <cylinderGeometry args={[0.15, 0.1, 1.6, 32]} />
                {bodyMaterial}
            </mesh>
             <mesh position={[0.25, -0.5, 0]}>
                <cylinderGeometry args={[0.15, 0.1, 1.6, 32]} />
                {bodyMaterial}
            </mesh>
            {/* Arms */}
            <mesh position={[-0.7, 0.8, 0]} rotation={[0,0,0.4]}>
                <cylinderGeometry args={[0.1, 0.08, 1.2, 32]} />
                {bodyMaterial}
            </mesh>
            <mesh position={[0.7, 0.8, 0]} rotation={[0,0,-0.4]}>
                <cylinderGeometry args={[0.1, 0.08, 1.2, 32]} />
                {bodyMaterial}
            </mesh>
        </group>
    );
};

const InteractiveNode: React.FC<{ analysis: DashboardAnalysis; onClick: (analysis: DashboardAnalysis) => void }> = ({ analysis, onClick }) => {
    const ref = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);
    const posData = analyzerPositions[analysis.analyzer_type.replace(/_analyzer$/, '')];
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        ref.current.rotation.y = t * 0.5;
        ref.current.position.y = posData.position[1] + Math.sin(t * 2 + posData.position[0]) * 0.05;
    });

    if (!posData) return null;

    return (
        <group position={posData.position}>
             <mesh 
                ref={ref}
                onClick={(e) => { e.stopPropagation(); onClick(analysis); }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
             >
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={hovered ? "#6FFFCF" : "#FF9BBD"} emissive={hovered ? "#6FFFCF" : "#FF9BBD"} emissiveIntensity={2} toneMapped={false} />
            </mesh>
            {hovered && (
                <Text position={[0, 0.2, 0]} fontSize={0.1} color="white" anchorX="center" anchorY="middle">
                    {posData.name}
                </Text>
            )}
        </group>
    );
};

const DataPanel: React.FC<{ analysis: DashboardAnalysis | null, onClose: () => void }> = ({ analysis, onClose }) => {
    if (!analysis) return null;

    const info = analyzerPositions[analysis.analyzer_type.replace(/_analyzer$/, '')];

    return (
        <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-[hsl(var(--card))]/80 backdrop-blur-md p-6 animate-slideInRight overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10"><X/></button>
            <h2 className="text-2xl font-bold text-white mb-2">{info?.name || 'Analysis Details'}</h2>
            <p className="text-sm text-slate-400 mb-6">Performed on {new Date(analysis.created_at).toLocaleString()}</p>
            <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-xs font-semibold uppercase text-slate-400">Analysis ID</p>
                    <p className="text-lg font-mono text-white">{analysis.id}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-xs font-semibold uppercase text-slate-400">Analysis Type</p>
                    <p className="text-lg text-white capitalize">{analysis.analyzer_type.replace(/[-_]/g, ' ')}</p>
                </div>
                 <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-xs font-semibold uppercase text-slate-400">Next Steps</p>
                    <ul className="text-sm text-slate-300 list-disc list-inside mt-2 space-y-1">
                        <li>Discuss this result with your doctor during your next consultation.</li>
                        <li>Keep a journal of any related symptoms you experience.</li>
                        <li>Consider a follow-up analysis if recommended by your healthcare provider.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const DigitalTwin: React.FC = () => {
    const [analyses, setAnalyses] = useState<DashboardAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<DashboardAnalysis | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await (supabase.auth as any).getUser();
            if (!user) throw new Error("You must be logged in.");

            const { data, error: fetchError } = await supabase
                .from('ai_analysis_log')
                .select('id, created_at, analyzer_type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAnalyses(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load health data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <LoadingState message="Building your Digital Twin..." />;
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="relative w-full h-[calc(100vh-10rem)] rounded-2xl overflow-hidden animate-fadeIn">
            <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={2} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#C2A7FF" />
                <Suspense fallback={null}>
                    <HumanModel />
                    {analyses.map(analysis => (
                        <InteractiveNode key={analysis.id} analysis={analysis} onClick={setSelectedAnalysis} />
                    ))}
                </Suspense>
                <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
            </Canvas>
            <DataPanel analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
             {!selectedAnalysis && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm p-3 rounded-full text-white text-sm animate-fadeIn">
                    <p>Click and drag to explore your Digital Twin. Select a glowing node for details.</p>
                </div>
             )}
        </div>
    );
};

export default DigitalTwin;