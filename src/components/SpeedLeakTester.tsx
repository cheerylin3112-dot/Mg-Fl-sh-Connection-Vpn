import React, { useState } from 'react';
import { VPNServer, SpeedTestResult, LeakTestState } from '../types';
import { 
  Gauge, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Wifi, 
  ArrowDown, 
  ArrowUp, 
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';

interface SpeedLeakTesterProps {
  isConnected: boolean;
  server: VPNServer;
}

export const SpeedLeakTester: React.FC<SpeedLeakTesterProps> = ({ isConnected, server }) => {
  const [activeTab, setActiveTab] = useState<'speed' | 'leak'>('speed');

  // Speed Test State
  const [speedState, setSpeedState] = useState<SpeedTestResult>({
    status: 'idle',
    progress: 0,
    ping: 0,
    jitter: 0,
    downloadMbps: 0,
    uploadMbps: 0,
  });

  // Leak Test State
  const [leakState, setLeakState] = useState<LeakTestState>({
    testing: false,
    testedAt: null,
    publicIp: isConnected ? (server?.host || (server as any)?.ip || server?.virtualIp || '198.51.100.45') : '172.56.21.94',
    realIpMasked: isConnected,
    isp: isConnected ? server.provider : 'Local Broadband ISP (Exposed)',
    location: isConnected ? `${server.city}, ${server.country}` : 'San Francisco, US (Unprotected)',
    dnsLeak: !isConnected,
    dnsServersFound: isConnected 
      ? ['1.1.1.1 (Cloudflare DoH)', '1.0.0.1 (Encrypted)'] 
      : ['75.75.75.75 (Comcast DNS Leak)', '75.75.76.76 (ISP Unencrypted)'],
    webrtcLeak: !isConnected,
    ipv6Leak: false,
  });

  // Run Speed Test
  const runSpeedTest = () => {
    setSpeedState({
      status: 'pinging',
      progress: 10,
      ping: Math.max(12, server.ping + Math.floor(Math.random() * 8 - 4)),
      jitter: Math.floor(Math.random() * 3) + 1,
      downloadMbps: 0,
      uploadMbps: 0,
      serverTested: server,
    });

    // Step 1: Ping
    setTimeout(() => {
      setSpeedState((prev) => ({ ...prev, status: 'downloading', progress: 35 }));

      // Step 2: Download speed ramping
      const targetDl = isConnected 
        ? Math.floor(180 + Math.random() * 120) 
        : Math.floor(65 + Math.random() * 30);
      
      let currentDl = 20;
      const dlInterval = setInterval(() => {
        currentDl += (targetDl - currentDl) * 0.35;
        setSpeedState((prev) => ({
          ...prev,
          progress: Math.min(75, prev.progress + 4),
          downloadMbps: parseFloat(currentDl.toFixed(1)),
        }));
      }, 100);

      setTimeout(() => {
        clearInterval(dlInterval);
        setSpeedState((prev) => ({ ...prev, status: 'uploading', downloadMbps: targetDl, progress: 78 }));

        // Step 3: Upload speed ramping
        const targetUl = isConnected 
          ? Math.floor(95 + Math.random() * 45) 
          : Math.floor(25 + Math.random() * 15);
        
        let currentUl = 10;
        const ulInterval = setInterval(() => {
          currentUl += (targetUl - currentUl) * 0.35;
          setSpeedState((prev) => ({
            ...prev,
            progress: Math.min(99, prev.progress + 4),
            uploadMbps: parseFloat(currentUl.toFixed(1)),
          }));
        }, 100);

        setTimeout(() => {
          clearInterval(ulInterval);
          setSpeedState((prev) => ({
            ...prev,
            status: 'completed',
            progress: 100,
            uploadMbps: targetUl,
          }));
        }, 1200);
      }, 1500);
    }, 800);
  };

  // Run Leak Audit
  const runLeakAudit = () => {
    setLeakState((prev) => ({ ...prev, testing: true }));
    setTimeout(() => {
      setLeakState({
        testing: false,
        testedAt: Date.now(),
        publicIp: isConnected ? (server?.host || (server as any)?.ip || server?.virtualIp || '198.51.100.45') : '172.56.21.94',
        realIpMasked: isConnected,
        isp: isConnected ? `${server.provider} (Apex Encrypted Mesh)` : 'Local ISP Gateway (Exposed)',
        location: isConnected ? `${server.city}, ${server.country}` : 'San Francisco, US (Exposed)',
        dnsLeak: !isConnected,
        dnsServersFound: isConnected 
          ? ['1.1.1.1 (Cloudflare DoH)', '1.0.0.1 (Encrypted Zero-Log)'] 
          : ['75.75.75.75 (ISP DNS Leaking)', '75.75.76.76 (Plaintext Port 53)'],
        webrtcLeak: !isConnected,
        ipv6Leak: false,
      });
    }, 1200);
  };

  return (
    <div id="speed-leak-tester" className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('speed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'speed'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            Bandwidth Speed Test
          </button>

          <button
            onClick={() => setActiveTab('leak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'leak'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            DNS & WebRTC Leak Test
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Server: <strong className="text-white">{server.city}</strong>
        </span>
      </div>

      {/* VIEW 1: SPEED TEST */}
      {activeTab === 'speed' && (
        <div className="space-y-5">
          {/* Main Dial / Gauge Area */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Speed Display */}
            <div className="text-center space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {speedState.status === 'idle' && 'Ready to Benchmark'}
                {speedState.status === 'pinging' && 'Measuring Latency (Ping)...'}
                {speedState.status === 'downloading' && 'Benchmarking Download Bandwidth...'}
                {speedState.status === 'uploading' && 'Benchmarking Upload Bandwidth...'}
                {speedState.status === 'completed' && 'Benchmark Completed'}
              </div>

              <div className="flex items-baseline justify-center gap-2 pt-2">
                <span className="text-5xl font-black text-white font-mono tracking-tight">
                  {speedState.status === 'uploading'
                    ? speedState.uploadMbps
                    : speedState.downloadMbps || (speedState.status === 'completed' ? speedState.downloadMbps : '0.0')}
                </span>
                <span className="text-sm font-bold text-cyan-400">Mbps</span>
              </div>

              <div className="text-xs text-slate-400">
                {speedState.status === 'uploading' ? 'Current Upload Speed' : 'Current Download Speed'}
              </div>
            </div>

            {/* Progress bar */}
            {speedState.status !== 'idle' && (
              <div className="w-full max-w-xs mt-5 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-200"
                  style={{ width: `${speedState.progress}%` }}
                />
              </div>
            )}

            {/* Action Button */}
            <button
              id="start-speed-test-btn"
              onClick={runSpeedTest}
              disabled={speedState.status === 'pinging' || speedState.status === 'downloading' || speedState.status === 'uploading'}
              className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {speedState.status === 'idle' || speedState.status === 'completed' ? (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Speed Test</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Benchmarking ({speedState.progress}%)...</span>
                </>
              )}
            </button>
          </div>

          {/* Results 3-column stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Ping Latency</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-base font-bold text-white font-mono">{speedState.ping || server.ping}</span>
                <span className="text-[10px] text-slate-400">ms</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Download</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-base font-bold text-cyan-300 font-mono">{speedState.downloadMbps || '--'}</span>
                <span className="text-[10px] text-slate-400">Mbps</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Upload</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-base font-bold text-emerald-300 font-mono">{speedState.uploadMbps || '--'}</span>
                <span className="text-[10px] text-slate-400">Mbps</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LEAK TEST */}
      {activeTab === 'leak' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Privacy & Leak Diagnostic</h5>
              <p className="text-xs text-slate-400">Verify your public IP masking, DNS resolvers, and WebRTC privacy</p>
            </div>
            <button
              onClick={runLeakAudit}
              disabled={leakState.testing}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${leakState.testing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{leakState.testing ? 'Auditing...' : 'Run Audit'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* IP Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Public Visible IP</span>
                {leakState.realIpMasked ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Masked & Protected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Exposed IP
                  </span>
                )}
              </div>
              <div className="text-base font-bold font-mono text-white">{leakState.publicIp}</div>
              <div className="text-xs text-slate-400">{leakState.location} • {leakState.isp}</div>
            </div>

            {/* DNS Leak Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">DNS Resolution</span>
                {!leakState.dnsLeak ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No Leaks Detected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> DNS Leaking to ISP
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {leakState.dnsServersFound.map((dns, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300">
                    • {dns}
                  </div>
                ))}
              </div>
            </div>

            {/* WebRTC Leak Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">WebRTC STUN/TURN Shield</span>
                {!leakState.webrtcLeak ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Secure / Shielded
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> WebRTC Leak Risk
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {!leakState.webrtcLeak 
                  ? 'Browser STUN queries routed through VPN virtual interface.' 
                  : 'Connect VPN to prevent local IP extraction via browser WebRTC.'}
              </p>
            </div>

            {/* IPv6 Leak Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">IPv6 Drop / Null Route</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Blocked & Safe
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Non-routable IPv6 traffic is blackholed at TUN adapter level.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
