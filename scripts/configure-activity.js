#!/usr/bin/env node

/**
 * Configures the embedded activity settings via Discord API.
 * Usage: node scripts/configure-activity.js <BOT_TOKEN>
 */

async function configureActivity(token) {
  // First, get current app info
  const getResponse = await fetch('https://discord.com/api/v10/applications/@me', {
    headers: { 'Authorization': `Bot ${token}` },
  });
  const currentApp = await getResponse.json();
  console.log('Current embedded_activity_config:', currentApp.embedded_activity_config);

  // Try to update with activity config
  const config = {
    description: currentApp.description,
    embedded_activity_config: {
      supported_platforms: ['web'],
      default_orientation_lock_state: 1,
      tablet_default_orientation_lock_state: 1,
      requires_age_gate: false,
      shelf_rank: 0,
      free_period_starts_at: null,
      free_period_ends_at: null,
      premium_tier_requirement: null,
    }
  };

  console.log('\nAttempting to set config:', JSON.stringify(config, null, 2));

  const response = await fetch('https://discord.com/api/v10/applications/@me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('\nError:', response.status, response.statusText);
    console.error('Response:', JSON.stringify(data, null, 2));
    return;
  }

  console.log('\nResponse embedded_activity_config:', data.embedded_activity_config);
  console.log('Flags:', data.flags);
}

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/configure-activity.js <BOT_TOKEN>');
  process.exit(1);
}

configureActivity(token);
