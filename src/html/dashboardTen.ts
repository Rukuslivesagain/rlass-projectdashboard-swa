import {
    ActiveState,
    CustomerMasterLocation,
    CustomerMasterLocationPlace,
    CustomerMasterMapGrid,
    CustomerMasterMapGridDefinition,
    CustomerMasterRegistry,
    LocationPlacesRegistry
} from "../models/registries";

import * as pdfjsLib from "pdfjs-dist";

import OpenSeadragon from "openseadragon";

import {
    buildNotificationOverlay
} from "./overlays";

// =====================================================
// PDF JS Worker
// =====================================================

// Standalone Migration - Pass 5. Vite asset URL import replaces
// the PCF webpack require() of the same worker file.

import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfjsWorkerUrl;


// =====================================================
// 1 - Dashboard Ten Profile
// =====================================================

export const dashboardTenProfile =
{
    DashboardId:
        10,

    DashboardName:
        "Heat Map"
};

// =====================================================
// Dashboard Ten Map Zoom Levels
//
// Generic preset map zoom levels.
//
// Level 0:
// - Fitted map view.
//
// Levels 1 - 4:
// - Increasing map magnification.
//
// IMPORTANT:
// - These levels describe map display magnification.
// - They do not alter native map geometry.
// - Semantic meanings are intentionally not assigned yet.
// =====================================================

const dashboardTenMapZoomLevels =
    [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ] as const;


// =====================================================
// 2 - Dashboard Ten Build Result
// =====================================================

export interface DashboardTenBuildResult {

    Pass:
        boolean;

    Dashboard:
        HTMLDivElement | null;

    DataIsAvailable:
        boolean;

}

// =====================================================
// Dashboard Ten Hierarchy Contracts
//
// Stage 1 of the multi-scope navigation refactor (Refactor 1).
// Type vocabulary only. Not yet wired into buildDashboardTen,
// the Dashboard / Slot Router, or any runtime state.
// =====================================================

export type DashboardTenMode =
    "Global" |
    "Customer" |
    "Location" |
    "LocationLevelOne" |
    "LocationLevelTwo" |
    "LocationLevelThree";

// =====================================================
// Dashboard Ten Scope
//
// Global, Customer, and Location are stable semantic scopes.
// Global is not Location Level Zero. Generic numbered levels
// begin below Location.
// =====================================================

export type DashboardTenScope =
    | {
        kind:
            "Global";
    }
    | {
        kind:
            "Customer";

        customerId:
            string;
    }
    | {
        kind:
            "Location";

        customerId:
            string;

        locationId:
            string;
    };

// =====================================================
// Dashboard Ten Navigation Level
//
// Represents the open-ended hierarchy below Location.
//
// levelDepth is numeric and open-ended. It never implies a
// semantic type. A Unit may be Level Two in one hierarchy and
// Level Three in another. Semantic identity always comes from
// the resolved LocationPlace data (locationPlace.type,
// relatedEntityType, relatedEntityId), never from levelDepth.
// =====================================================

export interface DashboardTenNavigationLevel {

    levelDepth:
        number;

    locationPlace:
        CustomerMasterLocationPlace |
        null;

    children:
        CustomerMasterLocationPlace[];

    selectedChildId:
        string |
        null;

    mapState:
        DashboardTenLevelMapState |
        null;

}

// =====================================================
// Dashboard Ten Level Map State
//
// Restorable per-level map / view state. Shape is derived from
// the existing proven DashboardTenSuperMaxParentView capture
// already used by the current Unit-drill restore mechanism.
// =====================================================

export interface DashboardTenLevelMapState {

    mapIndex:
        number;

    centerX:
        number;

    centerY:
        number;

    zoom:
        number;

    tileSource:
        OpenSeadragon.TileSource;

}

// =====================================================
// Dashboard Ten Primary Grid Geometry
// =====================================================

interface DashboardTenPrimaryGridGeometry {

    cellSize:
        number;

    gridWidth:
        number;

    gridHeight:
        number;

    offsetX:
        number;

    offsetY:
        number;

    x:
        number[];

    y:
        number[];

}


// =====================================================
// Dashboard Ten Canonical Spatial Address
//
// Canonical location resolution is always 20 x 20 inside
// one Primary Grid cell.
//
// IMPORTANT:
// - Canonical address resolution does not depend on zoom.
// - Display / interaction density may change by zoom.
// - Jobs / Heat can use this permanent address later.
// =====================================================



interface DashboardTenCanonicalSpatialAddress {

    primaryAddress:
        string;

    primaryRow:
        number;

    primaryColumn:
        number;

    canonicalRow:
        number;

    canonicalColumn:
        number;

    address:
        string;

}


// =====================================================
// Dashboard Ten Navigation Cell
//
// Cell identity owns navigation intent.
// Native X / Y remain the geometric center used by the
// existing stage fit / translation helper.
//
// Grid Ownership:
// - Zoom 0 - 4 -> Primary
// - Zoom 5 - 10 -> Sub Grid
// =====================================================
// 3 - Dashboard Ten Map Artifact Models
//
// One location map is delivered as one versioned BIN.
//
// BIN layout:
// - UInt32 little-endian manifest byte length
// - UTF-8 JSON manifest
// - Binary payload area
//
// Asset offsets in the manifest are relative to the
// beginning of the binary payload area.
// =====================================================

interface DashboardTenMapArtifactAsset {

    role:
        string;

    fileName:
        string;

    contentType:
        string;

    offset:
        number;

    length:
        number;

    level?:
        number;

    sourceZoom?:
        number;

    quality?:
        number;

}


interface DashboardTenMapArtifactManifest {

    artifactType:
        "location-map";

    schemaVersion:
        number;

    customerId:
        string;

    locationId:
        string;

    mapId:
        string;

    mapName:
        string;

    geoBounds:
    {
        north:
            number;

        south:
            number;

        east:
            number;

        west:
            number;
    };

    assets:
        DashboardTenMapArtifactAsset[];

}


interface DashboardTenMapArtifactPackage {

    manifest:
        DashboardTenMapArtifactManifest;

    plotArtifact:
        ArrayBuffer;

    satelliteThumbnailArtifact:
        ArrayBuffer | null;

    satelliteLevelArtifacts:
        Map<
            number,
            ArrayBuffer
        >;

}


// =====================================================
// 4 - Dashboard Ten Data Store One Record
//
// Location map definition.
//
// Current:
// - Main map only.
// - Index 0 always represents Main.
//
// Future:
// - All active maps for the selected location.
// =====================================================

interface DashboardTenDataStoreOneRecord {

    index:
        number;

    mapName:
        string;

    mapArtifactPath:
        string;

    mapGrid:
        CustomerMasterMapGrid;

}


// =====================================================
// 5 - Dashboard Ten Data Stores
// =====================================================

// =====================================================
// Data Store One
//
// Map definitions available to Dashboard Ten.
//
// Source:
// - Customer Master
// - Selected Location
//
// Required Data:
// - index
// - mapName
// - mapArtifactPath
//
// Use:
// - Builds left-side map selector
// - Establishes map display order
// - Resolves selected map
// - Drives right-side map minibuilder
//
// Current:
// - Main map only
// - Index 0 represents Main
//
// Future:
// - All active location maps
// =====================================================

const dashboardTenDataStoreOne =
    new Map<
        number,
        DashboardTenDataStoreOneRecord
    >();


// =====================================================
// 6 - Dashboard Ten Runtime State
// =====================================================

let mapZoomIsInProgress =
    false;


// =====================================================
// Dashboard Ten Map Build Generation
//
// Owns map-build lifecycle identity across asynchronous
// artifact retrieval, PDF resolution, and OSD viewer
// initialization.
//
// Incremented only at the established Dashboard Ten
// lifecycle boundaries. A resumed asynchronous map build
// whose captured generation no longer matches the current
// generation belongs to a superseded lifecycle and must not
// mutate Dashboard Ten DOM, runtime state, or the OSD viewer.
// =====================================================

let dashboardTenMapBuildGeneration =
    0;

function processIsCurrentMapBuildGeneration(
    buildGeneration:
        number
):
boolean {

    return buildGeneration ===
        dashboardTenMapBuildGeneration;

}


const dashboardTenRuntimeState =
{
    // =====================================================
    // Dashboard Ten Mode
    //
    // Stage 2 of the multi-scope navigation refactor
    // (Refactor 1). Records the mode Dashboard Ten was built
    // with. Does not change when the user navigates deeper.
    // =====================================================

    mode:
        "LocationLevelOne" as
            DashboardTenMode,

    // =====================================================
    // Dashboard Ten Scope / Navigation Levels
    //
    // Stage 3 of the multi-scope navigation refactor
    // (Refactor 1). Reset and rebuilt from Active State on
    // every LocationLevelOne build. Not yet consumed by any
    // presentation, map, or control code.
    // =====================================================

    scope:
        null as
            DashboardTenScope | null,

    navigationLevels:
        [] as
            DashboardTenNavigationLevel[],

    selectedMapIndex:
        0,

    fitPadding:
        20,

    zoomLevel:
        0,

    isPanning:
        false,

    panPointerStartX:
        0,

    panPointerStartY:
        0,

    panStartScrollLeft:
        0,

    panStartScrollTop:
        0,

    panDragIsActive:
        false,
    // =====================================================
    // Layer Visibility
    //
    // These are lightweight UI preferences and may remain
    // resident between Dashboard Ten renders.
    //
    // Satellite and Plot are peer base-view layers.
    // Jobs and Heat are independent analytical overlays.
    // =====================================================

    showSatellite:
        false,

    showPlot:
        true,

    showJobs:
        true,

    showHeat:
        false,

    showPrimaryGrid:
        false,

    showSubGrid:
        false,

    registrationEditEnabled:
        false,

    showPlacesFilter:
        false,

    filterActiveEvent:
        false,

    visibleLocationPlaceIds:
        new Set<string>(),

};


// =====================================================
// 7 - Dashboard Ten DOM References
// =====================================================

let ctrDashboardTenBodyLeft:
    HTMLDivElement;

let ctrDashboardTenBodyLeftBody:
    HTMLDivElement;

let ctrDashboardTenBodyLeftHeaderTitle:
    HTMLDivElement | null =
        null;

let chkDashboardTenChkPlaces:
    HTMLInputElement | null =
        null;

let ctrDashboardTenBodyRight:
    HTMLDivElement;

let ctrDashboardTenBodyRightHeader:
    HTMLDivElement;

let ctrDashboardTenBodyRightBody:
    HTMLDivElement;

let ctrDashboardTenBodyRightFooter:
    HTMLDivElement;

let ctrDashboardTen:
    HTMLDivElement | null =
        null;

let btnDashboardTenSuperMaxBack:
    HTMLButtonElement;

let chkDashboardTenPlot:
    HTMLInputElement;

let chkDashboardTenSatellite:
    HTMLInputElement;

let chkDashboardTenJobs:
    HTMLInputElement;

let chkDashboardTenSafety:
    HTMLInputElement;

let chkDashboardTenChkPrimaryGrid:
    HTMLInputElement;

let chkDashboardTenChkSubGrid:
    HTMLInputElement;

let chkDashboardTenHeat:
    HTMLInputElement;

let btnDashboardTenMapZoomIn:
    HTMLButtonElement;

let btnDashboardTenMapZoomOut:
    HTMLButtonElement;

let btnDashboardTenMapHome:
    HTMLButtonElement;

let btnDashboardTenExpand:
    HTMLButtonElement;


// =====================================================
// Dashboard Ten Map Toolbar Structure
// =====================================================

let ctrDashboardTenMapToolbar:
    HTMLDivElement;

let ctrDashboardTenMapToolbarGroupBase:
    HTMLDivElement;

let ctrDashboardTenMapToolbarGroupLayers:
    HTMLDivElement;

let ctrDashboardTenMapToolbarGroupGrid:
    HTMLDivElement;

let ctrDashboardTenMapToolbarGroupNavigation:
    HTMLDivElement;

let spnDashboardTenMapToolbarSeparatorOne:
    HTMLSpanElement;

let spnDashboardTenMapToolbarSeparatorTwo:
    HTMLSpanElement;

let spnDashboardTenMapToolbarSeparatorThree:
    HTMLSpanElement;

let spnDashboardTenMapToolbarSeparatorFour:
    HTMLSpanElement;

// =====================================================
// Dashboard Ten Dependencies
// =====================================================

let dashboardTenCustomerMasterRegistry:
    CustomerMasterRegistry | null =
        null;

let dashboardTenActiveState:
    ActiveState | null =
        null;

let dashboardTenCtrMain:
    HTMLDivElement | null =
        null;

let dashboardTenProcessGetArtifact:
    (
        (
            artifactType:
                "Map",

            artifactPath:
                string,

            storageTarget:
                "IndexDB"

        ) => Promise<ArrayBuffer>
    ) |
    null =
        null;

let dashboardTenProcessGetLocationPlacesRegistry:
    (
        (
            locationId:
                string

        ) => LocationPlacesRegistry | null
    ) |
    null =
        null;

let dashboardTenProcessProcessingOverlay:
    (
        show:
            boolean,

        message:
            string,

        mode:
            "Spinner"
    ) => void;

let dashboardTenShowMessage:
    (
        (
            show:
                boolean,

            message:
                string,

            errorMessage:
                string | undefined,

            disableRequired:
                boolean,

            disableMode?:
                "app-fatal"

        ) => void
    ) |
    null =
        null;

let dashboardTenProcessDashboardSpecialMode:
    (
        (
            mode:
                "Max" |
                "SuperMax",

            subMode:
                "Enter" |
                "Leave",

            callingButton:
                HTMLButtonElement[],

            affectedContainers?:
                HTMLElement[]

        ) => void
    ) |
    null =
        null;

// =====================================================
// Dashboard Ten Map Render References
// =====================================================

let ctrDashboardTenBodyRightBodyMapViewport:
    HTMLDivElement | null =
        null;

let ctrDashboardTenBodyRightBodyMapScrollSurface:
    HTMLDivElement | null =
        null;

let ctrDashboardTenBodyRightBodyMapStage:
    HTMLDivElement | null =
        null;

let dashboardTenPlotPdfPage:
    pdfjsLib.PDFPageProxy | null =
        null;

let dashboardTenPlotPdfDocument:
    pdfjsLib.PDFDocumentProxy | null =
        null;

let dashboardTenMapViewer:
    OpenSeadragon.Viewer | null =
        null;

let dashboardTenMapHoveredPrimaryAddress:
    string | null =
        null;

let dashboardTenMapLastPointerPixel:
    OpenSeadragon.Point | null =
        null;

let dashboardTenMapViewerPointerIsDown =
    false;

let dashboardTenMapViewerDragIsActive =
    false;

let dashboardTenMapViewerGestureWasDrag =
    false;

let dashboardTenMapZoomInButton:
    HTMLButtonElement | null =
        null;

let dashboardTenMapZoomOutButton:
    HTMLButtonElement | null =
        null;

let dashboardTenMapViewerHost:
    HTMLDivElement | null =
        null;

let dashboardTenMapViewerImageUrl:
    string | null =
        null;

// =====================================================
// Dashboard Ten Super Max Parent View
//
// Temporary saved parent-map viewport state.
// This state will be restored through the existing map / OSD
// infrastructure when Super Max is closed.
// =====================================================

interface DashboardTenSuperMaxParentView {

    mapIndex:
        number;

    centerX:
        number;

    centerY:
        number;

    zoom:
        number;

    tileSource:
        OpenSeadragon.TileSource;

}

let dashboardTenSuperMaxParentView:
    DashboardTenSuperMaxParentView | null =
        null;


// =====================================================
// Developer Map Registration Tool
// Native plot coordinates are authoritative.
// =====================================================

interface DashboardTenMapRegistrationPoint {
    x: number;
    y: number;
}

let dashboardTenMapRegistrationAnchors: DashboardTenMapRegistrationPoint[] | null = null;
let ctrDashboardTenMapRegistrationOverlay: SVGSVGElement | null = null;
let btnDashboardTenMapRegistrationEdit: HTMLButtonElement | null = null;

// =====================================================
// Permanent Map Layer Hosts
//
// Layer order:
// 0 - Satellite
// 1 - Plot
// 2 - Primary Grid
// 3 - Jobs
// 4 - Heat
//
// Native spatial layers live inside the shared map stage.
// The stage owns fit / zoom / pan for native map-space content.
//
// IMPORTANT:
// - Primary Grid and Sub Grid are visual mapping only.
// - Grid DOM never owns hover, click, selection, or navigation.
// - Addresses remain permanent spatial references for placement.
// - Coordinate geometry owns areas / regions.
// - Viewport scroll owns pan; stage owns scale.
// =====================================================

let ctrDashboardTenMapLayerSatellite:
    HTMLDivElement | null =
        null;

let ctrDashboardTenMapLayerPlot:
    HTMLDivElement | null =
        null;

let ctrDashboardTenMapLayerPrimaryGrid:
    HTMLDivElement | null =
        null;

let ctrDashboardTenMapLayerSubGrid:
    HTMLDivElement | null =
        null;


let ctrDashboardTenMapLayerJobs:
    HTMLDivElement | null =
        null;

let ctrDashboardTenMapLayerHeat:
    HTMLDivElement | null =
        null;

let cvsDashboardTenBodyRightBodyMapStagePlot:
    HTMLCanvasElement | null =
        null;

// =====================================================
// Dashboard Ten Resize Observer
// =====================================================

const dashboardTenResizeObserver =
    new ResizeObserver(
        () => {

            if (
                dashboardTenMapViewer?.viewport
            ) {

                dashboardTenMapViewer.viewport.applyConstraints(
                    true
                );

            }

        }
    );


// =====================================================
// 8 - Build Dashboard Ten
// =====================================================

export function buildDashboardTen(
    customerMasterRegistry:
        CustomerMasterRegistry | null,

    activeState:
        ActiveState | null,

    mode:
        DashboardTenMode,

    processGetArtifact:
        (
            artifactType:
                "Map",

            artifactPath:
                string,

            storageTarget:
                "IndexDB"

        ) => Promise<ArrayBuffer>,

    processGetLocationPlacesRegistry:
        (
            locationId:
                string

        ) => LocationPlacesRegistry | null,

    showMessage:
        (
            show:
                boolean,

            message:
                string,

            errorMessage:
                string | undefined,

            disableRequired:
                boolean,

            disableMode?:
                "app-fatal"

        ) => void,

    ctrMain:
        HTMLDivElement,

    DashboardSpecialMode:
        (
            mode:
                "Max" |
                "SuperMax",

            subMode:
                "Enter" |
                "Leave",

            callingButton:
                HTMLButtonElement[],

            affectedContainers?:
                HTMLElement[]

        ) => void,

    processProcessingOverlay:
    (
        show:
            boolean,

        message:
            string,

        mode:
            "Spinner"
    ) => void
):
DashboardTenBuildResult {

    console.log(
        "[DashboardTen] Build started"
    );


    // =====================================================
    // Set Dashboard Ten Mode
    // =====================================================

    dashboardTenRuntimeState.mode =
        mode;


    // =====================================================
    // Dashboard Ten Mode Dispatch
    //
    // Stage 2 of the multi-scope navigation refactor
    // (Refactor 1). Only LocationLevelOne is implemented in
    // V1. Every other mode must be explicitly rejected here
    // rather than silently falling through into the existing
    // LocationLevelOne/Event build behavior below.
    // =====================================================

    if (
        mode !==
            "LocationLevelOne"
    ) {

        console.warn(
            "[DashboardTen] Unsupported Dashboard Ten mode:",
            mode
        );

        showMessage(
            true,
            "This Dashboard Ten view is not yet available.",
            undefined,
            false
        );

        return {
            Pass:
                false,

            Dashboard:
                null,

            DataIsAvailable:
                false
        };

    }


    // =====================================================
    // Set Dashboard Ten Dependencies
    // =====================================================

    dashboardTenCustomerMasterRegistry =
        customerMasterRegistry;

    dashboardTenActiveState =
        activeState;

    dashboardTenProcessGetArtifact =
        processGetArtifact;

    dashboardTenProcessGetLocationPlacesRegistry =
        processGetLocationPlacesRegistry;

    dashboardTenShowMessage =
        showMessage;

    dashboardTenCtrMain =
        ctrMain;

    dashboardTenProcessDashboardSpecialMode =
        DashboardSpecialMode;

    dashboardTenProcessProcessingOverlay =
        processProcessingOverlay;


    // =====================================================
    // Initialize Dashboard Ten Hierarchy
    //
    // Stage 3 of the multi-scope navigation refactor
    // (Refactor 1). Builds DashboardTenScope and the initial
    // DashboardTenNavigationLevel[] alongside the existing
    // build below. Does not yet drive presentation.
    // =====================================================

    processInitializeDashboardTenLocationLevelOne();


    // =====================================================
    // Build Dashboard Ten Data
    // =====================================================

    processBuildDataStoreOne();


    // =====================================================
    // Dashboard Ten Container
    // =====================================================

    ctrDashboardTen =
        document.createElement(
            "div"
        );

    ctrDashboardTen.className =
        "project-dashboard-ten";


    // =====================================================
    // Dashboard Ten Header
    // =====================================================

    const ctrDashboardTenHeader =
        document.createElement(
            "div"
        );

    ctrDashboardTenHeader.className =
        "project-dashboard-ten-header";


    // =====================================================
    // Dashboard Ten Body
    // =====================================================

    const ctrDashboardTenBody =
        document.createElement(
            "div"
        );

    ctrDashboardTenBody.className =
        "project-dashboard-ten-body";


    // =====================================================
    // Dashboard Ten Body Left
    // =====================================================

    ctrDashboardTenBodyLeft =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeft.className =
        "project-dashboard-ten-body-left";


    // =====================================================
    // Dashboard Ten Body Left Header
    // =====================================================

    const ctrDashboardTenBodyLeftHeader =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeftHeader.className =
        "project-dashboard-ten-body-left-header";


    // =====================================================
    // Dashboard Ten Super Max Back Control
    // Built once and shown only while Super Max is active.
    // Uses the existing Expand / Cancel control click path.
    // =====================================================

    btnDashboardTenSuperMaxBack =
        document.createElement(
            "button"
        );

    btnDashboardTenSuperMaxBack.type =
        "button";

    btnDashboardTenSuperMaxBack.className =
        "project-dashboard-ten-map-toolbar-control application-hidden";

    btnDashboardTenSuperMaxBack.title =
        "Back";

    btnDashboardTenSuperMaxBack.innerHTML =
        `
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
        >
            <path
                d="M15 5 L8 12 L15 19"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
        `;

    btnDashboardTenSuperMaxBack.addEventListener(
        "click",
        () => {

            btnDashboardTenExpand.click();

        }
    );


    ctrDashboardTenBodyLeftHeaderTitle =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeftHeaderTitle.className =
        "project-dashboard-ten-body-left-header-title";

    ctrDashboardTenBodyLeftHeaderTitle.textContent =
        "Maps";

    ctrDashboardTenBodyLeftHeader.append(
        btnDashboardTenSuperMaxBack,
        ctrDashboardTenBodyLeftHeaderTitle
    );


    // =====================================================
    // Dashboard Ten Body Left Body
    // Vertical Scroll Owner
    // =====================================================

    ctrDashboardTenBodyLeftBody =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeftBody.className =
        "project-dashboard-ten-body-left-body";


    // =====================================================
    // Dashboard Ten Body Left Footer
    // =====================================================

    const ctrDashboardTenBodyLeftFooter =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeftFooter.className =
        "project-dashboard-ten-body-left-footer";


    // =====================================================
    // Assemble Dashboard Ten Body Left
    // =====================================================

    ctrDashboardTenBodyLeft.append(
        ctrDashboardTenBodyLeftHeader,
        ctrDashboardTenBodyLeftBody,
        ctrDashboardTenBodyLeftFooter
    );


    // =====================================================
    // Dashboard Ten Body Right
    // =====================================================

    ctrDashboardTenBodyRight =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRight.className =
        "project-dashboard-ten-body-right";


    // =====================================================
    // Dashboard Ten Body Right Header
    // =====================================================

    ctrDashboardTenBodyRightHeader =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightHeader.className =
        "project-dashboard-ten-body-right-header";


    // =====================================================
    // Dashboard Ten Body Right Body
    // Map Viewport Host
    // =====================================================

    ctrDashboardTenBodyRightBody =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightBody.className =
        "project-dashboard-ten-body-right-body";


    // =====================================================
    // Dashboard Ten Body Right Footer
    // =====================================================

    ctrDashboardTenBodyRightFooter =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightFooter.className =
        "project-dashboard-ten-body-right-footer";


    // =====================================================
    // Assemble Dashboard Ten Body Right
    // =====================================================

    ctrDashboardTenBodyRight.append(
        ctrDashboardTenBodyRightHeader,
        ctrDashboardTenBodyRightBody,
        ctrDashboardTenBodyRightFooter
    );


    // =====================================================
    // Assemble Dashboard Ten Body
    // =====================================================

    ctrDashboardTenBody.append(
        ctrDashboardTenBodyLeft,
        ctrDashboardTenBodyRight
    );


    // =====================================================
    // Dashboard Ten Footer
    // =====================================================

    const ctrDashboardTenFooter =
        document.createElement(
            "div"
        );

    ctrDashboardTenFooter.className =
        "project-dashboard-ten-footer";


    // =====================================================
    // Assemble Dashboard Ten
    // =====================================================

    ctrDashboardTen.append(
        ctrDashboardTenHeader,
        ctrDashboardTenBody,
        ctrDashboardTenFooter
    );


    // =====================================================
    // Render Dashboard Ten
    // =====================================================

    processRenderDashboardTen();


    console.log(
        "[DashboardTen] Build complete"
    );


    // =====================================================
    // Return Dashboard Ten
    // =====================================================

    return {
        Pass:
            true,

        Dashboard:
            ctrDashboardTen,

        DataIsAvailable:
            dashboardTenDataStoreOne.size >
                0
    };

}


