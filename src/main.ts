// =====================================================
// Project Dashboard - Standalone Bootstrap
//
// Migration Pass 3 (Data Layer + Access Probe). Host shell
// plus a TEMPORARY diagnostic probe - the application is
// mounted in a later migration pass.
// =====================================================

import "./css/host.css";

// =====================================================
// Project Dashboard Styles
//
// TEMPORARY location - same files and order as the PCF
// index.ts imports. Revisit when projectDashboard.ts is
// migrated.
// =====================================================

import "./css/application.css";
import "./css/dashboardShared.css";
import "./css/dashboardOne.css";
import "./css/dashboardTwo.css";
import "./css/dashboardThree.css";
import "./css/dashboardFour.css";
import "./css/dashboardFive.css";
import "./css/dashboardSix.css";
import "./css/dashboardTen.css";
import "./css/overlays.css";
import "./css/uploads.css";
import "./css/tabs.css";

import {
    runAccessProbe
} from "./diagnostics/accessProbe";

void runAccessProbe(
    document.querySelector<HTMLDivElement>(
        "#app"
    )!
);
