'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',             label: 'Dashboard',     icon: '▣' },
  { href: '/contracts',    label: 'Contracts',     icon: '⬡' },
  { href: '/events',       label: 'Events',        icon: '⚡' },
  { href: '/transactions', label: 'Transactions',  icon: '⇄' },
  { href: '/alerts',       label: 'Alerts',        icon: '🔔' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 min-h-screen flex flex-col py-6 px-4">
      <div className="mb-8 px-2">
        <span className="text-lg font-bold tracking-tight text-white">Web3 Observer</span>
        <p className="text-xs text-gray-400 mt-0.5">On-chain monitoring</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
