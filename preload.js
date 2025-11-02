const { contextBridge, ipcRenderer } = require("electron");

/**
 * The preload script acts as a secure bridge, exposing IPC methods to the renderer process (your Next.js app)
 * without granting it full access to the Node.js or Electron API.
 */
contextBridge.exposeInMainWorld("electron", {
  supabase: {
    /**
     * Calls main process to upsert user profile using the Service Role Key.
     * @param {object} user - The Supabase user object containing id, email, and user_metadata.
     * @returns {Promise<{data?: any, error?: string}>}
     */
    createProfile: (user) =>
      ipcRenderer.invoke("supabase:create-profile", user),

    /**
     * Calls main process to soft-delete an attendance record using the Service Role Key.
     * @param {string} id - The ID of the attendance record to delete.
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    deleteAttendance: (id) =>
      ipcRenderer.invoke("supabase:delete-attendance", id),
  },
});
