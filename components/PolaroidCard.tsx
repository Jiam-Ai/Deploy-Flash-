
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody, DraggableCardRef } from './ui/draggable-card';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    description?: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: (caption: string) => void;
    onDownload?: (caption: string) => void;
    onShare?: (caption: string) => void;
    onAnimate?: (caption: string) => void;
    onEdit?: (caption: string) => void;
    onPlayAudio?: (caption: string) => void;
    onViewVideo?: (caption: string) => void;
    videoUrl?: string;
    isAnimating?: boolean;
    isAudioLoading?: boolean;
    isMobile?: boolean;
    progress?: number;
}


interface ActionButtonProps {
    onClick: (e: React.MouseEvent) => void;
    'aria-label': string;
    isLoading?: boolean;
    children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, 'aria-label': ariaLabel, children, isLoading }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
            className="p-2 bg-black/5 backdrop-blur-md border border-black/10 rounded-full text-black/70 hover:bg-black/10 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={ariaLabel}
            disabled={isLoading}
        >
            {isLoading ? (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : children}
        </button>
    );
};


const DevelopingIndicator = ({ progress }: { progress?: number }) => (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden text-neutral-500 bg-neutral-100">
        <div className="absolute inset-0 bg-radial-gradient-pulse opacity-50" />
        <svg className="h-12 w-12 mb-4 text-neutral-400 animate-spin-slow" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4C16.536 4 4 16.536 4 32C4 47.464 16.536 60 32 60C47.464 60 60 47.464 60 32" stroke="currentColor" strokeWidth="2"/>
            <path d="M32 4C23.7143 4 16.536 16.536 16.536 32C16.536 39.9556 20.0444 46.9333 25.5111 51.5556" stroke="currentColor" strokeWidth="2"/>
            <path d="M32 60C40.2857 60 47.464 47.464 47.464 32C47.464 24.0444 43.9556 17.0667 38.4889 12.4444" stroke="currentColor" strokeWidth="2"/>
            <path d="M4 32C4 23.7143 16.536 16.536 32 16.536C39.9556 16.536 46.9333 20.0444 51.5556 25.5111" stroke="currentColor" strokeWidth="2"/>
            <path d="M60 32C60 40.2857 47.464 47.464 32 47.464C24.0444 47.464 17.0667 43.9556 12.4444 38.4889" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <p className="font-permanent-marker text-base text-neutral-500 animate-breathe z-10">
            {progress ? `Developing... ${Math.round(progress)}%` : 'Developing...'}
        </p>
    </div>
);