// =====================================================
// 9 - Process Build Data Store One
// =====================================================

function processBuildDataStoreOne():
void {

    console.log(
        "[DashboardTen] ENTER processBuildDataStoreOne"
    );


    // =====================================================
    // Clear Data Store One
    // =====================================================

    dashboardTenDataStoreOne.clear();


    // =====================================================
    // Validate Dashboard Dependencies
    // =====================================================

    if (
        !dashboardTenCustomerMasterRegistry ||
        !dashboardTenActiveState
    ) {

        console.warn(
            "[DashboardTen] Dashboard dependencies are not available"
        );

        return;

    }


    // =====================================================
    // Resolve Active Location
    // =====================================================

    const selectedLocation =
        dashboardTenCustomerMasterRegistry
            .locations
            .find(
                location =>
                    location.locationId ===
                        dashboardTenActiveState!.locationId &&
                    location.active
            );

    if (
        !selectedLocation
    ) {

        console.warn(
            "[DashboardTen] Active location not found:",
            dashboardTenActiveState.locationId
        );

        return;

    }


    // =====================================================
    // Resolve Main Map
    // =====================================================

    const mainMap =
        selectedLocation
            .maps
            ?.find(
                map =>
                    map.active &&
                    map.mapType ===
                        "MAIN"
            );

    if (
        !mainMap?.mapArtifactPath?.trim()
    ) {

        console.warn(
            "[DashboardTen] Main map is not configured:",
            dashboardTenActiveState.locationId
        );

        return;

    }


    // =====================================================
    // Build Main Map Record
    // Index 0 Is Always Main
    // =====================================================

    dashboardTenDataStoreOne.set(
        0,
        {
            index:
                0,

            mapName:
                mainMap.mapName ??
                    "Main",

            mapArtifactPath:
                mainMap.mapArtifactPath,

            mapGrid:
                mainMap.mapGrid
        }
    );


    // =====================================================
    // Inspect Data Store One
    // =====================================================

    console.log(
        "[DashboardTen] Data Store One Built:",
        {
            records:
                dashboardTenDataStoreOne.size,

            mainMap:
                dashboardTenDataStoreOne.get(
                    0
                )
        }
    );


    console.log(
        "[DashboardTen] EXIT processBuildDataStoreOne"
    );

}


// =====================================================
// Dashboard Ten Hierarchy Initialization
//
// Stage 3 of the multi-scope navigation refactor
// (Refactor 1). Resolves DashboardTenScope and the initial
// DashboardTenNavigationLevel[] from Active State / Customer
// Master for mode = "LocationLevelOne".
//
// Runs alongside the existing Dashboard Ten build. Does not
// yet drive the left pane, map, controls, OSD, or navigation.
// =====================================================

// =====================================================
// Resolve Active Location
//
// Extracted so future stages can share this lookup instead of
// maintaining independent copies. processBuildDataStoreOne and
// processBuildDashboardTenPlacesFilter retain their own inline
// resolution for now; migrating them is out of scope for this
// stage.
// =====================================================

function processResolveDashboardTenActiveLocation():
CustomerMasterLocation | null {

    if (
        !dashboardTenCustomerMasterRegistry ||
        !dashboardTenActiveState
    ) {

        return null;

    }

    return dashboardTenCustomerMasterRegistry
        .locations
        .find(
            location =>
                location.active &&
                location.locationId ===
                    dashboardTenActiveState!.locationId
        ) ??
        null;

}


// =====================================================
// Resolve Active Event LocationPlace
//
// activeState.eventId is the Event's canonical identity. It
// is NOT the same identifier as the LocationPlace's own
// locationPlaceId. The Event LocationPlace is resolved by
// matching relatedEntityType / relatedEntityId, using the same
// relationship already used by
// processBuildDashboardTenPlacesFilter.
// =====================================================

function processResolveDashboardTenActiveEventLocationPlace(
    locationPlaces:
        CustomerMasterLocationPlace[]
):
CustomerMasterLocationPlace | null {

    if (
        !dashboardTenActiveState
    ) {

        return null;

    }

    return locationPlaces
        .find(
            locationPlace =>
                locationPlace.active &&
                locationPlace.type === "EVENT" &&
                locationPlace.relatedEntityType === "EVENT" &&
                locationPlace.relatedEntityId ===
                    dashboardTenActiveState!.eventId
        ) ??
        null;

}


// =====================================================
// Initialize Dashboard Ten LocationLevelOne Hierarchy
//
// Resets and rebuilds dashboardTenRuntimeState.scope and
// dashboardTenRuntimeState.navigationLevels from the current
// Active State on every LocationLevelOne build. Stale
// hierarchy state from a prior build/re-entry must not survive
// a failed initialization.
//
// levelDepth: 1 means "first generic hierarchy level below
// Location." It does not mean Event. This build happens to
// resolve an Event LocationPlace because that is what the
// current Customer Master relationship data says Level One is
// for this customer's hierarchy.
// =====================================================

function processInitializeDashboardTenLocationLevelOne():
void {

    // =====================================================
    // Reset Hierarchy State
    // =====================================================

    dashboardTenRuntimeState.scope =
        null;

    dashboardTenRuntimeState.navigationLevels =
        [];


    // =====================================================
    // Required Active State Identifiers
    // =====================================================

    if (
        !dashboardTenActiveState ||
        !dashboardTenActiveState.customerId ||
        !dashboardTenActiveState.locationId ||
        !dashboardTenActiveState.eventId
    ) {

        console.warn(
            "[DashboardTen] Hierarchy init skipped - required Active State identifiers unavailable"
        );

        return;

    }


    // =====================================================
    // Establish Location Scope
    // =====================================================

    dashboardTenRuntimeState.scope =
        {
            kind:
                "Location",

            customerId:
                dashboardTenActiveState.customerId,

            locationId:
                dashboardTenActiveState.locationId
        };


    // =====================================================
    // Resolve Active Location
    // =====================================================

    const selectedLocation =
        processResolveDashboardTenActiveLocation();

    if (
        !selectedLocation
    ) {

        console.warn(
            "[DashboardTen] Hierarchy init failed - active location not found:",
            dashboardTenActiveState.locationId
        );

        return;

    }


    // =====================================================
    // Resolve Location Places Registry
    //
    // Registry Architecture Refactor - Dashboard Ten Location
    // Places Migration. LocationPlacesRegistry is the resident
    // authority for Location Places - a missing registry is an
    // invariant/retrieval failure, distinct from a valid
    // registry with an empty locationPlaces[].
    // =====================================================

    if (
        !dashboardTenProcessGetLocationPlacesRegistry
    ) {

        console.warn(
            "[DashboardTen] Hierarchy init failed - Location Places Registry accessor unavailable"
        );

        return;

    }

    const locationPlacesRegistry =
        dashboardTenProcessGetLocationPlacesRegistry(
            dashboardTenActiveState.locationId
        );

    if (
        !locationPlacesRegistry
    ) {

        console.warn(
            "[DashboardTen] Hierarchy init failed - Location Places Registry not resident:",
            dashboardTenActiveState.locationId
        );

        return;

    }


    // =====================================================
    // Resolve Active Event LocationPlace
    // =====================================================

    const activeEventPlace =
        processResolveDashboardTenActiveEventLocationPlace(
            locationPlacesRegistry.locationPlaces
        );

    if (
        !activeEventPlace
    ) {

        console.warn(
            "[DashboardTen] Hierarchy init failed - active Event LocationPlace not found:",
            dashboardTenActiveState.eventId
        );

        return;

    }


    // =====================================================
    // Resolve Level One Children
    //
    // Referenced child IDs that cannot be resolved to an
    // active LocationPlace are dropped with a warning rather
    // than failing initialization, matching the tolerance
    // already exercised today by
    // processBuildDashboardTenPlacesFilter (an unresolved
    // mapRelatedLocationPlaceIds entry is silently excluded
    // from visiblePlaces there).
    // =====================================================

    const children:
        CustomerMasterLocationPlace[] =
            [];

    const missingChildIds:
        string[] =
            [];

    for (
        const childId of
            activeEventPlace.mapRelatedLocationPlaceIds
    ) {

        const child =
            locationPlacesRegistry
                .locationPlaces
                .find(
                    locationPlace =>
                        locationPlace.active &&
                        locationPlace.locationPlaceId ===
                            childId
                );

        if (
            child
        ) {

            children.push(
                child
            );

        }
        else {

            missingChildIds.push(
                childId
            );

        }

    }

    if (
        missingChildIds.length >
            0
    ) {

        console.warn(
            "[DashboardTen] Level One references unresolved child LocationPlace IDs:",
            missingChildIds
        );

    }


    // =====================================================
    // Build Level One
    // =====================================================

    const levelOne:
        DashboardTenNavigationLevel =
        {
            levelDepth:
                1,

            locationPlace:
                activeEventPlace,

            children:
                children,

            selectedChildId:
                null,

            mapState:
                null
        };

    dashboardTenRuntimeState.navigationLevels =
        [
            levelOne
        ];


    // =====================================================
    // Diagnostic Logging
    // =====================================================

    console.log(
        "[DashboardTen] Hierarchy initialized:",
        {
            mode:
                dashboardTenRuntimeState.mode,

            scope:
                dashboardTenRuntimeState.scope,

            levelOneLocationPlaceId:
                activeEventPlace.locationPlaceId,

            levelOneType:
                activeEventPlace.type,

            levelOneRelatedEntityType:
                activeEventPlace.relatedEntityType,

            levelOneRelatedEntityId:
                activeEventPlace.relatedEntityId,

            childCount:
                children.length,

            childIds:
                children.map(
                    child =>
                        child.locationPlaceId
                )
        }
    );

}


// =====================================================
// 10 - Render Dashboard Ten
// =====================================================

export async function processRenderDashboardTen(
):
Promise<void> {

    const dashBoardTenRuntimeState =
        dashboardTenRuntimeState;

    // =====================================================
    // Disconnect Previous Map Resize Observer
    // =====================================================

    dashboardTenResizeObserver.disconnect();


    // =====================================================
    // Destroy Previous OpenSeadragon Viewer
    // =====================================================

    processDestroyMapViewer();


    // =====================================================
    // Invalidate Previous Map Build Generation
    //
    // Any asynchronous map build captured from an earlier
    // generation belongs to a superseded lifecycle and must
    // not mutate Dashboard Ten state from this point forward.
    // =====================================================

    dashboardTenMapBuildGeneration +=
        1;


    // =====================================================
    // Clear Dashboard Ten Render Containers
    // =====================================================

    ctrDashboardTenBodyLeftBody.replaceChildren();

    ctrDashboardTenBodyRightHeader.replaceChildren();

    ctrDashboardTenBodyRightBody.replaceChildren();

    ctrDashboardTenBodyRightFooter.replaceChildren();


    // =====================================================
    // Clear Previous Map Render References
    // =====================================================

    ctrDashboardTenBodyRightBodyMapViewport =
        null;

    ctrDashboardTenBodyRightBodyMapScrollSurface =
        null;

    ctrDashboardTenBodyRightBodyMapStage =
        null;

    ctrDashboardTenMapLayerSatellite =
        null;

    ctrDashboardTenMapLayerPlot =
        null;

    ctrDashboardTenMapLayerPrimaryGrid =
        null;

    ctrDashboardTenMapLayerSubGrid =
        null;

    ctrDashboardTenMapLayerJobs =
        null;

    ctrDashboardTenMapLayerHeat =
        null;

    cvsDashboardTenBodyRightBodyMapStagePlot =
        null;

    dashboardTenPlotPdfPage =
        null;


    // =====================================================
    // Resolve Maps
    // =====================================================

    const maps =
        Array.from(
            dashboardTenDataStoreOne.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.index -
                b.index
        );

    if (
        maps.length ===
            0
    ) {

        return;

    }


    // =====================================================
    // Resolve Selected Map
    // Fall Back To Main If Previous Selection Is Unavailable
    // =====================================================

    const selectedMap =
        dashboardTenDataStoreOne.get(
            dashBoardTenRuntimeState.selectedMapIndex
        ) ??
        dashboardTenDataStoreOne.get(
            0
        );

    if (
        !selectedMap
    ) {

        return;

    }


    // =====================================================
    // Synchronize Runtime Selection
    // =====================================================

    dashBoardTenRuntimeState.selectedMapIndex =
        selectedMap.index;


    // =====================================================
    // Build Left Panel
    // =====================================================

    processBuildDashboardTenLeftPanel();


    // =====================================================
    // Build Selected Map
    // =====================================================

    void processBuildMap(
        selectedMap.index,
        dashboardTenMapBuildGeneration
    );

}


// =====================================================
// Build Dashboard Ten Left Panel
//
// Maps and Places intentionally share the existing left-body
// scroll owner. The toolbar mode determines which collection
// is mounted without rebuilding or disturbing the map viewer.
// =====================================================

function processBuildDashboardTenLeftPanel():
void {

    if (!ctrDashboardTenBodyLeftBody) {
        return;
    }

    ctrDashboardTenBodyLeftBody.replaceChildren();

    if (dashboardTenRuntimeState.showPlacesFilter) {

        if (ctrDashboardTenBodyLeftHeaderTitle) {
            ctrDashboardTenBodyLeftHeaderTitle.textContent =
                "Maps | Places";
        }

        processBuildDashboardTenPlacesFilter();

        return;
    }

    if (ctrDashboardTenBodyLeftHeaderTitle) {
        ctrDashboardTenBodyLeftHeaderTitle.textContent =
            "Maps";
    }

    processBuildDashboardTenMapSelector();

}


// =====================================================
// Build Dashboard Ten Map Selector
// =====================================================

function processBuildDashboardTenMapSelector():
void {

    const maps =
        Array.from(
            dashboardTenDataStoreOne.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.index -
                b.index
        );

    const ctrDashboardTenBodyLeftMaps =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyLeftMaps.className =
        "project-dashboard-ten-maps";

    for (const map of maps) {

        const ctrDashboardTenBodyLeftMap =
            document.createElement(
                "div"
            );

        ctrDashboardTenBodyLeftMap.className =
            "project-dashboard-ten-map-selector";

        ctrDashboardTenBodyLeftMap.textContent =
            map.mapName;

        if (
            map.index ===
                dashboardTenRuntimeState.selectedMapIndex
        ) {

            ctrDashboardTenBodyLeftMap.classList.add(
                "project-dashboard-ten-map-selector-selected"
            );

        }

        ctrDashboardTenBodyLeftMap.addEventListener(
            "click",
            () => {

                if (dashboardTenRuntimeState.registrationEditEnabled) {
                    return;
                }

                if (
                    dashboardTenRuntimeState.selectedMapIndex ===
                        map.index
                ) {
                    return;
                }

                dashboardTenRuntimeState.selectedMapIndex =
                    map.index;

                void processRenderDashboardTen();

            }
        );

        ctrDashboardTenBodyLeftMaps.appendChild(
            ctrDashboardTenBodyLeftMap
        );

    }

    ctrDashboardTenBodyLeftBody.appendChild(
        ctrDashboardTenBodyLeftMaps
    );

}


// =====================================================
// Build Dashboard Ten Places Filter
//
// Interaction Contract:
// - Checkbox owns map-shape visibility only.
// - Row / text owns map navigation only.
// - Checkbox click never navigates.
// - Row click never changes checkbox state.
// - EVENT checkbox also owns EVENT relationship filtering.
// =====================================================

function processBuildDashboardTenPlacesFilter():
void {

    if (
        !dashboardTenProcessGetLocationPlacesRegistry ||
        !dashboardTenActiveState
    ) {
        return;
    }

    const locationPlacesRegistry =
        dashboardTenProcessGetLocationPlacesRegistry(
            dashboardTenActiveState.locationId
        );

    if (!locationPlacesRegistry) {
        return;
    }

    const activeEventPlace =
        locationPlacesRegistry
            .locationPlaces
            .find(
                locationPlace =>
                    locationPlace.active &&
                    locationPlace.type === "EVENT" &&
                    locationPlace.relatedEntityType === "EVENT" &&
                    locationPlace.relatedEntityId ===
                        dashboardTenActiveState!.eventId
            );

    const allPlaces =
        locationPlacesRegistry
            .locationPlaces
            .filter(
                locationPlace =>
                    locationPlace.active &&
                    locationPlace.type !== "EVENT"
            );

    const relatedPlaceIds =
        new Set(
            activeEventPlace?.mapRelatedLocationPlaceIds ??
                []
        );

    const visiblePlaces =
        dashboardTenRuntimeState.filterActiveEvent &&
        activeEventPlace
            ? allPlaces.filter(
                locationPlace =>
                    relatedPlaceIds.has(
                        locationPlace.locationPlaceId
                    )
            )
            : allPlaces;

    const ctrFilter =
        document.createElement(
            "div"
        );

    ctrFilter.className =
        "project-dashboard-ten-places-filter";


    // =====================================================
    // Local Row Builder
    // =====================================================

    const buildLocationPlaceRow =
        (
            locationPlace:
                CustomerMasterLocationPlace,

            isEvent:
                boolean
        ):
        HTMLDivElement => {

            const ctrRow =
                document.createElement(
                    "div"
                );

            ctrRow.className =
                "project-dashboard-ten-place-filter-row";

            const chkPlace =
                document.createElement(
                    "input"
                );

            chkPlace.type =
                "checkbox";

            chkPlace.className =
                "project-dashboard-ten-place-filter-checkbox";

            chkPlace.checked =
                dashboardTenRuntimeState
                    .visibleLocationPlaceIds
                    .has(
                        locationPlace.locationPlaceId
                    );

            const ctrPlaceAction =
                document.createElement(
                    "div"
                );

            ctrPlaceAction.className =
                "project-dashboard-ten-place-filter-action";

            ctrPlaceAction.textContent =
                locationPlace.locationPlaceDisplayName;

            chkPlace.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );

            chkPlace.addEventListener(
                "change",
                () => {

                    if (chkPlace.checked) {

                        dashboardTenRuntimeState
                            .visibleLocationPlaceIds
                            .add(
                                locationPlace.locationPlaceId
                            );

                    }
                    else {

                        dashboardTenRuntimeState
                            .visibleLocationPlaceIds
                            .delete(
                                locationPlace.locationPlaceId
                            );

                    }

                    if (isEvent) {

                        dashboardTenRuntimeState.filterActiveEvent =
                            chkPlace.checked;

                        processBuildDashboardTenLeftPanel();

                    }

                    processRenderDashboardTenLocationPlaceOverlays();

                }
            );

            ctrPlaceAction.addEventListener(
                "click",
                () => {

                    // =====================================================
                    // Navigate To Location Place
                    //
                    // Every Location Place type uses its registered mapHome.
                    // The registered X / Y becomes viewport center at the
                    // registered OpenSeadragon zoom.
                    // =====================================================

                    processNavigateDashboardTenToLocationPlace(
                        locationPlace
                    );

                }
            );

            ctrRow.append(
                chkPlace,
                ctrPlaceAction
            );

            return ctrRow;

        };


    // =====================================================
    // Events Group
    // =====================================================

    const ctrEventsGroup =
        document.createElement(
            "div"
        );

    ctrEventsGroup.className =
        "project-dashboard-ten-place-filter-group";

    const ctrEventsTitle =
        document.createElement(
            "div"
        );

    ctrEventsTitle.className =
        "project-dashboard-ten-place-filter-group-title";

    ctrEventsTitle.textContent =
        "Events";

    ctrEventsGroup.appendChild(
        ctrEventsTitle
    );

    if (activeEventPlace) {

        ctrEventsGroup.appendChild(
            buildLocationPlaceRow(
                activeEventPlace,
                true
            )
        );

    }

    ctrFilter.appendChild(
        ctrEventsGroup
    );


    // =====================================================
    // Non-Event Groups - Group By Location Place Type
    // =====================================================

    const groupedPlaces =
        new Map<
            string,
            typeof visiblePlaces
        >();

    for (const locationPlace of visiblePlaces) {

        const groupType =
            locationPlace.type ||
            "PLACE";

        const group =
            groupedPlaces.get(
                groupType
            ) ?? [];

        group.push(
            locationPlace
        );

        groupedPlaces.set(
            groupType,
            group
        );

    }

    for (
        const [
            groupType,
            groupPlaces
        ] of groupedPlaces
    ) {

        const ctrGroup =
            document.createElement(
                "div"
            );

        ctrGroup.className =
            "project-dashboard-ten-place-filter-group";

        const ctrGroupTitle =
            document.createElement(
                "div"
            );

        ctrGroupTitle.className =
            "project-dashboard-ten-place-filter-group-title";

        ctrGroupTitle.textContent =
            groupType === "UNIT"
                ? "Units"
                : groupType.charAt(0).toUpperCase() +
                    groupType.slice(1).toLowerCase();

        ctrGroup.appendChild(
            ctrGroupTitle
        );

        for (const locationPlace of groupPlaces) {

            ctrGroup.appendChild(
                buildLocationPlaceRow(
                    locationPlace,
                    false
                )
            );

        }

        ctrFilter.appendChild(
            ctrGroup
        );

    }

    ctrDashboardTenBodyLeftBody.appendChild(
        ctrFilter
    );

}


// =====================================================
// Navigate Dashboard Ten To Location Place
// =====================================================

function processNavigateDashboardTenToLocationPlace(
    locationPlace:
        CustomerMasterLocationPlace
):
void {

    const viewer =
        dashboardTenMapViewer;

    const tiledImage =
        viewer?.world.getItemAt(
            0
        );

    if (
        !viewer ||
        !tiledImage ||
        !dashboardTenPlotPdfPage
    ) {
        return;
    }

    const nativeViewport =
        dashboardTenPlotPdfPage.getViewport(
            {
                scale:
                    1
            }
        );

    const sourceDimensions =
        tiledImage.getContentSize();

    if (
        sourceDimensions.x <= 0 ||
        sourceDimensions.y <= 0 ||
        nativeViewport.width <= 0 ||
        nativeViewport.height <= 0
    ) {
        return;
    }

    const sourcePoint =
        new OpenSeadragon.Point(
            locationPlace.mapParentMapLocationHome.x *
                (
                    sourceDimensions.x /
                    nativeViewport.width
                ),

            locationPlace.mapParentMapLocationHome.y *
                (
                    sourceDimensions.y /
                    nativeViewport.height
                )
        );

    const viewportPoint =
        tiledImage.imageToViewportCoordinates(
            sourcePoint
        );

    // =====================================================
    // Apply Registered Home View
    //
    // mapHome owns two independent values:
    // - x / y = native map point that must become viewport center.
    // - zoom = registered OpenSeadragon viewport zoom.
    //
    // IMPORTANT:
    // Do not pass viewportPoint as the zoom reference point.
    // Doing so asks OSD to preserve that point's screen position
    // during zoom instead of making it the viewport center.
    // =====================================================

    viewer.viewport.zoomTo(
        locationPlace.mapParentMapLocationHome.zoom,
        undefined,
        false
    );

    viewer.viewport.panTo(
        viewportPoint,
        false
    );

    viewer.viewport.applyConstraints(
        false
    );

    // Keep Dashboard Ten's logical zoom state synchronized with
    // the registered OSD home view used for this location place.
    const homeZoom =
        viewer.viewport.getHomeZoom();

    if (homeZoom > 0) {

        const zoomRatio =
            locationPlace.mapParentMapLocationHome.zoom /
            homeZoom;

        dashboardTenRuntimeState.zoomLevel =
            Math.max(
                0,
                Math.min(
                    dashboardTenMapZoomLevels.length - 1,
                    Math.round(zoomRatio) - 1
                )
            );

    }

    processRenderDashboardTenLocationPlaceOverlays();

}


// =====================================================
// Dashboard Ten Location Place Mouse Trackers
//
// Owns the custom OpenSeadragon MouseTracker instances
// created for the current UNIT place-overlay generation.
// OpenSeadragon retains a tracker's registration/delegate
// state independently of the overlay DOM element and of the
// viewer itself, so Dashboard Ten must explicitly destroy
// each tracker it creates rather than relying on overlay or
// viewer teardown to discover them.
// =====================================================

const dashboardTenLocationPlaceMouseTrackers:
    OpenSeadragon.MouseTracker[] =
        [];


// =====================================================
// Destroy Dashboard Ten Location Place Mouse Trackers
//
// Sole disposal owner for dashboardTenLocationPlaceMouseTrackers.
// setTracking(false) is not sufficient - destroy() is the
// installed OpenSeadragon API that releases a tracker's
// registration. Safe to call when the collection is empty.
// =====================================================

function processDestroyDashboardTenLocationPlaceMouseTrackers():
void {

    for (
        const tracker of
            dashboardTenLocationPlaceMouseTrackers
    ) {

        tracker.destroy();

    }

    dashboardTenLocationPlaceMouseTrackers.length =
        0;

}


// =====================================================
// Clear Dashboard Ten Places
//
// Places OFF is a destructive session reset.
// No Location Place overlay HTML or selection state survives.
// =====================================================

function processClearDashboardTenPlaces():
void {

    dashboardTenRuntimeState.visibleLocationPlaceIds.clear();

    dashboardTenRuntimeState.filterActiveEvent =
        false;

    processDestroyDashboardTenLocationPlaceMouseTrackers();

    const viewer =
        dashboardTenMapViewer;

    if (!viewer) {
        return;
    }

    const existingOverlays =
        Array.from(
            viewer.element.querySelectorAll(
                ".project-dashboard-ten-location-place-overlay"
            )
        );

    for (const overlay of existingOverlays) {

        viewer.removeOverlay(
            overlay as HTMLElement
        );

    }

}


