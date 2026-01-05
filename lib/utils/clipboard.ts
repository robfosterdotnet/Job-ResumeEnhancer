/**
 * Copy text to clipboard with fallback for older browsers and error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err)
    }
  }

  // Fallback to document.execCommand for older browsers or non-secure contexts
  try {
    const textArea = document.createElement("textarea")
    textArea.value = text

    // Make the textarea invisible but still selectable
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    textArea.style.opacity = "0"

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)

    if (!successful) {
      throw new Error("execCommand copy failed")
    }

    return true
  } catch (err) {
    console.error("All clipboard methods failed:", err)
    return false
  }
}
