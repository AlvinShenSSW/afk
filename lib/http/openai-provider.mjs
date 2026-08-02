// One client prevents relay and gate transports from disagreeing on failures.

function providerError(code, message, relay = false) {
  const error = new Error(message);
  error.code = code;
  if (relay) error.relay = true;
  return error;
}

function mapHttp(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'upstream';
  return 'http_error';
}

function transportDetail(error, credential) {
  const safe = (value) => {
    const text = String(value ?? '');
    if (credential && text.includes(credential)) return '';
    return /^[A-Za-z0-9_.-]{1,40}$/.test(text) ? text : '';
  };
  return [safe(error?.name), safe(error?.cause?.code)].filter(Boolean).join('/');
}

export function defaultUsage(json) {
  const usage = json?.usage || {};
  return {
    input: usage.prompt_tokens || 0,
    output: usage.completion_tokens || 0,
    cacheRead: usage?.prompt_tokens_details?.cached_tokens || 0,
  };
}

export function deepseekUsage(json) {
  const usage = json?.usage || {};
  let cached = usage?.prompt_tokens_details?.cached_tokens || 0;
  if (!cached) cached = usage?.prompt_cache_hit_tokens || 0;
  return {
    input: usage.prompt_tokens || 0,
    output: usage.completion_tokens || 0,
    cacheRead: cached,
  };
}

export function makeOpenAiProvider(cfg) {
  const fail = (code, message) => providerError(code, message, cfg.relayErrors === true);
  return {
    name: cfg.name,
    kind: 'openai',
    keyEnv: cfg.keyEnv,

    hasKey(env) {
      return Boolean(String(env?.[cfg.keyEnv] ?? '').trim());
    },

    available(env) {
      return this.hasKey(env)
        ? { ok: true }
        : { ok: false, reason: `${cfg.keyEnv} not set` };
    },

    defaultModel(env) {
      const model = String(env?.[cfg.modelEnv] ?? '').trim();
      if (model) return model;
      if (cfg.modelDefault) return cfg.modelDefault;
      throw fail(
        'no_model',
        `${cfg.name}: no model configured — set AGENT_RELAY_*_MODEL or ${cfg.modelEnv}`,
      );
    },

    async complete({ system, user, model, maxTokens, env, fetchImpl, httpTimeoutMs = 120000 }) {
      const key = String(env?.[cfg.keyEnv] ?? '').trim();
      if (!key) throw fail('no_key', `${cfg.keyEnv} not set`);

      const baseUrl = (
        String(env?.[cfg.baseUrlEnv] ?? '').trim() || cfg.baseUrlDefault
      ).replace(/\/+$/, '');
      const url = `${baseUrl}/chat/completions`;
      const overrideEnv = cfg.tokenParamOverrideEnv === undefined
        ? 'AGENT_RELAY_TOKEN_PARAM'
        : cfg.tokenParamOverrideEnv;
      const tokenOverride = overrideEnv ? String(env?.[overrideEnv] ?? '').trim() : '';
      const tokenParam = tokenOverride || cfg.tokenParam || 'max_tokens';
      const body = {
        model,
        [tokenParam]: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        ...(cfg.buildExtraBody ? cfg.buildExtraBody(env) : {}),
      };
      const headers = {
        ...(cfg.buildHeaders
          ? cfg.buildHeaders(key, env)
          : { Authorization: `Bearer ${key}` }),
        'Content-Type': 'application/json',
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), httpTimeoutMs);
      let response;
      try {
        response = await (fetchImpl || globalThis.fetch)(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        if (error?.name === 'AbortError') {
          throw fail('timeout', `${cfg.name} request timed out after ${httpTimeoutMs}ms`);
        }
        const detail = transportDetail(error, key);
        throw fail('transport', `${cfg.name} transport error${detail ? ` (${detail})` : ''}`);
      }

      try {
        if (!response.ok) {
          const code = cfg.normalizeError
            ? cfg.normalizeError(response.status)
            : mapHttp(response.status);
          throw fail(code, `${cfg.name} HTTP ${response.status}`);
        }

        let json;
        try {
          json = await response.json();
        } catch (error) {
          if (controller.signal.aborted || error?.name === 'AbortError') {
            throw fail('timeout', `${cfg.name} request timed out after ${httpTimeoutMs}ms`);
          }
          throw fail('bad_json', `${cfg.name}: response was not valid JSON`);
        }

        const choice = json?.choices?.[0];
        const completion = (cfg.extractText ? cfg.extractText(json) : choice?.message?.content) || '';
        if (!String(completion).trim()) {
          const hint = cfg.emptyHint ? `; ${cfg.emptyHint}` : '';
          throw fail('empty', `${cfg.name}: empty completion${hint}`);
        }
        const usage = cfg.normalizeUsage ? cfg.normalizeUsage(json) : defaultUsage(json);
        return {
          text: String(completion),
          usage,
          reportedModel: typeof json?.model === 'string' ? json.model.trim() : '',
          finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
