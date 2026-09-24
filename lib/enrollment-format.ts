export function formatPhone(value: string) {
  const local = value.replace(/\D/g, "").replace(/^258/, "").slice(0, 9)
  return [local.slice(0, 2), local.slice(2, 5), local.slice(5, 9)]
    .filter(Boolean)
    .join(" ")
}

export function formatBi(value: string) {
  let result = ""
  for (const character of value.toUpperCase()) {
    if (result.length < 12 && /[0-9]/.test(character)) result += character
    else if (result.length === 12 && /[A-Z]/.test(character))
      result += character
    if (result.length === 13) break
  }
  return result
}