// =====================================================
// Render Dashboard Ten Location Place Overlays
// =====================================================

function processRenderDashboardTenLocationPlaceOverlays():
void {

    const viewer =
        dashboardTenMapViewer;

    if (!viewer) {
        return;
    }

    processDestroyDashboardTenLocationPlaceMouseTrackers();

    const existingOverlays =
        viewer.element.querySelectorAll(
            ".project-dashboard-ten-location-place-overlay"
        );

    existingOverlays.forEach(
        overlay =>
            viewer.removeOverlay(
                overlay as HTMLElement
            )
    );

    if (
        !dashboardTenRuntimeState.showPlacesFilter
    ) {
        return;
    }

    if (
        dashboardTenSuperMaxParentView
    ) {
        return;
    }

    if (
        !dashboardTenProcessGetLocationPlacesRegistry ||
        !dashboardTenActiveState ||
        !dashboardTenPlotPdfPage
    ) {
        return;
    }

    const tiledImage =
        viewer.world.getItemAt(
            0
        );

    if (!tiledImage) {
        return;
    }

    const locationPlacesRegistry =
        dashboardTenProcessGetLocationPlacesRegistry(
            dashboardTenActiveState.locationId
        );

    if (!locationPlacesRegistry) {
        return;
    }

    const nativeViewport =
        dashboardTenPlotPdfPage.getViewport(
            {
                scale:
                    1
            }
        );

    const sourceDimensions =
        tiledImage.getContentSize();

    const nativeToSourceX =
        sourceDimensions.x /
        nativeViewport.width;

    const nativeToSourceY =
        sourceDimensions.y /
        nativeViewport.height;

    for (
        const locationPlace of
            locationPlacesRegistry.locationPlaces
    ) {

        if (
            !locationPlace.active ||
            !dashboardTenRuntimeState
                .visibleLocationPlaceIds
                .has(
                    locationPlace.locationPlaceId
                )
        ) {
            continue;
        }

        const bounds =
            locationPlace.mapParentMapLocationBounds;

        const sourceRect =
            new OpenSeadragon.Rect(
                bounds.left * nativeToSourceX,
                bounds.top * nativeToSourceY,
                bounds.width * nativeToSourceX,
                bounds.height * nativeToSourceY
            );

        const viewportRect =
            tiledImage.imageToViewportRectangle(
                sourceRect
            );

        const overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "project-dashboard-ten-location-place-overlay";

        switch (
            locationPlace.type
        ) {

            case "EVENT":

                overlay.classList.add(
                    "project-dashboard-ten-location-place-overlay-parent-event"
                );

                break;


            case "UNIT":

                overlay.classList.add(
                    "project-dashboard-ten-location-place-overlay-parent-unit"
                );

                break;


            default:

                overlay.classList.add(
                    "project-dashboard-ten-location-place-overlay-error"
                );

                break;

        }

        overlay.dataset.locationPlaceId =
            locationPlace.locationPlaceId;

        if (locationPlace.type === "UNIT") {

            // Darkest at Zoom 0; progressively lighter by .03
            // per logical zoom level, reaching .10 at Zoom 10.
            const unitFillAlpha =
                Math.max(
                    .10,
                    .40 -
                        (
                            dashboardTenRuntimeState.zoomLevel *
                            .03
                        )
                );

            overlay.style.setProperty(
                "--dashboard-ten-location-place-unit-alpha",
                unitFillAlpha.toFixed(2)
            );

        }

        // =====================================================
        // Unit Location Place Interaction - Zoom 10 Only
        //
        // Filter-row navigation remains independent of this behavior.
        // This click belongs only to the visible UNIT map overlay.
        //
        // Current proof:
        // - Confirm whether the UNIT owns an active submap.
        // - Show the UNIT's registered native mapHome coordinates.
        // - Capture the exact current OSD center / zoom that will later
        //   be restored when Super Max is closed.
        // - Do not open the submap yet.
        // =====================================================

        if (
            locationPlace.type ===
                "UNIT"
        ) {

            const unitIsClickable =
                dashboardTenRuntimeState.zoomLevel ===
                    9;

            if (
                unitIsClickable
            ) {

                overlay.classList.add(
                    "project-dashboard-ten-location-place-overlay-interactive"
                );

            }

            const unitOverlayTracker =
                new OpenSeadragon.MouseTracker(
                    {
                        element:
                            overlay,

                        clickHandler:
                           async () => {

                                if (
                                    dashboardTenRuntimeState.zoomLevel !==
                                        9 ||
                                    !dashboardTenCtrMain ||
                                    !dashboardTenProcessGetArtifact
                                ) {
                                    return;
                                }

                                // =====================================================
                                // Resolve Active UNIT Submap
                                // =====================================================

                                const unitMap =
                                    locationPlace.mapInfo;

                                if (
                                    !unitMap.mapId ||
                                    !unitMap.mapArtifactPath
                                ) {

                                    console.warn(
                                        "[DashboardTen] UNIT map is not configured:",
                                        locationPlace.locationPlaceId
                                    );

                                    return;

                                }

                                // =====================================================
                                // Resolve UNIT Map Artifact
                                // =====================================================

                                try {

                                    // =====================================================
                                    // Show Processing Overlay
                                    // =====================================================

                                    dashboardTenProcessProcessingOverlay(
                                        true,
                                        "Loading Map...",
                                        "Spinner"
                                    );

                                    // =====================================================
                                    // Grab current tilesource
                                    // =====================================================

                                    const currentTiledImage =
                                        viewer.world.getItemAt(
                                            0
                                        );

                                    if (
                                        !currentTiledImage
                                    ) {

                                        console.error(
                                            "[DashboardTen] Unable to resolve current parent map TileSource"
                                        );

                                        return;

                                    }

                                    const currentTileSource =
                                        currentTiledImage.source;

                                    // =====================================================
                                    // Capture Current Parent OSD View
                                    // =====================================================

                                    const currentCenter =
                                        viewer.viewport.getCenter();

                                    const currentZoom =
                                        viewer.viewport.getZoom();

                                    dashboardTenSuperMaxParentView = {
                                        mapIndex:
                                            dashboardTenRuntimeState.selectedMapIndex,

                                        centerX:
                                            currentCenter.x,

                                        centerY:
                                            currentCenter.y,

                                        zoom:
                                            currentZoom,

                                        tileSource:
                                            currentTileSource
                                    };

                        
                                    // =====================================================
                                    // Validate Parent OSD View
                                    // =====================================================

                                    if (
                                        !dashboardTenSuperMaxParentView ||
                                        !dashboardTenSuperMaxParentView.tileSource ||
                                        !Number.isFinite(
                                            dashboardTenSuperMaxParentView.centerX
                                        ) ||
                                        !Number.isFinite(
                                            dashboardTenSuperMaxParentView.centerY
                                        ) ||
                                        !Number.isFinite(
                                            dashboardTenSuperMaxParentView.zoom
                                        )
                                    ) {

                                        console.error(
                                            "[DashboardTen] Unable to capture parent map view"
                                        );

                                        return;

                                    }

                                    
                                    // =====================================================
                                    // Get UNIT Map Artifact
                                    // =====================================================

                                    const unitMapArtifact =
                                        await dashboardTenProcessGetArtifact(
                                            "Map",
                                            unitMap.mapArtifactPath,
                                            "IndexDB"
                                        );

                                    // =====================================================
                                    // Validate UNIT Map Artifact
                                    // =====================================================

                                    if (
                                        !unitMapArtifact ||
                                        unitMapArtifact.byteLength ===
                                            0
                                    ) {

                                        console.error(
                                            "[DashboardTen] UNIT Map Artifact is unavailable or empty:",
                                            {
                                                locationPlaceId:
                                                    locationPlace.locationPlaceId,

                                                mapId:
                                                    unitMap.mapId,

                                                mapArtifactPath:
                                                    unitMap.mapArtifactPath
                                            }
                                        );

                                        return;

                                    }


                                    // =====================================================
                                    // UNIT Map Artifact Resolved
                                    // =====================================================

                                    console.log(
                                        "[DashboardTen] UNIT Map Artifact Resolved:",
                                        {
                                            locationPlaceId:
                                                locationPlace.locationPlaceId,

                                            mapId:
                                                unitMap.mapId,

                                            mapDisplayName:
                                                unitMap.mapDisplayName,

                                            mapArtifactPath:
                                                unitMap.mapArtifactPath,

                                            byteLength:
                                                unitMapArtifact.byteLength
                                        }
                                    );


                                    // =====================================================
                                    // Resolve UNIT Map PDF
                                    // =====================================================

                                    const unitPdfLoadingTask =
                                        pdfjsLib.getDocument(
                                            {
                                                data:
                                                    new Uint8Array(
                                                        unitMapArtifact
                                                    )
                                            }
                                        );

                                    const unitPdfDocument =
                                        await unitPdfLoadingTask.promise;

                                    if (
                                        !unitPdfDocument ||
                                        unitPdfDocument.numPages <
                                            1
                                    ) {

                                        console.error(
                                            "[DashboardTen] UNIT Map PDF is unavailable or has no pages:",
                                            unitMap.mapId
                                        );

                                        return;

                                    }


                                    // =====================================================
                                    // Resolve UNIT Map PDF Page
                                    // =====================================================

                                    const unitPdfPage =
                                        await unitPdfDocument.getPage(
                                            1
                                        );

                                    if (
                                        !unitPdfPage
                                    ) {

                                        console.error(
                                            "[DashboardTen] UNIT Map PDF page could not be resolved:",
                                            unitMap.mapId
                                        );

                                        return;

                                    }


                                    // =====================================================
                                    // Replace Current Map With UNIT Map
                                    //
                                    // Reuse the existing OpenSeadragon viewer and replace
                                    // World[0] with the UNIT PDF-backed TileSource.
                                    // =====================================================

                                    await processInitializeMapViewerFromPlotCanvas(
                                        dashboardTenMapBuildGeneration,
                                        false,
                                        unitPdfPage
                                    );

                                }
                                catch (
                                    error
                                ) {

                                    console.error(
                                        "[DashboardTen] UNIT Map Artifact retrieval failed:",
                                        error
                                    );

                                    return;

                                }
                                finally {

                                    // =====================================================
                                    // Hide Processing Overlay
                                    // =====================================================

                                    dashboardTenProcessProcessingOverlay(
                                        false,
                                        "",
                                        "Spinner"
                                    );

                                }


                                // =====================================================
                                // Temporary UNIT / Super Max Proof Notification
                                // =====================================================

                                if (
                                    !dashboardTenProcessDashboardSpecialMode
                                ) {

                                    return;

                                }

                                dashboardTenProcessDashboardSpecialMode(
                                    "SuperMax",
                                    "Enter",
                                    [btnDashboardTenExpand],
                                    []
                                );

                                btnDashboardTenSuperMaxBack.classList.remove(
                                    "application-hidden"
                                );

                                // =====================================================
                                // Set Child Map Control State
                                // =====================================================

                                processDashboardSpecialModeControls(
                                    [
                                        {
                                            disabled: true,
                                            visible: true
                                        }, // Plot

                                        {
                                            disabled: true,
                                            visible: true
                                        }, // Satellite

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Places

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Jobs

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Safety

                                        {
                                            disabled: true,
                                            visible: false
                                        }, // Grid

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Sub Grid

                                        {
                                            disabled: true,
                                            visible: true
                                        }, // Heat

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Zoom In

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Zoom Out

                                        {
                                            disabled: false,
                                            visible: true
                                        }, // Home

                                        {
                                            disabled: false,
                                            visible: true
                                        } // Edit
                                    ]
                                );

                            }
                    }
                );

            dashboardTenLocationPlaceMouseTrackers.push(
                unitOverlayTracker
            );

            unitOverlayTracker.setTracking(
                unitIsClickable
            );

        }


        viewer.addOverlay(
            {
                element:
                    overlay,

                location:
                    viewportRect
            }
        );

        if (
            locationPlace.type ===
                "EVENT" &&
            overlay.parentElement
        ) {

            OpenSeadragon.setElementPointerEventsNone(
                overlay.parentElement
            );

        }

    }

}


// =====================================================
// 11 - Kill Dashboard Ten
// =====================================================

export function processKillDashboardTen():
void {

    console.log(
        "[DashboardTen] ENTER processKillDashboardTen"
    );

    // =====================================================
    // Disconnect Dashboard Ten Resize Observer
    // =====================================================

    dashboardTenResizeObserver.disconnect();

    processDestroyMapViewer();


    // =====================================================
    // Invalidate Previous Map Build Generation
    //
    // Ensures a map build already in flight when Dashboard Ten
    // is killed cannot mutate state after the user has left.
    // =====================================================

    dashboardTenMapBuildGeneration +=
        1;


    // =====================================================
    // Clear Dashboard-Specific Data Stores
    // =====================================================

    dashboardTenDataStoreOne.clear();


    // =====================================================
    // Clear Map Render References
    //
    // index.ts destroys the actual Dashboard Ten DOM
    // immediately after this helper runs.
    // =====================================================

    ctrDashboardTenBodyRightBodyMapViewport =
        null;

    ctrDashboardTenBodyRightBodyMapScrollSurface =
        null;

    ctrDashboardTenBodyRightBodyMapStage =
        null;

    ctrDashboardTenMapLayerSatellite =
        null;

    ctrDashboardTenMapLayerPlot =
        null;

    ctrDashboardTenMapLayerPrimaryGrid =
        null;

    ctrDashboardTenMapLayerSubGrid =
        null;

    ctrDashboardTenMapLayerJobs =
        null;

    ctrDashboardTenMapLayerHeat =
        null;

    cvsDashboardTenBodyRightBodyMapStagePlot =
        null;

    dashboardTenPlotPdfPage =
        null;


    // =====================================================
    // Clear Dashboard Dependencies
    // =====================================================

    dashboardTenCustomerMasterRegistry =
        null;

    dashboardTenActiveState =
        null;

    dashboardTenProcessGetArtifact =
        null;

    dashboardTenProcessGetLocationPlacesRegistry =
        null;

    dashboardTenShowMessage =
        null;

    dashboardTenSuperMaxParentView =
        null;

    dashboardTenCtrMain =
        null;

    dashboardTenProcessDashboardSpecialMode =
    null;


    // =====================================================
    // Inspect Kill State
    // =====================================================

    console.log(
        "[DashboardTen] Data Stores After Kill:",
        {
            dataStoreOne:
                dashboardTenDataStoreOne.size,

            selectedMapIndex:
                dashboardTenRuntimeState.selectedMapIndex
        }
    );


    console.log(
        "[DashboardTen] EXIT processKillDashboardTen"
    );

}


// =====================================================
// 12 - Dashboard Specific Helpers
// =====================================================

// =====================================================
// Build Selected Map
//
// Selector passes only the map index.
//
// Minibuilder owns:
// - Body Right Header
// - Body Right Body
// - Body Right Footer
//
// Current:
// - Resolve selected map record
// - Resolve resident map BIN
// - Unpack map manifest / payload assets
// - Resolve plot PDF from the map package
// - Keep satellite assets available from the map package
// - Build map header layer controls
// - Build map viewport
// - Build shared site/map stage
// - Build ALL permanent spatial layer hosts
// - Build map zoom controls
// - Render PDF page into Plot layer
// - Build visual Primary Grid
// - Build visual Sub Grid only at Dashboard Ten Zoom 10
// - Fit / zoom shared map stage within scrollable viewport
//
// Header Layer Controls:
// - Plot
// - Satellite
// - Locations
// - Safety
// - Jobs
// - Grids
//
// Permanent Visual Stack:
// - Satellite
// - Plot
// - Primary Grid
// - Sub-grid
// - Jobs
// - Heat
//
// IMPORTANT:
// - The shared stage owns fit / zoom; viewport scroll owns pan.
// - Individual layers own only their projection / rendering.
// - Plot pixels are NOT the long-term master coordinate system.
// - Plot currently bootstraps shared stage dimensions.
// - Plot / satellite calibration will establish the neutral
//   site coordinate model.
// =====================================================

