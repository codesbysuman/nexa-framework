export async function parseText(fn) {

  const r = await fn()

  if (!r.ok) return r

  try {

    const text =
      await r.response.text()

    return {
      ...r,
      data: text
    }

  } catch (e) {

    return {
      ...r,
      ok: false,
      error: e
    }

  }

}