export async function parseForm(fn) {

  const r = await fn()

  if (!r.ok) return r

  try {

    const form =
      await r.response.formData()

    return {
      ...r,
      data: form
    }

  } catch (e) {

    return {
      ...r,
      ok: false,
      error: e
    }

  }

}