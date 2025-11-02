// This file extends the global Window interface for use with Electron's preload script.

export interface ElectronSupabase {
  /** Upserts user profile using the Supabase Service Role Key via IPC. */
  createProfile: (user: {
    id: string;
    email: string;
    user_metadata: { full_name: string };
  }) => Promise<{ data?: any; error?: string }>;

  /** Soft-deletes an attendance record using the Supabase Service Role Key via IPC. */
  deleteAttendance: (
    id: string
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
}

declare global {
  interface Window {
    electron: {
      supabase: ElectronSupabase;
    };
  }
}
