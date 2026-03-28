import { motion } from "framer-motion";
const variantStyles = {
    default: 'border-border',
    primary: 'border-l-4 border-l-primary border-border',
    accent: 'border-l-4 border-l-accent border-border',
    warning: 'border-l-4 border-l-warning border-border',
    destructive: 'border-l-4 border-l-destructive border-border',
};
const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
};
export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={`stat-card ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display mt-2 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5"/>
        </div>
      </div>
    </motion.div>);
}
