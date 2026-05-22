import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/Button';
import { useNotification } from '../../notifications';

interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
    isBanned: boolean;
    bannedAt: string | null;
    banReason: string | null;
    createdAt: string;
    isOnline: boolean;
}

interface LoaderData {
    me: { id: string; username: string; role: string };
    users: AdminUser[];
}

function ConfirmDialog({
    title,
    message,
    confirmLabel,
    confirmVariant = 'tertiary',
    onConfirm,
    onCancel,
    children,
}: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'primary' | 'secondary' | 'accent' | 'tertiary';
    onConfirm: () => void;
    onCancel: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 flex flex-col gap-4 mx-4">
                <h2 className="text-xl font-heading font-bold text-text-default">{title}</h2>
                <p className="text-sm text-text-default/80">{message}</p>
                {children}
                <div className="flex gap-3 justify-end mt-2">
                    <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm">
                        Cancel
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm} className="px-4 py-2 text-sm">
                        {confirmLabel}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function StatusBadge({ user }: { user: AdminUser }) {
    if (user.isBanned)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300"><Icons.Ban size={11} /> Banned</span>;
    if (user.role === 'ADMIN')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent"><Icons.ShieldCheck size={11} /> Admin</span>;
    if (user.isOnline)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/60 text-green-300"><Icons.Circle size={11} fill="currentColor" /> Online</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/40 text-text-default/50"><Icons.Circle size={11} /> Offline</span>;
}

