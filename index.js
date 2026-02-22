export class LeonelSearchAPI {
  /**
   * @param {Object} options
   * @param {string} options.apiKey Your LeonelSearch API key (https://leonelsearch.qzz.io/dashboard)
   * @param {string} [options.apiVersion='v1'] API version
   * @param {boolean} [options.debug=false] Enable debug logs
   */
  constructor({ apiKey, apiVersion = 'v1', debug = false }) {
    if (!apiKey) throw new Error('apiKey is required');

    this.apiKey = apiKey;
    this.baseURL = `https://leonelsearch.qzz.io/api/${apiVersion}`;
    this.debug = debug;

    if (this.debug) {
      console.log('[LeonelSearchAPI] Initialized');
    }
  }

  /**
   * Performs a search request
   * @param {Object} params
   * @param {string} params.query Search query
   * @param {'web'|'image'|'video'|'news'} params.type Search type
   * @param {number} [params.limit=10] Results per page (1-50)
   * @param {number} [params.page=1] Page number (>=1)
   * @returns {Promise<Object>} API response
   */
  async search({ query, type, limit = 10, page = 1 }) {
    if (!query) throw new Error('Param "query" is required');
    if (!type) throw new Error('Param "type" is required');

    const validTypes = ['web', 'image', 'video', 'news'];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`
      );
    }

    if (limit < 1 || limit > 50) {
      throw new Error('Param "limit" must be between 1 and 50');
    }

    if (page < 1) {
      throw new Error('Param "page" must be 1 or greater');
    }

    const payload = { query, type, limit, page };

    if (this.debug) {
      console.log('[LeonelSearchAPI] → Request');
      console.log('  Endpoint: /search');
      console.log('  Payload:', payload);
    }

    try {
      const res = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      // ==============================
      // ERROR RESPONSE
      // ==============================
      if (!res.ok) {
        let message = `${res.status} ${res.statusText}`;
        let data = null;

        const raw = await res.text();

        if (raw) {
          try {
            data = JSON.parse(raw);
            if (data?.message) message = data.message;
          } catch {
            message = raw;
          }
        }

        const error = new Error(message);
        error.status = res.status;
        error.data = data;

        if (this.debug) {
          console.error('[LeonelSearchAPI] ✖ API Error');
          console.error('  Status:', res.status);
          console.error('  Message:', message);
          if (data) console.error('  Data:', data);
        }

        throw error;
      }

      // ==============================
      // SUCCESS RESPONSE
      // ==============================
      const json = await res.json();

      if (this.debug) {
        console.log('[LeonelSearchAPI] ← Response');
        console.log('  Query:', json.query);
        console.log(
          '  Results:',
          json.meta?.resultCount ??
          json.results?.length ??
          0
        );
      }

      return json;
    } catch (err) {
      if (this.debug) {
        console.error('[LeonelSearchAPI] ✖ Request Failed');
        console.error(err);
      }

      throw err;
    }
  }

  // ============================================================
  // Shortcuts
  // ============================================================

  /** Web search */
  searchWeb(query, limit = 10, page = 1) {
    return this.search({ query, type: 'web', limit, page });
  }

  /** Image search */
  searchImages(query, limit = 10, page = 1) {
    return this.search({ query, type: 'image', limit, page });
  }

  /** Video search */
  searchVideos(query, limit = 10, page = 1) {
    return this.search({ query, type: 'video', limit, page });
  }

  /** News search */
  searchNews(query, limit = 10, page = 1) {
    return this.search({ query, type: 'news', limit, page });
  }
}