import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/hooks/useStore";
import { KEYS } from "@/lib/store";
import { Plus, Trash2, Building2, MapPin, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { toast } from "sonner";
export default function MasterSetup() {
    return (<div className="animate-fade-in">
      <PageHeader title="Master Setup" subtitle="Configure institutions, campuses, departments, and programs"/>
      <Tabs defaultValue="institutions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="institutions" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2"/> Institutions
          </TabsTrigger>
          <TabsTrigger value="campuses" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <MapPin className="w-4 h-4 mr-2"/> Campuses
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2"/> Departments
          </TabsTrigger>
          <TabsTrigger value="programs" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <GraduationCap className="w-4 h-4 mr-2"/> Programs
          </TabsTrigger>
          <TabsTrigger value="years" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4 mr-2"/> Academic Years
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions"><InstitutionTab /></TabsContent>
        <TabsContent value="campuses"><CampusTab /></TabsContent>
        <TabsContent value="departments"><DepartmentTab /></TabsContent>
        <TabsContent value="programs"><ProgramTab /></TabsContent>
        <TabsContent value="years"><AcademicYearTab /></TabsContent>
      </Tabs>
    </div>);
}
function InstitutionTab() {
    const { items, addItem, removeItem } = useStore(KEYS.institutions);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const handleAdd = async () => {
        if (!name || !code) {
            toast.error("Fill all fields");
            return;
        }
        await addItem({ name, code, createdAt: new Date().toISOString() });
        setName("");
        setCode("");
        setOpen(false);
        toast.success("Institution created");
    };
    return (<SetupSection title="Institutions" items={items} onDelete={async (id) => { await removeItem(id); toast.success("Deleted"); }} renderItem={(item) => (<div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">Code: {item.code}</p>
        </div>)} dialog={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Institution</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Institution</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., BRS Institute"/></div>
              <div><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g., BRSIT"/></div>
              <Button onClick={handleAdd} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>}/>);
}
function CampusTab() {
    const { items: institutions } = useStore(KEYS.institutions);
    const { items, addItem, removeItem } = useStore(KEYS.campuses);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [instId, setInstId] = useState("");
    const handleAdd = async () => {
        if (!name || !location || !instId) {
            toast.error("Fill all fields");
            return;
        }
        await addItem({ name, location, institutionId: instId });
        setName("");
        setLocation("");
        setInstId("");
        setOpen(false);
        toast.success("Campus created");
    };
    return (<SetupSection title="Campuses" items={items} onDelete={async (id) => { await removeItem(id); toast.success("Deleted"); }} renderItem={(item) => {
            const inst = institutions.find(i => i.id === item.institutionId);
            return (<div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.location} • {inst?.name || 'Unknown'}</p>
          </div>);
        }} dialog={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Campus</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Campus</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Institution</Label>
                <Select value={instId} onValueChange={setInstId}>
                  <SelectTrigger><SelectValue placeholder="Select institution"/></SelectTrigger>
                  <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Main Campus"/></div>
              <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bangalore"/></div>
              <Button onClick={handleAdd} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>}/>);
}
function DepartmentTab() {
    const { items: campuses } = useStore(KEYS.campuses);
    const { items, addItem, removeItem } = useStore(KEYS.departments);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [campusId, setCampusId] = useState("");
    const handleAdd = async () => {
        if (!name || !code || !campusId) {
            toast.error("Fill all fields");
            return;
        }
        await addItem({ name, code, campusId });
        setName("");
        setCode("");
        setCampusId("");
        setOpen(false);
        toast.success("Department created");
    };
    return (<SetupSection title="Departments" items={items} onDelete={async (id) => { await removeItem(id); toast.success("Deleted"); }} renderItem={(item) => {
            const campus = campuses.find(c => c.id === item.campusId);
            return (<div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">Code: {item.code} • {campus?.name || 'Unknown'}</p>
          </div>);
        }} dialog={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Department</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Campus</Label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger><SelectValue placeholder="Select campus"/></SelectTrigger>
                  <SelectContent>{campuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Computer Science"/></div>
              <div><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="CSE"/></div>
              <Button onClick={handleAdd} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>}/>);
}
function ProgramTab() {
    const { items: departments } = useStore(KEYS.departments);
    const { items, addItem, removeItem } = useStore(KEYS.programs);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [deptId, setDeptId] = useState("");
    const [courseType, setCourseType] = useState('UG');
    const [intake, setIntake] = useState("");
    const handleAdd = async () => {
        if (!name || !code || !deptId || !intake) {
            toast.error("Fill all fields");
            return;
        }
        await addItem({ name, code, departmentId: deptId, courseType, totalIntake: parseInt(intake), supernumerarySeats: 0 });
        setName("");
        setCode("");
        setDeptId("");
        setIntake("");
        setOpen(false);
        toast.success("Program created");
    };
    return (<SetupSection title="Programs" items={items} onDelete={async (id) => { await removeItem(id); toast.success("Deleted"); }} renderItem={(item) => {
            const dept = departments.find(d => d.id === item.departmentId);
            return (<div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.courseType} • Intake: {item.totalIntake} • {dept?.name || 'Unknown'}</p>
          </div>);
        }} dialog={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Program</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Program</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Department</Label>
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger><SelectValue placeholder="Select department"/></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="B.Tech Computer Science"/></div>
              <div><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="CSE"/></div>
              <div><Label>Course Type</Label>
                <Select value={courseType} onValueChange={(v) => setCourseType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UG">UG</SelectItem>
                    <SelectItem value="PG">PG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Total Intake</Label><Input type="number" value={intake} onChange={e => setIntake(e.target.value)} placeholder="120"/></div>
              <Button onClick={handleAdd} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>}/>);
}
function AcademicYearTab() {
    const { items, addItem, removeItem } = useStore(KEYS.academicYears);
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState("");
    const handleAdd = async () => {
        if (!year) {
            toast.error("Enter year");
            return;
        }
        await addItem({ year, isCurrent: items.length === 0 });
        setYear("");
        setOpen(false);
        toast.success("Academic year created");
    };
    return (<SetupSection title="Academic Years" items={items} onDelete={async (id) => { await removeItem(id); toast.success("Deleted"); }} renderItem={(item) => (<div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{item.year}</p>
          {item.isCurrent && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Current</span>}
        </div>)} dialog={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Year</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Academic Year</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Year</Label><Input value={year} onChange={e => setYear(e.target.value)} placeholder="2026"/></div>
              <Button onClick={handleAdd} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>}/>);
}
function SetupSection({ title, items, onDelete, renderItem, dialog }) {
    return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display text-foreground">{title} ({items.length})</h3>
        {dialog}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {items.map((item, i) => (<motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="glass-card p-4 flex items-center justify-between group">
              {renderItem(item)}
              <button onClick={async () => { await onDelete(item.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash2 className="w-4 h-4"/>
              </button>
            </motion.div>))}
        </AnimatePresence>
      </div>
      {items.length === 0 && (<div className="text-center py-12 text-muted-foreground">
          <p>No {title.toLowerCase()} yet. Click the button above to add one.</p>
        </div>)}
    </div>);
}
