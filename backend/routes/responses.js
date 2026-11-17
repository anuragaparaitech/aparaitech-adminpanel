const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const { protect } = require('../middleware/auth');

// ── Public route ───────────────────────────────────────
// POST /api/responses — called by the company website when a form is submitted
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, type, jobTitle, resumeUrl, source } =
      req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const response = new Response({
      name, email, phone, company, subject, message,
      type: type || 'enquiry',
      jobTitle, resumeUrl,
      source: source || 'website',
    });

    await response.save();
    res.status(201).json({ message: 'Response submitted successfully', id: response._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Protected routes (admin only) ─────────────────────

// IMPORTANT: /meta/counts MUST come before /:id
// otherwise Express captures "meta" as the :id param.

// GET counts grouped by status (for badges / dashboard)
router.get('/meta/counts', protect, async (req, res) => {
  try {
    const counts = await Response.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const result = { new: 0, read: 0, replied: 0, archived: 0, total: 0 };
    counts.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all responses — optional query filters: ?status=new  ?type=enquiry  ?search=john
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (type   && type   !== 'all') filter.type   = type;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { subject: re }, { message: re }];
    }

    const responses = await Response.find(filter).sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single response by id
router.get('/:id', protect, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    if (!response) return res.status(404).json({ message: 'Response not found' });
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update status or adminNote
router.patch('/:id', protect, async (req, res) => {
  try {
    const allowed = ['status', 'adminNote'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await Response.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Response not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a response
router.delete('/:id', protect, async (req, res) => {
  try {
    const response = await Response.findByIdAndDelete(req.params.id);
    if (!response) return res.status(404).json({ message: 'Response not found' });
    res.json({ message: 'Response deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
