'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  CalendarDays,
  FileText,
  School,
  BookOpen,
  CreditCard,
  Bus,
  Library,
  BellRing,
  MessageSquare,
  BarChart3,
  Settings,
  Database,
  History,
  Menu,
  Bell,
  LogOut,
  ChevronRight,
  Lock,
  Loader2,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import AWSLogo from './AWSLogo';

// Custom Simple Toast Notification for interactions
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-bounce ${
      type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
      type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
      'bg-blue-50 border-blue-100 text-blue-800'
    }`}>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
    </div>
  );
}

// Sidebar links and permission config
interface SidebarLink {
  name: string;
  icon: any;
  href: string;
  roles: ('ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'STAFF')[];
  badge?: string;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Students', icon: Users, href: '/dashboard/students', roles: ['ADMIN', 'TEACHER'] },
  { name: 'Parents', icon: Users, href: '#', roles: ['ADMIN'], badge: 'Soon' },
  { name: 'Staff', icon: Contact, href: '/dashboard/staff-records', roles: ['ADMIN'] },
  { name: 'Attendance', icon: CalendarDays, href: '/dashboard/attendance', roles: ['ADMIN', 'TEACHER'] },
  { name: 'Examinations', icon: FileText, href: '#', roles: ['ADMIN'], badge: 'Soon' },
  { name: 'Classes', icon: School, href: '#', roles: ['ADMIN'], badge: '42' },
  { name: 'Subjects', icon: BookOpen, href: '#', roles: ['ADMIN'] },
  { name: 'Fees', icon: CreditCard, href: '/dashboard/fees', roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Transport', icon: Bus, href: '#', roles: ['ADMIN'] },
  { name: 'Library', icon: Library, href: '#', roles: ['ADMIN'] },
  { name: 'Notice Board', icon: BellRing, href: '/dashboard/notices', roles: ['ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Messages', icon: MessageSquare, href: '#', roles: ['ADMIN'], badge: 'New' },
  { name: 'Reports', icon: BarChart3, href: '/dashboard/reports', roles: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['ADMIN'] },
  { name: 'Backup', icon: Database, href: '#', roles: ['ADMIN'] },
  { name: 'System Logs', icon: History, href: '/dashboard/logs', roles: ['ADMIN'] }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setNotifDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-slate-600 font-semibold text-sm">Validating credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Let middleware handle redirection
  }

  // Handle unauthorized navigation gracefully
  const handleNavClick = (link: SidebarLink, e: React.MouseEvent) => {
    if (link.href === '#') {
      e.preventDefault();
      setToast({ message: `"${link.name}" module is coming soon!`, type: 'info' });
      return;
    }

    const hasAccess = link.roles.includes(user.role);
    if (!hasAccess) {
      e.preventDefault();
      setToast({ message: `Access Denied: ${link.name} requires ${link.roles.join('/')} privileges.`, type: 'error' });
      return;
    }
    setMobileOpen(false);
  };

  const getDashboardHomePath = () => {
    return `/dashboard/${user.role.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 shrink-0 justify-between">
          <Link href={getDashboardHomePath()} className="flex items-center gap-2.5 overflow-hidden">
            <AWSLogo size={sidebarCollapsed ? "xs" : "sm"} className="shadow-md" />
            {!sidebarCollapsed && (
              <span className="font-extrabold text-primary-500 text-xs tracking-tight truncate uppercase">
                Angels World School
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {!sidebarCollapsed ? 'Main Sections' : '•'}
          </div>
          {SIDEBAR_LINKS.map((link) => {
            const hasAccess = link.roles.includes(user.role);
            const targetHref = link.href === '/dashboard' ? getDashboardHomePath() : link.href;
            const isActive = pathname === targetHref || (targetHref !== '/dashboard' && pathname.startsWith(targetHref));
            const LinkIcon = link.icon;

            return (
              <Link
                key={link.name}
                href={hasAccess ? targetHref : '#'}
                onClick={(e) => handleNavClick(link, e)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : hasAccess
                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`shrink-0 transition-colors ${
                    isActive ? 'text-primary-600' : hasAccess ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-300'
                  }`}>
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  {!sidebarCollapsed && <span className="truncate">{link.name}</span>}
                </div>

                {!sidebarCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!hasAccess && <Lock className="h-3 w-3 text-slate-300" />}
                    {link.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                        link.badge === 'New' ? 'bg-red-100 text-red-700' :
                        link.badge === 'Soon' ? 'bg-slate-100 text-slate-500' :
                        'bg-primary-100 text-primary-700'
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-md">
                    {link.name} {!hasAccess && '🔒'}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* --- MOBILE DRAWER SIDEBAR --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-xs">
          <div className="w-64 bg-white h-full flex flex-col shadow-2xl animate-slide-in p-3">
            <div className="flex items-center justify-between px-2 py-3 border-b border-slate-100 mb-4 shrink-0">
              <span className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <AWSLogo size="sm" className="shadow-xs" />
                <span className="text-primary-500 font-extrabold text-xs uppercase tracking-tight">Angels World School</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <nav className="flex-1 overflow-y-auto space-y-1">
              {SIDEBAR_LINKS.map((link) => {
                const hasAccess = link.roles.includes(user.role);
                const targetHref = link.href === '/dashboard' ? getDashboardHomePath() : link.href;
                const isActive = pathname === targetHref || (targetHref !== '/dashboard' && pathname.startsWith(targetHref));
                const LinkIcon = link.icon;

                return (
                  <Link
                    key={link.name}
                    href={hasAccess ? targetHref : '#'}
                    onClick={(e) => handleNavClick(link, e)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-bold'
                        : hasAccess
                        ? 'text-slate-600 hover:bg-slate-50'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!hasAccess && <Lock className="h-3 w-3 text-slate-300" />}
                      {link.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                          {link.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}

      {/* --- MAIN PAGE AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle for desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Sidebar toggle for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="ml-2">
              <span className="font-semibold text-slate-700 text-sm md:text-base hidden sm:inline-block">
                AWS ERP System
              </span>
              <span className="text-xs text-slate-400 ml-2 hidden lg:inline-block">
                Session: 2026-2027
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Session Switcher Info */}
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-full px-3 py-1 text-xs gap-1.5 text-slate-500 select-none">
              <Sparkles className="h-3 w-3 text-primary-500 animate-pulse" />
              Role: <span className="font-bold text-primary-600">{user.role}</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer relative transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Recent Notices</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">4 Active</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <h4 className="text-xs font-bold text-slate-800">Annual Day Celebration</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">Annual Day will be celebrated on 20th July 2026...</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">May 20, 2026</span>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <h4 className="text-xs font-bold text-slate-800">Parent-Teacher Meeting</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">PTM is scheduled on 25th May 2026...</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">May 18, 2026</span>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <h4 className="text-xs font-bold text-slate-800">Summer Vacation</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">School will remain closed from 1st June to 30th June...</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">May 15, 2026</span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 text-center border-t border-slate-100 mt-1">
                    <Link href="/dashboard/notices" onClick={() => setNotifDropdownOpen(false)} className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">
                      View all notices
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
              >
                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-primary-600 border border-slate-200">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div className="text-left hidden sm:block pr-2">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[9px] text-slate-500 leading-none capitalize">{user.role.toLowerCase()}</div>
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                  </div>
                  
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left border-t border-slate-100 cursor-pointer transition-colors mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
