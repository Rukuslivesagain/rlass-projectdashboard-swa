import {
    ActiveState
} from "../models/registries";

// =====================================================
// Access Action Definition
// =====================================================

export interface AccessActionDefinition {
    action:
        string;

    buildAccessKeys:
        (
            activeState:
                ActiveState
        ) => string[];
}


// =====================================================
// Access Action Definitions
// =====================================================

export const accessActionDefinitions:
    AccessActionDefinition[] =
    [
        {
            action:
                "Upload",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "uploader"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardOne",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardone", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardone", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardTwo",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardtwo", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardtwo", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardThree",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardthree", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardthree", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardFour",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardfour", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardfour", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardFive",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardfive", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardfive", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardSix",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardsix", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardsix", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardSeven",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardseven", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardseven", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardEight",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardeight", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardeight", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardNine",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardnine", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardnine", "all"].join("|")
                    ]
        },
        {
            action:
                "open-dashboardTen",

            buildAccessKeys:
                (
                    activeState
                ) =>
                    [
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardten", "view"].join("|"),
                        [activeState.customerId, activeState.locationId, activeState.eventId, "dashboardten", "all"].join("|")
                    ]
        }
    ];