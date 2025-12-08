import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="gradient-primary rounded-xl p-6 text-primary-foreground relative overflow-hidden group hover:shadow-glow transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 opacity-90" />
          <p className="text-sm font-medium opacity-90">{label}</p>
        </div>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
