// =====================================================
// Dashboard Two Build Result
// =====================================================

export interface DashboardTwoBuildResult {
    Pass: boolean;
    Dashboard: HTMLDivElement | null;
    DataIsAvailable: boolean;
}

// =====================================================
// Build Dashboard Two
// =====================================================

export function buildDashboardTwo():
DashboardTwoBuildResult {

    const ctrDashboardTwo =
        document.createElement(
            "div"
        );

    ctrDashboardTwo.className =
        "project-dashboard-two";

    ctrDashboardTwo.style.display =
        "flex";

    ctrDashboardTwo.style.alignItems =
        "center";

    ctrDashboardTwo.style.justifyContent =
        "center";

    ctrDashboardTwo.style.width =
        "100%";

    ctrDashboardTwo.style.height =
        "100%";

    ctrDashboardTwo.textContent =
        "1";

    ctrDashboardTwo.style.fontSize =
        "100px";

    return {
        Pass:
            true,

        Dashboard:
            ctrDashboardTwo,

        DataIsAvailable:
            true
    };

}

// =====================================================
// Kill Dashboard Two
//
// Dashboard Two currently owns no resources that require
// explicit cleanup.
// =====================================================

export function processKillDashboardTwo():
void {

    console.log(
        "[DashboardTwo] ENTER processKillDashboardTwo"
    );

    console.log(
        "[DashboardTwo] EXIT processKillDashboardTwo"
    );

}