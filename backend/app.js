import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

const ALLOWED_KEYS = new Set([
  "adm_institutions",
  "adm_campuses",
  "adm_departments",
  "adm_programs",
  "adm_academic_years",
  "adm_course_types",
  "adm_entry_types",
  "adm_admission_modes",
  "adm_quotas",
  "adm_applicants",
  "adm_institution_caps",
]);

const ADMIN_ONLY_KEYS = new Set([
  "adm_institutions",
  "adm_campuses",
  "adm_departments",
  "adm_programs",
  "adm_academic_years",
  "adm_course_types",
  "adm_entry_types",
  "adm_admission_modes",
  "adm_quotas",
  "adm_institution_caps",
]);

const APPLICANT_COLLECTION = "adm_applicants";
const QUOTA_COLLECTION = "adm_quotas";
const PROGRAM_COLLECTION = "adm_programs";
const CAP_COLLECTION = "adm_institution_caps";
const COUNTER_COLLECTION = "adm_admission_counters";
const SESSION_COLLECTION = "adm_user_session";

let cachedDb = null;

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sanitize(doc) {
  if (!doc) {
    return doc;
  }

  const { _id, ...rest } = doc;
  return rest;
}

function normalizeInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createError(`${fieldName} must be a non-negative number`);
  }

  return parsed;
}

async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "campus_connect";

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedDb = client.db(dbName);
  return cachedDb;
}

async function ensureIndexes(db) {
  await db.collection(APPLICANT_COLLECTION).createIndex(
    { admissionNumber: 1 },
    {
      unique: true,
      sparse: true,
    },
  );

  await db.collection(COUNTER_COLLECTION).createIndex(
    { id: 1 },
    {
      unique: true,
    },
  );
}

async function getCurrentSession(db) {
  const doc = await db.collection(SESSION_COLLECTION).findOne({ id: "session" });
  return doc?.session || null;
}

async function requireRole(db, allowedRoles) {
  const session = await getCurrentSession(db);
  const role = session?.role;

  if (!role || !allowedRoles.includes(role)) {
    throw createError("You do not have permission to perform this action", 403);
  }

  return session;
}

async function requireMutationPermission(db, key) {
  if (ADMIN_ONLY_KEYS.has(key)) {
    return requireRole(db, ["Admin"]);
  }

  if (key === APPLICANT_COLLECTION) {
    return requireRole(db, ["Admin", "Admission Officer"]);
  }

  return null;
}

async function findProgramHierarchy(db, programId) {
  const program = await db.collection(PROGRAM_COLLECTION).findOne({ id: programId });

  if (!program) {
    throw createError("Program not found");
  }

  const department = await db.collection("adm_departments").findOne({
    id: program.departmentId,
  });
  const campus = department
    ? await db.collection("adm_campuses").findOne({ id: department.campusId })
    : null;
  const institution = campus
    ? await db.collection("adm_institutions").findOne({ id: campus.institutionId })
    : null;

  return { program, department, campus, institution };
}

async function getCurrentAcademicYear(db) {
  const explicitCurrent = await db.collection("adm_academic_years").findOne({
    isCurrent: true,
  });

  if (explicitCurrent?.year) {
    return explicitCurrent.year;
  }

  const latest = await db
    .collection("adm_academic_years")
    .find({})
    .sort({ year: -1 })
    .limit(1)
    .toArray();

  return latest[0]?.year || String(new Date().getFullYear());
}

async function validateProgramPayload(payload) {
  if (!payload.name?.trim()) {
    throw createError("Program name is required");
  }

  if (!payload.code?.trim()) {
    throw createError("Program code is required");
  }

  if (!payload.departmentId) {
    throw createError("Department is required");
  }

  payload.totalIntake = normalizeInteger(payload.totalIntake, "Total intake");

  if (payload.totalIntake <= 0) {
    throw createError("Total intake must be greater than zero");
  }

  payload.supernumerarySeats = normalizeInteger(
    payload.supernumerarySeats ?? 0,
    "Supernumerary seats",
  );

  if (!payload.courseType?.trim()) {
    throw createError("Course type is required");
  }
}

