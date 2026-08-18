import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { Wifi, BatteryMedium, Key, Signal, Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  status: ConnectionStatus;
  isMobileView: boolean;
  onToggleViewMode: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  status,
  isMobileView,
  onToggleViewMode,
}) => {
  const [timeStr, setTimeStr] = useState('12:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status === 'connected';

  if (!isMobileView) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Android Device Mockup Frame */}
      <div 
        id="android-phone-frame"
        className="relative w-full max-w-[395px] h-[780px] bg-slate-950 rounded-[44px] p-3.5 border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-slate-700/60 overflow-hidden flex flex-col"
      >
        {/* Dynamic Island / Android Front Camera Punch Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
          <div className="w-24 h-4.5 bg-black rounded-full border border-slate-800 flex items-center justify-center px-2 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 mr-2" />
            {isConnected && (
              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                VPN
              </span>
            )}
          </div>
        </div>

        {/* Realistic Android Status Bar */}
        <div className="w-full px-5 pt-2 pb-1 flex items-center justify-between text-slate-400 text-xs select-none z-20">
          <div className="flex items-center gap-1.5 font-bold font-mono text-white text-[11px]">
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {/* VPN Key Icon */}
            {isConnected && (
              <span className="flex items-center text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 text-[9px] font-bold" title="Android VpnService Active">
                <Key className="w-2.5 h-2.5 mr-0.5" /> VPN
              </span>
            )}
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono">98%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="flex-1 w-full overflow-y-auto scrollbar-none rounded-3xl bg-slate-950 flex flex-col">
          {children}
        </div>

        {/* Android Gesture Pill Navigation Bar */}
        <div className="w-full py-1.5 flex items-center justify-center z-20">
          <div className="w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
