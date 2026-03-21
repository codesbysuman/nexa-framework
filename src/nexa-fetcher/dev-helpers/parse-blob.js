export async function parseBlob(fn) {

  const r = await fn()

  if (!r.ok) return r

  try {

    const blob =
      await r.response.blob()

    return {
      ...r,
      data: blob
    }

  } catch (e) {

    return {
      ...r,
      ok: false,
      error: e
    }

  }

}