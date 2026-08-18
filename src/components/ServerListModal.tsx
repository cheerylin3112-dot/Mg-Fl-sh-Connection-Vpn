import React, { useState } from 'react';
import { VPNServer } from '../types';
import { 
  Search, 
  Zap, 
  Shield, 
  Tv, 
  DownloadCloud, 
  Gamepad2, 
  Layers, 
  Check, 
  RefreshCw, 
  X, 
  Signal, 
  Globe as GlobeIcon,
  Radio,
  Terminal
} from 'lucide-react';

interface ServerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: VPNServer[];
  selectedServer: VPNServer;
  onSelectServer: (server: VPNServer) => void;
  onRefreshPings: () => void;
  isPinging: boolean;
}

type TabType = 'all' | 'v2ray' | 'ssh' | 'fastest' | 'streaming' | 'p2p' | 'gaming' | 'double_vpn';

export const ServerListModal: React.FC<ServerListModalProps> = ({
  isOpen,
  onClose,
  servers,
  selectedServer,
  onSelectServer,
  onRefreshPings,
  isPinging,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortBy, setSortBy] = useState<'ping' | 'load' | 'country'>('ping');

  if (!isOpen) return null;

  const filteredServers = servers
    .filter((s) => {
      // Tab filter
      if (activeTab === 'v2ray' && !s.protocols.includes('v2ray')) return false;
      if (activeTab === 'ssh' && !s.protocols.includes('ssh')) return false;
      if (activeTab === 'fastest' && !s.tags.includes('fastest')) return false;
      if (activeTab === 'streaming' && !s.tags.includes('streaming')) return false;
      if (activeTab === 'p2p' && !s.tags.includes('p2p')) return false;
      if (activeTab === 'gaming' && !s.tags.includes('gaming')) return false;
      if (activeTab === 'double_vpn' && !s.tags.includes('double_vpn')) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query) ||
          s.ip.includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ping') return a.ping - b.ping;
      if (sortBy === 'load') return a.load - b.load;
      return a.country.localeCompare(b.country);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="server-list-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Signal className="w-5 h-5 text-cyan-400" />
              Global Gateway Edge Nodes
            </h3>
            <p className="text-xs text-slate-400">
              Select an encrypted server endpoint with native V2Ray & SSH support
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-pings-btn"
              onClick={onRefreshPings}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Test real-time latency across all nodes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isPinging ? 'Pinging...' : 'Ping Test'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="server-search-input"
              type="text"
              placeholder="Search by country, city, or IP (e.g., Tokyo, United States, Frankfurt)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'All Servers', icon: GlobeIcon },
              { id: 'v2ray', label: 'V2Ray VMess', icon: Radio },
              { id: 'ssh', label: 'SSH Tunnel', icon: Terminal },
              { id: 'fastest', label: 'Fastest Ping', icon: Zap },
              { id: 'streaming', label: 'Streaming 4K', icon: Tv },
              { id: 'p2p', label: 'P2P / Torrents', icon: DownloadCloud },
              { id: 'gaming', label: 'Gaming Ultra', icon: Gamepad2 },
              { id: 'double_vpn', label: 'Double Encryption', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sorter bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Showing {filteredServers.length} available nodes</span>
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ping">Lowest Latency (Ping)</option>
                <option value="load">Lowest Server Load</option>
                <option value="country">Country (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Server List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
          {filteredServers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Signal className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm font-medium">No servers matched your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredServers.map((server) => {
              const isSelected = selectedServer.id === server.id;
              return (
                <div
                  key={server.id}
                  id={`server-item-${server.id}`}
                  onClick={() => {
                    onSelectServer(server);
                    onClose();
                  }}
                  className={`pt-2.5 first:pt-0 p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/20'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Left: Flag & Server details */}
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl select-none" role="img" aria-label={server.country}>
                      {server.flag}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {server.name}
                        </span>
                        {server.tier === 'ultra' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold uppercase tracking-wider">
                            Ultra Secure
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                        <span>{server.city}, {server.country}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">{server.host || (server as any).ip}</span>
                        <span>•</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono">V2Ray: 443</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">SSH: 22</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Select Button */}
                  <div className="flex items-center gap-4">
                    {/* Tags */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {server.tags.includes('streaming') && (
                        <span className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]" title="Optimized for Streaming">
                          <Tv className="w-3 h-3 text-cyan-400" />
                        </span>
                      )}
                      {server.tags.includes('p2p') && (
                        <span className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]" title="P2P Allowed">
                          <DownloadCloud className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                      {server.tags.includes('gaming') && (
                        <span className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]" title="Low Jitter Gaming">
                          <Gamepad2 className="w-3 h-3 text-amber-400" />
                        </span>
                      )}
                    </div>

                    {/* Load meter */}
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Load</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getLoadBadgeColor(server.load)}`}>
                        {server.load}%
                      </span>
                    </div>

                    {/* Ping */}
                    <div className="text-right min-w-[52px]">
                      <div className="text-[11px] text-slate-400">Ping</div>
                      <div className={`text-xs font-bold font-mono ${getPingColor(server.ping)}`}>
                        {server.ping} ms
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="pl-1">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-slate-700 group-hover:border-cyan-500/60 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                          <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>All nodes encrypted with zero logs policy & DNS protection</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
