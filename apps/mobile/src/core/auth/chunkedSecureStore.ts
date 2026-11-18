import * as SecureStore from 'expo-secure-store'
import * as zod from 'zod'

const MAX_CHUNK_CHARACTERS = 1024

const storeOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

const manifestSchema = zod.object({
  chunkCount: zod.number().int().nonnegative(),
  length: zod.number().int().nonnegative(),
})

type Manifest = zod.infer<typeof manifestSchema>

const manifestKey = (key: string) => `${key}.manifest`
const chunkKey = (key: string, index: number) => `${key}.chunk${index}`

async function readManifest(key: string): Promise<Manifest | null> {
  const rawManifest = await SecureStore.getItemAsync(manifestKey(key))
  if (rawManifest === null) return null
  try {
    const result = manifestSchema.safeParse(JSON.parse(rawManifest))
    return result.success ? result.data : null
  } catch (_error) {
    return null
  }
}

async function deleteChunks(key: string, fromIndex: number, toIndex: number) {
  const indexes = Array.from(
    { length: Math.max(toIndex - fromIndex, 0) },
    (_, offset) => fromIndex + offset,
  )
  await Promise.all(
    indexes.map((index) => SecureStore.deleteItemAsync(chunkKey(key, index))),
  )
}

export const chunkedSecureStore = {
  async getItem(key: string) {
    const manifest = await readManifest(key)
    if (manifest === null) return null

    const indexes = Array.from(
      { length: manifest.chunkCount },
      (_, index) => index,
    )
    const chunks = await Promise.all(
      indexes.map((index) => SecureStore.getItemAsync(chunkKey(key, index))),
    )
    if (chunks.some((chunk) => chunk === null)) return null

    const value = chunks.join('')
    return value.length === manifest.length ? value : null
  },

  async setItem(key: string, value: string) {
    const previousManifest = await readManifest(key)
    const chunkCount = Math.ceil(value.length / MAX_CHUNK_CHARACTERS)

    for (let index = 0; index < chunkCount; index += 1) {
      const start = index * MAX_CHUNK_CHARACTERS
      await SecureStore.setItemAsync(
        chunkKey(key, index),
        value.slice(start, start + MAX_CHUNK_CHARACTERS),
        storeOptions,
      )
    }
    const manifest: Manifest = { chunkCount, length: value.length }
    await SecureStore.setItemAsync(
      manifestKey(key),
      JSON.stringify(manifest),
      storeOptions,
    )

    if (previousManifest) {
      await deleteChunks(key, chunkCount, previousManifest.chunkCount)
    }
  },

  async removeItem(key: string) {
    const manifest = await readManifest(key)
    if (manifest) await deleteChunks(key, 0, manifest.chunkCount)
    await SecureStore.deleteItemAsync(manifestKey(key))
  },
}
