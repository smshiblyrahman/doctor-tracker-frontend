"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Edit3, Filter, Mail, Phone, Search, Trash2, UserRound, X } from "lucide-react";
import { api, queryString } from "@/lib/api";
import type { Doctor, Paginated, Patient, PatientDoctor } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadState";
import { Toast } from "@/components/common/Toast";

const initialForm = { name: "", condition: "", dateOfBirth: "", gender: "unspecified", phone: "", email: "", doctor: "" };
function doctorName(doctor: PatientDoctor) { return typeof doctor === "string" ? "Doctor record" : doctor.name; }
function doctorId(doctor: PatientDoctor) { return typeof doctor === "string" ? doctor : doctor._id; }

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const filters = useMemo(() => ({ page, limit: 10, search: debouncedSearch, condition, doctorId: doctorFilter, from, to }), [page, debouncedSearch, condition, doctorFilter, from, to]);
  const patients = useQuery({ queryKey: ["patients", filters], queryFn: () => api<Paginated<Patient>>(`/patients${queryString(filters)}`), placeholderData: (previous) => previous });
  const doctors = useQuery({ queryKey: ["doctors", "filter-options"], queryFn: () => api<Paginated<Doctor>>("/doctors?limit=50"), staleTime: 60_000 });
  const updatePatient = useMutation({
    mutationFn: () => api<{ data: Patient }>(`/patients/${editing?._id}`, { method: "PATCH", body: JSON.stringify({ ...form, dateOfBirth: form.dateOfBirth || null }) }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["patients"] }), queryClient.invalidateQueries({ queryKey: ["doctor-patients"] }), queryClient.invalidateQueries({ queryKey: ["analytics", "summary"] })]); setEditing(null); setForm(initialForm); setFormError(""); setSuccessMessage("Patient updated successfully."); },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not update patient."),
  });
  const deletePatient = useMutation({
    mutationFn: (id: string) => api<{ message: string }>(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["patients"] }), queryClient.invalidateQueries({ queryKey: ["doctor-patients"] }), queryClient.invalidateQueries({ queryKey: ["analytics", "summary"] })]); if (patients.data?.data.length === 1 && page > 1) setPage((current) => Math.max(1, current - 1)); setSuccessMessage("Patient deleted successfully."); },
  });
  function openEdit(patient: Patient) {
    setEditing(patient);
    setForm({ name: patient.name, condition: patient.condition, dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "", gender: patient.gender || "unspecified", phone: patient.phone || "", email: patient.email || "", doctor: doctorId(patient.doctor) });
    setFormError("");
  }
  function resetFilters() { setSearch(""); setCondition(""); setDoctorFilter(""); setFrom(""); setTo(""); setPage(1); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFormError(""); updatePatient.mutate(); }
  const hasFilters = Boolean(search || condition || doctorFilter || from || to);

  return <div className="page-stack">
    <Toast message={successMessage} onClose={() => setSuccessMessage("")} />
    <div className="page-intro"><div><p className="eyebrow">PATIENT RECORDS</p><h2>Patients</h2><p>Find, review, and maintain patient records across your care team.</p></div><div className="patient-page-badge"><UserRound size={17} /> Patient directory</div></div>
    <div className="list-toolbar panel patient-toolbar"><div className="search-box"><Search size={17} /><input aria-label="Search patients" placeholder="Search name, condition, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><kbd>⌕</kbd></div><div className="toolbar-divider" /><div className="filter-control condition-filter"><Filter size={16} /><input aria-label="Filter by condition" placeholder="Condition" value={condition} onChange={(e) => { setCondition(e.target.value); setPage(1); }} /></div><div className="filter-control doctor-select"><UserRound size={16} /><select aria-label="Filter by doctor" value={doctorFilter} onChange={(e) => { setDoctorFilter(e.target.value); setPage(1); }}><option value="">All doctors</option>{(doctors.data?.data || []).map((doctor) => <option value={doctor._id} key={doctor._id}>{doctor.name}</option>)}</select><ChevronDown size={14} /></div><div className="date-filter"><CalendarDays size={15} /><input aria-label="Registered from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /><span>to</span><input aria-label="Registered to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></div>{hasFilters && <button className="clear-filters" type="button" onClick={resetFilters}><X size={14} /> Clear</button>}</div>
    {deletePatient.isError && <div className="form-alert" role="alert">{deletePatient.error instanceof Error ? deletePatient.error.message : "Could not delete patient."}</div>}
    <section className="panel table-panel"><div className="table-panel-heading"><div><h3>All patients</h3><p>{patients.data?.pagination.total ?? "—"} patient records</p></div><span className="table-tag"><span /> Patient list</span></div>
      {patients.isLoading ? <LoadingState label="Loading patients…" /> : patients.isError ? <ErrorState message={patients.error instanceof Error ? patients.error.message : "Unable to load patients."} onRetry={() => patients.refetch()} /> : patients.data?.data.length ? <><div className="table-scroll"><table className="data-table"><thead><tr><th>PATIENT</th><th>CONDITION</th><th>ASSIGNED DOCTOR</th><th>CONTACT</th><th>REGISTERED</th><th>ACTIONS</th></tr></thead><tbody>{patients.data.data.map((patient, index) => <tr key={patient._id}><td><div className="person-cell"><div className={`person-avatar person-avatar-${index % 5}`}>{patient.name.split(" ").filter(Boolean).slice(-1)[0]?.[0] || "P"}</div><div><strong>{patient.name}</strong><span className="person-subtext">Patient ID · {patient._id.slice(-6).toUpperCase()}</span></div></div></td><td><span className="condition-pill">{patient.condition}</span></td><td><Link className="doctor-link" href={typeof patient.doctor === "string" ? "/doctors" : `/doctors/${patient.doctor._id}`}><span className="doctor-link-avatar">{doctorName(patient.doctor).split(" ").filter(Boolean).slice(-1)[0]?.[0] || "D"}</span><span>{doctorName(patient.doctor)}{typeof patient.doctor !== "string" && <small>{patient.doctor.specialization}</small>}</span></Link></td><td><div className="contact-stack">{patient.phone && <span><Phone size={13} /> {patient.phone}</span>}{patient.email && <span><Mail size={13} /> {patient.email}</span>}{!patient.phone && !patient.email && <span className="muted">No contact added</span>}</div></td><td><span className="date-cell">{new Date(patient.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span></td><td><div className="row-actions"><button className="row-action" type="button" onClick={() => openEdit(patient)} aria-label={`Edit ${patient.name}`}><Edit3 size={15} /><span>Edit</span></button><button className="row-action row-action-danger" type="button" disabled={deletePatient.isPending} onClick={() => { if (window.confirm(`Delete the record for ${patient.name}? This cannot be undone.`)) deletePatient.mutate(patient._id); }} aria-label={`Delete ${patient.name}`}><Trash2 size={15} /><span>Delete</span></button></div></td></tr>)}</tbody></table></div><Pagination pagination={patients.data.pagination} onPageChange={setPage} /></> : <EmptyState title={hasFilters ? "No matching patients" : "No patient records yet"} description={hasFilters ? "Adjust your search or filters to find the record." : "Patients added under a doctor will appear here automatically."} />}
    </section>
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit patient" wide><form className="form-grid" onSubmit={submit}>
      <div className="form-field"><label htmlFor="edit-patient-name">Full name *</label><input id="edit-patient-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required /></div>
      <div className="form-field"><label htmlFor="edit-patient-condition">Condition *</label><input id="edit-patient-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} maxLength={160} required /></div>
      <div className="form-field"><label htmlFor="edit-patient-dob">Date of birth</label><input id="edit-patient-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="edit-patient-gender">Gender</label><select id="edit-patient-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="unspecified">Prefer not to specify</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></div>
      <div className="form-field"><label htmlFor="edit-patient-phone">Phone</label><input id="edit-patient-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} /></div>
      <div className="form-field"><label htmlFor="edit-patient-email">Email</label><input id="edit-patient-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} /></div>
      <div className="form-field form-field-full"><label htmlFor="edit-patient-doctor">Assigned doctor *</label><select id="edit-patient-doctor" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required><option value="">Choose a doctor</option>{(doctors.data?.data || []).map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name} · {doctor.specialization}</option>)}</select></div>
      {formError && <div className="form-alert form-field-full" role="alert">{formError}</div>}
      <div className="modal-actions form-field-full"><button className="button button-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button><button className="button button-primary" type="submit" disabled={updatePatient.isPending}>{updatePatient.isPending ? "Saving…" : "Save changes"}</button></div>
    </form><p className="form-footnote">Use fictional records only. This demo is not intended for real patient data.</p></Modal>
  </div>;
}
