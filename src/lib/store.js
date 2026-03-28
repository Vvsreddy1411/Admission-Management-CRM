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
      let message = "Request failed";

      try {
        const payload = await res.json();
        message = payload?.error || payload?.message || message;
      } catch {
        const text = await res.text();
        message = text || message;
      }

      throw new Error(message);
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

export const KEYS = {
  institutions: "adm_institutions",
  campuses: "adm_campuses",
  departments: "adm_departments",
  programs: "adm_programs",
  academicYears: "adm_academic_years",
  courseTypes: "adm_course_types",
  entryTypes: "adm_entry_types",
  admissionModes: "adm_admission_modes",
  quotas: "adm_quotas",
  applicants: "adm_applicants",
  institutionCaps: "adm_institution_caps",
  userSession: "adm_user_session",
};

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
  return request(`/api/${key}/${id}`, { method: "DELETE" });
}

export async function allocateAdmission(applicantId) {
  return request(`/api/admissions/${applicantId}/allocate`, {
    method: "POST",
  });
}

export async function confirmAdmission(applicantId) {
  return request(`/api/admissions/${applicantId}/confirm`, {
    method: "POST",
  });
}

export async function getUserSession() {
  try {
    return await request("/api/user-session");
  } catch {
    return null;
  }
}

export async function setUserSession(session) {
  try {
    return await request("/api/user-session", {
      method: "POST",
      body: JSON.stringify(session),
    });
  } catch {
    return null;
  }
}

export async function clearUserSession() {
  try {
    await request("/api/user-session", { method: "DELETE" });
  } catch {
    // Ignore logout persistence failures when backend is unavailable.
  }
}

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

export async function checkQuotaAvailability(programId, quotaType) {
  const quotas = await getAll(KEYS.quotas);
  const quota = quotas.find(
    (item) => item.programId === programId && item.type === quotaType,
  );

  if (!quota) {
    return { available: false, remaining: 0 };
  }

  const remaining = quota.totalSeats - quota.filledSeats;
  return { available: remaining > 0, remaining };
}

export async function checkInstitutionCapAvailability(capId) {
  const caps = await getAll(KEYS.institutionCaps);
  const cap = caps.find((item) => item.id === capId);

  if (!cap) {
    return { available: false, remaining: 0 };
  }

  const remaining = cap.maxSeats - cap.filledSeats;
  return { available: remaining > 0, remaining };
}

