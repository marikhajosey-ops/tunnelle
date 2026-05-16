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
      
      const cleanBase = provider.baseUrl.replace(/\/$/, '');
      const endpoints = [
        cleanBase.endsWith('/models') ? cleanBase : `${cleanBase}/models`,
        cleanBase.endsWith('/v1') ? `${cleanBase}/models` : `${cleanBase}/v1/models`,
        cleanBase // Try the base URL directly as a last resort
      ];

      let response = null;
      let lastError = null;

      // Try each potential endpoint
      for (const url of [...new Set(endpoints)]) {
        try {
          console.log(`Trying model endpoint: ${url}`);
          response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'X-API-Key': provider.apiKey,
              'Bypass-Tunnel-Reminder': 'true',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
            timeout: 10000,
          });
          if (response) break;
        } catch (e: any) {
          lastError = e;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('All model endpoints failed');
      }

      // Flexible parsing
      let upstreamModels = [];
      const data = response.data;
      if (Array.isArray(data.data)) upstreamModels = data.data;
      else if (Array.isArray(data)) upstreamModels = data;
      else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0) upstreamModels = keys.map(k => ({ id: k }));
      }

      if (upstreamModels.length === 0) {
        console.warn(`Provider ${provider.name} returned empty model list`);
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
