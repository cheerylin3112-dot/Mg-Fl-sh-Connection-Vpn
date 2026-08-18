import React from 'react';
import { VPNServer } from '../types';
import { Shield, Zap, Globe, Navigation } from 'lucide-react';

interface WorldMapVisualizerProps {
  servers: VPNServer[];
  selectedServer: VPNServer;
  isConnected: boolean;
  onSelectServer: (server: VPNServer) => void;
}

export const WorldMapVisualizer: React.FC<WorldMapVisualizerProps> = ({
  servers,
  selectedServer,
  isConnected,
  onSelectServer,
}) => {
  // Convert lat/lng to SVG projection percentage
  const projectCoordinates = (lat: number, lng: number) => {
    // Mercator approximation for SVG canvas (1000x500)
    const x = ((lng + 180) / 360) * 1000;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 250 - (mercN * 250) / Math.PI;
    return {
      x: Math.max(20, Math.min(980, x)),
      y: Math.max(30, Math.min(470, y)),
    };
  };

  // Mock user origin location (e.g., Client local point)
  const userOrigin = { lat: 37.7749, lng: -122.4194, city: 'San Francisco (Client)' };
  const originPos = projectCoordinates(userOrigin.lat, userOrigin.lng);
  const targetPos = projectCoordinates(selectedServer.lat, selectedServer.lng);

  // Bezier curve control point for arc
  const midX = (originPos.x + targetPos.x) / 2;
  const midY = Math.min(originPos.y, targetPos.y) - Math.abs(targetPos.x - originPos.x) * 0.15;
  const arcPath = `M ${originPos.x} ${originPos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`;

  return (
    <div id="world-map-visualizer" className="relative w-full rounded-2xl bg-slate-950/80 border border-cyan-900/40 p-4 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Global Encrypted Mesh</h4>
            <p className="text-[11px] text-slate-400">
              {isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Tunnel active: {selectedServer.city} ({selectedServer.ping}ms)
                </span>
              ) : (
                'Select a gateway node to route traffic'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 text-[10px]">
            {servers.length} Global Edges
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[2/1] min-h-[220px] max-h-[360px] bg-gradient-to-b from-slate-900/90 to-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <svg viewBox="0 0 1000 500" className="w-full h-full">
          <defs>
            <linearGradient id="tunnelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Continents simplified vector silhouettes */}
          <g fill="#1e293b" opacity="0.45" stroke="#334155" strokeWidth="0.5">
            {/* North America */}
            <path d="M 120 70 Q 220 50 280 90 Q 300 130 260 200 Q 210 240 180 280 Q 150 260 110 220 Q 80 140 120 70 Z" />
            {/* South America */}
            <path d="M 270 290 Q 350 310 360 370 Q 320 460 270 470 Q 250 400 270 290 Z" />
            {/* Europe */}
            <path d="M 460 80 Q 560 70 580 130 Q 530 180 470 170 Q 430 130 460 80 Z" />
            {/* Africa */}
            <path d="M 470 190 Q 570 190 580 270 Q 540 380 490 370 Q 440 280 470 190 Z" />
            {/* Asia */}
            <path d="M 590 80 Q 820 60 880 160 Q 850 260 740 260 Q 640 240 590 140 Z" />
            {/* Australia */}
            <path d="M 780 330 Q 890 320 900 390 Q 840 430 780 410 Q 760 360 780 330 Z" />
          </g>

          {/* User Client Node */}
          <g>
            <circle cx={originPos.x} cy={originPos.y} r="6" fill="#06b6d4" filter="url(#glow)" />
            <circle cx={originPos.x} cy={originPos.y} r="12" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" />
            <text x={originPos.x + 8} y={originPos.y - 8} fill="#38bdf8" fontSize="10" fontWeight="bold">YOU (Local)</text>
          </g>

          {/* Active Tunnel Line Arc if Connected or Selected */}
          {isConnected && (
            <g>
              <path
                d={arcPath}
                fill="none"
                stroke="url(#tunnelGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
                filter="url(#glow)"
              />
              {/* Traveling packet dot */}
              <circle r="4" fill="#67e8f9">
                <animateMotion path={arcPath} dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* All Server Nodes */}
          {servers.map((server) => {
            const pos = projectCoordinates(server.lat, server.lng);
            const isTarget = server.id === selectedServer.id;

            return (
              <g 
                key={server.id} 
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectServer(server)}
              >
                {/* Outer halo */}
                {isTarget && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill={isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)'}
                    className="animate-ping"
                  />
                )}
                
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isTarget ? 7 : 4.5}
                  fill={isTarget ? (isConnected ? '#10b981' : '#06b6d4') : '#64748b'}
                  stroke={isTarget ? '#ffffff' : '#334155'}
                  strokeWidth={isTarget ? 2 : 1}
                  filter={isTarget ? 'url(#glow)' : undefined}
                />

                {/* Server Label on Selected */}
                {isTarget && (
                  <g>
                    <rect
                      x={pos.x - 45}
                      y={pos.y - 28}
                      width="90"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke="#06b6d4"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 16}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {server.city} ({server.ping}ms)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating map footer badge */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target: <strong className="text-white">{selectedServer.name}</strong></span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Latency: <strong className="text-cyan-300">{selectedServer.ping} ms</strong></span>
            <span>Capacity: <strong className="text-emerald-400">{selectedServer.bandwidthGbps} Gbps</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