async function processBuildMap(
    mapIndex:
        number,

    buildGeneration:
        number
):
Promise<void> {

    // =====================================================
    // Resolve Map
    // =====================================================

    const map =
        dashboardTenDataStoreOne.get(
            mapIndex
        );

    if (
        !map
    ) {

        return;

    }


    // =====================================================
    // Validate Artifact Resolver
    // =====================================================

    if (
        !dashboardTenProcessGetArtifact
    ) {

        console.error(
            "[DashboardTen] Artifact resolver is not available"
        );

        return;

    }


    // =====================================================
    // Clear Selected Map Containers
    // =====================================================

    ctrDashboardTenBodyRightHeader.replaceChildren();

    ctrDashboardTenBodyRightBody.replaceChildren();

    ctrDashboardTenBodyRightFooter.replaceChildren();


    // =====================================================
    // Clear Previous Map Render References
    // =====================================================

    ctrDashboardTenBodyRightBodyMapViewport =
        null;

    ctrDashboardTenBodyRightBodyMapScrollSurface =
        null;

    ctrDashboardTenBodyRightBodyMapStage =
        null;

    ctrDashboardTenMapLayerSatellite =
        null;

    ctrDashboardTenMapLayerPlot =
        null;

    ctrDashboardTenMapLayerPrimaryGrid =
        null;

    ctrDashboardTenMapLayerSubGrid =
        null;

    ctrDashboardTenMapLayerJobs =
        null;

    ctrDashboardTenMapLayerHeat =
        null;

    cvsDashboardTenBodyRightBodyMapStagePlot =
        null;

    dashboardTenPlotPdfPage =
        null;


    // =====================================================
    // Build Map Header Left
    // =====================================================

    const ctrDashboardTenBodyRightHeaderLeft =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightHeaderLeft.className =
        "project-dashboard-ten-body-right-header-left";


    // =====================================================
    // Build Map Header Title
    // =====================================================

    const ctrDashboardTenBodyRightHeaderTitle =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightHeaderTitle.className =
        "project-dashboard-ten-body-right-header-title";

    ctrDashboardTenBodyRightHeaderTitle.textContent =
        map.mapName;


    // =====================================================
    // Assemble Map Header Left
    // =====================================================

    ctrDashboardTenBodyRightHeaderLeft.appendChild(
        ctrDashboardTenBodyRightHeaderTitle
    );


    // =====================================================
    // Build Map Header Right
    // =====================================================

    const ctrDashboardTenBodyRightHeaderRight =
        document.createElement(
            "div"
        );

    ctrDashboardTenBodyRightHeaderRight.className =
        "project-dashboard-ten-body-right-header-right";


    // =====================================================
    // Build / Mount Map Layer Controls
    // =====================================================

    ctrDashboardTenBodyRightHeaderRight.appendChild(
        processBuildMapLayerControls()
    );


    // =====================================================
    // Assemble Map Header
    // =====================================================

    ctrDashboardTenBodyRightHeader.append(
        ctrDashboardTenBodyRightHeaderLeft,
        ctrDashboardTenBodyRightHeaderRight
    );


    // =====================================================
    // Resolve Map Artifact
    //
    // The resident artifact is the complete location-map BIN.
    // Plot and satellite assets are extracted from this package
    // in memory. The BIN remains the IndexedDB cache unit.
    // =====================================================

    try {

        const mapArtifact =
            await dashboardTenProcessGetArtifact(
                "Map",
                map.mapArtifactPath,
                "IndexDB"
            );


        // =====================================================
        // Unpack Map Artifact
        // =====================================================

        const mapPackage =
            processUnpackMapArtifact(
                mapArtifact
            );

        const plotArtifact =
            mapPackage.plotArtifact;


        console.log(
            "[DashboardTen] Map Artifact Resolved:",
            {
                index:
                    map.index,

                mapName:
                    map.mapName,

                mapArtifactPath:
                    map.mapArtifactPath,

                packageByteLength:
                    mapArtifact.byteLength,

                plotByteLength:
                    plotArtifact.byteLength,

                hasSatelliteThumbnail:
                    mapPackage.satelliteThumbnailArtifact !==
                        null,

                satelliteLevels:
                    Array.from(
                        mapPackage
                            .satelliteLevelArtifacts
                            .keys()
                    )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                a -
                                b
                        )
            }
        );


        // =====================================================
        // Validate Current Selection
        //
        // Prevent an older async render from mounting if the
        // user selected another map while this artifact was
        // resolving.
        //
        // Also validate the captured map build generation so a
        // build resumed after Dashboard Ten was rebuilt or
        // killed while this artifact was resolving cannot mount.
        // =====================================================

        if (
            !processIsCurrentMapBuildGeneration(
                buildGeneration
            ) ||
            dashboardTenRuntimeState.selectedMapIndex !==
                mapIndex
        ) {

            return;

        }


        // =====================================================
        // Build Map Viewport
        // Screen-Space Host
        // =====================================================

        ctrDashboardTenBodyRightBodyMapViewport =
            document.createElement(
                "div"
            );

        ctrDashboardTenBodyRightBodyMapViewport.className =
            "project-dashboard-ten-body-right-body-map-viewport";


        // =====================================================
        // Build OpenSeadragon Viewer Host
        //
        // Viewer Contract:
        // - OpenSeadragon owns pan / zoom / bounds / gestures.
        // - Dashboard Ten owns data, toolbar, and map semantics.
        // - Native plot coordinates remain the placement space.
        // =====================================================

        ctrDashboardTenBodyRightBodyMapViewport.style.overflow =
            "hidden";

        ctrDashboardTenBodyRightBodyMapViewport.style.position =
            "relative";

        dashboardTenMapViewerHost =
            document.createElement(
                "div"
            );

        dashboardTenMapViewerHost.className =
            "project-dashboard-ten-map-viewer";

        dashboardTenMapViewerHost.style.position =
            "absolute";

        dashboardTenMapViewerHost.style.inset =
            "0";

        dashboardTenMapViewerHost.style.width =
            "100%";

        dashboardTenMapViewerHost.style.height =
            "100%";

        dashboardTenMapViewerHost.style.zIndex =
            "10";

        ctrDashboardTenBodyRightBodyMapViewport.appendChild(
            dashboardTenMapViewerHost
        );


        // =====================================================
        // Build Map Scroll Surface
        //
        // The viewport owns native browser scrolling.
        // This surface owns the REAL displayed layout extent.
        // The stage remains in native map coordinates.
        // =====================================================

        ctrDashboardTenBodyRightBodyMapScrollSurface =
            document.createElement(
                "div"
            );

        ctrDashboardTenBodyRightBodyMapScrollSurface.className =
            "project-dashboard-ten-body-right-body-map-scroll-surface";

        ctrDashboardTenBodyRightBodyMapScrollSurface.style.position =
            "relative";

        ctrDashboardTenBodyRightBodyMapScrollSurface.style.flex =
            "0 0 auto";

        ctrDashboardTenBodyRightBodyMapScrollSurface.style.visibility =
            "hidden";

        ctrDashboardTenBodyRightBodyMapScrollSurface.style.pointerEvents =
            "none";


        // =====================================================
        // Build Shared Map Stage
        //
        // This is the common spatial host for every Dashboard
        // Ten layer.
        //
        // IMPORTANT:
        // - The stage owns fit / zoom; viewport scroll owns pan.
        // - Satellite and Plot are peer base layers.
        // - Grid / Jobs / Heat render above the base layers.
        // - Plot pixels are only a temporary bootstrap geometry.
        // - Calibration will establish neutral site coordinates.
        // =====================================================

        ctrDashboardTenBodyRightBodyMapStage =
            document.createElement(
                "div"
            );

        ctrDashboardTenBodyRightBodyMapStage.className =
            "project-dashboard-ten-body-right-body-map-stage";

        ctrDashboardTenBodyRightBodyMapStage.style.position =
            "absolute";

        ctrDashboardTenBodyRightBodyMapStage.style.left =
            "0";

        ctrDashboardTenBodyRightBodyMapStage.style.top =
            "0";

        ctrDashboardTenBodyRightBodyMapStage.style.transformOrigin =
            "0 0";


        // =====================================================
        // Build Satellite Layer
        // Z 0
        //
        // Renderer is intentionally separate from the Plot
        // renderer. This host exists NOW so satellite is part of
        // the foundational architecture rather than a retrofit.
        // =====================================================

        ctrDashboardTenMapLayerSatellite =
            processCreateMapLayer(
                "satellite",
                0
            );


        // =====================================================
        // Build Plot Layer
        // Z 1
        // =====================================================

        ctrDashboardTenMapLayerPlot =
            processCreateMapLayer(
                "plot",
                1
            );


        // =====================================================
        // Build Primary Grid Layer
        // Z 2
        // =====================================================

        ctrDashboardTenMapLayerPrimaryGrid =
            processCreateMapLayer(
                "primary-grid",
                2
            );

        ctrDashboardTenMapLayerPrimaryGrid.style.pointerEvents =
            "none";


        // =====================================================
        // Build Sub Grid Layer
        // Z 3
        //
        // Dedicated layer. Primary Grid is never cleared or
        // restyled by Sub Grid rendering.
        // =====================================================

        ctrDashboardTenMapLayerSubGrid =
            processCreateMapLayer(
                "sub-grid",
                3
            );

        ctrDashboardTenMapLayerSubGrid.style.pointerEvents =
            "none";


        // =====================================================
        // Build Jobs Layer
        // Z 4
        // =====================================================

        ctrDashboardTenMapLayerJobs =
            processCreateMapLayer(
                "jobs",
                4
            );


        // =====================================================
        // Build Heat Layer
        // Z 5
        // =====================================================

        ctrDashboardTenMapLayerHeat =
            processCreateMapLayer(
                "heat",
                5
            );


        // =====================================================
        // Build Plot Canvas
        //
        // PDF.js renders only into the Plot layer.
        // The canvas does NOT define ownership of the common
        // coordinate system.
        // =====================================================

        cvsDashboardTenBodyRightBodyMapStagePlot =
            document.createElement(
                "canvas"
            );

        cvsDashboardTenBodyRightBodyMapStagePlot.className =
            "project-dashboard-ten-body-right-body-map-stage-plot";

        cvsDashboardTenBodyRightBodyMapStagePlot.style.display =
            "block";
        
        
        // =====================================================
        // Temporary Plot Calibration Click Capture
        //
        // Converts the visible / scaled canvas click back into
        // the native PDF plot coordinate plane.
        //
        // TEMPORARY:
        // Remove after Plot <-> Geo calibration is complete.
        // =====================================================

        ctrDashboardTenMapLayerPlot.style.pointerEvents =
            "auto";

        cvsDashboardTenBodyRightBodyMapStagePlot.addEventListener(
            "click",
            event => {

                const rect =
                    cvsDashboardTenBodyRightBodyMapStagePlot!
                        .getBoundingClientRect();

                const scaleX =
                    cvsDashboardTenBodyRightBodyMapStagePlot!.width /
                    rect.width;

                const scaleY =
                    cvsDashboardTenBodyRightBodyMapStagePlot!.height /
                    rect.height;

                const plotX =
                    (
                        event.clientX -
                        rect.left
                    ) *
                    scaleX;

                const plotY =
                    (
                        event.clientY -
                        rect.top
                    ) *
                    scaleY;

                console.log(
                    "[DashboardTen] Plot Calibration Point:",
                    {
                        plotX:
                            Math.round(
                                plotX
                            ),

                        plotY:
                            Math.round(
                                plotY
                            )
                    }
                );

            }
        );

        // =====================================================
        // Assemble Plot Layer
        // =====================================================

        ctrDashboardTenMapLayerPlot.appendChild(
            cvsDashboardTenBodyRightBodyMapStagePlot
        );


        // =====================================================
        // Assemble Permanent Layer Stack
        // =====================================================

        ctrDashboardTenBodyRightBodyMapStage.append(
            ctrDashboardTenMapLayerSatellite,
            ctrDashboardTenMapLayerPlot,
            ctrDashboardTenMapLayerPrimaryGrid,
            ctrDashboardTenMapLayerSubGrid,
            ctrDashboardTenMapLayerJobs,
            ctrDashboardTenMapLayerHeat
        );


        // =====================================================
        // Mount Native Map Stage
        // =====================================================

        ctrDashboardTenBodyRightBodyMapScrollSurface.appendChild(
            ctrDashboardTenBodyRightBodyMapStage
        );

        ctrDashboardTenBodyRightBodyMapViewport.appendChild(
            ctrDashboardTenBodyRightBodyMapScrollSurface
        );


        // =====================================================
        // Build Map Zoom Controls
        // =====================================================

        const ctrDashboardTenMapZoomControls =
            document.createElement(
                "div"
            );

        ctrDashboardTenMapZoomControls.className =
            "project-dashboard-ten-map-toolbar-group";

        ctrDashboardTenMapZoomControls.style.color =
            "#ffffff";


        // =====================================================
        // Build Map Zoom In Button
        // =====================================================

        btnDashboardTenMapZoomIn =
            document.createElement(
                "button"
            );

        btnDashboardTenMapZoomIn.type =
            "button";

        btnDashboardTenMapZoomIn.className =
            "project-dashboard-ten-map-toolbar-control";

        btnDashboardTenMapZoomIn.style.color =
            "#ffffff";

        btnDashboardTenMapZoomIn.textContent =
            "+";

        btnDashboardTenMapZoomIn.title =
            "Zoom In";

        ctrDashboardTenMapZoomControls.appendChild(
            btnDashboardTenMapZoomIn
        );


        // =====================================================
        // Build Map Zoom Out Button
        // =====================================================

        btnDashboardTenMapZoomOut =
            document.createElement(
                "button"
            );

        btnDashboardTenMapZoomOut.type =
            "button";

        btnDashboardTenMapZoomOut.className =
            "project-dashboard-ten-map-toolbar-control";

        btnDashboardTenMapZoomOut.style.color =
            "#ffffff";

        btnDashboardTenMapZoomOut.textContent =
            "−";

        btnDashboardTenMapZoomOut.title =
            "Zoom Out";

        ctrDashboardTenMapZoomControls.appendChild(
            btnDashboardTenMapZoomOut
        );

        // =====================================================
        // Preserve Dashboard Ten Zoom Control References
        //
        // OpenSeadragon owns the authoritative zoom camera.
        // Wheel / gesture zoom can therefore update these same
        // controls when a Dashboard Ten level boundary changes.
        // =====================================================

        dashboardTenMapZoomInButton =
            btnDashboardTenMapZoomIn;

        dashboardTenMapZoomOutButton =
            btnDashboardTenMapZoomOut;


        // =====================================================
        // Build Map Home Button
        // =====================================================

        btnDashboardTenMapHome =
            document.createElement(
                "button"
            );

        btnDashboardTenMapHome.type =
            "button";

        btnDashboardTenMapHome.className =
            "project-dashboard-ten-map-toolbar-control";

        btnDashboardTenMapHome.style.color =
            "#ffffff";

        btnDashboardTenMapHome.textContent =
            "⌂";

        btnDashboardTenMapHome.title =
            "Reset Map View";

        ctrDashboardTenMapZoomControls.appendChild(
            btnDashboardTenMapHome
        );

        // =====================================================
        // Developer Registration Edit
        // =====================================================

        btnDashboardTenMapRegistrationEdit = document.createElement("button");
        btnDashboardTenMapRegistrationEdit.type = "button";
        btnDashboardTenMapRegistrationEdit.className =
            "project-dashboard-ten-map-toolbar-control project-dashboard-ten-map-registration-edit-button";
        btnDashboardTenMapRegistrationEdit.style.color = "#ffffff";
        btnDashboardTenMapRegistrationEdit.textContent = "Edit";
        btnDashboardTenMapRegistrationEdit.title = "Toggle Map Registration Edit";

        btnDashboardTenMapRegistrationEdit.addEventListener(
            "click",
            () => processSetMapRegistrationEditMode(
                !dashboardTenRuntimeState.registrationEditEnabled
            )
        );

        ctrDashboardTenMapZoomControls.appendChild(
            btnDashboardTenMapRegistrationEdit
        );

        // =====================================================
        // Mount Unified Map Toolbar Navigation
        //
        // Plot Satellite
        // |
        // Places Jobs Safety
        // |
        // Grid Sub Grid Heat
        // |
        // Zoom In Zoom Out Home Edit
        // |
        // Maximize
        // =====================================================


        // =====================================================
        // Capture Navigation Group
        // =====================================================

        ctrDashboardTenMapToolbarGroupNavigation =
            ctrDashboardTenMapZoomControls;


        // =====================================================
        // Build Navigation / Maximize Separator
        // =====================================================

        spnDashboardTenMapToolbarSeparatorFour =
            document.createElement(
                "span"
            );

        spnDashboardTenMapToolbarSeparatorFour.className =
            "project-dashboard-ten-map-toolbar-separator";

        spnDashboardTenMapToolbarSeparatorFour.textContent =
            "|";


        // =====================================================
        // Normalize Expand Control
        // =====================================================

        btnDashboardTenExpand.className =
            "project-dashboard-ten-map-toolbar-control";

        btnDashboardTenExpand.style.color =
            "#ffffff";


        // =====================================================
        // Mount Navigation Group
        //
        // Expand already occupies the final toolbar position.
        // Insert the completed navigation group and its final
        // separator immediately before Expand.
        // =====================================================

        btnDashboardTenExpand.before(
            ctrDashboardTenMapToolbarGroupNavigation,
            spnDashboardTenMapToolbarSeparatorFour
        );

        // =====================================================
        // Map Zoom In
        // =====================================================

        btnDashboardTenMapZoomIn.addEventListener(
            "click",
            async () => {

                await processChangeMapZoom(
                    "In",
                    btnDashboardTenMapZoomIn,
                    btnDashboardTenMapZoomOut
                );

            }
        );


        // =====================================================
        // Map Zoom Out
        // =====================================================

        btnDashboardTenMapZoomOut.addEventListener(
            "click",
            async () => {

                await processChangeMapZoom(
                    "Out",
                    btnDashboardTenMapZoomIn,
                    btnDashboardTenMapZoomOut
                );

            }
        );


        // =====================================================
        // Map Home
        // =====================================================

        btnDashboardTenMapHome.addEventListener(
            "click",
            async () => {

                // =====================================================
                // Reset Zoom
                // =====================================================

                dashboardTenRuntimeState.zoomLevel =
                    0;

                dashboardTenRuntimeState.isPanning =
                    false;

                dashboardTenRuntimeState.panDragIsActive =
                    false;


                // =====================================================
                // Reset OpenSeadragon View
                // =====================================================

                if (
                    dashboardTenMapViewer?.viewport
                ) {

                    dashboardTenMapViewer.viewport.goHome(
                        false
                    );

                }

                processRenderDashboardTenLocationPlaceOverlays();

                processBuildMapSubGrid(
                    map.mapGrid.primary,
                    btnDashboardTenMapZoomIn,
                    btnDashboardTenMapZoomOut
                );

                processUpdateMapZoomControls(
                    btnDashboardTenMapZoomIn,
                    btnDashboardTenMapZoomOut
                );

            }
        );

        // =====================================================
        // Initialize Map Zoom Control State
        // =====================================================

        processUpdateMapZoomControls(
            btnDashboardTenMapZoomIn,
            btnDashboardTenMapZoomOut
        );


        // =====================================================
        // Mount Map Viewport
        // =====================================================

        ctrDashboardTenBodyRightBody.appendChild(
            ctrDashboardTenBodyRightBodyMapViewport
        );


        // =====================================================
        // Observe Map Viewport Resize
        // =====================================================

        dashboardTenResizeObserver.observe(
            ctrDashboardTenBodyRightBodyMapViewport
        );


        // =====================================================
        // Load Plot PDF From Unpacked Map Package
        // =====================================================

        const pdfLoadingTask =
            pdfjsLib.getDocument(
                {
                    data:
                        new Uint8Array(
                            plotArtifact
                        )
                }
            );

        let pdfDocument:
            pdfjsLib.PDFDocumentProxy;

        try {

            pdfDocument =
                await pdfLoadingTask.promise;

        }
        catch (
            error
        ) {

            // =================================================
            // Destroy Unresolved Loading Task
            //
            // The document never resolved, so only the loading
            // task itself can release the underlying PDF.js
            // worker. Local ownership ends here; rethrow so the
            // existing outer build error handling still applies.
            // =================================================

            void pdfLoadingTask
                .destroy()
                .catch(
                    destroyError => {

                        console.error(
                            "[DashboardTen] PDF document destroy failed:",
                            destroyError
                        );

                    }
                );

            throw error;

        }


        // =====================================================
        // Resolve Plot Page
        // =====================================================

        let pdfPage:
            pdfjsLib.PDFPageProxy;

        try {

            pdfPage =
                await pdfDocument.getPage(
                    1
                );

        }
        catch (
            error
        ) {

            // =================================================
            // Destroy Unpublished Resolved Document
            //
            // The page never resolved, so this document was
            // never published to Dashboard Ten ownership and
            // must destroy itself. Rethrow so the existing outer
            // build error handling still applies.
            // =================================================

            void pdfDocument
                .destroy()
                .catch(
                    destroyError => {

                        console.error(
                            "[DashboardTen] PDF document destroy failed:",
                            destroyError
                        );

                    }
                );

            throw error;

        }


        // =====================================================
        // Validate Map Build Generation
        //
        // Prevent a build resumed after Dashboard Ten was
        // rebuilt or killed while the plot page was resolving
        // from assigning shared PDF state.
        // =====================================================

        if (
            !processIsCurrentMapBuildGeneration(
                buildGeneration
            )
        ) {

            // =================================================
            // Destroy Unpublished Stale PDF Document
            //
            // This document was never published to Dashboard Ten
            // ownership, so processDestroyMapViewer() has no
            // reference to it and cannot clean it up. This build
            // must destroy its own document before abandoning it.
            // =================================================

            void pdfDocument
                .destroy()
                .catch(
                    error => {

                        console.error(
                            "[DashboardTen] PDF document destroy failed:",
                            error
                        );

                    }
                );

            return;

        }

        dashboardTenPlotPdfPage =
            pdfPage;

        dashboardTenPlotPdfDocument =
            pdfDocument;


        // =====================================================
        // Resolve Plot Render Geometry
        // =====================================================

        const plotViewport =
            pdfPage.getViewport(
                {
                    scale:
                        1
                }
            );


        // =====================================================
        // Bootstrap Shared Stage Geometry From Plot
        // =====================================================

        ctrDashboardTenBodyRightBodyMapStage.style.width =
            `${plotViewport.width}px`;

        ctrDashboardTenBodyRightBodyMapStage.style.height =
            `${plotViewport.height}px`;


        // =====================================================
        // Build Primary Grid
        // =====================================================

        processBuildMapPrimaryGrid(
            map.mapGrid.primary
        );


        // =====================================================
        // Primary Grid Is Visual Only
        //
        // No interaction-cell DOM is built.
        // Grid addresses remain available through geometry helpers
        // for future object placement / coordinate resolution.
        // =====================================================


        // =====================================================
        // Render Base Plot
        // =====================================================

        // =====================================================
        // Initialize PDF.js Backed OpenSeadragon TileSource
        //
        // The previous full-page 5x raster bootstrap is no longer
        // required. OSD now requests PDF-rendered tiles directly.
        // =====================================================

        // =====================================================
        // Validate Map Build Generation
        //
        // Prevent a build resumed after Dashboard Ten was
        // rebuilt or killed while prior awaits were resolving
        // from constructing / mounting a new OSD viewer.
        // =====================================================

        if (
            !processIsCurrentMapBuildGeneration(
                buildGeneration
            )
        ) {

            return;

        }

        await processInitializeMapViewerFromPlotCanvas(
            buildGeneration
        );


        // =====================================================
        // Validate Map Build Generation
        //
        // Prevent a build resumed after Dashboard Ten was
        // rebuilt or killed while OSD was initializing from
        // continuing on to Sub Grid / shared-state work.
        // =====================================================

        if (
            !processIsCurrentMapBuildGeneration(
                buildGeneration
            )
        ) {

            return;

        }


        // =====================================================
        // Build Visual Progressive Sub Grid
        //
        // Passive linework only. No grid interaction DOM.
        // =====================================================

        processBuildMapSubGrid(
            map.mapGrid.primary,
            btnDashboardTenMapZoomIn,
            btnDashboardTenMapZoomOut
        );


        // =====================================================
        // Validate Current Selection After Render
        // =====================================================

        if (
            dashboardTenRuntimeState.selectedMapIndex !==
                mapIndex
        ) {

            return;

        }


        // =====================================================
        // Inspect Plot / Stage Bootstrap Geometry
        // =====================================================

        console.log(
            "[DashboardTen] Plot mounted:",
            {
                index:
                    map.index,

                mapName:
                    map.mapName,

                width:
                    plotViewport.width,

                height:
                    plotViewport.height,

                pages:
                    pdfDocument.numPages
            }
        );

    }
    catch (
        error
    ) {

        console.error(
            "[DashboardTen] Map build failed:",
            error
        );

    }

}
        

// =====================================================
// Unpack Map Artifact
//
// BIN Layout:
//
// [4 bytes]
//     Manifest JSON byte length - UInt32 little endian
//
// [manifest JSON]
//     UTF-8 encoded
//
// [payload bytes]
//     Assets located using manifest-relative offsets.
//
// Returns:
// - Manifest
// - Plot PDF bytes
// - Satellite thumbnail bytes
// - Satellite level bytes
//
// IMPORTANT:
// Asset offsets are relative to the beginning of the
// binary payload, NOT the beginning of the BIN.
// =====================================================

function processUnpackMapArtifact(
    mapArtifact:
        ArrayBuffer
):
DashboardTenMapArtifactPackage {

    // =====================================================
    // 1 - Validate Minimum Package Size
    // =====================================================

    if (
        mapArtifact.byteLength <
            4
    ) {

        throw new Error(
            "[DashboardTen] Map artifact is too small"
        );

    }


    // =====================================================
    // 2 - Read Manifest Length
    // =====================================================

    const dataView =
        new DataView(
            mapArtifact
        );

    const manifestLength =
        dataView.getUint32(
            0,
            true
        );


    // =====================================================
    // 3 - Resolve / Validate Payload Start
    // =====================================================

    const payloadStart =
        4 +
        manifestLength;

    if (
        manifestLength <=
            0 ||
        payloadStart >
            mapArtifact.byteLength
    ) {

        throw new Error(
            "[DashboardTen] Map artifact manifest range is invalid"
        );

    }


    // =====================================================
    // 4 - Decode Manifest
    // =====================================================

    const manifestBytes =
        new Uint8Array(
            mapArtifact,
            4,
            manifestLength
        );

    const manifestJson =
        new TextDecoder()
            .decode(
                manifestBytes
            );


    let manifest:
        DashboardTenMapArtifactManifest;

    try {

        manifest =
            JSON.parse(
                manifestJson
            ) as DashboardTenMapArtifactManifest;

    }
    catch (
        error
    ) {

        throw new Error(
            `[DashboardTen] Map artifact manifest could not be decoded: ${String(error)}`
        );

    }


    // =====================================================
    // 5 - Validate Manifest Contract
    // =====================================================

    if (
        manifest.artifactType !==
            "location-map"
    ) {

        throw new Error(
            `[DashboardTen] Unsupported map artifact type: ${manifest.artifactType}`
        );

    }


    if (
        manifest.schemaVersion !==
            1
    ) {

        throw new Error(
            `[DashboardTen] Unsupported map artifact schema version: ${manifest.schemaVersion}`
        );

    }


    if (
        !Array.isArray(
            manifest.assets
        )
    ) {

        throw new Error(
            "[DashboardTen] Map artifact assets are not available"
        );

    }


    // =====================================================
    // 6 - Runtime Asset Containers
    // =====================================================

    let plotArtifact:
        ArrayBuffer | null =
            null;

    let satelliteThumbnailArtifact:
        ArrayBuffer | null =
            null;

    const satelliteLevelArtifacts =
        new Map<
            number,
            ArrayBuffer
        >();


    // =====================================================
    // 7 - Extract Manifest Assets
    // =====================================================

    for (
        const asset of
        manifest.assets
    ) {

        // =================================================
        // 7.1 - Validate Asset Definition
        // =================================================

        if (
            !Number.isInteger(
                asset.offset
            ) ||
            !Number.isInteger(
                asset.length
            ) ||
            asset.offset <
                0 ||
            asset.length <=
                0
        ) {

            throw new Error(
                `[DashboardTen] Invalid map asset definition: ${asset.fileName}`
            );

        }


        // =================================================
        // 7.2 - Resolve Absolute BIN Range
        // =================================================

        const absoluteStart =
            payloadStart +
            asset.offset;

        const absoluteEnd =
            absoluteStart +
            asset.length;


        // =================================================
        // 7.3 - Validate Asset Range
        // =================================================

        if (
            absoluteStart <
                payloadStart ||
            absoluteEnd >
                mapArtifact.byteLength
        ) {

            throw new Error(
                `[DashboardTen] Map asset range is outside package bounds: ${asset.fileName}`
            );

        }


        // =================================================
        // 7.4 - Extract Asset Bytes
        // =================================================

        const artifact =
            mapArtifact.slice(
                absoluteStart,
                absoluteEnd
            );


        // =================================================
        // 7.5 - Plot
        // =================================================

        if (
            asset.role ===
                "plot"
        ) {

            plotArtifact =
                artifact;

            continue;

        }


        // =================================================
        // 7.6 - Satellite Thumbnail
        // =================================================

        if (
            asset.role ===
                "satellite.thumbnail"
        ) {

            satelliteThumbnailArtifact =
                artifact;

            continue;

        }


        // =================================================
        // 7.7 - Satellite Full Level
        // =================================================

        if (
            asset.role ===
                "satellite.full" &&
            typeof asset.level ===
                "number"
        ) {

            satelliteLevelArtifacts.set(
                asset.level,
                artifact
            );

        }

    }


    // =====================================================
    // 8 - Validate Required Plot Asset
    // =====================================================

    if (
        !plotArtifact
    ) {

        throw new Error(
            "[DashboardTen] Map artifact does not contain a plot asset"
        );

    }


    // =====================================================
    // 9 - Inspect Unpacked Package
    // =====================================================

    console.log(
        "[DashboardTen] Map Artifact Unpacked:",
        {
            artifactType:
                manifest.artifactType,

            schemaVersion:
                manifest.schemaVersion,

            customerId:
                manifest.customerId,

            locationId:
                manifest.locationId,

            mapId:
                manifest.mapId,

            mapName:
                manifest.mapName,

            assets:
                manifest.assets.length,

            plotBytes:
                plotArtifact.byteLength,

            hasSatelliteThumbnail:
                satelliteThumbnailArtifact !==
                    null,

            satelliteLevels:
                Array.from(
                    satelliteLevelArtifacts.keys()
                )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a -
                            b
                    )
        }
    );


    // =====================================================
    // 10 - Return Runtime Package
    // =====================================================

    return {

        manifest,

        plotArtifact,

        satelliteThumbnailArtifact,

        satelliteLevelArtifacts

    };

}


// =====================================================
// Create Map Layer
//
// Creates one permanent spatial host inside the shared map
// stage. Every layer occupies the complete stage plane.
//
// The layer itself does not own zoom / pan / fit.
// =====================================================

function processCreateMapLayer(
    layerName:
        string,

    zIndex:
        number
):
HTMLDivElement {

    const layer =
        document.createElement(
            "div"
        );

    layer.className =
        `project-dashboard-ten-map-layer project-dashboard-ten-map-layer-${layerName}`;

    layer.dataset.layer =
        layerName;

    layer.style.position =
        "absolute";

    layer.style.inset =
        "0";

    layer.style.zIndex =
        zIndex.toString();

    layer.style.pointerEvents =
        "none";

    return layer;

}


// =====================================================
// Build Map Layer Controls
//
// Builds Dashboard Ten map layer controls.
//
// Group 1 - Base Views:
// - Plot
// - Satellite
//
// Group 2 - Overlays:
// - Locations
// - Safety
// - Jobs
//
// Group 3 - Spatial Reference:
// - Grids
//
// IMPORTANT:
// - This helper builds and returns the controls only.
// - Parent builder owns mounting.
// =====================================================

