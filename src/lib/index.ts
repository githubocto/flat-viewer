const COMMIT_META_REGEXP = /\n(.*)/s;
const COMMIT_MESSAGE_REGEXP = /^[^\(]+/;

interface FlatFileMeta {
  name: string;
  deltaBytes: number;
  date: Date;
  source?: string;
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

export interface GridState {
  filters: FilterMap<FilterValue>;
  sort: string[];
  stickyColumnName?: string;
}

export type FilterValue = string | number | [number, number];
export type FilterMap<T> = Record<string, T>;

export function getFiltersAsString(filters: Record<string, FilterValue>) {
  return encodeURI(
    Object.keys(filters)
      .map((columnName) => {
        const value = filters[columnName];
        return [
          columnName,
          typeof value === "string"
            ? value
            : Array.isArray(value)
            ? value.join(",")
            : "",
        ].join("=");
      })
      .join("&")
  );
}
