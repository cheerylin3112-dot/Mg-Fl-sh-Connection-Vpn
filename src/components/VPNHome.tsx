import React, { useState, useEffect } from 'react';
import { VPNServer, ConnectionStatus, SecuritySettings } from '../types';
import { 
  Power, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  ChevronRight, 
  Lock, 
  Zap, 
  ArrowDown, 
  ArrowUp, 
  Smartphone,
  Gauge,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Clock,
  HardDrive,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

interface VPNHomeProps {
  status: ConnectionStatus;
  onToggleConnect: () => void;
  selectedServer: VPNServer;
  onOpenServerModal: () => void;
  onOpenApkBuilder: () => void;
  onOpenSpeedTest: () => void;
  onOpenSettings: () => void;
  downloadSpeed: number; // KB/s
  uploadSpeed: number; // KB/s
  settings: SecuritySettings;
  connectionDuration: number; // seconds
  totalDownloadedMb: number;
  totalUploadedMb: number;
  showPermissionDialog: boolean;
  onAcceptPermission: () => void;
  onDenyPermission: () => void;
}

export const VPNHome: React.FC<VPNHomeProps> = ({
  status,
  onToggleConnect,
  selectedServer,
  onOpenServerModal,
  onOpenApkBuilder,
  onOpenSpeedTest,
  onOpenSettings,
  downloadSpeed,
  uploadSpeed,
  settings,
  connectionDuration,
  totalDownloadedMb,
  totalUploadedMb,
  showPermissionDialog,
  onAcceptPermission,
  onDenyPermission,
}) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'disconnecting' || status === 'preparing_permission';

  // Format seconds to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format speed
  const formatSpeed = (kbps: number) => {
    if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
    return `${kbps.toFixed(0)} KB/s`;
  };

  return (
    <div id="vpn-home-screen" className="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto p-4 sm:p-5 space-y-5">
      {/* Top Status Header */}
      <div className="w-full flex flex-col items-center text-center space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-300">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full border">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PROTECTED • TUNNEL ACTIVE
            </span>
          ) : isConnecting ? (
            <span className="flex items-center gap-1.5 text-cyan-400 border-cyan-500/30 bg-cyan-500/10 px-3 py-1 rounded-full border">
              <RefreshCw className="w-3 h-3 animate-spin" />
              ESTABLISHING TUNNEL...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400 border-slate-700 bg-slate-800/60 px-3 py-1 rounded-full border">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              UNPROTECTED • IP EXPOSED
            </span>
          )}
        </div>

        <h2 className="text-xl font-black text-white tracking-tight pt-1">
          {isConnected ? selectedServer.city : isConnecting ? 'Negotiating Tunnel...' : 'Ready to Connect'}
        </h2>
        
        {/* Protocol details banner */}
        <p className="text-xs text-slate-400 font-mono">
          {isConnected 
            ? `${(selectedServer?.protocol || 'vless').toUpperCase()} (${selectedServer?.transport || 'tcp'}) • ${(selectedServer?.tlsType || 'tls').toUpperCase()} TLS • ${selectedServer?.ping || 20}ms`
            : `Tap connect to route via ${(selectedServer?.protocol || 'vless').toUpperCase()} tunnel`}
        </p>

        {/* Live session duration timer when connected */}
        {isConnected && (
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatDuration(connectionDuration)}</span>
          </div>
        )}
      </div>

      {/* Center Power Connect Button with Glowing Rings */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Background Radar Pulse Rings */}
        {isConnected && (
          <>
            <div className="absolute w-56 h-56 rounded-full bg-emerald-500/15 animate-ping opacity-75 pointer-events-none" />
            <div className="absolute w-64 h-64 rounded-full border border-emerald-500/20 animate-pulse pointer-events-none" />
          </>
        )}
        {isConnecting && (
          <div className="absolute w-56 h-56 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin pointer-events-none" />
        )}

        {/* Main Circular Button */}
        <button
          id="main-vpn-toggle-btn"
          onClick={onToggleConnect}
          disabled={isConnecting && status !== 'preparing_permission'}
          aria-label={isConnected ? 'Disconnect VPN' : 'Connect VPN'}
          className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl group ${
            isConnected
              ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-slate-950 shadow-emerald-500/30 hover:scale-105'
              : isConnecting
              ? 'bg-gradient-to-b from-cyan-600 to-slate-800 text-cyan-200 shadow-cyan-500/20'
              : 'bg-gradient-to-b from-slate-800 to-slate-950 text-slate-300 border-2 border-slate-700 hover:border-cyan-500 hover:text-white shadow-black hover:scale-105'
          }`}
        >
          {/* Inner bezel ring */}
          <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border transition-all ${
            isConnected
              ? 'border-emerald-300/40 bg-emerald-400/20'
              : 'border-slate-700/80 bg-slate-900/60 group-hover:border-cyan-500/40'
          }`}>
            <Power className={`w-12 h-12 stroke-[2.2] transition-transform duration-300 ${
              isConnected 
                ? 'text-slate-950 scale-110' 
                : isConnecting 
                ? 'text-cyan-400 animate-spin' 
                : 'text-slate-400 group-hover:text-cyan-400 group-hover:scale-110'
            }`} />
            <span className={`text-xs font-black tracking-wider uppercase mt-1 ${
              isConnected ? 'text-slate-950 font-extrabold' : 'text-slate-400 group-hover:text-white'
            }`}>
              {isConnected ? 'DISCONNECT' : isConnecting ? 'CONNECTING' : 'CONNECT'}
            </span>
          </div>
        </button>
      </div>

      {/* Selected Server Selector Card */}
      <div 
        id="selected-server-card"
        onClick={onOpenServerModal}
        className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-lg flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none" role="img" aria-label={selectedServer.country}>
            {selectedServer.flag}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {selectedServer.city}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono uppercase font-bold">
                {selectedServer.protocol}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-[11px] text-cyan-400">{selectedServer.ping} ms</span>
              <span>•</span>
              <span className="text-[11px] truncate max-w-[140px]">{selectedServer.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
          <span className="text-xs font-medium hidden sm:inline">Change</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Live Speed & Total Data Badges */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {/* Downlink badge */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Download</div>
              <div className="text-xs font-bold font-mono text-white">
                {isConnected ? formatSpeed(downloadSpeed) : '0 KB/s'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {isConnected ? `${totalDownloadedMb.toFixed(1)} MB` : '0 MB'}
          </span>
        </div>

        {/* Uplink badge */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Upload</div>
              <div className="text-xs font-bold font-mono text-white">
                {isConnected ? formatSpeed(uploadSpeed) : '0 KB/s'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {isConnected ? `${totalUploadedMb.toFixed(1)} MB` : '0 MB'}
          </span>
        </div>
      </div>

      {/* IP Mask Status Banner */}
      <div className="w-full p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Protected Virtual IP:</span>
        </div>
        <span className="font-mono text-cyan-300 font-semibold">
          {isConnected ? selectedServer.virtualIp : 'Direct (Exposed)'}
        </span>
      </div>

      {/* Android System VPN Permission Modal Simulation */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Connection Request</h3>
                <p className="text-[11px] text-slate-400">Android VpnService.prepare()</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Mg Flâsh Connection</strong> wants to set up a VPN connection that allows it to monitor network traffic. Only accept if you trust the source.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
              <div>• Destination: {selectedServer.host}:{selectedServer.port}</div>
              <div>• Protocol: {(selectedServer?.protocol || 'vless').toUpperCase()}</div>
              <div>• DNS: {selectedServer.dnsResolver || '1.1.1.1'}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onDenyPermission}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={onAcceptPermission}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                OK (Allow)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
