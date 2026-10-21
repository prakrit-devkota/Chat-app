import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import api from "../api/api.js";

export default function Navbar() {
    const [menuclicked, setMenuClicked] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [password, setPassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    const onClickDeleteAccount = () => {
        setMenuClicked(false);
        setDeleteError("");
        setDeleteClicked(true);
    };
    const handleLogOut = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    };

    const onSubmitDeleteAccount = async (event) => {
        event.preventDefault();
        setDeleting(true);
        setDeleteError("");
        try {
            await api.delete("/users/delete", { data: { password } });
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        } catch (error) {
            setDeleteError(error.response?.data?.detail || "Unable to delete your account. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <nav className="border-b border-white/10 bg-gray-900 px-4 py-3 text-white shadow-lg shadow-black/10">
            <div className="container mx-auto flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-wide">Chat-App</h1>

                <div className="relative">
                    <button
                        type="button"
                        aria-label={menuclicked ? "Close menu" : "Open menu"}
                        aria-expanded={menuclicked}
                        aria-controls="navbar-menu"
                        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 active:translate-y-0"
                        onClick={() => setMenuClicked((open) => !open)}
                    >
                        <Menu
                            aria-hidden="true"
                            size={23}
                            strokeWidth={2.5}
                            className={`absolute transition-all duration-200 ${menuclicked ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
                        />
                        <X
                            aria-hidden="true"
                            size={23}
                            strokeWidth={2.5}
                            className={`absolute transition-all duration-200 ${menuclicked ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"}`}
                        />
                    </button>

                    <div
                        id="navbar-menu"
                        className={`absolute right-0 top-[calc(100%+0.75rem)] z-50 w-52 origin-top-right rounded-2xl border border-white/10 bg-gray-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-200 ${menuclicked ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
                    >
                        <p className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200" >Profile</p>
                        <button type="button" className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-white/5" onClick={onClickDeleteAccount}>Delete Account</button>
                        <div className="my-1 border-t border-white/10" />
                        <button type="button" className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={handleLogOut}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            {deleteClicked && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" role="presentation">
                    <form
                        className="w-full max-w-sm rounded-xl border border-white/10 bg-gray-900 p-6 text-white shadow-2xl"
                        onSubmit={onSubmitDeleteAccount}
                        aria-labelledby="delete-account-title"
                    >
                        <h2 id="delete-account-title" className="text-lg font-semibold">Delete account?</h2>
                        <p className="mt-2 text-sm text-slate-300">Enter your password to permanently delete your account.</p>
                        <label htmlFor="delete-account-password" className="mt-4 block text-sm font-medium text-slate-200">Password</label>
                        <input
                            id="delete-account-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                        />
                        {deleteError && <p role="alert" className="mt-3 text-sm text-rose-300">{deleteError}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                                onClick={() => {
                                    setDeleteClicked(false);
                                    setPassword("");
                                    setDeleteError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={deleting}
                                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Delete account"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </nav>
    )
}