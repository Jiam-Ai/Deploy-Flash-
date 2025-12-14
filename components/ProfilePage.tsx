
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, auth } from '../firebase';

interface ProfilePageProps {
  user: User;
  initialProfile: { displayName: string; avatar?: string };
  onSave: (profileData: { displayName: string; avatar?: string }) => void;
  onClose: () => void;
  onSignOut: () => void;
}

const primaryButtonClasses = "font-permanent-marker text-sm sm:text-base text-center text-black bg-cyan-400 border border-cyan-400 py-2.5 px-6 rounded-xl shadow-lg hover:shadow-cyan-400/30 transform transition-all duration-300 hover:scale-[1.03] hover:-rotate-1 disabled:opacity-50";
const secondaryButtonClasses = "font-permanent-marker text-sm sm:text-base text-center text-neutral-300 bg-white/5 border border-white/10 py-2.5 px-6 rounded-xl transform transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 hover:text-white backdrop-blur-sm";


const ProfilePage: React.FC<ProfilePageProps> = ({ user, initialProfile, onSave, onClose, onSignOut }) => {
    const [displayName, setDisplayName] = useState('');
    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        setDisplayName(initialProfile.displayName || '');
        setAvatar(initialProfile.avatar);
    }, [initialProfile]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 256;
                    const MAX_HEIGHT = 256;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL(file.type);
                    setAvatar(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim()) {
            onSave({ displayName: displayName.trim(), avatar });
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4"
                aria-modal="true"
                role="dialog"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()} 
                >
                     {/* Decorative background blur */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                    <h2 className="font-permanent-marker text-2xl text-center text-neutral-100 z-10">
                        Traveler Profile
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 z-10">
                        <div className="flex flex-col items-center">
                            <button type="button" onClick={handleAvatarClick} className="relative group rounded-full" aria-label="Change profile picture">
                                {avatar ? (
                                    <img src={avatar} alt="Profile Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:border-cyan-400 transition-colors shadow-lg" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center group-hover:border-cyan-400 transition-colors shadow-inner backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="displayName" className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider ml-1">Display Name</label>
                            <input
                                type="text"
                                id="displayName"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="block w-full px-4 py-3 text-base text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors duration-300 backdrop-blur-sm"
                                placeholder="Enter your name"
                            />
                        </div>

                         <div className="text-center bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                            <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Account Email</p>
                            <p className="text-neutral-200 text-sm font-medium break-all">{user.email || 'N/A'}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                            <button type="button" onClick={onClose} className={`${secondaryButtonClasses} flex-1`}>
                                Cancel
                            </button>
                            <button type="submit" className={`${primaryButtonClasses} flex-1`} disabled={!displayName.trim()}>
                                Save
                            </button>
                        </div>
                    </form>
                    <div className="w-full border-t border-white/10 pt-4 z-10">
                        <button
                            type="button"
                            onClick={onSignOut}
                            className="w-full text-center text-sm font-medium text-red-400/70 hover:text-red-400 transition-colors hover:underline decoration-red-400/30 hover:decoration-red-400"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfilePage;
