import {
    plannedActivityDataStores,
    currentActivityDataStores
} from "../helpers/dataStores";

import {
    DashboardPhase,
    dashboardPhaseDefinitions,
    schedulePhaseToDashboardPhase
} from "../helpers/phases";

// =====================================================
// 1 - Dashboard One Profile
// =====================================================

export const dashboardOneProfile =
{
    DashboardId:
        0,

    DashboardName:
        "Overview"
};

// =====================================================
// 2 - Dashboard One Build Result
// =====================================================

export interface DashboardOneBuildResult {
    Pass: boolean;
    Dashboard: HTMLDivElement | null;
    DataIsAvailable: boolean;
}

// =====================================================
// 3 - Dashboard One Data Store One Record
// Project / phase schedule aggregation.
// Built from planned and current Task Dependent activity
// column stores.
// Used by the Project Phase Duration chart.
// =====================================================

interface DashboardOneDataStoreOneRecord {

    project:string;
    phase:DashboardPhase;
    rawPhases:Set<string>;
    plannedActivityCount:number;
    currentActivityCount:number;
    plannedStart?:string;
    plannedFinish?:string;
    currentStart?:string;
    currentFinish?:string;

}

// =====================================================
// 4 - Dashboard One Data Stores
// =====================================================

// =====================================================
// Data Store One
//
// Project / phase schedule aggregation.
//
// Source:
// - Planned Activity Column Stores
// - Current Activity Column Stores
//
// Required Columns:
// - activityType
// - project
// - cvxPhase
// - start
// - finish
//
// Use:
// - Groups Task Dependent activities by project and phase
// - Establishes planned/current phase start and finish
// - Drives the Project Phase Duration chart
// =====================================================

const dashboardOneDataStoreOne =
    new Map<
        string,
        DashboardOneDataStoreOneRecord
    >();

// =====================================================
// 5 - Dashboard One Runtime State
// =====================================================

const dashboardOneRuntimeState =
{
    layout:
        "Expanded" as
            "Collapsed" |
            "Expanded",

    showBaseline:
        false,

    showData:
        false,

    timeScale:
        "Day" as
            "Day" |
            "Week" |
            "Month",

    timelineBufferDays:
        3,

    dayCellWidth:
        24,

    visiblePhases:
        new Set<DashboardPhase>([
            DashboardPhase.PRE,
            DashboardPhase.SD,
            DashboardPhase.EXE,
            DashboardPhase.SU,
            DashboardPhase.POST
        ])
};

// =====================================================
// 6 - Dashboard One DOM References
// =====================================================

let ctrDashboardOneBodyLeftBody:
    HTMLDivElement;

let ctrDashboardOneBodyRight:
    HTMLDivElement;

let ctrDashboardOneBodyRightHeader:
    HTMLDivElement;

let ctrDashboardOneBodyRightBody:
    HTMLDivElement;

let ctrDashboardOneBodyRightFooter:
    HTMLDivElement;

let ctrDashboardOneTimelineMonth:
    HTMLDivElement;

let ctrDashboardOneTimelineDate:
    HTMLDivElement;

// =====================================================
// 7 - Build Dashboard One
// =====================================================

