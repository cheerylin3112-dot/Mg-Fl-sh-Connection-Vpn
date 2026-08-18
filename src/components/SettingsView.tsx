import React from 'react';
import { SecuritySettings, ProtocolType } from '../types';
import { 
  ShieldAlert, 
  Shield, 
  Split, 
  Wifi, 
  Sliders, 
  Lock, 
  Zap, 
  Globe, 
  Radio, 
  Check,
  Smartphone,
  Terminal,
  Cpu,
  Server
} from 'lucide-react';

interface SettingsViewProps {
  settings: SecuritySettings;
  onUpdateSettings: (newSettings: SecuritySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const toggleAppSelection = (appId: string) => {
    const updatedApps = settings.splitApps.map((app) =>
      app.id === appId ? { ...app, selected: !app.selected } : app
    );
    onUpdateSettings({ ...settings, splitApps: updatedApps });
  };

  return (
    <div id="settings-view" className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md space-y-6">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          VPN Security & Tunnel Protocols
        </h3>
        <p className="text-xs text-slate-400">
          Configure encryption ciphers, V2Ray WebSocket paths, SSH payload headers, DNS resolvers, and Android split-tunnel routing.
        </p>
      </div>

      {/* Protocol Selection */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Tunnel Protocol</h4>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono font-semibold">
            {(settings?.protocol || 'vless').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {[
            {
              id: 'wireguard',
              name: 'WireGuard 2.0',
              desc: 'Ultra-fast, ChaCha20-Poly1305, zero overhead',
              badge: 'Fastest',
              icon: Zap,
            },
            {
              id: 'v2ray',
              name: 'V2Ray / Xray-Core',
              desc: 'VMess / VLESS over WebSocket + TLS for DPI bypass',
              badge: 'Anti-Censor',
              icon: Radio,
            },
            {
              id: 'ssh',
              name: 'SSH Tunnel & WS',
              desc: 'Encapsulated SSH with custom HTTP payload injector',
              badge: 'Payload',
              icon: Terminal,
            },
            {
              id: 'openvpn-udp',
              name: 'OpenVPN UDP',
              desc: 'High throughput, AES-256-GCM cipher with SHA512',
              badge: 'Stable',
              icon: Shield,
            },
            {
              id: 'openvpn-tcp',
              name: 'OpenVPN TCP',
              desc: 'Reliable through restrictive firewalls (Port 443 Stealth)',
              badge: 'Stealth',
              icon: Lock,
            },
            {
              id: 'shadowsocks',
              name: 'Shadowsocks AEAD',
              desc: 'Obfuscated proxy protocol for heavy censorship evasion',
              badge: 'Bypass',
              icon: Server,
            },
          ].map((proto) => {
            const isSelected = settings.protocol === proto.id;
            const Icon = proto.icon;
            return (
              <div
                key={proto.id}
                onClick={() => onUpdateSettings({ ...settings, protocol: proto.id as ProtocolType })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {proto.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {proto.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{proto.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* V2Ray In-Depth Settings Panel */}
      {settings.protocol === 'v2ray' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider">V2Ray VMess / VLESS Tuning</h4>
            </div>
            <span className="text-[10px] text-slate-400">WebSocket + TLS Handshake</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Client UUID</label>
              <input
                type="text"
                value={settings.v2ray?.uuid || 'e7136f40-362d-4c38-897b-944a17684a0d'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    v2ray: { ...settings.v2ray, uuid: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">WebSocket Path</label>
              <input
                type="text"
                value={settings.v2ray?.path || '/apex-v2ray-ws'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    v2ray: { ...settings.v2ray, path: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                placeholder="/v2ray"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">TLS SNI / Bug Host</label>
              <input
                type="text"
                value={settings.v2ray?.sni || 'cloudflare.com'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    v2ray: { ...settings.v2ray, sni: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                placeholder="sni.domain.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Transport Security</label>
              <select
                value={settings.v2ray?.security || 'auto'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    v2ray: { ...settings.v2ray, security: e.target.value as any },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="auto">Auto (Zero-DPI AES-128 / ChaCha)</option>
                <option value="aes-128-gcm">AES-128-GCM</option>
                <option value="chacha20-poly1305">ChaCha20-Poly1305</option>
                <option value="none">None (Plaintext payload for debugging)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SSH In-Depth Settings Panel */}
      {settings.protocol === 'ssh' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">SSH Tunnel & HTTP Custom Payload</h4>
            </div>
            <span className="text-[10px] text-slate-400">JSch / OpenSSH over SSL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">SSH Username</label>
              <input
                type="text"
                value={settings.ssh?.username || 'apex_user'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    ssh: { ...settings.ssh, username: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">SSH Password / Secret</label>
              <input
                type="password"
                value={settings.ssh?.password || 'ApexPass2026!'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    ssh: { ...settings.ssh, password: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">SNI Bug Host</label>
              <input
                type="text"
                value={settings.ssh?.sniBugHost || 'm.youtube.com'}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    ssh: { ...settings.ssh, sniBugHost: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                placeholder="m.youtube.com"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-300 font-semibold">Custom HTTP Payload Header</label>
            <textarea
              rows={2}
              value={settings.ssh?.payload || 'GET / HTTP/1.1[crlf]Host: [host_port][crlf]Upgrade: websocket[crlf]Connection: Upgrade[crlf][crlf]'}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  ssh: { ...settings.ssh, payload: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Kill Switch & CyberSec Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Kill Switch */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">System Kill Switch</h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.killSwitch}
                  onChange={(e) => onUpdateSettings({ ...settings, killSwitch: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Automatically cuts all internet traffic if VPN disconnects unexpectedly to prevent accidental IP exposure.
            </p>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 pt-1">
            Status: {settings.killSwitch ? 'Strict Null-Route Enabled' : 'Disabled'}
          </div>
        </div>

        {/* CyberSec Threat & AdBlock */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Threat & Ad Shield</h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cyberSec}
                  onChange={(e) => onUpdateSettings({ ...settings, cyberSec: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Blocks intrusive ads, tracking scripts, botnet communication, and malicious phishing domains at DNS level.
            </p>
          </div>
          <div className="text-[11px] font-mono text-cyan-400 pt-1">
            Status: {settings.cyberSec ? 'DNS Filter Active (140,000+ domains)' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Encrypted DNS Resolver */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Encrypted DNS Resolver</h4>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'cloudflare', name: 'Cloudflare', ip: '1.1.1.1', desc: 'Fastest & Private' },
            { id: 'google', name: 'Google DNS', ip: '8.8.8.8', desc: 'High Reliability' },
            { id: 'adguard', name: 'AdGuard DNS', ip: '94.140.14.14', desc: 'No Ads' },
            { id: 'quad9', name: 'Quad9 Security', ip: '9.9.9.9', desc: 'Malware Block' },
          ].map((dns) => {
            const isSelected = settings.dnsProvider === dns.id;
            return (
              <div
                key={dns.id}
                onClick={() => onUpdateSettings({ ...settings, dnsProvider: dns.id as any })}
                className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{dns.name}</div>
                <div className="text-[10px] font-mono text-slate-400">{dns.ip}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Tunneling */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-cyan-400" />
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Android App Split Tunneling</h4>
              <p className="text-[11px] text-slate-400">Choose which mobile apps route through VPN or direct connection</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.splitTunneling}
              onChange={(e) => onUpdateSettings({ ...settings, splitTunneling: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {settings.splitTunneling && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Select apps to route through encrypted tunnel:</span>
              <span className="text-cyan-400 font-medium">
                {settings.splitApps.filter((a) => a.selected).length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {settings.splitApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => toggleAppSelection(app.id)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    app.selected
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-semibold">{app.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{app.package}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    app.selected ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700'
                  }`}>
                    {app.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MTU Size & Advanced */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Packet MTU Size</span>
          <span className="font-mono text-cyan-400 font-bold">{settings.mtuSize || 1420} bytes</span>
        </div>
        <input
          type="range"
          min="1280"
          max="1500"
          step="10"
          value={settings.mtuSize || 1420}
          onChange={(e) => onUpdateSettings({ ...settings, mtuSize: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>1280 (Strict Mobile MSS)</span>
          <span>1420 (Optimal WireGuard & V2Ray)</span>
          <span>1500 (Standard Ethernet)</span>
        </div>
      </div>
    </div>
  );
};
