export async function withTimeout(
  fn,
  ms = 5000
) {

  const c =
    new AbortController()

  const t =
    setTimeout(
      () => c.abort(),
      ms
    )

  try {

    return await fn(
      c.signal
    )

  } finally {

    clearTimeout(t)

  }
}