import React, { useState, useEffect } from 'react';
import { VPNServer, ParsedConfig } from '../types';
import { parseVpnLink, generateShareableUri, generateClientJson } from '../utils/protocolParser';
import QRCode from 'qrcode';
import { 
  FileCode, 
  Clipboard, 
  QrCode, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Key, 
  Server, 
  Copy, 
  Download, 
  Sparkles,
  Zap,
  Code,
  Layers,
  Upload
} from 'lucide-react';

interface ConfigImporterViewProps {
  onAddCustomServer: (server: VPNServer) => void;
  onConnectServer: (server: VPNServer) => void;
}

export const ConfigImporterView: React.FC<ConfigImporterViewProps> = ({
  onAddCustomServer,
  onConnectServer,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedConfig | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'paste' | 'qr' | 'json'>('paste');

  // Auto-parse on input change
  useEffect(() => {
    if (!inputText.trim()) {
      setParsed(null);
      setQrCodeDataUrl('');
      return;
    }

    const result = parseVpnLink(inputText);
    setParsed(result);

    if (result.valid) {
      QRCode.toDataURL(result.rawInput, { width: 220, margin: 1, color: { dark: '#0891b2', light: '#0f172a' } })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(''));
    }
  }, [inputText]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      // Fallback
    }
  };

  const handleApplyToClient = (andConnect: boolean = false) => {
    if (!parsed || !parsed.valid) return;

    const newServer: VPNServer = {
      id: `custom-${Date.now()}`,
      name: parsed.name || `${(parsed.protocol || 'vpn').toUpperCase()} Node`,
      host: parsed.server,
      port: parsed.port,
      protocol: parsed.protocol,
      country: 'Custom Config',
      countryCode: 'UN',
      city: parsed.server,
      flag: '⚡',
      virtualIp: '10.88.99.1',
      ping: 28,
      load: 20,
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
      serviceName: parsed.serviceName,
      publicKey: parsed.publicKey,
      shortId: parsed.shortId,
      flow: parsed.flow,
      ssMethod: parsed.ssMethod,
      sshPayload: parsed.sshPayload,
      dnsResolver: parsed.dnsResolver || '1.1.1.1',
      provider: 'Imported Profile',
      bandwidthGbps: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddCustomServer(newServer);
    if (andConnect) {
      onConnectServer(newServer);
    }
  };

  const sampleConfigs = [
    {
      label: 'VLESS Reality (Vision)',
      link: 'vless://a8e1b8c2-4f32-4d1a-982e-9876543210ab@198.51.100.45:443?type=ws&security=reality&sni=www.cloudflare.com&pbk=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b&sid=6ba7b810&path=%2Fapex-vless-ws#US-Reality-Node',
    },
    {
      label: 'VMess WebSocket TLS',
      link: `vmess://${btoa(JSON.stringify({ v: '2', ps: 'Frankfurt-VMess', add: '194.187.249.12', port: 443, id: 'b2c3d4e5-f6a7-48b9-bc0d-1e2f3a4b5c6d', net: 'ws', tls: 'tls', sni: 'de.apex-mesh.net', path: '/apex-vmess-ws' }))}`,
    },
    {
      label: 'Trojan gRPC TLS',
      link: 'trojan://ApexTrojanTokyo2026!@103.102.166.2:443?type=grpc&security=tls&sni=jp-edge.apex-mesh.net&serviceName=apex-trojan-grpc#Tokyo-Trojan-gRPC',
    },
    {
      label: 'SSH Tunnel SSL Payload',
      link: 'ssh://apex_user:ApexPassLondon2026!@185.120.45.19:22?ssl=1&sni=m.youtube.com#London-SSH-Injector',
    },
  ];

  return (
    <div id="config-importer-view" className="w-full space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Universal Configuration & Link Parser
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports VLESS Reality, VMess, Trojan, Shadowsocks, SSH, SOCKS5, HTTP Proxy, and V2Ray JSON
            </p>
          </div>
        </div>

        <button
          onClick={handlePasteClipboard}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Clipboard className="w-4 h-4 text-cyan-400" />
          <span>Paste from Clipboard</span>
        </button>
      </div>

      {/* Quick Templates Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold whitespace-nowrap">Sample Presets:</span>
        {sampleConfigs.map((sample) => (
          <button
            key={sample.label}
            onClick={() => setInputText(sample.link)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 whitespace-nowrap transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="font-semibold">Paste URI link, Base64 token, or raw JSON specification</label>
          {inputText && (
            <button onClick={() => setInputText('')} className="text-rose-400 hover:underline">
              Clear input
            </button>
          )}
        </div>
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="vless://uuid@domain:443?type=ws&security=reality... or vmess://... or JSON configuration"
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner"
        />
      </div>

      {/* Parsed Inspection Card */}
      {parsed && (
        <div className={`p-5 rounded-2xl border transition-all ${
          parsed.valid
            ? 'bg-slate-900/90 border-cyan-500/40 shadow-xl'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          {parsed.valid ? (
            <div className="space-y-5">
              {/* Header Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{parsed.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono font-bold uppercase">
                        {parsed.protocol}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {parsed.server}:{parsed.port} • {(parsed.transport || 'tcp').toUpperCase()} • {(parsed.tlsType || 'none').toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyToClient(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    Save Node
                  </button>
                  <button
                    onClick={() => handleApplyToClient(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Connect Now</span>
                  </button>
                </div>
              </div>

              {/* Decoded Parameters Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Server Address</div>
                  <div className="font-mono text-cyan-300 font-bold">{parsed.server}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Port</div>
                  <div className="font-mono text-cyan-300 font-bold">{parsed.port}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Transport Protocol</div>
                  <div className="font-mono text-slate-200">{parsed.transport} ({parsed.tlsType})</div>
                </div>

                {parsed.uuid && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 sm:col-span-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">UUID / Auth ID</div>
                    <div className="font-mono text-cyan-300 text-[11px] truncate">{parsed.uuid}</div>
                  </div>
                )}

                {parsed.sni && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">SNI / Bug Host</div>
                    <div className="font-mono text-emerald-300 text-[11px] truncate">{parsed.sni}</div>
                  </div>
                )}

                {parsed.path && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">WebSocket Path</div>
                    <div className="font-mono text-cyan-300 text-[11px] truncate">{parsed.path}</div>
                  </div>
                )}

                {parsed.publicKey && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 sm:col-span-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Reality Public Key (pbk)</div>
                    <div className="font-mono text-cyan-300 text-[11px] truncate">{parsed.publicKey}</div>
                  </div>
                )}

                {parsed.shortId && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Reality Short ID (sid)</div>
                    <div className="font-mono text-cyan-300 text-[11px]">{parsed.shortId}</div>
                  </div>
                )}
              </div>

              {/* QR Code & Mobile Import */}
              {qrCodeDataUrl && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={qrCodeDataUrl}
                    alt="Config QR Code"
                    className="w-36 h-36 rounded-lg bg-slate-900 p-2 border border-slate-700 shadow-md"
                  />
                  <div className="space-y-2 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      Scan on Android Phone
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      Scan this QR code using the built-in scanner or apps like <strong>v2rayNG</strong>, <strong>Matsuri</strong>, or <strong>HTTP Custom</strong> to instantly import this profile.
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(parsed.rawInput);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-colors mx-auto sm:mx-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied URI Link!' : 'Copy Link URI'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-bold">Configuration Parse Error</div>
                <div>{parsed.error}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
