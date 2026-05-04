/**
 * Utility to handle file URLs correctly.
 * If the path is a full URL (starts with http), it returns it as-is.
 * Otherwise, it prepends a leading slash for local relative paths.
 */
export const getFileUrl = (path) => {
    if (!path) return null;
    // Check if path is already a full URL
    if (path.startsWith("http") || path.startsWith("//")) {
        return path;
    }
    // For legacy local files, ensure a leading slash
    return path.startsWith("/") ? path : `/${path}`;
};
