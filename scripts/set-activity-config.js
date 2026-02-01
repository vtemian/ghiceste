#!/usr/bin/env node

async function setActivityConfig(token) {
  const url = 'https://discord.com/api/v10/applications/@me';

  // Try setting multiple fields at once
  const payload = {
    flags: 8519680 | 131072, // Add EMBEDDED flag
    embedded_activity_config: {
      supported_platforms: ['web'],
      default_orientation_lock_state: 1,
      tablet_default_orientation_lock_state: 1,
      requires_age_gate: false,
      shelf_rank: 0,
      premium_tier_requirement: null,
    }
  };

  console.log('Setting activity config...');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/set-activity-config.js <BOT_TOKEN>');
  process.exit(1);
}

setActivityConfig(token);
