import React, { useState } from 'react';
import { SubscriptionSource, VPNServer } from '../types';
import { 
  Link2, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Check, 
  Calendar, 
  Activity, 
  Layers, 
  Globe, 
  ExternalLink, 
  Copy,
  AlertCircle,
  Clock
} from 'lucide-react';
import { parseVpnLink } from '../utils/protocolParser';

interface SubscriptionsViewProps {
  onAddServersFromSubscription: (servers: VPNServer[]) => void;
}

interface LocalSubscriptionItem {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'updating' | 'error';
  lastUpdated: string;
  nodeCount: number;
  totalTrafficGb: number;
  usedTrafficGb: number;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onAddServersFromSubscription,
}) => {
  const [subUrl, setSubUrl] = useState('');
  const [subName, setSubName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<LocalSubscriptionItem[]>([
    {
      id: 'sub-official-vip',
      name: 'Apex VIP Global Backbone Feed',
      url: `${window.location.origin}/api/subscription/sub_vip_apex_98234`,
      status: 'active',
      lastUpdated: 'Just now',
      nodeCount: 6,
      totalTrafficGb: 500,
      usedTrafficGb: 42.5,
    },
    {
      id: 'sub-official-free',
      name: 'Apex Free Community Feed',
      url: `${window.location.origin}/api/subscription/sub_free_apex_11223`,
      status: 'active',
      lastUpdated: '5 mins ago',
      nodeCount: 4,
      totalTrafficGb: 100,
      usedTrafficGb: 18.2,
    },
  ]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefreshSubscription = async (sub: LocalSubscriptionItem) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: 'updating' } : s))
    );

    try {
      const res = await fetch(sub.url);
      const rawText = await res.text();

      let decoded = rawText;
      try {
        decoded = atob(rawText.trim());
      } catch {
        // Was plaintext
      }

      const lines = decoded.split('\n');
      const newServers: VPNServer[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parsed = parseVpnLink(trimmed);
        if (parsed.valid) {
          newServers.push({
            id: `sub-srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: parsed.name,
            host: parsed.server,
            port: parsed.port,
            protocol: parsed.protocol,
            country: 'Subscription Node',
            countryCode: 'UN',
            city: parsed.server,
            flag: '⚡',
            virtualIp: '10.88.99.2',
            ping: Math.floor(Math.random() * 40) + 15,
            load: Math.floor(Math.random() * 50) + 10,
            tier: 'pro',
            allowedGroups: ['all'],
            enabled: true,
            online: true,
            transport: parsed.transport,
            tlsType: parsed.tlsType,
            tags: ['fastest'],
            uuid: parsed.uuid,
            password: parsed.password,
            sni: parsed.sni,
            path: parsed.path,
            publicKey: parsed.publicKey,
            shortId: parsed.shortId,
            flow: parsed.flow,
            dnsResolver: parsed.dnsResolver || '1.1.1.1',
            provider: sub.name,
            bandwidthGbps: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (newServers.length > 0) {
        onAddServersFromSubscription(newServers);
      }

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                status: 'active',
                lastUpdated: 'Just now',
                nodeCount: newServers.length || s.nodeCount,
              }
            : s
        )
      );
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'error' } : s))
      );
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUrl.trim()) return;

    setIsAdding(true);
    const newSub: LocalSubscriptionItem = {
      id: `sub-${Date.now()}`,
      name: subName.trim() || 'Custom Subscription',
      url: subUrl.trim(),
      status: 'updating',
      lastUpdated: 'Updating...',
      nodeCount: 0,
      totalTrafficGb: 200,
      usedTrafficGb: 0,
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    await handleRefreshSubscription(newSub);
    setSubUrl('');
    setSubName('');
    setIsAdding(false);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div id="subscriptions-view" className="w-full space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Subscription Feeds & Auto-Updater
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Subscribe to remote node lists, base64 payloads, or private proxy provider feeds
            </p>
          </div>
        </div>
      </div>

      {/* Add Subscription Form */}
      <form onSubmit={handleAddSubscription} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          Add New Subscription Source
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-semibold text-slate-300">Feed Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. VIP Asia Relay"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Subscription URL *</label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://domain.com/api/sub?token=..."
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isAdding || !subUrl.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Fetch Nodes</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Subscription List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Active Subscriptions ({subscriptions.length})</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Auto-refresh enabled</span>
          </div>
        </div>

        {subscriptions.map((sub) => {
          const percentUsed = Math.round((sub.usedTrafficGb / sub.totalTrafficGb) * 100) || 0;

          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {sub.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        {sub.nodeCount} nodes
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-md">{sub.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(sub.url, sub.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleRefreshSubscription(sub)}
                    disabled={sub.status === 'updating'}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sub.status === 'updating' ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{sub.status === 'updating' ? 'Updating...' : 'Sync'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubscription(sub.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs transition-colors"
                    title="Remove subscription"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bandwidth & sync metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Traffic Quota</span>
                  <div className="font-mono text-cyan-300 font-bold mt-0.5">
                    {sub.usedTrafficGb} / {sub.totalTrafficGb} GB
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Usage</span>
                  <div className="font-mono text-emerald-300 font-bold mt-0.5">{percentUsed}%</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Last Synced</span>
                  <div className="font-mono text-slate-300 mt-0.5">{sub.lastUpdated}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Status</span>
                  <div className="font-mono text-emerald-400 font-bold mt-0.5 uppercase">
                    {sub.status}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
