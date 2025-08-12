const express = require('express');
const router = express.Router();
const { appConfigService } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorHandler');

// Simple admin auth via header token for now
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'Admin not configured' });
  }
  if (token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get latest app config (public)
router.get('/config', asyncHandler(async (req, res) => {
  const cfg = await appConfigService.getLatest();
  res.json({ success: true, config: cfg });
}));

// Upsert app config (admin)
router.post('/config', requireAdmin, asyncHandler(async (req, res) => {
  const { brand_name, theme_primary, theme_accent, scan_type, main_prompt, features, env } = req.body || {};
  const config = {
    ...(brand_name ? { brand_name } : {}),
    ...(theme_primary ? { theme_primary } : {}),
    ...(theme_accent ? { theme_accent } : {}),
    ...(scan_type ? { scan_type } : {}),
    ...(main_prompt ? { main_prompt } : {}),
    ...(features ? { features } : {}),
    ...(env ? { env } : {}),
  };
  const saved = await appConfigService.upsert(config);
  res.status(201).json({ success: true, config: saved });
}));

module.exports = router;


