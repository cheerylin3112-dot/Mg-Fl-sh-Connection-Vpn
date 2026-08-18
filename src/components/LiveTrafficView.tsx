import React, { useEffect, useRef } from 'react';
import { TrafficPoint, VPNServer, SecuritySettings } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Clock, ShieldCheck, Activity, Wifi, Lock } from 'lucide-react';

interface LiveTrafficViewProps {
  isConnected: boolean;
  currentDownloadSpeed: number; // in KB/s
  currentUploadSpeed: number; // in KB/s
  totalDownloadedBytes: number;
  totalUploadedBytes: number;
  sessionStartTime: number | null;
  history: TrafficPoint[];
  server: VPNServer;
  settings: SecuritySettings;
}

export const LiveTrafficView: React.FC<LiveTrafficViewProps> = ({
  isConnected,
  currentDownloadSpeed,
  currentUploadSpeed,
  totalDownloadedBytes,
  totalUploadedBytes,
  sessionStartTime,
  history,
  server,
  settings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format bytes to readable string
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0.00 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  // Format speed
  const formatSpeed = (kbps: number): { value: string; unit: string } => {
    if (kbps >= 1024) {
      return { value: (kbps / 1024).toFixed(2), unit: 'MB/s' };
    }
    return { value: kbps.toFixed(1), unit: 'KB/s' };
  };

  // Format duration
  const getDuration = (): string => {
    if (!isConnected || !sessionStartTime) return '00:00:00';
    const seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [durationStr, setDurationStr] = React.useState(getDuration());

  useEffect(() => {
    const timer = setInterval(() => {
      setDurationStr(getDuration());
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected, sessionStartTime]);

  // Render Canvas Graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 0; y <= height; y += height / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (history.length < 2) return;

    const maxSpeed = Math.max(
      ...history.map((h) => Math.max(h.download, h.upload)),
      500 // minimum scale
    );

    const stepX = width / (history.length - 1);

    // Draw Download Line (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = height - (pt.download / maxSpeed) * (height - 10) - 5;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill download gradient
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const dlGrad = ctx.createLinearGradient(0, 0, 0, height);
    dlGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    dlGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    ctx.fillStyle = dlGrad;
    ctx.fill();

    // Draw Upload Line (Emerald)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = height - (pt.upload / maxSpeed) * (height - 10) - 5;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [history]);

  const dl = formatSpeed(currentDownloadSpeed);
  const ul = formatSpeed(currentUploadSpeed);

  return (
    <div id="live-traffic-view" className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl backdrop-blur-md space-y-4">
      {/* Header telemetry summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Traffic Telemetry</h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-200">{durationStr}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
            {(settings?.protocol || 'vless').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Speed Gauge Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Download Speed Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Download</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-white font-mono">{dl.value}</span>
                <span className="text-xs font-semibold text-cyan-400">{dl.unit}</span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div>Session</div>
            <div className="font-mono text-slate-300 font-medium">{formatBytes(totalDownloadedBytes)}</div>
          </div>
        </div>

        {/* Upload Speed Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Upload</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-white font-mono">{ul.value}</span>
                <span className="text-xs font-semibold text-emerald-400">{ul.unit}</span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div>Session</div>
            <div className="font-mono text-slate-300 font-medium">{formatBytes(totalUploadedBytes)}</div>
          </div>
        </div>
      </div>

      {/* Real-time Bandwidth Graph Canvas */}
      <div className="relative rounded-xl bg-slate-950/90 border border-slate-800 p-2 overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Downlink
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Uplink
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[10px]">60s window</span>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full h-[110px] rounded-lg block"
        />

        {!isConnected && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" /> Connect VPN to start real-time traffic monitoring
            </span>
          </div>
        )}
      </div>

      {/* Security Status Pills Footer */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Kill Switch</span>
          <span className={`text-xs font-semibold ${settings.killSwitch ? 'text-emerald-400' : 'text-slate-400'}`}>
            {settings.killSwitch ? 'Active' : 'Disabled'}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Encryption</span>
          <span className="text-xs font-semibold text-cyan-400">ChaCha20-Poly1305</span>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">DNS Leak Shield</span>
          <span className="text-xs font-semibold text-emerald-400">Enforced</span>
        </div>
      </div>
    </div>
  );
};
