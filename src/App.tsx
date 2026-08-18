/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  VPNServer, 
  ConnectionStatus, 
  SecuritySettings, 
  TrafficPoint,
  User,
  UserTier
} from './types';
import { SERVERS_DATA, INITIAL_APPS_LIST } from './data/servers';
import { MobileFrame } from './components/MobileFrame';
import { VPNHome } from './components/VPNHome';
import { ServersView } from './components/ServersView';
import { ConfigImporterView } from './components/ConfigImporterView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { AdminPanelView } from './components/AdminPanelView';
import { SettingsView } from './components/SettingsView';
import { ServerListModal } from './components/ServerListModal';
import { ApkBuilderModal } from './components/ApkBuilderModal';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { AuthModal } from './components/AuthModal';
import { WorldMapVisualizer } from './components/WorldMapVisualizer';
import { LiveTrafficView } from './components/LiveTrafficView';
import { SpeedLeakTester } from './components/SpeedLeakTester';

import { 
  Shield, 
  Smartphone, 
  Monitor, 
  Sliders, 
  Globe, 
  Download, 
  Zap,
  Lock,
  User as UserIcon,
  Server,
  FileCode,
  Link2,
  Activity,
  Layers,
  Code2,
  RefreshCw,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export default function App() {
  // Server state - initialized with backend seed or local fallback
  const [servers, setServers] = useState<VPNServer[]>(SERVERS_DATA);
  const [selectedServer, setSelectedServer] = useState<VPNServer>(SERVERS_DATA[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'user-admin-01',
    username: 'admin',
    email: 'admin@apexvpn.net',
    role: 'admin',
    tier: 'enterprise',
    createdAt: new Date().toISOString(),
    token: 'apex_admin_token_secure_999',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Connection state & Android VPN Permission
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);

  // Traffic & Speed telemetry
  const [currentDownloadSpeed, setCurrentDownloadSpeed] = useState<number>(0);
  const [currentUploadSpeed, setCurrentUploadSpeed] = useState<number>(0);
  const [totalDownloadedBytes, setTotalDownloadedBytes] = useState<number>(142 * 1024 * 1024);
  const [totalUploadedBytes, setTotalUploadedBytes] = useState<number>(38 * 1024 * 1024);
  const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>(() => {
    const points: TrafficPoint[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      points.push({
        time: new Date(now - i * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now - i * 2000,
        download: 0,
        upload: 0,
      });
    }
    return points;
  });

  // UI View Modes & Active Tabs
  const [isMobileView, setIsMobileView] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'home' | 'servers' | 'configs' | 'subscriptions' | 'settings' | 'admin'>('home');
  
  // Modals
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isAndroidProjectModalOpen, setIsAndroidProjectModalOpen] = useState<boolean>(false);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    protocol: 'vless',
    killSwitch: true,
    autoConnect: false,
    cyberSec: true,
    dnsProtection: true,
    dnsProvider: 'cloudflare',
    customDnsIp: '1.1.1.1',
    splitTunneling: true,
    splitTunnelMode: 'bypass',
    splitApps: INITIAL_APPS_LIST,
    obfuscation: true,
    mtuSize: 1420,
    lanBypass: true,
    ipv6LeakProtection: true,
  });

  // Synchronize server list from Backend REST API
  const fetchServersFromBackend = async () => {
    setIsSyncing(true);
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/servers/sync', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.servers && data.servers.length > 0) {
          setServers(data.servers);
          // If current selected server was removed, default to first
          if (!data.servers.some((s: VPNServer) => s.id === selectedServer.id)) {
            setSelectedServer(data.servers[0]);
          }
        }
      }
    } catch {
      // Keep existing local fallback
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchServersFromBackend();
  }, [currentUser]);

  // Session duration timer loop
  useEffect(() => {
    let timer: any = null;
    if (connectionStatus === 'connected' && sessionStartTime) {
      timer = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(timer);
  }, [connectionStatus, sessionStartTime]);

  // Connect Toggle with Android VPN Permission Simulation
  const handleToggleConnect = () => {
    if (connectionStatus === 'connected') {
      setConnectionStatus('disconnecting');
      setTimeout(() => {
        setConnectionStatus('disconnected');
        setSessionStartTime(null);
        setCurrentDownloadSpeed(0);
        setCurrentUploadSpeed(0);
      }, 500);
    } else if (connectionStatus === 'disconnected') {
      // Trigger Android VpnService.prepare() prompt
      setShowPermissionDialog(true);
    }
  };

  const handleAcceptPermission = () => {
    setShowPermissionDialog(false);
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
      setSessionStartTime(Date.now());
    }, 1200);
  };

  const handleDenyPermission = () => {
    setShowPermissionDialog(false);
    setConnectionStatus('disconnected');
  };

  // Direct Connect from Server List or Importer
  const handleDirectConnect = (server: VPNServer) => {
    setSelectedServer(server);
    if (connectionStatus !== 'connected') {
      setShowPermissionDialog(true);
    }
  };

  // Real-time Traffic Simulator Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        const baseDl = 4500 + Math.random() * 8500; // KB/s (~4.5 - 13 MB/s)
        const baseUl = 800 + Math.random() * 2200; // KB/s (~0.8 - 3 MB/s)
        
        setCurrentDownloadSpeed(baseDl);
        setCurrentUploadSpeed(baseUl);

        setTotalDownloadedBytes((prev) => prev + baseDl * 1024 * 1.5);
        setTotalUploadedBytes((prev) => prev + baseUl * 1024 * 1.5);

        setTrafficHistory((prev) => {
          const now = Date.now();
          const newPt: TrafficPoint = {
            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: now,
            download: baseDl,
            upload: baseUl,
          };
          return [...prev.slice(1), newPt];
        });
      } else {
        setCurrentDownloadSpeed(0);
        setCurrentUploadSpeed(0);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Real-time Ping Refresh
  const handleRefreshPings = () => {
    setIsPinging(true);
    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          ping: Math.max(12, s.ping + Math.floor(Math.random() * 10 - 5)),
          load: Math.min(95, Math.max(10, s.load + Math.floor(Math.random() * 8 - 4))),
        }))
      );
      setIsPinging(false);
    }, 800);
  };

  const handleAddCustomServer = (server: VPNServer) => {
    setServers((prev) => [server, ...prev]);
    setSelectedServer(server);
  };

  const handleAddServersFromSubscription = (newServers: VPNServer[]) => {
    setServers((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const filtered = newServers.filter((s) => !existingIds.has(s.id));
      return [...filtered, ...prev];
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  Mg Flâsh Connection <span className="text-cyan-400 font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30">VPN STUDIO</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                  v2.4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Mg Flâsh Connection • Android VPN Client & Protocol Studio
              </p>
            </div>
          </div>

          {/* Center Tabs for Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            {[
              { id: 'home', label: 'Client Home', icon: Smartphone },
              { id: 'servers', label: 'Servers', icon: Globe },
              { id: 'configs', label: 'Import Configs', icon: FileCode },
              { id: 'subscriptions', label: 'Subscriptions', icon: Link2 },
              { id: 'settings', label: 'Settings', icon: Sliders },
              { id: 'admin', label: 'Admin Panel', icon: Server, badge: 'Authority' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id !== 'home') {
                      setIsMobileView(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Android Mobile Frame vs Full Screen */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => {
                  setIsMobileView(true);
                  setActiveTab('home');
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  isMobileView
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulated Android Mobile Frame"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Mobile Frame</span>
              </button>

              <button
                onClick={() => setIsMobileView(false)}
                className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  !isMobileView
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Expanded Multi-Panel Layout"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Full Studio</span>
              </button>
            </div>

            {/* Android Kotlin Project Source Inspector */}
            <button
              onClick={() => setIsAndroidProjectModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="Inspect Native Android Kotlin Source Code"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Android Source (.kt)</span>
            </button>

            {/* Auth Profile Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-cyan-950/60 hover:border-cyan-500/50 text-slate-200 font-semibold text-xs border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[80px]">{currentUser?.username || 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation sub-bar */}
        <div className="flex md:hidden items-center gap-1 pt-2 overflow-x-auto text-xs border-t border-slate-800/80 mt-2">
          {[
            { id: 'home', label: 'Home', icon: Smartphone },
            { id: 'servers', label: 'Servers', icon: Globe },
            { id: 'configs', label: 'Import', icon: FileCode },
            { id: 'subscriptions', label: 'Subscriptions', icon: Link2 },
            { id: 'settings', label: 'Settings', icon: Sliders },
            { id: 'admin', label: 'Admin', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'home') setIsMobileView(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 ${
                  isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900/60'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6">
        {isMobileView && activeTab === 'home' ? (
          /* Mobile Phone Simulation Layout with Live Telemetry Companions */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Companion Panel: World Map & Telemetry */}
            <div className="hidden lg:block lg:col-span-4 space-y-5">
              <WorldMapVisualizer
                servers={servers}
                selectedServer={selectedServer}
                isConnected={connectionStatus === 'connected'}
                onSelectServer={(srv) => setSelectedServer(srv)}
              />

              <LiveTrafficView
                isConnected={connectionStatus === 'connected'}
                currentDownloadSpeed={currentDownloadSpeed}
                currentUploadSpeed={currentUploadSpeed}
                totalDownloadedBytes={totalDownloadedBytes}
                totalUploadedBytes={totalUploadedBytes}
                sessionStartTime={sessionStartTime}
                history={trafficHistory}
                server={selectedServer}
                settings={securitySettings}
              />
            </div>

            {/* Center: Android Phone Mockup */}
            <div className="col-span-1 lg:col-span-4 flex justify-center">
              <MobileFrame
                status={connectionStatus}
                isMobileView={true}
                onToggleViewMode={() => setIsMobileView(false)}
              >
                <VPNHome
                  status={connectionStatus}
                  onToggleConnect={handleToggleConnect}
                  selectedServer={selectedServer}
                  onOpenServerModal={() => setIsServerModalOpen(true)}
                  onOpenApkBuilder={() => setIsAndroidProjectModalOpen(true)}
                  onOpenSpeedTest={() => {
                    setIsMobileView(false);
                    setActiveTab('home');
                  }}
                  onOpenSettings={() => {
                    setIsMobileView(false);
                    setActiveTab('settings');
                  }}
                  downloadSpeed={currentDownloadSpeed}
                  uploadSpeed={currentUploadSpeed}
                  settings={securitySettings}
                  connectionDuration={sessionDuration}
                  totalDownloadedMb={totalDownloadedBytes / (1024 * 1024)}
                  totalUploadedMb={totalUploadedBytes / (1024 * 1024)}
                  showPermissionDialog={showPermissionDialog}
                  onAcceptPermission={handleAcceptPermission}
                  onDenyPermission={handleDenyPermission}
                />
              </MobileFrame>
            </div>

            {/* Right Companion Panel: Speed Test & Security Rules */}
            <div className="hidden lg:block lg:col-span-4 space-y-5">
              <SpeedLeakTester
                isConnected={connectionStatus === 'connected'}
                server={selectedServer}
              />

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Security & Protocol Engine
                  </h4>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                    {selectedServer.protocol}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Kill Switch</span>
                    <span className="text-emerald-400 font-bold">Enforced (Zero-Leak)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">DPI Obfuscation</span>
                    <span className="text-cyan-400 font-bold">Active (Reality Vision)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Encrypted DNS</span>
                    <span className="text-slate-200 font-mono">{securitySettings.customDnsIp}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsAndroidProjectModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Android APK Project (.ZIP)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Studio Multi-Panel Layouts */
          <div className="space-y-6">
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col items-center">
                  <VPNHome
                    status={connectionStatus}
                    onToggleConnect={handleToggleConnect}
                    selectedServer={selectedServer}
                    onOpenServerModal={() => setIsServerModalOpen(true)}
                    onOpenApkBuilder={() => setIsAndroidProjectModalOpen(true)}
                    onOpenSpeedTest={() => setActiveTab('home')}
                    onOpenSettings={() => setActiveTab('settings')}
                    downloadSpeed={currentDownloadSpeed}
                    uploadSpeed={currentUploadSpeed}
                    settings={securitySettings}
                    connectionDuration={sessionDuration}
                    totalDownloadedMb={totalDownloadedBytes / (1024 * 1024)}
                    totalUploadedMb={totalUploadedBytes / (1024 * 1024)}
                    showPermissionDialog={showPermissionDialog}
                    onAcceptPermission={handleAcceptPermission}
                    onDenyPermission={handleDenyPermission}
                  />
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <WorldMapVisualizer
                    servers={servers}
                    selectedServer={selectedServer}
                    isConnected={connectionStatus === 'connected'}
                    onSelectServer={(srv) => setSelectedServer(srv)}
                  />

                  <LiveTrafficView
                    isConnected={connectionStatus === 'connected'}
                    currentDownloadSpeed={currentDownloadSpeed}
                    currentUploadSpeed={currentUploadSpeed}
                    totalDownloadedBytes={totalDownloadedBytes}
                    totalUploadedBytes={totalUploadedBytes}
                    sessionStartTime={sessionStartTime}
                    history={trafficHistory}
                    server={selectedServer}
                    settings={securitySettings}
                  />
                </div>
              </div>
            )}

            {activeTab === 'servers' && (
              <ServersView
                servers={servers}
                selectedServer={selectedServer}
                onSelectServer={(srv) => setSelectedServer(srv)}
                onConnectServer={handleDirectConnect}
                onRefreshServers={fetchServersFromBackend}
                isSyncing={isSyncing}
              />
            )}

            {activeTab === 'configs' && (
              <ConfigImporterView
                onAddCustomServer={handleAddCustomServer}
                onConnectServer={handleDirectConnect}
              />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionsView
                onAddServersFromSubscription={handleAddServersFromSubscription}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanelView
                servers={servers}
                onRefreshServers={fetchServersFromBackend}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={securitySettings}
                onUpdateSettings={(newSettings) => setSecuritySettings(newSettings)}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <ServerListModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        servers={servers}
        selectedServer={selectedServer}
        onSelectServer={(server) => setSelectedServer(server)}
        onRefreshPings={handleRefreshPings}
        isPinging={isPinging}
      />

      <AndroidProjectModal
        isOpen={isAndroidProjectModalOpen}
        onClose={() => setIsAndroidProjectModalOpen(false)}
        currentServer={selectedServer}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          fetchServersFromBackend();
        }}
        onLogout={() => {
          setCurrentUser(null);
          fetchServersFromBackend();
        }}
      />
    </div>
  );
}