export async function seedDemoData() {
  const seedAdd = (key, item) => add(key, { ...item, __seed: true });
  const seedUpdate = (key, id, updates) => update(key, id, { ...updates, __seed: true });

  let institutions = await getAll(KEYS.institutions);
  let campuses = await getAll(KEYS.campuses);
  let departments = await getAll(KEYS.departments);
  let programs = await getAll(KEYS.programs);
  let years = await getAll(KEYS.academicYears);
  let courseTypes = await getAll(KEYS.courseTypes);
  let entryTypes = await getAll(KEYS.entryTypes);
  let admissionModes = await getAll(KEYS.admissionModes);
  let quotas = await getAll(KEYS.quotas);
  let caps = await getAll(KEYS.institutionCaps);
  const applicants = await getAll(KEYS.applicants);

  if (courseTypes.length === 0) {
    await seedAdd(KEYS.courseTypes, { name: "UG", code: "UG" });
    await seedAdd(KEYS.courseTypes, { name: "PG", code: "PG" });
    courseTypes = await getAll(KEYS.courseTypes);
  }

  if (entryTypes.length === 0) {
    await seedAdd(KEYS.entryTypes, { name: "Regular", code: "Regular" });
    await seedAdd(KEYS.entryTypes, { name: "Lateral", code: "Lateral" });
    entryTypes = await getAll(KEYS.entryTypes);
  }

  if (admissionModes.length === 0) {
    await seedAdd(KEYS.admissionModes, { name: "Government", code: "Government" });
    await seedAdd(KEYS.admissionModes, { name: "Management", code: "Management" });
    admissionModes = await getAll(KEYS.admissionModes);
  }

  if (institutions.length === 0) {
    const createdInstitution = await seedAdd(KEYS.institutions, {
      name: "BRS Institute of Technology",
      code: "BRSIT",
      createdAt: new Date().toISOString(),
    });
    institutions = [createdInstitution];
  }

  const primaryInstitution = institutions[0];

  if (campuses.length === 0) {
    const createdCampus = await seedAdd(KEYS.campuses, {
      institutionId: primaryInstitution.id,
      name: "Main Campus",
      location: "Bangalore",
    });
    campuses = [createdCampus];
  }

  const primaryCampus = campuses[0];

  if (departments.length === 0) {
    departments = [
      await seedAdd(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Computer Science",
        code: "CSE",
      }),
      await seedAdd(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Electronics & Communication",
        code: "ECE",
      }),
      await seedAdd(KEYS.departments, {
        campusId: primaryCampus.id,
        name: "Business Administration",
        code: "MBA",
      }),
    ];
  }

  if (programs.length === 0) {
    const cse = departments.find((item) => item.code === "CSE") || departments[0];
    const ece = departments.find((item) => item.code === "ECE") || departments[0];
    const mba = departments.find((item) => item.code === "MBA") || departments[0];
    const ugCode = courseTypes.find((item) => item.code === "UG")?.code || "UG";
    const pgCode = courseTypes.find((item) => item.code === "PG")?.code || "PG";

    programs = [
      await seedAdd(KEYS.programs, {
        departmentId: cse.id,
        name: "B.Tech Computer Science",
        code: "CSE",
        courseType: ugCode,
        totalIntake: 120,
        supernumerarySeats: 5,
      }),
      await seedAdd(KEYS.programs, {
        departmentId: ece.id,
        name: "B.Tech Electronics & Communication",
        code: "ECE",
        courseType: ugCode,
        totalIntake: 60,
        supernumerarySeats: 3,
      }),
      await seedAdd(KEYS.programs, {
        departmentId: mba.id,
        name: "MBA",
        code: "MBA",
        courseType: pgCode,
        totalIntake: 60,
        supernumerarySeats: 2,
      }),
    ];
  }

  if (years.length === 0) {
    await seedAdd(KEYS.academicYears, { year: "2025", isCurrent: false });
    await seedAdd(KEYS.academicYears, { year: "2026", isCurrent: true });
    years = await getAll(KEYS.academicYears);
  } else if (!years.some((item) => item.isCurrent)) {
    await seedUpdate(KEYS.academicYears, years[0].id, { isCurrent: true });
  }

  if (quotas.length === 0) {
    const quotaTemplateByProgram = {
      CSE: { KCET: 60, COMEDK: 30, Management: 30, Supernumerary: 5 },
      ECE: { KCET: 30, COMEDK: 15, Management: 15, Supernumerary: 3 },
      MBA: { KCET: 25, COMEDK: 10, Management: 25, Supernumerary: 2 },
    };

    for (const program of programs) {
      const template = quotaTemplateByProgram[program.code];

      for (const [type, totalSeats] of Object.entries(template)) {
        await seedAdd(KEYS.quotas, {
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
    await seedAdd(KEYS.institutionCaps, {
      institutionId: primaryInstitution.id,
      name: "J&K Quota",
      maxSeats: 10,
      filledSeats: 0,
    });
    await seedAdd(KEYS.institutionCaps, {
      institutionId: primaryInstitution.id,
      name: "NRI Quota",
      maxSeats: 8,
      filledSeats: 0,
    });
    caps = await getAll(KEYS.institutionCaps);
  }

  if (applicants.length > 0) {
    return;
  }

  const cseProgram = programs.find((item) => item.code === "CSE") || programs[0];
  const eceProgram = programs.find((item) => item.code === "ECE") || programs[0];
  const mbaProgram = programs.find((item) => item.code === "MBA") || programs[0];
  const jkCap = caps.find((item) => item.name.includes("J&K"));
  const nriCap = caps.find((item) => item.name.includes("NRI"));
  const regular = entryTypes.find((item) => item.code === "Regular")?.code || "Regular";
  const lateral = entryTypes.find((item) => item.code === "Lateral")?.code || "Lateral";
  const government =
    admissionModes.find((item) => item.code === "Government")?.code || "Government";
  const management =
    admissionModes.find((item) => item.code === "Management")?.code || "Management";

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
      entryType: regular,
      admissionMode: government,
      quotaType: "KCET",
      programId: cseProgram.id,
      allotmentNumber: "KEA/CSE/2026/0001",
      institutionCapId: "",
      documentStatus: "Verified",
      feeStatus: "Paid",
      admissionStatus: "Confirmed",
      admissionNumber: "BRSIT/2026/UG/CSE/KCET/0001",
      createdAt: now,
      allocatedAt: now,
      confirmedAt: now,
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
      entryType: regular,
      admissionMode: government,
      quotaType: "KCET",
      programId: eceProgram.id,
      allotmentNumber: "KEA/ECE/2026/0004",
      institutionCapId: jkCap?.id || "",
      documentStatus: "Submitted",
      feeStatus: "Pending",
      admissionStatus: "Allocated",
      createdAt: now,
      allocatedAt: now,
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
      entryType: regular,
      admissionMode: government,
      quotaType: "COMEDK",
      programId: cseProgram.id,
      allotmentNumber: "CMDK/CSE/2026/0012",
      institutionCapId: "",
      documentStatus: "Pending",
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
      entryType: regular,
      admissionMode: management,
      quotaType: "Management",
      programId: mbaProgram.id,
      allotmentNumber: "",
      institutionCapId: nriCap?.id || "",
      documentStatus: "Verified",
      feeStatus: "Paid",
      admissionStatus: "Confirmed",
      admissionNumber: "BRSIT/2026/PG/MBA/Management/0001",
      createdAt: now,
      allocatedAt: now,
      confirmedAt: now,
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
      entryType: lateral,
      admissionMode: management,
      quotaType: "Management",
      programId: mbaProgram.id,
      allotmentNumber: "",
      institutionCapId: "",
      documentStatus: "Verified",
      feeStatus: "Paid",
      admissionStatus: "Confirmed",
      admissionNumber: "BRSIT/2026/PG/MBA/Management/0002",
      createdAt: now,
      allocatedAt: now,
      confirmedAt: now,
    },
  ];

  for (const applicant of demoApplicants) {
    await seedAdd(KEYS.applicants, applicant);
  }

  const seededApplicants = await getAll(KEYS.applicants);
  const allocatedApplicants = seededApplicants.filter((item) =>
    ["Allocated", "Confirmed"].includes(item.admissionStatus),
  );

  for (const quota of quotas) {
    const filledSeats = allocatedApplicants.filter(
      (item) => item.programId === quota.programId && item.quotaType === quota.type,
    ).length;

    await seedUpdate(KEYS.quotas, quota.id, { filledSeats });
  }

  for (const cap of caps) {
    const filledSeats = allocatedApplicants.filter(
      (item) => item.institutionCapId === cap.id,
    ).length;

    await seedUpdate(KEYS.institutionCaps, cap.id, { filledSeats });
  }
}
