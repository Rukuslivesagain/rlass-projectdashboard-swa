import {
    DashboardPhase
} from "../helpers/phases";


// =====================================================
// Application Version Info
//
// Application Registry V3 - versionInfo[] Refactor / Pass 3.4
// (Reset-Required Restart Model).
//
// One version-specific entry - required/current replace the old
// root-level requiredVersion/currentVersion; notes replaces the
// old root-level versionNotes. notes is informational only.
//
// The targeted-key replacement design (updateType/keysToReplace)
// has been abandoned - resetRequired replaces both. It is
// intentionally all-or-nothing: true means the existing local
// application state is no longer trusted and Restart must clear
// the full local IndexedDB application state
// (processInvalidateLocalApplicationCache); false means existing
// local state remains trusted and Restart must preserve it. See
// processRestartApplication.
// =====================================================

export interface ApplicationVersionInfo {

    required:
        number;

    current:
        number;

    resetRequired:
        boolean;

    notes:
        string[];

}


// =====================================================
// Application Registry
// =====================================================

export interface ApplicationRegistry {

    registryType:
        "application";

    schemaVersion:
        number;

    appStatus:
        string;

    // =====================================================
    // Version Info
    //
    // Application Registry V3 - versionInfo[] Refactor.
    //
    // Intentionally an array - historical-entry selection
    // semantics beyond "the current single entry" are not yet
    // defined; that belongs to the future Restart/Update workflow
    // refactor. See processResolveApplicationVersionInfo.
    // =====================================================

    versionInfo:
        ApplicationVersionInfo[];

    lastModified:
        string;

}


// =====================================================
// Application Version Status
//
// Application Version Gate.
//
// Runtime outcome of evaluating appStatus / system:localVersion
// against the resolved ApplicationVersionInfo's current / required.
// =====================================================

export type ApplicationVersionStatus =
    "Pass" |
    "Shutdown" |
    "No Local Version" |
    "Restart Required" |
    "Update Available";


// =====================================================
// Customer Registry Record
// =====================================================

export interface CustomerRegistryRecord {

    customerId:
        string;

    customerName:
        string;

    active:
        boolean;

    customerMasterRegistryPath:
        string;

}


// =====================================================
// Customers Registry
// =====================================================

export interface CustomersRegistry {

    registryType:
        string;

    schemaVersion:
        number;

    customers:
        CustomerRegistryRecord[];

    lastModified:
        string;

}


// =====================================================
// Customer Master Registry Definition
//
// Registry Architecture Refactor - Stage A.
//
// Represents one entry of CustomerMasterRegistry.registries[].
// registryKey and registryPath are BUILD STRINGS and may
// contain tokens such as {customerId} / {locationId}. Stage A
// does not resolve or interpret those tokens - see Stage B.
// =====================================================

export interface CustomerMasterRegistryDefinition {

    registryType:
        string;

    registryKey:
        string;

    registryPath:
        string;

    registrySync:
        boolean;

}


// =====================================================
// Resolved Registry Definition
//
// Registry Architecture Refactor - Stage B.
//
// Output of processResolveCustomerRegistryManifest(). Build
// strings/tokens are already interpreted - registryKey and
// registryPath are fully concrete. registrySync is
// intentionally omitted: only registrySync === true
// definitions are resolved in the first place, so the flag
// would be redundant here.
// =====================================================

export interface ResolvedRegistryDefinition {

    registryType:
        string;

    registryKey:
        string;

    registryPath:
        string;

    // =====================================================
    // Setup Location Bootstrap.
    //
    // Present only for Location-scoped definitions (those
    // expanded per active Location during resolution). Lets a
    // caller identify which resolved entry belongs to a given
    // Location directly, instead of parsing registryKey /
    // registryPath strings.
    // =====================================================

    locationId?:
        string;

}


// =====================================================
// Customer Master Event
// =====================================================

export interface CustomerMasterEvent {

    eventId:
        string;

    eventName:
        string;

    active:
        boolean;

    currentPhase:
        DashboardPhase;

    scheduleVersionsRegistryPath:
        string;

    worklistVersionsRegistryPath:
        string;

    defaultBaselineVersion:
        string;

    defaultCurrentVersion:
        string;

    lastModified:
        string;

}


