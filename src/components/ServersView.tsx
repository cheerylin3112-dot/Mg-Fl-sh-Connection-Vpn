import React, { useState } from 'react';
import { VPNServer } from '../types';
import { 
  Search, 
  Zap, 
  Radio, 
  Terminal, 
  Shield, 
  Tv, 
  DownloadCloud, 
  Gamepad2, 
  Layers, 
  Check, 
  RefreshCw, 
  Globe, 
  Heart, 
  QrCode, 
  Copy, 
  Share2,
  Lock,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { generateShareableUri } from '../utils/protocolParser';

interface ServersViewProps {
  servers: VPNServer[];
  selectedServer: VPNServer;
  onSelectServer: (server: VPNServer) => void;
  onConnectServer: (server: VPNServer) => void;
  onRefreshServers: () => Promise<void>;
  isSyncing: boolean;
}

export const ServersView: React.FC<ServersViewProps> = ({
  servers,
  selectedServer,
  onSelectServer,
  onConnectServer,
  onRefreshServers,
  isSyncing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ping' | 'country' | 'name' | 'load'>('ping');
  const [favorites, setFavorites] = useState<string[]>(['srv-us-vless-01', 'srv-de-vmess-02']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalServer, setQrModalServer] = useState<VPNServer | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyUri = (server: VPNServer, e: React.MouseEvent) => {
    e.stopPropagation();
    const uri = generateShareableUri(server);
    navigator.clipboard.writeText(uri);
    setCopiedId(server.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = async (server: VPNServer, e: React.MouseEvent) => {
    e.stopPropagation();
    const uri = generateShareableUri(server);
    try {
      const url = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 1,
        color: { dark: '#0891b2', light: '#0f172a' },
      });
      setQrDataUrl(url);
      setQrModalServer(server);
    } catch {
      // ignore
    }
  };

  const filteredServers = servers
    .filter((s) => {
      if (!s.enabled) return false;
      if (activeTab === 'favorites' && !favorites.includes(s.id)) return false;
      if (activeTab === 'vless' && s.protocol !== 'vless') return false;
      if (activeTab === 'vmess' && s.protocol !== 'vmess') return false;
      if (activeTab === 'trojan' && s.protocol !== 'trojan') return false;
      if (activeTab === 'ssh' && s.protocol !== 'ssh') return false;
      if (activeTab === 'wireguard' && s.protocol !== 'wireguard') return false;
      if (activeTab === 'vip' && s.tier !== 'vip' && s.tier !== 'ultra') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.host.includes(q) ||
          s.protocol.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ping') return a.ping - b.ping;
      if (sortBy === 'load') return a.load - b.load;
      if (sortBy === 'country') return a.country.localeCompare(b.country);
      return a.name.localeCompare(b.name);
    });

  const getLoadBadgeColor = (load: number) => {
    if (load < 35) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (load < 65) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  const getPingColor = (ping: number) => {
    if (ping < 30) return 'text-emerald-400';
    if (ping < 60) return 'text-cyan-400';
    if (ping < 100) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div id="servers-view" className="w-full space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Global VPN Edge Servers</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Live Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an edge gateway node or sync with the backend to load newly published servers
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshServers}
          disabled={isSyncing}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync from Backend'}</span>
        </button>
      </div>

      {/* Search & Tabs Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by country, city, or protocol (e.g. Frankfurt, VLESS, WireGuard)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ping">Lowest Latency (Ping)</option>
              <option value="load">Lowest Load (%)</option>
              <option value="country">Country Name</option>
              <option value="name">Server Name</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'All Servers' },
            { id: 'favorites', label: '★ Favorites' },
            { id: 'vless', label: 'VLESS Reality' },
            { id: 'vmess', label: 'VMess' },
            { id: 'trojan', label: 'Trojan gRPC' },
            { id: 'ssh', label: 'SSH Tunnel' },
            { id: 'wireguard', label: 'WireGuard' },
            { id: 'vip', label: 'VIP Ultra' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Servers List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredServers.map((server) => {
          const isSelected = selectedServer.id === server.id;
          const isFav = favorites.includes(server.id);

          return (
            <div
              key={server.id}
              onClick={() => onSelectServer(server)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Top row: Flag, Name, Favorite */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{server.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {server.name}
                      </h4>
                      {server.tier === 'vip' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {server.city}, {server.country} • <span className="font-mono text-[11px] text-slate-400">{server.host}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => toggleFavorite(server.id, e)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFav ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                </button>
              </div>

              {/* Protocol Specs & Badges */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  {server.protocol}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {server.transport} • {server.tlsType}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Port: {server.port}
                </span>
              </div>

              {/* Bottom row: Latency, Load, Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono font-bold">
                    <Zap className={`w-3.5 h-3.5 ${getPingColor(server.ping)}`} />
                    <span className={getPingColor(server.ping)}>{server.ping} ms</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold ${getLoadBadgeColor(server.load)}`}>
                    {server.load}% load
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleShowQr(server, e)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Show QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    onClick={(e) => handleCopyUri(server, e)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy URI"
                  >
                    {copiedId === server.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectServer(server);
                      onConnectServer(server);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Active Node' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal Preview */}
      {qrModalServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-bold text-white">{qrModalServer.name}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Scan with v2rayNG, Matsuri, or Apex Android Client
            </p>

            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-xl p-2 bg-slate-950 border border-slate-800"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateShareableUri(qrModalServer));
                  setQrModalServer(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Copy Link & Close
              </button>
              <button
                onClick={() => setQrModalServer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
