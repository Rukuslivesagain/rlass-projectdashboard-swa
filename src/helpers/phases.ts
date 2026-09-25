export enum DashboardPhase {
    PLANNING = "PLANNING",
    PRE = "PRE",
    SD = "SD",
    EXE = "EXE",
    SU = "SU",
    POST = "POST"
}

export interface DashboardPhaseDefinition {
    phase: DashboardPhase;
    index: number;
    longName: string;
    cssClass: string;
}

export const dashboardPhaseDefinitions:
    Record<DashboardPhase, DashboardPhaseDefinition> =
{
    [DashboardPhase.PLANNING]: {
        phase: DashboardPhase.PLANNING,
        index: 0,
        longName: "Planning",
        cssClass: "planning"
    },

    [DashboardPhase.PRE]: {
        phase: DashboardPhase.PRE,
        index: 1,
        longName: "Pre",
        cssClass: "pre"
    },

    [DashboardPhase.SD]: {
        phase: DashboardPhase.SD,
        index: 2,
        longName: "Shutdown",
        cssClass: "shutdown"
    },

    [DashboardPhase.EXE]: {
        phase: DashboardPhase.EXE,
        index: 3,
        longName: "Execution",
        cssClass: "execution"
    },

    [DashboardPhase.SU]: {
        phase: DashboardPhase.SU,
        index: 4,
        longName: "Startup",
        cssClass: "startup"
    },

    [DashboardPhase.POST]: {
        phase: DashboardPhase.POST,
        index: 5,
        longName: "Post",
        cssClass: "post"
    }
};

export const schedulePhaseToDashboardPhase =
    new Map<string, DashboardPhase>([
        [
            "PLANNING",
            DashboardPhase.PLANNING
        ],
        [
            "PRE",
            DashboardPhase.PRE
        ],
        [
            "SD",
            DashboardPhase.SD
        ],
        [
            "SD.PR",
            DashboardPhase.SD
        ],
        [
            "SD.CU",
            DashboardPhase.SD
        ],
        [
            "EX",
            DashboardPhase.EXE
        ],
        [
            "EXE",
            DashboardPhase.EXE
        ],
        [
            "SU",
            DashboardPhase.SU
        ],
        [
            "PO",
            DashboardPhase.POST
        ],
        [
            "POST",
            DashboardPhase.POST
        ]
    ]);