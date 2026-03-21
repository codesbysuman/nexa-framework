export async function logCall(
  fn,
  label = "call"
) {

  console.log(
    "[start]",
    label
  )

  try {

    const r =
      await fn()

    console.log(
      "[done]",
      label,
      r
    )

    return r

  } catch (e) {

    console.log(
      "[error]",
      label,
      e
    )

    throw e
  }
}