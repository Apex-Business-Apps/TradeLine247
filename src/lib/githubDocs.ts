const GH_BLOB_BASE = "https://github.com/Apex-Business-Apps/TradeLine247/blob/main/";
const GH_RAW_BASE = "https://raw.githubusercontent.com/Apex-Business-Apps/TradeLine247/main/";

function encodeRepoPath(repoPath: string) {
  const cleaned = repoPath.replace(/^\/+/, "");
  return cleaned.split("/").map(encodeURIComponent).join("/");
}

export function toGithubBlobUrl(repoPath: string) {
  return `${GH_BLOB_BASE}${encodeRepoPath(repoPath)}`;
}

export function toGithubRawUrl(repoPath: string) {
  return `${GH_RAW_BASE}${encodeRepoPath(repoPath)}`;
}
