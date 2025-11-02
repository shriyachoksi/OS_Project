const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// In packaged app, __dirname points inside app.asar, so go up to the app root
const basePath = app.isPackaged
  ? path.join(process.resourcesPath, ".env.production")
  : path.join(__dirname, ".env.local");

dotenv.config({ path: basePath });

// Ensure keys are available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "FATAL: Missing Supabase environment variables. Check .env.local."
  );
  // Quit the app if security keys are missing
  app.quit();
}

// Initialize Supabase client using the secure Service Role Key
const supabaseServiceRole = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: "EduTrack - Student Portal",
    webPreferences: {
      // Use the preload script to securely bridge Node/Electron APIs to the renderer
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the built index.html from the Next.js 'out' directory
  //
  mainWindow.loadURL("http://localhost:3000");

  // mainWindow.loadURL(startUrl);

  // Open the DevTools on initial load (optional for development)
  // mainWindow.webContents.openDevTools();
}

// 2. IPC Handlers to replace Next.js API Routes

// Handler for /api/create-profile functionality
ipcMain.handle("supabase:create-profile", async (event, user) => {
  const payload = [
    {
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata && user.user_metadata.full_name) || null,
    },
  ];

  try {
    // Perform upsert using the Service Role Key
    const { data, error } = await supabaseServiceRole
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.error("Error creating profile via IPC:", error);
      return { error: error.message };
    }
    return { data };
  } catch (err) {
    return { error: String(err) };
  }
});

// Handler for /api/delete-attendance functionality (soft delete)
ipcMain.handle("supabase:delete-attendance", async (event, id) => {
  try {
    const { data, error } = await supabaseServiceRole
      .from("attendance")
      .update({ status: "removed" }) // Soft-delete logic
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error soft-deleting attendance via IPC:", error);
      return { error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { error: String(err) };
  }
});

// This method will be called when Electron has finished initialization.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS, it's common to re-create a window in the app when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
