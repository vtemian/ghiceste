import { DiscordSDK } from '@discord/embedded-app-sdk';

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error('VITE_DISCORD_CLIENT_ID is required');
}

export const discordSdk = new DiscordSDK(clientId);

export async function initializeDiscord(): Promise<{
  instanceId: string;
  channelId: string;
  userId: string;
  username: string;
}> {
  await discordSdk.ready();

  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const { access_token } = await response.json();

  const auth = await discordSdk.commands.authenticate({ access_token });

  return {
    instanceId: discordSdk.instanceId,
    channelId: discordSdk.channelId ?? '',
    userId: auth.user.id,
    username: auth.user.username,
  };
}
