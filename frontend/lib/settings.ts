import { config, getApiUrl } from './config';

export interface DefaultMasjidRequest {
  masjid_id: string;
}

class SettingsService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'unknown error' }));
      throw new Error(errorData.error || `http error ${response.status}`);
    }

    return response.json();
  }



  async getDefaultMasjid(): Promise<string | null> {
    try {
      const response = await this.makeRequest<string>(config.prayertimes.default);
      return response || null;
    } catch (error) {
      console.error('failed to get default masjid:', error);
      return null;
    }
  }

  async updateDefaultMasjid(masjidId: string): Promise<void> {
    await this.makeRequest(config.prayertimes.defaultMasjid, {
      method: 'PUT',
      body: JSON.stringify({ masjid_id: masjidId }),
    });
  }
}

export const settingsService = new SettingsService(); 