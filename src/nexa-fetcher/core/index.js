export function createNexaFetcher() {

  const endpoints = new Map()

  let production = true

  let config = {
    baseURL: "",
    headers: {}
  }


  function setProduction(v) {
    production = !!v
  }


  function setConfig(v) {
    config = { ...config, ...v }
  }


  function setEndpoint(name, ep) {
    endpoints.set(name, ep)
  }


  function buildURL(url, params, query) {

    if (params) {
      for (let k in params) {
        url = url.replace(
          ":" + k,
          params[k]
        )
      }
    }

    if (query) {

      const qs =
        new URLSearchParams(query)
          .toString()

      if (qs) {
        url += "?" + qs
      }
    }

    return url
  }


  async function call(name, opt = {}) {

    const ep = endpoints.get(name)

    if (!ep) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: new Error(
          "Endpoint not found: " + name
        ),
        response: null
      }
    }


    let cfg = {
      ...config,
      ...ep,
      ...opt
    }


    // dev fallback

    if (!production && ep.dev) {
      cfg = {
        ...cfg,
        ...ep.dev
      }
    }


    let url = buildURL(
      cfg.url,
      cfg.params,
      cfg.query
    )

    url =
      (cfg.baseURL || "") +
      url


    // json shortcut

    if (cfg.json) {

      cfg.body =
        JSON.stringify(cfg.json)

      cfg.headers = {
        "Content-Type":
          "application/json",
        ...cfg.headers
      }
    }

    if (!ep?.dev?.data) {
      try {

        const res = await fetch(url, {

          method:
            cfg.method || "GET",

          headers: {
            ...config.headers,
            ...cfg.headers
          },

          body: cfg.body,

          signal: cfg.signal,

          credentials:
            cfg.credentials
        })


        // raw mode

        if (cfg.parse === false) {

          return {
            ok: res.ok,
            status: res.status,
            data: null,
            error: res.ok
              ? null
              : new Error(
                "HTTP " + res.status
              ),
            response: res
          }
        }


        let data = null

        try {
          data = await res.json()
        } catch { }


        if (!res.ok) {

          return {
            ok: false,
            status: res.status,
            data,
            error: new Error(
              "HTTP " + res.status
            ),
            response: res
          }
        }


        return {
          ok: true,
          status: res.status,
          data,
          error: null,
          response: res
        }

      } catch (e) {

        return {
          ok: false,
          status: 0,
          data: null,
          error: e,
          response: null
        }

      }
    }else{
      return ep.dev.data
    }

  }


  return {
    setProduction,
    setConfig,
    setEndpoint,
    call
  }

}