export function buildDashboardOne():
DashboardOneBuildResult {

    console.log(
        "[DashboardOne] Build started"
    );

    // =====================================================
    // Build Dashboard One Data
    // =====================================================

    processBuildDataStoreOne();

    // =====================================================
    // Dashboard One Container
    // =====================================================

    const ctrDashboardOne =
        document.createElement(
            "div"
        );

    ctrDashboardOne.className =
        "project-dashboard-one";

    // =====================================================
    // Dashboard One Header
    // =====================================================

    const ctrDashboardOneHeader =
        document.createElement(
            "div"
        );

    ctrDashboardOneHeader.className =
        "project-dashboard-one-header";

    // =====================================================
    // Dashboard One Body
    // =====================================================

    const ctrDashboardOneBody =
        document.createElement(
            "div"
        );

    ctrDashboardOneBody.className =
        "project-dashboard-one-body";

    // =====================================================
    // Dashboard One Body Left
    // =====================================================

    const ctrDashboardOneBodyLeft =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeft.className =
        "project-dashboard-one-body-left";

    // =====================================================
    // Dashboard One Body Left Header
    // =====================================================

    const ctrDashboardOneBodyLeftHeader =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeftHeader.className =
        "project-dashboard-one-body-left-header";

    const ctrDashboardOneBodyLeftHeaderTitle =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeftHeaderTitle.className =
        "project-dashboard-one-body-left-header-title";

    ctrDashboardOneBodyLeftHeaderTitle.textContent =
        "Projects";

    ctrDashboardOneBodyLeftHeader.appendChild(
        ctrDashboardOneBodyLeftHeaderTitle
    );

    // =====================================================
    // Dashboard One Body Left Body
    // Vertical Scroll Owner
    // =====================================================

    ctrDashboardOneBodyLeftBody =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeftBody.className =
        "project-dashboard-one-body-left-body";

    // =====================================================
    // Dashboard One Body Left Footer
    // =====================================================

    const ctrDashboardOneBodyLeftFooter =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeftFooter.className =
        "project-dashboard-one-body-left-footer";

    // =====================================================
    // Assemble Dashboard One Body Left
    // =====================================================

    ctrDashboardOneBodyLeft.append(
        ctrDashboardOneBodyLeftHeader,
        ctrDashboardOneBodyLeftBody,
        ctrDashboardOneBodyLeftFooter
    );

    // =====================================================
    // Dashboard One Body Right
    // Horizontal Scroll Owner
    // =====================================================

    ctrDashboardOneBodyRight =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyRight.className =
        "project-dashboard-one-body-right";

    // =====================================================
    // Dashboard One Body Right Header
    // Timeline Header Region
    // =====================================================

    ctrDashboardOneBodyRightHeader =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyRightHeader.className =
        "project-dashboard-one-body-right-header";

    // =====================================================
    // Dashboard One Timeline Month
    // =====================================================

    ctrDashboardOneTimelineMonth =
        document.createElement(
            "div"
        );

    ctrDashboardOneTimelineMonth.className =
        "project-dashboard-one-timeline-month";

    // =====================================================
    // Dashboard One Timeline Date
    // =====================================================

    ctrDashboardOneTimelineDate =
        document.createElement(
            "div"
        );

    ctrDashboardOneTimelineDate.className =
        "project-dashboard-one-timeline-date";

    // =====================================================
    // Assemble Dashboard One Body Right Header
    // =====================================================

    ctrDashboardOneBodyRightHeader.append(
        ctrDashboardOneTimelineMonth,
        ctrDashboardOneTimelineDate
    );

    // =====================================================
    // Dashboard One Body Right Body
    // Vertical Scroll Owner
    // =====================================================

    ctrDashboardOneBodyRightBody =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyRightBody.className =
        "project-dashboard-one-body-right-body";

    // =====================================================
    // Dashboard One Body Right Footer
    // =====================================================

    ctrDashboardOneBodyRightFooter =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyRightFooter.className =
        "project-dashboard-one-body-right-footer";

    // =====================================================
    // Assemble Dashboard One Body Right
    // =====================================================

    ctrDashboardOneBodyRight.append(
        ctrDashboardOneBodyRightHeader,
        ctrDashboardOneBodyRightBody,
        ctrDashboardOneBodyRightFooter
    );

    // =====================================================
    // Synchronize Vertical Scroll
    // Left Body <-> Right Body
    // =====================================================

    let isSynchronizingVerticalScroll =
        false;

    ctrDashboardOneBodyLeftBody.addEventListener(
        "scroll",
        () => {

            if (
                isSynchronizingVerticalScroll
            ) {

                return;

            }

            isSynchronizingVerticalScroll =
                true;

            ctrDashboardOneBodyRightBody.scrollTop =
                ctrDashboardOneBodyLeftBody.scrollTop;

            isSynchronizingVerticalScroll =
                false;

        }
    );

    ctrDashboardOneBodyRightBody.addEventListener(
        "scroll",
        () => {

            if (
                isSynchronizingVerticalScroll
            ) {

                return;

            }

            isSynchronizingVerticalScroll =
                true;

            ctrDashboardOneBodyLeftBody.scrollTop =
                ctrDashboardOneBodyRightBody.scrollTop;

            isSynchronizingVerticalScroll =
                false;

        }
    );


    // =====================================================
    // Assemble Dashboard One Body
    // =====================================================

    ctrDashboardOneBody.append(
        ctrDashboardOneBodyLeft,
        ctrDashboardOneBodyRight
    );

    // =====================================================
    // Dashboard One Footer
    // =====================================================

    const ctrDashboardOneFooter =
        document.createElement(
            "div"
        );

    ctrDashboardOneFooter.className =
        "project-dashboard-one-footer";

    // =====================================================
    // Assemble Dashboard One
    // =====================================================

    ctrDashboardOne.append(
        ctrDashboardOneHeader,
        ctrDashboardOneBody,
        ctrDashboardOneFooter
    );

    // =====================================================
    // Render Dashboard One
    // =====================================================

    processRenderProjectPhaseDurationChart();

    console.log(
        "[DashboardOne] Build complete"
    );

    // =====================================================
    // Return Dashboard One
    // =====================================================

    return {
        Pass:
            true,

        Dashboard:
            ctrDashboardOne,

        DataIsAvailable:
            dashboardOneDataStoreOne.size >
                0
    };

}

