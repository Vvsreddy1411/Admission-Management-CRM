import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  MapPin,
  Plus,
  Settings2,
  Trash2,
  UserRoundCog,
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/hooks/useStore";
import { KEYS } from "@/lib/store";
import { toast } from "sonner";

export default function MasterSetup() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Master Setup"
        subtitle="Configure institutions, academic structure, and admission masters"
      />

      <Tabs defaultValue="institutions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex flex-wrap h-auto">
          <TabsTrigger value="institutions">
            <Building2 className="w-4 h-4 mr-2" />
            Institutions
          </TabsTrigger>
          <TabsTrigger value="campuses">
            <MapPin className="w-4 h-4 mr-2" />
            Campuses
          </TabsTrigger>
          <TabsTrigger value="departments">
            <BookOpen className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="programs">
            <GraduationCap className="w-4 h-4 mr-2" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="years">
            <Calendar className="w-4 h-4 mr-2" />
            Academic Years
          </TabsTrigger>
          <TabsTrigger value="courseTypes">
            <Settings2 className="w-4 h-4 mr-2" />
            Course Types
          </TabsTrigger>
          <TabsTrigger value="entryTypes">
            <UserRoundCog className="w-4 h-4 mr-2" />
            Entry Types
          </TabsTrigger>
          <TabsTrigger value="admissionModes">
            <Workflow className="w-4 h-4 mr-2" />
            Admission Modes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions">
          <InstitutionTab />
        </TabsContent>
        <TabsContent value="campuses">
          <CampusTab />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentTab />
        </TabsContent>
        <TabsContent value="programs">
          <ProgramTab />
        </TabsContent>
        <TabsContent value="years">
          <AcademicYearTab />
        </TabsContent>
        <TabsContent value="courseTypes">
          <SimpleMasterTab
            title="Course Types"
            keyName={KEYS.courseTypes}
            buttonLabel="Add Course Type"
            placeholderName="UG"
            placeholderCode="UG"
          />
        </TabsContent>
        <TabsContent value="entryTypes">
          <SimpleMasterTab
            title="Entry Types"
            keyName={KEYS.entryTypes}
            buttonLabel="Add Entry Type"
            placeholderName="Regular"
            placeholderCode="Regular"
          />
        </TabsContent>
        <TabsContent value="admissionModes">
          <SimpleMasterTab
            title="Admission Modes"
            keyName={KEYS.admissionModes}
            buttonLabel="Add Admission Mode"
            placeholderName="Government"
            placeholderCode="Government"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InstitutionTab() {
  const { items, addItem, removeItem } = useStore(KEYS.institutions);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Institution name and code are required");
      return;
    }

    await addItem({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
    });

    setName("");
    setCode("");
    setOpen(false);
    toast.success("Institution created");
  };

  return (
    <SetupSection
      title="Institutions"
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Institution removed");
      }}
      renderItem={(item) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">Code: {item.code}</p>
        </div>
      )}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Institution</DialogTitle>
              <DialogDescription>
                Add the top-level institution for admissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., BRS Institute"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="e.g., BRSIT"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function CampusTab() {
  const { items: institutions } = useStore(KEYS.institutions);
  const { items, addItem, removeItem } = useStore(KEYS.campuses);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const handleAdd = async () => {
    if (!institutionId || !name.trim() || !location.trim()) {
      toast.error("Institution, campus name, and location are required");
      return;
    }

    await addItem({
      institutionId,
      name: name.trim(),
      location: location.trim(),
    });

    setName("");
    setLocation("");
    setInstitutionId("");
    setOpen(false);
    toast.success("Campus created");
  };

  return (
    <SetupSection
      title="Campuses"
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Campus removed");
      }}
      renderItem={(item) => {
        const institution = institutions.find(
          (entry) => entry.id === item.institutionId,
        );

        return (
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.location} • {institution?.name || "Unknown institution"}
            </p>
          </div>
        );
      }}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Campus
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Campus</DialogTitle>
              <DialogDescription>
                Create a campus and link it to an institution.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Institution</Label>
                <Select value={institutionId} onValueChange={setInstitutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Main Campus"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Bengaluru"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function DepartmentTab() {
  const { items: campuses } = useStore(KEYS.campuses);
  const { items, addItem, removeItem } = useStore(KEYS.departments);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [campusId, setCampusId] = useState("");

  const handleAdd = async () => {
    if (!campusId || !name.trim() || !code.trim()) {
      toast.error("Campus, department name, and code are required");
      return;
    }

    await addItem({
      campusId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
    });

    setName("");
    setCode("");
    setCampusId("");
    setOpen(false);
    toast.success("Department created");
  };

  return (
    <SetupSection
      title="Departments"
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Department removed");
      }}
      renderItem={(item) => {
        const campus = campuses.find((entry) => entry.id === item.campusId);

        return (
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              Code: {item.code} • {campus?.name || "Unknown campus"}
            </p>
          </div>
        );
      }}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Department</DialogTitle>
              <DialogDescription>
                Create a department and link it to a campus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Campus</Label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="CSE"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function ProgramTab() {
  const { items: departments } = useStore(KEYS.departments);
  const { items: courseTypes } = useStore(KEYS.courseTypes);
  const { items, addItem, removeItem } = useStore(KEYS.programs);
  const defaultCourseType = courseTypes[0]?.code || "UG";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [courseType, setCourseType] = useState(defaultCourseType);
  const [intake, setIntake] = useState("");
  const [supernumerarySeats, setSupernumerarySeats] = useState("0");

  const handleAdd = async () => {
    if (!departmentId || !name.trim() || !code.trim() || !intake) {
      toast.error("Department, program name, code, and intake are required");
      return;
    }

    await addItem({
      departmentId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      courseType,
      totalIntake: Number.parseInt(intake, 10),
      supernumerarySeats: Number.parseInt(supernumerarySeats || "0", 10),
    });

    setName("");
    setCode("");
    setDepartmentId("");
    setCourseType(defaultCourseType);
    setIntake("");
    setSupernumerarySeats("0");
    setOpen(false);
    toast.success("Program created");
  };

  return (
    <SetupSection
      title="Programs"
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Program removed");
      }}
      renderItem={(item) => {
        const department = departments.find(
          (entry) => entry.id === item.departmentId,
        );

        return (
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.courseType} • Intake: {item.totalIntake} •{" "}
              {department?.name || "Unknown department"}
            </p>
          </div>
        );
      }}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Program</DialogTitle>
              <DialogDescription>
                Create a program, set intake, and choose the course type.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="CSE"
                />
              </div>
              <div>
                <Label>Course Type</Label>
                <Select value={courseType} onValueChange={setCourseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseTypes.map((item) => (
                      <SelectItem key={item.id} value={item.code}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Intake</Label>
                <Input
                  type="number"
                  value={intake}
                  onChange={(event) => setIntake(event.target.value)}
                  placeholder="120"
                />
              </div>
              <div>
                <Label>Supernumerary Seats</Label>
                <Input
                  type="number"
                  value={supernumerarySeats}
                  onChange={(event) => setSupernumerarySeats(event.target.value)}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function AcademicYearTab() {
  const { items, addItem, removeItem } = useStore(KEYS.academicYears);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");

  const handleAdd = async () => {
    if (!year.trim()) {
      toast.error("Academic year is required");
      return;
    }

    await addItem({
      year: year.trim(),
      isCurrent: items.length === 0,
    });

    setYear("");
    setOpen(false);
    toast.success("Academic year created");
  };

  return (
    <SetupSection
      title="Academic Years"
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Academic year removed");
      }}
      renderItem={(item) => (
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{item.year}</p>
          {item.isCurrent && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </div>
      )}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Academic Year</DialogTitle>
              <DialogDescription>
                Add the academic year used for current admissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Year</Label>
                <Input
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  placeholder="2026"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function SimpleMasterTab({
  title,
  keyName,
  buttonLabel,
  placeholderName,
  placeholderCode,
}) {
  const { items, addItem, removeItem } = useStore(keyName);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    await addItem({
      name: name.trim(),
      code: code.trim(),
    });

    setName("");
    setCode("");
    setOpen(false);
    toast.success(`${title.slice(0, -1)} created`);
  };

  return (
    <SetupSection
      title={title}
      items={items}
      onDelete={async (id) => {
        await removeItem(id);
        toast.success("Item removed");
      }}
      renderItem={(item) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">Code: {item.code}</p>
        </div>
      )}
      dialog={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {buttonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{buttonLabel}</DialogTitle>
              <DialogDescription>
                Add a new option to this master list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={placeholderName}
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={placeholderCode}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    />
  );
}

function SetupSection({ title, items, onDelete, renderItem, dialog }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display text-foreground">
          {title} ({items.length})
        </h3>
        {dialog}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.03 }}
              className="glass-card p-4 flex items-center justify-between group"
            >
              {renderItem(item)}
              <button
                onClick={async () => {
                  await onDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {title.toLowerCase()} yet. Add one to continue setup.</p>
        </div>
      )}
    </div>
  );
}