function processBuildMapLayerControls():
HTMLDivElement {

    // =====================================================
    // 1 - Build Map Layer Control Container
    // =====================================================

    ctrDashboardTenMapToolbar =
        document.createElement(
            "div"
        );

    ctrDashboardTenMapToolbar.className =
        "project-dashboard-ten-map-toolbar";


    // =====================================================
    // Map Toolbar Text
    //
    // Standard white is authoritative for map-control text.
    // Disabled state is communicated by the control itself,
    // not by changing the toolbar text away from white.
    // =====================================================

    ctrDashboardTenMapToolbar.style.color =
        "#ffffff";


    // =====================================================
    // 2 - Build Plot Control
    // =====================================================

    const lblPlot =
        document.createElement(
            "div"
        );

    lblPlot.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblPlot.style.display =
        "flex";

    lblPlot.style.alignItems =
        "center";

    lblPlot.style.gap =
        "5px";

    chkDashboardTenPlot =
        document.createElement(
            "input"
        );

    chkDashboardTenPlot.type =
        "checkbox";

    chkDashboardTenPlot.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenPlot.checked =
        true;

    chkDashboardTenPlot.disabled =
        true;

    const spnPlot =
        document.createElement(
            "span"
        );

    spnPlot.textContent =
        "Plot";

    lblPlot.append(
        chkDashboardTenPlot,
        spnPlot
    );


    // =====================================================
    // 3 - Build Satellite Control
    // =====================================================

    const lblSatellite =
        document.createElement(
            "div"
        );

    lblSatellite.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblSatellite.style.display =
        "flex";

    lblSatellite.style.alignItems =
        "center";

    lblSatellite.style.gap =
        "5px";

    chkDashboardTenSatellite =
        document.createElement(
            "input"
        );

    chkDashboardTenSatellite.type =
        "checkbox";

    chkDashboardTenSatellite.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenSatellite.checked =
        false;

    chkDashboardTenSatellite.disabled =
        true;

    const spnSatellite =
        document.createElement(
            "span"
        );

    spnSatellite.textContent =
        "Satellite";

    lblSatellite.append(
        chkDashboardTenSatellite,
        spnSatellite
    );


    // =====================================================
    // 4 - Build Section One Separator
    // =====================================================

    spnDashboardTenMapToolbarSeparatorOne =
        document.createElement(
            "span"
        );

    spnDashboardTenMapToolbarSeparatorOne.className =
        "project-dashboard-ten-map-toolbar-separator";

    spnDashboardTenMapToolbarSeparatorOne.textContent =
        "|";


    // =====================================================
    // 5 - Build Places Control
    // =====================================================

    const lblPlaces =
        document.createElement(
            "div"
        );

    lblPlaces.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblPlaces.style.display =
        "flex";

    lblPlaces.style.alignItems =
        "center";

    lblPlaces.style.gap =
        "5px";

    chkDashboardTenChkPlaces =
        document.createElement(
            "input"
        );

    chkDashboardTenChkPlaces.type =
        "checkbox";

    chkDashboardTenChkPlaces.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenChkPlaces.checked =
        dashboardTenRuntimeState.showPlacesFilter;

    chkDashboardTenChkPlaces.disabled =
        false;

    chkDashboardTenChkPlaces.addEventListener(
        "change",
        () => {

            if (!chkDashboardTenChkPlaces) {
                return;
            }

            // =================================================
            // Hide / Kill Previous
            // =================================================
            //
            // Places owns only the left-panel presentation.
            // Edit remains responsible for disabling toolbar
            // controls while registration geometry is active.
            // =================================================

            dashboardTenRuntimeState.showPlacesFilter =
                chkDashboardTenChkPlaces.checked;

            if (
                !dashboardTenRuntimeState.showPlacesFilter
            ) {

                processClearDashboardTenPlaces();

            }

            processBuildDashboardTenLeftPanel();

        }
    );

    const spnPlaces =
        document.createElement(
            "span"
        );

    spnPlaces.textContent =
        "Places";

    lblPlaces.append(
        chkDashboardTenChkPlaces,
        spnPlaces
    );


    // =====================================================
    // 6 - Build Jobs Control
    // =====================================================

    const lblJobs =
        document.createElement(
            "div"
        );

    lblJobs.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblJobs.style.display =
        "flex";

    lblJobs.style.alignItems =
        "center";

    lblJobs.style.gap =
        "5px";

    chkDashboardTenJobs =
        document.createElement(
            "input"
        );

    chkDashboardTenJobs.type =
        "checkbox";

    chkDashboardTenJobs.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenJobs.checked =
        false;

    chkDashboardTenJobs.disabled =
        true;

    const spnJobs =
        document.createElement(
            "span"
        );

    spnJobs.textContent =
        "Jobs";

    lblJobs.append(
        chkDashboardTenJobs,
        spnJobs
    );


    // =====================================================
    // 7 - Build Safety Control
    // =====================================================

    const lblSafety =
        document.createElement(
            "div"
        );

    lblSafety.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblSafety.style.display =
        "flex";

    lblSafety.style.alignItems =
        "center";

    lblSafety.style.gap =
        "5px";

    chkDashboardTenSafety =
        document.createElement(
            "input"
        );

    chkDashboardTenSafety.type =
        "checkbox";

    chkDashboardTenSafety.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenSafety.checked =
        false;

    chkDashboardTenSafety.disabled =
        true;

    const spnSafety =
        document.createElement(
            "span"
        );

    spnSafety.textContent =
        "Safety";

    lblSafety.append(
        chkDashboardTenSafety,
        spnSafety
    );


    // =====================================================
    // 8 - Build Section Two Separator
    // =====================================================

    spnDashboardTenMapToolbarSeparatorTwo =
        document.createElement(
            "span"
        );

    spnDashboardTenMapToolbarSeparatorTwo.className =
        "project-dashboard-ten-map-toolbar-separator";

    spnDashboardTenMapToolbarSeparatorTwo.textContent =
        "|";


    // =====================================================
    // 9 - Build Primary Grid Control
    // =====================================================

    const lblPrimaryGrid =
        document.createElement(
            "div"
        );

    lblPrimaryGrid.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblPrimaryGrid.style.display =
        "flex";

    lblPrimaryGrid.style.alignItems =
        "center";

    lblPrimaryGrid.style.gap =
        "5px";

    chkDashboardTenChkPrimaryGrid =
        document.createElement(
            "input"
        );

    chkDashboardTenChkPrimaryGrid.type =
        "checkbox";

    chkDashboardTenChkPrimaryGrid.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenChkPrimaryGrid.checked =
        dashboardTenRuntimeState.showPrimaryGrid;

    chkDashboardTenChkPrimaryGrid.addEventListener(
        "change",
        () => {

            if (
                !chkDashboardTenChkPrimaryGrid
            ) {

                return;

            }

            dashboardTenRuntimeState.showPrimaryGrid =
                chkDashboardTenChkPrimaryGrid.checked;

            processApplyMapGridVisibility();

        }
    );

    const spnPrimaryGrid =
        document.createElement(
            "span"
        );

    spnPrimaryGrid.textContent =
        "Grid";

    lblPrimaryGrid.append(
        chkDashboardTenChkPrimaryGrid,
        spnPrimaryGrid
    );


    // =====================================================
    // 10 - Build Sub Grid Control
    // =====================================================

    const lblSubGrid =
        document.createElement(
            "div"
        );

    lblSubGrid.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblSubGrid.style.display =
        "flex";

    lblSubGrid.style.alignItems =
        "center";

    lblSubGrid.style.gap =
        "5px";

    chkDashboardTenChkSubGrid =
        document.createElement(
            "input"
        );

    chkDashboardTenChkSubGrid.type =
        "checkbox";

    chkDashboardTenChkSubGrid.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenChkSubGrid.checked =
        dashboardTenRuntimeState.showSubGrid;

    chkDashboardTenChkSubGrid.addEventListener(
        "change",
        () => {

            if (
                !chkDashboardTenChkSubGrid
            ) {

                return;

            }

            dashboardTenRuntimeState.showSubGrid =
                chkDashboardTenChkSubGrid.checked;

            processApplyMapGridVisibility();

            if (
                dashboardTenRuntimeState.showSubGrid &&
                dashboardTenRuntimeState.zoomLevel ===
                    9
            ) {

                const selectedMap =
                    dashboardTenDataStoreOne.get(
                        dashboardTenRuntimeState.selectedMapIndex
                    );

                if (
                    selectedMap &&
                    dashboardTenMapZoomInButton &&
                    dashboardTenMapZoomOutButton
                ) {

                    processBuildMapSubGrid(
                        selectedMap.mapGrid.primary,
                        dashboardTenMapZoomInButton,
                        dashboardTenMapZoomOutButton,
                        true
                    );

                }

            }
            else {

                ctrDashboardTenMapLayerSubGrid
                    ?.replaceChildren();

                dashboardTenMapHoveredPrimaryAddress =
                    null;

            }

        }
    );

    const spnSubGrid =
        document.createElement(
            "span"
        );

    spnSubGrid.textContent =
        "Sub Grid";

    lblSubGrid.append(
        chkDashboardTenChkSubGrid,
        spnSubGrid
    );


    // =====================================================
    // 11 - Build Heat Control
    // =====================================================

    const lblHeat =
        document.createElement(
            "div"
        );

    lblHeat.className =
        "project-dashboard-ten-layer-checkbox-label";

    lblHeat.style.display =
        "flex";

    lblHeat.style.alignItems =
        "center";

    lblHeat.style.gap =
        "5px";

    chkDashboardTenHeat =
        document.createElement(
            "input"
        );

    chkDashboardTenHeat.type =
        "checkbox";

    chkDashboardTenHeat.className =
        "project-dashboard-ten-layer-checkbox";

    chkDashboardTenHeat.checked =
        false;

    chkDashboardTenHeat.disabled =
        true;

    const spnHeat =
        document.createElement(
            "span"
        );

    spnHeat.textContent =
        "Heat";

    lblHeat.append(
        chkDashboardTenHeat,
        spnHeat
    );


    // =====================================================
    // 12 - Build Section Three Separator
    // =====================================================

    spnDashboardTenMapToolbarSeparatorThree =
        document.createElement(
            "span"
        );

    spnDashboardTenMapToolbarSeparatorThree.className =
        "project-dashboard-ten-map-toolbar-separator";

    spnDashboardTenMapToolbarSeparatorThree.textContent =
        "|";


    // =====================================================
    // 13 - Build Dashboard Expand Control
    // =====================================================

    btnDashboardTenExpand =
        document.createElement(
            "button"
        );

    btnDashboardTenExpand.type =
        "button";

    btnDashboardTenExpand.className =
        "project-dashboard-ten-map-layer-expand-button";

    btnDashboardTenExpand.title =
        "Expand Dashboard";

    btnDashboardTenExpand.innerHTML =
        `
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
        >
            <path
                d="
                    M8 3H3v5
                    M16 3h5v5
                    M21 16v5h-5
                    M8 21H3v-5
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
        `;


    // =====================================================
    // 14 - Dashboard Expand / Restore
    // =====================================================

    btnDashboardTenExpand.addEventListener(
        "click",
        () => {

            if (
                !dashboardTenProcessDashboardSpecialMode
            ) {

                return;

            }

            const subMode:
                "Enter" |
                "Leave" =
                    btnDashboardTenExpand.title ===
                        "Expand Dashboard"
                            ? "Enter"
                            : "Leave";

            dashboardTenProcessDashboardSpecialMode(
                "Max",
                subMode,
                [btnDashboardTenExpand],
                []
            );

            if (
                subMode ===
                    "Leave"
            ) {

                btnDashboardTenSuperMaxBack.classList.add(
                    "application-hidden"
                );

            }

        }
    );


    // =====================================================
    // 15 - Build Map Toolbar Groups
    //
    // Group One:
    // - Plot
    // - Satellite
    //
    // Group Two:
    // - Places
    // - Jobs
    // - Safety
    //
    // Group Three:
    // - Grid
    // - Sub Grid
    // - Heat
    //
    // Navigation is mounted as Group Four by the map
    // builder after its controls have been created.
    // =====================================================


    // =====================================================
    // Build Base Layer Group
    // =====================================================

    ctrDashboardTenMapToolbarGroupBase =
        document.createElement(
            "div"
        );

    ctrDashboardTenMapToolbarGroupBase.className =
        "project-dashboard-ten-map-layer-checkbox-group";

    ctrDashboardTenMapToolbarGroupBase.append(
        lblPlot,
        lblSatellite
    );


    // =====================================================
    // Build Operational Layer Group
    // =====================================================

    ctrDashboardTenMapToolbarGroupLayers =
        document.createElement(
            "div"
        );

    ctrDashboardTenMapToolbarGroupLayers.className =
        "project-dashboard-ten-map-layer-checkbox-group";

    ctrDashboardTenMapToolbarGroupLayers.append(
        lblPlaces,
        lblJobs,
        lblSafety
    );


    // =====================================================
    // Build Grid Layer Group
    // =====================================================

    ctrDashboardTenMapToolbarGroupGrid =
        document.createElement(
            "div"
        );

    ctrDashboardTenMapToolbarGroupGrid.className =
        "project-dashboard-ten-map-layer-checkbox-group";

    ctrDashboardTenMapToolbarGroupGrid.append(
        lblPrimaryGrid,
        lblSubGrid,
        lblHeat
    );


    // =====================================================
    // Assemble Initial Map Toolbar
    // =====================================================

    ctrDashboardTenMapToolbar.append(
        ctrDashboardTenMapToolbarGroupBase,
        spnDashboardTenMapToolbarSeparatorOne,
        ctrDashboardTenMapToolbarGroupLayers,
        spnDashboardTenMapToolbarSeparatorTwo,
        ctrDashboardTenMapToolbarGroupGrid,
        spnDashboardTenMapToolbarSeparatorThree,
        btnDashboardTenExpand
    );


    // =====================================================
    // 16 - Return Map Layer Controls
    // =====================================================

    return ctrDashboardTenMapToolbar;

}

// =====================================================
// Build Map Layer Checkbox
// =====================================================

function processBuildMapLayerCheckbox(
    label:
        string,

    checked:
        boolean,

    onChange:
        (
            checked:
                boolean
        ) => void
):
HTMLLabelElement {

    const ctrLabel =
        document.createElement(
            "label"
        );

    ctrLabel.className =
        "project-dashboard-ten-layer-checkbox-label";

    ctrLabel.style.marginRight =
        "10px";


    const chkLayer =
        document.createElement(
            "input"
        );

    chkLayer.type =
        "checkbox";

    chkLayer.className =
        "project-dashboard-ten-layer-checkbox";

    chkLayer.checked =
        checked;


    const ctrText =
        document.createElement(
            "span"
        );

    ctrText.textContent =
        label;


    chkLayer.addEventListener(
        "change",
        () => {

            onChange(
                chkLayer.checked
            );

        }
    );


    ctrLabel.append(
        chkLayer,
        ctrText
    );

    return ctrLabel;

}


// =====================================================
// Apply Map Layer Visibility
//
// IMPORTANT:
// This helper only changes visibility.
// It does NOT rebuild the map, refetch artifacts, rerender the
// PDF, or disturb stage geometry.
// =====================================================

function processApplyMapLayerVisibility():
void {

    if (
        ctrDashboardTenMapLayerSatellite
    ) {

        ctrDashboardTenMapLayerSatellite.style.display =
            dashboardTenRuntimeState.showSatellite ?
                "block" :
                "none";

    }


    if (
        ctrDashboardTenMapLayerPlot
    ) {

        ctrDashboardTenMapLayerPlot.style.display =
            dashboardTenRuntimeState.showPlot ?
                "block" :
                "none";

    }


    if (
        ctrDashboardTenMapLayerJobs
    ) {

        ctrDashboardTenMapLayerJobs.style.display =
            dashboardTenRuntimeState.showJobs ?
                "block" :
                "none";

    }


    if (
        ctrDashboardTenMapLayerHeat
    ) {

        ctrDashboardTenMapLayerHeat.style.display =
            dashboardTenRuntimeState.showHeat ?
                "block" :
                "none";

    }

}


// =====================================================
// Fit Map Stage To Viewport
//
// Keeps native map geometry unchanged.
// Applies only a display transform to the map stage.
//
// Default:
// - Fits / zooms the map using the existing stage model.
//
// Navigation:
// - Accepts an optional native stage-space target.
// - Attempts to position that target at viewport center.
// - Logs stage / viewport geometry for calibration.
// =====================================================

function processFitMapStageToViewport():
void {

    if (
        !dashboardTenMapViewer?.viewport
    ) {

        return;

    }

    dashboardTenMapViewer.viewport.applyConstraints(
        true
    );

}

// =====================================================
// Resolve Map Primary Grid Geometry
// =====================================================

function processResolveMapPrimaryGridGeometry(
    primaryGrid:
        CustomerMasterMapGridDefinition
):
DashboardTenPrimaryGridGeometry | null {

    // =====================================================
    // Validate Shared Map Stage
    // =====================================================

    if (
        !ctrDashboardTenBodyRightBodyMapStage
    ) {

        return null;

    }


    // =====================================================
    // Validate Primary Grid Definition
    // =====================================================

    if (
        primaryGrid.columns <=
            0 ||
        primaryGrid.rows <=
            0
    ) {

        return null;

    }


    // =====================================================
    // Resolve Native Stage Geometry
    // =====================================================

    const stageWidth =
        ctrDashboardTenBodyRightBodyMapStage.offsetWidth;

    const stageHeight =
        ctrDashboardTenBodyRightBodyMapStage.offsetHeight;


    if (
        stageWidth <=
            0 ||
        stageHeight <=
            0
    ) {

        return null;

    }


    // =====================================================
    // Resolve Square Cell Size
    // =====================================================

    const cellSize =
        primaryGrid.fitAxis ===
            "X"
            ?
            stageWidth /
                primaryGrid.columns
            :
            stageHeight /
                primaryGrid.rows;


    // =====================================================
    // Resolve Grid Dimensions
    // =====================================================

    const gridWidth =
        cellSize *
        primaryGrid.columns;

    const gridHeight =
        cellSize *
        primaryGrid.rows;


    // =====================================================
    // Resolve Horizontal Alignment
    // =====================================================

    let offsetX =
        0;

    if (
        primaryGrid.alignX ===
            "CENTER"
    ) {

        offsetX =
            (
                stageWidth -
                gridWidth
            ) /
            2;

    }
    else if (
        primaryGrid.alignX ===
            "END"
    ) {

        offsetX =
            stageWidth -
            gridWidth;

    }


    // =====================================================
    // Resolve Vertical Alignment
    // =====================================================

    let offsetY =
        0;

    if (
        primaryGrid.alignY ===
            "CENTER"
    ) {

        offsetY =
            (
                stageHeight -
                gridHeight
            ) /
            2;

    }
    else if (
        primaryGrid.alignY ===
            "END"
    ) {

        offsetY =
            stageHeight -
            gridHeight;

    }


    // =====================================================
    // Build X Boundaries
    // =====================================================

    const gridX:
        number[] =
            [];

    for (
        let columnIndex =
            0;
        columnIndex <=
            primaryGrid.columns;
        columnIndex++
    ) {

        gridX.push(
            offsetX +
            (
                columnIndex *
                cellSize
            )
        );

    }


    // =====================================================
    // Build Y Boundaries
    // =====================================================

    const gridY:
        number[] =
            [];

    for (
        let rowIndex =
            0;
        rowIndex <=
            primaryGrid.rows;
        rowIndex++
    ) {

        gridY.push(
            offsetY +
            (
                rowIndex *
                cellSize
            )
        );

    }


    // =====================================================
    // Return Primary Grid Geometry
    // =====================================================

    return {

        cellSize,

        gridWidth,

        gridHeight,

        offsetX,

        offsetY,

        x:
            gridX,

        y:
            gridY

    };

}

// =====================================================
// Resolve Progressive Sub Grid Dimension
// =====================================================

function processResolveMapSubGridDimension(
    zoomScale:
        number
):
number | null {

    // =====================================================
    // Dashboard Ten Sub Grid Visibility
    //
    // Runtime indexes 8 / 9 resolve to semantic levels
    // 9 / 10. Both use the canonical 20 x 20 mapping grid.
    // =====================================================

    if (
        zoomScale !==
            9 &&
        zoomScale !==
            10
    ) {

        return null;

    }

    return 20;

}


// =====================================================
// Resolve Active Primary Cell Geometry
// =====================================================


// =====================================================
// Build Progressive Sub Grid
//
// Geometry / visual pass only.
//
// IMPORTANT:
// - Dashboard Ten levels 1 - 9 -> no Sub Grid.
// - Dashboard Ten level 10 -> passive Sub Grid visual.
// - Sub Grid lines are intentionally lighter.
// - Sub Grid owns pointer interaction whenever it is resident.
// =====================================================

