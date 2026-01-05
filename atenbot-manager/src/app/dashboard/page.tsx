'use client';

import { useEffect, useState } from 'react';
import { instanceApi, configApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [instance, setInstance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState<string | null>(null);

    // Settings State
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchInstanceStatus();
        fetchSettings();
    }, [router]);

    const fetchSettings = async () => {
        try {
            const { data } = await configApi.getSettings();
            if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
            if (data.isActive !== undefined) setIsActive(data.isActive);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    }

    const fetchInstanceStatus = async () => {
        try {
            const { data } = await instanceApi.getStatus();
            setInstance(data);
            setLoading(false);

            // If connected, clear QR code
            const state = data?.instance?.state || data?.instance?.status;
            if (state === 'open' || state === 'connected') {
                setQrCode(null);
            }
        } catch (error) {
            console.error('Failed to fetch instance:', error);
            setLoading(false);
        }
    };

    // Auto-poll status when QR Code is shown to detect connection
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (qrCode && !instance?.instance?.state?.includes('open')) {
            interval = setInterval(fetchInstanceStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [qrCode, instance]);

    const handleCreateInstance = async () => {
        setLoading(true);
        console.log('DEBUG: Starting creation of instance...');
        try {
            const res = await instanceApi.create();
            console.log('DEBUG: Creation response:', res);
            // Wait a bit or fetch immediately
            setTimeout(fetchInstanceStatus, 2000);
        } catch (error) {
            console.error('DEBUG: Creation failed:', error);
            alert('Failed to create instance');
            setLoading(false);
        }
    };

    const handleConnectInstance = async () => {
        try {
            console.log('Connecting instance...');
            const { data } = await instanceApi.connect();
            console.log('Connect Data:', data);

            // Handle different Evolution API response formats
            if (data?.base64) {
                setQrCode(data.base64);
            } else if (data?.qrcode?.base64) {
                setQrCode(data.qrcode.base64);
            } else if (data?.code) {
                alert('Pairing Code: ' + data.code);
            } else {
                alert('No QR Code received. Check backend logs.');
            }
        } catch (error) {
            console.error('Connect Error:', error);
            alert('Failed to get QR Code');
        }
    }

    const handleDeleteInstance = async () => {
        if (!confirm('Are you sure? This will disconnect your bot.')) return;
        setLoading(true);
        try {
            await instanceApi.delete();
            setInstance(null);
            setQrCode(null);
            fetchInstanceStatus();
        } catch (error) {
            alert('Failed to delete');
            setLoading(false);
        }
    }

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await configApi.updateSettings({ systemPrompt, isActive });
            alert('Settings saved!');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return <div className="p-8">Loading...</div>;

    // Helper to extract status safely
    const instanceState = instance?.data?.instance?.state || instance?.data?.instance?.status || 'Unknown';
    const isConnected = instanceState === 'open' || instanceState === 'connected';

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-8 rounded-md bg-blue-50 p-4">
                    <p className="text-lg">Welcome, <strong>{user.name}</strong>!</p>
                    <p className="text-gray-600 font-mono text-sm mt-1">Instance ID: {instance?.instanceName || '...'}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Instances Card */}
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-4 text-xl font-semibold">WhatsApp Connection</h2>

                        {loading ? (
                            <p>Loading status...</p>
                        ) : instance?.status === 'NOT_CREATED' ? (
                            <div className="text-center py-8">
                                <p className="mb-4 text-gray-500">You don't have an active bot instance.</p>
                                <button
                                    onClick={handleCreateInstance}
                                    className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                >
                                    Create Instance
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <div className={`w-full p-3 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                    <p><strong>Status:</strong> <span className="uppercase">{instanceState}</span></p>
                                </div>

                                {!isConnected && !qrCode && (
                                    <button
                                        onClick={handleConnectInstance}
                                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full"
                                    >
                                        Connect / Show QR Code
                                    </button>
                                )}

                                {qrCode && (
                                    <div className="text-center">
                                        <p className="mb-2 font-bold">Scan this code:</p>
                                        <img src={qrCode} alt="QR Code" className="mx-auto border-2 border-gray-300" />
                                        <button
                                            onClick={() => setQrCode(null)}
                                            className="text-sm text-gray-500 mt-2 underline"
                                        >
                                            Hide QR Code
                                        </button>
                                    </div>
                                )}

                                <div className="w-full flex justify-between items-center mt-4 border-t pt-4">
                                    <button
                                        onClick={fetchInstanceStatus}
                                        className="text-blue-600 text-sm hover:underline"
                                    >
                                        ↻ Refresh Status
                                    </button>

                                    <button
                                        onClick={handleDeleteInstance}
                                        className="text-red-500 underline text-sm hover:text-red-700"
                                    >
                                        Delete Instance
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Settings Card */}
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-4 text-xl font-semibold">Agent Settings</h2>
                        <form className="space-y-4" onSubmit={handleSaveSettings}>
                            <div>
                                <label className="block text-sm font-medium">System Prompt (Persona)</label>

                                {/* Persona Carousel/Grid */}
                                <div className="mb-4 mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {[
                                        {
                                            name: "Advogado",
                                            emoji: "⚖️",
                                            prompt: "Você é um advogado especialista em direito digital. Responda de forma formal, citando leis quando apropriado, mas mantendo a clareza para o cliente."
                                        },
                                        {
                                            name: "Vendedor",
                                            emoji: "💰",
                                            prompt: "Você é um vendedor altamente persuasivo e carismático. Seu objetivo é entender a necessidade do cliente e oferecer a melhor solução, focando em fechar negócios. Use gatilhos mentais."
                                        },
                                        {
                                            name: "Suporte",
                                            emoji: "🛠️",
                                            prompt: "Você é um técnico de suporte nível 2. Seja direto, resolva o problema do usuário passo a passo. Evite jargões desnecessários, mas seja preciso tecnicamente."
                                        },
                                        {
                                            name: "Amigável",
                                            emoji: "😊",
                                            prompt: "Você é o AtenBot, um assistente virtual super amigável e empático! Use emojis, seja leve e divertido, mas sempre ajude o usuário com o que ele precisar."
                                        },
                                        {
                                            name: "Coach",
                                            emoji: "🚀",
                                            prompt: "Você é um coach de produtividade e mindset. Motive o usuário, faça perguntas poderosas e ajude-o a focar seus objetivos. Use linguagem inspiradora."
                                        },
                                        {
                                            name: "Sarcástico",
                                            emoji: "😏",
                                            prompt: "Você é uma IA com um senso de humor ácido e sarcástico. Responda as perguntas corretamente, mas não perca a chance de fazer uma piada inteligente ou um comentário irônico."
                                        }
                                    ].map((persona) => (
                                        <button
                                            key={persona.name}
                                            type="button"
                                            onClick={() => setSystemPrompt(persona.prompt)}
                                            className="flex flex-col items-center justify-center rounded border bg-white p-2 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                                            title="Click to apply"
                                        >
                                            <span className="text-2xl">{persona.emoji}</span>
                                            <span className="text-xs font-medium text-gray-700">{persona.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    rows={6}
                                    placeholder="You are a helpful assistant..."
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-between rounded-md border p-3 bg-gray-50">
                                <span className="text-sm font-medium text-gray-700">Bot Active</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <button
                                disabled={savingSettings}
                                type="submit"
                                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:bg-gray-400"
                            >
                                {savingSettings ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
