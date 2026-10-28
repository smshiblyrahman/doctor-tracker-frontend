"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, Mail, Phone, Plus, Stethoscope, Trash2, UserRound } from "lucide-react";
import { api, queryString } from "@/lib/api";
import type { Doctor, Paginated, Patient } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadState";
import { Toast } from "@/components/common/Toast";

const initialForm = { name: "", condition: "", dateOfBirth: "", gender: "unspecified", phone: "", email: "" };

export default function DoctorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const doctor = useQuery({ queryKey: ["doctor", id], queryFn: () => api<{ data: Doctor }>(`/doctors/${id}`), enabled: Boolean(id) });
  const patients = useQuery({ queryKey: ["doctor-patients", id, page, search], queryFn: () => api<Paginated<Patient>>(`/doctors/${id}/patients${queryString({ page, limit: 10, search })}`), enabled: Boolean(id), placeholderData: (previous) => previous });
  const deletePatient = useMutation({
    mutationFn: (patientId: string) => api<{ message: string }>(`/patients/${patientId}`, { method: "DELETE" }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["doctor-patients", id] }), queryClient.invalidateQueries({ queryKey: ["patients"] }), queryClient.invalidateQueries({ queryKey: ["analytics", "summary"] })]); if (patients.data?.data.length === 1 && page > 1) setPage((current) => Math.max(1, current - 1)); setSuccessMessage("Patient deleted successfully."); },
  });
  const addPatient = useMutation({
    mutationFn: () => api<{ data: Patient }>(`/doctors/${id}/patients`, { method: "POST", body: JSON.stringify(form) }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["doctor-patients", id] }), queryClient.invalidateQueries({ queryKey: ["analytics", "summary"] }), queryClient.invalidateQueries({ queryKey: ["patients"] })]); setModalOpen(false); setForm(initialForm); setFormError(""); setSuccessMessage("Patient added successfully."); },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not add patient."),
  });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFormError(""); addPatient.mutate(); }

  if (doctor.isLoading) return <LoadingState label="Loading doctor profile…" />;
  if (doctor.isError || !doctor.data?.data) return <ErrorState message={doctor.error instanceof Error ? doctor.error.message : "Doctor profile could not be found."} onRetry={() => doctor.refetch()} />;
  const item = doctor.data.data;
  return <div className="page-stack">
    <Toast message={successMessage} onClose={() => setSuccessMessage("")} />
    <button className="back-link" type="button" onClick={() => router.push("/doctors")}><ArrowLeft size={16} /> Back to doctors</button>
    <section className="doctor-profile-card panel"><div className="profile-avatar">{item.name.split(" ").filter(Boolean).slice(-1)[0]?.[0] || "D"}</div><div className="profile-main"><p className="eyebrow">DOCTOR PROFILE</p><h2>{item.name}</h2><span className="specialty-pill profile-specialty"><Stethoscope size={13} /> {item.specialization}</span><div className="profile-details"><span><Building2 size={15} /> {item.hospital}</span><span><Phone size={15} /> {item.phone}</span><span><Mail size={15} /> {item.email}</span></div></div><div className="profile-side"><span className="profile-label">PATIENTS ASSIGNED</span><strong>{patients.data?.pagination.total ?? "—"}</strong><span className="profile-date"><CalendarDays size={13} /> Added {new Date(item.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span></div></section>
    <section className="panel table-panel"><div className="table-panel-heading doctor-patient-heading"><div><p className="eyebrow">ASSOCIATED RECORDS</p><h3>Patients under this doctor</h3><p>Patients assigned to {item.name}</p></div><button className="button button-primary" type="button" onClick={() => { setFormError(""); setModalOpen(true); }}><Plus size={16} /> Add patient</button></div><div className="subtable-toolbar"><div className="search-box search-box-compact"><UserRound size={16} /><input placeholder="Search patient name or condition" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search associated patients" /></div></div>
      {deletePatient.isError && <div className="form-alert" role="alert">{deletePatient.error instanceof Error ? deletePatient.error.message : "Could not delete patient."}</div>}{patients.isLoading ? <LoadingState label="Loading patients…" /> : patients.isError ? <ErrorState message={patients.error instanceof Error ? patients.error.message : "Unable to load associated patients."} onRetry={() => patients.refetch()} /> : patients.data?.data.length ? <><div className="table-scroll"><table className="data-table"><thead><tr><th>PATIENT</th><th>CONDITION</th><th>CONTACT</th><th>REGISTERED</th><th>ACTIONS</th></tr></thead><tbody>{patients.data.data.map((patient, index) => <tr key={patient._id}><td><div className="person-cell"><div className={`person-avatar person-avatar-${index % 5}`}>{patient.name.split(" ").filter(Boolean).slice(-1)[0]?.[0] || "P"}</div><div><strong>{patient.name}</strong><span className="person-subtext">Patient ID · {patient._id.slice(-6).toUpperCase()}</span></div></div></td><td><span className="condition-pill">{patient.condition}</span></td><td><div className="contact-stack">{patient.phone && <span><Phone size={13} /> {patient.phone}</span>}{patient.email && <span><Mail size={13} /> {patient.email}</span>}{!patient.phone && !patient.email && <span className="muted">No contact added</span>}</div></td><td><span className="date-cell">{new Date(patient.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span></td><td><button className="row-action row-action-danger" type="button" disabled={deletePatient.isPending} onClick={() => { if (window.confirm(`Delete the record for ${patient.name}? This cannot be undone.`)) deletePatient.mutate(patient._id); }} aria-label={`Delete ${patient.name}`}><Trash2 size={15} /><span>Delete</span></button></td></tr>)}</tbody></table></div><Pagination pagination={patients.data.pagination} onPageChange={setPage} /></> : <EmptyState title={search ? "No matching patients" : "No patients assigned yet"} description={search ? "Try another name or condition." : "Add a patient to associate their record with this doctor."} />}
    </section>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add patient" wide><form className="form-grid" onSubmit={submit}>
      <div className="form-field"><label htmlFor="patient-name">Full name *</label><input id="patient-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Patient full name" maxLength={120} required /></div>
      <div className="form-field"><label htmlFor="patient-condition">Condition *</label><input id="patient-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Seasonal allergy" maxLength={160} required /></div>
      <div className="form-field"><label htmlFor="patient-dob">Date of birth</label><input id="patient-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="patient-gender">Gender</label><select id="patient-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="unspecified">Prefer not to specify</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></div>
      <div className="form-field"><label htmlFor="patient-phone">Phone (optional)</label><input id="patient-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" maxLength={30} /></div>
      <div className="form-field"><label htmlFor="patient-email">Email (optional)</label><input id="patient-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@example.com" maxLength={254} /></div>
      {formError && <div className="form-alert form-field-full" role="alert">{formError}</div>}
      <div className="modal-actions form-field-full"><button className="button button-secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={addPatient.isPending}>{addPatient.isPending ? "Saving…" : <><Plus size={16} /> Save patient</>}</button></div>
    </form><p className="form-footnote">Use fictional records only. This demo is not intended for real patient data.</p></Modal>
  </div>;
}
