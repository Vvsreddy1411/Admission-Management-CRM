import { motion } from "framer-motion";
export function PageHeader({ title, subtitle, action }) {
    return (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="page-header flex items-center justify-between">
      <div>
        <h1 className="page-title text-foreground">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>);
}
