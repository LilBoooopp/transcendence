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
    bannedUntil: string | null;
    banReason: string | null;
    createdAt: string;
    isOnline: boolean;
}

interface Report {
    id: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    reporter: { id: string; username: string };
    reported: { id: string; username: string; isBanned: boolean };
}

interface AuditLog {
    id: string;
    adminId: string;
    adminName: string;
    targetId: string | null;
    targetName: string | null;
    action: string;
    detail: string | null;
    createdAt: string;
}

interface LoaderData {
    me: { id: string; username: string; role: string };
    users: AdminUser[];
    reports: Report[];
    auditLogs: AuditLog[];
}

// ─── Shared components ────────────────────────────────────────────────────────

function ConfirmDialog({
    title, message, confirmLabel, confirmVariant = 'tertiary',
    onConfirm, onCancel, children,
}: {
    title: string; message: string; confirmLabel: string;
    confirmVariant?: 'primary' | 'secondary' | 'accent' | 'tertiary';
    onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 flex flex-col gap-4 mx-4">
                <h2 className="text-xl font-heading font-bold text-text-default">{title}</h2>
                <p className="text-sm text-text-default/80">{message}</p>
                {children}
                <div className="flex gap-3 justify-end mt-2">
                    <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm">Cancel</Button>
                    <Button variant={confirmVariant} onClick={onConfirm} className="px-4 py-2 text-sm">{confirmLabel}</Button>
                </div>
            </Card>
        </div>
    );
}