// =====================================================
// Location Events Registry
//
// Registry Architecture Refactor - Stage A.
//
// Standalone contract for the deployed location_events_registry
// artifact (IndexedDB/key prefix customer_loce). Location scoped.
// Reuses CustomerMasterEvent for events[] unchanged - only the
// container moved, not the Event record itself. Not yet wired
// into any runtime consumer.
// =====================================================

export interface LocationEventsRegistry {

    registryType:
        "location_events";

    schemaVersion:
        number;

    customerId:
        string;

    locationId:
        string;

    active:
        boolean;

    lastModified:
        string;

    events:
        CustomerMasterEvent[];

}


// =====================================================
// Customer Master Location Place Parent Map Bounds
// =====================================================

export interface CustomerMasterLocationPlaceParentMapBounds {

    left:
        number;

    top:
        number;

    right:
        number;

    bottom:
        number;

    width:
        number;

    height:
        number;

}


// =====================================================
// Customer Master Location Place Parent Map Home
// =====================================================

export interface CustomerMasterLocationPlaceParentMapHome {

    x:
        number;

    y:
        number;

    zoom:
        number;

}


// =====================================================
// Customer Master Location Place Parent Map Anchor Point
// =====================================================

export interface CustomerMasterLocationPlaceParentMapAnchorPoint {

    x:
        number;

    y:
        number;

}


// =====================================================
// Customer Master Location Place Parent Map Anchor
// =====================================================

export interface CustomerMasterLocationPlaceParentMapAnchor {

    enabled:
        boolean;

    mapParentMapId:
        string;

    p1:
        CustomerMasterLocationPlaceParentMapAnchorPoint;

    p2:
        CustomerMasterLocationPlaceParentMapAnchorPoint;

    p3:
        CustomerMasterLocationPlaceParentMapAnchorPoint;

    p4:
        CustomerMasterLocationPlaceParentMapAnchorPoint;

    bounds:
        CustomerMasterLocationPlaceParentMapBounds;

    center:
        CustomerMasterLocationPlaceParentMapAnchorPoint;

}


// =====================================================
// Customer Master Location Place Map Info
// =====================================================

export interface CustomerMasterLocationPlaceMapInfo {

    mapId:
        string;

    mapDisplayName:
        string;

    mapArtifactPath:
        string;

}


// =====================================================
// Customer Master Location Place
// =====================================================

export interface CustomerMasterLocationPlace {

    locationPlaceId:
        string;

    locationPlaceDisplayName:
        string;

    type:
        string;

    relatedEntityType:
        string;

    relatedEntityId:
        string;

    active:
        boolean;

    mapParentMapId:
        string;

    mapRelatedLocationPlaceIds:
        string[];

    mapParentMapLocationBounds:
        CustomerMasterLocationPlaceParentMapBounds;

    mapParentMapLocationHome:
        CustomerMasterLocationPlaceParentMapHome;

    mapParentMapLocationAnchor:
        CustomerMasterLocationPlaceParentMapAnchor;

    mapInfo:
        CustomerMasterLocationPlaceMapInfo;

    mapChildMapAnchors:
        unknown[];

    lastModified:
        string;

}


// =====================================================
// Customer Master Location Place Level
//
// Registry Architecture Refactor - Stage A.
//
// Represents one entry of location_places_registry's
// locationPlaceLevels[] hierarchy/level metadata.
//
// NOTE: the live location_places_registry artifact could not
// be located/read during this stage (attempted at the path
// opened in the IDE and common local drive roots - none
// resolved to an accessible file). This interface is modeled
// from the field names/shape established across this refactor's
// planning (a numeric, open-ended level paired with a
// data-defined semantic type) rather than verified byte-for-byte
// against the deployed JSON. Flagged for confirmation before
// Stage G/H consumes it - see Stage A report.
//
// level is numeric and open-ended. It must never be assumed to
// universally mean Event/Unit/Job - that mapping is data, not a
// TypeScript contract (see DashboardTenNavigationLevel.levelDepth
// in html/dashboardTen.ts for the same principle already applied
// on the application side).
// =====================================================

export interface CustomerMasterLocationPlaceLevel {

    level:
        number;

    type:
        string;

    displayName: string;

}


// =====================================================
// Location Places Registry
//
// Registry Architecture Refactor - Stage A.
//
// Standalone contract for the deployed location_places_registry
// artifact (IndexedDB/key prefix customer_locp). Location scoped.
// Reuses CustomerMasterLocationPlace for locationPlaces[]
// unchanged - only the container moved, not the LocationPlace
// record itself. Not yet wired into any runtime consumer.
// =====================================================

