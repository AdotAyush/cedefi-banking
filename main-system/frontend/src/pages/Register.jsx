import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(username, email, 'dummy_password'); // Password ignored by backend
        if (result.success) {
            setSuccessData(result.user); // Contains did and privateKey
        } else {
            setError(result.message);
        }
    };

    if (successData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center text-green-600">Registration Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h3 className="font-bold text-yellow-800 mb-2">⚠️ IMPORTANT: SAVE YOUR PRIVATE KEY</h3>
                            <p className="text-sm text-yellow-700">You will need this key to login. It will NOT be shown again.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your DID</label>
                            <div className="mt-1 p-2 bg-gray-50 border rounded font-mono text-xs break-all">
                                {successData.did}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Private Key</label>
                            <div className="mt-1 p-2 bg-gray-50 border rounded font-mono text-xs break-all">
                                {successData.privateKey}
                            </div>
                        </div>

                        <Button onClick={() => navigate('/login')} className="w-full">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Register Identity</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">Create Identity</Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-600">
                        Already have an identity? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
