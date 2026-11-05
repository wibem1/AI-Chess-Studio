import metadata from '../package.json' with { type: 'json' };

/** Shared by the browser build and local server; update package.json for delivery. */
export const APP_VERSION = metadata.version;
