
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDecadeImage, generateAudioDescription, generateDecadeVideo, editDecadeImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';
import CameraCapture from './components/CameraCapture';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import { decode } from './lib/audioUtils';

// Firebase Integration
import { 
    auth, 
    db, 
    onAuthStateChanged, 
    User, 
    signOut, 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    getDoc 
} from './firebase';


const DECADES = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s'];

const DECADE_DESCRIPTIONS: Record<string, string> = {
    '1900s': "The turn of the century, known as the Belle Époque. High collars, S-bend corsets for women, and formal three-piece suits for men. A time of artistic elegance before the great wars.",
    '1910s': "The decade of the Titanic and World War I. Fashion saw a move towards more practical clothing, with military influences, hobble skirts, and the rise of more relaxed silhouettes.",
    '1920s': "The Roaring Twenties. Flapper dresses, sharp suits, Art Deco elegance, and the dawn of jazz. A revolutionary era of social and artistic change.",
    '1930s': "The Golden Age of Hollywood. Glamorous gowns, tailored suits, and dramatic studio lighting. An era of escapism through silver screen elegance.",
    '1940s': "Dominated by World War II. Utilitarian fashion with sharp, padded shoulders and tailored suits for women. A sense of 'make do and mend' gave way to post-war optimism and pin-up glamour.",
    '1950s': "The era of rock 'n' roll, greaser jackets, and poodle skirts. Think classic Hollywood glamour and the birth of teenage rebellion.",
    '1960s': "A revolution in fashion, from polished Mod looks to the free-spirited hippie movement with bell-bottoms and psychedelic prints.",
    '1970s': "Defined by disco fever and bohemian flair. Earth tones, flare jeans, platform shoes, and feathered hair were all the rage.",
    '1980s': "Bigger was better! Big hair, bold colors, shoulder pads, and neon everything. The decade of pop icons and power dressing.",
    '1990s': "From grunge rock's flannel and ripped jeans to hip-hop's baggy sportswear. A decade of casual, minimalist, and alternative styles.",
    '2000s': "The new millennium brought low-rise jeans, velour tracksuits, and a heavy dose of denim, all with a touch of Y2K tech optimism.",
    '2010s': "The era of social media, indie pop, and hipster culture. Skinny jeans, plaid shirts, vintage-inspired filters, and the rise of the influencer aesthetic.",
};

const DECADE_STYLES: Record<string, string> = {
    '1900s': "Recreate the look of early portrait photography. The image should be in black-and-white or a heavily faded sepia tone, with a soft, almost ethereal focus. The lighting should be natural or simple studio light, mimicking the style of albumen or platinum prints. The image should feel formal and posed.",
    '1910s': "Emulate the look of photography from this decade. Images should be in black-and-white or sepia, with a sharper focus than the 1900s but still retaining a classic, slightly grainy feel. The tone can be somber or formal, reflecting the era's mood. Posing should be stiff and traditional, as was common.",
    '1920s': "recreate the soft-focus, romanticized look of black-and-white or sepia-toned portraits from the era. Use lighting that creates dramatic shadows (like Rembrandt lighting), typical of studio photography of the time. The image should have a subtle grain and a timeless, classic feel.",
    '1930s': "emulate the high-glamour, sharp, and glossy look of Hollywood studio portraits. The lighting should be dramatic and controlled, creating a soft glow on the subject while maintaining deep, rich blacks. The final image should feel polished and aspirational, like a silver screen movie star's photograph.",
    '1940s': "Capture the look of 40s photography. It could be either black-and-white or early, subtly saturated color (like early Kodachrome). The lighting should be purposeful, creating a mix of glamour and seriousness, reminiscent of film noir or wartime Hollywood portraits. The image should feel strong and defined.",
    '1950s': "emulate the classic, slightly desaturated look of early color photography from that time. The image should have a hint of film grain and a soft focus, reminiscent of Kodachrome or early Ektachrome film.",
    '1960s': "capture the shift from polished, sharp, high-contrast fashion photography to the vibrant, saturated, and sometimes dreamlike quality of the late 60s. A vintage lens flare or slight color bleeding effect would be appropriate.",
    '1970s': "the photo must have a warm, earthy color palette with a distinct yellow or orange cast. Use a soft focus, noticeable film grain, and a slightly faded look, as if it were a well-loved photo print from an old album.",
    '1980s': "go for a sharp, glossy look with vibrant, potentially neon, colors. The photo should have higher contrast and could feature studio lighting effects like soft glows or defined lens flare, typical of 8s portrait and pop photography.",
    '1990s': "recreate the look of 90s point-and-shoot 35mm film cameras. The image should have a straightforward, slightly muted color palette, visible film grain, and the direct, sometimes harsh, look of an on-camera flash.",
    '2000s': "mimic the aesthetic of early consumer digital cameras. The image should be sharp, but may have some subtle digital noise or artifacts, slightly oversaturated colors, and the harsh, direct lighting from a built-in flash.",
    '2010s': "emulate the look of a high-quality smartphone photo with a popular Instagram-like filter (e.g., Valencia or X-Pro II). The image should have high saturation, possibly with a slight vignette or tilt-shift effect, capturing the polished-yet-casual social media aesthetic of the time.",
};


// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '2%', rotate: -8 },    // 1900s
    { top: '35%', left: '5%', rotate: 10 },   // 1910s
    { top: '65%', left: '2%', rotate: -5 },   // 1920s
    { top: '2%', left: '25%', rotate: 5 },    // 1930s
    { top: '40%', left: '28%', rotate: -3 },  // 1940s
    { top: '70%', left: '25%', rotate: 12 },  // 1950s
    { top: '5%', left: '50%', rotate: -6 },   // 1960s
    { top: '38%', left: '53%', rotate: 4 },   // 1970s
    { top: '68%', left: '51%', rotate: -9 },  // 1980s
    { top: '2%', left: '75%', rotate: 8 },    // 1990s
    { top: '42%', left: '72%', rotate: -11 }, // 2000s
    { top: '72%', left: '75%', rotate: 6 },   // 2010s
];


const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
type FeatureStatus = 'idle' | 'pending' | 'done' | 'error';

interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
    videoUrl?: string;
    videoStatus?: FeatureStatus;
    audioStatus?: FeatureStatus;
}
interface UserProfile {
    displayName: string;
    avatar?: string;
}
interface Session {
    id: string;
    created_at?: any;
    uploadedImage: string;
    generatedImages: Record<string, GeneratedImage>;
    generatedDecades: string[];
}

// Glass-themed buttons
const primaryButtonClasses = "font-permanent-marker text-base sm:text-xl text-center text-black bg-cyan-400 border border-cyan-400 py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.4)] transform transition-all duration-300 hover:scale-[1.03] hover:-rotate-1 hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0 disabled:hover:shadow-none";
const secondaryButtonClasses = "font-permanent-marker text-base sm:text-xl text-center text-cyan-100 bg-white/5 border border-white/10 backdrop-blur-md py-3 px-6 rounded-xl transform transition-all duration-300 hover:scale-[1.03] hover:rotate-1 hover:bg-white/10 hover:border-cyan-400/50 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed";

// Common Modal Backdrop style
const modalBackdropClasses = "fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4";
const modalContainerClasses = "w-full max-w-md bg-[#0a0a0a]/60 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden";


const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

// --- Helper Functions for Audio Playback ---
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


// --- New UI Components ---

