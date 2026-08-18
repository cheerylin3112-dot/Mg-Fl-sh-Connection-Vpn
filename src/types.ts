export type ConnectionStatus = 
  | 'disconnected' 
  | 'preparing_permission' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnecting' 
  | 'error';

export type ProtocolType = 
  | 'vless'
  | 'vmess'
  | 'trojan'
  | 'shadowsocks'
  | 'socks5'
  | 'http-proxy'
  | 'https-proxy'
  | 'ssh'
  | 'wireguard'
  | 'openvpn-udp'
  | 'openvpn-tcp'
  | 'slowdns'
  | 'netmod'
  | 'http-custom'
  | 'http-injector'
  | 'v2ray-json';

export type TransportType = 'tcp' | 'ws' | 'grpc' | 'kcp' | 'quic' | 'http';
export type TlsType = 'none' | 'tls' | 'reality';
export type UserRole = 'admin' | 'user';
export type UserTier = 'free_tier' | 'vip_tier' | 'pro_tier' | 'enterprise';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  createdAt: string;
  token?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  tier: UserTier;
  maxBandwidthGb: number;
  serverCount: number;
}

export interface VPNServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  country: string;
  countryCode: string; // ISO 2-letter
  city: string;
  flag: string;
  virtualIp: string;
  ping: number; // in ms
  load: number; // percentage 0-100
  tier: 'free' | 'pro' | 'vip' | 'ultra';
  allowedGroups: string[]; // ['all'] or specific group IDs
  enabled: boolean;
  online: boolean;
  transport: TransportType;
  tlsType: TlsType;
  tags: ('fastest' | 'streaming' | 'p2p' | 'gaming' | 'tor' | 'anti_dpi' | 'zero_rate')[];
  
  // Protocol specific credentials
  uuid?: string;
  password?: string;
  alterId?: number;
  security?: string; // e.g. 'auto', 'aes-128-gcm'
  flow?: string; // e.g. 'xtls-rprx-vision'
  
  // TLS / Reality credentials
  sni?: string;
  publicKey?: string; // Reality PBK
  shortId?: string; // Reality SID
  fingerprint?: string; // e.g. 'chrome', 'firefox'
  path?: string; // WebSocket / gRPC path
  serviceName?: string; // gRPC service name
  
  // SSH / Injector specific
  sshUsername?: string;
  sshPassword?: string;
  sshPayload?: string;
  sshSniBugHost?: string;
  sshPort?: number;
  v2rayPort?: number;
  
  // Shadowsocks specific
  ssMethod?: string;
  ssPassword?: string;
  
  // DNS Settings
  dnsResolver?: string;
  dnsDomain?: string; // For SlowDNS / DNS tunnel
  dnsPublicKey?: string;
  
  provider: string;
  bandwidthGbps: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSource {
  id: string;
  name: string;
  token: string;
  description: string;
  allowedTier: UserTier | 'all';
  serverIds: string[];
  enabled: boolean;
  expireDate: string;
  totalTrafficGb: number;
  usedTrafficGb: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedConfig {
  valid: boolean;
  protocol: ProtocolType;
  rawInput: string;
  name: string;
  server: string;
  port: number;
  uuid?: string;
  password?: string;
  transport: TransportType;
  tlsType: TlsType;
  sni?: string;
  path?: string;
  serviceName?: string;
  publicKey?: string;
  shortId?: string;
  flow?: string;
  ssMethod?: string;
  sshPayload?: string;
  dnsResolver?: string;
  error?: string;
}

export interface TrafficPoint {
  time: string;
  timestamp: number;
  download: number; // in KB/s
  upload: number; // in KB/s
}

export interface SecuritySettings {
  protocol: ProtocolType;
  killSwitch: boolean;
  autoConnect: boolean;
  cyberSec: boolean;
  dnsProtection: boolean;
  dnsProvider: 'cloudflare' | 'google' | 'adguard' | 'quad9' | 'custom';
  customDnsIp: string;
  splitTunneling: boolean;
  splitTunnelMode: 'bypass' | 'only';
  splitApps: { id: string; name: string; package?: string; category?: string; bypassed?: boolean; icon: string; selected?: boolean }[];
  obfuscation: boolean;
  mtuSize: number;
  lanBypass: boolean;
  ipv6LeakProtection: boolean;
  
  v2ray?: {
    uuid: string;
    alterId: number;
    security: string;
    network: string;
    path: string;
    sni: string;
    tls: string;
    port: number;
  };
  
  ssh?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    sniBugHost?: string;
    payload?: string;
    sshMode?: string;
  };
}

export interface SpeedTestResult {
  status: 'idle' | 'pinging' | 'downloading' | 'uploading' | 'complete';
  progress: number;
  ping: number;
  jitter: number;
  downloadMbps: number;
  uploadMbps: number;
}

export interface LeakTestState {
  testing: boolean;
  testedAt: number | null;
  publicIp: string;
  realIpMasked: boolean;
  isp: string;
  location: string;
  dnsLeak: boolean;
  dnsServersFound: string[];
  webrtcLeak: boolean;
  ipv6Leak: boolean;
}

export interface AndroidApkConfig {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  defaultServerId: string;
  enableAlwaysOn: boolean;
  enableKillSwitch: boolean;
  enableAdBlock: boolean;
  protocol: ProtocolType;
  dnsResolver: string;
  customRoutes: string;
  allowBypass: boolean;
  backendSyncUrl: string;
}
