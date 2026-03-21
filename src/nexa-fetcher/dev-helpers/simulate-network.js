export async function simulateNetwork(
  fn,
  {
    delay = 200,
    failRate = 0
  } = {}
) {

  await new Promise(r =>
    setTimeout(r, delay)
  )

  if (
    failRate &&
    Math.random() < failRate
  ) {
    throw new Error(
      "Simulated network error"
    )
  }

  return fn()
}