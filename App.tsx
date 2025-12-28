import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Wand2, Loader2, Volume2, VolumeX, Upload, X, Minimize2, Trees } from 'lucide-react';
import TreeParticles from './components/TreeParticles';
import StarParticles from './components/StarParticles';
import TreeAttachments from './components/TreeAttachments';
import { generateHolidayGreeting } from './services/geminiService';
import { LoadingState, GreetingCardData } from './types';
import * as THREE from 'three';

// Simple Snow Component
const Snow = () => (
  <Sparkles 
    count={500} 
    scale={[20, 20, 20]} 
    size={2} 
    speed={0.5} 
    opacity={0.6} 
    color="#ffffff" 
  />
);

const App: React.FC = () => {
  const [greeting, setGreeting] = useState<string>("");
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [muted, setMuted] = useState(true);

  // Card State
  const [showCardForm, setShowCardForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [cards, setCards] = useState<GreetingCardData[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    image: null as string | null
  });

  const handleGenerateWish = async () => {
    setLoadingState(LoadingState.LOADING);
    try {
      const text = await generateHolidayGreeting("Golden Particle Christmas Tree");
      setGreeting(text);
      setLoadingState(LoadingState.SUCCESS);
    } catch (e) {
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreviewCard = () => {
    if (formData.name && formData.message) {
      setShowCardForm(false);
      setShowPreview(true);
    }
  };

  const handleCollapseCard = () => {
    // 1. Calculate Random Position on Tree Surface
    const treeHeight = 12;
    const maxRadius = 5.0; // Slightly inside the particle bounds
    
    // Random height between bottom (roughly -4) and top (roughly 6)
    // Particle tree logic: y goes from approx -4 to 8. Let's aim for the main body.
    const yMin = -3;
    const yMax = 5;
    const y = yMin + Math.random() * (yMax - yMin);

    // Normalize height for radius calculation (0 at bottom, 1 at top approx)
    const yNorm = (y - (-4)) / 12; 
    // Cone radius at this height
    const r = maxRadius * (1 - Math.pow(Math.max(0, yNorm), 0.8));
    
    // Random angle
    const theta = Math.random() * Math.PI * 2;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    // Orientation: Look away from center
    const position: [number, number, number] = [x, y, z];
    const dummyObj = new THREE.Object3D();
    dummyObj.position.set(x, y, z);
    dummyObj.lookAt(0, y, 0); // Look at center
    // We want the card to face OUT, so rotate 180 deg around Y relative to lookAt
    dummyObj.rotateY(Math.PI); 
    
    const rotation: [number, number, number] = [
        dummyObj.rotation.x,
        dummyObj.rotation.y,
        dummyObj.rotation.z
    ];

    const newCard: GreetingCardData = {
        id: Date.now().toString(),
        name: formData.name,
        message: formData.message,
        image: formData.image,
        position,
        rotation
    };

    setCards(prev => [...prev, newCard]);
    setShowPreview(false);
    
    // Reset Form
    setFormData({ name: '', message: '', image: null });
  };

  return (
    <div className="relative w-full h-full bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas 
            camera={{ position: [0, 5, 18], fov: 45 }}
            gl={{ antialias: false, alpha: false }}
        >
            <color attach="background" args={['#050505']} />
            
            <Suspense fallback={null}>
                {/* Scene Content */}
                <group position={[0, -4, 0]}>
                    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                        <TreeParticles onClick={() => setShowCardForm(true)} />
                        <TreeAttachments cards={cards} />
                        <StarParticles />
                    </Float>
                </group>

                {/* Atmosphere */}
                <Snow />
                <ambientLight intensity={0.2} color="#001100" />
                
                {/* Post Processing for Cinematic Look */}
                <EffectComposer disableNormalPass>
                    <Bloom 
                        luminanceThreshold={0.2} 
                        mipmapBlur 
                        intensity={1.5} 
                        radius={0.6} 
                    />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
                
                <OrbitControls 
                    enablePan={false} 
                    minPolarAngle={Math.PI / 3} 
                    maxPolarAngle={Math.PI / 1.8}
                    autoRotate
                    autoRotateSpeed={0.5}
                    minDistance={10}
                    maxDistance={30}
                />
            </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        
        {/* Header */}
        <header className="flex justify-between items-start">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-lg">
                    LUMINA
                </h1>
                <p className="text-xs md:text-sm text-yellow-500/60 uppercase tracking-widest font-mono">
                    Project X-MAS // Gemini Core
                </p>
            </div>
            
            <button 
                onClick={() => setMuted(!muted)}
                className="pointer-events-auto p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors group"
            >
                {muted ? <VolumeX size={18} className="text-gray-400 group-hover:text-white"/> : <Volume2 size={18} className="text-yellow-400"/>}
            </button>
        </header>

        {/* Center Content - Gemini Greeting Display */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
            {greeting && !showCardForm && !showPreview && (
                <div className="max-w-xl text-center pointer-events-auto animate-in fade-in zoom-in duration-1000">
                    <div className="bg-black/30 backdrop-blur-xl border border-yellow-500/20 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                        <p className="text-lg md:text-2xl font-light leading-relaxed text-yellow-100 italic">
                            "{greeting}"
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer / Controls */}
        <footer className="flex flex-row items-center justify-center gap-4 pointer-events-auto">
            {/* Click instruction hint */}
            <div className="absolute bottom-24 text-white/30 text-xs tracking-widest animate-pulse pointer-events-none">
                CLICK THE TREE TO MAKE A WISH
            </div>

            {/* Gemini Generate Button */}
            <button
                onClick={handleGenerateWish}
                disabled={loadingState === LoadingState.LOADING}
                className={`
                    group relative px-8 py-4 rounded-full overflow-hidden transition-all duration-300
                    ${loadingState === LoadingState.LOADING ? 'cursor-not-allowed opacity-80' : 'hover:scale-105'}
                `}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/80 to-red-900/80 backdrop-blur-xl border border-yellow-500/30 group-hover:border-yellow-400/60 transition-colors"></div>
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="relative flex items-center gap-3 text-yellow-100 font-light tracking-wide">
                    {loadingState === LoadingState.LOADING ? (
                        <Loader2 className="animate-spin w-5 h-5 text-yellow-400" />
                    ) : (
                        <Wand2 className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                    )}
                    <span>
                        {loadingState === LoadingState.LOADING ? 'Dreaming...' : 'Generate Holiday Wish'}
                    </span>
                </div>
            </button>
        </footer>
      </div>

      {/* --- FORM MODAL --- */}
      {showCardForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative mx-4">
                <button 
                    onClick={() => setShowCardForm(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <h2 className="text-2xl font-light text-yellow-400 mb-6 text-center">Create your Card</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Your Name</label>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Blessing Message</label>
                        <textarea 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white h-24 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                            placeholder="Your holiday wishes..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Attach Image (Optional)</label>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="card-image-upload"
                            />
                            <label 
                                htmlFor="card-image-upload"
                                className="flex items-center justify-center gap-2 w-full bg-zinc-800/50 border border-dashed border-zinc-600 hover:border-zinc-400 rounded-lg px-4 py-8 cursor-pointer transition-colors"
                            >
                                {formData.image ? (
                                    <div className="text-center">
                                        <img src={formData.image} alt="Preview" className="h-16 w-auto mx-auto rounded mb-2 object-cover" />
                                        <span className="text-xs text-green-400">Image attached</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={16} className="text-zinc-400" />
                                        <span className="text-sm text-zinc-400">Click to upload</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={handlePreviewCard}
                        disabled={!formData.name || !formData.message}
                        className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Card
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CARD PREVIEW MODAL --- */}
      {showPreview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
            {/* The 3D Card Visual */}
            <div className="relative w-[340px] md:w-[400px] bg-red-900 rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-transform hover:scale-[1.02]">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-600"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"></div>

                {/* Header Section */}
                <div className="p-6 pb-2 flex justify-between items-start">
                    <span className="font-serif text-yellow-400/80 text-xl tracking-widest">2025</span>
                    <div className="text-right">
                        <span className="block text-[10px] text-yellow-500/60 uppercase tracking-widest">From DEAR</span>
                        <span className="font-serif text-white text-lg">{formData.name}</span>
                    </div>
                </div>

                {/* Cover/Content Area */}
                <div className="flex-1 p-6 pt-2 flex flex-col items-center text-center space-y-4">
                    {/* Gold Tree Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-950/50 flex items-center justify-center border border-yellow-500/30 shadow-inner">
                        <Trees className="text-yellow-400 w-8 h-8" />
                    </div>

                    {/* Image Area */}
                    {formData.image && (
                         <div className="w-full h-40 rounded-lg overflow-hidden border border-yellow-500/20 shadow-lg">
                            <img src={formData.image} alt="User upload" className="w-full h-full object-cover" />
                         </div>
                    )}

                    {/* Message */}
                    <div className="relative py-4">
                        <p className="text-yellow-100/90 font-light italic leading-relaxed text-sm md:text-base px-2">
                           "{formData.message}"
                        </p>
                    </div>
                </div>

                {/* Collapse Button (Bottom Right) */}
                <div className="absolute bottom-4 right-4">
                    <button 
                        onClick={handleCollapseCard}
                        className="flex items-center gap-1 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/80 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-white/10"
                    >
                        <Minimize2 size={12} />
                        <span>Collapse</span>
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;