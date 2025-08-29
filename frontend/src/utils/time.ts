export const formatElapsedTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  const months = Math.floor(days / 30)
  const remainingDays = days % 30
  return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`
}
