export async function withDelay<T>(callback: () => T, delay = 250): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, delay))
  return callback()
}
