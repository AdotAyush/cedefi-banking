import { FaPaperPlane, FaBell } from 'react-icons/fa';

function Topbar({ user }) {
    // Check if we're in light mode
    const isLight = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'corporate';

    return (
        <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold tracking-tight">Dashboard</div>
            <span className="badge badge-primary badge-outline">Live</span>
            {user && (
                <div className={`ml-auto text-sm ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                    Welcome, <span className="font-semibold">{user.username}</span>
                </div>
            )}
        </div>
    );
}

export default Topbar;
