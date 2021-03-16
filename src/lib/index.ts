const COMMIT_META_REGEXP = /\n(.*)/s;
const COMMIT_MESSAGE_REGEXP = /^[^\(]+/;

interface FlatFileMeta {
  name: string;
  deltaBytes: number;
  date: Date;
}

interface FlatFileCollection {
  files: FlatFileMeta[];
}

export function parseFlatCommitMessage(message?: string) {
  if (!message) return;

  const messageMatch = message.match(COMMIT_MESSAGE_REGEXP);
  const metaMatch = message.match(COMMIT_META_REGEXP);

  if (!messageMatch) return;
  const extractedMessage = messageMatch[0].trim();

  if (!metaMatch) return;
  const parsed = JSON.parse(metaMatch[0]) as FlatFileCollection;

  return {
    message: extractedMessage,
    file: parsed.files[0],
  };
}
