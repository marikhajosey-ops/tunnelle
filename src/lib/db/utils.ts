import { db } from './index';
import { settings, models, providers } from './schema';
import axios from 'axios';
import { eq } from 'drizzle-orm';

export async function initDatabase() {
  try {
    // Simple check to see if settings exist, if not, create default from .env
    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        id: 1,
        upstreamEndpoint: process.env.UPSTREAM_API_ENDPOINT,
        upstreamKey: process.env.UPSTREAM_API_KEY,
        adminPassword: process.env.ADMIN_PASSWORD,
      });
    }
  } catch (error: any) {
    console.warn('initDatabase skipped (likely missing tables or connection during build):', error.message);
  }
}

export async function refreshModels() {
  const allProviders = await db.select().from(providers).where(eq(providers.enabled, true));
  
  if (allProviders.length === 0) {
    console.log('No enabled providers found for model refresh');
    return;
  }

  for (const provider of allProviders) {
    try {
      console.log(`Refreshing models for provider: ${provider.name} (${provider.baseUrl})`);
      const response = await axios.get(`${provider.baseUrl.replace(/\/$/, '')}/models`, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Bypass-Tunnel-Reminder': 'true',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        timeout: 15000,
      });

      // Flexible parsing: check response.data.data (OpenAI style) or response.data (array style)
      let upstreamModels = [];
      if (Array.isArray(response.data.data)) {
        upstreamModels = response.data.data;
      } else if (Array.isArray(response.data)) {
        upstreamModels = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle cases where it might be an object with model IDs as keys
        const keys = Object.keys(response.data);
        if (keys.length > 0 && typeof response.data[keys[0]] === 'object') {
          upstreamModels = keys.map(k => ({ id: k }));
        }
      }

      if (upstreamModels.length === 0) {
        console.warn(`Provider ${provider.name} returned no models or unknown format:`, response.data);
        continue;
      }

      for (const m of upstreamModels) {
        const modelId = m.id || m.name || (typeof m === 'string' ? m : null);
        if (!modelId) continue;

        await db.insert(models).values({
          id: modelId,
          name: modelId,
          providerId: provider.id,
        }).onConflictDoUpdate({
          target: [models.id, models.providerId],
          set: { name: modelId },
        });
      }
      console.log(`Successfully refreshed ${upstreamModels.length} models for ${provider.name}`);
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`Failed to refresh models for provider ${provider.name}:`, errorMsg);
    }
  }
}
