// This file helps TypeScript understand the Deno environment used by Supabase Edge Functions.

// By referencing the Deno service worker types, we get access to the global 'Deno' object
// and other web-standard APIs available in the Edge Function runtime.
/// <reference types="https://deno.land/x/service_worker@0.1.0/lib.d.ts" />

// This is a broad declaration to tell TypeScript that any import from an https:// URL
// is valid. This stops the "Cannot find module" errors. While it doesn't provide
// specific types for each module, it allows the code to compile without errors in a
// standard TypeScript environment.
declare module 'https://*';