// =====================================================
// 8 - Process Build Data Store One
// =====================================================

function processBuildDataStoreOne():
void {

    console.log(
        "[DashboardOne] ENTER processBuildDataStoreOne"
    );

    dashboardOneDataStoreOne.clear();

    // =====================================================
    // Get Required Planned Activity Columns
    // =====================================================

    const plannedActivityTypeDataStore =
        plannedActivityDataStores.get(
            "aa_tblP6Act_activity_type"
        );

    const plannedProjectDataStore =
        plannedActivityDataStores.get(
            "aa_tblP6Act_prjc_project"
        );

    const plannedPhaseDataStore =
        plannedActivityDataStores.get(
            "aa_tblP6Act_cvx_phase"
        );

    const plannedStartDataStore =
        plannedActivityDataStores.get(
            "aa_tblP6Act_start"
        );

    const plannedFinishDataStore =
        plannedActivityDataStores.get(
            "aa_tblP6Act_finish"
        );

    // =====================================================
    // Validate Required Planned Activity Columns
    // =====================================================

    if (
        !plannedActivityTypeDataStore ||
        !plannedProjectDataStore ||
        !plannedPhaseDataStore ||
        !plannedStartDataStore ||
        !plannedFinishDataStore
    ) {

        throw new Error(
            "[DashboardOne] Required planned activity columns are not available"
        );

    }

    // =====================================================
    // Get Required Current Activity Columns
    // =====================================================

    const currentActivityTypeDataStore =
        currentActivityDataStores.get(
            "aa_tblP6Act_activity_type"
        );

    const currentProjectDataStore =
        currentActivityDataStores.get(
            "aa_tblP6Act_prjc_project"
        );

    const currentPhaseDataStore =
        currentActivityDataStores.get(
            "aa_tblP6Act_cvx_phase"
        );

    const currentStartDataStore =
        currentActivityDataStores.get(
            "aa_tblP6Act_start"
        );

    const currentFinishDataStore =
        currentActivityDataStores.get(
            "aa_tblP6Act_finish"
        );

    // =====================================================
    // Validate Required Current Activity Columns
    // =====================================================

    if (
        !currentActivityTypeDataStore ||
        !currentProjectDataStore ||
        !currentPhaseDataStore ||
        !currentStartDataStore ||
        !currentFinishDataStore
    ) {

        throw new Error(
            "[DashboardOne] Required current activity columns are not available"
        );

    }

    // =====================================================
    // Build Planned Project / Phase Data
    // =====================================================

    for (
        const [
            rowKey,
            activityTypeValue
        ]
        of plannedActivityTypeDataStore
    ) {

        const activityType =
            String(
                activityTypeValue ??
                    ""
            );

        if (
            activityType !==
                "Task Dependent"
        ) {

            continue;

        }

        const project =
            String(
                plannedProjectDataStore.get(
                    rowKey
                ) ??
                    ""
            ).trim() ||
            "Unassigned";

        const rawPhase =
            String(
                plannedPhaseDataStore.get(
                    rowKey
                ) ??
                    ""
            ).trim();

        const phase =
            schedulePhaseToDashboardPhase.get(
                rawPhase
            ) ??
            null;

        if (
            !phase
        ) {

            continue;

        }

        const start =
            String(
                plannedStartDataStore.get(
                    rowKey
                ) ??
                    ""
            );

        const finish =
            String(
                plannedFinishDataStore.get(
                    rowKey
                ) ??
                    ""
            );

        const key =
            `${project}|${phase}`;

        let phaseRecord =
            dashboardOneDataStoreOne.get(
                key
            );

        if (
            !phaseRecord
        ) {

            phaseRecord =
            {
                project:
                    project,

                phase:
                    phase,

                rawPhases:
                    new Set<string>(),

                plannedActivityCount:
                    0,

                currentActivityCount:
                    0
            };

            dashboardOneDataStoreOne.set(
                key,
                phaseRecord
            );

        }

        phaseRecord.rawPhases.add(
            rawPhase
        );

        phaseRecord.plannedActivityCount++;

        if (
            start &&
            (
                !phaseRecord.plannedStart ||
                start <
                    phaseRecord.plannedStart
            )
        ) {

            phaseRecord.plannedStart =
                start;

        }

        if (
            finish &&
            (
                !phaseRecord.plannedFinish ||
                finish >
                    phaseRecord.plannedFinish
            )
        ) {

            phaseRecord.plannedFinish =
                finish;

        }

    }

    // =====================================================
    // Build Current Project / Phase Data
    // =====================================================

    for (
        const [
            rowKey,
            activityTypeValue
        ]
        of currentActivityTypeDataStore
    ) {

        const activityType =
            String(
                activityTypeValue ??
                    ""
            );

        if (
            activityType !==
                "Task Dependent"
        ) {

            continue;

        }

        const project =
            String(
                currentProjectDataStore.get(
                    rowKey
                ) ??
                    ""
            ).trim() ||
            "Unassigned";

        const rawPhase =
            String(
                currentPhaseDataStore.get(
                    rowKey
                ) ??
                    ""
            ).trim();

        const phase =
            schedulePhaseToDashboardPhase.get(
                rawPhase
            ) ??
            null;

        if (
            !phase
        ) {

            continue;

        }

        const start =
            String(
                currentStartDataStore.get(
                    rowKey
                ) ??
                    ""
            );

        const finish =
            String(
                currentFinishDataStore.get(
                    rowKey
                ) ??
                    ""
            );

        const key =
            `${project}|${phase}`;

        let phaseRecord =
            dashboardOneDataStoreOne.get(
                key
            );

        if (
            !phaseRecord
        ) {

            phaseRecord =
            {
                project:
                    project,

                phase:
                    phase,

                rawPhases:
                    new Set<string>(),

                plannedActivityCount:
                    0,

                currentActivityCount:
                    0
            };

            dashboardOneDataStoreOne.set(
                key,
                phaseRecord
            );

        }

        phaseRecord.rawPhases.add(
            rawPhase
        );

        phaseRecord.currentActivityCount++;

        if (
            start &&
            (
                !phaseRecord.currentStart ||
                start <
                    phaseRecord.currentStart
            )
        ) {

            phaseRecord.currentStart =
                start;

        }

        if (
            finish &&
            (
                !phaseRecord.currentFinish ||
                finish >
                    phaseRecord.currentFinish
            )
        ) {

            phaseRecord.currentFinish =
                finish;

        }

    }

    // =====================================================
    // Inspect Data Store One
    // =====================================================

    console.log(
        "[DashboardOne] Data Store One Built:",
        {
            records:
                dashboardOneDataStoreOne.size,

            projects:
                new Set(
                    Array.from(
                        dashboardOneDataStoreOne.values()
                    ).map(
                        record =>
                            record.project
                    )
                ).size
        }
    );

    console.log(
        "[DashboardOne] EXIT processBuildDataStoreOne"
    );

}

