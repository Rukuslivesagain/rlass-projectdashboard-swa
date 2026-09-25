// =====================================================
// TEMPORARY - Standalone Migration Pass 6
//
// Type-only bridge that loads the global ComponentFramework
// namespace (dev dependency @types/powerapps-component-framework)
// so the landed PCF class in projectDashboard.ts and the copied
// generated/ManifestTypes.d.ts compile before the PCF boundary is
// removed. Required because tsconfig "types" is limited to
// vite/client, which suppresses automatic @types inclusion.
//
// No runtime code. Delete together with ManifestTypes.d.ts and the
// dev dependency when the PCF host boundary is removed.
// =====================================================

/// <reference types="powerapps-component-framework" />
