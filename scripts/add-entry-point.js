#!/usr/bin/env node

const APP_ID = '1467525387503403039';

async function createEntryPointCommand(token, handler = 1) {
  const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const command = {
    name: 'ghiceste',
    description: 'Joaca Ghiceste - Wordle in romana!',
    type: 4, // PRIMARY_ENTRY_POINT
    handler: handler, // 1 = APP_HANDLER, 2 = DISCORD_LAUNCH_ACTIVITY
  };

  console.log('Creating entry point command with handler:', handler);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Error:', response.status, response.statusText);
    console.error('Response:', JSON.stringify(data, null, 2));
    return;
  }

  console.log('Success:', JSON.stringify(data, null, 2));
}

const token = process.argv[2];
const handler = parseInt(process.argv[3] || '2');

if (!token) {
  console.error('Usage: node scripts/add-entry-point.js <BOT_TOKEN> [handler]');
  console.error('  handler: 1 = APP_HANDLER, 2 = DISCORD_LAUNCH_ACTIVITY');
  process.exit(1);
}

createEntryPointCommand(token, handler);
