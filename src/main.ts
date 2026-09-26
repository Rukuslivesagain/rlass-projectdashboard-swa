// =====================================================
// Project Dashboard - Standalone Bootstrap
//
// Migration Pass 3 (Data Layer + Access Probe). Host shell
// plus a TEMPORARY diagnostic probe - the application is
// mounted in a later migration pass.
// =====================================================

import "./css/host.css";

import {
    runAccessProbe
} from "./diagnostics/accessProbe";

void runAccessProbe(
    document.querySelector<HTMLDivElement>(
        "#app"
    )!
);