export interface LocationPlacesRegistry {

    registryType:
        "location_places";

    schemaVersion:
        number;

    customerId:
        string;

    locationId:
        string;

    active:
        boolean;

    lastModified:
        string;

    locationPlaceLevels:
        CustomerMasterLocationPlaceLevel[];

    locationPlaces:
        CustomerMasterLocationPlace[];

}


// =====================================================
// Customer Master Location
// =====================================================

export interface CustomerMasterLocation {

    locationId:
        string;

    locationName:
        string;

    active:
        boolean;

    lastModified:
        string;

    maps?:
        CustomerMasterMap[];

}


// =====================================================
// Customer Master Map Grid Definition
// =====================================================

export interface CustomerMasterMapGridDefinition {

    columns:
        number;

    rows:
        number;

    cellShape:
        "SQUARE";

    fitAxis:
        "X" |
        "Y";

    alignX:
        "START" |
        "CENTER" |
        "END";

    alignY:
        "START" |
        "CENTER" |
        "END";

}


// =====================================================
// Customer Master Map Sub Grid Definition
// =====================================================

export interface CustomerMasterMapSubGridDefinition {

    columnsPerPrimary:
        number;

    rowsPerPrimary:
        number;

}


// =====================================================
// Customer Master Map Grid
// =====================================================

export interface CustomerMasterMapGrid {

    primary:
        CustomerMasterMapGridDefinition;

    sub:
        CustomerMasterMapSubGridDefinition;

}


// =====================================================
// Customer Master Map
// =====================================================

export interface CustomerMasterMap {

    mapId:
        string;

    mapName:
        string;

    mapType:
        "MAIN" |
        "UNIT";

    locationPlaceId:
        string;

    active:
        boolean;

    mapArtifactPath:
        string;

    mapGrid:
        CustomerMasterMapGrid;

    lastModified:
        string;

}


// =====================================================
// Customer Master Registry
// =====================================================

export interface CustomerMasterRegistry {

    registryType:
        "customer_master";

    schemaVersion:
        number;

    customerId:
        string;

    customerName:
        string;

    active:
        boolean;

    lastModified:
        string;

    // =====================================================
    // registries[] - Registry Architecture Refactor Stage A.
    //
    // The authority for registry discovery/sync.
    // =====================================================

    registries:
        CustomerMasterRegistryDefinition[];

    locations:
        CustomerMasterLocation[];

}


// =====================================================
// Schedule Version Plan
// =====================================================

export interface ScheduleVersionPlan {

    versionId:
        string;

    versionPath:
        string;

}


// =====================================================
// Baseline Schedule Version Plan
// =====================================================

export interface BaselineScheduleVersionPlan
    extends ScheduleVersionPlan {

    baselineCode:
        string;

}


// =====================================================
// Schedule Versions Registry
// =====================================================

export interface ScheduleVersionsRegistry {

    registryType:
        "schedule_versions";

    schemaVersion:
        number;

    lastModified:
        string;

    defaultBaselineVersionId:
        string;

    defaultBaselineVersionPath:
        string;

    defaultCurrentVersionId:
        string;

    defaultCurrentVersionPath:
        string;

    baselinePlans:
        BaselineScheduleVersionPlan[];

    currentPlans:
        ScheduleVersionPlan[];

}


// =====================================================
// Active State
// =====================================================

export interface ActiveState {

    customerId:
        string;

    locationId:
        string;

    eventId:
        string;

    baselineVersion:
        string;

    currentVersion:
        string;

}


// =====================================================
// User Dashboard Tab
// =====================================================

export interface UserDashboardTab {

    slot:
        number;

    dashboardId:
        string;

}


// =====================================================
// Current User
// =====================================================

export interface CurrentUser {

    userSystemId:
        string;

    userGuid:
        string;

    displayName:
        string;

    email:
        string;

    globalAccessKeys:
        string[];

    userProfilePath:
        string;

    isActive:
        boolean;

}


// =====================================================
// User Profile Registry
// =====================================================

export interface UserProfileRegistry {

    profileType:
        "user";

    schemaVersion:
        number;

    lastModified:
        string;

    userGuid:
        string;

    defaultDashboardTabConfig:
        UserDashboardTab[];

    customerAccessKeys:
        string[];

}