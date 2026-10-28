"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, ChevronDown, Eye, Mail, Phone, Plus, Search, Stethoscope, UserRound, X } from "lucide-react";
import { api, queryString } from "@/lib/api";
import type { Doctor, Paginated } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadState";
import { Toast } from "@/components/common/Toast";

const initialForm = { name: "", specialization: "", hospital: "", phone: "", email: "" };
const specializations = ["Cardiology", "Dermatology", "General Medicine", "Neurology", "Obstetrics & Gynecology", "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry", "Radiology", "Surgery", "Other"];

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const filters = useMemo(() => ({ page, limit: 10, search: debouncedSearch, specialization, hospital, from, to }), [page, debouncedSearch, specialization, hospital, from, to]);
  const doctors = useQuery({ queryKey: ["doctors", filters], queryFn: () => api<Paginated<Doctor>>(`/doctors${queryString(filters)}`), placeholderData: (previous) => previous });
  const createDoctor = useMutation({
    mutationFn: () => api<{ data: Doctor }>("/doctors", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["doctors"] }), queryClient.invalidateQueries({ queryKey: ["analytics", "summary"] })]); setModalOpen(false); setForm(initialForm); setFormError(""); setSuccessMessage("Doctor added successfully."); },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create doctor."),
  });
  const hasFilters = Boolean(search || specialization || hospital || from || to);
  function resetFilters() { setSearch(""); setSpecialization(""); setHospital(""); setFrom(""); setTo(""); setPage(1); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFormError(""); createDoctor.mutate(); }

  return <div className="page-stack">
    <Toast message={successMessage} onClose={() => setSuccessMessage("")} />
    <div className="page-intro page-intro-action"><div><p className="eyebrow">CARE TEAM DIRECTORY</p><h2>Doctors</h2><p>Manage your doctors, their specialties, and where they practice.</p></div><button className="button button-primary" type="button" onClick={() => { setFormError(""); setModalOpen(true); }}><Plus size={17} /> Add doctor</button></div>
    <div className="list-toolbar panel"><div className="search-box"><Search size={17} /><input aria-label="Search doctors" placeholder="Search name, specialty, hospital…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><kbd>⌕</kbd></div><div className="toolbar-divider" /><div className="filter-control"><Stethoscope size={16} /><select aria-label="Filter by specialization" value={specialization} onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}><option value="">All specialties</option>{specializations.map((value) => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={14} /></div><div className="filter-control hospital-filter"><Building2 size={16} /><input aria-label="Filter by hospital" placeholder="Hospital" value={hospital} onChange={(e) => { setHospital(e.target.value); setPage(1); }} /></div><div className="date-filter"><CalendarDays size={15} /><input aria-label="Created from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /><span>to</span><input aria-label="Created to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></div>{hasFilters && <button className="clear-filters" type="button" onClick={resetFilters}><X size={14} /> Clear</button>}</div>
    <section className="panel table-panel"><div className="table-panel-heading"><div><h3>Doctor directory</h3><p>{doctors.data?.pagination.total ?? "—"} doctors in the directory</p></div><span className="table-tag"><span /> Directory</span></div>
      {doctors.isLoading ? <LoadingState label="Loading doctors…" /> : doctors.isError ? <ErrorState message={doctors.error instanceof Error ? doctors.error.message : "Unable to load doctors."} onRetry={() => doctors.refetch()} /> : doctors.data?.data.length ? <><div className="table-scroll"><table className="data-table"><thead><tr><th>DOCTOR</th><th>SPECIALIZATION</th><th>HOSPITAL</th><th>CONTACT</th><th>ADDED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{doctors.data.data.map((doctor, index) => <tr key={doctor._id}><td><div className="person-cell"><div className={`person-avatar person-avatar-${index % 5}`}>{doctor.name.split(" ").filter(Boolean).slice(-1)[0]?.[0] || "D"}</div><div><strong>{doctor.name}</strong><span className="person-subtext">Doctor ID · {doctor._id.slice(-6).toUpperCase()}</span></div></div></td><td><span className="specialty-pill">{doctor.specialization}</span></td><td><div className="hospital-cell"><Building2 size={15} /><span>{doctor.hospital}</span></div></td><td><div className="contact-stack"><span><Phone size={13} /> {doctor.phone}</span><span><Mail size={13} /> {doctor.email}</span></div></td><td><span className="date-cell">{new Date(doctor.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span></td><td><Link className="row-action" href={`/doctors/${doctor._id}`} aria-label={`View ${doctor.name}`}><Eye size={16} /><span>View</span></Link></td></tr>)}</tbody></table></div><Pagination pagination={doctors.data.pagination} onPageChange={setPage} /></> : <EmptyState title={hasFilters ? "No matching doctors" : "Your directory is ready"} description={hasFilters ? "Try adjusting the search or clearing one of the filters." : "Add your first doctor to start building the care team directory."} />}
    </section>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a doctor" wide><form className="form-grid" onSubmit={submit}>
      <div className="form-field"><label htmlFor="doctor-name">Full name *</label><div className="field-with-icon"><UserRound size={16} /><input id="doctor-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Alex Morgan" required maxLength={120} /></div></div>
      <div className="form-field"><label htmlFor="doctor-specialization">Specialization *</label><select id="doctor-specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required><option value="">Select specialty</option>{specializations.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
      <div className="form-field"><label htmlFor="doctor-hospital">Hospital / clinic *</label><div className="field-with-icon"><Building2 size={16} /><input id="doctor-hospital" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="Hospital or clinic name" required maxLength={160} /></div></div>
      <div className="form-field"><label htmlFor="doctor-phone">Phone number *</label><div className="field-with-icon"><Phone size={16} /><input id="doctor-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" required maxLength={30} /></div></div>
      <div className="form-field form-field-full"><label htmlFor="doctor-email">Email address *</label><div className="field-with-icon"><Mail size={16} /><input id="doctor-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@example.com" required maxLength={254} /></div></div>
      {formError && <div className="form-alert form-field-full" role="alert">{formError}</div>}
      <div className="modal-actions form-field-full"><button className="button button-secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={createDoctor.isPending}>{createDoctor.isPending ? "Saving…" : <><Plus size={16} /> Save doctor</>}</button></div>
    </form><p className="form-footnote">Only fictional assessment data should be entered into this demo.</p></Modal>
  </div>;
}
