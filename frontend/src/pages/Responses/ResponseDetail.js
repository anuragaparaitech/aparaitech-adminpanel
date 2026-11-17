import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MdClose, MdDelete, MdMarkEmailRead, MdArchive,
  MdReply, MdSave, MdPerson, MdEmail, MdPhone,
  MdBusiness, MdCalendarToday, MdWork, MdLink,
} from 'react-icons/md';
import './Responses.css';

const STATUS_OPTIONS = [
  { value: 'new',      label: 'New' },
  { value: 'read',     label: 'Read' },
  { value: 'replied',  label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

const ResponseDetail = ({
  response, onClose, onStatusChange, onDelete, statusColors, typeColors,
}) => {
  const [note, setNote]         = useState(response.adminNote || '');
  const [savingNote, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/responses/${response._id}`, { adminNote: note });
      toast.success('Note saved');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const InfoRow = ({ icon, label, value }) =>
    value ? (
      <div className="detail-info-row">
        <span className="detail-info-label">
          {icon} {label}
        </span>
        <span className="detail-info-value">{value}</span>
      </div>
    ) : null;

  return (
    <div className="resp-detail-panel">
      {/* ── Detail header ── */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-avatar">
            {response.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{response.name}</h3>
            <p>{response.email}</p>
          </div>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <MdClose />
        </button>
      </div>

      {/* ── Badges ── */}
      <div className="detail-badges">
        <span className="resp-badge" style={statusColors[response.status]}>
          {response.status}
        </span>
        <span className="resp-badge" style={typeColors[response.type] || typeColors.other}>
          {response.type.replace('_', ' ')}
        </span>
        <span className="resp-badge" style={{ bg: '#f1f5f9', color: '#475569' }}>
          {response.source}
        </span>
      </div>

      <div className="detail-body">
        {/* ── Sender info ── */}
        <div className="detail-section">
          <h4>Sender Details</h4>
          <div className="detail-info-grid">
            <InfoRow icon={<MdPerson />}   label="Name"    value={response.name} />
            <InfoRow icon={<MdEmail />}    label="Email"   value={response.email} />
            <InfoRow icon={<MdPhone />}    label="Phone"   value={response.phone} />
            <InfoRow icon={<MdBusiness />} label="Company" value={response.company} />
            <InfoRow icon={<MdCalendarToday />} label="Received" value={fmt(response.createdAt)} />
            {response.jobTitle && (
              <InfoRow icon={<MdWork />} label="Applying for" value={response.jobTitle} />
            )}
            {response.resumeUrl && (
              <div className="detail-info-row">
                <span className="detail-info-label"><MdLink /> Resume</span>
                <a
                  href={response.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="detail-link"
                >
                  View Resume
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Subject ── */}
        {response.subject && (
          <div className="detail-section">
            <h4>Subject</h4>
            <p className="detail-subject">{response.subject}</p>
          </div>
        )}

        {/* ── Message ── */}
        <div className="detail-section">
          <h4>Message</h4>
          <div className="detail-message">{response.message}</div>
        </div>

        {/* ── Change status ── */}
        <div className="detail-section">
          <h4>Update Status</h4>
          <div className="detail-status-row">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`status-chip${response.status === opt.value ? ' active' : ''}`}
                onClick={() => onStatusChange(response._id, opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Admin note ── */}
        <div className="detail-section">
          <h4>Admin Note</h4>
          <textarea
            className="detail-note-input"
            rows={3}
            placeholder="Add a private note about this response…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="detail-save-note"
            onClick={saveNote}
            disabled={savingNote}
          >
            {savingNote ? 'Saving…' : <><MdSave /> Save Note</>}
          </button>
        </div>

        {/* ── Actions ── */}
        <div className="detail-actions">
          <button
            className="detail-action-btn mark-replied"
            onClick={() => onStatusChange(response._id, 'replied')}
          >
            <MdReply /> Mark Replied
          </button>
          <button
            className="detail-action-btn archive"
            onClick={() => onStatusChange(response._id, 'archived')}
          >
            <MdArchive /> Archive
          </button>
          <button
            className="detail-action-btn delete-btn"
            onClick={() => onDelete(response._id)}
          >
            <MdDelete /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetail;