async function validateQuotaPayload(db, payload, existingQuota) {
  const programId = payload.programId ?? existingQuota?.programId;
  const quotaType = payload.type ?? existingQuota?.type;
  const totalSeats = normalizeInteger(
    payload.totalSeats ?? existingQuota?.totalSeats,
    "Quota seats",
  );
  const filledSeats = normalizeInteger(
    payload.filledSeats ?? existingQuota?.filledSeats ?? 0,
    "Filled seats",
  );

  if (!programId) {
    throw createError("Program is required for quota configuration");
  }

  if (!quotaType?.trim()) {
    throw createError("Quota type is required");
  }

  const { program } = await findProgramHierarchy(db, programId);
  const quotas = await db.collection(QUOTA_COLLECTION).find({ programId }).toArray();

  const baseTotal = quotas.reduce((sum, quota) => {
    if (existingQuota?.id && quota.id === existingQuota.id) {
      return sum;
    }

    if (quota.type === "Supernumerary") {
      return sum;
    }

    return sum + quota.totalSeats;
  }, quotaType === "Supernumerary" ? 0 : totalSeats);

  if (quotaType !== "Supernumerary" && baseTotal > program.totalIntake) {
    throw createError(
      `Base quota seats cannot exceed the program intake of ${program.totalIntake}`,
    );
  }

  if (filledSeats > totalSeats) {
    throw createError("Filled seats cannot exceed quota seats");
  }

  payload.programId = programId;
  payload.type = quotaType;
  payload.totalSeats = totalSeats;
  payload.filledSeats = filledSeats;
}

async function validateApplicantPayload(db, payload, existingApplicant) {
  const merged = { ...existingApplicant, ...payload };

  if (!merged.name?.trim()) {
    throw createError("Applicant name is required");
  }

  if (!merged.email?.trim()) {
    throw createError("Applicant email is required");
  }

  if (!merged.programId) {
    throw createError("Program is required");
  }

  if (!merged.entryType?.trim()) {
    throw createError("Entry type is required");
  }

  if (!merged.admissionMode?.trim()) {
    throw createError("Admission mode is required");
  }

  if (!merged.quotaType?.trim()) {
    throw createError("Quota type is required");
  }

  if (merged.admissionMode === "Government" && !merged.allotmentNumber?.trim()) {
    throw createError("Allotment number is required for government admissions");
  }

  if (merged.admissionMode === "Management" && merged.quotaType !== "Management") {
    throw createError("Management admissions must use the Management quota");
  }

  if (merged.admissionMode === "Government" && merged.quotaType === "Management") {
    throw createError("Government admissions cannot use the Management quota");
  }

  merged.marks = normalizeInteger(merged.marks ?? 0, "Marks");
  payload.marks = merged.marks;
}

async function assertQuotaConfigurationComplete(db, programId) {
  const { program } = await findProgramHierarchy(db, programId);
  const quotas = await db.collection(QUOTA_COLLECTION).find({ programId }).toArray();
  const baseTotal = quotas
    .filter((quota) => quota.type !== "Supernumerary")
    .reduce((sum, quota) => sum + quota.totalSeats, 0);

  if (baseTotal !== program.totalIntake) {
    throw createError(
      `Quota configuration is incomplete for ${program.name}. Base quotas must equal intake ${program.totalIntake}.`,
    );
  }
}

async function buildAdmissionPrefix(db, applicant) {
  const { program, institution } = await findProgramHierarchy(db, applicant.programId);
  const academicYear = await getCurrentAcademicYear(db);
  const institutionCode = institution?.code || "INST";

  return `${institutionCode}/${academicYear}/${program.courseType}/${program.code}/${applicant.quotaType}`;
}

