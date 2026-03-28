import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Shield, Users, Eye } from "lucide-react";
const roles = [
    { role: 'Admin', label: 'Admin', description: 'Full access: setup masters, configure quotas, manage all', icon: Shield },
    { role: 'Admission Officer', label: 'Admission Officer', description: 'Create applicants, allocate seats, verify docs, confirm admissions', icon: Users },
    { role: 'Management', label: 'Management', description: 'View-only access to dashboards and reports', icon: Eye },
];
export default function LoginPage() {
    const { login } = useAuth();
    const [name, setName] = useState("");
    const [selectedRole, setSelectedRole] = useState('Admin');
    const handleLogin = () => {
        if (!name.trim())
            return;
        login(selectedRole, name.trim());
    };
    return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground"/>
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">AdmitFlow</h1>
          <p className="text-muted-foreground mt-2">Admission Management System</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div>
            <Label>Your Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" onKeyDown={e => e.key === 'Enter' && handleLogin()}/>
          </div>

          <div>
            <Label className="mb-3 block">Select Role</Label>
            <div className="space-y-3">
              {roles.map(r => (<motion.button key={r.role} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSelectedRole(r.role)} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${selectedRole === r.role
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === r.role ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <r.icon className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </div>
                </motion.button>))}
            </div>
          </div>

          <Button onClick={handleLogin} className="w-full" size="lg" disabled={!name.trim()}>
            Sign In as {selectedRole}
          </Button>
        </div>
      </motion.div>
    </div>);
}