function processBuildMapSubGrid(
    primaryGrid:
        CustomerMasterMapGridDefinition,

    _btnZoomIn:
        HTMLButtonElement,

    _btnZoomOut:
        HTMLButtonElement,

    force =
        false
):
void {

    // =====================================================
    // 1 - Validate Level 9 Viewport Mapping State
    //
    // Level 9 POC:
    // - Render only the currently viewable map area.
    // - Canonical mapping remains anchored to native plot geometry.
    // - No Sub Grid work is performed during an OSD gesture.
    // =====================================================

    const subGridLayer =
        ctrDashboardTenMapLayerSubGrid;

    const viewer =
        dashboardTenMapViewer;

    const tiledImage =
        viewer?.world.getItemAt(
            0
        );

    if (
        !subGridLayer ||
        !viewer ||
        !tiledImage ||
        !dashboardTenPlotPdfPage
    ) {

        return;

    }

    if (
        !dashboardTenRuntimeState.showSubGrid ||
        dashboardTenRuntimeState.zoomLevel !==
            9 ||
        dashboardTenMapViewerPointerIsDown ||
        dashboardTenMapViewerDragIsActive ||
        dashboardTenRuntimeState.panDragIsActive ||
        dashboardTenRuntimeState.isPanning
    ) {

        subGridLayer.replaceChildren();
        subGridLayer.dataset.visibleGridSignature =
            "";

        dashboardTenMapHoveredPrimaryAddress =
            null;

        return;

    }


    // =====================================================
    // 2 - Resolve Canonical Native Grid Geometry
    // =====================================================

    const gridGeometry =
        processResolveMapPrimaryGridGeometry(
            primaryGrid
        );

    if (
        !gridGeometry
    ) {

        return;

    }

    const nativeViewport =
        dashboardTenPlotPdfPage.getViewport(
            {
                scale:
                    1
            }
        );

    const sourceDimensions =
        tiledImage.getContentSize();

    if (
        sourceDimensions.x <=
            0 ||
        sourceDimensions.y <=
            0
    ) {

        return;

    }


    // =====================================================
    // 3 - Resolve Current Visible OSD Area In Native PDF Space
    //
    // The viewport decides WHAT is rendered.
    // Native plot geometry decides WHERE every canonical line
    // actually belongs, preserving permanent map addresses.
    // =====================================================

    const visibleViewportBounds =
        viewer.viewport.getBounds(
            true
        );

    const visibleImageBounds =
        tiledImage.viewportToImageRectangle(
            visibleViewportBounds,
            true
        );

    const sourceToNativeX =
        nativeViewport.width /
        sourceDimensions.x;

    const sourceToNativeY =
        nativeViewport.height /
        sourceDimensions.y;

    const visibleNativeLeft =
        visibleImageBounds.x *
        sourceToNativeX;

    const visibleNativeTop =
        visibleImageBounds.y *
        sourceToNativeY;

    const visibleNativeRight =
        (
            visibleImageBounds.x +
            visibleImageBounds.width
        ) *
        sourceToNativeX;

    const visibleNativeBottom =
        (
            visibleImageBounds.y +
            visibleImageBounds.height
        ) *
        sourceToNativeY;


    // =====================================================
    // 4 - Clip Visible Area To Canonical Primary Grid Extent
    // =====================================================

    const gridLeft =
        gridGeometry.offsetX;

    const gridTop =
        gridGeometry.offsetY;

    const gridRight =
        gridLeft +
        gridGeometry.gridWidth;

    const gridBottom =
        gridTop +
        gridGeometry.gridHeight;

    const clipLeft =
        Math.max(
            visibleNativeLeft,
            gridLeft
        );

    const clipTop =
        Math.max(
            visibleNativeTop,
            gridTop
        );

    const clipRight =
        Math.min(
            visibleNativeRight,
            gridRight
        );

    const clipBottom =
        Math.min(
            visibleNativeBottom,
            gridBottom
        );

    if (
        clipRight <=
            clipLeft ||
        clipBottom <=
            clipTop
    ) {

        subGridLayer.replaceChildren();
        subGridLayer.dataset.visibleGridSignature =
            "";

        return;

    }


    // =====================================================
    // 5 - Skip Duplicate Settled Build
    //
    // Pointer movement must not rebuild a stationary viewport.
    // Pan / zoom completion uses force=true and owns the redraw.
    // =====================================================

    const visibleGridSignature =
        [
            clipLeft,
            clipTop,
            clipRight,
            clipBottom
        ]
            .map(
                value =>
                    value.toFixed(
                        3
                    )
            )
            .join(
                "|"
            );

    if (
        !force &&
        subGridLayer.dataset.visibleGridSignature ===
            visibleGridSignature
    ) {

        return;

    }

    subGridLayer.dataset.visibleGridSignature =
        visibleGridSignature;

    dashboardTenMapHoveredPrimaryAddress =
        null;

    subGridLayer.replaceChildren();


    // =====================================================
    // 5.1 - Build Level 9 Canonical Address Label Canvas
    //
    // One canvas owns every visible diagnostic address.
    // No per-cell label DOM is created.
    //
    // The canvas uses the same viewer-pixel coordinate space
    // as the visible Sub Grid linework. Canonical identity
    // remains owned by native map geometry.
    // =====================================================

    const labelCanvas =
        document.createElement(
            "canvas"
        );

    labelCanvas.className =
        "project-dashboard-ten-map-sub-grid-label-canvas";

    const labelCanvasWidth =
        Math.max(
            1,
            Math.ceil(
                subGridLayer.clientWidth
            )
        );

    const labelCanvasHeight =
        Math.max(
            1,
            Math.ceil(
                subGridLayer.clientHeight
            )
        );

    const labelCanvasPixelRatio =
        Math.max(
            1,
            window.devicePixelRatio ||
                1
        );

    labelCanvas.width =
        Math.ceil(
            labelCanvasWidth *
            labelCanvasPixelRatio
        );

    labelCanvas.height =
        Math.ceil(
            labelCanvasHeight *
            labelCanvasPixelRatio
        );

    labelCanvas.style.width =
        `${labelCanvasWidth}px`;

    labelCanvas.style.height =
        `${labelCanvasHeight}px`;

    subGridLayer.appendChild(
        labelCanvas
    );

    const labelContext =
        labelCanvas.getContext(
            "2d"
        );

    if (
        labelContext
    ) {

        labelContext.setTransform(
            labelCanvasPixelRatio,
            0,
            0,
            labelCanvasPixelRatio,
            0,
            0
        );

        labelContext.textAlign =
            "center";

        labelContext.textBaseline =
            "middle";

        labelContext.font =
            "600 10px Arial, sans-serif";

        labelContext.fillStyle =
            "#ff0000";

    }


    // =====================================================
    // 6 - Native PDF Point -> Viewer Pixel
    // =====================================================

    const nativeToSourceX =
        sourceDimensions.x /
        nativeViewport.width;

    const nativeToSourceY =
        sourceDimensions.y /
        nativeViewport.height;

    const projectNativePoint =
        (
            x:
                number,

            y:
                number
        ):
        OpenSeadragon.Point => {

            const sourcePoint =
                new OpenSeadragon.Point(
                    x *
                        nativeToSourceX,

                    y *
                        nativeToSourceY
                );

            const projectedViewportPoint =
                tiledImage.imageToViewportCoordinates(
                    sourcePoint
                );

            return viewer.viewport.pixelFromPoint(
                projectedViewportPoint,
                true
            );

        };


    // =====================================================
    // 7 - Build Visible Portion Of Canonical 20 x 20 Sub Grid
    //
    // Each Primary cell always owns the same 20 x 20 address
    // space. We draw every canonical boundary intersecting the
    // current viewport. Sub Grid owns its complete linework
    // independently of Primary Grid visibility.
    // =====================================================

    const dimension =
        20;

    const subCellNativeSize =
        gridGeometry.cellSize /
        dimension;

    const verticalStart =
        projectNativePoint(
            0,
            clipTop
        );

    const verticalEnd =
        projectNativePoint(
            0,
            clipBottom
        );

    const horizontalStart =
        projectNativePoint(
            clipLeft,
            0
        );

    const horizontalEnd =
        projectNativePoint(
            clipRight,
            0
        );


    // =====================================================
    // 7.1 - Visible Canonical Vertical Lines
    // =====================================================

    for (
        let primaryColumn =
            0;
        primaryColumn <
            primaryGrid.columns;
        primaryColumn++
    ) {

        const primaryLeft =
            gridGeometry.x[
                primaryColumn
            ];

        const primaryRight =
            primaryLeft +
            gridGeometry.cellSize;

        if (
            primaryRight <
                clipLeft ||
            primaryLeft >
                clipRight
        ) {

            continue;

        }

        // =================================================
        // Draw Left Boundary + Interior Lines
        //
        // The next Primary column owns the shared boundary as
        // its left edge. Only the final Primary column also
        // draws its right outer boundary. This keeps Sub Grid
        // complete without double-drawing shared boundaries.
        // =================================================

        const verticalLineEndIndex =
            primaryColumn ===
                primaryGrid.columns - 1
                ? dimension
                : dimension - 1;

        for (
            let index =
                0;
            index <=
                verticalLineEndIndex;
            index++
        ) {

            const nativeLineX =
                primaryLeft +
                (
                    index *
                    subCellNativeSize
                );

            if (
                nativeLineX <
                    clipLeft ||
                nativeLineX >
                    clipRight
            ) {

                continue;

            }

            const projectedX =
                projectNativePoint(
                    nativeLineX,
                    clipTop
                );

            const verticalLine =
                document.createElement(
                    "div"
                );

            verticalLine.className =
                "project-dashboard-ten-map-sub-grid-screen-line";

            verticalLine.style.position =
                "absolute";

            verticalLine.style.left =
                `${projectedX.x}px`;

            verticalLine.style.top =
                `${Math.min(
                    verticalStart.y,
                    verticalEnd.y
                )}px`;

            verticalLine.style.width =
                "1.75px";

            verticalLine.style.height =
                `${Math.abs(
                    verticalEnd.y -
                    verticalStart.y
                )}px`;

            verticalLine.style.background =
                "rgba(128, 128, 128, 0.35)";

            verticalLine.style.pointerEvents =
                "none";

            subGridLayer.appendChild(
                verticalLine
            );

        }

    }


    // =====================================================
    // 7.2 - Visible Canonical Horizontal Lines
    // =====================================================

    for (
        let primaryRow =
            0;
        primaryRow <
            primaryGrid.rows;
        primaryRow++
    ) {

        const primaryTop =
            gridGeometry.y[
                primaryRow
            ];

        const primaryBottom =
            primaryTop +
            gridGeometry.cellSize;

        if (
            primaryBottom <
                clipTop ||
            primaryTop >
                clipBottom
        ) {

            continue;

        }

        // =================================================
        // Draw Top Boundary + Interior Lines
        //
        // The next Primary row owns the shared boundary as its
        // top edge. Only the final Primary row also draws its
        // bottom outer boundary. This keeps Sub Grid complete
        // without double-drawing shared boundaries.
        // =================================================

        const horizontalLineEndIndex =
            primaryRow ===
                primaryGrid.rows - 1
                ? dimension
                : dimension - 1;

        for (
            let index =
                0;
            index <=
                horizontalLineEndIndex;
            index++
        ) {

            const nativeLineY =
                primaryTop +
                (
                    index *
                    subCellNativeSize
                );

            if (
                nativeLineY <
                    clipTop ||
                nativeLineY >
                    clipBottom
            ) {

                continue;

            }

            const projectedY =
                projectNativePoint(
                    clipLeft,
                    nativeLineY
                );

            const horizontalLine =
                document.createElement(
                    "div"
                );

            horizontalLine.className =
                "project-dashboard-ten-map-sub-grid-screen-line";

            horizontalLine.style.position =
                "absolute";

            horizontalLine.style.left =
                `${Math.min(
                    horizontalStart.x,
                    horizontalEnd.x
                )}px`;

            horizontalLine.style.top =
                `${projectedY.y}px`;

            horizontalLine.style.width =
                `${Math.abs(
                    horizontalEnd.x -
                    horizontalStart.x
                )}px`;

            horizontalLine.style.height =
                "1.75px";

            horizontalLine.style.background =
                "rgba(128, 128, 128, 0.35)";

            horizontalLine.style.pointerEvents =
                "none";

            subGridLayer.appendChild(
                horizontalLine
            );

        }

    }


    // =====================================================
    // 8 - Inspect Level 9 Viewport Build
    // =====================================================

    console.log(
        "[DashboardTen] OSD Visible Sub Grid:",
        {
            zoomLevel:
                dashboardTenRuntimeState.zoomLevel,

            visibleNativeBounds:
                {
                    left:
                        clipLeft,

                    top:
                        clipTop,

                    right:
                        clipRight,

                    bottom:
                        clipBottom
                },

            renderedLines:
                subGridLayer.childElementCount
        }
    );


    // =====================================================
    // 8 - Draw Visible Canonical Cell Addresses
    //
    // Diagnostic mapping proof:
    // - Draw only cells intersecting the settled visible area.
    // - Resolve identity from each native canonical cell center.
    // - Viewport position never participates in address creation.
    // =====================================================

    if (
        labelContext
    ) {

        for (
            let primaryRow =
                0;
            primaryRow <
                primaryGrid.rows;
            primaryRow++
        ) {

            const primaryTop =
                gridGeometry.y[
                    primaryRow
                ];

            const primaryBottom =
                primaryTop +
                gridGeometry.cellSize;

            if (
                primaryBottom <
                    clipTop ||
                primaryTop >
                    clipBottom
            ) {

                continue;

            }

            for (
                let primaryColumn =
                    0;
                primaryColumn <
                    primaryGrid.columns;
                primaryColumn++
            ) {

                const primaryLeft =
                    gridGeometry.x[
                        primaryColumn
                    ];

                const primaryRight =
                    primaryLeft +
                    gridGeometry.cellSize;

                if (
                    primaryRight <
                        clipLeft ||
                    primaryLeft >
                        clipRight
                ) {

                    continue;

                }

                for (
                    let canonicalRow =
                        0;
                    canonicalRow <
                        dimension;
                    canonicalRow++
                ) {

                    const cellTop =
                        primaryTop +
                        (
                            canonicalRow *
                            subCellNativeSize
                        );

                    const cellBottom =
                        cellTop +
                        subCellNativeSize;

                    if (
                        cellBottom <
                            clipTop ||
                        cellTop >
                            clipBottom
                    ) {

                        continue;

                    }

                    for (
                        let canonicalColumn =
                            0;
                        canonicalColumn <
                            dimension;
                        canonicalColumn++
                    ) {

                        const cellLeft =
                            primaryLeft +
                            (
                                canonicalColumn *
                                subCellNativeSize
                            );

                        const cellRight =
                            cellLeft +
                            subCellNativeSize;

                        if (
                            cellRight <
                                clipLeft ||
                            cellLeft >
                                clipRight
                        ) {

                            continue;

                        }

                        const nativeCenterX =
                            cellLeft +
                            (
                                subCellNativeSize /
                                2
                            );

                        const nativeCenterY =
                            cellTop +
                            (
                                subCellNativeSize /
                                2
                            );

                        const canonicalAddress =
                            processResolveMapCanonicalSpatialAddress(
                                primaryGrid,
                                nativeCenterX,
                                nativeCenterY
                            );

                        if (
                            !canonicalAddress
                        ) {

                            continue;

                        }

                        const projectedCenter =
                            projectNativePoint(
                                nativeCenterX,
                                nativeCenterY
                            );

                        if (
                            projectedCenter.x <
                                0 ||
                            projectedCenter.y <
                                0 ||
                            projectedCenter.x >
                                labelCanvasWidth ||
                            projectedCenter.y >
                                labelCanvasHeight
                        ) {

                            continue;

                        }

                        labelContext.fillText(
                            canonicalAddress.address,
                            projectedCenter.x,
                            projectedCenter.y
                        );

                    }

                }

            }

        }

    }

}

// =====================================================
// Build Progressive Sub Grid Inside Primary Cell
//
// The Primary interaction cell is the parent container.
//
// Geometry Contract:
// - Parent owns native map position and size.
// - Children own no map / viewport coordinates.
// - CSS Grid subdivides one continuous parent rectangle.
// - Zoom / navigation / pan move parent and children together.
// =====================================================

function processResolveMapPrimaryGridAddress(
    rowIndex:
        number,

    columnIndex:
        number
):
string {

    const columnName =
        String.fromCharCode(
            65 +
            columnIndex
        );

    const rowName =
        String(
            rowIndex +
            1
        );

    return `${columnName}${rowName}`;

}


// =====================================================
// Resolve Canonical Spatial Address From Stage Point
//
// Permanent address resolution is 20 x 20 inside each
// Primary Grid cell and is independent of current zoom.
// =====================================================

function processResolveMapCanonicalSpatialAddress(
    primaryGrid:
        CustomerMasterMapGridDefinition,

    stageX:
        number,

    stageY:
        number
):
DashboardTenCanonicalSpatialAddress | null {

    const canonicalDimension =
        20;

    const gridGeometry =
        processResolveMapPrimaryGridGeometry(
            primaryGrid
        );

    if (
        !gridGeometry
    ) {

        return null;

    }

    const localGridX =
        stageX -
        gridGeometry.offsetX;

    const localGridY =
        stageY -
        gridGeometry.offsetY;

    if (
        localGridX <
            0 ||
        localGridY <
            0 ||
        localGridX >
            gridGeometry.gridWidth ||
        localGridY >
            gridGeometry.gridHeight
    ) {

        return null;

    }

    const primaryColumn =
        Math.min(
            primaryGrid.columns -
                1,
            Math.max(
                0,
                Math.floor(
                    localGridX /
                    gridGeometry.cellSize
                )
            )
        );

    const primaryRow =
        Math.min(
            primaryGrid.rows -
                1,
            Math.max(
                0,
                Math.floor(
                    localGridY /
                    gridGeometry.cellSize
                )
            )
        );

    const primaryAddress =
        processResolveMapPrimaryGridAddress(
            primaryRow,
            primaryColumn
        );

    const primaryCellLeft =
        gridGeometry.x[
            primaryColumn
        ];

    const primaryCellTop =
        gridGeometry.y[
            primaryRow
        ];

    const localCellX =
        Math.min(
            gridGeometry.cellSize -
                Number.EPSILON,
            Math.max(
                0,
                stageX -
                    primaryCellLeft
            )
        );

    const localCellY =
        Math.min(
            gridGeometry.cellSize -
                Number.EPSILON,
            Math.max(
                0,
                stageY -
                    primaryCellTop
            )
        );

    const canonicalCellSize =
        gridGeometry.cellSize /
        canonicalDimension;

    const canonicalColumn =
        Math.min(
            canonicalDimension -
                1,
            Math.floor(
                localCellX /
                canonicalCellSize
            )
        );

    const canonicalRow =
        Math.min(
            canonicalDimension -
                1,
            Math.floor(
                localCellY /
                canonicalCellSize
            )
        );

    const canonicalRowNumber =
        canonicalRow +
        1;

    const canonicalColumnNumber =
        canonicalColumn +
        1;

    return {
        primaryAddress,

        primaryRow,

        primaryColumn,

        canonicalRow:
            canonicalRowNumber,

        canonicalColumn:
            canonicalColumnNumber,

        address:
            `${primaryAddress}-${canonicalRowNumber}-${canonicalColumnNumber}`
    };

}


// =====================================================
// Resolve Navigation Cell
//
// Zoom 0 - 4:
// - Primary Grid identity.
//
// Zoom 5+:
// - Canonical Sub Grid identity.
// =====================================================

function processApplyMapGridVisibility():
void {

    // =====================================================
    // Primary Grid Visuals
    //
    // Primary Grid visibility is independently owned.
    // =====================================================

    ctrDashboardTenMapLayerPrimaryGrid
        ?.querySelectorAll<HTMLElement>(
            ".project-dashboard-ten-primary-grid-line, " +
            ".project-dashboard-ten-primary-grid-label"
        )
        .forEach(
            element => {

                element.style.visibility =
                    dashboardTenRuntimeState.showPrimaryGrid
                        ? "visible"
                        : "hidden";

            }
        );


    // =====================================================
    // Sub Grid Visuals
    //
    // Sub Grid visibility is independently owned.
    // OSD gesture ownership still suppresses it while panning.
    // =====================================================

    const showSubGrid =
        dashboardTenRuntimeState.showSubGrid &&
        dashboardTenRuntimeState.zoomLevel ===
            9 &&
        !dashboardTenMapViewerPointerIsDown &&
        !dashboardTenMapViewerDragIsActive &&
        !dashboardTenRuntimeState.panDragIsActive &&
        !dashboardTenRuntimeState.isPanning;

    if (
        ctrDashboardTenMapLayerSubGrid
    ) {

        ctrDashboardTenMapLayerSubGrid.style.visibility =
            showSubGrid
                ? "visible"
                : "hidden";

    }

}


// =====================================================
// Build Primary Grid
// =====================================================

function processBuildMapPrimaryGrid(
    primaryGrid:
        CustomerMasterMapGridDefinition
):
void {

    // =====================================================
    // Validate Primary Grid Layer
    // =====================================================

    if (
        !ctrDashboardTenMapLayerPrimaryGrid
    ) {

        return;

    }


    // =====================================================
    // Clear Previous Primary Grid
    // =====================================================

    ctrDashboardTenMapLayerPrimaryGrid.replaceChildren();


    // =====================================================
    // Resolve Primary Grid Geometry
    // =====================================================

    const gridGeometry =
        processResolveMapPrimaryGridGeometry(
            primaryGrid
        );

    if (
        !gridGeometry
    ) {

        return;

    }


    // =====================================================
    // Resolve Primary Grid Line Geometry
    //
    // Grid X / Y values are mathematical boundary
    // centerlines.
    //
    // The visible 1px Primary Grid line must straddle that
    // boundary equally on both sides at native stage scale.
    //
    // IMPORTANT:
    // - Interaction cells remain boundary-to-boundary.
    // - The stage scales both together.
    // - At Zoom 5, the native .5px on each side becomes
    //   approximately 2.5 displayed pixels on each side.
    // - Outer stage lines use the same centerline contract.
    // =====================================================

    const primaryGridLineWidth =
        1;

    const primaryGridLineHalfWidth =
        primaryGridLineWidth /
        2;


    // =====================================================
    // Clip Primary Grid To Native Stage Bounds
    //
    // Outer Primary Grid boundaries are also centerlines.
    // Half of each outside line therefore falls outside the
    // stage and must be clipped.
    //
    // Result:
    // - Internal lines show full thickness.
    // - Outside borders show half thickness.
    // =====================================================

    ctrDashboardTenMapLayerPrimaryGrid.style.overflow =
        "hidden";


    // =====================================================
    // Build Vertical Grid Lines
    // =====================================================

    for (
        const x
        of gridGeometry.x
    ) {

        const ctrGridLine =
            document.createElement(
                "div"
            );

        ctrGridLine.className =
            "project-dashboard-ten-primary-grid-line " +
            "project-dashboard-ten-primary-grid-line-vertical";

        ctrGridLine.style.left =
            `${
                x -
                primaryGridLineHalfWidth
            }px`;

        ctrDashboardTenMapLayerPrimaryGrid.appendChild(
            ctrGridLine
        );

    }


    // =====================================================
    // Build Horizontal Grid Lines
    // =====================================================

    for (
        const y
        of gridGeometry.y
    ) {

        const ctrGridLine =
            document.createElement(
                "div"
            );

        ctrGridLine.className =
            "project-dashboard-ten-primary-grid-line " +
            "project-dashboard-ten-primary-grid-line-horizontal";

        ctrGridLine.style.top =
            `${
                y -
                primaryGridLineHalfWidth
            }px`;

        ctrDashboardTenMapLayerPrimaryGrid.appendChild(
            ctrGridLine
        );

    }


    // =====================================================
    // Build Primary Grid Coordinate Labels
    // =====================================================

    for (
        let rowIndex =
            0;
        rowIndex <
            primaryGrid.rows;
        rowIndex++
    ) {

        for (
            let columnIndex =
                0;
            columnIndex <
                primaryGrid.columns;
            columnIndex++
        ) {

            // =====================================================
            // Resolve Grid Section Name
            // =====================================================

            const gridSection =
                processResolveMapPrimaryGridAddress(
                    rowIndex,
                    columnIndex
                );


            // =====================================================
            // Build Grid Coordinate Label
            // =====================================================

            const ctrGridLabel =
                document.createElement(
                    "div"
                );

            ctrGridLabel.className =
                "project-dashboard-ten-primary-grid-label";

            ctrGridLabel.textContent =
                gridSection;


            // =====================================================
            // Position Grid Coordinate Label
            // =====================================================

            ctrGridLabel.style.left =
                `${
                    gridGeometry.x[
                        columnIndex
                    ] +
                    (
                        gridGeometry.cellSize /
                        2
                    )
                }px`;

            ctrGridLabel.style.top =
                `${
                    gridGeometry.y[
                        rowIndex
                    ] +
                    (
                        gridGeometry.cellSize /
                        2
                    )
                }px`;


            // =====================================================
            // Add Grid Coordinate Label
            // =====================================================

            ctrDashboardTenMapLayerPrimaryGrid.appendChild(
                ctrGridLabel
            );

        }

    }


    // =====================================================
    // Apply Current Grid Visual State
    // =====================================================

    processApplyMapGridVisibility();


    // =====================================================
    // Inspect Primary Grid Geometry
    // =====================================================

    console.log(
        "[DashboardTen] Primary Grid Built:",
        {
            columns:
                primaryGrid.columns,

            rows:
                primaryGrid.rows,

            cellSize:
                gridGeometry.cellSize,

            gridWidth:
                gridGeometry.gridWidth,

            gridHeight:
                gridGeometry.gridHeight,

            offsetX:
                gridGeometry.offsetX,

            offsetY:
                gridGeometry.offsetY
        }
    );

}

// =====================================================
// Build Map Primary Grid Interaction Cells
//
// Builds transparent clickable cells on the Sub Grid
// layer using the existing Primary Grid boundaries.
//
// Current purpose:
// - Prove spatial selection.
// - No zoom behavior yet.
// - Click only logs the selected grid section.
// =====================================================

// =====================================================
// Synchronize Dashboard Ten Grid To OpenSeadragon Plot
//
// OpenSeadragon owns the authoritative displayed plot
// geometry. Dashboard Ten owns only the native grid
// definition.
//
// The complete native Primary / Sub Grid layer is projected
// onto the CURRENT displayed bounds of the OSD plot.
//
// IMPORTANT:
// - No independent grid pan / zoom math.
// - No grid navigation behavior.
// - The grid follows the exact plot rectangle established by
//   OpenSeadragon at Home, during zoom, and during pan.
// - Native Dashboard Ten grid coordinates remain unchanged.
// =====================================================

function processSynchronizeMapGridToViewer():
void {

    if (
        !dashboardTenMapViewer?.viewport ||
        !ctrDashboardTenBodyRightBodyMapViewport ||
        !ctrDashboardTenBodyRightBodyMapStage ||
        !ctrDashboardTenMapLayerPrimaryGrid ||
        !ctrDashboardTenMapLayerSubGrid
    ) {

        return;

    }

    const tiledImage =
        dashboardTenMapViewer.world.getItemAt(
            0
        );

    if (
        !tiledImage
    ) {

        return;

    }

    // =====================================================
    // Resolve Native Dashboard Ten Plot Geometry
    // =====================================================

    const nativeWidth =
        ctrDashboardTenBodyRightBodyMapStage.offsetWidth;

    const nativeHeight =
        ctrDashboardTenBodyRightBodyMapStage.offsetHeight;

    if (
        nativeWidth <= 0 ||
        nativeHeight <= 0
    ) {

        return;

    }

    // =====================================================
    // Resolve Current OpenSeadragon Plot Bounds
    // =====================================================

    const imageBounds =
        tiledImage.getBounds(
            true
        );

    const topLeft =
        dashboardTenMapViewer.viewport.pixelFromPoint(
            imageBounds.getTopLeft(),
            true
        );

    const bottomRight =
        dashboardTenMapViewer.viewport.pixelFromPoint(
            imageBounds.getBottomRight(),
            true
        );

    const displayedWidth =
        bottomRight.x -
        topLeft.x;

    const displayedHeight =
        bottomRight.y -
        topLeft.y;


    // =====================================================
    // Move Grid Into Viewer Screen-Space Overlay Plane
    // =====================================================

    if (
        ctrDashboardTenMapLayerPrimaryGrid.parentElement !==
            ctrDashboardTenBodyRightBodyMapViewport
    ) {

        ctrDashboardTenBodyRightBodyMapViewport.appendChild(
            ctrDashboardTenMapLayerPrimaryGrid
        );

    }

    // =====================================================
    // Project Native Grid Onto Exact OSD Plot Rectangle
    // =====================================================

    ctrDashboardTenMapLayerPrimaryGrid.style.inset =
        "auto";

    ctrDashboardTenMapLayerPrimaryGrid.style.left =
        "0";

    ctrDashboardTenMapLayerPrimaryGrid.style.top =
        "0";

    ctrDashboardTenMapLayerPrimaryGrid.style.width =
        `${nativeWidth}px`;

    ctrDashboardTenMapLayerPrimaryGrid.style.height =
        `${nativeHeight}px`;

    ctrDashboardTenMapLayerPrimaryGrid.style.transformOrigin =
        "0 0";

    ctrDashboardTenMapLayerPrimaryGrid.style.transform =
        `translate(${topLeft.x}px, ${topLeft.y}px) ` +
        `scale(${displayedWidth / nativeWidth}, ${displayedHeight / nativeHeight})`;

    ctrDashboardTenMapLayerPrimaryGrid.style.zIndex =
        "20";

    ctrDashboardTenMapLayerPrimaryGrid.style.pointerEvents =
        "none";


    // =====================================================
    // Keep Dedicated Sub Grid In Viewer Screen Space
    //
    // Sub Grid coordinates are projected directly from OSD
    // into viewer pixels. It must never inherit Primary Grid
    // translate / scale.
    // =====================================================

    if (
        ctrDashboardTenMapLayerSubGrid.parentElement !==
            ctrDashboardTenBodyRightBodyMapViewport
    ) {

        ctrDashboardTenBodyRightBodyMapViewport.appendChild(
            ctrDashboardTenMapLayerSubGrid
        );

    }

    ctrDashboardTenMapLayerSubGrid.style.inset =
        "auto";

    ctrDashboardTenMapLayerSubGrid.style.left =
        "0";

    ctrDashboardTenMapLayerSubGrid.style.top =
        "0";

    ctrDashboardTenMapLayerSubGrid.style.width =
        "100%";

    ctrDashboardTenMapLayerSubGrid.style.height =
        "100%";

    ctrDashboardTenMapLayerSubGrid.style.transform =
        "none";

    ctrDashboardTenMapLayerSubGrid.style.zIndex =
        "21";

    ctrDashboardTenMapLayerSubGrid.style.pointerEvents =
        "none";

}


// =====================================================
// Developer Map Registration Tool
//
// Workflow:
// 1 - Navigate / frame with OSD.
// 2 - Edit ON freezes OSD navigation.
// 3 - Click / drag to draw a rectangular selection.
// 4 - Resize with 8 handles or drag the shape.
// 5 - Click the shape to report native coordinates.
// 6 - Edit OFF returns ownership to OSD.
// =====================================================

function processSetMapRegistrationEditMode(enabled: boolean): void {

    if (!dashboardTenMapViewer?.viewport ||
        !ctrDashboardTenBodyRightBodyMapViewport ||
        !dashboardTenPlotPdfPage) {
        return;
    }

    dashboardTenRuntimeState.registrationEditEnabled = enabled;
    dashboardTenMapViewer.setMouseNavEnabled(!enabled);

    btnDashboardTenMapRegistrationEdit?.classList.toggle(
        "application-selected",
        enabled
    );

    const toolbar = btnDashboardTenMapRegistrationEdit?.closest(
        ".project-dashboard-ten-map-toolbar"
    );

    toolbar?.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        "input, button"
    ).forEach(control => {
        if (control === btnDashboardTenMapRegistrationEdit) {
            return;
        }

        if (enabled) {
            control.dataset.registrationWasDisabled =
                control.disabled ? "true" : "false";

            control.disabled = true;
        }
        else {
            control.disabled =
                control.dataset.registrationWasDisabled === "true";

            delete control.dataset.registrationWasDisabled;
        }
    });

    if (enabled) {
        processBuildMapRegistrationOverlay();
    }
    else {
        // =====================================================
        // Clear Registration Selection
        // =====================================================
        //
        // Edit mode owns temporary registration geometry only.
        // Turning Edit OFF destroys both the visible overlay and
        // the stored anchors so the next Edit session starts clean.
        // =====================================================

        ctrDashboardTenMapRegistrationOverlay?.remove();

        ctrDashboardTenMapRegistrationOverlay =
            null;

        dashboardTenMapRegistrationAnchors =
            null;
    }

    console.log(`[DashboardTen] Map Registration Edit: ${enabled ? "ON" : "OFF"}`);
}


