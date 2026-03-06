import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export default function AdminAuth({ onLogin }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Check against environment variable (with a fallback for local dev if missing)
        const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
        if (password === expectedPassword) {
            localStorage.setItem("isAdminEnabled", "true");
            onLogin(); // Unlock parent
        } else {
            setError(true);
            setPassword("");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-8 rounded-2xl shadow-xl text-center border border-transparent dark:border-slate-800 transition-colors duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Broadcaster Access</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the master password to access live scoring tools.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(false); }}
                            placeholder="Enter Password"
                            autoFocus
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition-all text-slate-900 dark:text-slate-100 ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:ring-2'}`}
                        />
                        {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold mt-2 text-left">Incorrect password.</p>}
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-sm">
                        Unlock Console
                    </button>
                </form>
            </div>
        </div>
    );
}
