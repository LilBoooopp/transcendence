import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Swords,
  type LucideIcon,
} from 'lucide-react';
import { Toast as ToastType } from './types';

const TOAST_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    accent: string;
    iconBg: string;
    border: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    border: 'border-1-emerald-400',
  },
  error: {
    icon: XCircle,
    accent: 'text-red-400',
    iconBg: 'bg-red-500/15',
    border: 'border-1-red-400',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    border: 'border-1-amber-400',
  },
  info: {
    icon: Info,
    accent: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    border: 'border-1-violet-400',
  },
};

const PROGRESS_COLORS: Record<string, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-sky-400',
  game: 'bg-violet-400',
};

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const naviage = useNavigate();
  const config = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
  const Icon = config.icon;
  const duration = toast.duration ?? 5000;

  // progress bar state
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number>();
  const pausedRef = useRef(false);
  const remainingRef = useRef(duration);

  // animate progress bar
  useEffect(() => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();

    const tick = () => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      const pct = (remaining / duration) * 100;
      setProgress(pct);

      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    startTimeRef.current = Date.now();
  };

  const handleActionClick = () => {
    if (toast.action?.route) {
      naviage(toast.action.route);
    }
    onDismiss(toast.id);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden w-80 sm:w-96 border-1-4 ${config.border} bg-background-dark/95 backdrop-blur-md rounded-lg shadow-lg shadow-black/20 transition-all duration-400 ${toast.exiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Main content */}
      <div className="flex items-start gap-3 p-4 pr-10">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full ${config.iconBg} flex items-center justify-center`}
        >
          <Icon size={18} className={config.accent} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${config.accent} mb-0 leading-tight`}>
            {toast.title}
          </p>
          <p className="text-sm text-text-default/70 mt-0.5 mb-0 leading-snug">
            {toast.message}
          </p>

          {/* optional action button */}
          {toast.action && (
            <button
              onClick={handleActionClick}
              className={`mt-2 text-xs font-medium ${config.accent} hover:underline cursor-pointer transition-colors duration-150`}
            >
              {toast.action.label} &rarr;
            </button>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-text-default/40 hoveR:text-text-default/80 hover:bg-white/10 transition-all duration-150 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* progress bar */}
      {duration > 0 && (
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={`h-full ${PROGRESS_COLORS[toast.type] ?? 'bg-sky-400'} opacity-60 transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
