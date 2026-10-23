import "server-only";

/**
 * Verifica que las URLs remotas de imágenes apunten realmente a una imagen.
 * Error típico: pegar el enlace de la *página* del producto
 * (text/html) en lugar de la dirección de la imagen (image/jpeg, image/png…).
 *
 * Devuelve un mensaje de error por la primera URL inválida, o null si todo
 * está bien. Si la red falla (timeout, proxy), no se bloquea el guardado.
 */
export async function findInvalidImageUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (!url.startsWith("https://")) continue; // rutas locales de /public

    let contentType: string | null = null;
    try {
      // GET en vez de HEAD: algunos servidores/CDN no responden bien a HEAD
      const res = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: "follow" });
      contentType = res.headers.get("content-type");
      await res.body?.cancel(); // no descargamos el archivo completo
      if (!res.ok) return `La imagen no existe o no es accesible (HTTP ${res.status}): ${url}`;
    } catch {
      continue; // sin conexión o timeout: no podemos verificar, se permite
    }

    if (contentType && !contentType.startsWith("image/")) {
      return (
        `El enlace no es una imagen sino una página web (${contentType.split(";")[0]}): ${url}. ` +
        `Abre la página, haz clic derecho sobre la foto y elige "Copiar dirección de imagen".`
      );
    }
  }
  return null;
}
