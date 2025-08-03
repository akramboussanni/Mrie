import { config, getApiUrl } from './config';

export interface PrayerTimesData {
  fajr: string;
  shuruq: string;
  dhuhr: string;
  asr: string;
  maghreb: string;
  isha: string;
  timezone: string;
}

export interface MosqueInfo {
  id: string;
  name: string;
  country: string;
  city: string;
  timezone?: string;
}

export interface MosqueValidationResponse {
  valid: boolean;
  error?: string;
}

export interface NightTimes {
  midnight: string;
  lastThird: string;
}

export interface PrayerTimesResponse {
  prayerTimes: PrayerTimesData;
}

class PrayerTimesService {
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

  async getDefaultMasjid(): Promise<string> {
    const response = await this.makeRequest<string>(config.prayertimes.default);
    return response;
  }

  async getPrayerTimes(masjidId: string, day: number, month: number): Promise<PrayerTimesData> {
    const response = await this.makeRequest<PrayerTimesData>(`${config.prayertimes.base}/${masjidId}/${day}/${month}`);
    return response;
  }

  async getCacheStats(): Promise<any> {
    return this.makeRequest(config.prayertimes.cache);
  }

  async getAvailableMosques(): Promise<MosqueInfo[]> {
    return this.makeRequest(`${config.prayertimes.base}/mosques`);
  }

  async validateMosque(mosqueId: string): Promise<MosqueValidationResponse> {
    return this.makeRequest(`${config.prayertimes.base}/validate/${mosqueId}`);
  }

  async getMosqueInfo(mosqueId: string): Promise<MosqueInfo> {
    return this.makeRequest(`${config.prayertimes.base}/info/${mosqueId}`);
  }

  async createMosque(mosqueData: {
    id: string;
    name: string;
    country: string;
    city: string;
    timezone?: string;
  }): Promise<MosqueInfo> {
    return this.makeRequest(`${config.prayertimes.base}/mosques`, {
      method: 'POST',
      body: JSON.stringify(mosqueData),
    });
  }

  async deleteMosque(mosqueId: string): Promise<void> {
    return this.makeRequest(`${config.prayertimes.base}/mosques/${mosqueId}`, {
      method: 'DELETE',
    });
  }

  async updateMosque(mosqueId: string, mosqueData: {
    name: string;
    country: string;
    city: string;
    timezone?: string;
  }): Promise<MosqueInfo> {
    return this.makeRequest(`${config.prayertimes.base}/mosques/${mosqueId}`, {
      method: 'PUT',
      body: JSON.stringify(mosqueData),
    });
  }
}

export const prayerTimesService = new PrayerTimesService(); 