// =====================================================
// 9 - Render Project Phase Duration Chart
// =====================================================

function processRenderProjectPhaseDurationChart():
void {

    const dashBoardOneRuntimeState =
        dashboardOneRuntimeState;


    // =====================================================
    // Clear Dashboard One Render Containers
    // =====================================================

    ctrDashboardOneBodyRightBody.replaceChildren();

    ctrDashboardOneBodyLeftBody.replaceChildren();

    ctrDashboardOneTimelineMonth.replaceChildren();

    ctrDashboardOneTimelineDate.replaceChildren();


    const phases =
        Array.from(
            dashboardOneDataStoreOne.values()
        )
        .filter(
            phase =>
                dashBoardOneRuntimeState.visiblePhases.has(
                    phase.phase
                )
        );

    if (
        phases.length ===
            0
    ) {

        return;

    }


    // =====================================================
    // Resolve Visible Phase Tracks
    // =====================================================

    const visiblePhaseTracks =
        new Map<
            DashboardPhase,
            number
        >();

    const visiblePhaseDefinitions =
        Object.values(
            dashboardPhaseDefinitions
        )
        .filter(
            phaseDefinition =>
                dashBoardOneRuntimeState.visiblePhases.has(
                    phaseDefinition.phase
                )
        )
        .sort(
            (
                a,
                b
            ) =>
                a.index -
                b.index
        );

    visiblePhaseDefinitions.forEach(
        (
            phaseDefinition,
            index
        ) => {

            visiblePhaseTracks.set(
                phaseDefinition.phase,
                index
            );

        }
    );


    const phaseTrackHeight =
        22;

    const phaseTrackGap =
        4;

    const visiblePhaseTrackCount =
        Math.max(
            visiblePhaseDefinitions.length,
            1
        );

    const timelineHeight =
        (
            visiblePhaseTrackCount *
            phaseTrackHeight
        ) +
        (
            (
                visiblePhaseTrackCount -
                1
            ) *
            phaseTrackGap
        ) +
        10;

    const projectRowHeight =
        timelineHeight +
        8;


    // =====================================================
    // Determine Global Timeline
    // =====================================================

    const starts =
        phases
            .flatMap(
                phase => [
                    phase.currentStart,

                    dashBoardOneRuntimeState.showBaseline
                        ? phase.plannedStart
                        : undefined
                ]
            )
            .filter(
                (
                    value
                ): value is string =>
                    !!value
            );

    const finishes =
        phases
            .flatMap(
                phase => [
                    phase.currentFinish,

                    dashBoardOneRuntimeState.showBaseline
                        ? phase.plannedFinish
                        : undefined
                ]
            )
            .filter(
                (
                    value
                ): value is string =>
                    !!value
            );


    if (
        starts.length ===
            0 ||
        finishes.length ===
            0
    ) {

        return;

    }


    // =====================================================
    // Apply Timeline Buffer
    // =====================================================

    const oneDayMilliseconds =
        24 *
        60 *
        60 *
        1000;

    const timelineStart =
        Math.min(
            ...starts.map(
                value =>
                    new Date(
                        value
                    ).getTime()
            )
        ) -
        (
            dashBoardOneRuntimeState.timelineBufferDays *
            oneDayMilliseconds
        );

    const timelineFinish =
        Math.max(
            ...finishes.map(
                value =>
                    new Date(
                        value
                    ).getTime()
            )
        ) +
        (
            dashBoardOneRuntimeState.timelineBufferDays *
            oneDayMilliseconds
        );


    // =====================================================
    // Resolve Timeline Dates
    // =====================================================

    const timelineStartDate =
        new Date(
            timelineStart
        );

    timelineStartDate.setHours(
        0,
        0,
        0,
        0
    );

    const timelineFinishDate =
        new Date(
            timelineFinish
        );

    timelineFinishDate.setHours(
        0,
        0,
        0,
        0
    );


    const timelineStartUtc =
        Date.UTC(
            timelineStartDate.getFullYear(),
            timelineStartDate.getMonth(),
            timelineStartDate.getDate()
        );

    const timelineFinishUtc =
        Date.UTC(
            timelineFinishDate.getFullYear(),
            timelineFinishDate.getMonth(),
            timelineFinishDate.getDate()
        );

    const timelineDayCount =
        Math.floor(
            (
                timelineFinishUtc -
                timelineStartUtc
            ) /
            oneDayMilliseconds
        ) +
        1;


    // =====================================================
    // Resolve Daily Timeline Width
    // =====================================================

    const availableTimelineWidth =
        ctrDashboardOneBodyRight.clientWidth;

    const fittedDayCellWidth =
        availableTimelineWidth /
        timelineDayCount;

    const dayCellWidth =
        Math.max(
            dashBoardOneRuntimeState.dayCellWidth,
            fittedDayCellWidth
        );


    // =====================================================
    // Build Timeline Date Row
    // =====================================================

    for (
        let date =
            new Date(
                timelineStartDate
            );

        date <=
            timelineFinishDate;

        date.setDate(
            date.getDate() +
            1
        )
    ) {

        const ctrDashboardOneTimelineDateCell =
            document.createElement(
                "div"
            );

        ctrDashboardOneTimelineDateCell.className =
            "project-dashboard-one-timeline-date-cell";

        ctrDashboardOneTimelineDateCell.style.width =
            `${dayCellWidth}px`;

        ctrDashboardOneTimelineDateCell.style.minWidth =
            `${dayCellWidth}px`;

        ctrDashboardOneTimelineDateCell.style.flexBasis =
            `${dayCellWidth}px`;

        ctrDashboardOneTimelineDateCell.textContent =
            String(
                date.getDate()
            );

        ctrDashboardOneTimelineDate.appendChild(
            ctrDashboardOneTimelineDateCell
        );

    }


    // =====================================================
    // Build Timeline Month Row
    // =====================================================

    let monthStartDate =
        new Date(
            timelineStartDate
        );

    while (
        monthStartDate <=
            timelineFinishDate
    ) {

        const monthYear =
            monthStartDate.getFullYear();

        const monthIndex =
            monthStartDate.getMonth();

        const monthEndDate =
            new Date(
                monthYear,
                monthIndex + 1,
                0
            );

        const visibleMonthEndDate =
            monthEndDate <
                timelineFinishDate
                ? monthEndDate
                : timelineFinishDate;

        const visibleMonthStartUtc =
            Date.UTC(
                monthStartDate.getFullYear(),
                monthStartDate.getMonth(),
                monthStartDate.getDate()
            );

        const visibleMonthEndUtc =
            Date.UTC(
                visibleMonthEndDate.getFullYear(),
                visibleMonthEndDate.getMonth(),
                visibleMonthEndDate.getDate()
            );

        const visibleDayCount =
            Math.floor(
                (
                    visibleMonthEndUtc -
                    visibleMonthStartUtc
                ) /
                oneDayMilliseconds
            ) +
            1;


        const ctrMonthCell =
            document.createElement(
                "div"
            );

        ctrMonthCell.className =
            "project-dashboard-one-timeline-month-cell";

        ctrMonthCell.style.width =
            `${
                visibleDayCount *
                dayCellWidth
            }px`;

        ctrMonthCell.style.minWidth =
            `${
                visibleDayCount *
                dayCellWidth
            }px`;

        ctrMonthCell.textContent =
            monthStartDate.toLocaleString(
                "en-US",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );

        ctrDashboardOneTimelineMonth.appendChild(
            ctrMonthCell
        );


        monthStartDate =
            new Date(
                monthYear,
                monthIndex + 1,
                1
            );

    }


    const timelineWidth =
        timelineDayCount *
        dayCellWidth;

    // =====================================================
    // Apply Timeline Width To Right Structure
    // =====================================================

    ctrDashboardOneBodyRightHeader.style.width =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightHeader.style.minWidth =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightBody.style.width =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightBody.style.minWidth =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightFooter.style.width =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightFooter.style.minWidth =
        `${timelineWidth}px`;


    // =====================================================
    // Group Phases By Project
    // =====================================================

    const projects =
        new Map<
            string,
            DashboardOneDataStoreOneRecord[]
        >();

    for (
        const phase
        of phases
    ) {

        let projectPhases =
            projects.get(
                phase.project
            );

        if (
            !projectPhases
        ) {

            projectPhases =
                [];

            projects.set(
                phase.project,
                projectPhases
            );

        }

        projectPhases.push(
            phase
        );

    }


    // =====================================================
    // Project Details Container
    // =====================================================

    const ctrDashboardOneBodyLeftDetails =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyLeftDetails.className =
        "project-dashboard-one-project-details";


    // =====================================================
    // Gantt Container
    // =====================================================

    const ctrDashboardOneBodyRightGantt =
        document.createElement(
            "div"
        );

    ctrDashboardOneBodyRightGantt.className =
        "project-dashboard-one-body-right-gantt";

    ctrDashboardOneBodyRightGantt.style.width =
        `${timelineWidth}px`;

    ctrDashboardOneBodyRightGantt.style.minWidth =
        `${timelineWidth}px`;


    // =====================================================
    // Project Rows
    // =====================================================

    for (
        const [
            projectName,
            projectPhases
        ]
        of projects
    ) {

        const ctrDashboardOneBodyRightGanttRow =
            document.createElement(
                "div"
            );

        ctrDashboardOneBodyRightGanttRow.className =
            "project-dashboard-one-body-right-gantt-row";


        const ctrDashboardOneBodyLeftDetailsRow =
            document.createElement(
                "div"
            );

        ctrDashboardOneBodyLeftDetailsRow.className =
            "project-dashboard-one-body-left-details-row";


        ctrDashboardOneBodyRightGanttRow.style.height =
            `${projectRowHeight}px`;

        ctrDashboardOneBodyLeftDetailsRow.style.height =
            `${projectRowHeight}px`;


        const ctrDashboardOneBodyLeftDetailsRowLabel =
            document.createElement(
                "div"
            );

        ctrDashboardOneBodyLeftDetailsRowLabel.className =
            "project-dashboard-one-body-left-details-row-label";

        ctrDashboardOneBodyLeftDetailsRowLabel.textContent =
            projectName;

        ctrDashboardOneBodyLeftDetailsRow.appendChild(
            ctrDashboardOneBodyLeftDetailsRowLabel
        );


        const ctrDashboardOneBodyRightGanttRowTimeline =
            document.createElement(
                "div"
            );

        ctrDashboardOneBodyRightGanttRowTimeline.className =
            "project-dashboard-one-body-right-gantt-row-timeline";

        ctrDashboardOneBodyRightGanttRowTimeline.style.height =
            `${timelineHeight}px`;


        projectPhases.sort(
            (
                a,
                b
            ) =>
                (
                    dashboardPhaseDefinitions[
                        a.phase
                    ]?.index ??
                    999
                ) -
                (
                    dashboardPhaseDefinitions[
                        b.phase
                    ]?.index ??
                    999
                )
        );


        // =====================================================
        // Phase Bars
        // =====================================================

        for (
            const phase
            of projectPhases
        ) {

            const phaseTrackIndex =
                visiblePhaseTracks.get(
                    phase.phase
                );

            if (
                phaseTrackIndex ===
                    undefined
            ) {

                continue;

            }

            const phaseTop =
                5 +
                (
                    phaseTrackIndex *
                    (
                        phaseTrackHeight +
                        phaseTrackGap
                    )
                );


            // =====================================================
            // Planned / Baseline
            // =====================================================

            if (
                dashBoardOneRuntimeState.showBaseline &&
                phase.plannedStart &&
                phase.plannedFinish
            ) {

                const start =
                    new Date(
                        phase.plannedStart
                    ).getTime();

                const finish =
                    new Date(
                        phase.plannedFinish
                    ).getTime();


                const ctrDashboardOneBodyRightGanttRowTimelineBar =
                    document.createElement(
                        "div"
                    );

                ctrDashboardOneBodyRightGanttRowTimelineBar.className =
                    "project-dashboard-one-body-right-gantt-row-timeline-bar project-dashboard-one-body-right-gantt-row-timeline-bar-planned";

                ctrDashboardOneBodyRightGanttRowTimelineBar.classList.add(
                    `project-dashboard-one-body-right-gantt-row-timeline-bar-phase-${
                        dashboardPhaseDefinitions[
                            phase.phase
                        ].cssClass
                    }`
                );

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.top =
                    `${phaseTop}px`;


                // =====================================================
                // Calculate Planned Bar Geometry
                // =====================================================

                const startDate =
                    new Date(
                        start
                    );

                const finishDate =
                    new Date(
                        finish
                    );

                const startUtc =
                    Date.UTC(
                        startDate.getFullYear(),
                        startDate.getMonth(),
                        startDate.getDate()
                    );

                const finishUtc =
                    Date.UTC(
                        finishDate.getFullYear(),
                        finishDate.getMonth(),
                        finishDate.getDate()
                    );

                const barLeft =
                    (
                        (
                            startUtc -
                            timelineStartUtc
                        ) /
                        oneDayMilliseconds
                    ) *
                    dayCellWidth;

                const barWidth =
                    (
                        (
                            finishUtc -
                            startUtc
                        ) /
                        oneDayMilliseconds
                    ) *
                    dayCellWidth;

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.left =
                    `${barLeft}px`;

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.width =
                    `${barWidth}px`;

                ctrDashboardOneBodyRightGanttRowTimelineBar.textContent =
                    dashboardPhaseDefinitions[
                        phase.phase
                    ]?.longName ??
                    phase.phase;

                ctrDashboardOneBodyRightGanttRowTimeline.appendChild(
                    ctrDashboardOneBodyRightGanttRowTimelineBar
                );

            }


            // =====================================================
            // Current
            // =====================================================

            if (
                phase.currentStart &&
                phase.currentFinish
            ) {

                const start =
                    new Date(
                        phase.currentStart
                    ).getTime();

                const finish =
                    new Date(
                        phase.currentFinish
                    ).getTime();


                const ctrDashboardOneBodyRightGanttRowTimelineBar =
                    document.createElement(
                        "div"
                    );

                ctrDashboardOneBodyRightGanttRowTimelineBar.className =
                    "project-dashboard-one-body-right-gantt-row-timeline-bar project-dashboard-one-body-right-gantt-row-timeline-bar-current";

                ctrDashboardOneBodyRightGanttRowTimelineBar.classList.add(
                    `project-dashboard-one-body-right-gantt-row-timeline-bar-phase-${
                        dashboardPhaseDefinitions[
                            phase.phase
                        ].cssClass
                    }`
                );

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.top =
                    `${phaseTop}px`;


                // =====================================================
                // Calculate Current Bar Geometry
                // =====================================================

                const startDate =
                    new Date(
                        start
                    );

                const finishDate =
                    new Date(
                        finish
                    );

                const startUtc =
                    Date.UTC(
                        startDate.getFullYear(),
                        startDate.getMonth(),
                        startDate.getDate()
                    );

                const finishUtc =
                    Date.UTC(
                        finishDate.getFullYear(),
                        finishDate.getMonth(),
                        finishDate.getDate()
                    );

                const barLeft =
                    (
                        (
                            startUtc -
                            timelineStartUtc
                        ) /
                        oneDayMilliseconds
                    ) *
                    dayCellWidth;

                const barWidth =
                    (
                        (
                            finishUtc -
                            startUtc
                        ) /
                        oneDayMilliseconds
                    ) *
                    dayCellWidth;

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.left =
                    `${barLeft}px`;

                ctrDashboardOneBodyRightGanttRowTimelineBar.style.width =
                    `${barWidth}px`;

                ctrDashboardOneBodyRightGanttRowTimelineBar.textContent =
                    dashboardPhaseDefinitions[
                        phase.phase
                    ]?.longName ??
                    phase.phase;

                ctrDashboardOneBodyRightGanttRowTimeline.appendChild(
                    ctrDashboardOneBodyRightGanttRowTimelineBar
                );

            }

        }


        // =====================================================
        // Assemble Project Row
        // =====================================================

        ctrDashboardOneBodyRightGanttRow.appendChild(
            ctrDashboardOneBodyRightGanttRowTimeline
        );

        ctrDashboardOneBodyRightGantt.appendChild(
            ctrDashboardOneBodyRightGanttRow
        );

        ctrDashboardOneBodyLeftDetails.appendChild(
            ctrDashboardOneBodyLeftDetailsRow
        );

    }


    // =====================================================
    // Mount Dashboard One Details And Timeline
    // =====================================================

    ctrDashboardOneBodyLeftBody.appendChild(
        ctrDashboardOneBodyLeftDetails
    );

    ctrDashboardOneBodyRightBody.appendChild(
        ctrDashboardOneBodyRightGantt
    );

}

// =====================================================
// 10 - Kill Dashboard One
// =====================================================

export function processKillDashboardOne():
void {

    console.log(
        "[DashboardOne] ENTER processKillDashboardOne"
    );

    // =====================================================
    // Clear Dashboard-Specific Data Stores
    // =====================================================

    dashboardOneDataStoreOne.clear();

    console.log(
        "[DashboardOne] Data Stores After Kill:",
        {
            dataStoreOne:
                dashboardOneDataStoreOne.size
        }
    );

}