async function allocateApplicantSeat(db, applicantId) {
  await requireRole(db, ["Admin", "Admission Officer"]);

  const applicantCollection = db.collection(APPLICANT_COLLECTION);
  const quotaCollection = db.collection(QUOTA_COLLECTION);
  const capCollection = db.collection(CAP_COLLECTION);

  const applicant = await applicantCollection.findOne({ id: applicantId });

  if (!applicant) {
    throw createError("Applicant not found", 404);
  }

  if (applicant.admissionStatus !== "Applied") {
    throw createError("Only applicants in Applied status can be allocated");
  }

  await assertQuotaConfigurationComplete(db, applicant.programId);

  const quota = await quotaCollection.findOne({
    programId: applicant.programId,
    type: applicant.quotaType,
  });

  if (!quota) {
    throw createError("Quota configuration not found for the selected program");
  }

  const quotaResult = await quotaCollection.updateOne(
    {
      id: quota.id,
      filledSeats: { $lt: quota.totalSeats },
    },
    {
      $inc: { filledSeats: 1 },
    },
  );

  if (quotaResult.modifiedCount !== 1) {
    throw createError(`No seats available under ${applicant.quotaType} quota`);
  }

  let capId = null;

  try {
    if (applicant.institutionCapId) {
      const cap = await capCollection.findOne({ id: applicant.institutionCapId });

      if (!cap) {
        throw createError("Institution-level cap not found");
      }

      const capResult = await capCollection.updateOne(
        {
          id: cap.id,
          filledSeats: { $lt: cap.maxSeats },
        },
        {
          $inc: { filledSeats: 1 },
        },
      );

      if (capResult.modifiedCount !== 1) {
        throw createError(`Institution cap "${cap.name}" is full`);
      }

      capId = cap.id;
    }

    const applicantResult = await applicantCollection.updateOne(
      {
        id: applicantId,
        admissionStatus: "Applied",
      },
      {
        $set: {
          admissionStatus: "Allocated",
          allocatedAt: new Date().toISOString(),
        },
      },
    );

    if (applicantResult.modifiedCount !== 1) {
      throw createError("Applicant could not be allocated");
    }
  } catch (error) {
    await quotaCollection.updateOne({ id: quota.id }, { $inc: { filledSeats: -1 } });

    if (capId) {
      await capCollection.updateOne({ id: capId }, { $inc: { filledSeats: -1 } });
    }

    throw error;
  }

  const updatedApplicant = await applicantCollection.findOne({ id: applicantId });
  return sanitize(updatedApplicant);
}

