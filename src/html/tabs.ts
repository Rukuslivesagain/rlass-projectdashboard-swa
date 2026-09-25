import {
    UserDashboardTab
} from "../models/registries";

// =====================================================
// Tab Configuration
// =====================================================
export interface ProjectDashboardTabConfig {
    slot: number;
    name: string;
}

// =====================================================
// Build Tabs
// =====================================================

export function buildTabs(
    ctrTabsHeader:
        HTMLDivElement,

    defaultDashboardTabConfig:
        UserDashboardTab[],

    selectedSlot:
        number,

    getCurrentSelectedSlot:
        () => number,

    processTabChange:
        (
            slot:
                number
        ) => void,

    activeStateIsReady:
        boolean,

    mode:
        "Build" |
        "Click" |
        "DisableOnly" |
        "EnableOnly"
): void {

    switch (
        mode
    ) {

        // =====================================================
        // Build / Rebuild
        // =====================================================

        case "Build": {

            ctrTabsHeader.innerHTML =
                "";

            const resolvedSelectedSlot =
                selectedSlot ??
                    0;

            defaultDashboardTabConfig.forEach(
                tab => {

                    // =====================================================
                    // Skip Unassigned Tab
                    // =====================================================

                    if (
                        !tab.dashboardId
                    ) {

                        return;

                    }

                    // =====================================================
                    // Build Tab
                    // =====================================================

                    const btnTab =
                        document.createElement(
                            "button"
                        );

                    btnTab.type =
                        "button";

                    btnTab.className =
                        "project-dashboard-tabs-tab";

                    // =====================================================
                    // Set Tab Enabled State
                    // =====================================================

                    btnTab.disabled =
                        !activeStateIsReady;

                    btnTab.classList.toggle(
                        "application-disabled",
                        !activeStateIsReady
                    );

                    btnTab.dataset.tabIndex =
                        String(
                            tab.slot
                        );

                    btnTab.textContent =
                        tab.dashboardId;

                    // =====================================================
                    // Set Selected Tab
                    // =====================================================

                    if (
                        tab.slot ===
                            resolvedSelectedSlot
                    ) {

                        btnTab.classList.add(
                            "project-dashboard-tabs-tab-selected"
                        );

                    }

                    // =====================================================
                    // Tab Click
                    // =====================================================

                    btnTab.addEventListener(
                        "click",
                        () => {

                            // =====================================================
                            // Ignore Already Selected Tab
                            // =====================================================

                            if (
                                tab.slot ===
                                    getCurrentSelectedSlot()
                            ) {

                                return;

                            }


                            // =====================================================
                            // Process Tab Change
                            // =====================================================

                            buildTabs(
                                ctrTabsHeader,
                                defaultDashboardTabConfig,
                                tab.slot,
                                getCurrentSelectedSlot,
                                processTabChange,
                                activeStateIsReady,
                                "Click"
                            );

                        }
                    );

                    // =====================================================
                    // Assemble Tab
                    // =====================================================

                    ctrTabsHeader.appendChild(
                        btnTab
                    );

                }
            );

            break;

        }


        // =====================================================
        // Click
        // =====================================================

        case "Click": {

            ctrTabsHeader
                .querySelectorAll(
                    ".project-dashboard-tabs-tab"
                )
                .forEach(
                    tab => {

                        tab.classList.remove(
                            "project-dashboard-tabs-tab-selected"
                        );

                    }
                );

            ctrTabsHeader
                .querySelector(
                    `[data-tab-index="${selectedSlot}"]`
                )
                ?.classList.add(
                    "project-dashboard-tabs-tab-selected"
                );

            processTabChange(
                selectedSlot
            );

            break;

        }


        // =====================================================
        // Disable Only
        // =====================================================

        case "DisableOnly": {

            ctrTabsHeader
                .querySelectorAll<HTMLButtonElement>(
                    ".project-dashboard-tabs-tab"
                )
                .forEach(
                    tab => {

                        tab.disabled =
                            true;

                        tab.classList.add(
                            "application-disabled"
                        );

                    }
                );

            break;

        }


        // =====================================================
        // Enable Only
        // =====================================================

        case "EnableOnly": {

            ctrTabsHeader
                .querySelectorAll<HTMLButtonElement>(
                    ".project-dashboard-tabs-tab"
                )
                .forEach(
                    tab => {

                        tab.disabled =
                            false;

                        tab.classList.remove(
                            "application-disabled"
                        );

                    }
                );

            break;

        }

    }

}