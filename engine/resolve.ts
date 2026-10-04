// Placeholder resolution for values stored in the DB.
//
// Secrets and environment-specific values never live in the database.
// A document stores a placeholder like "env:SAUCEDEMO_USERNAME" and the
// engine substitutes the real value from process.env at execution time.
//
// Supported forms:
//   "env:NAME"                    -> process.env.NAME (whole value)
//   "env:API_URL/pet/find..."     -> leading env var + literal suffix
//   "literal text"                -> returned unchanged

const ENV_PREFIX = 'env:';

export function resolve(value: string): string {
  if (typeof value !== 'string' || !value.startsWith(ENV_PREFIX)) {
    return value;
  }

  const rest = value.slice(ENV_PREFIX.length);
  // The env var name runs until the first character that can't be in a name.
  const match = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)(.*)$/);
  if (!match) {
    return value;
  }

  const [, name, suffix] = match;
  const resolved = process.env[name];
  if (resolved === undefined) {
    throw new Error(
      `Environment variable "${name}" referenced by "${value}" is not set. Add it to your .env.`
    );
  }
  // Avoid a double slash when joining e.g. "http://host/" + "/pet".
  if (resolved.endsWith('/') && suffix.startsWith('/')) {
    return resolved + suffix.slice(1);
  }
  return resolved + suffix;
}
