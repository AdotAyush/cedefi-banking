import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
    '/':            'Overview',
    '/transactions':'Transactions',
    '/analytics':   'Analytics',
    '/history':     'History',
    '/simulator':   'Voting Network',
    '/settings':    'Settings',
};

function Topbar({ user }) {
    const { pathname } = useLocation();
    const title = ROUTE_TITLES[pathname] ?? 'CeDeFi';
    const displayName = user?.email?.split('@')[0] || user?.did?.slice(-8) || 'User';

    return (
        <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold tracking-tight">{title}</div>
            <span className="badge badge-primary badge-outline">Live</span>
            {user && (
                <div className="ml-auto text-sm text-slate-300">
                    Welcome, <span className="font-semibold text-white">{displayName}</span>
                </div>
            )}
        </div>
    );
}

export default Topbar;
