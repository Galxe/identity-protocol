// formatCode removes excessive newlines and trailing spaces.
export function formatCode(code: string) {
  return code
    .split("\n")
    .map(line => line.trimEnd())
    .reduce((acc, line) => {
      if (acc.endsWith("\n\n") && line === "") {
        return acc;
      }
      acc += line + "\n";
      return acc;
    }, "");
}