function processProjectMapRegistrationNativePoint(
    point: DashboardTenMapRegistrationPoint
): OpenSeadragon.Point | null {

    const viewer = dashboardTenMapViewer;
    const tiledImage = viewer?.world.getItemAt(0);

    if (!viewer?.viewport || !tiledImage || !dashboardTenPlotPdfPage) {
        return null;
    }

    const nativeViewport = dashboardTenPlotPdfPage.getViewport({ scale: 1 });
    const sourceDimensions = tiledImage.getContentSize();
    const sourcePoint = new OpenSeadragon.Point(
        point.x * (sourceDimensions.x / nativeViewport.width),
        point.y * (sourceDimensions.y / nativeViewport.height)
    );

    return viewer.viewport.pixelFromPoint(
        tiledImage.imageToViewportCoordinates(sourcePoint),
        true
    );
}


function processResolveMapRegistrationNativePoint(
    pixelX: number,
    pixelY: number
): DashboardTenMapRegistrationPoint | null {

    const viewer = dashboardTenMapViewer;
    const tiledImage = viewer?.world.getItemAt(0);

    if (!viewer?.viewport || !tiledImage || !dashboardTenPlotPdfPage) {
        return null;
    }

    const nativeViewport = dashboardTenPlotPdfPage.getViewport({ scale: 1 });
    const sourceDimensions = tiledImage.getContentSize();
    const viewportPoint = viewer.viewport.pointFromPixel(
        new OpenSeadragon.Point(pixelX, pixelY),
        true
    );
    const sourcePoint = tiledImage.viewportToImageCoordinates(viewportPoint);

    return {
        x: sourcePoint.x / (sourceDimensions.x / nativeViewport.width),
        y: sourcePoint.y / (sourceDimensions.y / nativeViewport.height)
    };
}


function processBuildMapRegistrationOverlay(): void {

    const viewport = ctrDashboardTenBodyRightBodyMapViewport;

    if (!viewport || !dashboardTenMapViewer?.viewport) return;

    ctrDashboardTenMapRegistrationOverlay?.remove();

    const ns = "http://www.w3.org/2000/svg";
    const overlay = document.createElementNS(ns, "svg");
    const selection = document.createElementNS(ns, "rect");

    overlay.classList.add("project-dashboard-ten-map-registration-overlay");
    Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        zIndex: "100",
        pointerEvents: "auto",
        cursor: "crosshair"
    });

    selection.setAttribute("fill", "rgba(255, 0, 0, 0.06)");
    selection.setAttribute("stroke", "#ff0000");
    selection.setAttribute("stroke-width", "2");
    selection.style.cursor = "move";
    overlay.appendChild(selection);

    // =====================================================
    // Build 8 Resize Handles
    // TL | TM | TR | RM | BR | BM | BL | LM
    // =====================================================

    const cursors = [
        "nwse-resize", "ns-resize", "nesw-resize", "ew-resize",
        "nwse-resize", "ns-resize", "nesw-resize", "ew-resize"
    ];

    const handles = cursors.map(cursor => {
        const handle = document.createElementNS(ns, "circle");
        handle.setAttribute("r", "6");
        handle.setAttribute("fill", "#ffffff");
        handle.setAttribute("stroke", "#ff0000");
        handle.setAttribute("stroke-width", "2");
        handle.style.cursor = cursor;
        handle.style.display = "none";
        overlay.appendChild(handle);
        return handle;
    });

    viewport.appendChild(overlay);
    ctrDashboardTenMapRegistrationOverlay = overlay;

    // =====================================================
    // Helpers
    // =====================================================

    const getPixelBounds = () => {
        if (!dashboardTenMapRegistrationAnchors) return null;

        const pixels = dashboardTenMapRegistrationAnchors.map(
            processProjectMapRegistrationNativePoint
        );

        if (pixels.some(point => point === null)) return null;

        const projected = pixels as OpenSeadragon.Point[];

        return {
            left: Math.min(...projected.map(point => point.x)),
            top: Math.min(...projected.map(point => point.y)),
            right: Math.max(...projected.map(point => point.x)),
            bottom: Math.max(...projected.map(point => point.y))
        };
    };

    const render = (): void => {
        const bounds = getPixelBounds();

        if (!bounds) {
            selection.style.display = "none";
            handles.forEach(handle => handle.style.display = "none");
            return;
        }

        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;
        const positions = [
            [bounds.left, bounds.top],
            [centerX, bounds.top],
            [bounds.right, bounds.top],
            [bounds.right, centerY],
            [bounds.right, bounds.bottom],
            [centerX, bounds.bottom],
            [bounds.left, bounds.bottom],
            [bounds.left, centerY]
        ];

        selection.style.display = "block";
        selection.setAttribute("x", bounds.left.toString());
        selection.setAttribute("y", bounds.top.toString());
        selection.setAttribute("width", (bounds.right - bounds.left).toString());
        selection.setAttribute("height", (bounds.bottom - bounds.top).toString());

        handles.forEach((handle, index) => {
            handle.style.display = "block";
            handle.setAttribute("cx", positions[index][0].toString());
            handle.setAttribute("cy", positions[index][1].toString());
        });
    };

    const setBounds = (
        left: number,
        top: number,
        right: number,
        bottom: number
    ): void => {
        const topLeft = processResolveMapRegistrationNativePoint(left, top);
        const bottomRight = processResolveMapRegistrationNativePoint(right, bottom);

        if (!topLeft || !bottomRight) return;

        dashboardTenMapRegistrationAnchors = [
            { x: topLeft.x, y: topLeft.y },
            { x: bottomRight.x, y: topLeft.y },
            { x: bottomRight.x, y: bottomRight.y },
            { x: topLeft.x, y: bottomRight.y }
        ];

        render();
    };

    render();

    // =====================================================
    // Draw New Rectangle - Snipping Tool Behavior
    // =====================================================

    overlay.addEventListener("pointerdown", event => {
        if (event.target !== overlay) return;

        event.preventDefault();
        overlay.setPointerCapture(event.pointerId);

        const overlayRect = overlay.getBoundingClientRect();
        const startX = event.clientX - overlayRect.left;
        const startY = event.clientY - overlayRect.top;

        const move = (moveEvent: PointerEvent): void => {
            const x = moveEvent.clientX - overlayRect.left;
            const y = moveEvent.clientY - overlayRect.top;

            setBounds(
                Math.min(startX, x),
                Math.min(startY, y),
                Math.max(startX, x),
                Math.max(startY, y)
            );
        };

        const up = (): void => {
            overlay.removeEventListener("pointermove", move);
            overlay.removeEventListener("pointerup", up);
            overlay.removeEventListener("pointercancel", up);
        };

        overlay.addEventListener("pointermove", move);
        overlay.addEventListener("pointerup", up);
        overlay.addEventListener("pointercancel", up);
    });

    // =====================================================
    // Move Rectangle / Click To Report
    // =====================================================

    selection.addEventListener("pointerdown", event => {
        event.preventDefault();
        event.stopPropagation();

        if (!dashboardTenMapRegistrationAnchors) return;

        selection.setPointerCapture(event.pointerId);

        const overlayRect = overlay.getBoundingClientRect();
        const startNative = processResolveMapRegistrationNativePoint(
            event.clientX - overlayRect.left,
            event.clientY - overlayRect.top
        );

        if (!startNative) return;

        const startClientX = event.clientX;
        const startClientY = event.clientY;
        const startAnchors = dashboardTenMapRegistrationAnchors.map(
            point => ({ ...point })
        );
        let dragDistance = 0;

        const move = (moveEvent: PointerEvent): void => {
            const currentNative = processResolveMapRegistrationNativePoint(
                moveEvent.clientX - overlayRect.left,
                moveEvent.clientY - overlayRect.top
            );

            if (!currentNative) return;

            dragDistance = Math.max(
                dragDistance,
                Math.hypot(
                    moveEvent.clientX - startClientX,
                    moveEvent.clientY - startClientY
                )
            );

            const dx = currentNative.x - startNative.x;
            const dy = currentNative.y - startNative.y;

            dashboardTenMapRegistrationAnchors = startAnchors.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }));

            render();
        };

        const up = (): void => {
            selection.removeEventListener("pointermove", move);
            selection.removeEventListener("pointerup", up);
            selection.removeEventListener("pointercancel", up);

            if (dragDistance < 4) {
                processReportMapRegistrationSelection();
            }
        };

        selection.addEventListener("pointermove", move);
        selection.addEventListener("pointerup", up);
        selection.addEventListener("pointercancel", up);
    });

    // =====================================================
    // Resize Rectangle - 4 Corners + 4 Side Midpoints
    // =====================================================

    handles.forEach((handle, index) => {
        handle.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();

            const startBounds = getPixelBounds();
            if (!startBounds) return;

            handle.setPointerCapture(event.pointerId);
            const overlayRect = overlay.getBoundingClientRect();

            const move = (moveEvent: PointerEvent): void => {
                const x = moveEvent.clientX - overlayRect.left;
                const y = moveEvent.clientY - overlayRect.top;

                let { left, top, right, bottom } = startBounds;

                if ([0, 6, 7].includes(index)) left = x;
                if ([2, 3, 4].includes(index)) right = x;
                if ([0, 1, 2].includes(index)) top = y;
                if ([4, 5, 6].includes(index)) bottom = y;

                setBounds(
                    Math.min(left, right),
                    Math.min(top, bottom),
                    Math.max(left, right),
                    Math.max(top, bottom)
                );
            };

            const up = (): void => {
                handle.removeEventListener("pointermove", move);
                handle.removeEventListener("pointerup", up);
                handle.removeEventListener("pointercancel", up);
            };

            handle.addEventListener("pointermove", move);
            handle.addEventListener("pointerup", up);
            handle.addEventListener("pointercancel", up);
        });
    });

}

function processReportMapRegistrationSelection(): void {

    const anchors = dashboardTenMapRegistrationAnchors;
    if (!anchors) return;

    const selectedMap = dashboardTenDataStoreOne.get(
        dashboardTenRuntimeState.selectedMapIndex
    );
    const xs = anchors.map(point => point.x);
    const ys = anchors.map(point => point.y);
    const center = {
        x: xs.reduce((total, value) => total + value, 0) / 4,
        y: ys.reduce((total, value) => total + value, 0) / 4
    };
    const address = (point: DashboardTenMapRegistrationPoint) =>
        selectedMap
            ? processResolveMapCanonicalSpatialAddress(
                selectedMap.mapGrid.primary,
                point.x,
                point.y
            )?.address ?? null
            : null;
    const reportPoint = (point: DashboardTenMapRegistrationPoint) => ({
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
        address: address(point)
    });

    const left =
        Math.min(...xs);

    const top =
        Math.min(...ys);

    const right =
        Math.max(...xs);

    const bottom =
        Math.max(...ys);

    const osdHomeZoom =
        dashboardTenMapViewer?.viewport?.getHomeZoom() ??
        null;

    const osdZoom =
        dashboardTenMapViewer?.viewport?.getZoom(
            true
        ) ??
        null;

    console.log(
        "[DashboardTen] Map Registration Selection:",
        {
            mapIndex: selectedMap?.index ?? null,
            mapName: selectedMap?.mapName ?? null,
            P1: reportPoint(anchors[0]),
            P2: reportPoint(anchors[1]),
            P3: reportPoint(anchors[2]),
            P4: reportPoint(anchors[3]),
            bounds: {
                left: Number(left.toFixed(3)),
                top: Number(top.toFixed(3)),
                right: Number(right.toFixed(3)),
                bottom: Number(bottom.toFixed(3)),
                width: Number((right - left).toFixed(3)),
                height: Number((bottom - top).toFixed(3))
            },
            center: reportPoint(center),
            view: {
                zoomLevel:
                    dashboardTenRuntimeState.zoomLevel,
                osdZoom:
                    osdZoom !== null
                        ? Number(osdZoom.toFixed(6))
                        : null,
                osdHomeZoom:
                    osdHomeZoom !== null
                        ? Number(osdHomeZoom.toFixed(6))
                        : null,
                zoomRatio:
                    osdZoom !== null &&
                    osdHomeZoom !== null &&
                    osdHomeZoom > 0
                        ? Number(
                            (
                                osdZoom /
                                osdHomeZoom
                            ).toFixed(6)
                        )
                        : null
            }
        }
    );
}


// =====================================================
// Destroy OpenSeadragon Map Viewer
// =====================================================

function processDestroyMapViewer():
void {

    processDestroyDashboardTenLocationPlaceMouseTrackers();

    if (
        dashboardTenMapViewer
    ) {

        dashboardTenMapViewer.destroy();

        dashboardTenMapViewer =
            null;

    }


    // =====================================================
    // Destroy Owned PDF Document
    //
    // Destroying the document cascades to every page it
    // produced and cancels any in-flight page render tasks.
    // =====================================================

    if (
        dashboardTenPlotPdfDocument
    ) {

        void dashboardTenPlotPdfDocument
            .destroy()
            .catch(
                error => {

                    console.error(
                        "[DashboardTen] PDF document destroy failed:",
                        error
                    );

                }
            );

        dashboardTenPlotPdfDocument =
            null;

    }

    dashboardTenMapViewerHost =
        null;

    dashboardTenMapLastPointerPixel =
        null;

    dashboardTenMapHoveredPrimaryAddress =
        null;

    dashboardTenMapViewerPointerIsDown =
        false;

    dashboardTenMapViewerDragIsActive =
        false;

    dashboardTenMapViewerGestureWasDrag =
        false;

    dashboardTenRuntimeState.registrationEditEnabled = false;
    ctrDashboardTenMapRegistrationOverlay?.remove();
    ctrDashboardTenMapRegistrationOverlay = null;
    dashboardTenMapRegistrationAnchors = null;
    btnDashboardTenMapRegistrationEdit = null;

    if (
        dashboardTenMapViewerImageUrl
    ) {

        URL.revokeObjectURL(
            dashboardTenMapViewerImageUrl
        );

        dashboardTenMapViewerImageUrl =
            null;

    }

}


// =====================================================
// Initialize OpenSeadragon From Rendered Plot
//
// First-pass viewer proof:
// - PDF.js still resolves / renders the plot artifact.
// - The rendered canvas becomes one simple-image tile source.
// - OpenSeadragon owns all pan / zoom / boundary behavior.
// - Dashboard Ten toolbar remains the command surface.
// =====================================================

interface DashboardTenPdfTileRenderTask {
    promise:
        Promise<unknown>;

    cancel:
        () => void;
}

interface DashboardTenPdfTileImageJob {
    tile?:
        {
            level:
                number;

            x:
                number;

            y:
                number;
        };

    userData:
        {
            aborted?:
                boolean;

            renderTask?:
                DashboardTenPdfTileRenderTask;
        };

    finish:
        (
            data:
                CanvasRenderingContext2D | null,

            request:
                XMLHttpRequest | null,

            dataTypeOrError:
                string
        ) => void;
}


// =====================================================
// Initialize OpenSeadragon PDF TileSource
// =====================================================