const UserDisplay = ({ profile, onEditProfile, onShowHistory }: { profile: UserProfile, onEditProfile: () => void, onShowHistory: () => void }) => (
    <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <button
            onClick={onShowHistory}
            className="flex items-center gap-2 group p-2 rounded-full hover:bg-white/5 transition-colors"
            aria-label="View your generation history"
        >
            <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:border-cyan-400/50 transition-colors backdrop-blur-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-300 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <span className="font-permanent-marker text-neutral-300 group-hover:text-cyan-400 transition-colors hidden md:inline text-sm drop-shadow-sm">History</span>
        </button>
        <button
            onClick={onEditProfile}
            className="flex items-center gap-3 group p-1 pr-4 rounded-full bg-black/20 hover:bg-white/10 border border-white/5 hover:border-cyan-400/30 backdrop-blur-md transition-all shadow-lg"
            aria-label="Edit your profile"
        >
            {profile.avatar ? (
                <img src={profile.avatar} alt="User avatar" className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:border-cyan-400 transition-all duration-300" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-cyan-900/50 flex items-center justify-center border border-white/20 group-hover:border-cyan-400 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            )}
             <span className="truncate max-w-xs text-neutral-200 group-hover:text-cyan-400 transition-colors hidden sm:inline text-sm font-medium tracking-wide">{profile.displayName}</span>
        </button>
    </div>
);


const HistoryPanel = ({ sessions, onLoadSession, onClose }: { sessions: Session[], onLoadSession: (session: Session) => void, onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={modalBackdropClasses}
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-5xl h-[80vh] bg-[#050a19]/90 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Background blob for style */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6 z-10">
                <h2 className="font-permanent-marker text-2xl sm:text-3xl text-neutral-100 tracking-wide">Time Travel Log</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {sessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 z-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="font-permanent-marker text-lg">No history yet.</p>
                    <p className="text-sm opacity-70 mt-1">Your generated albums will appear here.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pr-2 z-10 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-4">
                    {sessions.map(session => (
                        <motion.button
                            key={session.id}
                            onClick={() => onLoadSession(session)}
                            className="aspect-square bg-white/5 rounded-2xl overflow-hidden group relative border border-white/5 hover:border-cyan-400/50 focus:border-cyan-400 transition-all duration-300 shadow-lg"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <img src={session.uploadedImage} alt="Uploaded" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 text-left">
                                <p className="text-white text-xs font-bold truncate">
                                    {/* Handle Firestore Timestamp or standard Date */}
                                    {session.created_at?.seconds 
                                        ? new Date(session.created_at.seconds * 1000).toLocaleDateString() 
                                        : 'Unknown Date'}
                                </p>
                                <p className="text-cyan-400/80 text-[10px] mt-0.5 font-medium">
                                    {Object.keys(session.generatedImages || {}).length} photos
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    </motion.div>
);

const VideoPlayerModal = ({ decade, videoUrl, onClose }: { decade: string, videoUrl: string, onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={modalBackdropClasses}
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-3xl bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 flex justify-between items-center bg-white/5 border-b border-white/5 backdrop-blur-sm">
                <h2 className="font-permanent-marker text-xl text-neutral-200">{decade} - In Motion</h2>
                <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">&times;</button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            </div>
            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end backdrop-blur-sm">
                <button onClick={onClose} className={`${secondaryButtonClasses} !text-sm !py-2 !px-4 !bg-white/10 !border-white/20 !text-white`}>Close Player</button>
            </div>
        </motion.div>
    </motion.div>
);

const ApiKeyPrompt = ({ onSelectKey, onClose }: { onSelectKey: () => void, onClose: () => void }) => (
     <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={modalBackdropClasses}
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className={modalContainerClasses}
        >
             <div className="mb-4 p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h2 className="font-permanent-marker text-xl sm:text-2xl text-neutral-100 mb-3 text-center">API Key Required</h2>
            <p className="text-neutral-400 text-center mb-6 text-sm leading-relaxed">
                Video generation requires your own Google AI API key. This feature is free during the preview period.
            </p>
            <p className="text-xs text-neutral-500 mb-8 text-center bg-white/5 p-3 rounded-lg border border-white/5">
                See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">billing documentation</a> for details.
            </p>
            <div className="flex gap-4 w-full">
                <button onClick={onClose} className={`${secondaryButtonClasses} w-full`}>Cancel</button>
                <button onClick={onSelectKey} className={`${primaryButtonClasses} w-full`}>Select Key</button>
            </div>
        </motion.div>
    </motion.div>
);

const VideoOptionsModal = ({ decade, onClose, onStartAnimation }: { decade: string | null; onClose: () => void; onStartAnimation: (decade: string, aspectRatio: '9:16' | '16:9') => void; }) => {
    if (!decade) return null;

    const handleSelect = (aspectRatio: '9:16' | '16:9') => {
        onStartAnimation(decade, aspectRatio);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalBackdropClasses}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className={modalContainerClasses}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="font-permanent-marker text-xl sm:text-2xl text-neutral-200 mb-2">Animate '{decade}'</h2>
                <p className="text-neutral-400 mb-8 text-sm">Choose an aspect ratio for your video.</p>
                <div className="grid grid-cols-2 gap-4 w-full mb-6">
                    <button onClick={() => handleSelect('9:16')} className="group flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all">
                        <div className="w-12 h-20 border-2 border-neutral-600 group-hover:border-cyan-400 rounded-lg bg-neutral-800 shadow-lg"></div>
                        <span className="text-sm font-medium text-neutral-300 group-hover:text-cyan-400">Portrait</span>
                    </button>
                    <button onClick={() => handleSelect('16:9')} className="group flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all">
                         <div className="w-20 h-12 border-2 border-neutral-600 group-hover:border-cyan-400 rounded-lg bg-neutral-800 shadow-lg"></div>
                        <span className="text-sm font-medium text-neutral-300 group-hover:text-cyan-400">Landscape</span>
                    </button>
                </div>
                 <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-sm underline decoration-neutral-500/50 hover:decoration-neutral-300">Cancel</button>
            </motion.div>
        </motion.div>
    );
};

const ImageEditModal = ({ editingImage, onClose, onApplyEdit }: { editingImage: { decade: string; url: string; } | null; onClose: () => void; onApplyEdit: (decade: string, prompt: string) => Promise<void>; }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editingImage) {
            setPrompt('');
            setIsEditing(false);
            setError(null);
        }
    }, [editingImage]);

    if (!editingImage) return null;

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError("Please enter an edit instruction.");
            return;
        }
        setIsEditing(true);
        setError(null);
        try {
            await onApplyEdit(editingImage.decade, prompt);
        } catch (err) {
            setError(parseErrorMessage(err));
        } finally {
            setIsEditing(false);
        }
    };
    
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalBackdropClasses}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className={modalContainerClasses}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="font-permanent-marker text-xl sm:text-2xl text-neutral-200 mb-6">Edit '{editingImage.decade}'</h2>
                <div className="w-full flex justify-center mb-6">
                     <img src={editingImage.url} alt={`Image for ${editingImage.decade}`} className="w-32 aspect-[3/4] object-cover rounded-lg border border-white/20 shadow-lg rotate-2" />
                </div>
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your change (e.g., 'Add a hat', 'Make it brighter')"
                    className="w-full h-24 p-4 text-sm text-neutral-200 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none transition-all placeholder-neutral-600 mb-2 backdrop-blur-sm"
                />
                {error && <p className="text-red-400 text-xs text-center mb-4 bg-red-900/20 p-2 rounded-lg w-full border border-red-900/30">{error}</p>}
                <div className="flex gap-3 w-full mt-4">
                    <button onClick={onClose} className={`${secondaryButtonClasses} flex-1 !text-sm`} disabled={isEditing}>Cancel</button>
                    <button onClick={handleSubmit} className={`${primaryButtonClasses} flex-1 !text-sm`} disabled={isEditing}>
                        {isEditing ? 'Processing...' : 'Apply Edit'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// User-friendly error message parser
const parseErrorMessage = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);

    // Image Generation & Editing Errors
    if (message.includes("responded with text instead of an image")) {
        return "The AI couldn't create an image, possibly due to safety filters. Try a different photo or decade.";
    }
    if (message.includes("failed with both original and fallback prompts")) {
        return "The AI failed after multiple attempts. Please try again later or with a different photo.";
    }
    if (message.includes("failed to generate an image")) {
        return "An unexpected error occurred during image generation. Please check your connection and try again.";
    }
     if (message.includes("failed to edit the image")) {
        return "The AI failed to edit the image. This could be due to safety filters or a complex request. Try a different instruction.";
    }

    // Video Generation Errors
    if (message.includes("API key not valid") || message.includes("API_KEY_INVALID") || message.includes("Requested entity was not found.")) {
         return "API Key error. Please ensure your key is valid and has the 'Generative Language API' enabled, then re-select it and try again.";
    }
    if (message.includes("prompt was blocked")) {
        return "The video request was blocked due to safety filters. Please try a different photo or decade.";
    }
    if (message.includes("Video generation failed")) {
         return "The AI failed to create a video. This can happen with complex requests or a temporary service issue. Please try again.";
    }

    return "An unknown error occurred. Please try again.";
};


function App() {
    const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile>({ displayName: '', avatar: undefined });
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [selectedDecades, setSelectedDecades] = useState<string[]>(DECADES);
    const [generatedDecades, setGeneratedDecades] = useState<string[]>([]);
    const [isShareSupported, setIsShareSupported] = useState(false);
    const [videoModal, setVideoModal] = useState<{ decade: string; url: string } | null>(null);
    const [isApiKeyPromptOpen, setIsApiKeyPromptOpen] = useState(false);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [decadeToAnimate, setDecadeToAnimate] = useState<string | null>(null);
    const [editingImage, setEditingImage] = useState<{ decade: string; url: string } | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Firebase Authentication Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setAuthStatus('authenticated');
            } else {
                setUser(null);
                setAuthStatus('unauthenticated');
                setProfile({ displayName: '', avatar: undefined });
                setSessions([]);
                handleReset();
            }
        });

        return () => unsubscribe();
    }, []);

    // Load Profile & Sessions
    useEffect(() => {
        if (user) {
            fetchProfile(user.uid);
            fetchSessions(user.uid);
        }
    }, [user]);

     useEffect(() => {
        if (navigator.share) {
            setIsShareSupported(true);
        }
        // Initialize AudioContext on first user interaction (or effect)
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                setProfile({ displayName: data.displayName, avatar: data.avatar });
            } else {
                // Create default profile document if it doesn't exist
                const defaultName = user?.email?.split('@')[0] || 'Time Traveler';
                await setDoc(userDocRef, {
                    displayName: defaultName,
                    email: user?.email,
                    createdAt: new Date()
                });
                setProfile({ displayName: defaultName, avatar: undefined });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchSessions = async (userId: string) => {
        try {
            const sessionsRef = collection(db, 'sessions');
            const q = query(
                sessionsRef, 
                where("userId", "==", userId),
                orderBy("created_at", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const mappedSessions: Session[] = [];
            
            querySnapshot.forEach((doc: any) => {
                const data = doc.data ? doc.data() : doc;
                mappedSessions.push({
                    id: doc.id,
                    created_at: data.created_at,
                    uploadedImage: data.uploadedImage,
                    generatedDecades: data.generatedDecades,
                    generatedImages: data.generatedImages
                });
            });
            
            setSessions(mappedSessions);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const loadSession = (session: Session) => {
        setCurrentSessionId(session.id);
        setUploadedImage(session.uploadedImage);
        setGeneratedImages(session.generatedImages || {});
        setGeneratedDecades(session.generatedDecades || []);
        setAppState('results-shown');
        setIsHistoryOpen(false);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({});
                setSelectedDecades(DECADES);
                setGeneratedDecades([]);
                setCurrentSessionId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageCapture = (imageDataUrl: string) => {
        setUploadedImage(imageDataUrl);
        setAppState('image-uploaded');
        setGeneratedImages({});
        setSelectedDecades(DECADES);
        setGeneratedDecades([]);
        setCurrentSessionId(null);
        setIsCameraOpen(false);
    };

    const handleDecadeSelection = (decade: string) => {
        setSelectedDecades(prev =>
            prev.includes(decade)
                ? prev.filter(d => d !== decade)
                : [...prev, decade]
        );
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage || selectedDecades.length === 0 || !user) return;

        setGeneratedDecades(selectedDecades);
        setIsLoading(true);
        setAppState('generating');
        
        const initialImages: Record<string, GeneratedImage> = {};
        selectedDecades.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        let newSessionId = '';
        try {
            // Create new session in Firestore
            const sessionsRef = collection(db, 'sessions');
            const docRef = await addDoc(sessionsRef, {
                userId: user.uid,
                uploadedImage: uploadedImage,
                generatedDecades: selectedDecades,
                generatedImages: initialImages,
                created_at: new Date()
            });

            newSessionId = docRef.id;
            setCurrentSessionId(newSessionId);
            fetchSessions(user.uid); // Refresh list
        } catch (error) {
            console.error("Failed to create new session in Firestore:", error);
            alert("Could not save your new session. Please check your connection and try again.");
            setIsLoading(false);
            setAppState('image-uploaded');
            return;
        }


        const concurrencyLimit = 2;
        const decadesQueue = [...selectedDecades];
        
        // Helper to update state and DB for a specific decade
        const updateImageState = async (decade: string, newState: GeneratedImage) => {
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: newState };
                
                // Fire and forget update to DB
                if (newSessionId) {
                    const sessionDocRef = doc(db, 'sessions', newSessionId);
                    updateDoc(sessionDocRef, {
                        generatedImages: updated
                    }).catch(err => console.error("Error updating session:", err));
                }
                
                return updated;
            });
        };

        const processDecade = async (decade: string) => {
            try {
                const prompt = `You are an expert fashion historian and photographer. Your task is to reimagine the person in this photo as if they were living in the ${decade}. **Primary Goal**: Create a photorealistic image that is authentic to the ${decade}. The person's face and key features must be clearly recognizable. **Key Elements**: 1.  **Clothing & Hairstyle**: Must be strictly era-appropriate for the ${decade}. 2.  **Photographic Style**: The image must visually match the photography of the era. Follow these specific style guidelines: *${DECADE_STYLES[decade]}* 3.  **Output Format**: The output must be ONLY the image. Do not include any text, captions, or descriptions.`;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt);
                await updateImageState(decade, { status: 'done', url: resultUrl });
            } catch (err) {
                const userFriendlyError = parseErrorMessage(err);
                console.error(`Processing failed for ${decade}:`, err);
                await updateImageState(decade, { status: 'error', error: userFriendlyError });
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (decadesQueue.length > 0) {
                const decade = decadesQueue.shift();
                if (decade) {
                    await processDecade(decade);
                }
            }
        });

        await Promise.all(workers);
        setIsLoading(false);
        setAppState('results-shown');
    };

    // Helper for updating session JSONB
    const updateSessionImages = async (sessionId: string, newImagesMap: Record<string, GeneratedImage>) => {
        try {
            const sessionDocRef = doc(db, 'sessions', sessionId);
            await updateDoc(sessionDocRef, { generatedImages: newImagesMap });
        } catch (error) {
            console.error("Error saving updates to Firestore:", error);
        }
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage || !user || !currentSessionId) return;
        if (generatedImages[decade]?.status === 'pending') return;
        
        // Set pending
        setGeneratedImages(prev => {
            const updated = { ...prev, [decade]: { status: 'pending' as ImageStatus } };
            updateSessionImages(currentSessionId, updated);
            return updated;
        });
        
        try {
            const prompt = `You are an expert fashion historian and photographer. Your task is to reimagine the person in this photo as if they were living in the ${decade}. **Primary Goal**: Create a photorealistic image that is authentic to the ${decade}. The person's face and key features must be clearly recognizable. **Key Elements**: 1.  **Clothing & Hairstyle**: Must be strictly era-appropriate for the ${decade}. 2.  **Photographic Style**: The image must visually match the photography of the era. Follow these specific style guidelines: *${DECADE_STYLES[decade]}* 3.  **Output Format**: The output must be ONLY the image. Do not include any text, captions, or descriptions.`;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt);
            
            const result: GeneratedImage = { status: 'done', url: resultUrl };
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: result };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        } catch (err) {
            const userFriendlyError = parseErrorMessage(err);
            const errorResult: GeneratedImage = { status: 'error', error: userFriendlyError };
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: errorResult };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        }
    };

    const handlePlayAudio = async (decade: string) => {
        if (!user || !currentSessionId || generatedImages[decade]?.audioStatus === 'pending') return;

        setGeneratedImages(prev => {
            const updated = { ...prev, [decade]: { ...prev[decade], audioStatus: 'pending' as FeatureStatus } };
            updateSessionImages(currentSessionId, updated);
            return updated;
        });

        try {
            const audioData = await generateAudioDescription(decade);
            const audioBuffer = await decodeAudioData(decode(audioData), audioContextRef.current!, 24000, 1);
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current!.destination);
            source.start();
            
             setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: { ...prev[decade], audioStatus: 'done' as FeatureStatus } };
                // No need to persist transient audio status done to DB necessarily, but we can
                return updated;
            });
        } catch (err) {
            console.error(`Failed to play audio for ${decade}:`, err);
             setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: { ...prev[decade], audioStatus: 'error' as FeatureStatus } };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        }
    };

    const handleAnimateDecade = (decade: string) => {
        const image = generatedImages[decade];
        if (!user || !currentSessionId || !image?.url || image.videoStatus === 'pending') return;
        setDecadeToAnimate(decade);
    };
    
    const handleStartAnimation = async (decade: string, aspectRatio: '9:16' | '16:9') => {
        setDecadeToAnimate(null); // Close the options modal
        const image = generatedImages[decade];
        if (!user || !currentSessionId || !image?.url) return;

        const keySelected = await window.aistudio.hasSelectedApiKey();
        if (!keySelected) {
            setIsApiKeyPromptOpen(true);
            return;
        }
        setIsApiKeySelected(true); // Assume success after check

        setGeneratedImages(prev => {
            const updated = { ...prev, [decade]: { ...prev[decade], videoStatus: 'pending' as FeatureStatus } };
            updateSessionImages(currentSessionId, updated);
            return updated;
        });

        try {
            const videoUrl = await generateDecadeVideo(image.url, decade, aspectRatio);
            const update: GeneratedImage = { ...generatedImages[decade], videoStatus: 'done', videoUrl: videoUrl };
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: update };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        } catch (err) {
            console.error(`Failed to animate decade ${decade}:`, err);
            const userFriendlyError = parseErrorMessage(err);
            const update: GeneratedImage = { ...generatedImages[decade], videoStatus: 'error', error: userFriendlyError };
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: update };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });

            if (userFriendlyError.includes("API Key error")) {
                setIsApiKeySelected(false); // Reset key state on this specific error
            }
        }
    };
    
    const handleOpenEditModal = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            setEditingImage({ decade, url: image.url });
        }
    };

    const handleApplyImageEdit = async (decade: string, prompt: string) => {
        if (!editingImage || !currentSessionId || !user) return;

        const originalImageState = { ...generatedImages[decade] };
        setGeneratedImages(prev => ({ ...prev, [decade]: { ...prev[decade], status: 'pending' as ImageStatus } }));
        setEditingImage(null); // Close modal immediately for better UX

        try {
            const newImageUrl = await editDecadeImage(editingImage.url, prompt);
            const update: GeneratedImage = {
                status: 'done',
                url: newImageUrl,
                videoUrl: undefined,
                videoStatus: 'idle',
                audioStatus: 'idle',
            };
            setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: update };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        } catch (err) {
            console.error(`Failed to edit image for ${decade}:`, err);
            const userFriendlyError = parseErrorMessage(err);
             setGeneratedImages(prev => {
                const updated = { ...prev, [decade]: { ...originalImageState, status: 'error' as ImageStatus, error: userFriendlyError } };
                updateSessionImages(currentSessionId, updated);
                return updated;
            });
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
        setSelectedDecades(DECADES);
        setGeneratedDecades([]);
        setCurrentSessionId(null);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleSaveProfile = async (newProfile: { displayName: string; avatar?: string }) => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, {
                    displayName: newProfile.displayName,
                    avatar: newProfile.avatar
                }, { merge: true });
                
                setProfile({ displayName: newProfile.displayName, avatar: newProfile.avatar });
                setIsProfileOpen(false);
            } catch (error) {
                console.error("Error saving profile to Firestore:", error);
                alert("Could not save your profile. Please check your connection.");
            }
        }
    };

    const handleDownloadIndividualImage = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `past-forward-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShareIndividualImage = async (decade: string) => {
        const image = generatedImages[decade];
        if (navigator.share && image?.status === 'done' && image.url) {
            try {
                const response = await fetch(image.url);
                const blob = await response.blob();
                const file = new File([blob], `past-forward-${decade}.jpg`, { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `My ${decade} look!`,
                        text: `Check out my photo from the ${decade}, created with Past Forward! #PastForwardAI`,
                        files: [file],
                    });
                } else {
                    console.warn("Sharing this file type is not supported.");
                }
            } catch (error) {
                console.error('Error sharing individual image:', error);
            }
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = (Object.entries(generatedImages) as [string, GeneratedImage][])
                .filter(([decade, image]) => generatedDecades.includes(decade) && image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No images were successfully generated to create an album.");
                return;
            }
            if (Object.keys(imageData).length < generatedDecades.length) {
                const allDone = generatedDecades.every(d => generatedImages[d]?.status !== 'pending');
                if (!allDone) {
                    alert("Please wait for all selected images to finish generating before downloading the album.");
                    return;
                }
            }

            const albumDataUrl = await createAlbumPage(imageData);
            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'past-forward-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShareAlbum = async () => {
        if (!isShareSupported) return;
        setIsSharing(true);
        try {
            const imageData = (Object.entries(generatedImages) as [string, GeneratedImage][])
                .filter(([decade, image]) => generatedDecades.includes(decade) && image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No successfully generated images to share.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);
            const response = await fetch(albumDataUrl);
            const blob = await response.blob();
            const file = new File([blob], 'past-forward-album.jpg', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Past Forward Album!',
                    text: 'Check out my journey through the decades! #PastForwardAI',
                    files: [file],
                });
            } else {
                console.warn("Sharing album file is not supported.");
            }
        } catch (error) {
            console.error("Error sharing album:", error);
        } finally {
            setIsSharing(false);
        }
    };

    const completedCount = (Object.values(generatedImages) as GeneratedImage[]).filter(img => img.status !== 'pending').length;
    const totalCount = generatedDecades.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return (
        <main className="bg-[#050a19] text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 pb-24 overflow-hidden relative selection:bg-cyan-400/30 font-sans">
            {/* Ambient Background with slow animation */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
                <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-blue-600/5 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
            </div>
            
            <AnimatePresence mode="wait">
                {authStatus === 'loading' && (
                    <motion.div key="loader" className="z-10 flex flex-col items-center justify-center flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <div className="relative">
                            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                        <p className="mt-4 font-permanent-marker text-cyan-400/80 animate-pulse tracking-wider">Loading Time Machine...</p>
                    </motion.div>
                )}
                {authStatus === 'unauthenticated' && (
                    <AuthPage key="auth" />
                )}
                {authStatus === 'authenticated' && user && (
                    <motion.div
                        key="app"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0"
                    >
                        <UserDisplay profile={profile} onEditProfile={() => setIsProfileOpen(true)} onShowHistory={() => setIsHistoryOpen(true)} />
                        
                        <div className="text-center mb-8 sm:mb-12 relative z-10">
                            <h1 className="text-6xl sm:text-8xl font-caveat font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-sm pb-2">Past Forward</h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto rounded-full blur-[1px]"></div>
                        </div>

                        {appState === 'idle' && (
                            <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
                                {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                                    <motion.div
                                        key={index}
                                        className="absolute w-64 h-80 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 blur-sm"
                                        initial={config.initial}
                                        animate={{ x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20, scale: 0, opacity: 0 }}
                                        transition={{ ...config.transition, ease: "circOut", duration: 2.5 }}
                                    />
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, duration: 1, type: 'spring' }}
                                    className="flex flex-col items-center z-20"
                                    onClick={() => {
                                        // Trigger file upload when clicking on the ghost polaroid
                                        document.getElementById('file-upload')?.click();
                                    }}
                                >
                                    <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                        <div className="relative p-1 rounded-sm bg-gradient-to-br from-cyan-400 to-purple-500 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                            <PolaroidCard caption="Click to begin" status="done" />
                                        </div>
                                    </label>
                                    <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                                    <div className="mt-8 flex flex-col items-center gap-4">
                                        <p className="font-permanent-marker text-neutral-400 text-center max-w-xs text-lg">
                                            Upload a photo to start.
                                        </p>
                                        <button onClick={(e) => { e.stopPropagation(); setIsCameraOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all group backdrop-blur-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-sm font-medium text-neutral-300 group-hover:text-white">Use Camera</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {appState === 'image-uploaded' && uploadedImage && (
                            <motion.div 
                                className="flex flex-col items-center gap-8 w-full max-w-4xl"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none" />
                                    
                                    <div className="relative transform rotate-[-3deg] z-10">
                                        <PolaroidCard imageUrl={uploadedImage} caption="Your Photo" status="done" />
                                    </div>
                                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
                                        <h3 className="font-permanent-marker text-2xl text-neutral-100 mb-4">Select Eras to Travel To</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                                            {DECADES.map(decade => (
                                                <button
                                                    key={decade}
                                                    onClick={() => handleDecadeSelection(decade)}
                                                    className={`text-sm font-bold py-2 px-3.5 rounded-lg transition-all duration-200 border backdrop-blur-sm ${
                                                        selectedDecades.includes(decade)
                                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)] scale-105'
                                                            : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/30 hover:text-white'
                                                    }`}
                                                >
                                                    {decade}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-4 mb-8">
                                            <button onClick={() => setSelectedDecades(DECADES)} className="text-xs text-neutral-400 hover:text-cyan-400 transition-colors underline decoration-transparent hover:decoration-cyan-400">Select All</button>
                                            <button onClick={() => setSelectedDecades([])} className="text-xs text-neutral-400 hover:text-white transition-colors underline decoration-transparent hover:decoration-white">Clear All</button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                                            <button onClick={handleGenerateClick} className={`${primaryButtonClasses} flex-1`} disabled={selectedDecades.length === 0 || isLoading}>
                                                Start Time Travel
                                            </button>
                                            <button onClick={() => { setUploadedImage(null); setAppState('idle'); setSelectedDecades(DECADES); }} className={`${secondaryButtonClasses} flex-1`}>
                                                Change Photo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(appState === 'generating' || appState === 'results-shown') && (
                            <>
                                {isMobile ? (
                                    <div className="w-full max-w-md grid grid-cols-2 gap-4 flex-1 overflow-y-auto mt-4 p-2 pb-20 scrollbar-hide">
                                        {generatedDecades.map((decade) => (
                                            <PolaroidCard
                                                key={decade}
                                                caption={decade}
                                                description={DECADE_DESCRIPTIONS[decade]}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                onShare={handleShareIndividualImage}
                                                onAnimate={handleAnimateDecade}
                                                onEdit={handleOpenEditModal}
                                                onPlayAudio={handlePlayAudio}
                                                onViewVideo={(d) => setVideoModal({ decade: d, url: generatedImages[d]?.videoUrl! })}
                                                isAnimating={generatedImages[decade]?.videoStatus === 'pending'}
                                                isAudioLoading={generatedImages[decade]?.audioStatus === 'pending'}
                                                videoUrl={generatedImages[decade]?.videoUrl}
                                                isMobile={isMobile}
                                                progress={progressPercentage}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div ref={dragAreaRef} className="relative w-full max-w-6xl h-[600px] mt-4 perspective-1000">
                                        {generatedDecades.map((decade, generatedIndex) => {
                                            const originalIndex = DECADES.indexOf(decade);
                                            if (originalIndex === -1) return null;
                                            const { top, left, rotate } = POSITIONS[originalIndex];
                                            return (
                                                <motion.div
                                                    key={decade}
                                                    className="absolute cursor-grab active:cursor-grabbing z-0 hover:z-20 transition-z"
                                                    style={{ top, left }}
                                                    initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0, rotate: `${rotate}deg` }}
                                                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: generatedIndex * 0.1 }}
                                                    whileHover={{ scale: 1.1, rotate: 0, transition: { duration: 0.2 } }}
                                                >
                                                    <PolaroidCard 
                                                        dragConstraintsRef={dragAreaRef}
                                                        caption={decade}
                                                        description={DECADE_DESCRIPTIONS[decade]}
                                                        status={generatedImages[decade]?.status || 'pending'}
                                                        imageUrl={generatedImages[decade]?.url}
                                                        error={generatedImages[decade]?.error}
                                                        onShake={handleRegenerateDecade}
                                                        onDownload={handleDownloadIndividualImage}
                                                        onShare={handleShareIndividualImage}
                                                        onAnimate={handleAnimateDecade}
                                                        onEdit={handleOpenEditModal}
                                                        onPlayAudio={handlePlayAudio}
                                                        onViewVideo={(d) => setVideoModal({ decade: d, url: generatedImages[d]?.videoUrl! })}
                                                        isAnimating={generatedImages[decade]?.videoStatus === 'pending'}
                                                        isAudioLoading={generatedImages[decade]?.audioStatus === 'pending'}
                                                        videoUrl={generatedImages[decade]?.videoUrl}
                                                        isMobile={isMobile}
                                                        progress={progressPercentage}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="h-24 mt-2 flex items-center justify-center w-full max-w-2xl px-4 z-20">
                                    <AnimatePresence mode="wait">
                                        {appState === 'generating' && (
                                            <motion.div 
                                                key="progress"
                                                className="w-full text-center bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-cyan-300">Developing Photos...</span>
                                                    <span className="text-xs text-neutral-400 font-mono">{completedCount}/{totalCount}</span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                    <motion.div 
                                                        className="bg-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                                        animate={{ width: `${progressPercentage}%` }}
                                                        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                        {appState === 'results-shown' && (
                                            <motion.div
                                                key="results-buttons" 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="flex flex-wrap justify-center items-center gap-3 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl"
                                            >
                                                <button onClick={handleDownloadAlbum} disabled={isDownloading} className={`${primaryButtonClasses} !text-sm !py-2 !px-4`}>
                                                    {isDownloading ? 'Packing...' : 'Download Album'}
                                                </button>
                                                {isShareSupported && (
                                                     <button onClick={handleShareAlbum} disabled={isSharing} className={`${secondaryButtonClasses} !text-sm !py-2 !px-4`}>
                                                        {isSharing ? 'Sharing...' : 'Share Album'}
                                                    </button>
                                                )}
                                                <button onClick={handleReset} className={`${secondaryButtonClasses} !text-sm !py-2 !px-4 !text-white hover:!bg-white/10`}>
                                                    Start Over
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <Footer />
            {authStatus === 'authenticated' && isCameraOpen && (
                <CameraCapture 
                    onCapture={handleImageCapture}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}
            {authStatus === 'authenticated' && isProfileOpen && user && (
                <ProfilePage
                    user={user}
                    initialProfile={profile}
                    onSave={handleSaveProfile}
                    onClose={() => setIsProfileOpen(false)}
                    onSignOut={handleSignOut}
                />
            )}
             {authStatus === 'authenticated' && isHistoryOpen && (
                <HistoryPanel
                    sessions={sessions}
                    onLoadSession={loadSession}
                    onClose={() => setIsHistoryOpen(false)}
                />
            )}
            {videoModal && (
                <VideoPlayerModal 
                    decade={videoModal.decade}
                    videoUrl={videoModal.url}
                    onClose={() => setVideoModal(null)}
                />
            )}
            {decadeToAnimate && (
                <VideoOptionsModal
                    decade={decadeToAnimate}
                    onClose={() => setDecadeToAnimate(null)}
                    onStartAnimation={handleStartAnimation}
                />
            )}
            {editingImage && (
                <ImageEditModal
                    editingImage={editingImage}
                    onClose={() => setEditingImage(null)}
                    onApplyEdit={handleApplyImageEdit}
                />
            )}
            {isApiKeyPromptOpen && (
                 <ApiKeyPrompt
                    onClose={() => setIsApiKeyPromptOpen(false)}
                    onSelectKey={async () => {
                        setIsApiKeyPromptOpen(false);
                        await window.aistudio.openSelectKey();
                        // User needs to click the animate button again after this.
                    }}
                 />
            )}
        </main>
    );
}

export default App;