async function confirmApplicantAdmission(db, applicantId) {
  await requireRole(db, ["Admin", "Admission Officer"]);

  const applicantCollection = db.collection(APPLICANT_COLLECTION);
  const applicant = await applicantCollection.findOne({ id: applicantId });

  if (!applicant) {
    throw createError("Applicant not found", 404);
  }

  if (applicant.admissionNumber) {
    return sanitize(applicant);
  }

  if (applicant.admissionStatus !== "Allocated") {
    throw createError("Only allocated applicants can be confirmed");
  }

  if (applicant.feeStatus !== "Paid") {
    throw createError("Fee must be marked Paid before confirmation");
  }

  if (applicant.documentStatus !== "Verified") {
    throw createError("Documents must be Verified before confirmation");
  }

  const prefix = await buildAdmissionPrefix(db, applicant);
  const counter = await db.collection(COUNTER_COLLECTION).findOneAndUpdate(
    { id: prefix },
    {
      $inc: { seq: 1 },
      $setOnInsert: {
        id: prefix,
        createdAt: new Date().toISOString(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: false,
    },
  );

  const sequence = String(counter.seq).padStart(4, "0");
  const admissionNumber = `${prefix}/${sequence}`;

  const result = await applicantCollection.updateOne(
    {
      id: applicantId,
      admissionStatus: "Allocated",
      $or: [
        { admissionNumber: { $exists: false } },
        { admissionNumber: "" },
      ],
    },
    {
      $set: {
        admissionStatus: "Confirmed",
        admissionNumber,
        confirmedAt: new Date().toISOString(),
      },
    },
  );

  if (result.modifiedCount !== 1) {
    const currentApplicant = await applicantCollection.findOne({ id: applicantId });

    if (currentApplicant?.admissionNumber) {
      return sanitize(currentApplicant);
    }

    throw createError("Admission confirmation failed");
  }

  const confirmedApplicant = await applicantCollection.findOne({ id: applicantId });
  return sanitize(confirmedApplicant);
}

export async function createApp() {
  const db = await getDb();
  await ensureIndexes(db);

  const app = express();
  app.use(cors());
  app.use(express.json());

  function getCollection(key) {
    if (!ALLOWED_KEYS.has(key)) {
      throw createError("Invalid collection key");
    }

    return db.collection(key);
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "Admission Management CRM Backend",
      health: "/api/health",
    });
  });

  app.get("/api/user-session", async (_req, res, next) => {
    try {
      const doc = await db.collection(SESSION_COLLECTION).findOne({ id: "session" });
      res.json(doc?.session || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/user-session", async (req, res, next) => {
    try {
      await db.collection(SESSION_COLLECTION).updateOne(
        { id: "session" },
        {
          $set: {
            id: "session",
            session: req.body,
          },
        },
        { upsert: true },
      );

      res.json(req.body);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/user-session", async (_req, res, next) => {
    try {
      await db.collection(SESSION_COLLECTION).deleteOne({ id: "session" });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admissions/:id/allocate", async (req, res, next) => {
    try {
      const applicant = await allocateApplicantSeat(db, req.params.id);
      res.json(applicant);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admissions/:id/confirm", async (req, res, next) => {
    try {
      const applicant = await confirmApplicantAdmission(db, req.params.id);
      res.json(applicant);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/:key", async (req, res, next) => {
    try {
      const collection = getCollection(req.params.key);
      const items = await collection.find({}).toArray();
      res.json(items.map(sanitize));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/:key", async (req, res, next) => {
    try {
      const { key } = req.params;
      const isSeed = req.body?.__seed === true;

      if (!isSeed) {
        await requireMutationPermission(db, key);
      }

      const collection = getCollection(key);
      const { __seed, ...payload } = req.body || {};
      const doc = { ...payload, id: crypto.randomUUID() };

      if (key === PROGRAM_COLLECTION) {
        await validateProgramPayload(doc);
      }

      if (key === QUOTA_COLLECTION) {
        await validateQuotaPayload(db, doc);
      }

      if (key === APPLICANT_COLLECTION) {
        await validateApplicantPayload(db, doc);
      }

      await collection.insertOne(doc);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/:key/:id", async (req, res, next) => {
    try {
      const { key, id } = req.params;
      const isSeed = req.body?.__seed === true;

      if (!isSeed) {
        await requireMutationPermission(db, key);
      }

      const collection = getCollection(key);
      const existing = await collection.findOne({ id });

      if (!existing) {
        throw createError("Record not found", 404);
      }

      const { __seed, ...updates } = req.body || {};

      if (key === PROGRAM_COLLECTION) {
        await validateProgramPayload({ ...existing, ...updates });
      }

      if (key === QUOTA_COLLECTION) {
        await validateQuotaPayload(db, updates, existing);
      }

      if (key === APPLICANT_COLLECTION) {
        if (
          Object.prototype.hasOwnProperty.call(updates, "admissionNumber") &&
          updates.admissionNumber !== existing.admissionNumber
        ) {
          throw createError("Admission number is immutable");
        }

        if (
          Object.prototype.hasOwnProperty.call(updates, "admissionStatus") &&
          updates.admissionStatus !== existing.admissionStatus &&
          ["Allocated", "Confirmed"].includes(updates.admissionStatus)
        ) {
          throw createError("Admission status must be changed through the admission workflow");
        }

        await validateApplicantPayload(db, updates, existing);
      }

      await collection.updateOne({ id }, { $set: updates });
      const updated = await collection.findOne({ id });
      res.json(sanitize(updated));
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/:key/:id", async (req, res, next) => {
    try {
      const { key, id } = req.params;
      await requireMutationPermission(db, key);

      const collection = getCollection(key);
      const existing = await collection.findOne({ id });

      if (!existing) {
        throw createError("Record not found", 404);
      }

      if (key === QUOTA_COLLECTION && existing.filledSeats > 0) {
        throw createError("Cannot delete a quota that already has allocated seats");
      }

      if (key === CAP_COLLECTION && existing.filledSeats > 0) {
        throw createError("Cannot delete an institution cap that is already in use");
      }

      if (key === PROGRAM_COLLECTION) {
        const hasApplicants = await db.collection(APPLICANT_COLLECTION).findOne({
          programId: id,
        });

        if (hasApplicants) {
          throw createError("Cannot delete a program that has applicants");
        }
      }

      await collection.deleteOne({ id });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Server error" });
  });

  return app;
}