async function processInitializeMapViewerFromPlotCanvas(
    buildGeneration:
        number,

    createViewer = true,

    pdfPage:
        pdfjsLib.PDFPageProxy | null =
            null
):
Promise<void> {

    // =====================================================
    // Resolve Active PDF Page
    //
    // Use the explicitly supplied PDF page when replacing
    // the current map image. Otherwise, use the resident
    // MAIN map PDF page during normal viewer initialization.
    // =====================================================

    const activePdfPage =
        pdfPage ??
        dashboardTenPlotPdfPage;

    // =====================================================
    // 1 - Validate Viewer / PDF References
    //
    // OpenSeadragon remains the ONLY camera.
    // PDF.js is now only the tile pixel provider.
    // =====================================================

    if (
        !dashboardTenMapViewerHost ||
        !activePdfPage
    ) {

        return;

    }


    // =====================================================
    // 2 - Destroy Previous Viewer / Simple Image URL
    // =====================================================

    if (
        createViewer &&
        dashboardTenMapViewer
    ) {

        processDestroyDashboardTenLocationPlaceMouseTrackers();

        dashboardTenMapViewer.destroy();

        dashboardTenMapViewer =
            null;

    }

    if (
        createViewer &&
        dashboardTenMapViewerImageUrl
    ) {

        URL.revokeObjectURL(
            dashboardTenMapViewerImageUrl
        );

        dashboardTenMapViewerImageUrl =
            null;

    }


    // =====================================================
    // 3 - Resolve Native PDF Geometry
    //
    // Scale 1 remains Dashboard Ten's native plot space.
    // The TileSource maximum image is intentionally 10x
    // native because Dashboard Ten currently exposes 1x-10x
    // semantic zoom presets.
    // =====================================================

    const nativeViewport =
        activePdfPage.getViewport(
            {
                scale:
                    1
            }
        );

    const nativeWidth =
        nativeViewport.width;

    const nativeHeight =
        nativeViewport.height;

    const maximumRenderScale =
        dashboardTenMapZoomLevels[
            dashboardTenMapZoomLevels.length -
                1
        ];

    const sourceWidth =
        Math.ceil(
            nativeWidth *
            maximumRenderScale
        );

    const sourceHeight =
        Math.ceil(
            nativeHeight *
            maximumRenderScale
        );

    const tileSize =
        512;


    // =====================================================
    // 4 - Build PDF.js Backed OpenSeadragon TileSource
    //
    // OSD chooses:
    // - pyramid level
    // - tile X
    // - tile Y
    //
    // PDF.js renders that tile directly from the original PDF.
    //
    // IMPORTANT:
    // - No full-page PNG.
    // - No Blob / Object URL.
    // - No second visible PDF canvas.
    // - OSD tile cache owns completed tile pixels.
    // =====================================================

    const tilePdfPage =
        activePdfPage;

    const tileSource =
        new OpenSeadragon.TileSource(
            {
                width:
                    sourceWidth,

                height:
                    sourceHeight,

                tileSize,

                tileOverlap:
                    0,

                minLevel:
                    0
            }
        );

    tileSource.getTileUrl =
        (
            level:
                number,

            x:
                number,

            y:
                number
        ) =>
            `dashboard-ten-pdf://${level}/${x}/${y}`;

    tileSource.downloadTileStart =
        (
            imageJob:
                DashboardTenPdfTileImageJob
        ) => {

            const tile =
                imageJob.tile;

            if (
                !tile
            ) {

                imageJob.finish(
                    null,
                    null,
                    "Dashboard Ten PDF tile metadata is unavailable"
                );

                return;

            }

            const level =
                tile.level;

            const tileX =
                tile.x;

            const tileY =
                tile.y;


            // =================================================
            // 4.1 - Resolve This Pyramid Level
            //
            // getLevelScale() returns the ratio between this
            // OSD pyramid level and the maximum source image.
            // Convert that directly into a PDF.js render scale.
            // =================================================

            const levelScale =
                tileSource.getLevelScale(
                    level
                );

            const pdfRenderScale =
                maximumRenderScale *
                levelScale;

            const levelWidth =
                Math.ceil(
                    sourceWidth *
                    levelScale
                );

            const levelHeight =
                Math.ceil(
                    sourceHeight *
                    levelScale
                );


            // =================================================
            // 4.2 - Resolve Tile Pixel Bounds At This Level
            // =================================================

            const tileLeft =
                tileX *
                tileSize;

            const tileTop =
                tileY *
                tileSize;

            const tileWidth =
                Math.max(
                    1,
                    Math.min(
                        tileSize,
                        levelWidth -
                            tileLeft
                    )
                );

            const tileHeight =
                Math.max(
                    1,
                    Math.min(
                        tileSize,
                        levelHeight -
                            tileTop
                    )
                );


            // =================================================
            // 4.3 - Build Tile Canvas
            // =================================================

            const tileCanvas =
                document.createElement(
                    "canvas"
                );

            tileCanvas.width =
                tileWidth;

            tileCanvas.height =
                tileHeight;

            const tileContext =
                tileCanvas.getContext(
                    "2d"
                );

            if (
                !tileContext
            ) {

                imageJob.finish(
                    null,
                    null,
                    "Dashboard Ten PDF tile canvas context could not be created"
                );

                return;

            }


            // =================================================
            // 4.4 - Render PDF Directly Into Tile
            //
            // PDF.js receives the full page viewport for this
            // pyramid level, then the translation moves the
            // requested tile region to canvas origin.
            // Canvas clipping naturally limits output to tile.
            // =================================================

            const renderViewport =
                tilePdfPage.getViewport(
                    {
                        scale:
                            pdfRenderScale
                    }
                );

            const renderTask =
                tilePdfPage.render(
                    {
                        canvasContext:
                            tileContext,

                        viewport:
                            renderViewport,

                        transform:
                            [
                                1,
                                0,
                                0,
                                1,
                                -tileLeft,
                                -tileTop
                            ]
                    }
                );

            imageJob.userData.renderTask =
                renderTask;

            renderTask.promise
                .then(
                    () => {

                        if (
                            imageJob.userData.aborted
                        ) {

                            return undefined;

                        }

                        imageJob.finish(
                            tileContext,
                            null,
                            "context2d"
                        );

                        return undefined;

                    }
                )
                .catch(
                    (
                        error:
                            unknown
                    ) => {

                        // =========================================
                        // OSD-Initiated Abort
                        //
                        // downloadTileAbort() already cancelled this
                        // render and OSD's own abort path already
                        // completes this job. Nothing further to do.
                        // =========================================

                        if (
                            imageJob.userData.aborted
                        ) {

                            return undefined;

                        }

                        // =========================================
                        // PDF-Document-Driven Cancellation
                        //
                        // Dashboard Ten teardown destroyed the PDF
                        // document while this tile was still
                        // rendering. OSD did not initiate this
                        // cancellation, so nothing else will
                        // complete this job. Complete it as a blank
                        // tile (the same finish() call the success
                        // path already uses) rather than through
                        // fail(), since data !== null here avoids
                        // OSD's own tile-load-failed classification
                        // entirely rather than merely relabeling it.
                        // =========================================

                        if (
                            error instanceof
                                pdfjsLib.RenderingCancelledException
                        ) {

                            imageJob.finish(
                                tileContext,
                                null,
                                "context2d"
                            );

                            return undefined;

                        }

                        imageJob.finish(
                            null,
                            null,
                            `Dashboard Ten PDF tile render failed: ${String(error)}`
                        );

                        return undefined;

                    }
                );

        };

    tileSource.downloadTileAbort =
        (
            imageJob:
                DashboardTenPdfTileImageJob
        ) => {

            imageJob.userData.aborted =
                true;

            const renderTask =
                imageJob.userData.renderTask;

            if (
                renderTask?.cancel
            ) {

                renderTask.cancel();

            }

        };

    // =====================================================
    // Replace Existing OpenSeadragon Map Image
    //
    // When the viewer already exists, replace World[0]
    // with the newly built PDF TileSource rather than
    // creating a new OpenSeadragon viewer.
    // =====================================================

    if (
        !createViewer
    ) {

        if (
            !dashboardTenMapViewer
        ) {

            throw new Error(
                "[DashboardTen] Existing OpenSeadragon viewer is unavailable for map replacement."
            );

        }


        // =====================================================
        // Hide Parent Map Overlays
        // =====================================================

        const targetOverlays =
            dashboardTenMapViewer!.element.querySelectorAll<HTMLElement>(
                `
                .project-dashboard-ten-location-place-overlay-parent-event,
                .project-dashboard-ten-location-place-overlay-parent-unit
                `
            );

        targetOverlays.forEach(
            overlay => {

                overlay.style.visibility =
                    "hidden";

            }
        );

        await new Promise<void>(
            (
                resolve,
                reject
            ) => {

                dashboardTenMapViewer!.addTiledImage(
                    {
                        tileSource:
                            tileSource,

                        index:
                            0,

                        replace:
                            true,

                        success:
                            () => {

                                resolve();

                            },

                        error:
                            event => {

                                reject(
                                    new Error(
                                        `[DashboardTen] OpenSeadragon map replacement failed: ${String(event.message)}`
                                    )
                                );

                            }
                    }
                );

            }
        );

        return;

    }


    // =====================================================
    // 5 - Initialize OpenSeadragon
    //
    // Navigation contract is unchanged.
    // =====================================================

    dashboardTenMapViewer =
        OpenSeadragon(
            {
                element:
                    dashboardTenMapViewerHost,

                tileSources:
                    tileSource as unknown as OpenSeadragon.TileSourceOptions,

                showNavigationControl:
                    false,

                showNavigator:
                    false,

                drawer:
                    "canvas",

                immediateRender:
                    true,

                minPixelRatio:
                    0.5,

                imageSmoothingEnabled:
                    true,

                panHorizontal:
                    true,

                panVertical:
                    true,

                constrainDuringPan:
                    true,

                visibilityRatio:
                    1,

                minZoomImageRatio:
                    1,

                // =================================================
                // Hard Maximum Zoom - Dashboard Ten Level 10
                //
                // OSD viewer option; applies to wheel, click,
                // gestures, and programmatic viewport constraints.
                // Dashboard Ten Home is viewport zoom 1.
                // =================================================

                maxZoomLevel:
                    10,

                maxZoomPixelRatio:
                    10,

                animationTime:
                    0.25,

                zoomPerScroll:
                    1.05
            }
        );


    // =====================================================
    // 6 - Wait For Viewer / Bind Dashboard Ten Projection
    // =====================================================

    await new Promise<void>(
        (
            resolve,
            reject
        ) => {

            dashboardTenMapViewer!.addOnceHandler(
                "open",
                () => {

                    // =====================================================
                    // Validate Map Build Generation
                    //
                    // OSD's open event is asynchronous. Abandon setup if
                    // Dashboard Ten was rebuilt or killed while the
                    // viewer was opening rather than continue mutating
                    // a superseded lifecycle.
                    // =====================================================

                    if (
                        !processIsCurrentMapBuildGeneration(
                            buildGeneration
                        )
                    ) {

                        return;

                    }

                    dashboardTenRuntimeState.zoomLevel =
                        0;

                    dashboardTenMapViewer!.viewport.goHome(
                        true
                    );

                    processSynchronizeMapGridToViewer();

                    processRenderDashboardTenLocationPlaceOverlays();

                    // =================================================
                    // Sub Grid Mapping Pointer
                    //
                    // Only rebuild when the pointer crosses into a
                    // different Primary Grid cell.
                    // =================================================

                    dashboardTenMapViewer!.addHandler(
                        "canvas-click",
                        event => {

                            if (
                                dashboardTenRuntimeState.zoomLevel ===
                                    9
                            ) {

                                event.preventDefaultAction =
                                    true;

                            }

                        }
                    );

                    // =================================================
                    // OSD Mapping Gesture Ownership
                    //
                    // OSD owns press / drag / release. The Sub Grid is
                    // passive mapping and remains absent for the entire
                    // physical drag and any resulting viewport animation.
                    // =================================================

                    dashboardTenMapViewer!.addHandler(
                        "canvas-press",
                        event => {

                            dashboardTenMapViewerPointerIsDown =
                                true;

                            dashboardTenMapViewerGestureWasDrag =
                                false;

                            dashboardTenMapLastPointerPixel =
                                event.position;

                            if (
                                dashboardTenRuntimeState.zoomLevel ===
                                    9
                            ) {

                                dashboardTenMapHoveredPrimaryAddress =
                                    null;

                                ctrDashboardTenMapLayerSubGrid
                                    ?.replaceChildren();

                            }

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "canvas-drag",
                        event => {

                            dashboardTenMapViewerDragIsActive =
                                true;

                            dashboardTenMapViewerGestureWasDrag =
                                true;

                            dashboardTenMapLastPointerPixel =
                                event.position;

                            dashboardTenMapHoveredPrimaryAddress =
                                null;

                            ctrDashboardTenMapLayerSubGrid
                                ?.replaceChildren();

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "canvas-drag-end",
                        event => {

                            dashboardTenMapViewerDragIsActive =
                                false;

                            dashboardTenMapLastPointerPixel =
                                event.position;

                            dashboardTenMapHoveredPrimaryAddress =
                                null;

                            // Do not rebuild here. OSD may still be
                            // completing pan / constraint animation.
                            // animation-finish owns the settled rebuild.

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "canvas-release",
                        event => {

                            dashboardTenMapViewerPointerIsDown =
                                false;

                            dashboardTenMapLastPointerPixel =
                                event.position;

                            dashboardTenMapHoveredPrimaryAddress =
                                null;

                            // A true drag is restored only after OSD
                            // reports animation-finish. A simple press /
                            // release can restore immediately.
                            if (
                                dashboardTenMapViewerGestureWasDrag
                            ) {

                                return;

                            }

                            const selectedMap =
                                dashboardTenDataStoreOne.get(
                                    dashboardTenRuntimeState.selectedMapIndex
                                );

                            if (
                                selectedMap &&
                                dashboardTenMapZoomInButton &&
                                dashboardTenMapZoomOutButton
                            ) {

                                processBuildMapSubGrid(
                                    selectedMap.mapGrid.primary,
                                    dashboardTenMapZoomInButton,
                                    dashboardTenMapZoomOutButton,
                                    true
                                );

                            }

                        }
                    );

                    dashboardTenMapViewer!.canvas.addEventListener(
                        "pointermove",
                        event => {

                            if (
                                dashboardTenMapViewerPointerIsDown ||
                                dashboardTenMapViewerDragIsActive ||
                                dashboardTenRuntimeState.panDragIsActive ||
                                dashboardTenRuntimeState.isPanning
                            ) {

                                return;

                            }

                            const canvasRect =
                                dashboardTenMapViewer!.canvas.getBoundingClientRect();

                            dashboardTenMapLastPointerPixel =
                                new OpenSeadragon.Point(
                                    event.clientX -
                                        canvasRect.left,

                                    event.clientY -
                                        canvasRect.top
                                );

                            const selectedMap =
                                dashboardTenDataStoreOne.get(
                                    dashboardTenRuntimeState.selectedMapIndex
                                );

                            if (
                                selectedMap &&
                                dashboardTenMapZoomInButton &&
                                dashboardTenMapZoomOutButton
                            ) {

                                processBuildMapSubGrid(
                                    selectedMap.mapGrid.primary,
                                    dashboardTenMapZoomInButton,
                                    dashboardTenMapZoomOutButton
                                );

                            }

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "canvas-exit",
                        () => {

                            dashboardTenMapLastPointerPixel =
                                null;

                            dashboardTenMapHoveredPrimaryAddress =
                                null;

                            if (
                                !dashboardTenMapViewerPointerIsDown
                            ) {

                                dashboardTenMapViewerDragIsActive =
                                    false;

                                dashboardTenMapViewerGestureWasDrag =
                                    false;

                            }

                            // =================================================
                            // Preserve Level 9 Visible-Area Sub Grid On Canvas Exit
                            //
                            // Level 9 Sub Grid is viewport-area mapping, not hover-
                            // owned mapping. Leaving the OSD canvas must therefore
                            // not clear the settled Level 9 grid.
                            // =================================================

                            if (
                                dashboardTenRuntimeState.zoomLevel !==
                                    9
                            ) {

                                ctrDashboardTenMapLayerSubGrid
                                    ?.replaceChildren();

                            }

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "animation",
                        () => {

                            processSynchronizeMapZoomLevelFromViewer();
                            processSynchronizeMapGridToViewer();

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "animation-finish",
                        () => {

                            processSynchronizeMapZoomLevelFromViewer();
                            processSynchronizeMapGridToViewer();

                            if (
                                dashboardTenMapViewerPointerIsDown ||
                                dashboardTenMapViewerDragIsActive
                            ) {

                                return;

                            }

                            const selectedMap =
                                dashboardTenDataStoreOne.get(
                                    dashboardTenRuntimeState.selectedMapIndex
                                );

                            if (
                                selectedMap &&
                                dashboardTenMapZoomInButton &&
                                dashboardTenMapZoomOutButton
                            ) {

                                processBuildMapSubGrid(
                                    selectedMap.mapGrid.primary,
                                    dashboardTenMapZoomInButton,
                                    dashboardTenMapZoomOutButton,
                                    true
                                );

                            }

                            dashboardTenMapViewerGestureWasDrag =
                                false;

                        }
                    );

                    dashboardTenMapViewer!.addHandler(
                        "zoom",
                        () => {

                            processSynchronizeMapZoomLevelFromViewer();
                            processSynchronizeMapGridToViewer();

                        }
                    );

                    console.log(
                        "[DashboardTen] PDF TileSource Viewer Ready:",
                        {
                            nativeWidth,
                            nativeHeight,
                            sourceWidth,
                            sourceHeight,
                            tileSize,
                            maximumRenderScale,
                            homeZoom:
                                dashboardTenMapViewer!.viewport.getHomeZoom()
                        }
                    );

                    resolve();

                }
            );

            dashboardTenMapViewer!.addOnceHandler(
                "open-failed",
                event => {

                    reject(
                        new Error(
                            `[DashboardTen] OpenSeadragon failed to open PDF TileSource: ${String(event.message)}`
                        )
                    );

                }
            );

        }
    );

}

// =====================================================
// Render plot
// =====================================================

async function processRenderMapPlot(
    renderScale:
        number
):
Promise<void> {

    // =====================================================
    // 1 - Validate Plot Render References
    // =====================================================

    if (
        !dashboardTenPlotPdfPage ||
        !cvsDashboardTenBodyRightBodyMapStagePlot
    ) {

        return;

    }


    // =====================================================
    // 2 - Resolve Logical Plot Viewport
    //
    // Scale 1 remains the native PDF / map geometry.
    // =====================================================

    const logicalViewport =
        dashboardTenPlotPdfPage.getViewport(
            {
                scale:
                    1
            }
        );


    // =====================================================
    // 3 - Preserve Logical Canvas Geometry
    // =====================================================

    cvsDashboardTenBodyRightBodyMapStagePlot.style.width =
        `${Math.ceil(logicalViewport.width)}px`;

    cvsDashboardTenBodyRightBodyMapStagePlot.style.height =
        `${Math.ceil(logicalViewport.height)}px`;


    // =====================================================
    // 4 - Size Canvas Backing Resolution
    //
    // Backing pixels increase without changing the
    // canvas footprint inside the shared map stage.
    // =====================================================

    cvsDashboardTenBodyRightBodyMapStagePlot.width =
        Math.ceil(
            logicalViewport.width *
            renderScale
        );

    cvsDashboardTenBodyRightBodyMapStagePlot.height =
        Math.ceil(
            logicalViewport.height *
            renderScale
        );


    // =====================================================
    // 5 - Resolve Canvas Context
    // =====================================================

    const plotContext =
        cvsDashboardTenBodyRightBodyMapStagePlot.getContext(
            "2d"
        );

    if (
        !plotContext
    ) {

        throw new Error(
            "[DashboardTen] Plot canvas context could not be created"
        );

    }


    // =====================================================
    // 6 - Resolve PDF Render Transform
    //
    // PDF.js uses this additional transform to render
    // the logical viewport into the larger backing store.
    // =====================================================

    const renderTransform:
        [number, number, number, number, number, number] | undefined =
            renderScale !==
                1 ?
                [
                    renderScale,
                    0,
                    0,
                    renderScale,
                    0,
                    0
                ] :
                undefined;


    // =====================================================
    // 7 - Render Plot
    // =====================================================

    await dashboardTenPlotPdfPage.render(
        {
            canvasContext:
                plotContext,

            viewport:
                logicalViewport,

            transform:
                renderTransform
        }
    ).promise;

    console.log(
        "[DashboardTen] Plot Render:",
        {
            renderScale,

            logicalViewport:
            {
                width:
                    logicalViewport.width,

                height:
                    logicalViewport.height
            },

            canvasBacking:
            {
                width:
                    cvsDashboardTenBodyRightBodyMapStagePlot.width,

                height:
                    cvsDashboardTenBodyRightBodyMapStagePlot.height
            },

            canvasCss:
            {
                width:
                    cvsDashboardTenBodyRightBodyMapStagePlot.style.width,

                height:
                    cvsDashboardTenBodyRightBodyMapStagePlot.style.height
            },

            canvasClient:
            {
                width:
                    cvsDashboardTenBodyRightBodyMapStagePlot.clientWidth,

                height:
                    cvsDashboardTenBodyRightBodyMapStagePlot.clientHeight
            },

            devicePixelRatio:
                window.devicePixelRatio
        }
    );

}

// =====================================================
// Resolve Map Zoom Scale
//
// Resolves the current generic zoom level into its
// corresponding map display scale.
//
// IMPORTANT:
// - Does not alter the stage.
// - Does not render the plot.
// - Does not change runtime state.
// - Owns only level -> scale resolution.
// =====================================================

function processResolveMapZoomScale():
number {

    const zoomLevel =
        dashboardTenRuntimeState.zoomLevel;

    return (
        dashboardTenMapZoomLevels[
            zoomLevel
        ] ??
        dashboardTenMapZoomLevels[0]
    );

}

// =====================================================
// Navigate Map To Stage Point
//
// Centers a native stage-space coordinate inside the
// current map viewport.
//
// Current Navigation Rule:
// - Current zoom below 5 is raised to 5.
// - Zoom 5+ preserves the selected stage-space center.
// - Sub Grid density can rebuild without changing that center.
//
// IMPORTANT:
// - Runtime zoom level is authoritative regardless of
//   how the user arrived at the current zoom level.
// - Target X / Y are native shared-stage coordinates.
// - Existing map fit helper owns stage scaling.
// - Navigation does not independently calculate fit.
// =====================================================

function processSynchronizeMapZoomLevelFromViewer():
void {

    if (
        !dashboardTenMapViewer?.viewport
    ) {

        return;

    }

    const homeZoom =
        dashboardTenMapViewer.viewport.getHomeZoom();

    const currentZoom =
        dashboardTenMapViewer.viewport.getZoom(
            true
        );

    if (
        !Number.isFinite(
            homeZoom
        ) ||
        homeZoom <=
            0 ||
        !Number.isFinite(
            currentZoom
        )
    ) {

        return;

    }

    // =====================================================
    // Resolve Continuous OSD Zoom Into Dashboard Ten Level
    //
    // Dashboard Ten presets are 1x through 10x Home zoom.
    // OSD remains continuous between those presets.
    // Crossing the midpoint to the next preset changes the
    // semantic Dashboard Ten level.
    // =====================================================

    const zoomRatio =
        currentZoom /
        homeZoom;

    let resolvedZoomLevel =
        Math.round(
            zoomRatio
        ) -
        1;

    resolvedZoomLevel =
        Math.max(
            0,
            Math.min(
                dashboardTenMapZoomLevels.length -
                    1,
                resolvedZoomLevel
            )
        );

    if (
        resolvedZoomLevel ===
            dashboardTenRuntimeState.zoomLevel
    ) {

        return;

    }

    const previousZoomLevel =
        dashboardTenRuntimeState.zoomLevel;

    dashboardTenRuntimeState.zoomLevel =
        resolvedZoomLevel;

    if (
        dashboardTenMapZoomInButton &&
        dashboardTenMapZoomOutButton
    ) {

        processUpdateMapZoomControls(
            dashboardTenMapZoomInButton,
            dashboardTenMapZoomOutButton
        );

        const selectedMap =
            dashboardTenDataStoreOne.get(
                dashboardTenRuntimeState.selectedMapIndex
            );

        if (
            selectedMap
        ) {

            processBuildMapSubGrid(
                selectedMap.mapGrid.primary,
                dashboardTenMapZoomInButton,
                dashboardTenMapZoomOutButton
            );

            processApplyMapGridVisibility();

        }

    }

    processRenderDashboardTenLocationPlaceOverlays();

    console.log(
        "[DashboardTen] OSD Zoom Level Sync:",
        {
            previousZoomLevel,
            zoomLevel:
                dashboardTenRuntimeState.zoomLevel,
            zoomRatio,
            currentZoom,
            homeZoom
        }
    );

}


// =====================================================
// Update Map Zoom Controls
// =====================================================

function processUpdateMapZoomControls(
    btnZoomIn:
        HTMLButtonElement,

    btnZoomOut:
        HTMLButtonElement
):
void {

    // =====================================================
    // 1 - Resolve Zoom Boundaries
    // =====================================================

    const minZoomLevel =
        0;

    const maxZoomLevel =
        dashboardTenMapZoomLevels.length - 1;


    // =====================================================
    // 2 - Resolve Disabled States
    // =====================================================

    const zoomInDisabled =
        dashboardTenRuntimeState.zoomLevel >=
        maxZoomLevel;

    const zoomOutDisabled =
        dashboardTenRuntimeState.zoomLevel <=
        minZoomLevel;


    // =====================================================
    // 3 - Apply Native Disabled States
    // =====================================================

    btnZoomIn.disabled =
        zoomInDisabled;

    btnZoomOut.disabled =
        zoomOutDisabled;


    // =====================================================
    // 4 - Apply Application Disabled Styling
    // =====================================================

    btnZoomIn.classList.toggle(
        "application-disabled",
        zoomInDisabled
    );

    btnZoomOut.classList.toggle(
        "application-disabled",
        zoomOutDisabled
    );


    // =====================================================
    // 5 - Apply Sub Grid Control Availability
    //
    // Level 9 exclusively owns the visible-area Sub Grid.
    // Preserve the user's checked preference while disabled.
    // =====================================================

    if (
        chkDashboardTenChkSubGrid
    ) {

        chkDashboardTenChkSubGrid.disabled =
            dashboardTenRuntimeState.zoomLevel !==
                9;

    }

}

// =====================================================
// Resolve Map Navigation Center
//
// Resolves the native stage-space point that should
// occupy the center of the viewport.
//
// Navigation Model:
// - No navigation anchor -> true map center.
// - Zoom 7+ -> preserve navigation center exactly.
// - Zoom 1-6 -> move linearly from navigation center
//   toward true map center.
// - Zoom 1 -> true map center.
//
// IMPORTANT:
// - Navigation anchor itself is never modified here.
// - X and Y interpolate independently.
// - Six equal movements occur from zoom 7 to zoom 1.
// =====================================================

async function processChangeMapZoom(
    direction:
        "In" |
        "Out",

    btnZoomIn:
        HTMLButtonElement,

    btnZoomOut:
        HTMLButtonElement
):
Promise<void> {

    if (
        mapZoomIsInProgress ||
        !dashboardTenMapViewer?.viewport
    ) {

        return;

    }

    mapZoomIsInProgress =
        true;

    try {

        const maxZoomLevel =
            dashboardTenMapZoomLevels.length -
            1;

        if (
            direction ===
                "In" &&
            dashboardTenRuntimeState.zoomLevel >=
                maxZoomLevel
        ) {

            return;

        }

        if (
            direction ===
                "Out" &&
            dashboardTenRuntimeState.zoomLevel <=
                0
        ) {

            return;

        }

        dashboardTenRuntimeState.zoomLevel +=
            direction ===
                "In" ?
                1 :
                -1;

        processUpdateMapZoomControls(
            btnZoomIn,
            btnZoomOut
        );

        const zoomScale =
            processResolveMapZoomScale();

        const homeZoom =
            dashboardTenMapViewer.viewport.getHomeZoom();

        dashboardTenMapViewer.viewport.zoomTo(
            homeZoom *
                zoomScale,
            undefined,
            false
        );

        dashboardTenMapViewer.viewport.applyConstraints(
            false
        );

        processRenderDashboardTenLocationPlaceOverlays();

        const selectedMap =
            dashboardTenDataStoreOne.get(
                dashboardTenRuntimeState.selectedMapIndex
            );

        if (
            selectedMap
        ) {

            processBuildMapSubGrid(
                selectedMap.mapGrid.primary,
                btnZoomIn,
                btnZoomOut
            );

        }

    }
    catch (
        error
    ) {

        console.error(
            "[DashboardTen] Map Zoom Failed:",
            error
        );

    }
    finally {

        mapZoomIsInProgress =
            false;

    }

}

// ========================================
// Process Dashboard Special Mode Controls
//
// Control Order:
//  0 - Plot
//  1 - Satellite
//  2 - Places
//  3 - Jobs
//  4 - Safety
//  5 - Grid
//  6 - Sub Grid
//  7 - Heat
//  8 - Zoom In
//  9 - Zoom Out
// 10 - Home
// 11 - Edit
//
// Ownership:
// - Controls own disabled state.
// - Checkbox wrappers own checkbox visibility.
// - Buttons own their own visibility.
// - Toolbar groups derive visibility from their controls.
// - Separators derive visibility from visible groups.
// - Separators are never independently configured.
// ========================================

function processDashboardSpecialModeControls(
    controlConfiguration: {
        disabled: boolean;
        visible: boolean;
    }[]
): void {

    // ========================================
    // Validate Control Configuration
    // ========================================

    if (
        controlConfiguration.length !==
            12
    ) {

        console.error(
            "[DashboardTen] Invalid Special Mode Control Configuration:",
            controlConfiguration
        );

        return;

    }


    // ========================================
    // Build Managed Control Collection
    // ========================================

    const controls:
        (HTMLElement | null)[] =
        [
            chkDashboardTenPlot,
            chkDashboardTenSatellite,
            chkDashboardTenChkPlaces,
            chkDashboardTenJobs,
            chkDashboardTenSafety,
            chkDashboardTenChkPrimaryGrid,
            chkDashboardTenChkSubGrid,
            chkDashboardTenHeat,
            btnDashboardTenMapZoomIn,
            btnDashboardTenMapZoomOut,
            btnDashboardTenMapHome,
            btnDashboardTenMapRegistrationEdit
        ];


    // ========================================
    // Apply Control Configuration
    // ========================================

    controls.forEach(
        (
            control,
            index
        ) => {

            if (
                !control
            ) {

                return;

            }


            // ========================================
            // Apply Disabled State
            // ========================================

            (
                control as
                    HTMLInputElement |
                    HTMLButtonElement
            ).disabled =
                controlConfiguration[index].disabled;


            // ========================================
            // Resolve Visibility Target
            //
            // Checkbox:
            // - Input owns disabled state.
            // - Parent label owns visibility.
            //
            // Button:
            // - Button owns both states.
            // ========================================

            const visibilityTarget =
                control instanceof
                    HTMLInputElement
                    ? control.parentElement
                    : control;

            if (
                !visibilityTarget
            ) {

                return;

            }


            // ========================================
            // Apply Visibility State
            // ========================================

            visibilityTarget.classList.toggle(
                "application-hidden",
                !controlConfiguration[index].visible
            );

        }
    );


    // ========================================
    // Resolve Group Visibility
    //
    // A group remains visible when at least one control
    // belonging to that group is configured visible.
    // ========================================

    const groupVisibility =
        [
            controlConfiguration
                .slice(
                    0,
                    2
                )
                .some(
                    configuration =>
                        configuration.visible
                ),

            controlConfiguration
                .slice(
                    2,
                    5
                )
                .some(
                    configuration =>
                        configuration.visible
                ),

            controlConfiguration
                .slice(
                    5,
                    8
                )
                .some(
                    configuration =>
                        configuration.visible
                ),

            controlConfiguration
                .slice(
                    8,
                    12
                )
                .some(
                    configuration =>
                        configuration.visible
                )
        ];


    // ========================================
    // Apply Group Visibility
    // ========================================

    const groups =
        [
            ctrDashboardTenMapToolbarGroupBase,
            ctrDashboardTenMapToolbarGroupLayers,
            ctrDashboardTenMapToolbarGroupGrid,
            ctrDashboardTenMapToolbarGroupNavigation
        ];

    groups.forEach(
        (
            group,
            index
        ) => {

            group.classList.toggle(
                "application-hidden",
                !groupVisibility[index]
            );

        }
    );


    // ========================================
    // Reset Separator Visibility
    //
    // Separator visibility is derived entirely from the
    // visible group sequence below.
    // ========================================

    const separators =
        [
            spnDashboardTenMapToolbarSeparatorOne,
            spnDashboardTenMapToolbarSeparatorTwo,
            spnDashboardTenMapToolbarSeparatorThree,
            spnDashboardTenMapToolbarSeparatorFour
        ];

    separators.forEach(
        separator => {

            separator.classList.add(
                "application-hidden"
            );

        }
    );


    // ========================================
    // Resolve Visible Groups
    // ========================================

    const visibleGroupIndexes =
        groupVisibility
            .map(
                (
                    visible,
                    index
                ) =>
                    visible
                        ? index
                        : -1
            )
            .filter(
                index =>
                    index !==
                        -1
            );


    // ========================================
    // Apply Group Separators
    //
    // Each visible group after the first visible group gets
    // exactly one separator immediately before it. Because
    // hidden groups collapse from layout, this remains valid
    // even when one or more middle groups are hidden.
    // ========================================

    for (
        let visibleIndex =
            1;
        visibleIndex <
            visibleGroupIndexes.length;
        visibleIndex++
    ) {

        const groupIndex =
            visibleGroupIndexes[
                visibleIndex
            ];

        separators[
            groupIndex -
                1
        ].classList.remove(
            "application-hidden"
        );

    }


    // ========================================
    // Apply Expand Separator
    //
    // Expand is permanent and sits outside the configurable
    // groups. Show exactly one separator between the final
    // visible group and Expand.
    // ========================================

    if (
        visibleGroupIndexes.length >
            0
    ) {

        spnDashboardTenMapToolbarSeparatorFour.classList.remove(
            "application-hidden"
        );

    }

}

// =====================================================
// Restore Dashboard Ten Super Max Parent View
// =====================================================

export async function processDashboardTenRestoreSuperMaxParentView():
Promise<void> {

    if (
        !dashboardTenSuperMaxParentView ||
        !dashboardTenPlotPdfPage
    ) {

        return;

    }


    // =====================================================
    // Capture Saved Parent View
    // =====================================================

    const parentView =
        dashboardTenSuperMaxParentView;


    // =====================================================
    // Restore Parent Map
    //
    // Keep dashboardTenSuperMaxParentView populated while
    // the parent TileSource is restored so parent overlays
    // remain gated during the replacement.
    // =====================================================

    await processInitializeMapViewerFromPlotCanvas(
        dashboardTenMapBuildGeneration,
        false,
        dashboardTenPlotPdfPage
    );


    // =====================================================
    // Restore Parent View
    // =====================================================

    dashboardTenMapViewer!.viewport.zoomTo(
        parentView.zoom,
        undefined,
        true
    );

    dashboardTenMapViewer!.viewport.panTo(
        new OpenSeadragon.Point(
            parentView.centerX,
            parentView.centerY
        ),
        true
    );

    dashboardTenMapViewer!.viewport.applyConstraints(
        true
    );


    // =====================================================
    // Release Parent Overlay Gate
    //
    // Wait for the restored parent TiledImage to be fully
    // loaded before releasing the gate, so parent overlays
    // do not appear over a still-loading parent map.
    // =====================================================

    const restoredParentTiledImage =
        dashboardTenMapViewer!.world.getItemAt(
            0
        );

    restoredParentTiledImage.whenFullyLoaded(
        () => {

            if (
                !processIsCurrentMapBuildGeneration(
                    dashboardTenMapBuildGeneration
                )
            ) {

                return;

            }

            dashboardTenSuperMaxParentView =
                null;


            // =====================================================
            // Restore Parent Map Overlays
            // =====================================================

            processRenderDashboardTenLocationPlaceOverlays();

        }
    );

}
