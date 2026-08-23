export function imageUrl(image) {
  if (typeof image === 'string') return image
  return image?.url || ''
}
