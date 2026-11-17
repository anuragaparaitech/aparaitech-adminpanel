import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MdInbox, MdSearch, MdFilterList, MdDelete, MdOpenInNew,
  MdRefresh, MdMarkEmailRead, MdArchive, MdReply,
} from 'react-icons/md';
import ResponseDetail from './ResponseDetail';
import './Responses.css';

const STATUS_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'new',      label: 'New' },
  { key: 'read',     label: 'Read' },
  { key: 'replied',  label: 'Replied' },
  { key: 'archived', label: 'Archived' },
];

const TYPE_OPTIONS = [
  { key: 'all',                label: 'All Types' },
  { key: 'enquiry',            label: 'Enquiry' },
  { key: 'contact',            label: 'Contact' },
  { key: 'career_application', label: 'Career Application' },
  { key: 'other',              label: 'Other' },
];

const STATUS_COLORS = {
  new:      { bg: '#dbeafe', color: '#1e40af' },
  read:     { bg: '#f1f5f9', color: '#475569' },
  replied:  { bg: '#dcfce7', color: '#166534' },
  archived: { bg: '#fef3c7', color: '#92400e' },
};

const TYPE_COLORS = {
  enquiry:            { bg: '#ede9fe', color: '#5b21b6' },
  contact:            { bg: '#e0f2fe', color: '#0369a1' },
  career_application: { bg: '#fce7f3', color: '#9d174d' },
  other:              { bg: '#f1f5f9', color: '#475569' },
};

const Responses = () => {
  const [responses, setResponses]   = useState([]);
  const [counts, setCounts]         = useState({ new: 0, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [typeFilter, setType]       = useState('all');
  const [selected, setSelected]     = useState(null);  // detail view
  const [deleteId, setDeleteId]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter   !== 'all') params.type   = typeFilter;
      if (search.trim())          params.search  = search.trim();

      const [listRes, countRes] = await Promise.all([
        axios.get('/api/responses', { params }),
        axios.get('/api/responses/meta/counts'),
      ]);
      setResponses(listRes.data);
      setCounts(countRes.data);
    } catch {
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Mark a single response as read when opened
  const openDetail = async (resp) => {
    setSelected(resp);
    if (resp.status === 'new') {
      try {
        await axios.patch(`/api/responses/${resp._id}`, { status: 'read' });
        setResponses((prev) =>
          prev.map((r) => (r._id === resp._id ? { ...r, status: 'read' } : r))
        );
        setCounts((c) => ({ ...c, new: Math.max(0, c.new - 1) }));
        setSelected((s) => ({ ...s, status: 'read' }));
      } catch { /* silent */ }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await axios.patch(`/api/responses/${id}`, { status });
      setResponses((prev) => prev.map((r) => (r._id === id ? updated.data : r)));
      if (selected?._id === id) setSelected(updated.data);
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/responses/${id}`);
      setResponses((prev) => prev.filter((r) => r._id !== id));
      if (selected?._id === id) setSelected(null);
      setDeleteId(null);
      toast.success('Response deleted');
      fetchData(); // refresh counts
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="responses-page">
      {/* ── Header ── */}
      <div className="resp-header">
        <div>
          <h1>
            Responses
            {counts.new > 0 && <span className="new-badge">{counts.new} new</span>}
          </h1>
          <p>Customer enquiries and form submissions from the website</p>
        </div>
        <button className="resp-refresh-btn" onClick={fetchData} title="Refresh">
          <MdRefresh />
        </button>
      </div>

      {/* ── Filters bar ── */}
      <div className="resp-filters">
        {/* Search */}
        <div className="resp-search">
          <MdSearch className="resp-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type filter */}
        <div className="resp-select-wrap">
          <MdFilterList className="resp-select-icon" />
          <select value={typeFilter} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="resp-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`resp-tab${statusFilter === tab.key ? ' active' : ''}`}
            onClick={() => setStatus(tab.key)}
          >
            {tab.label}
            {tab.key === 'new' && counts.new > 0 && (
              <span className="tab-count">{counts.new}</span>
            )}
            {tab.key === 'all' && counts.total > 0 && (
              <span className="tab-count tab-count-grey">{counts.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className={`resp-main ${selected ? 'has-detail' : ''}`}>

        {/* List panel */}
        <div className="resp-list-panel">
          {loading ? (
            <div className="resp-loading">
              <div className="resp-spinner" />
              <p>Loading responses…</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="resp-empty">
              <MdInbox className="resp-empty-icon" />
              <p>No responses found</p>
              <span>Adjust filters or wait for new submissions</span>
            </div>
          ) : (
            <div className="resp-list">
              {responses.map((r) => (
                <div
                  key={r._id}
                  className={`resp-item${r.status === 'new' ? ' unread' : ''}${selected?._id === r._id ? ' selected' : ''}`}
                  onClick={() => openDetail(r)}
                >
                  <div className="resp-item-left">
                    <div className="resp-avatar">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="resp-item-body">
                    <div className="resp-item-row1">
                      <span className="resp-name">{r.name}</span>
                      <span className="resp-date">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="resp-item-row2">
                      <span className="resp-email">{r.email}</span>
                    </div>
                    <div className="resp-item-row3">
                      <span className="resp-subject">
                        {r.subject || r.message.slice(0, 60)}
                      </span>
                    </div>
                    <div className="resp-item-row4">
                      <span
                        className="resp-badge"
                        style={STATUS_COLORS[r.status]}
                      >
                        {r.status}
                      </span>
                      <span
                        className="resp-badge"
                        style={TYPE_COLORS[r.type] || TYPE_COLORS.other}
                      >
                        {r.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {r.status === 'new' && <div className="resp-unread-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <ResponseDetail
            response={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setDeleteId(id)}
            statusColors={STATUS_COLORS}
            typeColors={TYPE_COLORS}
          />
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <div className="resp-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="resp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resp-modal-icon">🗑️</div>
            <h3>Delete Response</h3>
            <p>Are you sure you want to permanently delete this response?</p>
            <div className="resp-modal-actions">
              <button className="resp-modal-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="resp-modal-confirm" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Responses;
