
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    AuthError 
} from '../firebase';

interface AuthPageProps {}

const glassInputClasses = "block w-full px-4 py-3 text-base text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 placeholder-neutral-500 backdrop-blur-md shadow-inner";
const primaryButtonClasses = "w-full font-permanent-marker text-lg text-black bg-cyan-400 hover:bg-cyan-300 py-3 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none";

const AuthForm = ({
    isLogin,
    onSubmit,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    onClearError,
    onAutoFill
}: {
    isLogin: boolean;
    onSubmit: (e: React.FormEvent) => void;
    email: string;
    setEmail: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    isLoading: boolean;
    error: string | null;
    onClearError: () => void;
    onAutoFill: () => void;
}) => {
    return (
        <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-cyan-400/80 uppercase tracking-widest ml-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) onClearError();
                        }}
                        className={glassInputClasses}
                        placeholder="timetraveler@example.com"
                    />
                </div>
                <div className="space-y-1.5">
                     <label htmlFor="password" className="text-xs font-bold text-cyan-400/80 uppercase tracking-widest ml-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        required
                        minLength={6}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) onClearError();
                        }}
                        className={glassInputClasses}
                        placeholder="••••••••"
                    />
                </div>
                
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center backdrop-blur-md"
                    >
                        {error}
                    </motion.div>
                )}
                
                <div className="pt-2 flex flex-col gap-3">
                    <button type="submit" className={primaryButtonClasses} disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={onAutoFill}
                        className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-400/10 border border-dashed border-cyan-400/20 hover:border-cyan-400/50 transition-all duration-300"
                    >
                        ✨ Auto-fill Demo Credentials
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

const AuthPage: React.FC<AuthPageProps> = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            console.error("Auth Error:", err.message);
            
            // Map Firebase Error Codes to User Friendly Messages
            let msg = "Authentication failed. Please try again.";
            const errorCode = (err as AuthError).code;

            switch (errorCode) {
                case 'auth/invalid-email':
                    msg = "Please enter a valid email address.";
                    break;
                case 'auth/user-disabled':
                    msg = "This account has been disabled.";
                    break;
                case 'auth/user-not-found':
                    msg = "No account found with this email.";
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    msg = "Incorrect password or email.";
                    break;
                case 'auth/email-already-in-use':
                    msg = "An account with this email already exists.";
                    break;
                case 'auth/weak-password':
                    msg = "Password should be at least 6 characters.";
                    break;
                case 'auth/too-many-requests':
                    msg = "Too many attempts. Please try again later.";
                    break;
                default:
                    msg = err.message;
            }

            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
    };

    const handleAutoFill = () => {
        setEmail('demo@timetraveler.com');
        setPassword('password123');
        setError(null);
        if (!isLogin) {
            setIsLogin(true);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050a19] text-neutral-100 selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-grid-white/[0.03]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10 w-full max-w-5xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] m-4 border border-white/10 bg-black/20 backdrop-blur-2xl"
            >
                {/* Branding Section - Left Side */}
                <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-purple-900/20 to-black/60 z-0"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
                    
                    {/* Animated Glow on Hover */}
                    <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />

                    <div className="relative z-10">
                         <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 mb-6 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                         />
                        <h1 className="text-5xl md:text-6xl font-caveat font-bold text-white mb-3 drop-shadow-lg leading-tight">
                            Past <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">Forward</span>
                        </h1>
                        <p className="font-permanent-marker text-cyan-200/80 text-lg tracking-wide">
                            Timeless Portraits.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 md:mt-0">
                         <div className="flex gap-2 mb-4">
                             {[...Array(3)].map((_, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="w-2 h-2 rounded-full bg-cyan-400"
                                 />
                             ))}
                         </div>
                         <p className="text-sm text-neutral-300 leading-relaxed max-w-xs">
                             Upload your photo and travel through time using advanced AI. Experience the 1920s, 80s, and more in seconds.
                         </p>
                    </div>
                </div>

                {/* Form Section - Right Side */}
                <div className="w-full md:w-1/2 p-8 md:p-14 bg-white/[0.03] backdrop-blur-xl flex flex-col justify-center border-l border-white/5 relative">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Get Started'}
                        </h2>
                        <p className="text-neutral-400 text-sm">
                            {isLogin ? 'Enter your credentials to access your time machine.' : 'Create an account to start your journey.'}
                        </p>
                    </div>

                    <AuthForm
                        isLogin={isLogin}
                        onSubmit={handleSubmit}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        isLoading={isLoading}
                        error={error}
                        onClearError={() => setError(null)}
                        onAutoFill={handleAutoFill}
                    />

                    <div className="mt-8 text-center">
                        <p className="text-neutral-400 text-sm">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                onClick={toggleMode}
                                className="ml-2 font-bold text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none underline decoration-cyan-400/30 hover:decoration-cyan-400"
                                disabled={isLoading}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
