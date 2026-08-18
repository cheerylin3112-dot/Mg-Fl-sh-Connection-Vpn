import React, { useState, useEffect } from 'react';
import { VPNServer, SecuritySettings, AndroidApkConfig, ProtocolType } from '../types';
import { 
  generateWireGuardConfig, 
  generateOpenVpnConfig, 
  generateV2rayLink,
  generateSshTunnelConfig,
  generateQRCodeDataUrl, 
  generateAndroidApkManifestSnippet, 
  generateKotlinVpnService 
} from '../utils/configGen';
import { 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  Code2, 
  Settings2, 
  X, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  Layers,
  Cpu,
  Radio,
  Terminal,
  Globe
} from 'lucide-react';

interface ApkBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServer: VPNServer;
  servers: VPNServer[];
  securitySettings: SecuritySettings;
}

type TabType = 'apk_builder' | 'qr_sync' | 'v2ray_conf' | 'ssh_conf' | 'wireguard_conf' | 'openvpn_conf' | 'android_src';

export const ApkBuilderModal: React.FC<ApkBuilderModalProps> = ({
  isOpen,
  onClose,
  selectedServer,
  servers,
  securitySettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('apk_builder');
  const [apkConfig, setApkConfig] = useState<AndroidApkConfig>({
    packageName: 'com.mgflash.vpn.tunnel',
    appName: 'Mg Flâsh Connection',
    versionName: '2.4.0',
    versionCode: 240,
    defaultServerId: selectedServer.id,
    enableAlwaysOn: true,
    enableKillSwitch: true,
    enableAdBlock: true,
    protocol: 'wireguard',
    dnsResolver: '1.1.1.1',
    customRoutes: '0.0.0.0/0',
    allowBypass: true,
    backendSyncUrl: 'https://ais-dev-7sdoyrt6upbnsibpltwgit-573274690065.asia-southeast1.run.app/api/subscription/public-default-tier',
  });

  const [qrType, setQrType] = useState<'wireguard' | 'v2ray' | 'ssh'>('v2ray');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [apkBuildCompleted, setApkBuildCompleted] = useState(false);

  // Generate configs
  const wgConfig = generateWireGuardConfig(selectedServer, securitySettings);
  const ovpnConfig = generateOpenVpnConfig(selectedServer, securitySettings);
  const v2rayData = generateV2rayLink(selectedServer, securitySettings);
  const sshData = generateSshTunnelConfig(selectedServer, securitySettings);
  const manifestCode = generateAndroidApkManifestSnippet(apkConfig, selectedServer);
  const kotlinServiceCode = generateKotlinVpnService(apkConfig, selectedServer);

  // Update QR Code on config or QR type change
  useEffect(() => {
    async function updateQR() {
      let qrText = '';
      if (qrType === 'wireguard') qrText = wgConfig;
      else if (qrType === 'v2ray') qrText = v2rayData.vmessUri;
      else if (qrType === 'ssh') qrText = sshData.httpCustomPayload;

      const qr = await generateQRCodeDataUrl(qrText);
      setQrDataUrl(qr);
    }
    if (isOpen) {
      updateQR();
    }
  }, [isOpen, selectedServer, securitySettings, qrType]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSimulatedApkBuild = () => {
    setIsBuildingApk(true);
    setBuildProgress(0);
    setApkBuildCompleted(false);

    const interval = setInterval(() => {
      setBuildProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBuildingApk(false);
          setApkBuildCompleted(true);
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="apk-builder-modal"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                VPN APK Builder & Protocol Studio
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  V2Ray • SSH • WireGuard • OpenVPN
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Compile Android VPN APKs, generate VMess/VLESS links, configure SSH WebSockets & QR tunnels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-slate-800 bg-slate-900/90 text-xs overflow-x-auto">
          {[
            { id: 'apk_builder', label: 'APK Config & Compiler', icon: Cpu },
            { id: 'v2ray_conf', label: 'V2Ray (VMess / VLESS)', icon: Radio },
            { id: 'ssh_conf', label: 'SSH Tunnel & Payload', icon: Terminal },
            { id: 'qr_sync', label: 'Mobile QR Sync', icon: QrCode },
            { id: 'wireguard_conf', label: 'WireGuard (.conf)', icon: ShieldCheck },
            { id: 'openvpn_conf', label: 'OpenVPN (.ovpn)', icon: FileText },
            { id: 'android_src', label: 'Android Source Code', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: APK CONFIG & BUILD */}
          {activeTab === 'apk_builder' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-cyan-200">Android APK Build Spec & Embedded Tunnel Core</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Compile a standalone Android APK equipped with native V2Ray/Xray Lib, JSch SSH Over TLS, WireGuard Go backend, and zero-log routing.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* App Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Application Name</label>
                  <input
                    type="text"
                    value={apkConfig.appName}
                    onChange={(e) => setApkConfig({ ...apkConfig, appName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Apex VPN"
                  />
                </div>

                {/* Package Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Android Package ID</label>
                  <input
                    type="text"
                    value={apkConfig.packageName}
                    onChange={(e) => setApkConfig({ ...apkConfig, packageName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="com.custom.vpn.client"
                  />
                </div>

                {/* Embedded Default Server */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Default Gateway Server</label>
                  <select
                    value={apkConfig.defaultServerId}
                    onChange={(e) => setApkConfig({ ...apkConfig, defaultServerId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.flag} {s.name} ({s.ping}ms - {s.ip})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tunnel Protocol */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Primary Core Tunnel Protocol</label>
                  <select
                    value={apkConfig.protocol}
                    onChange={(e) => setApkConfig({ ...apkConfig, protocol: e.target.value as ProtocolType })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="v2ray">V2Ray / Xray-Core (VMess / VLESS over WebSocket + TLS)</option>
                    <option value="ssh">SSH Tunnel (SSH over SSL/WebSocket & Payload Injection)</option>
                    <option value="wireguard">WireGuard 2.0 (Modern, High Speed UDP)</option>
                    <option value="openvpn-udp">OpenVPN UDP (High Reliability)</option>
                    <option value="openvpn-tcp">OpenVPN TCP (Port 443 Stealth)</option>
                    <option value="shadowsocks">Shadowsocks AEAD (Censorship Bypass)</option>
                  </select>
                </div>
              </div>

              {/* Protocol Quick Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-cyan-400" /> V2Ray / VMess Core
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Port 443 WS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Bypasses Deep Packet Inspection (DPI) by disguising traffic as normal HTTPS WebSocket web browsing.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" /> SSH Tunnel & Payloads
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Port 22 / 443</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Provides secure shell encapsulation with custom HTTP bug host headers for zero-rated ISP bypass.
                  </p>
                </div>
              </div>

              {/* Build Action & Progress */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Target: {apkConfig.appName} (v{apkConfig.versionName}) • [{(apkConfig?.protocol || 'vless').toUpperCase()}]
                  </div>
                  <p className="text-xs text-slate-400">
                    Generates native release APK manifest with embedded V2Ray & SSH modules
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    id="build-apk-btn"
                    onClick={handleSimulatedApkBuild}
                    disabled={isBuildingApk}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBuildingApk ? (
                      <>
                        <Cpu className="w-4 h-4 animate-spin" />
                        <span>Compiling APK ({buildProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Build & Package APK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Build Success Banner */}
              {apkBuildCompleted && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-emerald-200">
                        {apkConfig.appName}-{apkConfig.versionName}-release.apk Ready
                      </h5>
                      <p className="text-xs text-emerald-400/80">
                        Packaged with {selectedServer.name} gateway, V2Ray/SSH core & Android VpnService hooks.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const configData = JSON.stringify({
                        apkConfig,
                        server: selectedServer,
                        v2ray: v2rayData,
                        ssh: sshData,
                        wireguardConfig: wgConfig,
                        openvpnConfig: ovpnConfig,
                        manifest: manifestCode,
                        service: kotlinServiceCode,
                      }, null, 2);
                      handleDownload(configData, `${apkConfig.packageName}-build-manifest.json`, 'application/json');
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download APK Spec Bundle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: V2RAY VMESS / VLESS CONFIG */}
          {activeTab === 'v2ray_conf' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    V2Ray / Xray-Core Profile (VMess & VLESS)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Encrypted WebSocket + TLS tunnel for Deep Packet Inspection bypass (v2rayNG / Matsuri compatible)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(v2rayData.vmessUri, 'vmess')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'vmess' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'vmess' ? 'Copied VMess!' : 'Copy vmess:// URI'}
                  </button>

                  <button
                    onClick={() => handleDownload(v2rayData.jsonConfig, `v2ray-config-${selectedServer.id}.json`, 'application/json')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download config.json
                  </button>
                </div>
              </div>

              {/* VMess URI Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">1. Shareable VMess Import Link (Android v2rayNG / v2fly)</span>
                  <span className="text-cyan-400 font-mono text-[11px]">Port {selectedServer.v2rayPort || 443}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                  {v2rayData.vmessUri}
                </div>
              </div>

              {/* VLESS URI Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">2. VLESS WebSocket + TLS Link</span>
                  <button
                    onClick={() => handleCopy(v2rayData.vlessUri, 'vless')}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                  >
                    {copiedKey === 'vless' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy VLESS
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                  {v2rayData.vlessUri}
                </div>
              </div>

              {/* V2Ray config.json */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">3. V2Ray Core Client Specification (config.json)</span>
                  <button
                    onClick={() => handleCopy(v2rayData.jsonConfig, 'json')}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                  >
                    {copiedKey === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto max-h-[260px] leading-relaxed">
                  {v2rayData.jsonConfig}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SSH TUNNEL & PAYLOAD */}
          {activeTab === 'ssh_conf' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    SSH Tunnel & Payload Injector
                  </h4>
                  <p className="text-xs text-slate-400">
                    SSH-over-SSL / WebSocket encapsulation with custom SNI bug host headers for Android HTTP Custom & Injector
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(sshData.httpCustomPayload, 'payload')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'payload' ? 'Copied Payload!' : 'Copy Injector Payload'}
                  </button>

                  <button
                    onClick={() => handleDownload(sshData.httpCustomPayload, `apex-ssh-${selectedServer.id}.ehi`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .ehi / Config
                  </button>
                </div>
              </div>

              {/* SSH Command */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">1. OpenSSH SOCKS5 Proxy Command</span>
                  <span className="font-mono text-emerald-400 text-[11px]">Port {selectedServer.sshPort || 22}</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                  {sshData.bashCommand}
                </pre>
              </div>

              {/* HTTP Custom Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">2. Android HTTP Custom / Injector Payload Config</span>
                  <span className="text-slate-400 text-[11px]">SSH WebSocket SSL</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto max-h-[220px] leading-relaxed">
                  {sshData.httpCustomPayload}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: QR CODE SYNC */}
          {activeTab === 'qr_sync' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-5 text-center">
              {/* QR Mode Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setQrType('v2ray')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    qrType === 'v2ray' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  V2Ray VMess QR
                </button>
                <button
                  onClick={() => setQrType('wireguard')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    qrType === 'wireguard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WireGuard QR
                </button>
                <button
                  onClick={() => setQrType('ssh')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    qrType === 'ssh' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SSH Payload QR
                </button>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-2xl border border-cyan-500/40">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="VPN Sync QR Code" className="w-64 h-64 rounded-xl" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                    Generating QR Code...
                  </div>
                )}
              </div>

              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  Scan with Android {qrType === 'v2ray' ? 'v2rayNG' : qrType === 'ssh' ? 'HTTP Custom' : 'WireGuard'} App
                </h4>
                <p className="text-xs text-slate-400">
                  Open your mobile client and scan this QR code for 1-second auto-import of {selectedServer.name} credentials.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Server: {selectedServer.city}</span>
                  <span>•</span>
                  <span>IP: {selectedServer.ip}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WIREGUARD CONFIG */}
          {activeTab === 'wireguard_conf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">WireGuard Client Configuration (wg0.conf)</h4>
                  <p className="text-xs text-slate-400">Modern ChaCha20-Poly1305 zero-overhead tunnel protocol</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(wgConfig, 'wg')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'wg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'wg' ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(wgConfig, `apex-${selectedServer.id}.conf`)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .conf
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[340px]">
                {wgConfig}
              </pre>
            </div>
          )}

          {/* TAB 6: OPENVPN CONFIG */}
          {activeTab === 'openvpn_conf' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">OpenVPN Client Profile (client.ovpn)</h4>
                  <p className="text-xs text-slate-400">AES-256-GCM encrypted tunnel with inline certificates & keys</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(ovpnConfig, 'ovpn')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'ovpn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'ovpn' ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(ovpnConfig, `apex-${selectedServer.id}.ovpn`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .ovpn
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[340px]">
                {ovpnConfig}
              </pre>
            </div>
          )}

          {/* TAB 7: ANDROID SOURCE CODE */}
          {activeTab === 'android_src' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">1. AndroidManifest.xml</span>
                  <button
                    onClick={() => handleCopy(manifestCode, 'manifest')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'manifest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'manifest' ? 'Copied' : 'Copy XML'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-[160px]">
                  {manifestCode}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">2. ApexVpnService.kt (Native Kotlin VpnService with V2Ray & SSH hooks)</span>
                  <button
                    onClick={() => handleCopy(kotlinServiceCode, 'kotlin')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'kotlin' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'kotlin' ? 'Copied' : 'Copy Kotlin'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-[220px]">
                  {kotlinServiceCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>Supported Protocols: V2Ray (VMess/VLESS), SSH Over TLS, WireGuard 2.0, OpenVPN</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
