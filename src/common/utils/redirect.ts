/**
 * Using this redirection allows us to easily mock the redirect function in tests.
 * @param url The URL to redirect to.
 */
export default function redirect(url: string): void {
  window.location.href = url;
}
