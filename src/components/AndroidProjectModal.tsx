import React, { useState } from 'react';
import { VPNServer, AndroidApkConfig } from '../types';
import { generateAndroidProjectFiles, downloadAndroidProjectZip } from '../utils/androidSourceGen';
import { 
  FolderTree, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  X, 
  Smartphone, 
  Code2, 
  ShieldCheck, 
  Layers, 
  Terminal,
  ExternalLink
} from 'lucide-react';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServer: VPNServer;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
  currentServer,
}) => {
  const [apkConfig, setApkConfig] = useState<AndroidApkConfig>({
    packageName: 'com.mgflash.vpn.app',
    appName: 'Mg Flâsh Connection',
    versionName: '2.4.0',
    versionCode: 24,
    defaultServerId: currentServer.id,
    enableAlwaysOn: true,
    enableKillSwitch: true,
    enableAdBlock: true,
    protocol: currentServer.protocol,
    dnsResolver: '1.1.1.1',
    customRoutes: '0.0.0.0/0',
    allowBypass: false,
    backendSyncUrl: `${window.location.origin}/api/servers/sync`,
  });

  const [selectedFile, setSelectedFile] = useState<string>('app/src/main/java/com/mgflash/vpn/service/MgFlashVpnService.kt');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const projectFiles = generateAndroidProjectFiles(apkConfig, currentServer);
  const activeContent = projectFiles[selectedFile as keyof typeof projectFiles] || '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await downloadAndroidProjectZip(apkConfig, currentServer);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Native Android VPN Client Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Kotlin + Xray/SSH JNI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Production-grade Android Studio project source with backend server synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Packaging ZIP...' : 'Download Android Project (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar File Explorer + Code Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-800 bg-slate-950/60 p-3 overflow-y-auto space-y-1 text-xs font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
              Project Architecture
            </div>

            {Object.keys(projectFiles).map((filePath) => {
              const isSelected = selectedFile === filePath;
              const fileName = filePath.split('/').pop() || filePath;
              return (
                <button
                  key={filePath}
                  onClick={() => setSelectedFile(filePath)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors truncate ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={filePath}
                >
                  <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                  <span className="truncate">{fileName}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
              <span className="font-mono text-cyan-300 text-[11px] truncate">{selectedFile}</span>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              <code>{activeContent}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