export default function AdminPanel() {
    const { me, users: initialUsers } = useLoaderData() as LoaderData;
    const { revalidate } = useRevalidator();
    const { push } = useNotification();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'banned' | 'admins'>('all');
    const [loading, setLoading] = useState<string | null>(null);

    const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
    const [banReason, setBanReason] = useState('');
    const [unbanTarget, setUnbanTarget] = useState<AdminUser | null>(null);
    const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null);

    const token = localStorage.getItem('token') ?? '';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const filtered = initialUsers.filter(u => {
        const matchSearch =
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === 'all' ||
            (filter === 'banned' && u.isBanned) ||
            (filter === 'admins' && u.role === 'ADMIN');
        return matchSearch && matchFilter;
    });

    async function apiFetch(url: string, method: string, body?: object) {
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? 'Request failed');
        }
        return res.json();
    }

    async function confirmBan() {
        if (!banTarget) return;
        setLoading(banTarget.id);
        try {
            await apiFetch(`/api/admin/users/${banTarget.id}/ban`, 'POST', { reason: banReason || undefined });
            push({ type: 'success', title: 'User banned', message: `${banTarget.username} has been banned.`, duration: 4000 });
            revalidate();
        } catch (e: any) {
            push({ type: 'error', title: 'Ban failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(null);
            setBanTarget(null);
            setBanReason('');
        }
    }

    async function confirmUnban() {
        if (!unbanTarget) return;
        setLoading(unbanTarget.id);
        try {
            await apiFetch(`/api/admin/users/${unbanTarget.id}/unban`, 'POST');
            push({ type: 'success', title: 'User unbanned', message: `${unbanTarget.username} has been unbanned.`, duration: 4000 });
            revalidate();
        } catch (e: any) {
            push({ type: 'error', title: 'Unban failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(null);
            setUnbanTarget(null);
        }
    }

    async function confirmPromote() {
        if (!promoteTarget) return;
        setLoading(promoteTarget.id);
        try {
            await apiFetch(`/api/admin/users/${promoteTarget.id}/promote`, 'POST');
            push({ type: 'success', title: 'User promoted', message: `${promoteTarget.username} is now an admin.`, duration: 4000 });
            revalidate();
        } catch (e: any) {
            push({ type: 'error', title: 'Promote failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(null);
            setPromoteTarget(null);
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Icons.ShieldAlert size={28} className="text-accent" />
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-default">Admin Panel</h1>
                    <p className="text-sm text-text-default/50">Logged in as <span className="text-accent font-semibold">{me.username}</span></p>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total users', value: initialUsers.length, icon: <Icons.Users size={18} /> },
                    { label: 'Banned', value: initialUsers.filter(u => u.isBanned).length, icon: <Icons.Ban size={18} /> },
                    { label: 'Admins', value: initialUsers.filter(u => u.role === 'ADMIN').length, icon: <Icons.ShieldCheck size={18} /> },
                ].map(s => (
                    <Card key={s.label} className="p-4 flex items-center gap-3">
                        <span className="text-accent">{s.icon}</span>
                        <div>
                            <div className="text-xl font-bold text-text-default">{s.value}</div>
                            <div className="text-xs text-text-default/50">{s.label}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-default/40" />
                    <input
                        type="text"
                        placeholder="Search by username or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-primary border border-accent/20 rounded-lg pl-9 pr-4 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'banned', 'admins'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                                filter === f
                                    ? 'bg-accent text-text-dark'
                                    : 'bg-primary text-text-default/60 hover:text-text-default'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* User table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-accent/10 text-text-default/40 text-xs uppercase tracking-wider">
                                <th className="text-left px-4 py-3">User</th>
                                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/10">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-text-default/30">No users found</td>
                                </tr>
                            )}
                            {filtered.map(user => {
                                const isSelf = user.id === me.id;
                                const isbusy = loading === user.id;
                                return (
                                    <tr key={user.id} className={`transition-colors hover:bg-accent/5 ${user.isBanned ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-text-default">{user.username}</div>
                                            {user.isBanned && user.banReason && (
                                                <div className="text-xs text-red-400/70 mt-0.5 truncate max-w-[160px]" title={user.banReason}>
                                                    {user.banReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-text-default/60 hidden md:table-cell">{user.email}</td>
                                        <td className="px-4 py-3"><StatusBadge user={user} /></td>
                                        <td className="px-4 py-3 text-text-default/40 hidden lg:table-cell">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-end">
                                                {isSelf ? (
                                                    <span className="text-xs text-text-default/30 pr-2">You</span>
                                                ) : user.isBanned ? (
                                                    <button
                                                        disabled={isbusy}
                                                        onClick={() => setUnbanTarget(user)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all disabled:opacity-40"
                                                    >
                                                        <Icons.ShieldCheck size={13} /> Unban
                                                    </button>
                                                ) : (
                                                    <>
                                                        {user.role !== 'ADMIN' && (
                                                            <>
                                                                <button
                                                                    disabled={isbusy}
                                                                    onClick={() => setBanTarget(user)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary hover:bg-tertiary-hover text-text-default transition-all disabled:opacity-40"
                                                                >
                                                                    <Icons.Ban size={13} /> Ban
                                                                </button>
                                                                <button
                                                                    disabled={isbusy}
                                                                    onClick={() => setPromoteTarget(user)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-contrast hover:bg-contrast-hover text-text-default transition-all disabled:opacity-40"
                                                                >
                                                                    <Icons.ShieldPlus size={13} /> Promote
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Ban dialog */}
            {banTarget && (
                <ConfirmDialog
                    title={`Ban ${banTarget.username}?`}
                    message="This will immediately kick them from any active game and block login. Provide an optional reason:"
                    confirmLabel="Ban user"
                    confirmVariant="tertiary"
                    onConfirm={confirmBan}
                    onCancel={() => { setBanTarget(null); setBanReason(''); }}
                >
                    <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60"
                    />
                </ConfirmDialog>
            )}

            {/* Unban dialog */}
            {unbanTarget && (
                <ConfirmDialog
                    title={`Unban ${unbanTarget.username}?`}
                    message="They will be able to log in and play again immediately."
                    confirmLabel="Unban"
                    confirmVariant="secondary"
                    onConfirm={confirmUnban}
                    onCancel={() => setUnbanTarget(null)}
                />
            )}

            {/* Promote dialog */}
            {promoteTarget && (
                <ConfirmDialog
                    title={`Promote ${promoteTarget.username} to Admin?`}
                    message="They will gain full admin access. This cannot be undone from the UI."
                    confirmLabel="Promote"
                    confirmVariant="accent"
                    onConfirm={confirmPromote}
                    onCancel={() => setPromoteTarget(null)}
                />
            )}
        </div>
    );
}