const ErrorDisplay = ({ onRetry, isMobile, errorMessage }: { onRetry?: () => void; isMobile?: boolean, errorMessage?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-neutral-400 bg-neutral-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="font-permanent-marker text-sm text-neutral-500">Generation Failed</p>
        {errorMessage && (
             <p className="text-xs text-neutral-400 mt-2 max-w-[90%] leading-tight">{errorMessage}</p>
        )}
        {onRetry && (
            isMobile ? (
                <button
                    onClick={onRetry}
                    className="mt-4 font-permanent-marker text-xs text-center text-cyan-600 bg-cyan-100 border border-cyan-300 py-1.5 px-4 rounded-sm transform transition-all duration-300 hover:scale-105"
                >
                    Try Again
                </button>
            ) : (
                <p className="text-xs text-neutral-400 mt-2">Shake to retry</p>
            )
        )}
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-400 group-hover:text-neutral-500 transition-colors duration-300 bg-neutral-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-permanent-marker text-sm opacity-50">Upload Photo</span>
    </div>
);


const PolaroidCard: React.FC<PolaroidCardProps> = (props) => {
    const { imageUrl, caption, description, status, error, dragConstraintsRef, onShake, onDownload, onShare, onAnimate, onEdit, onPlayAudio, onViewVideo, videoUrl, isAnimating, isAudioLoading, isMobile, progress } = props;
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isShareSupported, setIsShareSupported] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [showDropConfirm, setShowDropConfirm] = useState(false);
    const cardBodyRef = useRef<DraggableCardRef>(null);

    useEffect(() => {
        if (navigator.share && typeof navigator.canShare === 'function') {
             // Create a dummy file to check if sharing files is supported
             const file = new File([], "test.jpg", {type: "image/jpeg"});
             if (navigator.canShare({ files: [file] })) {
                 setIsShareSupported(true);
             }
        }
    }, []);

    useEffect(() => {
        if (status === 'pending') {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(() => {
                setIsDeveloped(true);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded]);

    useEffect(() => {
        if (isShaking) {
            const animateAndRegenerate = async () => {
                if (cardBodyRef.current && onShake) {
                    await cardBodyRef.current.shake();
                    onShake(caption);
                    setIsShaking(false);
                } else {
                    setIsShaking(false);
                }
            };
            animateAndRegenerate();
        }
    }, [isShaking, onShake, caption]);

    const handleRetry = () => {
         if (onShake) {
             setIsShaking(true);
         }
    };

    const handleDropFar = () => {
        setShowDropConfirm(true);
    };

    const handleConfirmKeep = () => {
        setShowDropConfirm(false);
    };

    const handleConfirmReset = async () => {
        setShowDropConfirm(false);
        if (cardBodyRef.current) {
            await cardBodyRef.current.resetPosition();
        }
    };

    return (
        <DraggableCardContainer className={cn("z-10", isMobile ? "w-full min-h-0 h-auto" : "")}>
            <DraggableCardBody
                ref={cardBodyRef}
                dragConstraintsRef={dragConstraintsRef}
                dragEnabled={!isMobile}
                onDropFar={handleDropFar}
                className={cn(
                    "w-full h-auto aspect-[3.5/4.2] bg-white p-3 sm:p-4 pb-12 sm:pb-16 shadow-2xl flex flex-col justify-start items-center transition-shadow duration-300",
                    isMobile ? "min-h-0 w-full" : "w-64 sm:w-72"
                )}
            >
                <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden mb-3 sm:mb-4 border border-black/5 shadow-inner">
                    <AnimatePresence mode="wait">
                         {showDropConfirm && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 p-4 text-center"
                            >
                                <p className="font-permanent-marker text-white text-lg tracking-wide drop-shadow-md">Keep it here?</p>
                                <div className="flex gap-3 mt-2">
                                    <button 
                                        onClick={handleConfirmReset} 
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-permanent-marker text-sm transition-all hover:scale-105"
                                    >
                                        No, Reset
                                    </button>
                                    <button 
                                        onClick={handleConfirmKeep} 
                                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-permanent-marker text-sm shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
                                    >
                                        Yes, Stay
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {status === 'pending' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10"
                            >
                                <DevelopingIndicator progress={progress} />
                            </motion.div>
                        )}
                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10"
                            >
                                <ErrorDisplay onRetry={handleRetry} isMobile={isMobile} errorMessage={error} />
                            </motion.div>
                        )}
                        {status === 'done' && imageUrl && (
                             <motion.div
                                key="image"
                                initial={{ opacity: 0, filter: 'blur(10px) sepia(1)' }}
                                animate={{ 
                                    opacity: isDeveloped ? 1 : 0, 
                                    filter: isDeveloped ? 'blur(0px) sepia(0)' : 'blur(5px) sepia(0.5)' 
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-0"
                            >
                                <img 
                                    src={imageUrl} 
                                    alt={caption} 
                                    className="w-full h-full object-cover"
                                    onLoad={() => setIsImageLoaded(true)}
                                />
                            </motion.div>
                        )}
                        {status !== 'pending' && status !== 'error' && !imageUrl && (
                             <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0"
                            >
                                <Placeholder />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="w-full flex justify-between items-end px-1">
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="font-permanent-marker text-xl sm:text-2xl text-black/80 truncate leading-tight transform -rotate-1 origin-left">
                            {caption}
                        </h3>
                        {description && (
                            <p className="font-permanent-marker text-[10px] text-neutral-400 truncate max-w-[150px]">{description.substring(0, 30)}...</p>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    {status === 'done' && (
                        <div className="flex items-center gap-1 sm:gap-2">
                             {onPlayAudio && (
                                <ActionButton onClick={() => onPlayAudio(caption)} aria-label="Play Audio Description" isLoading={isAudioLoading}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </ActionButton>
                            )}
                            
                            {onViewVideo && videoUrl ? (
                                <ActionButton onClick={() => onViewVideo(caption)} aria-label="Watch Video">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </ActionButton>
                            ) : onAnimate ? (
                                <ActionButton onClick={() => onAnimate(caption)} aria-label="Animate Photo" isLoading={isAnimating}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </ActionButton>
                            ) : null}

                             {onEdit && (
                                <ActionButton onClick={() => onEdit(caption)} aria-label="Edit Photo">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </ActionButton>
                            )}

                             {onDownload && (
                                <ActionButton onClick={() => onDownload(caption)} aria-label="Download Photo">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </ActionButton>
                            )}
                            
                            {onShare && isShareSupported && (
                                <ActionButton onClick={() => onShare(caption)} aria-label="Share Photo">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                </ActionButton>
                            )}
                        </div>
                    )}
                </div>
            </DraggableCardBody>
        </DraggableCardContainer>
    );
};

export default PolaroidCard;
