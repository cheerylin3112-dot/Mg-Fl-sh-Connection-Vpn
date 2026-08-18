import React, { useState } from 'react';
import { VPNServer, ProtocolType, TransportType, TlsType, UserGroup, SubscriptionSource, User } from '../types';
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit3, 
  Power, 
  RefreshCw, 
  Activity, 
  Shield, 
  Sliders, 
  Globe, 
  Users, 
  Link, 
  Check, 
  X, 
  UploadCloud, 
  Search, 
  Radio, 
  Terminal, 
  Lock, 
  Zap, 
  Copy,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { generateShareableUri } from '../utils/protocolParser';

interface AdminPanelViewProps {
  servers: VPNServer[];
  onRefreshServers: () => Promise<void>;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  servers,
  onRefreshServers,
  currentUser,
  onOpenAuth,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'servers' | 'add_server' | 'bulk_import' | 'subscriptions' | 'groups'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>('all');
  const [isPingingId, setIsPingingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New / Edit Server Form state
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VPNServer>>({
    name: 'US East - VLESS Reality Ultra',
    host: '104.21.88.99',
    port: 443,
    protocol: 'vless',
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    flag: '🇺🇸',
    transport: 'ws',
    tlsType: 'reality',
    tier: 'vip',
    allowedGroups: ['all'],
    enabled: true,
    tags: ['fastest', 'anti_dpi'],
    uuid: 'e7136f40-362d-4c38-897b-944a17684a0d',
    sni: 'www.cloudflare.com',
    publicKey: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    shortId: '6ba7b810',
    path: '/apex-ws',
    provider: 'Apex Secure Cloud',
    bandwidthGbps: 10,
  });

  // Bulk Import state
  const [bulkText, setBulkText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<SubscriptionSource[]>([
    {
      id: 'sub-vip-1',
      name: 'Apex VIP Global Feed',
      token: 'sub_vip_apex_98234',
      description: 'Official VIP node feed for authorized clients',
      allowedTier: 'vip_tier',
      serverIds: servers.map((s) => s.id),
      enabled: true,
      expireDate: '2027-12-31',
      totalTrafficGb: 500,
      usedTrafficGb: 42.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Toggle Server Status
  const handleToggleServer = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/servers/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        await onRefreshServers();
        showStatus('Server status updated successfully');
      }
    } catch {
      showStatus('Failed to update server status', 'error');
    }
  };

  // Test Server Latency
  const handleTestPing = async (id: string) => {
    setIsPingingId(id);
    try {
      const res = await fetch(`/api/admin/servers/${id}/ping`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await onRefreshServers();
        showStatus(`Ping test returned ${data.latencyMs}ms latency`);
      }
    } catch {
      showStatus('Ping test failed', 'error');
    } finally {
      setIsPingingId(null);
    }
  };

  // Delete Server
  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to remove this server configuration?')) return;
    try {
      const res = await fetch(`/api/admin/servers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshServers();
        showStatus('Server removed successfully');
      }
    } catch {
      showStatus('Failed to delete server', 'error');
    }
  };

  // Save / Add Server
  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingServerId ? `/api/admin/servers/${editingServerId}` : '/api/admin/servers';
      const method = editingServerId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await onRefreshServers();
        showStatus(editingServerId ? 'Server updated successfully' : 'New server deployed to backend');
        setEditingServerId(null);
        setActiveSubTab('servers');
      } else {
        showStatus('Error saving server', 'error');
      }
    } catch {
      showStatus('Failed to communicate with backend', 'error');
    }
  };

  // Bulk Import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: bulkText }),
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshServers();
        showStatus(`Imported ${data.importedCount} servers into backend database`);
        setBulkText('');
        setActiveSubTab('servers');
      }
    } catch {
      showStatus('Bulk import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredServers = servers.filter((s) => {
    if (selectedProtocolFilter !== 'all' && s.protocol !== selectedProtocolFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.host.includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.protocol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="admin-panel-view" className="w-full space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Admin Server & Node Management</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-semibold">
                Backend Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Publish, configure, and monitor live VPN nodes across all protocol backends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingServerId(null);
              setFormData({
                name: 'New Node - VLESS Reality',
                host: '104.21.10.10',
                port: 443,
                protocol: 'vless',
                country: 'United States',
                countryCode: 'US',
                city: 'New York',
                flag: '🇺🇸',
                transport: 'ws',
                tlsType: 'reality',
                tier: 'vip',
                allowedGroups: ['all'],
                enabled: true,
                tags: ['fastest'],
                uuid: 'e7136f40-362d-4c38-897b-944a17684a0d',
                sni: 'www.cloudflare.com',
                path: '/ws',
                provider: 'Apex Cloud Node',
                bandwidthGbps: 10,
              });
              setActiveSubTab('add_server');
            }}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Server
          </button>

          <button
            onClick={() => setActiveSubTab('bulk_import')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" /> Bulk Import
          </button>
        </div>
      </div>

      {/* Status toast message */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
          statusMessage.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-x-auto">
        {[
          { id: 'servers', label: `Active Servers (${servers.length})`, icon: Server },
          { id: 'add_server', label: editingServerId ? 'Edit Server' : 'Add Server Form', icon: Plus },
          { id: 'bulk_import', label: 'Bulk Import URLs', icon: UploadCloud },
          { id: 'subscriptions', label: 'Subscription Feeds', icon: Link },
          { id: 'groups', label: 'User Tier Groups', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SERVER LIST TABLE */}
      {activeSubTab === 'servers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search host, name, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400">Protocol:</span>
              <select
                value={selectedProtocolFilter}
                onChange={(e) => setSelectedProtocolFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Protocols</option>
                <option value="vless">VLESS</option>
                <option value="vmess">VMess</option>
                <option value="trojan">Trojan</option>
                <option value="shadowsocks">Shadowsocks</option>
                <option value="ssh">SSH Tunnel</option>
                <option value="wireguard">WireGuard</option>
                <option value="slowdns">SlowDNS</option>
              </select>

              <button
                onClick={onRefreshServers}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
              >
                <RefreshCw className="w-3 h-3" /> Sync
              </button>
            </div>
          </div>

          {/* Server Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Server Node</th>
                  <th className="p-3.5">Protocol & Transport</th>
                  <th className="p-3.5">Host & Port</th>
                  <th className="p-3.5">User Groups</th>
                  <th className="p-3.5">Latency</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredServers.map((server) => {
                  const shareUri = generateShareableUri(server);
                  const isPinging = isPingingId === server.id;

                  return (
                    <tr key={server.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Active Status */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleServer(server.id)}
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] flex items-center gap-1 border transition-all ${
                            server.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${server.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          {server.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>

                      {/* Server details */}
                      <td className="p-3.5 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{server.flag}</span>
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              {server.name}
                              {server.tier === 'vip' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">VIP</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{server.city}, {server.country}</div>
                          </div>
                        </div>
                      </td>

                      {/* Protocol */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono text-[11px] font-bold">
                          {(server.protocol || 'vless').toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {server.transport || 'tcp'} • {server.tlsType || 'none'}
                        </div>
                      </td>

                      {/* Host & Port */}
                      <td className="p-3.5 font-mono text-slate-300">
                        <div>{server.host}</div>
                        <div className="text-[10px] text-slate-400">Port {server.port}</div>
                      </td>

                      {/* Allowed Groups */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {server.allowedGroups.map((g) => (
                            <span key={g} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="p-3.5 font-mono">
                        <button
                          onClick={() => handleTestPing(server.id)}
                          disabled={isPinging}
                          className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors"
                        >
                          <Activity className={`w-3 h-3 ${isPinging ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                          <span>{server.ping} ms</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopy(shareUri, server.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                            title="Copy URI link"
                          >
                            {copiedKey === server.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => {
                              setFormData(server);
                              setEditingServerId(server.id);
                              setActiveSubTab('add_server');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit configuration"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteServer(server.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition-colors"
                            title="Delete server"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADD / EDIT SERVER FORM */}
      {activeSubTab === 'add_server' && (
        <form onSubmit={handleSaveServer} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                {editingServerId ? 'Edit VPN Server Configuration' : 'Deploy New VPN Server Configuration'}
              </h3>
              <p className="text-xs text-slate-400">
                Configurations are stored on the backend and instantly synchronized with user mobile apps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('servers')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Server Name */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Display Server Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                placeholder="US East - VLESS Reality"
              />
            </div>

            {/* Host Address */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">IP Address or Domain *</label>
              <input
                type="text"
                required
                value={formData.host || ''}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-cyan-500"
                placeholder="104.21.88.99 or node.domain.com"
              />
            </div>

            {/* Port */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Port *</label>
              <input
                type="number"
                required
                value={formData.port || 443}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Protocol */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Tunnel Protocol *</label>
              <select
                value={formData.protocol || 'vless'}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value as ProtocolType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="vless">VLESS (Reality / Vision / WebSocket)</option>
                <option value="vmess">VMess (V2Ray standard)</option>
                <option value="trojan">Trojan (gRPC / TLS)</option>
                <option value="shadowsocks">Shadowsocks (2022 AEAD)</option>
                <option value="ssh">SSH Tunnel (SSL / Custom Payload)</option>
                <option value="wireguard">WireGuard (Go Userspace)</option>
                <option value="socks5">SOCKS5 Proxy</option>
                <option value="slowdns">SlowDNS Tunnel</option>
              </select>
            </div>

            {/* Transport */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Transport Stream Type</label>
              <select
                value={formData.transport || 'ws'}
                onChange={(e) => setFormData({ ...formData, transport: e.target.value as TransportType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ws">WebSocket (ws)</option>
                <option value="grpc">gRPC (Multiplex)</option>
                <option value="tcp">Raw TCP</option>
                <option value="http">HTTP/2</option>
                <option value="kcp">mKCP</option>
              </select>
            </div>

            {/* TLS Security */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">TLS Security Encapsulation</label>
              <select
                value={formData.tlsType || 'reality'}
                onChange={(e) => setFormData({ ...formData, tlsType: e.target.value as TlsType })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="reality">Reality (Anti-Censorship SNI Camouflage)</option>
                <option value="tls">Standard TLS 1.3</option>
                <option value="none">None (Plaintext or SOCKS5)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Credentials Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
              Protocol Credentials & Parameters
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* UUID */}
              <div className="space-y-1">
                <label className="text-slate-400">Client UUID / ID</label>
                <input
                  type="text"
                  value={formData.uuid || ''}
                  onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300"
                  placeholder="e7136f40-362d-4c38-897b-944a17684a0d"
                />
              </div>

              {/* SNI Host */}
              <div className="space-y-1">
                <label className="text-slate-400">SNI / Bug Host</label>
                <input
                  type="text"
                  value={formData.sni || ''}
                  onChange={(e) => setFormData({ ...formData, sni: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300"
                  placeholder="www.cloudflare.com"
                />
              </div>

              {/* Path */}
              <div className="space-y-1">
                <label className="text-slate-400">WebSocket Path / gRPC Service</label>
                <input
                  type="text"
                  value={formData.path || ''}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300"
                  placeholder="/apex-vless-ws"
                />
              </div>

              {/* Reality Public Key */}
              {formData.tlsType === 'reality' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">Reality Public Key (pbk)</label>
                    <input
                      type="text"
                      value={formData.publicKey || ''}
                      onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300"
                      placeholder="1a2b3c4d5e6f7a8b..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Reality Short ID (sid)</label>
                    <input
                      type="text"
                      value={formData.shortId || ''}
                      onChange={(e) => setFormData({ ...formData, shortId: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300"
                      placeholder="6ba7b810"
                    />
                  </div>
                </>
              )}

              {/* SSH Fields */}
              {formData.protocol === 'ssh' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">SSH Username</label>
                    <input
                      type="text"
                      value={formData.sshUsername || ''}
                      onChange={(e) => setFormData({ ...formData, sshUsername: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">SSH Password</label>
                    <input
                      type="password"
                      value={formData.sshPassword || ''}
                      onChange={(e) => setFormData({ ...formData, sshPassword: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('servers')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              {editingServerId ? 'Update Server' : 'Publish to Backend'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: BULK IMPORT */}
      {activeSubTab === 'bulk_import' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Bulk Configuration Import</h3>
            <p className="text-xs text-slate-400">
              Paste a multi-line list of URI links (<code className="text-cyan-300">vless://</code>, <code className="text-cyan-300">vmess://</code>, <code className="text-cyan-300">trojan://</code>, <code className="text-cyan-300">ss://</code>) to automatically populate the database.
            </p>
          </div>

          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`vless://uuid@host:443?type=ws&security=reality&sni=example.com#US-Node\nvmess://eyJ2IjoiMiIsInBzIjoi...`}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setBulkText('')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Clear
            </button>
            <button
              onClick={handleBulkImport}
              disabled={isImporting || !bulkText.trim()}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Import to Backend</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTIONS */}
      {activeSubTab === 'subscriptions' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Public Subscription Feeds</h3>
              <p className="text-xs text-slate-400">
                Auto-updating subscription endpoints for mobile clients (v2rayNG, Matsuri, Clash, Shadowrocket).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const subUrl = `${window.location.origin}/api/subscription/${sub.token}`;
              return (
                <div key={sub.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Link className="w-4 h-4 text-cyan-400" />
                      {sub.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                      {(sub.allowedTier || 'all').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{sub.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={subUrl}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 select-all"
                    />
                    <button
                      onClick={() => handleCopy(subUrl, sub.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                    >
                      {copiedKey === sub.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === sub.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: USER GROUPS */}
      {activeSubTab === 'groups' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">User Tier Groups & Publishing Control</h3>
            <p className="text-xs text-slate-400">
              Control which VPN servers are synchronized to specific user accounts and subscription plans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'all', name: 'Public (All Users)', desc: 'Available to everyone including guests', count: servers.length, badge: 'Default' },
              { id: 'vip_tier', name: 'VIP Ultra Speed', desc: '10Gbps VLESS Reality & Trojan Ultra endpoints', count: servers.filter(s => s.tier === 'vip' || s.tier === 'ultra').length, badge: 'High Priority' },
              { id: 'pro_tier', name: 'Pro Gaming & P2P', desc: 'WireGuard & Optimized low jitter gaming nodes', count: servers.filter(s => s.tier === 'pro').length, badge: 'Low Latency' },
              { id: 'free_tier', name: 'Free Community Tier', desc: 'Community supported with rotation', count: servers.filter(s => s.tier === 'free').length, badge: 'Ad Supported' },
            ].map((grp) => (
              <div key={grp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    {grp.name}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {grp.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{grp.desc}</p>
                <div className="text-[11px] font-mono text-cyan-300 pt-1">
                  Active Servers: {grp.count} nodes published
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