function UserStatusBadge({ user }: { user: AdminUser }) {
    if (user.isBanned)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300"><Icons.Ban size={11} /> {user.bannedUntil ? 'Temp ban' : 'Banned'}</span>;
    if (user.role === 'ADMIN')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent"><Icons.ShieldCheck size={11} /> Admin</span>;
    if (user.isOnline)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/60 text-green-300"><Icons.Circle size={11} fill="currentColor" /> Online</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/40 text-text-default/50"><Icons.Circle size={11} /> Offline</span>;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    BAN:            { label: 'Banned',        color: 'text-red-400' },
    TEMP_BAN:       { label: 'Temp banned',   color: 'text-orange-400' },
    UNBAN:          { label: 'Unbanned',       color: 'text-green-400' },
    PROMOTE:        { label: 'Promoted',       color: 'text-accent' },
    DEMOTE:         { label: 'Demoted',        color: 'text-yellow-400' },
    REPORT_RESOLVE: { label: 'Report resolved', color: 'text-blue-400' },
    REPORT_DISMISS: { label: 'Report dismissed', color: 'text-text-default/40' },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function UsersTab({ users, me, apiFetch }: {
    users: AdminUser[];
    me: { id: string; username: string };
    apiFetch: (url: string, method: string, body?: object) => Promise<any>;
}) {
    const { push } = useNotification();
    const { revalidate } = useRevalidator();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'banned' | 'admins'>('all');
    const [loading, setLoading] = useState<string | null>(null);

    const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
    const [banReason, setBanReason] = useState('');
    const [banHours, setBanHours] = useState('');
    const [unbanTarget, setUnbanTarget] = useState<AdminUser | null>(null);
    const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null);
    const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);

    const filtered = users.filter(u => {
        const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ||
            (filter === 'banned' && u.isBanned) ||
            (filter === 'admins' && u.role === 'ADMIN');
        return matchSearch && matchFilter;
    });

    async function act(id: string, url: string, method: string, body?: object, successMsg?: string) {
        setLoading(id);
        try {
            await apiFetch(url, method, body);
            push({ type: 'success', title: 'Done', message: successMsg ?? 'Action completed.', duration: 4000 });
            revalidate();
        } catch (e: any) {
            push({ type: 'error', title: 'Failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(null);
        }
    }

    async function confirmBan() {
        if (!banTarget) return;
        const body: any = { reason: banReason || undefined };
        if (banHours) body.durationHours = parseFloat(banHours);
        await act(banTarget.id, `/api/admin/users/${banTarget.id}/ban`, 'POST', body,
            `${banTarget.username} has been ${banHours ? `temp banned for ${banHours}h` : 'banned'}.`);
        setBanTarget(null); setBanReason(''); setBanHours('');
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-default/40" />
                    <input type="text" placeholder="Search username or email…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-primary border border-accent/20 rounded-lg pl-9 pr-4 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60" />
                </div>
                <div className="flex gap-2">
                    {(['all', 'banned', 'admins'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-accent text-text-dark' : 'bg-primary text-text-default/60 hover:text-text-default'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

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
                                <tr><td colSpan={5} className="text-center py-10 text-text-default/30">No users found</td></tr>
                            )}
                            {filtered.map(user => {
                                const isSelf = user.id === me.id;
                                const busy = loading === user.id;
                                return (
                                    <tr key={user.id} className={`transition-colors hover:bg-accent/5 ${user.isBanned ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-text-default">{user.username}</div>
                                            {user.isBanned && user.banReason && (
                                                <div className="text-xs text-red-400/70 mt-0.5 truncate max-w-[160px]">{user.banReason}</div>
                                            )}
                                            {user.isBanned && user.bannedUntil && (
                                                <div className="text-xs text-orange-400/60 mt-0.5">Until {new Date(user.bannedUntil).toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-text-default/60 hidden md:table-cell">{user.email}</td>
                                        <td className="px-4 py-3"><UserStatusBadge user={user} /></td>
                                        <td className="px-4 py-3 text-text-default/40 hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                {isSelf ? (
                                                    <span className="text-xs text-text-default/30 pr-2">You</span>
                                                ) : user.isBanned ? (
                                                    <button disabled={busy} onClick={() => setUnbanTarget(user)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all disabled:opacity-40">
                                                        <Icons.ShieldCheck size={13} /> Unban
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button disabled={busy} onClick={() => setBanTarget(user)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary hover:bg-tertiary-hover text-text-default transition-all disabled:opacity-40">
                                                            <Icons.Ban size={13} /> Ban
                                                        </button>
                                                        {user.role !== 'ADMIN' ? (
                                                            <button disabled={busy} onClick={() => setPromoteTarget(user)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-contrast hover:bg-contrast-hover text-text-default transition-all disabled:opacity-40">
                                                                <Icons.ShieldPlus size={13} /> Promote
                                                            </button>
                                                        ) : (
                                                            <button disabled={busy} onClick={() => setDemoteTarget(user)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all disabled:opacity-40">
                                                                <Icons.ShieldMinus size={13} /> Demote
                                                            </button>
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

            {banTarget && (
                <ConfirmDialog title={`Ban ${banTarget.username}?`}
                    message="Kicks them from active sessions immediately. Leave duration empty for permanent ban."
                    confirmLabel="Ban" confirmVariant="tertiary"
                    onConfirm={confirmBan}
                    onCancel={() => { setBanTarget(null); setBanReason(''); setBanHours(''); }}>
                    <input type="text" placeholder="Reason (optional)" value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60" />
                    <div className="flex items-center gap-2">
                        <input type="number" placeholder="Duration in hours (leave empty = permanent)" value={banHours}
                            onChange={e => setBanHours(e.target.value)} min="1"
                            className="w-full bg-contrast border border-accent/20 rounded-lg px-3 py-2 text-sm text-text-default placeholder:text-text-default/30 focus:outline-none focus:border-accent/60" />
                    </div>
                </ConfirmDialog>
            )}
            {unbanTarget && (
                <ConfirmDialog title={`Unban ${unbanTarget.username}?`}
                    message="They will be able to log in and play again immediately."
                    confirmLabel="Unban" confirmVariant="secondary"
                    onConfirm={async () => { await act(unbanTarget.id, `/api/admin/users/${unbanTarget.id}/unban`, 'POST', undefined, `${unbanTarget.username} unbanned.`); setUnbanTarget(null); }}
                    onCancel={() => setUnbanTarget(null)} />
            )}
            {promoteTarget && (
                <ConfirmDialog title={`Promote ${promoteTarget.username} to Admin?`}
                    message="They gain full admin access including the ability to ban and promote users."
                    confirmLabel="Promote" confirmVariant="accent"
                    onConfirm={async () => { await act(promoteTarget.id, `/api/admin/users/${promoteTarget.id}/promote`, 'POST', undefined, `${promoteTarget.username} is now admin.`); setPromoteTarget(null); }}
                    onCancel={() => setPromoteTarget(null)} />
            )}
            {demoteTarget && (
                <ConfirmDialog title={`Demote ${demoteTarget.username}?`}
                    message="They will lose all admin privileges immediately."
                    confirmLabel="Demote" confirmVariant="tertiary"
                    onConfirm={async () => { await act(demoteTarget.id, `/api/admin/users/${demoteTarget.id}/demote`, 'POST', undefined, `${demoteTarget.username} demoted.`); setDemoteTarget(null); }}
                    onCancel={() => setDemoteTarget(null)} />
            )}
        </div>
    );
}

function ReportsTab({ reports, apiFetch }: {
    reports: Report[];
    apiFetch: (url: string, method: string, body?: object) => Promise<any>;
}) {
    const { push } = useNotification();
    const { revalidate } = useRevalidator();
    const [filter, setFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING');
    const [loading, setLoading] = useState<string | null>(null);

    const filtered = reports.filter(r => r.status === filter);

    async function action(reportId: string, endpoint: string, label: string) {
        setLoading(reportId);
        try {
            await apiFetch(`/api/admin/reports/${reportId}/${endpoint}`, 'POST');
            push({ type: 'success', title: label, message: 'Report updated.', duration: 3000 });
            revalidate();
        } catch (e: any) {
            push({ type: 'error', title: 'Failed', message: e.message, duration: 5000 });
        } finally {
            setLoading(null);
        }
    }

    const pending = reports.filter(r => r.status === 'PENDING').length;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                {(['PENDING', 'RESOLVED', 'DISMISSED'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-accent text-text-dark' : 'bg-primary text-text-default/60 hover:text-text-default'}`}>
                        {f.toLowerCase()} {f === 'PENDING' && pending > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{pending}</span>}
                    </button>
                ))}
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-accent/10 text-text-default/40 text-xs uppercase tracking-wider">
                                <th className="text-left px-4 py-3">Reporter</th>
                                <th className="text-left px-4 py-3">Reported</th>
                                <th className="text-left px-4 py-3">Reason</th>
                                <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                                {filter === 'PENDING' && <th className="text-right px-4 py-3">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/10">
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-10 text-text-default/30">No reports</td></tr>
                            )}
                            {filtered.map(report => (
                                <tr key={report.id} className="hover:bg-accent/5 transition-colors">
                                    <td className="px-4 py-3 text-text-default/80">{report.reporter.username}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-text-default">{report.reported.username}</span>
                                        {report.reported.isBanned && <span className="ml-1 text-xs text-red-400">(banned)</span>}
                                    </td>
                                    <td className="px-4 py-3 text-text-default/70 max-w-xs truncate">{report.reason}</td>
                                    <td className="px-4 py-3 text-text-default/40 hidden md:table-cell">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    {filter === 'PENDING' && (
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-end">
                                                <button disabled={loading === report.id}
                                                    onClick={() => action(report.id, 'resolve', 'Resolved')}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary-hover text-text-default transition-all disabled:opacity-40">
                                                    <Icons.Check size={13} /> Resolve
                                                </button>
                                                <button disabled={loading === report.id}
                                                    onClick={() => action(report.id, 'dismiss', 'Dismissed')}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-text-default/60 transition-all disabled:opacity-40">
                                                    <Icons.X size={13} /> Dismiss
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function AuditTab({ auditLogs }: { auditLogs: AuditLog[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-accent/10 text-text-default/40 text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Admin</th>
                            <th className="text-left px-4 py-3">Action</th>
                            <th className="text-left px-4 py-3">Target</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">Detail</th>
                            <th className="text-left px-4 py-3">When</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-accent/10">
                        {auditLogs.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-text-default/30">No audit logs yet</td></tr>
                        )}
                        {auditLogs.map(log => {
                            const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-text-default' };
                            return (
                                <tr key={log.id} className="hover:bg-accent/5 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-text-default">{log.adminName}</td>
                                    <td className={`px-4 py-3 font-semibold ${meta.color}`}>{meta.label}</td>
                                    <td className="px-4 py-3 text-text-default/70">{log.targetName ?? '—'}</td>
                                    <td className="px-4 py-3 text-text-default/50 hidden md:table-cell truncate max-w-xs">{log.detail ?? '—'}</td>
                                    <td className="px-4 py-3 text-text-default/40 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPanel() {
    const { me, users, reports, auditLogs } = useLoaderData() as LoaderData;
    const [tab, setTab] = useState<'users' | 'reports' | 'audit'>('users');

    const token = localStorage.getItem('token') ?? '';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    async function apiFetch(url: string, method: string, body?: object) {
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? 'Request failed');
        }
        return res.json();
    }

    const pendingReports = reports.filter(r => r.status === 'PENDING').length;

    const tabs = [
        { id: 'users' as const, label: 'Users', icon: <Icons.Users size={16} />, badge: null },
        { id: 'reports' as const, label: 'Reports', icon: <Icons.Flag size={16} />, badge: pendingReports > 0 ? pendingReports : null },
        { id: 'audit' as const, label: 'Audit Log', icon: <Icons.ScrollText size={16} />, badge: null },
    ];

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

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total users', value: users.length, icon: <Icons.Users size={18} /> },
                    { label: 'Banned', value: users.filter(u => u.isBanned).length, icon: <Icons.Ban size={18} /> },
                    { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, icon: <Icons.ShieldCheck size={18} /> },
                    { label: 'Pending reports', value: pendingReports, icon: <Icons.Flag size={18} />, alert: pendingReports > 0 },
                ].map(s => (
                    <Card key={s.label} className={`p-4 flex items-center gap-3 ${(s as any).alert ? 'border border-red-500/40' : ''}`}>
                        <span className={`${ (s as any).alert ? 'text-red-400' : 'text-accent'}`}>{s.icon}</span>
                        <div>
                            <div className={`text-xl font-bold ${(s as any).alert ? 'text-red-400' : 'text-text-default'}`}>{s.value}</div>
                            <div className="text-xs text-text-default/50">{s.label}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-accent/10 pb-0">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                            tab === t.id
                                ? 'border-accent text-accent'
                                : 'border-transparent text-text-default/50 hover:text-text-default'
                        }`}>
                        {t.icon}
                        {t.label}
                        {t.badge !== null && (
                            <span className="bg-red-500 text-white rounded-full px-1.5 text-xs leading-5">{t.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'users' && <UsersTab users={users} me={me} apiFetch={apiFetch} />}
            {tab === 'reports' && <ReportsTab reports={reports} apiFetch={apiFetch} />}
            {tab === 'audit' && <AuditTab auditLogs={auditLogs} />}
        </div>
    );
}
