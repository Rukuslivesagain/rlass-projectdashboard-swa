// =====================================================
// Dashboard Two Build Result
// =====================================================

export interface DashboardThreeBuildResult {
    Pass: boolean;
    Dashboard: HTMLDivElement | null;
    DataIsAvailable: boolean;
}

// =====================================================
// Build Dashboard Two
// =====================================================

export function buildDashboardThree():
DashboardThreeBuildResult {

    const ctrDashboardThree =
        document.createElement(
            "div"
        );

    ctrDashboardThree.className =
        "project-dashboard-two";

    ctrDashboardThree.style.display =
        "flex";

    ctrDashboardThree.style.alignItems =
        "center";

    ctrDashboardThree.style.justifyContent =
        "center";

    ctrDashboardThree.style.width =
        "100%";

    ctrDashboardThree.style.height =
        "100%";

    ctrDashboardThree.textContent =
        "2";

    ctrDashboardThree.style.fontSize =
        "100px";

    return {
        Pass:
            true,

        Dashboard:
            ctrDashboardThree,

        DataIsAvailable:
            true
    };

}

// =====================================================
// Kill Dashboard Three
//
// Dashboard Three currently owns no resources that require
// explicit cleanup.
// =====================================================

export function processKillDashboardThree():
void {

    console.log(
        "[DashboardThree] ENTER processKillDashboardThree"
    );

    console.log(
        "[DashboardThree] EXIT processKillDashboardThree"
    );

}