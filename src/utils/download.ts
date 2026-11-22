export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
  if (!payload) return new Blob([], { type: mime })
  if (meta.includes(';base64')) {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return new Blob([bytes], { type: mime })
  }
  return new Blob([decodeURIComponent(payload)], { type: mime })
}

export { downloadBlob } from './configFile'
