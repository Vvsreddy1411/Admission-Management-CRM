const API_BASE = "";

async function request(path, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Request failed");
    }

    return res.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timeout for ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Store keys
export const KEYS = {
  institutions: "adm_institutions",
  campuses: "adm_campuses",
  departments: "adm_departments",
  programs: "adm_programs",
  academicYears: "adm_academic_years",
  quotas: "adm_quotas",
  applicants: "adm_applicants",
  institutionCaps: "adm_institution_caps",
  userSession: "adm_user_session",
};

// Generic CRUD (Mongo-backed)
export async function getAll(key) {
  return request(`/api/${key}`);
}

export async function add(key, item) {
  return request(`/api/${key}`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function update(key, id, updates) {
  return request(`/api/${key}/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function remove(key, id) {
  await request(`/api/${key}/${id}`, { method: "DELETE" });
}

// User session management
export async function getUserSession() {
  return request("/api/user-session");
}

export async function setUserSession(session) {
  return request("/api/user-session", {
    method: "POST",
    body: JSON.stringify(session),
  });
}

export async function clearUserSession() {
  await request("/api/user-session", { method: "DELETE" });
}

// Role-based permission checks
export function canManageMasters(role) {
  return role === "Admin";
}

export function canManageApplicants(role) {
  return role === "Admin" || role === "Admission Officer";
}

export function canAllocateSeats(role) {
  return role === "Admin" || role === "Admission Officer";
}

export function canViewOnly(role) {
  return role === "Management";
}

// Admission number generation
export async function generateAdmissionNumber(instCode, year, courseType, programCode, quotaType) {
  const applicants = await getAll(KEYS.applicants);
  const prefix = `${instCode}/${year}/${courseType}/${programCode}/${quotaType}`;
  const existing = applicants.filter((a) => a.admissionNumber?.startsWith(prefix));
  const seq = String(existing.length + 1).padStart(4, "0");
  return `${prefix}/${seq}`;
}

// Check quota availability
export async function checkQuotaAvailability(programId, quotaType) {
  const quotas = await getAll(KEYS.quotas);
  const quota = quotas.find((q) => q.programId === programId && q.type === quotaType);
  if (!quota) return { available: false, remaining: 0 };
  const remaining = quota.totalSeats - quota.filledSeats;
  return { available: remaining > 0, remaining };
}

// Check institution cap availability
export async function checkInstitutionCapAvailability(capId) {
  const caps = await getAll(KEYS.institutionCaps);
  const cap = caps.find((c) => c.id === capId);
  if (!cap) return { available: false, remaining: 0 };
  const remaining = cap.maxSeats - cap.filledSeats;
  return { available: remaining > 0, remaining };
}

// Allocate seat
export async function allocateSeat(programId, quotaType, institutionCapId) {
  const quotas = await getAll(KEYS.quotas);
  const idx = quotas.findIndex((q) => q.programId === programId && q.type === quotaType);
  if (idx === -1) return false;
  if (quotas[idx].filledSeats >= quotas[idx].totalSeats) return false;

  if (institutionCapId) {
    const caps = await getAll(KEYS.institutionCaps);
    const capIdx = caps.findIndex((c) => c.id === institutionCapId);
    if (capIdx === -1) return false;
    if (caps[capIdx].filledSeats >= caps[capIdx].maxSeats) return false;
    await update(KEYS.institutionCaps, caps[capIdx].id, {
      filledSeats: caps[capIdx].filledSeats + 1,
    });
  }

  await update(KEYS.quotas, quotas[idx].id, {
    filledSeats: quotas[idx].filledSeats + 1,
  });

  return true;
}

// Seed demo data
export async function seedDemoData() {
  let institutions = await getAll(KEYS.institutions);
  let campuses = await getAll(KEYS.campuses);
  let departments = await getAll(KEYS.departments);
  let programs = await getAll(KEYS.programs);
  let years = await getAll(KEYS.academicYears);
  let quotas = await getAll(KEYS.quotas);
  let caps = await getAll(KEYS.institutionCaps);
  const applicants = await getAll(KEYS.applicants);

  if (institutions.length === 0) {
    const createdInstitution = await add(KEYS.institutions, {
      name: "BRS Institute of Technology",
      code: "BRSIT",
      createdAt: new Date().toISOString(),
    });
    institutions = [createdInstitution];
  }

  const primaryInstitution = institutions[0];

  if (campuses.length === 0) {
    const createdCampus = await add(KEYS.campuses, {
      institutionId: primaryInstitution.id,
      name: "Main Campus",
      location: "Bangalore",
    });
    campuses = [createdCampus];
  }

  const primaryCampus = campuses[0];

  if (departments.length === 0) {
    const createdDepartments = [];
    createdDepartments.push(
      await add(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Computer Science",
        code: "CSE",
      }),
    );
    createdDepartments.push(
      await add(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Electronics & Communication",
        code: "ECE",
      }),
    );
    createdDepartments.push(
      await add(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Business Administration",
        code: "MBA",
      }),
    );
    departments = createdDepartments;
  }

  if (programs.length === 0) {
    const cse = departments.find((dept) => dept.code === "CSE") || departments[0];
    const ece = departments.find((dept) => dept.code === "ECE") || departments[0];
    const mba = departments.find((dept) => dept.code === "MBA") || departments[0];

    const createdPrograms = [];
    createdPrograms.push(
      await add(KEYS.programs, {
        departmentId: cse.id,
        name: "B.Tech Computer Science",
        code: "CSE",
        courseType: "UG",
        totalIntake: 120,
        supernumerarySeats: 5,
      }),
    );
    createdPrograms.push(
      await add(KEYS.programs, {
        departmentId: ece.id,
        name: "B.Tech Electronics & Communication",
        code: "ECE",
        courseType: "UG",
        totalIntake: 60,
        supernumerarySeats: 3,
      }),
    );
    createdPrograms.push(
      await add(KEYS.programs, {
        departmentId: mba.id,
        name: "MBA",
        code: "MBA",
        courseType: "PG",
        totalIntake: 60,
        supernumerarySeats: 2,
      }),
    );
    programs = createdPrograms;
  }

  if (years.length === 0) {
    await add(KEYS.academicYears, { year: "2025", isCurrent: false });
    await add(KEYS.academicYears, { year: "2026", isCurrent: true });
    years = await getAll(KEYS.academicYears);
  } else if (!years.some((year) => year.isCurrent)) {
    await update(KEYS.academicYears, years[0].id, { isCurrent: true });
  }

  if (quotas.length === 0) {
    const quotaTemplateByProgram = {
      CSE: { KCET: 60, COMEDK: 30, Management: 30, Supernumerary: 5 },
      ECE: { KCET: 30, COMEDK: 15, Management: 15, Supernumerary: 3 },
      MBA: { KCET: 25, COMEDK: 10, Management: 25, Supernumerary: 2 },
    };

    for (const program of programs) {
      const template = quotaTemplateByProgram[program.code] || {
        KCET: Math.floor(program.totalIntake * 0.5),
        COMEDK: Math.floor(program.totalIntake * 0.25),
        Management: program.totalIntake - Math.floor(program.totalIntake * 0.75),
        Supernumerary: program.supernumerarySeats || 0,
      };
      for (const [type, totalSeats] of Object.entries(template)) {
        await add(KEYS.quotas, {
          programId: program.id,
          type,
          totalSeats,
          filledSeats: 0,
        });
      }
    }
    quotas = await getAll(KEYS.quotas);
  }

  if (caps.length === 0) {
    await add(KEYS.institutionCaps, {
      institutionId: primaryInstitution.id,
      name: "J&K Quota",
      maxSeats: 10,
      filledSeats: 0,
    });
    await add(KEYS.institutionCaps, {
      institutionId: primaryInstitution.id,
      name: "NRI Quota",
      maxSeats: 8,
      filledSeats: 0,
    });
    await add(KEYS.institutionCaps, {
      institutionId: primaryInstitution.id,
      name: "Defense Quota",
      maxSeats: 6,
      filledSeats: 0,
    });
    caps = await getAll(KEYS.institutionCaps);
  }

  if (applicants.length === 0) {
    const cseProgram = programs.find((program) => program.code === "CSE") || programs[0];
    const eceProgram = programs.find((program) => program.code === "ECE") || programs[0];
    const mbaProgram = programs.find((program) => program.code === "MBA") || programs[0];
    const jkCap = caps.find((cap) => cap.name.includes("J&K"));
    const nriCap = caps.find((cap) => cap.name.includes("NRI"));

    const now = new Date().toISOString();
    const demoApplicants = [
      {
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "9876500001",
        dateOfBirth: "2007-05-11",
        gender: "Male",
        category: "GM",
        address: "Bengaluru",
        qualifyingExam: "PUC",
        marks: 94,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "KCET",
        programId: cseProgram.id,
        allotmentNumber: "KEA/CSE/2026/0001",
        institutionCapId: "none",
        documentStatus: "Verified",
        feeStatus: "Paid",
        admissionStatus: "Confirmed",
        createdAt: now,
      },
      {
        name: "Sana Khan",
        email: "sana.khan@example.com",
        phone: "9876500002",
        dateOfBirth: "2008-01-23",
        gender: "Female",
        category: "OBC",
        address: "Mysuru",
        qualifyingExam: "PUC",
        marks: 89,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "KCET",
        programId: eceProgram.id,
        allotmentNumber: "KEA/ECE/2026/0004",
        institutionCapId: jkCap?.id || "none",
        documentStatus: "Verified",
        feeStatus: "Pending",
        admissionStatus: "Allocated",
        createdAt: now,
      },
      {
        name: "Rohan Gupta",
        email: "rohan.gupta@example.com",
        phone: "9876500003",
        dateOfBirth: "2007-08-16",
        gender: "Male",
        category: "GM",
        address: "Hubballi",
        qualifyingExam: "COMEDK",
        marks: 86,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "COMEDK",
        programId: cseProgram.id,
        allotmentNumber: "CMDK/CSE/2026/0012",
        institutionCapId: "none",
        documentStatus: "Submitted",
        feeStatus: "Pending",
        admissionStatus: "Applied",
        createdAt: now,
      },
      {
        name: "Meera Nair",
        email: "meera.nair@example.com",
        phone: "9876500004",
        dateOfBirth: "2005-12-03",
        gender: "Female",
        category: "GM",
        address: "Kochi",
        qualifyingExam: "CAT",
        marks: 82,
        entryType: "Regular",
        admissionMode: "Management",
        quotaType: "Management",
        programId: mbaProgram.id,
        allotmentNumber: "",
        institutionCapId: nriCap?.id || "none",
        documentStatus: "Verified",
        feeStatus: "Paid",
        admissionStatus: "Confirmed",
        createdAt: now,
      },
      {
        name: "Dev Patel",
        email: "dev.patel@example.com",
        phone: "9876500005",
        dateOfBirth: "2007-11-29",
        gender: "Male",
        category: "SC",
        address: "Belagavi",
        qualifyingExam: "PUC",
        marks: 77,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "Supernumerary",
        programId: cseProgram.id,
        allotmentNumber: "SUP/CSE/2026/0003",
        institutionCapId: "none",
        documentStatus: "Pending",
        feeStatus: "Pending",
        admissionStatus: "Applied",
        createdAt: now,
      },
      {
        name: "Isha Reddy",
        email: "isha.reddy@example.com",
        phone: "9876500006",
        dateOfBirth: "2007-03-15",
        gender: "Female",
        category: "GM",
        address: "Hyderabad",
        qualifyingExam: "COMEDK",
        marks: 91,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "COMEDK",
        programId: eceProgram.id,
        allotmentNumber: "CMDK/ECE/2026/0008",
        institutionCapId: "none",
        documentStatus: "Verified",
        feeStatus: "Paid",
        admissionStatus: "Allocated",
        createdAt: now,
      },
      {
        name: "Kiran Das",
        email: "kiran.das@example.com",
        phone: "9876500007",
        dateOfBirth: "2007-06-20",
        gender: "Male",
        category: "ST",
        address: "Imphal",
        qualifyingExam: "PUC",
        marks: 72,
        entryType: "Regular",
        admissionMode: "Government",
        quotaType: "KCET",
        programId: mbaProgram.id,
        allotmentNumber: "KEA/MBA/2026/0006",
        institutionCapId: jkCap?.id || "none",
        documentStatus: "Submitted",
        feeStatus: "Pending",
        admissionStatus: "Applied",
        createdAt: now,
      },
      {
        name: "Nidhi Verma",
        email: "nidhi.verma@example.com",
        phone: "9876500008",
        dateOfBirth: "2006-09-09",
        gender: "Female",
        category: "OBC",
        address: "Pune",
        qualifyingExam: "CAT",
        marks: 84,
        entryType: "Lateral",
        admissionMode: "Management",
        quotaType: "Management",
        programId: mbaProgram.id,
        allotmentNumber: "",
        institutionCapId: "none",
        documentStatus: "Verified",
        feeStatus: "Paid",
        admissionStatus: "Confirmed",
        createdAt: now,
      },
    ];

    for (const applicant of demoApplicants) {
      await add(KEYS.applicants, applicant);
    }

    const seededApplicants = await getAll(KEYS.applicants);
    const allocatedApplicants = seededApplicants.filter(
      (applicant) =>
        applicant.admissionStatus === "Allocated" ||
        applicant.admissionStatus === "Confirmed",
    );

    for (const quota of quotas) {
      const filledSeats = allocatedApplicants.filter(
        (applicant) =>
          applicant.programId === quota.programId &&
          applicant.quotaType === quota.type,
      ).length;
      await update(KEYS.quotas, quota.id, { filledSeats });
    }

    for (const cap of caps) {
      const filledSeats = allocatedApplicants.filter(
        (applicant) => applicant.institutionCapId === cap.id,
      ).length;
      await update(KEYS.institutionCaps, cap.id, { filledSeats });
    }
  }
}
