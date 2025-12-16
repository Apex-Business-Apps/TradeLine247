const GH_BLOB_BASE = "https://github.com/Apex-Business-Apps/TradeLine247/blob/main/";

export function toGithubBlobUrl(filePath: string) {
  const cleaned = filePath.replace(/^\/+/, "");
  const encoded = cleaned.split("/").map(encodeURIComponent).join("/");
  return `${GH_BLOB_BASE}${encoded}`;
}
