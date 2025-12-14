
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraCaptureProps {
    onCapture: (imageDataUrl: string) => void;
    onClose: () => void;
}

const primaryButtonClasses = "font-permanent-marker text-base sm:text-lg text-center text-black bg-cyan-400 border border-cyan-400 py-3 px-8 rounded-xl shadow-lg hover:shadow-cyan-400/30 transform transition-all duration-300 hover:scale-[1.03] hover:-rotate-1";
const secondaryButtonClasses = "font-permanent-marker text-base sm:text-lg text-center text-neutral-300 bg-white/5 border border-white/10 py-3 px-8 rounded-xl transform transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 hover:text-white backdrop-blur-sm";

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setError("Camera access is not supported by your browser.");
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user' } 
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                
                let errorMessage = "Could not access the camera. Please check your browser permissions and ensure no other application is using it.";
                
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        errorMessage = "Camera access was denied. To use this feature, please allow camera access in your browser's site settings.";
                    } else if (err.message.includes('Permission dismissed')) {
                        errorMessage = "Camera permission was dismissed. To use your camera, please grant permission in your browser's site settings and try again.";
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        errorMessage = "No camera was found on your device. Please ensure a camera is connected and enabled.";
                    }
                }
                
                setError(errorMessage);
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect, as users expect from a selfie camera
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                onCapture(imageDataUrl);
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4"
                aria-modal="true"
                role="dialog"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 bg-black/40 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl"
                >
                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-8 rounded-xl text-center backdrop-blur-md w-full">
                             <div className="flex justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold mb-2">Camera Error</h2>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black">
                             <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scaleX(-1)" // Mirror view for selfie
                             />
                             <div className="absolute inset-0 pointer-events-none ring-1 ring-white/20 rounded-2xl"></div>
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex items-center gap-4 mt-2 w-full justify-center">
                        <button onClick={onClose} className={secondaryButtonClasses}>
                            {error ? 'Close' : 'Cancel'}
                        </button>
                        {!error && (
                             <button onClick={handleCapture} className={primaryButtonClasses}>
                                Capture
                             </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CameraCapture;
