// =====================================================
// PCF / Generated
// =====================================================

import {
    IInputs,
    IOutputs
} from "./generated/ManifestTypes";


// =====================================================
// Core Helpers
// =====================================================

import { icons } from "./helpers/icons";

import {
    ProjectDashboardViewIndex
} from "./helpers/views";

import {
    dashboards
} from "./helpers/dashboards";


// =====================================================
// Data / Storage
// =====================================================

import {
    plannedActivityDataStores,
    currentActivityDataStores,
    plannedResourceDataStores,
    currentResourceDataStores,
    processBuildColumnDataStores
} from "./helpers/dataStores";

import {
    ProjectDashboardArtifactStore,
    ProjectDashboardArtifactStoreTerminalError
} from "./helpers/artifactStore";

import {
    decodeParquetArtifact
} from "./helpers/parquet";

import {
    FieldsRegistry
} from "./helpers/fields";

import {
    buildTabs
} from "./html/tabs";

import {
    accessActionDefinitions
} from "./helpers/access";

// =====================================================
// Azure
// =====================================================

import {
    getDataFromAzure,
    getArtifactsFromAzure,
    splitAzureArtifactPackage,
    syncCustomerRegistriesFromAzure,
    LocalRegistryState,
    getAzureArtifactLastModified,
    getArtifactEtag,
    getUserAccessFromAzure
} from "./helpers/azure";

import {
    processResolveCustomerRegistryManifest
} from "./helpers/registryManifest";

import {
    ApplicationMessageAction,
    ApplicationErrorCommunication,
    processApplicationError
} from "./helpers/errors";


// =====================================================
// Models
// =====================================================

import {
    CustomersRegistry,
    ActiveState,
    ScheduleVersionsRegistry,
    CustomerMasterRegistry,
    CustomerMasterLocation,
    CustomerMasterEvent,
    ResolvedRegistryDefinition,
    LocationEventsRegistry,
    LocationPlacesRegistry,
    CurrentUser,
    UserProfileRegistry,
    ApplicationRegistry,
    ApplicationVersionInfo,
    ApplicationVersionStatus
} from "./models/registries";


// =====================================================
// Dashboard Builders
// =====================================================

import {
    buildDashboardOne,
    processKillDashboardOne
} from "./html/dashboardOne";
import {
    buildDashboardTwo,
    processKillDashboardTwo
} from "./html/dashboardTwo";
import {
    buildDashboardThree,
    processKillDashboardThree
} from "./html/dashboardThree";
import {
    buildDashboardFour,
    processKillDashboardFour
} from "./html/dashboardFour";
import {
    buildDashboardFive,
    processKillDashboardFive
} from "./html/dashboardFive";
import {
    buildDashboardSix,
    processKillDashboardSix
} from "./html/dashboardSix";
import {
    buildDashboardTen,
    processKillDashboardTen,
    processDashboardTenRestoreSuperMaxParentView
} from "./html/dashboardTen";


// =====================================================
// Workflow Builders
// =====================================================

import {
    buildVersionUploadWizard
} from "./html/uploads";

import {
    buildSettingsOverlay,
    buildNotificationOverlay
} from "./html/overlays";


// =====================================================
// Styles
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

export class ProjectDashboard
    implements ComponentFramework.StandardControl<
        IInputs,
        IOutputs
    > {

    private context!: ComponentFramework.Context<IInputs>;

    // =====================================================
    // Application Terminal State
    //
    // Becomes true permanently at terminal destroy. Instance
    // scoped - a newly constructed ProjectDashboard receives
    // its own live state. Never reset.
    // =====================================================

    private applicationTerminated = false;

    private readonly MODE_VIEW_TYPE = "";

    private container:HTMLDivElement;
    private ctrContainer:HTMLDivElement;
    private ctrMain!: HTMLDivElement;

    private ctrApplicationHeader!: HTMLDivElement;
    private ctrApplicationHeaderLeft!: HTMLDivElement;
    private ctrApplicationHeaderRight!: HTMLDivElement;

    private ctrApplicationName!: HTMLDivElement;
    private ctrApplicationNameActive!: HTMLSpanElement;
    private ctrApplicationNameManager!: HTMLSpanElement;
    private ctrApplicationSeparator!: HTMLSpanElement;
    private ctrApplicationModule!: HTMLSpanElement;

    private ctrHeader!: HTMLDivElement;
    private ctrTabsHeader!: HTMLDivElement;
    private ctrBody!: HTMLDivElement;
    private ctrMessages!: HTMLDivElement;
    private ctrUploadVersion!: HTMLDivElement;
    private ctrSettings!: HTMLDivElement;
    private ctrDashboard!: HTMLDivElement;
    private ctrDashboardSharedHeader!: HTMLDivElement;
    private ctrDashboardSharedBody!: HTMLDivElement;
    private ctrDashboardSharedFooter!: HTMLDivElement;
    private ctrDashboardSlotZero!: HTMLDivElement;
    private ctrDashboardSlotOne!: HTMLDivElement;
    private ctrDashboardSlotTwo!: HTMLDivElement;
    private ctrDashboardSlotThree!: HTMLDivElement;
    private ctrDashboardSlotFour!: HTMLDivElement;
    private ctrDashboardSlotFive!: HTMLDivElement;
    private ctrDashboardSlotSix!: HTMLDivElement;
    private ctrDashboardSlotSeven!: HTMLDivElement;
    private ctrDashboardSlotEight!: HTMLDivElement;
    private ctrDashboardSlotNine!: HTMLDivElement;
    private ctrProcessingOverlay!:HTMLDivElement;

    private ctrApplicationRestartRequired!: HTMLDivElement;
    private btnApplicationRestartRequired!: HTMLButtonElement;

    private ctrFooter!: HTMLDivElement;

    private btnApplicationUpdateAvailable!: HTMLButtonElement;
    private btnApplicationUpload!: HTMLButtonElement;
    private btnApplicationSettings!: HTMLButtonElement;
    private btnApplicationMenu!: HTMLButtonElement;

    private message!: HTMLDivElement;
    private messageIcon!: HTMLDivElement;
    private btnMessageAction!: HTMLButtonElement;

    // =====================================================
    // Message Action Callback
    //
    // Single Application Error Handler - Pass 1.
    //
    // btnMessageAction is built once in buildUI and its click
    // listener is wired exactly once, there, to a stable wrapper
    // that always invokes whatever this field currently holds.
    // showMessage never calls addEventListener again - it only
    // reassigns this field (or sets it to null), which is what
    // guarantees the button can never accumulate listeners and
    // can never retain a stale action from a prior billboard.
    // =====================================================

    private messageActionCallback:
        (() => void | Promise<void>) | null =
            null;

    private txtTaskSearch!: HTMLInputElement;
    private btnTaskSearchClear!: HTMLButtonElement;

    private pcfModeViewType = "";
    private pcfModeViewInfoJson = "";
    private pcfModeViewIndex = 0;
    private pcfModeViewContextJson = "";
    private pcfModeViewLoadingIsComplete = true;
    private pcfModeOutgoingPayloadJson = "";
    private pcfModeIncomingPayloadJson = "";
    private pcfModeIncomingStatus = 0;

    private previousPCFModeViewType = "";
    private previousPCFModeViewInfoJson = "";
    private previousPCFModeViewIndex = 0;
    private previousPCFModeViewContextJson = "";
    private previousPCFModeIncomingPayloadJson = "";
    private previousPCFModeOutgoingPayloadJson = "";
    private previousPCFModeIncomingStatus = 0;
    //private previousBoardConfig: TaskBoardConfig | null =null;

    private tempPcfModeViewIndex = 0;
    private dashboardSlotUserConfig:
        {
            Slot: number;
            DashboardId: number | null;
            Name: string | null;
        }[] =
            [];

    private route = 0;
    private routeStatus = 0;
    private routeInProgress = false;
    private routeHasCompleted = false;
    private updateViewRenderCount = 0;

    private actionMode = "";

    private taskBoardName = "";
    private taskBoardSystemId ="";
    
    private payloadGroup = "";
    private payloadType = "";
    private payloadMode = "";
    private payloadSubMode = "";
    private payloadSubModePath = "";
    private payloadDataOne: unknown = null;
    private payloadDataTwo: unknown = null;
    private payloadDataThree: unknown = null;
    private payloadDataFour: unknown = null;
    private payloadViewIndex =  0;
    private payloadViewContext = "";
    private payloadDecodedArtifactData: unknown = null;
    private payloadUserEmail: unknown = null;

    private previousPayloadGroup = "";
    private previousPayloadType = "";
    private previousPayloadMode = "";
    private previousPayloadSubMode = "";
    private previousPayloadSubModePath = "";
    private previousPayloadDataOne: unknown = null;
    private previousPayloadDataTwo: unknown = null;
    private previousPayloadDataThree: unknown = null;
    private previousPayloadDataFour: unknown = null;
    private previousPayloadViewIndex =  0;
    private previousPayloadViewContext = "";
    private previousPayloadDecodedArtifactData: unknown = null;

    private routeEchoSource = "";
    private routeEchoUpdatedProperties:string[] =[];
    private outputChangeType = 0;
    
    private processingText:
    HTMLDivElement | null =
        null;

    // =====================================================
    // Persistent Artifact Store
    // =====================================================

    private readonly artifactStore = new ProjectDashboardArtifactStore();

    // =====================================================
    // Temporary IndexedDB Staging Store
    // Used For Post-Active-State Settings Changes
    // =====================================================

    private indexDbTemp:
        Map<string, ArrayBuffer> =
            new Map<string, ArrayBuffer>();
    
    // =====================================================
    // Temporary IndexedDB Reconciliation Status
    // =====================================================

    private indexDbTempStatus =
        new Map<
            string,
            {
                status:
                    "Pending" |
                    "Success" |
                    "Failed";

                error?:
                    string;
            }
        >();

    // =====================================================
    // Resident Registry State
    // =====================================================

    private customersRegistry:
        CustomersRegistry | null =
        null;

    private customerMasterRegistry:
        CustomerMasterRegistry | null =
        null;

    private fieldsRegistry:
        FieldsRegistry | null =
        null;

    // =====================================================
    // Location Events / Location Places Registries
    //
    // Registry Architecture Refactor - Stage E.
    //
    // Keyed by locationId, not array position - the
    // architecture supports multiple active Locations, and
    // locationId is the only stable identity. Rebuilt from the
    // authoritative resolved manifest on every
    // processCheckRegistryKeys() pass (see that function) so
    // stale Location entries do not survive a Customer Master
    // change (Location removed/inactive, registrySync false).
    // =====================================================

    private locationEventsRegistries:
        Map<string, LocationEventsRegistry> =
            new Map<string, LocationEventsRegistry>();

    private locationPlacesRegistries:
        Map<string, LocationPlacesRegistry> =
            new Map<string, LocationPlacesRegistry>();

    private scheduleVersionsRegistry:
        ScheduleVersionsRegistry | null =
        null;

    // =====================================================
    // Upload Session Completion State
    // Session Memory Only - Not Persisted, Not Reset By UI
    // Rebuilds, Reset Only By A Fresh Application Session
    // =====================================================

    private scheduleUploadCompletedThisSession = false;
    private worklistUploadCompletedThisSession = false;

    // =====================================================
    // Application Registry
    //
    // Application Version Gate. Resident snapshot of the exact
    // authoritative Application Registry that produced the CURRENT
    // in-progress version transaction - set once by
    // processCheckApplicationVersion's own Step 1 (before even its
    // Shutdown check), and intentionally kept resident across the
    // Restart Required billboard / Restart re-entry so that
    // transaction is accepted against the registry that actually
    // caused it, never a newer one published in the interim.
    //
    // Startup Architecture - Pass 3.6 (Version Acceptance + Registry
    // Snapshot). Read by processRestartApplication (via
    // processResolveApplicationVersionInfo's resetRequired) and by
    // Startup's own common version-acceptance boundary (via
    // processResolveApplicationVersionInfo's current) - released
    // (set back to null) only after that boundary's
    // processAcceptApplicationVersion call succeeds, or immediately
    // on the terminal Shutdown path.
    // =====================================================

    private applicationRegistry:
        ApplicationRegistry | null =
            null;

    // =====================================================
    // User
    // =====================================================

    private currentUser:
        CurrentUser | null =
            null;

    private currentUserProfile:
        UserProfileRegistry | null =
            null;

    // =====================================================
    // Active Runtime State
    // =====================================================
    private activeState: ActiveState | null = null;

    private notifyOutputChanged!: () => void;

    public init(
        context:
            ComponentFramework.Context<IInputs>,

        notifyOutputChanged:
            () => void,

        state:
            ComponentFramework.Dictionary,

        container:
            HTMLDivElement
    ): void {

        this.notifyOutputChanged =
        notifyOutputChanged;

        // =========================================================
        // Configure PCF Host Container
        // =========================================================
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        // =========================================================
        // Track Host Container Resize
        // =========================================================

        context.mode.trackContainerResize(
            true
        );

        this.container = container;

        this.buildUI();

    }

    // =========================================================
    // Build UI
    // =========================================================

    private buildUI():
    void {

        // =====================================================
        // Main
        // =====================================================

        this.ctrMain =
            document.createElement(
                "div"
            );

        this.ctrMain.className =
            "application-container";
        
        
        // =====================================================
        // Application Header
        // =====================================================

        this.ctrApplicationHeader =
            document.createElement(
                "div"
            );

        this.ctrApplicationHeader.className =
            "application-header";


        // =====================================================
        // Application Header - Left
        // =====================================================

        this.ctrApplicationHeaderLeft =
            document.createElement(
                "div"
            );

        this.ctrApplicationHeaderLeft.className =
            "application-header-left";

        // =====================================================
        // Application Header - Menu
        // =====================================================

        this.btnApplicationMenu =
            document.createElement(
                "button"
            );

        this.btnApplicationMenu.type =
            "button";

        this.btnApplicationMenu.className =
            "application-header-menu";

        this.btnApplicationMenu.title =
            "Menu";

        this.btnApplicationMenu.setAttribute(
            "aria-label",
            "Menu"
        );

        this.btnApplicationMenu.innerHTML =
            icons[
                "menu"
            ] ?? "";

        
            
        // =====================================================
        // Application Header - Application Name
        // =====================================================

        this.ctrApplicationName =
            document.createElement(
                "div"
            );

        this.ctrApplicationName.className =
            "application-header-application-name";


        // =====================================================
        // Application Header - Application Name - Active
        // =====================================================

        this.ctrApplicationNameActive =
            document.createElement(
                "span"
            );

        this.ctrApplicationNameActive.className =
            "application-header-application-name-active";

        this.ctrApplicationNameActive.textContent =
            "Active";


        // =====================================================
        // Application Header - Application Name - Manager
        // =====================================================

        this.ctrApplicationNameManager =
            document.createElement(
                "span"
            );

        this.ctrApplicationNameManager.className =
            "application-header-application-name-manager";

        this.ctrApplicationNameManager.textContent =
            "Manager";


        // =====================================================
        // Application Header - Application Name - Assemble
        // =====================================================

        this.ctrApplicationName.append(
            this.ctrApplicationNameActive,
            this.ctrApplicationNameManager
        );

        // =====================================================
        // Application Header - Separator
        // =====================================================

        this.ctrApplicationSeparator =
            document.createElement(
                "span"
            );

        this.ctrApplicationSeparator.className =
            "application-header-separator";

        this.ctrApplicationSeparator.textContent =
            "|";


        // =====================================================
        // Application Header - Module Name
        // =====================================================

        this.ctrApplicationModule =
            document.createElement(
                "span"
            );

        this.ctrApplicationModule.className =
            "application-header-module-name";

        this.ctrApplicationModule.textContent =
            "project dashboard";


        // =====================================================
        // Application Header - Menu Event
        // =====================================================

        this.btnApplicationMenu.addEventListener(
            "click",
            () => {

                this.processDispatchStartupPayload();

            }
        );


        // =====================================================
        // Application Header - Assemble Left
        // =====================================================

        this.ctrApplicationHeaderLeft.append(
            this.btnApplicationMenu,
            this.ctrApplicationName,
            this.ctrApplicationSeparator,
            this.ctrApplicationModule
        );


        // =====================================================
        // Application Header - Right
        // =====================================================

        this.ctrApplicationHeaderRight =
            document.createElement(
                "div"
            );

        this.ctrApplicationHeaderRight.className =
            "application-header-right";


        // =====================================================
        // Application Header - Update Available
        //
        // Startup Architecture - Pass 3.3 (Update Available Header
        // Action). Created once here, hidden by default - Startup
        // toggles application-hidden on every version evaluation
        // (see Section 3). No dedicated icon asset exists yet, so
        // application-header-action-update-available widens the
        // existing application-header-action treatment to fit a
        // short text label instead of an icon.
        // =====================================================

        this.btnApplicationUpdateAvailable =
            document.createElement(
                "button"
            );

        this.btnApplicationUpdateAvailable.type =
            "button";

        this.btnApplicationUpdateAvailable.className =
            "application-header-action application-header-action-update-available application-hidden";

        this.btnApplicationUpdateAvailable.title =
            "Update Available";

        this.btnApplicationUpdateAvailable.setAttribute(
            "aria-label",
            "Update Available"
        );

        this.btnApplicationUpdateAvailable.textContent =
            "Update Available";


        // =====================================================
        // Application Header - Settings
        // =====================================================

        this.btnApplicationSettings =
            document.createElement(
                "button"
            );

        this.btnApplicationSettings.type =
            "button";

        this.btnApplicationSettings.className =
            "application-header-action application-header-action-settings";

        this.btnApplicationSettings.title =
            "Settings";

        this.btnApplicationSettings.setAttribute(
            "aria-label",
            "Settings"
        );

        this.btnApplicationSettings.innerHTML =
            icons[
                "settings"
            ] ?? "";

        // =====================================================
        // Application Header - Upload
        // =====================================================

        this.btnApplicationUpload =
            document.createElement(
                "button"
            );

        this.btnApplicationUpload.type =
            "button";

        this.btnApplicationUpload.className =
            "application-header-action application-header-action-upload";

        this.btnApplicationUpload.title =
            "Upload";

        this.btnApplicationUpload.setAttribute(
            "aria-label",
            "Upload"
        );

        this.btnApplicationUpload.innerHTML =
            icons[
                "upload"
            ] ?? "";
        
        // =====================================================
        // Application Header - Settings Event
        // =====================================================

        this.btnApplicationSettings.addEventListener(
            "click",
            async () => {

                console.log(
                    "[ProjectDashboard] Opening Settings Manager"
                );

                try {

                    await this.processBuildActiveState(
                        "Existing",
                        false
                    );

                }
                catch (
                    error
                ) {

                    if (
                        error instanceof
                            ProjectDashboardArtifactStoreTerminalError
                    ) {

                        return;

                    }

                    throw error;

                }

            }
        );


        // =====================================================
        // Application Header - Upload Event
        // =====================================================

        this.btnApplicationUpload.addEventListener(
            "click",
            async () => {

                console.log(
                    "[ProjectDashboard] Mounting Version Upload Wizard"
                );


                // =====================================================
                // Check Active State
                // =====================================================

                try {

                    const activeStateIsReady =
                        await this.processCheckActiveState(
                            "Other"
                        );

                    if (
                        !activeStateIsReady
                    ) {

                        await this.processBuildActiveState(
                            "New",
                            false
                        );

                        return;

                    }

                }
                catch (
                    error
                ) {

                    if (
                        error instanceof
                            ProjectDashboardArtifactStoreTerminalError
                    ) {

                        return;

                    }

                    throw error;

                }


                // =====================================================
                // Check User Access
                // =====================================================

                const userHasAccess =
                    this.processCheckUserAccess(
                        "Upload"
                    );

                if (
                    !userHasAccess
                ) {

                    buildNotificationOverlay(
                        this.ctrMain,
                        "Access Denied",
                        "You do not have permission to upload data for the current project.",
                        "CloseOnly"
                    );

                    return;

                }

                // =====================================================
                // Disable Dashboard Tabs
                // =====================================================

                buildTabs(
                    this.ctrTabsHeader,
                    this.currentUserProfile!.defaultDashboardTabConfig,
                    this.pcfModeViewIndex,
                    () =>
                        this.previousPCFModeViewIndex,
                    this.processTabChange.bind(
                        this
                    ),
                    true,
                    "DisableOnly"
                );

                // =====================================================
                // Disable Application Upload
                // =====================================================

                this.btnApplicationUpload.disabled =
                    true;

                this.btnApplicationUpload.classList.add(
                    "application-disabled"
                );


                // =====================================================
                // Preserve Current Dashboard View
                // =====================================================

                this.processPayloadContext(
                    "Set"
                );


                // =====================================================
                // Build Upload Wizard
                // =====================================================

                buildVersionUploadWizard(
                    this.ctrMessages,
                    this.ctrDashboard,
                    this.ctrUploadVersion,
                    this.fieldsRegistry,
                    this.activeState,
                    this.artifactStore,
                    this.processProcessingOverlay.bind(
                        this
                    ),
                    this.processPayloadContext.bind(
                        this
                    ),
                    this.processRestoreDashboardView.bind(
                        this
                    ),
                    () => {

                        // =============================================
                        // Upload Wizard Closed
                        // PCF-Owned Path
                        // =============================================

                        this.processRestoreDashboardView();

                    },
                    () => {
                        buildTabs(
                            this.ctrTabsHeader,
                            this.currentUserProfile!.defaultDashboardTabConfig,
                            this.pcfModeViewIndex,
                            () =>
                                this.previousPCFModeViewIndex,
                            this.processTabChange.bind(
                                this
                            ),
                            true,
                            "EnableOnly"
                        );

                        // =====================================================
                        // Enable Application Upload
                        // =====================================================

                        this.btnApplicationUpload.disabled =
                            false;

                        this.btnApplicationUpload.classList.remove(
                            "application-disabled"
                        )

                    },
                    () =>
                        this.scheduleUploadCompletedThisSession,
                    (
                        completed
                    ) => {

                        this.scheduleUploadCompletedThisSession =
                            completed;

                    },
                    () =>
                        this.worklistUploadCompletedThisSession,
                    (
                        completed
                    ) => {

                        this.worklistUploadCompletedThisSession =
                            completed;

                    },


                    // =====================================================
                    // Get Location Events Registry
                    // =====================================================

                    this.processGetLocationEventsRegistry.bind(
                        this
                    )
                );


                // =====================================================
                // Show Upload Wizard
                // =====================================================

                this.ctrUploadVersion.className =
                    "project-dashboard-upload-wizard";

            }
        );


        // =====================================================
        // Application Header - Update Available Event
        //
        // Startup Architecture - Pass 3.3. Invokes the SAME
        // authoritative method as btnApplicationRestartRequired
        // (processRestartApplication) - one shared workflow, two
        // entry points. The shared workflow itself is not modified
        // here; see btnApplicationRestartRequired's own click
        // listener (Application Version Gate - Restart Required
        // Overlay, below) for the existing, unchanged pattern this
        // mirrors.
        // =====================================================

        this.btnApplicationUpdateAvailable.addEventListener(
            "click",
            () => {

                void this.processRestartApplication();

            }
        );


        // =====================================================
        // Application Header - Assemble Right
        // =====================================================

        this.ctrApplicationHeaderRight.append(
            this.btnApplicationUpdateAvailable,
            this.btnApplicationSettings,
            this.btnApplicationUpload
        );


        // =====================================================
        // Application Header - Assemble
        // =====================================================

        this.ctrApplicationHeader.append(
            this.ctrApplicationHeaderLeft,
            this.ctrApplicationHeaderRight
        );


        // =====================================================
        // Application Header - Mount
        // =====================================================

        this.ctrMain.appendChild(
            this.ctrApplicationHeader
        );


        // =====================================================
        // Tabs Header
        // =====================================================

        this.ctrTabsHeader =
            document.createElement(
                "div"
            );

        this.ctrTabsHeader.className =
            "project-dashboard-tabs-header";


        // =====================================================
        // Overview Placeholder Tab
        // =====================================================

        const tabOverview =
            document.createElement(
                "button"
            );

        tabOverview.className =
            "project-dashboard-tabs-tab project-dashboard-tabs-tab-selected application-disabled";

        tabOverview.textContent =
            "Overview";

        this.ctrTabsHeader.appendChild(
            tabOverview
        );


        // =====================================================
        // Mount Tabs Header
        // =====================================================

        this.ctrMain.appendChild(
            this.ctrTabsHeader
        );


        // =====================================================
        // Main Header
        // =====================================================

        this.ctrHeader =
            document.createElement(
                "div"
            );

        this.ctrHeader.className =
            "application-header";

        this.ctrHeader.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Search Input
        // =====================================================

        this.txtTaskSearch =
            document.createElement(
                "input"
            );

        this.txtTaskSearch.type =
            "text";

        this.txtTaskSearch.className =
            "application-search-input";

        this.txtTaskSearch.placeholder =
            "Search tasks...";

        // =====================================================
        // Search Tasks
        // =====================================================

        this.txtTaskSearch.addEventListener(
            "input",
            () => {

                return;

            }
        );


        // =====================================================
        // Clear Search
        // =====================================================

        this.btnTaskSearchClear =
            document.createElement(
                "button"
            );

        this.btnTaskSearchClear.type =
            "button";

        this.btnTaskSearchClear.className =
            "application-search-clear";

        this.btnTaskSearchClear.textContent =
            "Clear";

        this.btnTaskSearchClear.addEventListener(
            "click",
            () => {

                this.txtTaskSearch.value =
                    "";

                this.processSearch(
                    ""
                );

                this.txtTaskSearch.focus();

            }
        );


        // =====================================================
        // Assemble Main Header
        // =====================================================

        this.ctrHeader.append(
            this.txtTaskSearch,
            this.btnTaskSearchClear
        );


        // =====================================================
        // Main Body
        // =====================================================

        this.ctrBody =
            document.createElement(
                "div"
            );

        this.ctrBody.className =
            "application-body";


        // =====================================================
        // Messages
        // =====================================================

        this.ctrMessages =
            document.createElement(
                "div"
            );

        this.ctrMessages.className =
            "application-messages";


        // =====================================================
        // Message Content
        // =====================================================

        const messageContent =
            document.createElement(
                "div"
            );

        messageContent.className =
            "application-message-content";


        // =====================================================
        // Message Icon
        // =====================================================

        this.messageIcon =
            document.createElement(
                "div"
            );

        this.messageIcon.className =
            "application-message-icon";

        this.messageIcon.textContent =
            "";


        // =====================================================
        // Message Text
        // =====================================================

        this.message =
            document.createElement(
                "div"
            );

        this.message.className =
            "application-message-text";

        this.message.textContent =
            "";


        // =====================================================
        // Message Action Button
        //
        // Single Application Error Handler - Pass 1.
        //
        // Built once. Defaults hidden/disabled/non-interactive -
        // a normal showMessage call with no action must leave the
        // billboard looking exactly as it does today. The click
        // listener is wired exactly once, here, to a stable
        // wrapper delegating to messageActionCallback - see that
        // field's comment for why.
        // =====================================================

        this.btnMessageAction =
            document.createElement(
                "button"
            );

        this.btnMessageAction.type =
            "button";

        this.btnMessageAction.className =
            "application-message-action application-hidden";

        this.btnMessageAction.disabled =
            true;

        this.btnMessageAction.addEventListener(
            "click",
            () => {

                void this.messageActionCallback?.();

            }
        );


        // =====================================================
        // Assemble Message Content
        // =====================================================

        messageContent.append(
            this.messageIcon,
            this.message,
            this.btnMessageAction
        );

        this.ctrMessages.appendChild(
            messageContent
        );

        // =====================================================
        // Upload Version
        // Main Upload Version Container
        // =====================================================

        this.ctrUploadVersion =
            document.createElement(
                "div"
            );

        this.ctrUploadVersion.className =
            "project-dashboard-upload-version";

        this.ctrUploadVersion.classList.add(
            "application-hidden"
        );

        // =====================================================
        // Dashboard
        // Main Dashboard Container
        // =====================================================

        this.ctrDashboard =
            document.createElement(
                "div"
            );

        this.ctrDashboard.className =
            "project-dashboard-shared";

        this.ctrDashboard.classList.add(
            "application-hidden"
        );

        // =====================================================
        // Dashboard Shared Header
        // Shared Controls / Shared Header Content
        // =====================================================

        this.ctrDashboardSharedHeader =
            document.createElement(
                "div"
            );

        this.ctrDashboardSharedHeader.className =
            "project-dashboard-shared-header";

        this.ctrDashboardSharedHeader.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Shared Body
        // Permanent Dashboard Slot Mount Area
        // =====================================================

        this.ctrDashboardSharedBody =
            document.createElement(
                "div"
            );

        this.ctrDashboardSharedBody.className =
            "project-dashboard-shared-body";


        // =====================================================
        // Dashboard Slot Zero
        // System / Default Slot
        // Visible By Default
        // =====================================================

        this.ctrDashboardSlotZero =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotZero.className =
            "project-dashboard-slot-zero";


        // =====================================================
        // Dashboard Slot One
        // =====================================================

        this.ctrDashboardSlotOne =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotOne.className =
            "project-dashboard-slot-one";

        this.ctrDashboardSlotOne.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Two
        // =====================================================

        this.ctrDashboardSlotTwo =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotTwo.className =
            "project-dashboard-slot-two";

        this.ctrDashboardSlotTwo.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Three
        // =====================================================

        this.ctrDashboardSlotThree =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotThree.className =
            "project-dashboard-slot-three";

        this.ctrDashboardSlotThree.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Four
        // =====================================================

        this.ctrDashboardSlotFour =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotFour.className =
            "project-dashboard-slot-four";

        this.ctrDashboardSlotFour.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Five
        // =====================================================

        this.ctrDashboardSlotFive =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotFive.className =
            "project-dashboard-slot-five";

        this.ctrDashboardSlotFive.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Six
        // =====================================================

        this.ctrDashboardSlotSix =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotSix.className =
            "project-dashboard-slot-six";

        this.ctrDashboardSlotSix.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Seven
        // =====================================================

        this.ctrDashboardSlotSeven =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotSeven.className =
            "project-dashboard-slot-seven";

        this.ctrDashboardSlotSeven.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Eight
        // =====================================================

        this.ctrDashboardSlotEight =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotEight.className =
            "project-dashboard-slot-eight";

        this.ctrDashboardSlotEight.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Dashboard Slot Nine
        // =====================================================

        this.ctrDashboardSlotNine =
            document.createElement(
                "div"
            );

        this.ctrDashboardSlotNine.className =
            "project-dashboard-slot-nine";

        this.ctrDashboardSlotNine.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Assemble Dashboard Slots
        // =====================================================

        this.ctrDashboardSharedBody.append(
            this.ctrDashboardSlotZero,
            this.ctrDashboardSlotOne,
            this.ctrDashboardSlotTwo,
            this.ctrDashboardSlotThree,
            this.ctrDashboardSlotFour,
            this.ctrDashboardSlotFive,
            this.ctrDashboardSlotSix,
            this.ctrDashboardSlotSeven,
            this.ctrDashboardSlotEight,
            this.ctrDashboardSlotNine
        );


        // =====================================================
        // Dashboard Shared Footer
        // Shared Controls / Shared Footer Content
        // =====================================================

        this.ctrDashboardSharedFooter =
            document.createElement(
                "div"
            );

        this.ctrDashboardSharedFooter.className =
            "project-dashboard-shared-footer";

        this.ctrDashboardSharedFooter.classList.add(
            "application-hidden"
        );


        // =====================================================
        // Assemble Dashboard
        // =====================================================

        this.ctrDashboard.append(
            this.ctrDashboardSharedHeader,
            this.ctrDashboardSharedBody,
            this.ctrDashboardSharedFooter
        );


        // =====================================================
        // Main Footer
        // =====================================================

        this.ctrFooter =
            document.createElement(
                "div"
            );

        this.ctrFooter.className =
            "application-footer";


        // =====================================================
        // Assemble Main Body
        // =====================================================

        this.ctrBody.append(
            this.ctrMessages,
            this.ctrUploadVersion,
            this.ctrDashboard
        );


        // =====================================================
        // Assemble Main
        // =====================================================

        this.ctrMain.append(
            this.ctrHeader,
            this.ctrBody,
            this.ctrFooter
        );

        // =====================================================
        // Mount
        // =====================================================

        this.container.appendChild(
            this.ctrMain
        );

        // ========================================
        // Shared Processing Overlay
        // ========================================

        this.ctrProcessingOverlay =
            document.createElement(
                "div"
            );

        this.ctrProcessingOverlay.className =
            "project-dashboard-overlay-processing application-hidden";

        // ========================================
        // Processing Spinner
        // ========================================

        const processingSpinner =
            document.createElement(
                "div"
            );

        processingSpinner.className =
            "project-dashboard-overlay-processing-spinner";

        // ========================================
        // Processing Progress
        // ========================================

        const processingProgress =
            document.createElement(
                "div"
            );

        processingProgress.className =
            "project-dashboard-overlay-processing-progress application-hidden";

        const processingProgressBar =
            document.createElement(
                "div"
            );

        processingProgressBar.className =
            "project-dashboard-overlay-processing-progress-bar";

        processingProgress.appendChild(
            processingProgressBar
        );

        // ========================================
        // Processing Text
        // ========================================

        const processingText =
            document.createElement(
                "div"
            );

        processingText.className =
            "project-dashboard-overlay-processing-text";

        processingText.textContent =
            "Processing...";

        // ========================================
        // Assemble Processing Overlay
        // ========================================

        this.ctrProcessingOverlay.append(
            processingSpinner,
            processingProgress,
            processingText
        );

        this.container.appendChild(
            this.ctrProcessingOverlay
        );

        // ========================================
        // Application Version Gate
        //
        // Restart Required Overlay
        //
        // Highest-level Project Dashboard container - a sibling
        // of ctrMain appended directly to the PCF root container,
        // exactly like ctrProcessingOverlay above. This guarantees
        // it can never be trapped inside Settings, Upload, or any
        // Dashboard slot, all of which mount as descendants of
        // ctrMain. Blocking but recoverable - the Restart button
        // is the only escape, unlike app-fatal Shutdown.
        // ========================================

        this.ctrApplicationRestartRequired =
            document.createElement(
                "div"
            );

        this.ctrApplicationRestartRequired.className =
            "project-dashboard-overlay-restart-required application-hidden";

        const restartRequiredMessage =
            document.createElement(
                "div"
            );

        restartRequiredMessage.className =
            "project-dashboard-overlay-restart-required-message";

        restartRequiredMessage.textContent =
            "Project Dashboard - New Version Available";

        const restartRequiredDetail =
            document.createElement(
                "div"
            );

        restartRequiredDetail.className =
            "project-dashboard-overlay-restart-required-detail";

        restartRequiredDetail.textContent =
            "A new version of Project Dashboard is required to continue.";

        this.btnApplicationRestartRequired =
            document.createElement(
                "button"
            );

        this.btnApplicationRestartRequired.type =
            "button";

        this.btnApplicationRestartRequired.className =
            "project-dashboard-overlay-restart-required-button";

        this.btnApplicationRestartRequired.textContent =
            "Restart";

        this.btnApplicationRestartRequired.addEventListener(
            "click",
            () => {

                void this.processRestartApplication();

            }
        );

        this.ctrApplicationRestartRequired.append(
            restartRequiredMessage,
            restartRequiredDetail,
            this.btnApplicationRestartRequired
        );

        this.container.appendChild(
            this.ctrApplicationRestartRequired
        );

    }

    // =========================================================
    // Overlay - Spinner
    // =========================================================

    private processProcessingOverlay(
        show:
            boolean | null,
        message?:
            string,
        mode:
            "Spinner" | "Progress" =
                "Spinner",
        progress?:
            number
    ): void {

        const processingSpinner =
            this.ctrProcessingOverlay.querySelector(
                ".project-dashboard-overlay-processing-spinner"
            ) as HTMLDivElement | null;

        const processingProgress =
            this.ctrProcessingOverlay.querySelector(
                ".project-dashboard-overlay-processing-progress"
            ) as HTMLDivElement | null;

        const processingProgressBar =
            this.ctrProcessingOverlay.querySelector(
                ".project-dashboard-overlay-processing-progress-bar"
            ) as HTMLDivElement | null;

        const processingText =
            this.ctrProcessingOverlay.querySelector(
                ".project-dashboard-overlay-processing-text"
            ) as HTMLDivElement | null;


        // ========================================
        // Update Processing Text
        // ========================================

        if (
            processingText &&
            message !==
                undefined
        ) {

            processingText.textContent =
                message;

        }


        // ========================================
        // Update Processing Mode
        // ========================================

        if (
            processingSpinner &&
            processingProgress
        ) {

            processingSpinner.classList.toggle(
                "application-hidden",
                mode !==
                    "Spinner"
            );

            processingProgress.classList.toggle(
                "application-hidden",
                mode !==
                    "Progress"
            );

        }


        // ========================================
        // Update Progress
        // ========================================

        if (
            processingProgressBar &&
            progress !==
                undefined
        ) {

            const normalizedProgress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );

            processingProgressBar.style.width =
                `${normalizedProgress}%`;

        }


        // ========================================
        // Update Processing Overlay Visibility
        // ========================================

        if (
            show !==
                null
        ) {

            this.ctrProcessingOverlay.classList.toggle(
                "application-hidden",
                !show
            );

        }

    }

    // =========================================================
    // Notify Output Changed - Terminal Boundary
    //
    // Every existing direct notifyOutputChanged() call site is
    // routed through this boundary. A terminated instance must
    // not publish output to Power Apps.
    // =========================================================

    private processNotifyOutputChanged(): void {

        if (
            this.applicationTerminated
        ) {

            return;

        }

        this.notifyOutputChanged();

    }

    // =========================================================
    // Dispatch PCF Mode Event - Terminal Boundary
    //
    // Every existing direct this.context.events.PCFModeEvent...
    // dispatch site is routed through this boundary. A
    // terminated instance must not publish events to Power
    // Apps. Preserves the existing event-availability check.
    // =========================================================

    private processDispatchPCFModeEvent(
        eventName:
            "PCFModeEventCrud" |
            "PCFModeEventSendStatus200" |
            "PCFModeEventSendStatus300" |
            "PCFModeEventSendStatus400" |
            "PCFModeEventSendStatus911"
    ): void {

        if (
            this.applicationTerminated
        ) {

            return;

        }

        if (
            typeof this.context.events[eventName] ===
                "function"
        ) {

            this.context.events[eventName]();

        }

    }

    // =========================================================
    // Dispatch Startup Payload
    //
    // Extracted verbatim from the Application Header Menu's
    // proven "click" handler - the one existing, already-working
    // route back into a fresh PA/PCF Startup pass. Reused by the
    // Menu itself and by the Application Version Gate's Restart
    // button, so both intentionally re-enter Startup through the
    // exact same payload, rather than maintaining two dispatch
    // paths.
    //
    // Startup Architecture - Pass 3.4 (Reset-Required Restart
    // Model). mode defaults to "" (ordinary Startup re-entry,
    // matching every prior caller unchanged) - processRestartApplication
    // passes "Restart" so the resulting Startup pass can recognize
    // this specific re-entry and bypass version INTERVENTION in
    // Section 3. PayloadToPCFMode is otherwise always "" on every
    // existing Startup/Data-group payload dispatch in this
    // codebase, so this is a non-colliding reuse of an
    // already-existing field.
    // =========================================================

    private processDispatchStartupPayload(
        mode = ""
    ): void {

        //Reset view type so things weill truly restart
        this.pcfModeViewType = "";
        this.route = 0

        const payload =
        {
            PayloadToPCFGroup:
                "Data",

            PayloadToPCFType:
                `Startup|${Date.now()}`,

            PayloadToPCFMode:
                mode,

            PayloadToPCFSubMode:
                "",

            PayloadToPCFSubModePath:
                "",

            PayloadToPCFDataOne:
                "",

            PayloadToPCFDataTwo:
                "",

            PayloadToPCFDataThree:
                "",

            PayloadToPCFDataFour:
                "",

            PayloadToPCFViewIndex:
                0,

            PayloadToPCFViewContext:
                this.payloadViewContext,

            PayloadToPCFDecodedArtifactData:
                "",

            PayloadToPCFUserEmail:
                JSON.parse(
                    this.context.parameters.PCFModeIncomingPayloadJson.raw || "{}"
                ).PayloadToPCFUserEmail ?? ""
        };

        this.pcfModeIncomingPayloadJson =
            JSON.stringify(
                payload
            );

        this.outputChangeType =
            7;

        this.processNotifyOutputChanged();

    }

    // =========================================================
    // Update View
    // =========================================================

    public async updateView(
        context:
            ComponentFramework.Context<IInputs>
    ): Promise<void> {

        // =====================================================
        // Application Terminal Gate
        //
        // A terminated instance must not begin new routing work.
        // =====================================================

        if (
            this.applicationTerminated
        ) {

            return;

        }

        //console.count("updateView");

        //Reset so logs reflect current run
        this.routeStatus = 0;

        console.log(
            "Start of UV",
            "| Route:",
            this.route,
            "| Route Status:",
            this.routeStatus,
            "| View Type:",
            this.pcfModeViewType === null ||
            this.pcfModeViewType === ""
                ? "Empty"
                : this.pcfModeViewType,
            "| Updated Properties:",
            context.updatedProperties
        );

        this.context =
            context;

        if (
            this.updateViewRenderCount ===
                0 &&
            !this.previousPCFModeViewType &&
            (
                context.updatedProperties.length ===
                    0 ||
                (
                    context.parameters.PCFModeIncomingPayloadJson.raw ??
                    ""
                ).length ===
                    0
            )
        ) {

            this.updateViewRenderCount++;

            this.processEvent(
                911,
                {}
            );

            return;

        }
        else {

            //this.updateViewRenderCount++;

        }

        const PCFContextHasChanged =
            context.updatedProperties.some(
                property =>
                    property.startsWith(
                        "PCFMode"
                    )
            )||
            (!context.parameters.PCFModeViewType.raw && this.updateViewRenderCount ===
        0)

        const PCFNonContextHasChanged =
        context.updatedProperties.some(
            property =>
                property === "layout"
                ||
                property === "theme"
        );

        console.log(
            "Updated Properties Exact:",
            JSON.stringify(
                context.updatedProperties
            )
        );

        // Is there an active workflow being executed? Is this an echo or an error?
        if (

            this.pcfModeViewType === "Error" ||
            (
                !PCFContextHasChanged
                &&
                (
                    this.route === 888888 ||
                    this.routeInProgress
                    ||
                    PCFNonContextHasChanged
                )
            )
        ) {

            // Capture re-entry context and route to Echo Router.

            this.routeEchoSource =
                this.pcfModeViewType;

            this.routeEchoUpdatedProperties =
                [...context.updatedProperties];

            this.route =
                888888;

        }
        else if (
            !this.pcfModeViewType
        ) {

            // =====================================================
            // Empty - Initial PCF Entry
            // =====================================================
            // Scenario:
            // PCF has initialized but no internal View Type has
            // been established yet.
            //
            // Expected:
            // Inspect the incoming payload to determine the
            // initial View Type, normally Startup.

            if (
                String(
                    JSON.parse(
                        context.parameters.PCFModeIncomingPayloadJson.raw || "{}"
                    ).PayloadToPCFType ?? ""
                ).startsWith(
                    "Startup"
                )
            ) {

                this.pcfModeViewType =
                    "Startup";

            }
            else {

                throw new Error(
                    "[ProjectDashboard] PCF View Type is empty but incoming payload is not available or is not Startup."
                );

            }

        }

        // ============================================
        // Startup bypass checks
        // ============================================

        if (
            PCFContextHasChanged
            ||
            (
                this.route !== 996 && // Mode change
                this.route !== 997 && // Retry
                this.route !== 998 && // Reset
                this.route !== 999 && // Safe exit
                this.route !== 888888 && // Echo
                this.route !== 999999 // Sleep
            )
        ) {
            
            //Reset route id
            this.route = 0;

            //No bypass
            //this.pcfModeViewInfoJson =
                //context.parameters.PCFModeViewInfoJson.raw ??
                //"";

            //this.pcfModeViewIndex =
                //context.parameters.PCFModeViewIndex.raw ??
                //0;

            //this.pcfModeIncomingStatus =
                //context.parameters.PCFModeIncomingStatus.raw ??
                //0;

            //this.pcfModeIncomingPayloadJson =
                //context.parameters.PCFModeIncomingPayloadJson.raw ??
                //"";

            // ========================================
            // Startup
            // ========================================

            if (
                this.pcfModeViewType ===
                    "Startup" ||
                !this.pcfModeViewType
            ) {

                console.log(
                    "Start - Route: ",
                    this.pcfModeViewType
                );

                this.processProcessingOverlay(
                    true,
                    "Checking version...",
                    "Spinner"
                );

                // ========================================
                // Startup Azure Network Deadline State
                //
                // Bounds only the startup Azure network phase
                // (Application Registry / User Access / User
                // Profile reads). Declared here so the outer
                // catch/finally below can classify and clear
                // it regardless of which startup step fails.
                // ========================================

                const startupAzureTimeoutMs =
                    15000;

                const startupRequestController =
                    new AbortController();

                let startupRequestTimedOut =
                    false;

                let startupRequestTimeout:
                    number | undefined =
                        undefined;

                try {

                    this.routeInProgress = true

                    // ========================================
                    // Open Artifact Store
                    // ========================================

                    await this.artifactStore.open();

                    // ========================================
                    // Start Startup Azure Network Deadline
                    //
                    // Startup Architecture - Pass 1 (User Access
                    // First). Moved ahead of User Access, since
                    // User Access is itself the first Azure request
                    // of this Startup pass and needs this transport
                    // infrastructure (AbortController/timeout)
                    // already in place - this is infrastructure
                    // initialization, not an application-state
                    // decision, so it does not violate the
                    // User-Access-first invariant. Still covers
                    // every startup Azure read that follows,
                    // whichever one runs last.
                    // ========================================

                    startupRequestTimeout =
                        window.setTimeout(
                            () => {

                                startupRequestTimedOut =
                                    true;

                                startupRequestController.abort();

                            },
                            startupAzureTimeoutMs
                        );


                    // ========================================
                    // Get Current User Global Access
                    //
                    // Startup Architecture - Pass 1 (User Access
                    // First). USER ACCESS IS THE FIRST APPLICATION
                    // AUTHORITY ON EVERY STARTUP - moved ahead of
                    // Application Registry retrieval and
                    // processCheckApplicationVersion. No
                    // application-state decision (local storage
                    // interpretation, Application Registry,
                    // version evaluation) occurs before this
                    // succeeds.
                    // ========================================

                    this.processProcessingOverlay(
                        null,
                        "Checking user access...",
                        "Spinner"
                    );

                    this.payloadUserEmail =
                        JSON.parse(
                            context.parameters.PCFModeIncomingPayloadJson.raw || "{}"
                        ).PayloadToPCFUserEmail ?? "";

                    // ========================================
                    // Restart Re-Entry Context
                    //
                    // Startup Architecture - Pass 3.4 (Reset-Required
                    // Restart Model) / Pass 3.5 (True Restart
                    // Re-Entry Bypass). Temporary routing context
                    // only - never persisted as application state,
                    // never written to the artifact store. Read
                    // directly from the incoming payload (the same
                    // JSON.parse pattern already used above for
                    // PayloadToPCFUserEmail) rather than the hydrated
                    // this.payloadMode field, since Startup routing
                    // (pcfModeViewType === "Startup", decided purely by
                    // PayloadToPCFType) runs before processIncomingPayload
                    // ever hydrates this.payloadMode - that hydration
                    // only occurs on the separate Status-200/400
                    // re-entry path. PayloadToPCFMode is otherwise
                    // always "" on every existing Startup/Data-group
                    // dispatch in this codebase, so "Restart" is an
                    // unambiguous, non-colliding value - see
                    // processDispatchStartupPayload /
                    // processRestartApplication. User Validation/User
                    // Session below are NEVER bypassed by this - only
                    // the entire Section 3 Version Gate is skipped
                    // (see below), not re-run-then-suppressed.
                    // ========================================

                    const startupIsRestartReEntry =
                        JSON.parse(
                            context.parameters.PCFModeIncomingPayloadJson.raw || "{}"
                        ).PayloadToPCFMode ===
                            "Restart";

                    this.currentUser =
                        await getUserAccessFromAzure(
                            this.payloadUserEmail as string,
                            startupRequestController.signal
                        );

                    // ========================================
                    // Check Current User Is Active
                    //
                    // Startup Architecture - Pass 1B (Authorization
                    // Failure Invalidates Local State). No trusted
                    // authorization means no trusted resident state -
                    // clear every resident artifact-store key and
                    // reset in-memory user-authority fields before
                    // communicating the failure. This check sits
                    // inside the outer try, so a clear failure here
                    // propagates to the existing outer catch and its
                    // established centralized error communication -
                    // no new error-handling decision is required for
                    // this specific exit.
                    // ========================================

                    if (
                        !this.currentUser
                    ) {

                        this.currentUserProfile =
                            null;

                        await this.processInvalidateLocalApplicationCache();

                        this.showMessage(
                            true,
                            "Project Dashboard - User not found. Contact your administrator for access.",
                            undefined,
                            true,
                            "app-fatal"
                        );

                        return;

                    }

                    // ========================================
                    // Check Current User Global Access
                    //
                    // Startup Architecture - Pass 1B. Same
                    // authorization-failure invalidation as above -
                    // this.currentUser itself was truthy (User Access
                    // returned data) but carries no usable access, so
                    // it is reset to null alongside the resident
                    // store clear rather than left resident with a
                    // decoded-but-unauthorized value.
                    // ========================================

                    if (
                        !this.currentUser.globalAccessKeys.some(
                            key =>
                                key.trim().length >
                                    0
                        )
                    ) {

                        this.currentUser =
                            null;

                        this.currentUserProfile =
                            null;

                        await this.processInvalidateLocalApplicationCache();

                        this.showMessage(
                            true,
                            "Project Dashboard - Access Denied. Contact your administrator for access.",
                            undefined,
                            true,
                            "app-fatal"
                        );

                        return;

                    }

                    // ========================================
                    // User exists - User has Key - Start User Session
                    // ========================================

                    this.processProcessingOverlay(
                        null,
                        "Starting user session...",
                        "Spinner"
                    );

                    // ========================================
                    // Persist Current User & User Registry
                    // ========================================

                    await this.artifactStore.put(
                        "user:current",
                        new TextEncoder().encode(
                            JSON.stringify(
                                this.currentUser
                            )
                        ).buffer
                    );

                    const userProfilePackage =
                        await getArtifactsFromAzure(
                            "Other",
                            [
                                this.currentUser.userProfilePath
                            ],
                            startupRequestController.signal
                        );

                    const userProfileArtifacts =
                        splitAzureArtifactPackage(
                            userProfilePackage
                        );

                    const userProfileArtifact =
                        userProfileArtifacts.get(
                            `other:${this.currentUser.userProfilePath}`
                        );

                    if (
                        !userProfileArtifact
                    ) {

                        throw new Error(
                            `[ProjectDashboard] User profile registry was not returned: ${this.currentUser.userProfilePath}`
                        );

                    }

                    await this.artifactStore.put(
                        "user:current_profile",
                        userProfileArtifact
                    );

                    this.currentUserProfile =
                        JSON.parse(
                            new TextDecoder().decode(
                                new Uint8Array(
                                    userProfileArtifact
                                )
                            )
                        ) as UserProfileRegistry;


                    // ========================================
                    // Application Version Gate
                    //
                    // Startup Architecture - Pass 1 (User Access
                    // First). Everything from here down is
                    // application-state processing, now
                    // structurally unreachable unless User Access
                    // above already succeeded.
                    //
                    // Startup Architecture - Pass 3.5 (True Restart
                    // Re-Entry Bypass). A Restart re-entry
                    // (startupIsRestartReEntry) skips this entire
                    // Section 3 gate - no Application Registry fetch
                    // for this purpose, no processCheckApplicationVersion
                    // call, no ApplicationVersionStatus is calculated
                    // at all. Restart mode is trusted, one-shot
                    // routing context generated internally only by
                    // processRestartApplication, itself only
                    // reachable after a prior Startup pass already
                    // completed Version Check and the user already
                    // executed the resulting action - re-evaluating
                    // the version on this same re-entry would re-run
                    // a decision that has already been made. This
                    // intentionally also skips this pass's
                    // appStatus === "Shutdown" check (it lives inside
                    // processCheckApplicationVersion, not as a
                    // separate duplicate check) - the next NORMAL
                    // Startup will evaluate it again.
                    // ========================================

                    if (
                        !startupIsRestartReEntry
                    ) {

                        // ========================================
                        // 2 - Get Application Registry
                        //
                        // Runs unconditionally - Shutdown must be
                        // detected even for a genuinely new
                        // installation with no prior local cache.
                        // ========================================

                        let applicationRegistryArtifact:
                            ArrayBuffer | undefined;

                        try {

                            applicationRegistryArtifact =
                                await this.processFetchAuthoritativeApplicationRegistryArtifact(
                                    startupRequestController.signal
                                );


                            // ========================================
                            // 2.1 - Validate Application Registry
                            // ========================================

                            if (
                                !applicationRegistryArtifact
                            ) {

                                this.showMessage(
                                    true,
                                    "Project Dashboard - Application configuration is unavailable. Refresh your browser to try again.",
                                    "Application Registry was not returned.",
                                    true,
                                    "app-fatal"
                                );

                                return;

                            }

                        }
                        catch (
                            error
                        ) {

                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : String(
                                        error
                                    );

                            // ========================================
                            // Startup Azure Network Deadline Exceeded
                            //
                            // Checked first - an aborted Application
                            // Registry read must not fall through to
                            // the ordinary retrieval-failure message.
                            // ========================================

                            if (
                                startupRequestTimedOut
                            ) {

                                this.showMessage(
                                    true,
                                    "Project Dashboard - Application startup timed out. Refresh your browser to try again.",
                                    `Startup Azure deadline exceeded after ${startupAzureTimeoutMs} ms: ${errorMessage}`,
                                    true,
                                    "app-fatal"
                                );

                                return;

                            }

                            this.showMessage(
                                true,
                                "Project Dashboard - Application configuration is unavailable. Refresh your browser to try again.",
                                `Application Registry retrieval failed: ${errorMessage}`,
                                true,
                                "app-fatal"
                            );

                            return;

                        }


                        // ========================================
                        // End Startup Azure Network Deadline
                        //
                        // Startup Architecture - Pass 1 (User Access
                        // First). The final startup Azure read
                        // (Application Registry, now that User
                        // Access/Profile run first) has completed.
                        // Clear the deadline immediately, before any
                        // subsequent local IndexedDB work, so that
                        // work is never charged against the network
                        // deadline.
                        // ========================================

                        window.clearTimeout(
                            startupRequestTimeout
                        );


                        // ========================================
                        // 2.2 - Decode Application Registry
                        // ========================================

                        const applicationRegistry =
                            JSON.parse(
                                new TextDecoder().decode(
                                    new Uint8Array(
                                        applicationRegistryArtifact
                                    )
                                )
                            ) as ApplicationRegistry;


                        // ========================================
                        // 3 - Evaluate Application Version
                        //
                        // Single application-version decision model -
                        // Startup no longer maintains its own separate
                        // requiredVersion comparison beside this.
                        // ========================================

                        const applicationVersionStatus =
                            await this.processCheckApplicationVersion(
                                applicationRegistry
                            );


                        // ========================================
                        // 3.0 - Update Available Header Visibility
                        //
                        // Startup Architecture - Pass 3.3 (Update
                        // Available Header Action). Set intentionally
                        // on every successful evaluation - Update
                        // Available is the only status that shows
                        // this button, so a prior Startup's Update
                        // Available state can never remain visible
                        // after a later Startup resolves Pass or No
                        // Local Version. Non-blocking - execution
                        // always continues below regardless of this
                        // toggle.
                        // ========================================

                        this.btnApplicationUpdateAvailable.classList.toggle(
                            "application-hidden",
                            applicationVersionStatus !==
                                "Update Available"
                        );


                        // ========================================
                        // 3.1 - Shutdown Stops Startup
                        //
                        // The gate already invoked showMessage/app-fatal.
                        //
                        // Startup Architecture - Pass 3.6 (Version
                        // Acceptance + Registry Snapshot). Shutdown is
                        // terminal - no Restart transaction can ever
                        // complete from this state (app-fatal routes
                        // every further updateView call to the Echo
                        // router, never back through Startup), so the
                        // retained this.applicationRegistry snapshot
                        // (already set above by
                        // processCheckApplicationVersion's own Step 1)
                        // has no future consumer. Released here for
                        // the same reason resident state is released
                        // on other terminal failures elsewhere in
                        // Startup, not because Shutdown itself needed
                        // a new mechanism.
                        // ========================================

                        if (
                            applicationVersionStatus ===
                                "Shutdown"
                        ) {

                            this.applicationRegistry =
                                null;

                            return;

                        }


                        // ========================================
                        // 3.2 - Restart Required Preparation + Stop
                        // Startup
                        //
                        // Startup Architecture - Pass 3.7 (Restart
                        // Required Preparation + True Application
                        // Restart). The local version transaction must
                        // be fully prepared BEFORE the user is ever
                        // presented with the Restart Required UI -
                        // resolve the SAME ApplicationVersionInfo that
                        // produced this decision, optionally clear
                        // IndexedDB, then accept the triggering
                        // version, all before mounting the billboard.
                        // The Restart button itself no longer performs
                        // any of this - see processRestartApplication.
                        // A later Restart re-entry does not repeat any
                        // of this either - see the common acceptance
                        // boundary below, which now explicitly excludes
                        // Restart re-entry.
                        //
                        // Locked order: optional clear -> write version
                        // -> mount UI -> return. Never write-then-clear
                        // (would delete the version just written).
                        // Never show-then-prepare (the user must not be
                        // able to click Restart before preparation has
                        // succeeded).
                        //
                        // Neither call below is wrapped in a local
                        // try/catch - a failure in either propagates
                        // unchanged to the existing outer Startup catch,
                        // exactly like every other unguarded await in
                        // this try block. That is sufficient on its own
                        // to satisfy "the UI must not be shown as though
                        // preparation succeeded" - a thrown error skips
                        // every following line, including
                        // processMountApplicationRestartRequired below,
                        // with no new error-handling mechanism required.
                        // ========================================

                        if (
                            applicationVersionStatus ===
                                "Restart Required"
                        ) {

                            const versionInfo =
                                this.processResolveApplicationVersionInfo(
                                    applicationRegistry
                                );

                            if (
                                versionInfo.resetRequired
                            ) {

                                await this.processInvalidateLocalApplicationCache();

                            }

                            await this.processAcceptApplicationVersion(
                                versionInfo.current
                            );

                            this.applicationRegistry =
                                null;

                            this.processProcessingOverlay(
                                false
                            );

                            this.processMountApplicationRestartRequired();

                            return;

                        }

                    }
                    else {

                        // ========================================
                        // 3.0 - Update Available Header Visibility -
                        // Restart Re-Entry
                        //
                        // Startup Architecture - Pass 3.5 (True
                        // Restart Re-Entry Bypass). Section 3 above
                        // was skipped entirely, so its normal
                        // per-evaluation toggle never ran - force the
                        // button hidden here instead, so a Restart
                        // re-entry can never retain a stale visible
                        // Update Available button.
                        // ========================================

                        this.btnApplicationUpdateAvailable.classList.add(
                            "application-hidden"
                        );

                    }

                    // ========================================
                    // Startup Architecture - Pass 3.2 (Version
                    // Status Semantics).
                    //
                    // Obsolete acceptance workaround removed. It
                    // existed only for the retired Pass-3.1-era path
                    // where an empty local cache could itself
                    // produce "Active" - that path no longer exists
                    // (an absent system:localVersion now reports
                    // "No Local Version" directly). Section 3 itself
                    // performs zero version-acceptance writes for any
                    // status - see the common acceptance boundary
                    // immediately below.
                    // ========================================

                    // ========================================
                    // Common Version Acceptance Boundary
                    //
                    // Startup Architecture - Pass 3.6 (Version
                    // Acceptance + Registry Snapshot) / Pass 3.7
                    // (Restart Required Preparation + True Application
                    // Restart). Reached only by normal Startup's
                    // non-blocking outcomes - Pass, No Local Version,
                    // Update Available. Never reached by Shutdown or
                    // Restart Required (both now fully prepare-and-
                    // return earlier, above - Restart Required's own
                    // acceptance happens in its own branch, before its
                    // billboard is even shown). Explicitly EXCLUDED on
                    // Restart re-entry (startupIsRestartReEntry) - a
                    // Restart re-entry must never depend on
                    // this.applicationRegistry or attempt a second
                    // acceptance, since its version was already written
                    // during the ORIGINAL Restart Required/Update
                    // Available pass, before the user ever left that
                    // screen. this.applicationRegistry (the Application
                    // Version Gate's existing resident snapshot field -
                    // already set by processCheckApplicationVersion's
                    // own Step 1) still holds the exact registry that
                    // produced this pass's decision. Its resolved
                    // versionInfo.current is accepted through the
                    // existing processAcceptApplicationVersion before
                    // the snapshot is released - if the accept throws,
                    // it propagates to the existing outer Startup catch
                    // unchanged, and the snapshot is intentionally left
                    // intact rather than cleared ahead of a write that
                    // never succeeded.
                    // ========================================

                    if (
                        !startupIsRestartReEntry &&
                        this.applicationRegistry
                    ) {

                        const versionInfo =
                            this.processResolveApplicationVersionInfo(
                                this.applicationRegistry
                            );

                        await this.processAcceptApplicationVersion(
                            versionInfo.current
                        );

                        this.applicationRegistry =
                            null;

                    }

                    // ========================================
                    // Startup - Move PCF Into Runtime View State
                    //
                    // Section 4 - Normal Runtime. Reached
                    // unconditionally whether Section 3 ran normally
                    // or was bypassed for Restart re-entry.
                    // ========================================

                    this.pcfModeViewType =
                        "View";

                    this.previousPCFModeViewType =
                        this.pcfModeViewType;

                    // =====================================================
                    // Startup - Set Tabs
                    // =====================================================

                    this.processBuildUserTabs("Build",0,false);


                }
                catch (
                    error
                ) {

                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : String(
                                error
                            );

                    // ========================================
                    // Startup Architecture - Pass 1B (Clear
                    // IndexedDB On Any Auth Failure).
                    //
                    // This catch is the User Auth gate's failure
                    // boundary (User Access and the User Profile
                    // fetch that depends on it both run before
                    // Application Registry/version processing - see
                    // Pass 1). ANY failure reaching this catch means
                    // the Auth gate did not complete successfully,
                    // so local state is no longer trusted -
                    // regardless of status/error type. The error
                    // TYPE only ever selects the MESSAGE
                    // (below, inside processApplicationError's
                    // classification); it never controls whether
                    // this clear runs. In-memory user-authority
                    // fields are reset alongside it so no stale
                    // authorized-user state survives either.
                    // ========================================

                    this.currentUser =
                        null;

                    this.currentUserProfile =
                        null;

                    await this.processInvalidateLocalApplicationCache();

                    // ========================================
                    // Startup Azure Network Deadline Exceeded
                    //
                    // Checked first - a timed-out User Access or
                    // User Profile read must not fall through to
                    // the existing classified failure messages.
                    // ========================================

                    if (
                        startupRequestTimedOut
                    ) {

                        this.showMessage(
                            true,
                            "Project Dashboard - Application startup timed out. Refresh your browser to try again.",
                            `Startup Azure deadline exceeded after ${startupAzureTimeoutMs} ms: ${errorMessage}`,
                            true,
                            "app-fatal"
                        );

                        return;

                    }

                    // ========================================
                    // Single Application Error Handler - Pass 3.
                    //
                    // Startup no longer classifies this failure
                    // itself - it only identifies the operation
                    // that failed (GetUserAccessFromAzure, the
                    // same identifier helpers/errors.ts's User
                    // Access classification family is already
                    // gated on) and supplies the communication
                    // adapter. The original error (an
                    // AzureArtifactError, with its real .status,
                    // for an Azure failure; a plain Error for the
                    // still-unmigrated "Artifact store is not
                    // open" case) is passed intact - no
                    // pre-normalization, no disposition override.
                    // processApplicationError normalizes,
                    // classifies, resolves disposition (Message,
                    // for every currently-known case here), and
                    // performs the resulting showMessage/app-fatal
                    // call itself. Startup only owns stopping this
                    // workflow afterward.
                    // ========================================

                    processApplicationError(
                        error,
                        {
                            source:
                                "Startup",

                            operation:
                                "GetUserAccessFromAzure"
                        },
                        this.processGetApplicationErrorCommunication()
                    );

                    return;

                }
                finally {

                    // ========================================
                    // Defensive Startup Azure Network Deadline
                    // Cleanup
                    //
                    // Already cleared on the success path above.
                    // Clearing an already-cleared or already-fired
                    // timer is harmless - this covers every other
                    // exit (ordinary failure, timeout, early
                    // return) from the startup Azure network phase.
                    // ========================================

                    window.clearTimeout(
                        startupRequestTimeout
                    );

                    this.processProcessingOverlay(
                        false
                    );

                    this.routeInProgress =
                        false;

                }

            }

            // ========================================
            // Fatal Error - Exit Update View
            // ========================================

            if (
                this.pcfModeViewType ===
                    "Error"
            ) {

                return;

            }

            // ========================================
            // Change Detection
            // ========================================

            // Route 1 - Empty
            if (
                this.pcfModeViewIndex === -1
            ) {

                this.route =
                    1;

            }

            // Route 2 - View Change
            else if (
                context.updatedProperties.includes(
                    "PCFModeViewIndex"
                )
            ) {

                this.pcfModeViewIndex =
                context.parameters.PCFModeViewIndex.raw ??
                0;

                if (
                    this.pcfModeViewIndex !==
                        this.previousPCFModeViewIndex
                ) {

                    this.route =
                        2;

                }
                else {

                    // Property tickled but value did not meaningfully change
                    this.route =
                        999;

                }

            }

            // Route 3 - View Info Change
            else if (
                context.updatedProperties.includes(
                    "PCFModeViewInfoJson"
                )
            ) {
                
                this.pcfModeViewInfoJson =
                context.parameters.PCFModeViewInfoJson.raw ??
                "";

                if (
                    this.pcfModeViewInfoJson !==
                        this.previousPCFModeViewInfoJson
                ) {

                    this.route =
                        3;

                }
                else {

                    // Property tickled but value did not meaningfully change
                    this.route =
                        999;

                }

            }

            // Route 4 - View Incoming Payload Change
            else if (
                context.updatedProperties.includes(
                    "PCFModeIncomingPayloadJson"
                ) ||
                !this.pcfModeIncomingPayloadJson
            ) {

                this.pcfModeIncomingPayloadJson =
                    context.parameters.PCFModeIncomingPayloadJson.raw ??
                    "";

                if (
                    this.pcfModeIncomingPayloadJson !==
                        this.previousPCFModeIncomingPayloadJson
                ) {

                    const incomingPayload =
                        JSON.parse(
                            this.pcfModeIncomingPayloadJson
                        );

                    incomingPayload.PayloadToPCFType =
                        String(
                            incomingPayload.PayloadToPCFType ?? ""
                        ).split("|")[0];

                    this.pcfModeIncomingPayloadJson =
                        JSON.stringify(
                            incomingPayload
                        );
                    
                    // ========================================
                    // Process Incoming Payload
                    // ========================================

                    this.processIncomingPayload();

                    // ========================================
                    // Route Incoming Payload By Group
                    // ========================================

                    switch (
                        this.payloadGroup
                    ) {

                        // ========================================
                        // System
                        // ========================================

                        case "System":

                            // Existing Reset / Mode Change / Retry / Status routing
                            if (
                                this.payloadType ===
                                    "Reset"
                            ) {

                                this.route =
                                    998;

                            }
                            else if (
                                this.payloadType ===
                                    "Mode Change"
                            ) {

                                this.route =
                                    996;

                            }
                            else if (
                                this.payloadType.startsWith(
                                    "Retry"
                                )
                            ) {

                                this.route =
                                    997;

                            }
                            else if (
                                this.payloadType.startsWith(
                                    "Status-200"
                                )
                            ) {

                                this.route =
                                    200;

                            }
                            else if (
                                this.payloadType.startsWith(
                                    "Status-400"
                                )
                            ) {

                                this.route =
                                    400;

                            }else {

                                throw new Error(
                                    `[ProjectDashboard] Unsupported System Payload Type: ${this.payloadType}`
                                );

                            }

                            break;

                        // ========================================
                        // Data
                        // ========================================

                        case "Data": {

                            // ========================================
                            // Route To slot router
                            // ========================================

                            this.route = 4;

                            break;

                        }

                        // ========================================
                        // UI-Only
                        // ========================================

                        case "UI-Only":

                            switch (
                                this.payloadType
                            ) {

                                // ========================================
                                // Open
                                // ========================================

                                case "Open":

                                    // Settings routing
                                    this.route =4;

                                    break;

                                // ========================================
                                // Close
                                // ========================================

                                case "Close":

                                    // Settings routing
                                    this.route =4;

                                    break;

                                // ========================================
                                // Add
                                // ========================================

                                case "Add":

                                    // Add routing
                                    this.route = 4;

                                    break;


                                // ========================================
                                // Cancel
                                // ========================================

                                case "Cancel":

                                    // Cancel routing
                                    this.route = 4;

                                    break;


                                // ========================================
                                // Unknown UI-Only Type
                                // ========================================

                                default:

                                    throw new Error(
                                        `[ProjectDashboard] Unsupported UI-Only Payload Type: ${this.payloadType}`
                                    );

                            }

                            break;

                        // ========================================
                        // Unknown
                        // ========================================

                        default:

                            throw new Error(
                                `[ProjectDashboard] Unsupported Payload Group: ${this.payloadGroup}`
                            );

                    }

                }
                else {

                    // Incoming property tickled but payload did not actually change.

                    this.route =
                        999;

                }

            }

            // SOON TO BE DEPRECATED - Route 5 - View Incoming status Change
            else if (
                context.updatedProperties.includes(
                    "PCFModeIncomingStatus"
                )
            ) {

                this.pcfModeIncomingStatus =
                context.parameters.PCFModeIncomingStatus.raw ??
                0;

                if (
                    this.pcfModeIncomingStatus !==
                        this.previousPCFModeIncomingStatus
                ) {

                    this.route =
                        5;

                }
                else {

                    // Property tickled but value did not meaningfully change
                    this.route =
                        999;

                }

            }

            // Route 6 - Outbound change
            else if (
                context.updatedProperties.includes(
                    "PCFModeOutgoingPayloadJson"
                )
            ) {

                console.log(
                    "[ProjectDashboard] ENTER Route 6 Outbound"
                );

                this.pcfModeOutgoingPayloadJson =
                    context.parameters.PCFModeOutgoingPayloadJson.raw ??
                    "";

                if (
                    this.pcfModeOutgoingPayloadJson !==
                        this.previousPCFModeOutgoingPayloadJson
                ) {

                    const outgoingPayload =
                        JSON.parse(
                            this.pcfModeOutgoingPayloadJson
                        );

                    console.log(
                        "[ProjectDashboard] Outgoing Parsed:",
                        {
                            PayloadToPAType:
                                outgoingPayload.PayloadToPAType,

                            PayloadToPASubMode:
                                outgoingPayload.PayloadToPAMode
                        }
                    );

                    if (
                        outgoingPayload.PayloadToPAType === "Request" &&
                        outgoingPayload.PayloadToPAMode === "Data"
                    ) {

                        // ========================================
                        // Send Status 400
                        // ========================================

                        this.processDispatchPCFModeEvent(
                            "PCFModeEventSendStatus400"
                        );

                        // Let route remain 0.

                    }
                    else {

                        this.route =
                            999;

                    }

                }
                else {

                    // Property tickled but value did not meaningfully change.
                    this.route =
                        999;

                }


            }

        }

        console.log(
            "Middle Past Checks - Route: ",
            this.route
        );


        // ============================================
        // Checkpoints cleared
        // Mission control assumes ownership
        // ============================================

        // ============================================
        // Update View Routing
        // ============================================
        //
        // Route 0 = No meaningful change
        // Route 1 = Board Change
        // Route 2 = View Change
        // Route 3 = View Info Change
        //

        switch (this.route) {

            case 0:

                //Silent landing for routes that loop
                break;

            // Open
            case 1:

                this.routeInProgress = true

                console.log(
                    "Router Path 1 - Route: ",
                    this.route
                );

                // =====================================================
                // Complete Route
                // =====================================================
                
                this.routeStatus = 200;
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // View Change
            case 2:

                this.routeInProgress = true

                if (
                    this.pcfModeViewIndex >
                        0
                    &&
                    this.pcfModeViewIndex <
                        100
                ) {

                    this.tempPcfModeViewIndex =
                        0;

                }

                // =====================================================
                // Store View Index
                // =====================================================

                this.previousPCFModeViewIndex =
                    this.pcfModeViewIndex;

                console.log(
                    "[ProjectDashboard] Route 2 - Temp View Index:",
                    this.tempPcfModeViewIndex
                );

                // =====================================================
                // Complete Route
                // =====================================================

                this.routeStatus = 200;
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // View Info Change
            case 3:
                
                this.routeInProgress = true

                console.log(
                    "Router Path 3 - Route: ",
                    this.route
                );

                console.log(
                    "[ProjectDashboard] Route 3 Check:",
                    {
                        raw:
                            context.parameters.PCFModeViewInfoJson.raw,

                        snapshot:
                            this.previousPCFModeViewInfoJson,

                        equal:
                            context.parameters.PCFModeViewInfoJson.raw ===
                            this.previousPCFModeViewInfoJson
                    }
                );

                // Route 3 work

                this.previousPCFModeViewInfoJson =
                this.pcfModeViewInfoJson;

                // =====================================================
                // Complete Route
                // =====================================================

                this.routeStatus = 200;
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;
            
            // =====================================================
            // Route 4 - Incoming Payload Change
            // =====================================================

            case 4: {

                this.routeInProgress =
                    true;

                console.log(
                    "Router Path 4 - Route:",
                    this.route
                );

                const statusHandled =
                    false;

                try {

                    // =====================================================
                    // Incoming Payload Router
                    // =====================================================

                    switch (
                        this.payloadType
                    ) {

                        // =================================================
                        // Save
                        // =================================================

                        case "Save":

                            // Save-specific routing will go here later.

                            break;


                        // =================================================
                        // Normal Runtime
                        // Route By Dashboard Slot
                        // =================================================

                        default:
                            
                        {

                            // =====================================================
                            // Check User Dashboard Access
                            // =====================================================

                            const selectedDashboard =
                                this.currentUserProfile!
                                    .defaultDashboardTabConfig
                                    .find(
                                        tab =>
                                            tab.slot ===
                                                this.payloadViewIndex
                                    )
                                    ?.dashboardId ??
                                    "";

                            const userHasAccess =
                                selectedDashboard ===
                                    "Overview"
                                    ? true
                                    : this.processCheckUserAccess(
                                        `open-${selectedDashboard}`
                                    );

                            if (
                                !userHasAccess
                            ) {

                                buildNotificationOverlay(
                                    this.ctrMain,
                                    "Access Denied",
                                    "You do not have permission to open this dashboard.",
                                    "CloseOnly"
                                );

                                // ========================================================
                                // Restore Previous Dashboard Tab Selection
                                // ========================================================

                                this.ctrMain
                                    .querySelector(
                                        ".project-dashboard-tabs-tab-selected"
                                    )
                                    ?.classList.remove(
                                        "project-dashboard-tabs-tab-selected"
                                    );

                                const previousDashboardTab =
                                    this.ctrMain.querySelector<HTMLElement>(
                                        `[data-tab-index="${this.previousPCFModeViewIndex}"]`
                                    );

                                previousDashboardTab?.classList.add(
                                    "project-dashboard-tabs-tab-selected"
                                );

                                previousDashboardTab?.focus();

                                return;

                            }

                            // =====================================================
                            // Reset to visible
                            // =====================================================

                            this.ctrDashboard.classList.remove(
                                "application-hidden"
                            );

                            this.ctrUploadVersion.classList.add(
                                "application-hidden"
                            );

                            this.ctrMessages.classList.add(
                                "application-hidden"
                            );

                            // =====================================================
                            // Validate Requested Dashboard Slot
                            // =====================================================

                            if (
                                this.payloadViewIndex <
                                    0 ||
                                this.payloadViewIndex >
                                    9
                            ) {

                                throw new Error(
                                    `[ProjectDashboard] Invalid Dashboard Slot Index: ${this.payloadViewIndex}`
                                );

                            }

                            // =====================================================
                            // Dashboard Slot UI Routing
                            // =====================================================

                            this.processProcessingOverlay(
                                true,
                                "Loading dashboard...",
                                "Progress",
                                0
                            );

                            try {

                                // ========================================
                                // Check Active State
                                // ========================================

                                this.processProcessingOverlay(
                                    null,
                                    "Checking application state...",
                                    "Progress",
                                    5
                                );

                                const activeStateIsReady =
                                    await this.processCheckActiveState();

                                switch (
                                    activeStateIsReady
                                ) {

                                    // ========================================
                                    // Active State Is Not Ready
                                    // ========================================

                                    case false: {

                                        this.processProcessingOverlay(
                                            null,
                                            "Preparing application state...",
                                            "Progress",
                                            25
                                        );

                                        await this.processBuildActiveState(
                                            "New",
                                            true
                                        );

                                        this.processDispatchPCFModeEvent(
                                            "PCFModeEventSendStatus200"
                                        );

                                        return;

                                    }

                                    // ========================================
                                    // Active State Is Ready
                                    // ========================================

                                    case true: {

                                        // =====================================================
                                        // Enable Dashboard Tabs
                                        // =====================================================

                                        this.processBuildUserTabs(
                                            "Build",
                                            this.payloadViewIndex,
                                            true
                                        );

                                        // ========================================
                                        // Check Customer Change ETag
                                        // ========================================

                                        this.processProcessingOverlay(
                                            null,
                                            "Checking for changes...",
                                            "Progress",
                                            45
                                        );

                                        const customerEtagStatus =
                                            await this.processCheckCustomerEtag();

                                        if (
                                            customerEtagStatus.changed
                                        ) {

                                            this.processProcessingOverlay(
                                                null,
                                                "Synchronizing registries...",
                                                "Progress",
                                                48
                                            );

                                            try {

                                                await this.processRefreshCustomerRegistries();

                                                await this.artifactStore.put(
                                                    "system:etagStatus",
                                                    new TextEncoder().encode(
                                                        customerEtagStatus.remoteEtag!
                                                    ).buffer
                                                );

                                                console.log(
                                                    "[ProjectDashboard] ETAG SYNCHRONIZATION COMPLETE",
                                                    {
                                                        synchronizedEtag:
                                                            customerEtagStatus.remoteEtag
                                                    }
                                                );

                                            }
                                            catch (
                                                error
                                            ) {

                                                console.error(
                                                    "[ProjectDashboard] ETAG SYNCHRONIZATION FAILED",
                                                    {
                                                        remoteEtag:
                                                            customerEtagStatus.remoteEtag
                                                    }
                                                );

                                                throw error;

                                            }

                                        }

                                        // ========================================
                                        // Check Registry Keys
                                        // ========================================

                                        this.processProcessingOverlay(
                                            null,
                                            "Checking registries...",
                                            "Progress",
                                            50
                                        );

                                        const registryKeysAreReady =
                                            await this.processCheckRegistryKeys();

                                        if (
                                            !registryKeysAreReady
                                        ) {

                                            this.processProcessingOverlay(
                                                null,
                                                "Updating registries...",
                                                "Progress",
                                                65
                                            );

                                            await this.processBuildRegistryKeys();

                                        }

                                        // ========================================
                                        // Check Data Stores
                                        // ========================================

                                        this.processProcessingOverlay(
                                            null,
                                            "Checking data stores...",
                                            "Progress",
                                            75
                                        );

                                        const dataStoresAreReady =
                                            this.processCheckDataStores();

                                        if (
                                            !dataStoresAreReady
                                        ) {

                                            this.processProcessingOverlay(
                                                null,
                                                "Building data stores...",
                                                "Progress",
                                                85
                                            );

                                            await this.processBuildDataStores();

                                        }

                                        // ========================================
                                        // Data Stores Exist Or Were Just Hydrated
                                        // So Let's Inspect
                                        // ========================================

                                        this.processProcessingOverlay(
                                            null,
                                            "Preparing dashboard data...",
                                            "Progress",
                                            95
                                        );

                                        console.log(
                                            "[ProjectDashboard] Resident Data Stores:",
                                            {
                                                plannedActivities: {
                                                    columns:
                                                        plannedActivityDataStores.size,

                                                    columnNames:
                                                        Array.from(
                                                            plannedActivityDataStores.keys()
                                                        )
                                                },

                                                currentActivities: {
                                                    columns:
                                                        currentActivityDataStores.size,

                                                    columnNames:
                                                        Array.from(
                                                            currentActivityDataStores.keys()
                                                        )
                                                },

                                                plannedResources: {
                                                    columns:
                                                        plannedResourceDataStores.size,

                                                    columnNames:
                                                        Array.from(
                                                            plannedResourceDataStores.keys()
                                                        )
                                                },

                                                currentResources: {
                                                    columns:
                                                        currentResourceDataStores.size,

                                                    columnNames:
                                                        Array.from(
                                                            currentResourceDataStores.keys()
                                                        )
                                                }
                                            }
                                        );

                                        break;

                                    }

                                }


                                // =====================================================
                                // Application Terminal Gate
                                //
                                // Route preparation above was awaited. A terminated
                                // instance must not enter dashboard build / selective
                                // cleanup, which owns shared dashboard module state.
                                // =====================================================

                                if (
                                    this.applicationTerminated
                                ) {

                                    return;

                                }


                                // =====================================================
                                // Route To Requested Dashboard Slot
                                // =====================================================

                                this.processProcessingOverlay(
                                    null,
                                    "Loading dashboard...",
                                    "Progress",
                                    99
                                );

                                switch (
                                    this.payloadViewIndex
                                ) {

                                    case 0:

                                        this.ctrDashboardSlotZero.replaceChildren(
                                            buildDashboardOne().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotZero.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 1:

                                        this.ctrDashboardSlotOne.replaceChildren(
                                            buildDashboardTwo().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotOne.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 2:

                                        this.ctrDashboardSlotTwo.replaceChildren(
                                            buildDashboardThree().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotTwo.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 3:

                                        this.ctrDashboardSlotThree.replaceChildren(
                                            buildDashboardFour().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotThree.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 4:

                                        this.ctrDashboardSlotFour.replaceChildren(
                                            buildDashboardFive().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotFour.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 5:

                                        this.ctrDashboardSlotFive.replaceChildren(
                                            buildDashboardSix().Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotFive.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;

                                    case 6:

                                        this.showMessage(
                                            true,
                                            "Dashboard Unavailable.",
                                            undefined,
                                            false
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotSix.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;
                                        
                                        break;

                                    case 7:

                                        this.showMessage(
                                            true,
                                            "Dashboard Unavailable.",
                                            undefined,
                                            false
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotSeven.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;

                                    case 8:

                                        this.showMessage(
                                            true,
                                            "Dashboard Unavailable.",
                                            undefined,
                                            false
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotEight.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;
                                        break;

                                    case 9:
                                        
                                        this.ctrDashboardSlotNine.replaceChildren(
                                            buildDashboardTen(
                                                this.customerMasterRegistry,
                                                this.activeState,
                                                "LocationLevelOne",
                                                this.processGetArtifact.bind(
                                                    this
                                                ),
                                                this.processGetLocationPlacesRegistry.bind(
                                                    this
                                                ),
                                                this.showMessage.bind(
                                                    this
                                                ),
                                                this.ctrMain,
                                                this.processDashboardSpecialMode.bind(
                                                    this
                                                ),
                                                this.processProcessingOverlay.bind(this)
                                            ).Dashboard!
                                        );

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotNine.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;

                                        this.processHidePreviousDashboardSlot();

                                        this.ctrDashboardSlotNine.classList.remove(
                                            "application-hidden"
                                        );

                                        this.previousPCFModeViewIndex =
                                            this.payloadViewIndex;

                                        break;


                                    case 200:

                                        this.processDispatchPCFModeEvent(
                                            "PCFModeEventSendStatus200"
                                        );

                                        break;


                                    case 400:

                                        // existing request-data logic

                                        break;


                                    default: 
                                    {

                                        // =====================================================
                                        // Disable Dashboard Tabs
                                        // =====================================================

                                        this.processBuildUserTabs(
                                            "Build",
                                            0,
                                            false
                                        );

                                        throw new Error(
                                            `[ProjectDashboard] Unsupported Dashboard Slot: ${this.payloadViewIndex}`
                                        );

                                    }

                                }


                            }
                            finally {

                                this.processProcessingOverlay(
                                    false
                                );

                            }

                            break;

                        }

                    }

                    // =====================================================
                    // Common Success Status
                    // =====================================================

                    if (
                        !statusHandled
                    ) {

                        this.processDispatchPCFModeEvent(
                            "PCFModeEventSendStatus200"
                        );

                        this.routeStatus =
                            200;

                    }

                }
                catch (
                    error
                ) {

                    console.error(
                        "[ProjectDashboard] Incoming payload processing failed:",
                        error
                    );


                    // =====================================================
                    // Common Failure Status
                    // =====================================================

                    if (
                        !statusHandled
                    ) {

                        this.showMessage(
                            true,
                            "Unable to process dashboard request.",
                            undefined,
                            false
                        );

                        this.processDispatchPCFModeEvent(
                            "PCFModeEventSendStatus400"
                        );

                        this.routeStatus =
                            400;

                    }

                }


                // =====================================================
                // Snapshot Incoming Payload
                // =====================================================

                this.previousPCFModeIncomingPayloadJson =
                    this.pcfModeIncomingPayloadJson;


                // =====================================================
                // Complete Route
                // =====================================================

                this.route =
                    0;

                this.routeInProgress =
                    false;

                this.routeHasCompleted =
                    true;

                break;

            }

            // Status-200 - Incoming status Change
            case 200:

                this.routeInProgress = true

                this.processIncomingPayload();

                console.log(
                    "[ProjectDashboard] Router Path 200 - Status 200:",
                    this.payloadType,
                    this.payloadMode,
                    this.payloadSubMode,
                    this.payloadSubModePath
                );

                switch (
                    this.payloadMode
                ) {

                    case "Update-Existing":

                        switch (
                            this.payloadSubMode
                        ) {

                            case "Task":

                                switch (
                                    this.payloadSubModePath
                                ) {

                                    case "Task-Lane-Position":

                                        break;

                                    default:

                                        throw new Error(
                                            `[ProjectDashboard] Unsupported Status-200 SubModePath: ${this.payloadSubModePath}`
                                        );

                                }

                                break;

                            default:

                                throw new Error(
                                    `[ProjectDashboard] Unsupported Status-200 SubMode: ${this.payloadSubMode}`
                                );

                        }

                        break;

                    default:

                        throw new Error(
                            `[ProjectDashboard] Unsupported Status-200 Mode: ${this.payloadMode}`
                        );

                }

                this.previousPCFModeIncomingPayloadJson =
                    this.pcfModeIncomingPayloadJson;

                // =================================================
                // Complete Route
                // =================================================

                //this.routeStatus = 200; // Set up higher
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // Status-400 - Incoming status Change
            case 400:
                
                this.processIncomingPayload();

                console.log(
                    "[ProjectDashboard] Router Path 400 - Status 400:",
                    this.payloadType,
                    this.payloadMode,
                    this.payloadSubMode,
                    this.payloadSubModePath
                );

                switch (
                    this.payloadMode
                ) {

                    case "Update-Existing":

                        switch (
                            this.payloadSubMode
                        ) {

                            case "Task":

                                switch (
                                    this.payloadSubModePath
                                ) {

                                    case "Task-Lane-Position":

                                        break;

                                    default:

                                        throw new Error(
                                            `[ProjectDashboard] Unsupported Status-400 SubModePath: ${this.payloadSubModePath}`
                                        );

                                }

                                break;

                            default:

                                throw new Error(
                                    `[ProjectDashboard] Unsupported Status-400 SubMode: ${this.payloadSubMode}`
                                );

                        }

                        break;

                    default:

                        throw new Error(
                            `[ProjectDashboard] Unsupported Status-200 Mode: ${this.payloadMode}`
                        );

                }

                this.previousPCFModeIncomingPayloadJson =
                    this.pcfModeIncomingPayloadJson;

                // =================================================
                // Complete Route
                // =================================================

                //this.routeStatus = 400; // Set up higher
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // =========================================================
            // Mode Change - System Route
            // =========================================================

            case 996:

                this.routeInProgress = true

                try {

                    const payload =
                        JSON.parse(
                            context.parameters.PCFModeIncomingPayloadJson.raw ??
                            "{}"
                        );

                    console.log(
                        "[ProjectDashboard] IN THE MATRIX",
                        {
                            NewMode:
                                payload.PayloadToPCFNewMode,

                            NewSubMode:
                                payload.PayloadToPCFNewSubMode,

                            NewSubModePath:
                                payload.PayloadToPCFNewSubModePath
                        }
                    );


                    // =====================================================
                    // Status 200
                    // =====================================================

                    this.processDispatchPCFModeEvent(
                        "PCFModeEventSendStatus200"
                    );

                    this.routeStatus =
                        200;

                }
                catch (
                    error
                ) {

                    console.error(
                        "[ProjectDashboard] Mode Change failed:",
                        error
                    );


                    // =====================================================
                    // Status 400
                    // =====================================================

                    this.processDispatchPCFModeEvent(
                        "PCFModeEventSendStatus400"
                    );

                    this.routeStatus =
                        400;

                }


                // =====================================================
                // Complete Route
                // =====================================================

                this.previousPCFModeIncomingPayloadJson =
                    context.parameters.PCFModeIncomingPayloadJson.raw ??
                    "";

                // =====================================================
                // Complete Route
                // =====================================================

                //this.routeStatus = 200; // Set further up
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // =========================================================
            // Retry / Recovery - System Route
            // =========================================================
            case 997:

                this.routeInProgress = true

                this.processIncomingPayload(
                    context.parameters.PCFModeIncomingPayloadJson.raw ?? ""
                );

                console.log(
                    "[ProjectDashboard] Router Path 997 - Retry / Recovery",
                    {
                        ActionMode:
                            this.payloadMode,

                        ActionSubMode:
                            this.payloadSubMode,

                        ActionSubModePath:
                            this.payloadSubModePath
                    }
                );

                // Now available:
                // this.payloadMode
                // this.payloadSubMode
                // this.payloadSubModePath
                // this.payloadDataOne
                // this.payloadDataTwo

                // =====================================================
                // Recovery Mode Router
                // =====================================================

                switch (
                    this.payloadMode
                ) {

                    // -------------------------------------------------
                    // Create New
                    // -------------------------------------------------

                    case "Create-New":

                        switch (
                            this.payloadSubMode
                        ) {

                            case "Task":

                                switch (
                                    this.payloadSubModePath
                                ) {

                                    // -----------------------------------------
                                    // Task Lane
                                    // -----------------------------------------

                                    case "Task-Lane":

                                        console.log(
                                            "[ProjectDashboard] Retry - Create-New / Task-Lane"
                                        );

                                        // -----------------------------------------
                                        // Request PA Rollback Retry
                                        // -----------------------------------------

                                        this.processDispatchPCFModeEvent(
                                            "PCFModeEventSendStatus400"
                                        );

                                        break;

                                    default:

                                        throw new Error(
                                            `[ProjectDashboard] Unsupported Retry SubModePath: ${this.payloadSubModePath}`
                                        );

                                }

                                break;

                            // -----------------------------------------
                            // Unsupported SubMode
                            // -----------------------------------------

                            default:

                                console.error(
                                    "[ProjectDashboard] Retry SubMode not found:",
                                    this.payloadSubMode
                                );

                                break;

                        }

                        break;

                    // -------------------------------------------------
                    // Unsupported Mode
                    // -------------------------------------------------

                    default:

                        console.error(
                            "[ProjectDashboard] Retry Mode not found:",
                            this.payloadMode
                        );

                        break;

                }


                // =====================================================
                // Complete Route
                // =====================================================

                this.routeStatus = 200;
                this.route = 0;
                this.routeInProgress = false
                this.routeHasCompleted = true

                break;

            // Reset - Dead End
            case 998:

                //this.pcfModeViewType = "";
                this.pcfModeViewInfoJson = "";
                this.pcfModeViewIndex = 0;
                //this.pcfModeViewContextJson = "";

                this.previousPCFModeViewType = "";
                this.previousPCFModeViewInfoJson = "";
                this.previousPCFModeViewIndex = 0;
                //this.previousPCFModeViewContextJson = "";

                this.taskBoardSystemId = "";
                this.taskBoardName = "";

                this.previousPCFModeIncomingPayloadJson = "";

                this.payloadMode = "";
                this.payloadSubMode = "";
                this.payloadSubModePath = "";
                this.payloadDataOne = null;
                this.payloadDataTwo = null;
                this.payloadDataThree = null;
                this.payloadDataFour = null;

                this.actionMode = "";

                this.showMessage(
                    true,
                    "Reset Mode.",
                    undefined,
                    false
                );

                this.route = 999999
                
                this.pcfModeViewType =
                        "Sleep";

                this.outputChangeType =
                    1;

                this.processNotifyOutputChanged();

                break;

            // Safe exit for certain workflows
            case 999:

                // =====================================================
                // Complete Route
                // =====================================================

                this.routeStatus = 200;
                this.route = 0;

                break;
            
            // Planned Echo router - Non notify
            case 888888:

                console.log(
                    "ProjectDashboard PCF - Route Echo | Reference:",
                    this.routeEchoSource,
                    "| Updated Properties:",
                    this.routeEchoUpdatedProperties
                );

                //this.routeStatus = 888888;

                break;

            // PCF goes to sleep
            case 999999:

                // =====================================================
                // Complete Route
                // =====================================================

                this.pcfModeViewType = "";
                this.routeStatus = 200;
                this.route = 0;

                break;

            default:

                throw new Error(
                    `[ProjectDashboard] Unexpected Router State | Route: ${this.route} | Status: ${this.routeStatus}`
                );

                break;

        }

        if (
            !this.routeHasCompleted
        ) {

            console.log(
                "End of UV - Route:",
                this.route,
                "| Status:",
                this.routeStatus,
                "| Routing Complete:",
                this.routeHasCompleted
            );

        }
        else {

            this.resizeContainer(
                context
            );

            console.log(
                "ProjectDashboard PCF - Happy Ending"
            );

        }

    }

    // =====================================================
    // Process Incoming Payload
    // =====================================================

    private processIncomingPayload(
        incomingPayloadJson:
            string = this.pcfModeIncomingPayloadJson
    ): void {

        // =====================================================
        // Enter Incoming Payload Processor
        // =====================================================

        console.log(
            "[ProjectDashboard] ENTER processIncomingPayload"
        );

        try {

            // =====================================================
            // Validate Incoming Payload
            // =====================================================

            if (
                !incomingPayloadJson
            ) {

                throw new Error(
                    "Incoming payload is missing"
                );

            }

            // =====================================================
            // Parse Incoming Payload
            // =====================================================

            const payload =
                JSON.parse(
                    incomingPayloadJson
                );

            // =====================================================
            // Validate Required Incoming Payload Properties
            // =====================================================

            if (
                payload.PayloadToPCFGroup === undefined ||
                payload.PayloadToPCFType === undefined ||
                payload.PayloadToPCFMode === undefined ||
                payload.PayloadToPCFSubMode === undefined ||
                payload.PayloadToPCFSubModePath === undefined ||
                payload.PayloadToPCFDataOne === undefined ||
                payload.PayloadToPCFDataTwo === undefined ||
                payload.PayloadToPCFDataThree === undefined ||
                payload.PayloadToPCFDataFour === undefined ||
                payload.PayloadToPCFDecodedArtifactData === undefined ||
                payload.PayloadToPCFViewIndex === undefined ||
                payload.PayloadToPCFViewContext === undefined ||
                payload.PayloadToPCFUserEmail === undefined
            ) {

                throw new Error(
                    "Incoming payload missing required properties"
                );

            }

            // =====================================================
            // Hydrate Incoming Payload Routing
            // =====================================================

            this.payloadGroup =
                payload.PayloadToPCFGroup;

            this.payloadType =
                payload.PayloadToPCFType;

            this.payloadMode =
                payload.PayloadToPCFMode;

            this.payloadSubMode =
                payload.PayloadToPCFSubMode;

            this.payloadSubModePath =
                payload.PayloadToPCFSubModePath;

            // =====================================================
            // Hydrate Incoming Payload User
            // =====================================================

            this.payloadUserEmail =
                payload.PayloadToPCFUserEmail;

            // =====================================================
            // Hydrate Incoming Payload Data
            // =====================================================

            this.payloadDataOne =
                payload.PayloadToPCFDataOne;

            this.payloadDataTwo =
                payload.PayloadToPCFDataTwo;

            this.payloadDataThree =
                payload.PayloadToPCFDataThree;

            this.payloadDataFour =
                payload.PayloadToPCFDataFour;

            // =====================================================
            // Hydrate Incoming View State
            // =====================================================

            this.payloadViewIndex =
                payload.PayloadToPCFViewIndex;

            this.payloadViewContext =
                payload.PayloadToPCFViewContext;

            // =====================================================
            // Hydrate Artifact Values
            // =====================================================

            this.payloadDecodedArtifactData =
                payload.PayloadToPCFDecodedArtifactData;

            // =====================================================
            // Inspect Hydrated Routing Values
            // =====================================================

            console.log(
                "[ProjectDashboard] Incoming Payload Context:",
                {
                    Type:
                        this.payloadType,

                    Mode:
                        this.payloadMode,

                    SubMode:
                        this.payloadSubMode,

                    SubModePath:
                        this.payloadSubModePath,

                    UserEmail:
                        this.payloadUserEmail,

                    ViewIndex:
                        this.payloadViewIndex,

                    ViewContext:
                        this.payloadViewContext,

                    DecodedArtifactData:
                        this.payloadDecodedArtifactData
                }
            );

            // =====================================================
            // Hydrate Dashboard Slot User Config
            // =====================================================

            if (
                this.payloadViewContext
            ) {

                this.dashboardSlotUserConfig =
                    JSON.parse(
                        this.payloadViewContext
                    );

            }

            // =====================================================
            // Exit Incoming Payload Processor
            // =====================================================

            console.log(
                "[ProjectDashboard] EXIT processIncomingPayload"
            );

        }

        catch (
            error
        ) {

            // =====================================================
            // Processor Failure
            // =====================================================

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    );

            this.showMessage(
                true,
                "Unable to process incoming payload. Refresh your browser to try again.",
                `Incoming payload processing failed: ${errorMessage}`,
                true,
                "app-fatal"
            );

            return;

        }

    }

    // =====================================================
    // Payload Context
    // Preserve / Restore
    // =====================================================

    private processPayloadContext(
        action: "Set" | "Restore"
    ): void {

        switch (
            action
        ) {

            // ========================================
            // Preserve Current Payload Context
            // ========================================

            case "Set":

                this.previousPayloadType = this.payloadType;
                this.previousPayloadMode = this.payloadMode;
                this.previousPayloadSubMode = this.payloadSubMode;
                this.previousPayloadSubModePath = this.payloadSubModePath;
                this.previousPayloadDataOne = this.payloadDataOne;
                this.previousPayloadDataTwo = this.payloadDataTwo;
                this.previousPayloadDataThree = this.payloadDataThree;
                this.previousPayloadDataFour = this.payloadDataFour;
                this.previousPayloadViewIndex = this.payloadViewIndex;
                this.previousPayloadViewContext = this.payloadViewContext;
                this.previousPayloadDecodedArtifactData = this.payloadDecodedArtifactData;

                break;


            // ========================================
            // Restore Previous Payload Context
            // ========================================

            case "Restore":

                this.payloadType = this.previousPayloadType;
                this.payloadMode = this.previousPayloadMode;
                this.payloadSubMode = this.previousPayloadSubMode;
                this.payloadSubModePath = this.previousPayloadSubModePath;
                this.payloadDataOne = this.previousPayloadDataOne;
                this.payloadDataTwo = this.previousPayloadDataTwo;
                this.payloadDataThree = this.previousPayloadDataThree;
                this.payloadDataFour = this.previousPayloadDataFour;
                this.payloadViewIndex = this.previousPayloadViewIndex;
                this.payloadViewContext = this.previousPayloadViewContext;
                this.payloadDecodedArtifactData = this.previousPayloadDecodedArtifactData;

                break;


            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported Payload Context Action: ${action}`
                );

        }

    }

    // =====================================================
    // Process Restore Dashboard
    // =====================================================

    private processRestoreDashboardView(): void {

        const dashboardSlots = [
            this.ctrDashboardSlotZero,
            this.ctrDashboardSlotOne,
            this.ctrDashboardSlotTwo,
            this.ctrDashboardSlotThree,
            this.ctrDashboardSlotFour,
            this.ctrDashboardSlotFive,
            this.ctrDashboardSlotSix,
            this.ctrDashboardSlotSeven,
            this.ctrDashboardSlotEight,
            this.ctrDashboardSlotNine
        ];

        const dashboardSlot =
            dashboardSlots[
                this.payloadViewIndex
            ];

        if (
            dashboardSlot &&
            dashboardSlot.hasChildNodes()
        ) {

            this.ctrMessages.classList.add(
                "application-hidden"
            );

            this.ctrDashboard.classList.remove(
                "application-hidden"
            );

            dashboardSlot.classList.remove(
                "application-hidden"
            );

        }
        else {

            this.ctrDashboard.classList.add(
                "application-hidden"
            );

            this.ctrMessages.classList.remove(
                "application-hidden"
            );

        }

    }

    // =====================================================
    // Process Show Message
    // =====================================================

    private showMessage(
        show: boolean,
        message:
            string,
        errorMessage:
            string | undefined,
        disableRequired:
            boolean,
        disableMode?:
            "app-fatal",
        action?:
            ApplicationMessageAction
    ): void {

        // ========================================
        // Show Message
        // ========================================

        if (
            show
        ) {

            // ========================================
            // Log Error
            // ========================================

            if (
                errorMessage
            ) {

                console.error(
                    `[ProjectDashboard] ${errorMessage}`
                );

            }


            // ========================================
            // Disable Required
            // ========================================

            switch (
                disableRequired
            ) {

                // ========================================
                // Disable Not Required
                // ========================================

                case false: {

                    break;

                }


                // ========================================
                // Disable Required
                // ========================================

                case true: {

                    // ========================================
                    // Disable Mode
                    // ========================================

                    switch (
                        disableMode
                    ) {

                        // ========================================
                        // Application - All
                        // ========================================

                        case "app-fatal": {

                            //this.btnApplicationMenu.disabled =
                                //true;

                            this.btnApplicationSettings.disabled =
                                true;

                            this.btnApplicationUpload.disabled =
                                true;

                            //this.btnApplicationMenu.classList.add(
                                //"application-disabled"
                            //);

                            this.btnApplicationSettings.classList.add(
                                "application-disabled"
                            );

                            this.btnApplicationUpload.classList.add(
                                "application-disabled"
                            );

                            // ========================================
                            // Startup - Fatal Error
                            // ========================================

                            this.routeInProgress = false;

                            this.pcfModeViewType =
                                "Error";

                            this.previousPCFModeViewType =
                                this.pcfModeViewType;

                            break;

                        }

                    }

                    break;

                }

            }


            // ========================================
            // Unhide Messages
            // ========================================

            this.ctrMessages.classList.remove(
                "application-hidden"
            );


            // ========================================
            // Hide Dashboard
            // ========================================

            this.ctrDashboard.classList.add(
                "application-hidden"
            );


            // ========================================
            // Set Message
            // ========================================

            this.message.textContent =
                message;

            this.messageIcon.textContent =
                "⚠";


            // ========================================
            // Set Message Action
            //
            // No action supplied must leave the billboard
            // identical to today - hidden, disabled, and with no
            // callback a stale click could invoke.
            // ========================================

            if (
                action
            ) {

                this.btnMessageAction.textContent =
                    action.label;

                this.messageActionCallback =
                    action.processAction;

                this.btnMessageAction.disabled =
                    false;

                this.btnMessageAction.classList.remove(
                    "application-hidden"
                );

            }
            else {

                this.messageActionCallback =
                    null;

                this.btnMessageAction.disabled =
                    true;

                this.btnMessageAction.classList.add(
                    "application-hidden"
                );

                this.btnMessageAction.textContent =
                    "";

            }

        }

        // ========================================
        // Hide Message
        // ========================================

        else {

            // ========================================
            // Hide Messages
            // ========================================

            this.ctrMessages.classList.add(
                "application-hidden"
            );


            // ========================================
            // Unhide Dashboard
            // ========================================

            this.ctrDashboard.classList.remove(
                "application-hidden"
            );


            // ========================================
            // Clear Message
            // ========================================

            this.message.textContent =
                "";


            // ========================================
            // Clear Message Action
            //
            // No stale billboard action may survive a hide/show
            // cycle.
            // ========================================

            this.messageActionCallback =
                null;

            this.btnMessageAction.disabled =
                true;

            this.btnMessageAction.classList.add(
                "application-hidden"
            );

            this.btnMessageAction.textContent =
                "";

        }

    }

    // =====================================================
    // Process Get Application Error Communication
    //
    // Single Application Error Handler - Pass 2.
    //
    // The application-layer communication adapter processApplicationError's
    // Stage 4 display router invokes. helpers/errors.ts never
    // knows showMessage is a private ProjectDashboard method or
    // that buildNotificationOverlay needs a DOM container - both
    // details stay here, closed over rather than exposed through
    // the communication contract. No duplicated showMessage/
    // buildNotificationOverlay logic - both existing mechanisms
    // are called exactly as they already are elsewhere.
    //
    // Not yet called anywhere - no current caller passes a
    // communication dependency to processApplicationError. Pass 3
    // (Startup migration) is expected to be its first real
    // consumer.
    // =====================================================

    private processGetApplicationErrorCommunication(): ApplicationErrorCommunication {

        return {

            showMessage:
                this.showMessage.bind(
                    this
                ),

            showNotification:
                (
                    title,
                    message
                ) => {

                    buildNotificationOverlay(
                        this.ctrMain,
                        title,
                        message,
                        "OkOnly"
                    );

                }

        };

    }

    // =====================================================
    // Process Hide Previous
    // =====================================================

    private processHidePreviousDashboardSlot(): void {

        // =====================================================
        // Current Slot Is Already Previous Slot
        // Nothing To Hide
        // Also Allows First-Time Entry To Pass
        // =====================================================

        if (
            this.previousPCFModeViewIndex ===
                this.payloadViewIndex
        ) {

            return;

        }

        // =====================================================
        // Resolve Previous Dashboard Slot
        // =====================================================

        const previousDashboardSlot =
            [
                this.ctrDashboardSlotZero,
                this.ctrDashboardSlotOne,
                this.ctrDashboardSlotTwo,
                this.ctrDashboardSlotThree,
                this.ctrDashboardSlotFour,
                this.ctrDashboardSlotFive,
                this.ctrDashboardSlotSix,
                this.ctrDashboardSlotSeven,
                this.ctrDashboardSlotEight,
                this.ctrDashboardSlotNine
            ][
                this.previousPCFModeViewIndex
            ];

        // =====================================================
        // Kill Previous Dashboard-Specific State
        // =====================================================

        switch (
            this.previousPCFModeViewIndex
        ) {

            // =================================================
            // Dashboard One
            // =================================================

            case 0:

                // Dashboard One-specific data store cleanup
                // goes here.
                processKillDashboardOne();

                break;

            // =================================================
            // Dashboard Two
            // =================================================

            case 1:

                break;

            // =================================================
            // Dashboard Three
            // =================================================

            case 2:

                break;

            // =================================================
            // Dashboard Four
            // =================================================

            case 3:

                break;

            // =================================================
            // Dashboard Five
            // =================================================

            case 4:

                break;

            // =================================================
            // Dashboard Six
            // =================================================

            case 5:

                break;

            // =================================================
            // Reserved Dashboard Slots
            // =================================================

            case 6:
                break;
            case 7:
                break;
            case 8:
                break;
            // =================================================
            // Dashboard Ten
            // =================================================

            case 9:

                processKillDashboardTen();

                break;

            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported previous dashboard slot: ${this.previousPCFModeViewIndex}`
                );

        }

        // =====================================================
        // Hide Previous Dashboard Slot
        // =====================================================

        previousDashboardSlot.classList.add(
            "application-hidden"
        );

        // =====================================================
        // Kill Previous Dashboard DOM
        // =====================================================

        previousDashboardSlot.replaceChildren();

    }

    // =====================================================
    // Process Search
    // =====================================================

    private processSearch(
        searchValue: string
    ): void {

        console.log(
            "[ProjectDashboard] Task Search:",
            searchValue
        );

    }

    // =====================================================
    // Process Element disabled
    // =====================================================

    private processElementDisabled(
        targetType: string,
    ): void {

        switch (
            targetType
        ) {

            // -----------------------------------------
            // Task Search
            // -----------------------------------------

            case "Dashboard-Search":

                if (
                    this.ctrDashboard.querySelectorAll(
                        ".project-dashboard-task-card"
                    ).length ===
                        0
                ) {

                    this.txtTaskSearch.classList.add(
                        "application-disabled"
                    );

                    this.txtTaskSearch.disabled =
                        true;

                    this.btnTaskSearchClear.classList.add(
                        "application-disabled"
                    );

                    this.btnTaskSearchClear.disabled =
                        true;

                }
                else {

                    this.txtTaskSearch.classList.remove(
                        "application-disabled"
                    );

                    this.txtTaskSearch.disabled =
                        false;

                    this.btnTaskSearchClear.classList.remove(
                        "application-disabled"
                    );

                    this.btnTaskSearchClear.disabled =
                        false;

                }

                break;

            // -----------------------------------------
            // Unsupported Target
            // -----------------------------------------

            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported disabled target: ${targetType}`
                );

        }

    }


    // =====================================================
    // Fetch Authoritative Application Registry Artifact
    //
    // Application Version Gate.
    //
    // Live, direct-from-Azure retrieval - intentionally bypasses
    // processGetArtifact's cache-first behavior, since a version
    // decision must see the true remote Application Registry,
    // never a locally cached copy that may be stale. Shared by
    // Startup (which wraps this call with its own network
    // deadline / error messaging) and processCheckApplicationVersion
    // (used whenever a caller has not already supplied a
    // pre-fetched registry). Returns undefined on a missing
    // artifact rather than validating/messaging - that remains
    // each caller's own responsibility, matching the differing
    // failure conventions already established at each call site.
    // =====================================================

    private async processFetchAuthoritativeApplicationRegistryArtifact(
        signal?:
            AbortSignal
    ): Promise<ArrayBuffer | undefined> {

        const applicationRegistryPackage =
            await getArtifactsFromAzure(
                "Other",
                [
                    "app/app_registry.json"
                ],
                signal
            );

        const applicationRegistryArtifacts =
            splitAzureArtifactPackage(
                applicationRegistryPackage
            );

        return applicationRegistryArtifacts.get(
            "other:app/app_registry.json"
        );

    }


    // =====================================================
    // Invalidate Local Application Cache
    //
    // Application Version Gate.
    //
    // The existing mandatory update/rebuild/cache-invalidation
    // lifecycle - every committed IndexedDB artifact is removed,
    // then Temp is cleared entirely. Extracted so the Restart
    // Required outcome below reuses exactly this lifecycle rather
    // than a second invalidation mechanism. Startup's own inline
    // copy of this same lifecycle is untouched in this stage -
    // see the Application Version Gate implementation report.
    // =====================================================

    private async processInvalidateLocalApplicationCache(): Promise<void> {

        const indexedDbKeys =
            await this.artifactStore.getKeysByPrefix(
                ""
            );

        for (
            const key of
                indexedDbKeys
        ) {

            await this.artifactStore.delete(
                key
            );

        }

        this.processClearIndexDbTemp(
            "All",
            []
        );

    }


    // =====================================================
    // Accept Application Version
    //
    // Application Version Gate.
    //
    // system:localVersion is an acceptance marker, not a
    // discovery cache - writing it is a deliberate, separate step
    // owned by whichever caller has actually confirmed its own
    // success (Startup, for now). Neither
    // processCheckApplicationVersion nor
    // processInvalidateLocalApplicationCache write this key
    // themselves - see the Application Version Gate
    // implementation report.
    // =====================================================

    private async processAcceptApplicationVersion(
        currentVersion:
            number
    ): Promise<void> {

        await this.artifactStore.put(
            "system:localVersion",
            new TextEncoder().encode(
                String(
                    currentVersion
                )
            ).buffer
        );

    }


    // =====================================================
    // Resolve Application Version Info
    //
    // Application Registry V3 - versionInfo[] Refactor.
    //
    // versionInfo is intentionally an array, but historical-entry
    // selection semantics are NOT yet defined - that belongs to
    // the future Restart/Update workflow refactor. Exactly one
    // entry is supplied today, so this is a temporary, explicit
    // "entry 0" selection - kept in one shared place rather than
    // duplicated at each of its two current call sites
    // (processCheckApplicationVersion, processRestartApplication).
    // =====================================================

    private processResolveApplicationVersionInfo(
        registry:
            ApplicationRegistry
    ): ApplicationVersionInfo {

        return registry.versionInfo[0];

    }


    // =====================================================
    // Process Check Application Version
    //
    // Application Version Gate.
    //
    // A pure checker - safe to call from any application boundary
    // without destroying local state merely because it was asked.
    // It never invalidates, never rebuilds, and never writes
    // system:localVersion itself. Restart Required is a status a
    // caller must act on deliberately - see
    // processMountApplicationRestartRequired and
    // processRestartApplication for where invalidation/rebuild
    // now actually happen, behind an explicit user action.
    //
    // Locked evaluation order:
    //   1. appStatus === "Shutdown" -> "Shutdown" (fatal, stop)
    //   2. system:localVersion missing -> "No Local Version"
    //   3. system:localVersion === versionInfo.current -> "Pass" (silent)
    //   4. localVersion < versionInfo.required -> "Restart Required"
    //   5. otherwise -> "Update Available" (usable, localVersion
    //      unchanged)
    //
    // Startup Architecture - Pass 3.1 (Version Comparison). Step 2
    // no longer consults getKeysByPrefix("") - Startup now persists
    // user:current / user:current_profile (User Access First)
    // before this gate ever runs, so a nonempty store no longer
    // implies a prior version was ever accepted. "No Local Version"
    // is reported as-is; Startup does not yet act on it - see the
    // Startup Application Version Gate section for the deferred
    // handling location.
    //
    // versionInfo.required is never evaluated for status selection
    // until step 3 has already found a difference - matching the
    // locked "only now evaluate required" rule.
    //
    // Application Registry V3 - versionInfo[] Refactor. required/
    // current now come from the resolved ApplicationVersionInfo
    // entry (see processResolveApplicationVersionInfo) rather than
    // the retired root-level requiredVersion/currentVersion fields.
    // Comparison semantics are unchanged - only their source moved.
    //
    // Accepts an optional pre-fetched/decoded Application
    // Registry so a caller that already owns its own authoritative
    // acquisition (Startup) can supply it directly rather than
    // triggering a second live fetch here.
    // =====================================================

    private async processCheckApplicationVersion(
        applicationRegistry?:
            ApplicationRegistry
    ): Promise<ApplicationVersionStatus> {

        // =====================================================
        // 1 - Acquire Authoritative Application Registry
        // =====================================================

        let registry:
            ApplicationRegistry;

        if (
            applicationRegistry
        ) {

            registry =
                applicationRegistry;

        }
        else {

            const applicationRegistryArtifact =
                await this.processFetchAuthoritativeApplicationRegistryArtifact();

            if (
                !applicationRegistryArtifact
            ) {

                throw new Error(
                    "[ProjectDashboard] Application Version Gate: Application Registry was not returned."
                );

            }

            registry =
                JSON.parse(
                    new TextDecoder().decode(
                        new Uint8Array(
                            applicationRegistryArtifact
                        )
                    )
                ) as ApplicationRegistry;

        }

        this.applicationRegistry =
            registry;


        // =====================================================
        // 2 - appStatus First
        // =====================================================

        if (
            registry.appStatus ===
                "Shutdown"
        ) {

            this.showMessage(
                true,
                "Project Dashboard - Application is unavailable. Contact your administrator for more information.",
                "Application status is Shutdown.",
                true,
                "app-fatal"
            );

            return "Shutdown";

        }


        // =====================================================
        // 2.1 - Resolve Application Version Info
        //
        // Application Registry V3 - versionInfo[] Refactor.
        // =====================================================

        const versionInfo =
            this.processResolveApplicationVersionInfo(
                registry
            );


        // =====================================================
        // 3 - Read Local Version Authority
        // =====================================================

        const localVersionArtifact =
            await this.artifactStore.get(
                "system:localVersion"
            );

        const localVersion =
            localVersionArtifact
                ? Number(
                    new TextDecoder().decode(
                        new Uint8Array(
                            localVersionArtifact
                        )
                    )
                )
                : null;


        // =====================================================
        // 4 - No Local Version Established Yet
        //
        // system:localVersion is the only local-cache version
        // authority now - the retired system:requiredVersion key
        // is never read here. Startup Architecture - Pass 3.1
        // (Version Comparison): no longer inferred from
        // getKeysByPrefix("") - User Session (user:current /
        // user:current_profile) is now intentionally persisted
        // before this gate runs, so a nonempty store no longer
        // means a prior version was ever accepted. Reported
        // directly as its own status; this function does not
        // invalidate or write system:localVersion here - see the
        // class-level note above.
        // =====================================================

        if (
            localVersion ===
                null
        ) {

            return "No Local Version";

        }


        // =====================================================
        // 5 - Pass
        // =====================================================

        if (
            localVersion ===
                versionInfo.current
        ) {

            return "Pass";

        }


        // =====================================================
        // 6 - Evaluate required Only Now
        // =====================================================

        if (
            localVersion <
                versionInfo.required
        ) {

            return "Restart Required";

        }


        // =====================================================
        // 7 - Update Available
        // =====================================================

        return "Update Available";

    }


    // =====================================================
    // Mount Application Restart Required
    //
    // Application Version Gate - blocking presentation.
    //
    // Shows the highest-level Restart Required overlay
    // (ctrApplicationRestartRequired, a sibling of ctrMain - see
    // buildUI) and disables the application header actions so no
    // underlying application interaction can continue. Distinct
    // from Shutdown/app-fatal: this state is recoverable through
    // the Restart button, so routing is NOT moved to "Error" and
    // btnApplicationRestartRequired is left enabled.
    // =====================================================

    private processMountApplicationRestartRequired(): void {

        this.btnApplicationSettings.disabled =
            true;

        this.btnApplicationUpload.disabled =
            true;

        this.btnApplicationSettings.classList.add(
            "application-disabled"
        );

        this.btnApplicationUpload.classList.add(
            "application-disabled"
        );

        this.ctrApplicationRestartRequired.classList.remove(
            "application-hidden"
        );

    }


    // =====================================================
    // Process Restart Application
    //
    // Application Version Gate - Restart/Update action ownership.
    //
    // The single shared workflow invoked by BOTH
    // btnApplicationRestartRequired (blocking Restart Required) and
    // btnApplicationUpdateAvailable (non-blocking Update Available)
    // - never automatically, never merely because
    // processCheckApplicationVersion detected a status.
    //
    // Startup Architecture - Pass 3.7 (Restart Required Preparation +
    // True Application Restart). resetRequired handling,
    // system:localVersion acceptance, and any Application Registry
    // dependency have all MOVED to Section 3's own Restart Required
    // branch (see Startup) - the local version transaction is now
    // fully prepared and durable BEFORE this button ever becomes
    // clickable, for both Restart Required (blocking) and Update
    // Available (which already crosses the common acceptance
    // boundary during its own normal, non-blocking Startup pass).
    // This method's remaining responsibility is intentionally
    // narrow: establish Restart re-entry context, then re-enter
    // Startup - it must never clear IndexedDB, determine
    // resetRequired, write system:localVersion, or fetch/resolve an
    // Application Registry itself.
    //
    // Reuses the same proven Startup payload dispatch as the
    // Application Header Menu (processDispatchStartupPayload),
    // passing "Restart" as its Mode so the resulting Startup pass can
    // recognize this as Restart re-entry and bypass Section 3 Version
    // Check entirely - see Startup's startupIsRestartReEntry.
    // PayloadToPCFMode is otherwise always "" on every existing
    // Startup/Data-group dispatch in this codebase, so this is a
    // non-colliding reuse of an already-existing payload field, not
    // an overload of an unrelated one.
    //
    // IMPORTANT - interim state: this still only re-enters Startup
    // within the SAME PCF instance (no new HTML/CSS/TypeScript bundle
    // is loaded). A true application/browser refresh - required so a
    // Restart Required version's newly deployed code actually loads -
    // was investigated and intentionally NOT implemented this pass;
    // see the Pass 3.7 report for what was proven/unresolved.
    // =====================================================

    private async processRestartApplication(): Promise<void> {

        this.btnApplicationRestartRequired.disabled =
            true;

        this.ctrApplicationRestartRequired.classList.add(
            "application-hidden"
        );

        this.processProcessingOverlay(
            true,
            "Updating App...",
            "Spinner"
        );

        this.processDispatchStartupPayload(
            "Restart"
        );

    }


    // =====================================================
    // 1 - Process Check Active State
    // =====================================================

    private async processCheckActiveState(
        mode: "Full" | "Other" = "Full"
    ): Promise<boolean> {

        console.log(
            "[ProjectDashboard] ENTER processCheckActiveState"
        );

        // =====================================================
        // Open Artifact Store - Creates it if needed
        // =====================================================

        await this.artifactStore.open();

        // =====================================================
        // Get Active State
        // =====================================================

        const activeStateArtifact =
            await this.artifactStore.get(
                "system:activeState"
            );

        // =====================================================
        // Hydrate Active State
        // =====================================================

        if (
            activeStateArtifact
        ) {

            try {

                this.activeState =
                    JSON.parse(
                        new TextDecoder().decode(
                            new Uint8Array(
                                activeStateArtifact
                            )
                        )
                    ) as ActiveState;

            }
            catch {

                this.activeState =
                    null;

            }

        }
        else {

            this.activeState =
                null;

        }

        // =====================================================
        // Validate Active State
        // =====================================================

        let activeStateIsReady =
            false;

        switch (
            mode
        ) {

            // =====================================================
            // Full
            // =====================================================

            case "Full":

                activeStateIsReady =
                    Boolean(
                        this.activeState &&
                        this.activeState.customerId &&
                        this.activeState.locationId &&
                        this.activeState.eventId &&
                        this.activeState.baselineVersion &&
                        this.activeState.currentVersion
                    );

                break;

            // =====================================================
            // Other
            // =====================================================

            case "Other":

                activeStateIsReady =
                    Boolean(
                        this.activeState &&
                        this.activeState.customerId &&
                        this.activeState.locationId &&
                        this.activeState.eventId
                    );

                break;

            // =====================================================
            // Unsupported
            // =====================================================

            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported Active State check mode: ${mode}`
                );

        }

        // =====================================================
        // Validate Customer Master Registry
        // =====================================================

        if (
            activeStateIsReady
        ) {

            const customerMasterRegistryKey =
                `customer_mstr:customers/${this.activeState!.customerId}/customer_master_registry.json`;

            const customerMasterRegistryArtifact =
                await this.artifactStore.get(
                    customerMasterRegistryKey
                );

            activeStateIsReady =
                Boolean(
                    customerMasterRegistryArtifact
                );

        }


        // =====================================================
        // Return Active State Status
        // =====================================================

        console.log(
            "[ProjectDashboard] EXIT processCheckActiveState:",
            activeStateIsReady
        );

        return activeStateIsReady;

    }

    // =====================================================
    // Process Build Active State
    // =====================================================

    private async processBuildActiveState(
        buildType:
            "New" | "Existing",
        invokedFromPCF:
            boolean
    ): Promise<void> {

        console.log(
            "[ProjectDashboard] ENTER processBuildActiveState"
        );

        // =====================================================
        // Get Customers Registry
        // =====================================================

        const customersRegistryArtifact =
            await this.processGetArtifact(
                "Registry",
                "customers/customers_registry.json",
                "IndexDB"
            );

        // =====================================================
        // Hydrate Customers Registry
        // =====================================================

        this.customersRegistry =
            JSON.parse(
                new TextDecoder().decode(
                    new Uint8Array(
                        customersRegistryArtifact
                    )
                )
            ) as CustomersRegistry;

        // =====================================================
        // Resolve Build Configuration
        // =====================================================

        const headerText =
            buildType ===
                "New"
                ? "Dashboard - Setup Required"
                : "Dashboard - Settings Manager";

        // =====================================================
        // Setup Required Only Actions
        // =====================================================

        if (
            buildType ===
                "New"
        ) {

            this.showMessage(
                true,
                "Setup Required! Click Settings to continue.",
                undefined,
                false
            );

        }

        // =====================================================
        // 1 - Clear Previous Settings Artifact Staging
        // =====================================================

        this.processClearIndexDbTemp(
            "All",
            []
        );

        console.log(
            "[ProjectDashboard] 2 - Temporary IndexedDB cleared"
        );

        // =====================================================
        // Open Settings Overlay
        // =====================================================

        buildSettingsOverlay(

            // =====================================================
            // Settings Overlay Container
            // =====================================================

            this.ctrMain,


            // =====================================================
            // Send Status 300 / Settings Close
            // =====================================================

            () => {

                // =====================================================
                // Setup Required - Re-enable Settings
                // =====================================================

                if (
                    buildType ===
                        "New"
                ) {

                    this.btnApplicationSettings.disabled =
                        false;

                    this.btnApplicationSettings.classList.remove(
                        "application-disabled"
                    );

                }


                // =====================================================
                // Existing Status 300 Event
                // =====================================================

                this.processDispatchPCFModeEvent(
                    "PCFModeEventSendStatus300"
                );

            },


            // =====================================================
            // Get Artifact
            // =====================================================

            this.processGetArtifact.bind(
                this
            ),


            // =====================================================
            // Set Active State
            // =====================================================

            this.processSetActiveState.bind(
                this
            ),


            // =====================================================
            // Check Active State
            // =====================================================

            this.processCheckActiveState.bind(
                this
            ),


            // =====================================================
            // Refresh Customer Registries
            // =====================================================

            this.processRefreshCustomerRegistries.bind(
                this
            ),


            // =====================================================
            // Invoked From PCF
            // =====================================================

            invokedFromPCF,


            // =====================================================
            // Settings Header Text
            // =====================================================

            headerText,


            // =====================================================
            // Customers Registry
            // =====================================================

            this.customersRegistry,


            // =====================================================
            // Current Active State
            // =====================================================

            this.activeState,


            // =====================================================
            // Check Upload Wizard Active
            // =====================================================

            () =>
                this.ctrUploadVersion.innerHTML.trim() !==
                    "",


            // =====================================================
            // Reconcile Temporary IndexedDB Staging
            // =====================================================

            async () => {

                return await this.processReconcileIndexDbTemp();

            },


            // =====================================================
            // Clear Temporary IndexedDB Staging
            // =====================================================

            (
                mode,
                artifactPrefixes
            ) => {

                this.processClearIndexDbTemp(
                    mode,
                    artifactPrefixes
                );

            },


            // =====================================================
            // Check Temporary State Changed
            // =====================================================

            (
                activeStateTemp
            ) =>
                this.processTempHasChanged(
                    activeStateTemp
                ),

            // =====================================================
            // Load New Schedule State
            // =====================================================

            () => {

                const payload = {
                    PayloadToPCFGroup:
                        "Data",

                    PayloadToPCFType:
                        `Startup|${Date.now()}`,

                    PayloadToPCFMode:
                        "",

                    PayloadToPCFSubMode:
                        "",

                    PayloadToPCFSubModePath:
                        "",

                    PayloadToPCFDataOne:
                        "",

                    PayloadToPCFDataTwo:
                        "",

                    PayloadToPCFDataThree:
                        "",

                    PayloadToPCFDataFour:
                        "",

                    PayloadToPCFViewIndex:
                        0,

                    PayloadToPCFViewContext:
                        "",

                    PayloadToPCFDecodedArtifactData:
                        "",

                    PayloadToPCFUserEmail:
                        JSON.parse(
                            this.context.parameters.PCFModeIncomingPayloadJson.raw || "{}"
                        ).PayloadToPCFUserEmail ?? ""
                };

                this.pcfModeIncomingPayloadJson =
                    JSON.stringify(
                        payload
                    );

                this.outputChangeType =
                    7;

                this.processNotifyOutputChanged();

            },


            // =====================================================
            // Get Location Events Registry
            // =====================================================

            this.processGetLocationEventsRegistry.bind(
                this
            ),


            // =====================================================
            // Get Location Event
            // =====================================================

            this.processGetLocationEvent.bind(
                this
            ),


            // =====================================================
            // Hydrate Resident Registry
            // =====================================================

            this.processHydrateResidentRegistry.bind(
                this
            ),


            // =====================================================
            // Set Resident Customer Master Registry
            // =====================================================

            (
                customerMasterRegistry
            ) => {

                this.customerMasterRegistry =
                    customerMasterRegistry;

            }

        );

        console.log(
            "[ProjectDashboard] EXIT processBuildActiveState"
        );

    }

    // =====================================================
    // Process Set Active State
    // =====================================================

    private async processSetActiveState(
        activeState:
            ActiveState
    ): Promise<void> {

        console.log(
            "[ProjectDashboard] ENTER processSetActiveState"
        );

        // =====================================================
        // Encode Active State
        // =====================================================

        const activeStateBuffer =
            new TextEncoder().encode(
                JSON.stringify(
                    activeState
                )
            ).buffer;

        // =====================================================
        // Store Active State
        // =====================================================

        await this.artifactStore.put(
            "system:activeState",
            activeStateBuffer
        );

        // =====================================================
        // Hydrate Active State
        // =====================================================

        this.activeState =
            activeState;

        console.log(
            "[ProjectDashboard] Active State Set:",
            this.activeState
        );

        console.log(
            "[ProjectDashboard] EXIT processSetActiveState"
        );

    }

    // =====================================================
    // Process Check Customer ETag
    //
    // Standalone Change ETag Checker. Determines Whether The
    // Customer's Remote Change ETag Marker Differs From The
    // Locally Acknowledged system:etagStatus. This Is A
    // CHECKER ONLY - It Does Not Call processCheckRegistryKeys(),
    // processRefreshCustomerRegistries(), Or RegistrySync, And
    // Does Not Acknowledge A Dirty Remote ETag. Acknowledgement
    // Is The Caller's Responsibility, ONLY After A Successful
    // Registry Synchronization
    // =====================================================

    private async processCheckCustomerEtag():
        Promise<
            {
                changed:
                    boolean;

                remoteEtag:
                    string | null;
            }
        > {

        console.log(
            "[ProjectDashboard] ENTER processCheckCustomerEtag"
        );

        // =====================================================
        // 1 - Build Change ETag Marker Path
        // =====================================================

        const changeEtagMarkerPath =
            `customers/${this.activeState!.customerId}/change.etag`;

        // =====================================================
        // 2 - Get Local ETag Status
        // =====================================================

        const localEtagStatusArtifact =
            await this.artifactStore.get(
                "system:etagStatus"
            );

        // =====================================================
        // 3 - No Local Baseline Yet - Establish One
        //
        // Existing Installations Must Not Treat A Missing
        // Baseline As A Change Signal
        // =====================================================

        if (
            !localEtagStatusArtifact
        ) {

            let remoteMarker:
                {
                    path:
                        string;

                    etag:
                        string | null;

                    lastModified:
                        string | null;
                } | null =
                    null;

            try {

                remoteMarker =
                    await getArtifactEtag(
                        changeEtagMarkerPath
                    );

            }
            catch (
                error
            ) {

                console.error(
                    "[ProjectDashboard] ETAG CHECK - baseline retrieval failed:",
                    error
                );

            }

            if (
                remoteMarker?.etag
            ) {

                await this.artifactStore.put(
                    "system:etagStatus",
                    new TextEncoder().encode(
                        remoteMarker.etag
                    ).buffer
                );

                console.log(
                    "[ProjectDashboard] ETAG CHECK - baseline initialized:",
                    {
                        markerPath:
                            changeEtagMarkerPath,

                        remoteEtag:
                            remoteMarker.etag
                    }
                );

            }

            console.log(
                "[ProjectDashboard] EXIT processCheckCustomerEtag:",
                {
                    changed:
                        false,

                    remoteEtag:
                        remoteMarker?.etag ??
                            null
                }
            );

            return {
                changed:
                    false,

                remoteEtag:
                    remoteMarker?.etag ??
                        null
            };

        }

        // =====================================================
        // 4 - Compare Local ETag Against Remote ETag
        // =====================================================

        const localEtag =
            new TextDecoder().decode(
                new Uint8Array(
                    localEtagStatusArtifact
                )
            );

        let remoteMarker:
            {
                path:
                    string;

                etag:
                    string | null;

                lastModified:
                    string | null;
            } | null =
                null;

        try {

            remoteMarker =
                await getArtifactEtag(
                    changeEtagMarkerPath
                );

        }
        catch (
            error
        ) {

            console.error(
                "[ProjectDashboard] ETAG CHECK - remote retrieval failed:",
                error
            );

        }

        if (
            !remoteMarker?.etag
        ) {

            console.log(
                "[ProjectDashboard] EXIT processCheckCustomerEtag:",
                {
                    changed:
                        false,

                    remoteEtag:
                        null
                }
            );

            return {
                changed:
                    false,

                remoteEtag:
                    null
            };

        }

        const remoteEtag =
            remoteMarker.etag;

        const changed =
            remoteEtag !==
                localEtag;

        console.log(
            "[ProjectDashboard] ETAG CHECK",
            {
                localEtag:
                    localEtag,

                remoteEtag:
                    remoteEtag,

                changed:
                    changed
            }
        );

        console.log(
            "[ProjectDashboard] EXIT processCheckCustomerEtag:",
            {
                changed:
                    changed,

                remoteEtag:
                    remoteEtag
            }
        );

        return {
            changed:
                changed,

            remoteEtag:
                remoteEtag
        };

    }

    // =====================================================
    // Process Check Registry Keys
    // =====================================================

    private async processCheckRegistryKeys():Promise<boolean> {

        console.log(
            "[ProjectDashboard] ENTER processCheckRegistryKeys"
        );

        // =====================================================
        // 1 - Build & Get Customer Master Registry Key
        // =====================================================

        const customerMasterRegistryKey =
            `customer_mstr:customers/${this.activeState!.customerId}/customer_master_registry.json`;

        const customerMasterRegistryArtifact =
            await this.artifactStore.get(
                customerMasterRegistryKey
            );

        // =====================================================
        // 2 - Build & Get User Profile Registry Key
        // =====================================================

        const userProfileRegistryKey =
            "user:current_profile";

        const userProfileRegistryArtifact =
            await this.artifactStore.get(
                userProfileRegistryKey
            );
        

        // =====================================================
        // 3 - Validate Required Registry Artifacts
        //     Customer Master Guaranteed by Active State Check
        // =====================================================

        if (
            !customerMasterRegistryArtifact ||
            !userProfileRegistryArtifact
        ) {

            console.log(
                "[ProjectDashboard] Required registry artifact is not available locally:",
                {
                    customerMasterRegistry:
                        !!customerMasterRegistryArtifact,

                    userProfileRegistry:
                        !!userProfileRegistryArtifact
                }
            );

            return false;

        }

        // =====================================================
        // 3A - Validate Registry Freshness
        // =====================================================

        const localCustomerMasterRegistry =
            JSON.parse(
                new TextDecoder().decode(
                    new Uint8Array(
                        customerMasterRegistryArtifact
                    )
                )
            ) as CustomerMasterRegistry;

        const localUserProfileRegistry =
            JSON.parse(
                new TextDecoder().decode(
                    new Uint8Array(
                        userProfileRegistryArtifact
                    )
                )
            ) as UserProfileRegistry;

        const userProfileRegistryPath =
            this.currentUser!.userProfilePath;

        // =====================================================
        // Get Azure Last Modified Values
        //
        // Customer Master Is Intentionally NOT Requested Here.
        // Its Root lastModified No Longer Drives Normal-Runtime
        // Synchronization - That Responsibility Now Belongs To
        // processCheckCustomerEtag(), Called By The Orchestration
        // Layer Before This Function. Customer Master Remains
        // A Normal Registry, Refreshable By processRefreshCustomerRegistries
        // Like Any Other, And Its Own lastModified Still Means
        // "Customer Master Itself Changed" - It Is Simply No
        // Longer Downloaded/Parsed On Every Pass Merely To
        // Decide Whether To Synchronize
        // =====================================================

        const azureArtifactLastModified =
            await getAzureArtifactLastModified(
                [
                    userProfileRegistryPath
                ]
            );

        const azureUserProfileLastModified =
            azureArtifactLastModified.get(
                userProfileRegistryPath
            );

        // =====================================================
        // Inspect Azure Last Modified Values
        // =====================================================

        console.log(
            "[ProjectDashboard] Azure Artifact Last Modified:",
            {
                userProfile:
                    azureUserProfileLastModified
            }
        );


        // =====================================================
        // Validate User Profile Registry Freshness
        //
        // Change ETag Checking No Longer Occurs Here - See
        // processCheckCustomerEtag(). This Function Is Registry
        // Checking/Reconciliation Only And Performs No ETag
        // Operations
        // =====================================================

        if (
            azureUserProfileLastModified !==
                localUserProfileRegistry.lastModified
        ) {

            console.log(
                "[ProjectDashboard] User Profile Registry is stale:",
                {
                    local:
                        localUserProfileRegistry.lastModified,

                    azure:
                        azureUserProfileLastModified
                }
            );

            // ========================================
            // Refresh Current User Profile
            // ========================================

            const userProfilePackage =
                await getArtifactsFromAzure(
                    "Other",
                    [
                        userProfileRegistryPath
                    ]
                );

            const userProfileArtifacts =
                splitAzureArtifactPackage(
                    userProfilePackage
                );

            const refreshedUserProfileArtifact =
                userProfileArtifacts.get(
                    `other:${userProfileRegistryPath}`
                );

            if (
                !refreshedUserProfileArtifact
            ) {

                throw new Error(
                    `[ProjectDashboard] Refreshed user profile was not returned: ${userProfileRegistryPath}`
                );

            }

            await this.artifactStore.put(
                userProfileRegistryKey,
                refreshedUserProfileArtifact
            );

            this.currentUserProfile =
                JSON.parse(
                    new TextDecoder().decode(
                        new Uint8Array(
                            refreshedUserProfileArtifact
                        )
                    )
                ) as UserProfileRegistry;

            console.log(
                "[ProjectDashboard] User Profile Registry refreshed"
            );

        }
        else {

            this.currentUserProfile =
                localUserProfileRegistry;

        }


        // =====================================================
        // 4 - Hydrate Customer Master Registry
        //
        // Customer Master Freshness Is No Longer Compared Here -
        // See processCheckCustomerEtag(), Called By The
        // Orchestration Layer Before This Function, Which Now
        // Owns The Sole Synchronization Stimulus. Whatever Is
        // Currently Resident In IndexedDB (Freshly Refreshed Or
        // Not, Depending On The ETag Outcome Before This Call)
        // Is Hydrated As-Is Below
        // =====================================================


        this.customerMasterRegistry =
            localCustomerMasterRegistry;
            

        // =====================================================
        // 5 - Check Required Registry Keys
        //
        // Registry Architecture Refactor - Stage D.
        //
        // Customer Master's registries[] is now authoritative for
        // which customer registries must be resident. No hardcoded
        // registry list, no {customerId}/{locationId}
        // interpretation, and no registrySync/active-Location
        // filtering happens here - processResolveCustomerRegistryManifest()
        // already owns all of that. Customer Master itself is not
        // special-cased below - it simply appears as one ordinary
        // resolved entry, already known resident from steps 1-4
        // above.
        // =====================================================

        const resolvedRegistries =
            processResolveCustomerRegistryManifest(
                this.customerMasterRegistry
            );

        // =====================================================
        // Reset Location-Keyed Resident Registries
        //
        // Registry Architecture Refactor - Stage E.
        //
        // Rebuilt from the current resolved manifest below rather
        // than incrementally accumulated, so a Location that is
        // removed, becomes inactive, or loses registrySync does
        // not leave a stale resident entry behind.
        // =====================================================

        this.locationEventsRegistries.clear();

        this.locationPlacesRegistries.clear();

        const registryKeyChecks =
            await Promise.all(
                resolvedRegistries.map(
                    async resolvedRegistry => {

                        const registryArtifact =
                            await this.artifactStore.get(
                                resolvedRegistry.registryKey
                            );

                        // =====================================================
                        // Hydrate Resident Registry
                        // =====================================================

                        if (
                            registryArtifact
                        ) {

                            this.processHydrateResidentRegistry(
                                resolvedRegistry,
                                registryArtifact
                            );

                        }

                        return {
                            registryType:
                                resolvedRegistry.registryType,

                            registryKey:
                                resolvedRegistry.registryKey,

                            exists:
                                !!registryArtifact
                        };

                    }
                )
            );

        // =====================================================
        // 6 - Determine Registry Key State
        //
        // An empty resolved manifest must not be interpreted as
        // "everything is ready" merely because there is nothing
        // to iterate - Array.prototype.every() on [] is vacuously
        // true, so the resolved count is checked explicitly.
        // =====================================================

        const registryKeysAreReady =
            resolvedRegistries.length >
                0 &&
            registryKeyChecks.every(
                registry =>
                    registry.exists
            );

        // =====================================================
        // 7 - Inspect Registry Key State
        // =====================================================

        console.log(
            "[ProjectDashboard] Registry Key Checks:",
            registryKeyChecks
        );

        console.log(
                "[ProjectDashboard] Resident Registries:",
                {
                    customerMasterRegistry:
                        !!this.customerMasterRegistry,

                    fieldsRegistry:
                        !!this.fieldsRegistry,

                    customerLocations:
                        this.customerMasterRegistry
                            ?.locations
                            .length ??
                            0,

                    customerEvents:
                        Array.from(
                            this.locationEventsRegistries.values()
                        ).reduce(
                            (
                                total,
                                locationEventsRegistry
                            ) =>
                                total +
                                locationEventsRegistry.events.length,
                            0
                        ),

                    scheduleVersionsRegistry:
                        !!this.scheduleVersionsRegistry
                }
            );

        console.log(
            `[ProjectDashboard] EXIT processCheckRegistryKeys: ${registryKeysAreReady}`
        );

        return registryKeysAreReady;

    }

    // =====================================================
    // Process Build Registry Keys
    // =====================================================

    private async processBuildRegistryKeys():
        Promise<void> {

        console.log(
            "[ProjectDashboard] ENTER processBuildRegistryKeys"
        );

        // =====================================================
        // Validate Customer Master Registry
        // =====================================================

        if (
            !this.customerMasterRegistry
        ) {

            throw new Error(
                "[ProjectDashboard] Customer Master Registry is not available"
            );

        }

        // =====================================================
        // Resolve Customer Registry Manifest
        //
        // Registry Architecture Refactor - Stage D.
        //
        // Customer Master's registries[] is authoritative for the
        // customer-registry build estate. No hardcoded registry
        // list, no {customerId}/{locationId} interpretation, and
        // no registrySync/active-Location filtering happens here -
        // processResolveCustomerRegistryManifest() already owns
        // all of that.
        // =====================================================

        const resolvedRegistries =
            processResolveCustomerRegistryManifest(
                this.customerMasterRegistry
            );

        // =====================================================
        // Validate Resolved Registry Manifest
        //
        // Registry Architecture Refactor - Stage D Correction.
        //
        // An empty resolved manifest is not a valid "nothing to
        // build" state - Build has no registry-estate authority
        // of its own to fall back on, and must not silently treat
        // a manifest that resolved zero Registry Sync entries as
        // complete.
        // =====================================================

        if (
            resolvedRegistries.length ===
                0
        ) {

            throw new Error(
                "[ProjectDashboard] Customer Master registry manifest resolved no Registry Sync entries"
            );

        }

        // =====================================================
        // Find Missing Registries
        // =====================================================

        const missingRegistries:
            ResolvedRegistryDefinition[] =
                [];

        for (
            const resolvedRegistry of
                resolvedRegistries
        ) {

            const registryArtifact =
                await this.artifactStore.get(
                    resolvedRegistry.registryKey
                );

            if (
                !registryArtifact
            ) {

                missingRegistries.push(
                    resolvedRegistry
                );

            }

        }

        // =====================================================
        // Nothing To Build
        //
        // Also reached when the resolved manifest itself is
        // empty - Build has no registry-estate authority of its
        // own to fall back on, and must not fabricate one.
        // =====================================================

        if (
            missingRegistries.length ===
                0
        ) {

            console.log(
                "[ProjectDashboard] EXIT processBuildRegistryKeys - No Missing Registries"
            );

            return;

        }

        // =====================================================
        // Inspect Missing Registries
        // =====================================================

        console.log(
            "[ProjectDashboard] Missing Registries:",
            missingRegistries
        );

        // =====================================================
        // Get Missing Registries From Azure
        // =====================================================

        const registryPackage =
            await getArtifactsFromAzure(
                "Registry",
                missingRegistries.map(
                    missingRegistry =>
                        missingRegistry.registryPath
                )
            );

        // =====================================================
        // Split Registry Package
        // =====================================================

        const registryArtifacts =
            splitAzureArtifactPackage(
                registryPackage
            );

    // =====================================================
    // Store And Hydrate Missing Registries
    //
    // registryKey is authoritative on the resolved manifest
    // entry already in scope - no filename/prefix
    // reconstruction, no equality lookup against
    // customerMasterRegistry.fieldsRegistry.
    // =====================================================

    for (
        const missingRegistry of
            missingRegistries
    ) {

        // =====================================================
        // Resolve Azure Registry Artifact
        // =====================================================

        const azureRegistryKey =
            `registry:${missingRegistry.registryPath}`;

        const registryArtifact =
            registryArtifacts.get(
                azureRegistryKey
            );

        if (
            !registryArtifact
        ) {

            throw new Error(
                `[ProjectDashboard] Registry artifact missing from Azure package: ${missingRegistry.registryPath}`
            );

        }


        // =====================================================
        // Store Resident Registry
        // =====================================================

        await this.artifactStore.put(
            missingRegistry.registryKey,
            registryArtifact
        );


        // =====================================================
        // Decode And Hydrate Resident Registry
        // =====================================================

        this.processHydrateResidentRegistry(
            missingRegistry,
            registryArtifact
        );

    }


    // =====================================================
    // Build Complete
    // =====================================================

    console.log(
        "[ProjectDashboard] EXIT processBuildRegistryKeys"
    );

    }

    // =====================================================
    // Process Hydrate Resident Registry
    //
    // Registry Architecture Refactor - Stage E.
    //
    // Sole owner of decoding a resolved customer registry
    // artifact into resident application state. Shared by
    // processCheckRegistryKeys() and processBuildRegistryKeys()
    // so JSON decoding / registry-type dispatch is not
    // duplicated between them. registryType tells this method
    // which known resident contract should receive the decoded
    // artifact; a resolved registrySync === true entry whose
    // type has no resident-object requirement (e.g. the
    // Customer Master entry, already owned by
    // this.customerMasterRegistry) is simply a synchronized
    // artifact with no case here, and is left alone.
    // =====================================================

    private processHydrateResidentRegistry(
        resolvedRegistry:
            ResolvedRegistryDefinition,

        registryArtifact:
            ArrayBuffer
    ): void {

        const registryData =
            JSON.parse(
                new TextDecoder().decode(
                    new Uint8Array(
                        registryArtifact
                    )
                )
            );

        switch (
            resolvedRegistry.registryType
        ) {

            case "fields":

                this.fieldsRegistry =
                    registryData as FieldsRegistry;

                break;

            case "location_events": {

                const locationEventsRegistry =
                    registryData as LocationEventsRegistry;

                this.processValidateResidentLocationRegistryIdentity(
                    resolvedRegistry,
                    locationEventsRegistry.customerId,
                    locationEventsRegistry.locationId
                );

                this.locationEventsRegistries.set(
                    locationEventsRegistry.locationId,
                    locationEventsRegistry
                );

                break;

            }

            case "location_places": {

                const locationPlacesRegistry =
                    registryData as LocationPlacesRegistry;

                this.processValidateResidentLocationRegistryIdentity(
                    resolvedRegistry,
                    locationPlacesRegistry.customerId,
                    locationPlacesRegistry.locationId
                );

                this.locationPlacesRegistries.set(
                    locationPlacesRegistry.locationId,
                    locationPlacesRegistry
                );

                break;

            }

        }

    }

    // =====================================================
    // Process Validate Resident Location Registry Identity
    //
    // Registry Architecture Refactor - Stage E.
    //
    // Validates a decoded Location-scoped registry's own
    // declared customerId/locationId directly against Customer
    // Master - the authoritative source - rather than parsing
    // the resolved registryKey/registryPath strings. A registry
    // for one Location must never be keyed into resident state
    // under a different Location's identity.
    //
    // Missing resident authority and a genuine identity mismatch
    // are operationally different failures - a lifecycle/ordering
    // defect versus real data corruption or a cross-customer
    // artifact mixup - so they are checked and reported as two
    // sequential, distinct guards rather than one conflated
    // condition.
    // =====================================================

    private processValidateResidentLocationRegistryIdentity(
        resolvedRegistry:
            ResolvedRegistryDefinition,

        decodedCustomerId:
            string,

        decodedLocationId:
            string
    ): void {

        if (
            !this.customerMasterRegistry
        ) {

            throw new Error(
                `[ProjectDashboard] Resident Customer Master Registry is not available: ${resolvedRegistry.registryKey}`
            );

        }

        if (
            decodedCustomerId !==
                this.customerMasterRegistry.customerId
        ) {

            throw new Error(
                `[ProjectDashboard] Resident registry customer identity mismatch: ${resolvedRegistry.registryKey}`
            );

        }

        const matchingActiveLocation =
            this.customerMasterRegistry.locations.find(
                location =>
                    location.active &&
                    location.locationId ===
                        decodedLocationId
            );

        if (
            !matchingActiveLocation
        ) {

            throw new Error(
                `[ProjectDashboard] Resident registry location identity mismatch: ${resolvedRegistry.registryKey}`
            );

        }

    }

    // =====================================================
    // Get Location Events Registry
    // Get Location Places Registry
    //
    // Registry Architecture Refactor - Stage E.
    //
    // Resident lookups only - no Azure retrieval, no path
    // construction, no manifest interpretation.
    // =====================================================

    private processGetLocationEventsRegistry(
        locationId:
            string
    ): LocationEventsRegistry | null {

        return this.locationEventsRegistries.get(
            locationId
        ) ??
            null;

    }

    private processGetLocationPlacesRegistry(
        locationId:
            string
    ): LocationPlacesRegistry | null {

        return this.locationPlacesRegistries.get(
            locationId
        ) ??
            null;

    }

    // =====================================================
    // Get Location Event
    //
    // Registry Architecture Refactor - Stage F.
    //
    // Location-scoped Event lookup against the resident
    // LocationEventsRegistry - no Azure retrieval, no path
    // construction, no manifest interpretation, and no fallback
    // to legacy CustomerMasterLocation.events. Intentionally
    // performs no `active` filtering - that remains
    // consumer-specific, since not every consumer requires it
    // identically.
    // =====================================================

    private processGetLocationEvent(
        locationId:
            string,

        eventId:
            string
    ): CustomerMasterEvent | null {

        const locationEventsRegistry =
            this.processGetLocationEventsRegistry(
                locationId
            );

        if (
            !locationEventsRegistry
        ) {

            return null;

        }

        return locationEventsRegistry
            .events
            .find(
                event =>
                    event.eventId ===
                        eventId
            ) ??
            null;

    }

    // =====================================================
    // Process Get Artifact
    // =====================================================

    private async processGetArtifact(
        artifactType:
            "Application" |
            "Registry" |
            "Map",
        artifactPath:
            string,
        storageTarget:
            "IndexDB" |
            "Temp",

        // =====================================================
        // Registry Architecture Refactor - Stage G.
        //
        // Opt-in only. Every existing caller that omits this
        // argument keeps today's "return local artifact if
        // present" behavior unchanged.
        // =====================================================

        freshnessMode:
            "Cache" |
            "ValidateFreshness" =
                "Cache",

        // =====================================================
        // Registry Architecture Refactor - Setup Location
        // Bootstrap.
        //
        // Opt-in only. When a caller already has an authoritative
        // resolved registryKey (from processResolveCustomerRegistryManifest),
        // it is used verbatim as the resident storage key and the
        // filename-inference switch below is skipped for this
        // call. This is what lets manifest-owned registry types
        // (e.g. location_events, location_places) flow through
        // without adding another filename branch, and avoids a
        // second registry-key authority. Every existing caller
        // that omits this argument is unaffected.
        // =====================================================

        residentArtifactKey?:
            string
    ): Promise<ArrayBuffer> {

        // =====================================================
        // 1 - Resolve Artifact Configuration
        // =====================================================

        let azureArtifactType:
            "Registry" |
            "Other";

        let azureArtifactKeyPrefix:
            string;

        let residentArtifactKeyPrefix =
            "";

        switch (
            artifactType
        ) {

            // =====================================================
            // Registry
            // =====================================================

            case "Registry":

                azureArtifactType =
                    "Registry";

                azureArtifactKeyPrefix =
                    "registry";


                // =================================================
                // Caller-Supplied Resolved Registry Key
                // =================================================

                if (
                    residentArtifactKey
                ) {

                    break;

                }


                // =================================================
                // Global Customers Registry
                // =================================================

                if (
                    artifactPath.endsWith(
                        "customers_registry.json"
                    )
                ) {

                    residentArtifactKeyPrefix =
                        "registry";

                }


                // =================================================
                // Customer Master Registry
                // =================================================

                else if (
                    artifactPath.endsWith(
                        "customer_master_registry.json"
                    )
                ) {

                    residentArtifactKeyPrefix =
                        "customer_mstr";

                }


                // =================================================
                // Customer Fields Registry
                // =================================================

                else if (
                    artifactPath.endsWith(
                        "fields_registry.json"
                    )
                ) {

                    residentArtifactKeyPrefix =
                        "customer_flds";

                }


                // =================================================
                // Customer Schedule Versions Registry
                // =================================================

                else if (
                    artifactPath.endsWith(
                        "sch_versions_registry.json"
                    )
                ) {

                    residentArtifactKeyPrefix =
                        "customer_schv";

                }


                // =================================================
                // Customer Worklist Versions Registry
                // =================================================

                else if (
                    artifactPath.endsWith(
                        "wkl_versions_registry.json"
                    )
                ) {

                    residentArtifactKeyPrefix =
                        "customer_wklv";

                }


                // =================================================
                // Unsupported Registry
                // =================================================

                else {

                    throw new Error(
                        `[ProjectDashboard] Unsupported registry artifact: ${artifactPath}`
                    );

                }

                break;


            // =====================================================
            // Application
            // =====================================================

            case "Application":

                azureArtifactType =
                    "Other";

                azureArtifactKeyPrefix =
                    "other";

                residentArtifactKeyPrefix =
                    "app";

                break;


            // =====================================================
            // Location Map
            // =====================================================

            case "Map":

                azureArtifactType =
                    "Other";

                azureArtifactKeyPrefix =
                    "other";

                residentArtifactKeyPrefix =
                    "customer_maps";

                break;


            // =====================================================
            // Unsupported
            // =====================================================

            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported artifact type: ${artifactType}`
                );

        }


        // =====================================================
        // 2 - Build Resident Artifact Key
        // =====================================================

        const artifactKey =
            residentArtifactKey ??
            `${residentArtifactKeyPrefix}:${artifactPath}`;


        // =====================================================
        // 3 - Check Temporary Artifact Store
        //     Temp Mode Only
        // =====================================================

        let artifact:
            ArrayBuffer | undefined;

        if (
            storageTarget ===
                "Temp"
        ) {

            artifact =
                this.indexDbTemp.get(
                    artifactKey
                );

        }


        // =====================================================
        // 4 - Check Committed IndexedDB Artifact Store
        // =====================================================

        if (
            !artifact
        ) {

            artifact =
                await this.artifactStore.get(
                    artifactKey
                );

        }


        // =====================================================
        // 4A - Validate Freshness
        //
        // Registry Architecture Refactor - Stage G.
        //
        // Reuses the same getAzureArtifactLastModified()
        // infrastructure already used for User Profile freshness
        // in processCheckRegistryKeys - not a second definition
        // of freshness. A local artifact found stale here is
        // cleared so it falls through to the existing "missing
        // artifact" fetch/store path below unchanged, which
        // already honors storageTarget ("Temp" vs "IndexDB")
        // correctly - freshness validation never bypasses that
        // transaction boundary.
        // =====================================================

        if (
            artifact &&
            freshnessMode ===
                "ValidateFreshness"
        ) {

            const localArtifact =
                JSON.parse(
                    new TextDecoder().decode(
                        new Uint8Array(
                            artifact
                        )
                    )
                ) as {
                    lastModified?:
                        string;
                };

            const azureLastModifiedMap =
                await getAzureArtifactLastModified(
                    [
                        artifactPath
                    ]
                );

            const azureLastModified =
                azureLastModifiedMap.get(
                    artifactPath
                );

            if (
                azureLastModified ===
                    undefined ||
                azureLastModified ===
                    null
            ) {

                throw new Error(
                    `[ProjectDashboard] Unable to validate freshness for artifact: ${artifactPath}`
                );

            }

            if (
                azureLastModified !==
                    localArtifact.lastModified
            ) {

                artifact =
                    undefined;

            }

        }


        // =====================================================
        // 5 - Get Missing Artifact From Azure
        // =====================================================

        if (
            !artifact
        ) {

            this.processProcessingOverlay(
                true,
                "Loading..."
            );

            try {

                // =====================================================
                // 6 - Get Artifact Package
                // =====================================================

                const artifactPackage =
                    await getArtifactsFromAzure(
                        azureArtifactType,
                        [
                            artifactPath
                        ]
                    );


                // =====================================================
                // 7 - Split Artifact Package
                // =====================================================

                const artifacts =
                    splitAzureArtifactPackage(
                        artifactPackage
                    );


                // =====================================================
                // 8 - Resolve Requested Artifact
                // =====================================================

                artifact =
                    artifacts.get(
                        `${azureArtifactKeyPrefix}:${artifactPath}`
                    );

                if (
                    !artifact
                ) {

                    throw new Error(
                        `[ProjectDashboard] ${artifactType} artifact missing from Azure package: ${artifactPath}`
                    );

                }


                // =====================================================
                // 9 - Store Artifact In Requested Destination
                // =====================================================

                if (
                    storageTarget ===
                        "Temp"
                ) {

                    this.indexDbTemp.set(
                        artifactKey,
                        artifact
                    );

                    this.indexDbTempStatus.set(
                        artifactKey,
                        {
                            status:
                                "Pending"
                        }
                    );

                    console.log(
                        "[ProjectDashboard] indexDbTemp:",
                        Array.from(
                            this.indexDbTemp.keys()
                        )
                    );

                }
                else {

                    await this.artifactStore.put(
                        artifactKey,
                        artifact
                    );

                }

            }
            finally {

                // =====================================================
                // 10 - Hide Processing Overlay
                // =====================================================

                this.processProcessingOverlay(
                    false
                );

            }

        }


        // =====================================================
        // 11 - Return Artifact
        // =====================================================

        return artifact;

    }


    // =====================================================
    // Refresh Customer Registries
    // =====================================================

    private async processRefreshCustomerRegistries():
        Promise<void> {

        // =====================================================
        // 1 - Validate Active State
        // =====================================================

        if (
            !this.activeState
        ) {

            return;

        }


        // =====================================================
        // 2 - Build Customer Master Registry Path
        // =====================================================

        const customerMasterRegistryPath =
            `customers/${this.activeState.customerId}/customer_master_registry.json`;


        // =====================================================
        // 3 - Build Customer Master Registry Key
        // =====================================================

        const customerMasterRegistryArtifactKey =
            `customer_mstr:${customerMasterRegistryPath}`;


        // =====================================================
        // 4 - Get Cached Customer Master Registry
        // =====================================================

        const cachedCustomerMasterRegistryArtifact =
            await this.artifactStore.get(
                customerMasterRegistryArtifactKey
            );


        // =====================================================
        // 5 - Decode Cached Customer Master Registry
        // =====================================================

        const cachedCustomerMasterRegistry =
            cachedCustomerMasterRegistryArtifact
                ? JSON.parse(
                    new TextDecoder().decode(
                        new Uint8Array(
                            cachedCustomerMasterRegistryArtifact
                        )
                    )
                ) as CustomerMasterRegistry
                : null;


        // =====================================================
        // 5A - Resolve Customer Master Registry Manifest
        //
        // Registry Architecture Refactor - Stage C.
        //
        // Customer Master's registries[] is now authoritative
        // for which customer registries participate in this
        // refresh cycle. No hardcoded registry list, no
        // {customerId}/{locationId} interpretation, and no
        // registrySync/active-Location filtering happens here -
        // processResolveCustomerRegistryManifest() already owns
        // all of that.
        //
        // A missing local Customer Master (nothing decoded yet)
        // or an empty resolved manifest both mean there is no
        // authoritative registry set to sync against this cycle -
        // this is a safe no-sync/not-ready state, not an error,
        // and must not fall back to a fabricated registry list.
        // =====================================================

        if (
            !cachedCustomerMasterRegistry
        ) {

            console.warn(
                "[ProjectDashboard] Refresh Customer Registries skipped - no local Customer Master available to resolve a manifest from"
            );

            return;

        }

        const resolvedRegistries =
            processResolveCustomerRegistryManifest(
                cachedCustomerMasterRegistry
            );

        if (
            resolvedRegistries.length ===
                0
        ) {

            console.warn(
                "[ProjectDashboard] Refresh Customer Registries skipped - resolved registry manifest is empty"
            );

            return;

        }


        // =====================================================
        // 5B - Build Local Registry State
        //
        // Scalable RegistrySync V2 Contract - Each Entry's
        // localLastModified Is Read From THAT Registry's Own
        // Actual Local Artifact, Never From Customer Master's
        // registries[] Proxy Array. Customer Master Discovers
        // WHERE The Other Registries Live (Path Discovery Only)
        // But Never Supplies Their Freshness Value
        // =====================================================

        const localRegistries:
            LocalRegistryState[] =
                [];

        for (
            const resolvedRegistry of
                resolvedRegistries
        ) {

            const localRegistryArtifact =
                await this.artifactStore.get(
                    resolvedRegistry.registryKey
                );

            const localRegistryContent =
                localRegistryArtifact
                    ? JSON.parse(
                        new TextDecoder().decode(
                            new Uint8Array(
                                localRegistryArtifact
                            )
                        )
                    ) as {
                        lastModified?:
                            string;
                    }
                    : null;

            localRegistries.push(
                {
                    registryType:
                        resolvedRegistry.registryType,

                    registryPath:
                        resolvedRegistry.registryPath,

                    localLastModified:
                        localRegistryContent?.lastModified ??
                            null
                }
            );

        }


        // =====================================================
        // 6 - Sync Customer Registries From Azure
        // =====================================================

        const artifactPackage =
            await syncCustomerRegistriesFromAzure(
                localRegistries
            );


        // =====================================================
        // 7 - Split Azure Artifact Package
        // =====================================================

        const artifactBuffers =
            splitAzureArtifactPackage(
                artifactPackage
            );


        // =====================================================
        // 8 - Store Refreshed Customer Registries
        //
        // Registry Architecture Refactor - Stage C.
        //
        // registryKey is authoritative on the resolved manifest
        // entries already in scope - no filename/prefix
        // reconstruction. Refreshed artifacts are matched back to
        // their resolved registryKey by registryPath.
        // =====================================================

        const registryKeyByPath =
            new Map<string, string>(
                resolvedRegistries.map(
                    resolvedRegistry =>
                        [
                            resolvedRegistry.registryPath,
                            resolvedRegistry.registryKey
                        ]
                )
            );

        for (
            const [
                azureArtifactKey,
                artifactBuffer
            ] of artifactBuffers
        ) {

            // =================================================
            // 8.1 - Resolve Azure Artifact Path
            // =================================================

            const artifactPath =
                azureArtifactKey.replace(
                    "registry:",
                    ""
                );


            // =================================================
            // 8.2 - Resolve Resident Artifact Key
            // =================================================

            const residentArtifactKey =
                registryKeyByPath.get(
                    artifactPath
                );

            if (
                !residentArtifactKey
            ) {

                throw new Error(
                    `[ProjectDashboard] Refreshed registry artifact path not present in resolved manifest: ${artifactPath}`
                );

            }


            // =================================================
            // 8.3 - Store Refreshed Resident Artifact
            // =================================================

            await this.artifactStore.put(
                residentArtifactKey,
                artifactBuffer
            );

        }


        // =====================================================
        // 9 - Refresh Complete
        // =====================================================


    }

    // =====================================================
    // Process Reconcile Temporary IndexedDB
    // =====================================================

    private async processReconcileIndexDbTemp():
        Promise<boolean> {

        console.log(
            "[ProjectDashboard] ENTER processReconcileIndexDbTemp"
        );

        console.log(
            "[ProjectDashboard] Reconcile Temp Size:",
            this.indexDbTemp.size,
            Array.from(
                this.indexDbTemp.keys()
            )
        );

        try {

            // =====================================================
            // 1 - Nothing To Reconcile
            // =====================================================

            if (
                this.indexDbTemp.size ===
                    0
            ) {

                console.log(
                    "[ProjectDashboard] EXIT processReconcileIndexDbTemp: true"
                );

                return true;

            }


            // =====================================================
            // 2 - Valid Reconciliation Prefixes
            // =====================================================

            const validPrefixes =
                [
                    "customer_mstr:",
                    "customer_flds:",
                    "customer_loce:",
                    "customer_locp:",
                    "customer_schv:",
                    "customer_wklv:",
                    "customer_maps:",
                    "customer_blpa:",
                    "customer_blpr:",
                    "customer_crpa:",
                    "customer_crpr:"
                ];


            // =====================================================
            // 3 - Process Staged Artifacts
            //     Only Artifact Types Present In Temp Are Touched
            // =====================================================

            for (
                const [
                    key,
                    artifact
                ] of this.indexDbTemp
            ) {

                const status =
                    this.indexDbTempStatus.get(
                        key
                    );


                // =================================================
                // 3.1 - Skip Completed Artifact
                // =================================================

                if (
                    status?.status ===
                        "Success"
                ) {

                    continue;

                }


                // =================================================
                // 3.2 - Resolve Artifact Prefix
                // =================================================

                const separatorIndex =
                    key.indexOf(
                        ":"
                    );

                if (
                    separatorIndex ===
                        -1
                ) {

                    console.error(
                        `[ProjectDashboard] Temporary artifact key has no prefix separator: ${key}`
                    );

                    this.indexDbTempStatus.set(
                        key,
                        {
                            status:
                                "Failed",

                            error:
                                "Artifact key has no prefix separator"
                        }
                    );

                    return false;

                }

                const artifactPrefix =
                    key.substring(
                        0,
                        separatorIndex + 1
                    );


                // =================================================
                // 3.3 - Validate Artifact Prefix
                // =================================================

                if (
                    !validPrefixes.includes(
                        artifactPrefix
                    )
                ) {

                    console.error(
                        `[ProjectDashboard] Temporary artifact prefix is not eligible for reconciliation: ${key}`
                    );

                    this.indexDbTempStatus.set(
                        key,
                        {
                            status:
                                "Failed",

                            error:
                                `Unsupported reconciliation prefix: ${artifactPrefix}`
                        }
                    );

                    return false;

                }


                // =================================================
                // 3.4 - Mark Pending
                // =================================================

                this.indexDbTempStatus.set(
                    key,
                    {
                        status:
                            "Pending"
                    }
                );


                // =================================================
                // 3.5 - Reconcile Staged Artifact
                // =================================================

                try {

                    // =============================================
                    // Get Existing Committed Keys For Prefix
                    // =============================================

                    const existingKeys =
                        await this.artifactStore.getKeysByPrefix(
                            artifactPrefix
                        );


                    // =============================================
                    // Remove Existing Committed Artifacts
                    // Only For This Staged Artifact Type
                    // =============================================

                    for (
                        const existingKey of
                            existingKeys
                    ) {

                        await this.artifactStore.delete(
                            existingKey
                        );

                    }


                    // =============================================
                    // Persist Staged Artifact
                    // =============================================

                    await this.artifactStore.put(
                        key,
                        artifact
                    );


                    // =============================================
                    // Validate Persisted Artifact
                    // =============================================

                    const persistedArtifact =
                        await this.artifactStore.get(
                            key
                        );

                    if (
                        !persistedArtifact
                    ) {

                        throw new Error(
                            `Artifact validation failed: ${key}`
                        );

                    }


                    // =============================================
                    // Mark Success
                    // =============================================

                    this.indexDbTempStatus.set(
                        key,
                        {
                            status:
                                "Success"
                        }
                    );


                    // =============================================
                    // Log Reconciliation
                    // =============================================

                    console.log(
                        "[ProjectDashboard] Reconciled Temporary Artifact:",
                        {
                            prefix:
                                artifactPrefix,

                            removedKeys:
                                existingKeys,

                            persistedKey:
                                key
                        }
                    );

                }
                catch (
                    error
                ) {

                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : String(
                                error
                            );


                    // =============================================
                    // Mark Failure
                    // =============================================

                    this.indexDbTempStatus.set(
                        key,
                        {
                            status:
                                "Failed",

                            error:
                                errorMessage
                        }
                    );

                    console.error(
                        `[ProjectDashboard] Temporary artifact reconciliation failed: ${key}`,
                        error
                    );

                    return false;

                }

            }


            // =====================================================
            // 4 - Validate Reconciliation Status
            // =====================================================

            const reconciliationIsValid =
                Array.from(
                    this.indexDbTempStatus.values()
                ).every(
                    status =>
                        status.status ===
                            "Success"
                );

            if (
                !reconciliationIsValid
            ) {

                console.error(
                    "[ProjectDashboard] Temporary IndexedDB reconciliation status validation failed:",
                    Array.from(
                        this.indexDbTempStatus.entries()
                    )
                );

                return false;

            }


            // =====================================================
            // 5 - Reconciliation Complete
            // =====================================================

            console.log(
                "[ProjectDashboard] EXIT processReconcileIndexDbTemp: true"
            );

            return true;

        }
        catch (
            error
        ) {

            console.error(
                "[ProjectDashboard] processReconcileIndexDbTemp failed:",
                error
            );

            return false;

        }

    }

    // =====================================================
    // Process Temporary State Has Changed
    // =====================================================

    private processTempHasChanged(
        activeStateTemp:
            ActiveState
    ): boolean {

        if (
            !this.activeState
        ) {

            return Boolean(
                activeStateTemp.customerId ||
                activeStateTemp.locationId ||
                activeStateTemp.eventId ||
                activeStateTemp.baselineVersion ||
                activeStateTemp.currentVersion
            );

        }

        return (
            this.activeState.customerId !==
                activeStateTemp.customerId
            ||
            this.activeState.locationId !==
                activeStateTemp.locationId
            ||
            this.activeState.eventId !==
                activeStateTemp.eventId
            ||
            this.activeState.baselineVersion !==
                activeStateTemp.baselineVersion
            ||
            this.activeState.currentVersion !==
                activeStateTemp.currentVersion
        );

    }

    // =====================================================
    // Process Clear Temporary IndexedDB
    // =====================================================

    private processClearIndexDbTemp(
        mode:
            "All" |
            "Some",
        artifactPrefixes:
            string[]
    ): void {

        // =====================================================
        // 1 - Process Clear Mode
        // =====================================================

        switch (
            mode
        ) {

            // =====================================================
            // All
            // Clear Entire Temporary Store
            // =====================================================

            case "All":

                this.indexDbTemp.clear();

                this.indexDbTempStatus.clear();

                console.log(
                    "[ProjectDashboard] Temporary IndexedDB cleared: All"
                );

                break;


            // =====================================================
            // Some
            // Clear Requested Artifact Areas
            // =====================================================

            case "Some":

                for (
                    const key of
                        Array.from(
                            this.indexDbTemp.keys()
                        )
                ) {

                    if (
                        artifactPrefixes.some(
                            prefix =>
                                key.startsWith(
                                    prefix
                                )
                        )
                    ) {

                        this.indexDbTemp.delete(
                            key
                        );

                        this.indexDbTempStatus.delete(
                            key
                        );

                    }

                }

                console.log(
                    "[ProjectDashboard] Temporary IndexedDB cleared: Some",
                    {
                        removedPrefixes:
                            artifactPrefixes,

                        remainingKeys:
                            Array.from(
                                this.indexDbTemp.keys()
                            )
                    }
                );

                break;


            // =====================================================
            // Unsupported Mode
            // =====================================================

            default:

                throw new Error(
                    `[ProjectDashboard] Unsupported temporary IndexedDB clear mode: ${mode}`
                );

        }

    }

    // =====================================================
    // Process Check Data Stores
    // =====================================================

    private processCheckDataStores(): boolean {

        console.log(
            "[ProjectDashboard] ENTER processCheckDataStores"
        );

        // =====================================================
        // Check Data Stores
        // =====================================================

        const dataStoresAreReady =
            plannedActivityDataStores.size >
                0
            &&
            currentActivityDataStores.size >
                0
            &&
            plannedResourceDataStores.size >
                0
            &&
            currentResourceDataStores.size >
                0;

        console.log(
            "[ProjectDashboard] EXIT processCheckDataStores:",
            dataStoresAreReady
        );

        return dataStoresAreReady;

    }
    
    // =====================================================
    // Process Build Data Stores
    // =====================================================

    private async processBuildDataStores(): Promise<void> {

        console.log(
            "[ProjectDashboard] ENTER processBuildDataStores"
        );

        // =====================================================
        // Validate Active State
        // =====================================================

        if (
            !this.activeState
        ) {

            throw new Error(
                "[ProjectDashboard] Active State is not available"
            );

        }

        // =====================================================
        // Validate Fields Registry
        //
        // Registry Architecture Refactor - Stage E.
        //
        // Fields Registry discovery/hydration no longer happens
        // here - processCheckRegistryKeys() / processBuildRegistryKeys()
        // already guarantee this.fieldsRegistry is resident from
        // the manifest-resolved estate before this function's
        // caller ever reaches "Build Data Stores" in the Router.
        // This is a fail-fast precondition check only - no
        // alternate discovery/fetch path.
        // =====================================================

        if (
            !this.fieldsRegistry
        ) {

            throw new Error(
                "[ProjectDashboard] Fields Registry is not available"
            );

        }

        // =====================================================
        // Build Active Baseline Artifact Keys
        // =====================================================

        const plannedActivityArtifactKey =
            `customer_blpa:customers/${this.activeState.customerId}/locations/${this.activeState.locationId}/events/${this.activeState.eventId}/schedule_versions/baseline_plans/${this.activeState.baselineVersion}/${this.activeState.baselineVersion}_activities.parquet`;

        const plannedResourceArtifactKey =
            `customer_blpr:customers/${this.activeState.customerId}/locations/${this.activeState.locationId}/events/${this.activeState.eventId}/schedule_versions/baseline_plans/${this.activeState.baselineVersion}/${this.activeState.baselineVersion}_resources.parquet`;


        // =====================================================
        // Build Active Current Artifact Keys
        // =====================================================

        const currentActivityArtifactKey =
            `customer_crpa:customers/${this.activeState.customerId}/locations/${this.activeState.locationId}/events/${this.activeState.eventId}/schedule_versions/current_plans/${this.activeState.currentVersion}/${this.activeState.currentVersion}_activities.parquet`;

        const currentResourceArtifactKey =
            `customer_crpr:customers/${this.activeState.customerId}/locations/${this.activeState.locationId}/events/${this.activeState.eventId}/schedule_versions/current_plans/${this.activeState.currentVersion}/${this.activeState.currentVersion}_resources.parquet`;
        
        // =====================================================
        // Inspect Active Artifact Keys
        // =====================================================

        console.log(
            "[ProjectDashboard] Build Data Stores - Artifact Keys:",
            {
                plannedActivityArtifactKey,
                plannedResourceArtifactKey,
                currentActivityArtifactKey,
                currentResourceArtifactKey
            }
        );

        // =====================================================
        // Read Active Data Artifacts
        // =====================================================

        let [
            plannedActivityArtifact,
            plannedResourceArtifact,
            currentActivityArtifact,
            currentResourceArtifact
        ] =
            await Promise.all([
                this.artifactStore.get(
                    plannedActivityArtifactKey
                ),
                this.artifactStore.get(
                    plannedResourceArtifactKey
                ),
                this.artifactStore.get(
                    currentActivityArtifactKey
                ),
                this.artifactStore.get(
                    currentResourceArtifactKey
                )
            ]);

        // =====================================================
        // Build Missing Data Artifact Paths
        // =====================================================

        const missingArtifactPaths:
            string[] =
                [];

        if (
            !plannedActivityArtifact
        ) {

            missingArtifactPaths.push(
                plannedActivityArtifactKey.replace(
                    "customer_blpa:",
                    ""
                )
            );

        }

        if (
            !plannedResourceArtifact
        ) {

            missingArtifactPaths.push(
                plannedResourceArtifactKey.replace(
                    "customer_blpr:",
                    ""
                )
            );

        }

        if (
            !currentActivityArtifact
        ) {

            missingArtifactPaths.push(
                currentActivityArtifactKey.replace(
                    "customer_crpa:",
                    ""
                )
            );

        }

        if (
            !currentResourceArtifact
        ) {

            missingArtifactPaths.push(
                currentResourceArtifactKey.replace(
                    "customer_crpr:",
                    ""
                )
            );

        }

        // =====================================================
        // Get Missing Data Artifacts
        // =====================================================

        if (
            missingArtifactPaths.length >
                0
        ) {

            console.log(
                "[ProjectDashboard] Missing Active Data Artifacts:",
                missingArtifactPaths
            );

            const artifactPackage =
                await getArtifactsFromAzure(
                    "Data",
                    missingArtifactPaths
                );

            // =====================================================
            // Split Azure Artifact Package
            // =====================================================

            const artifactBuffers =
                splitAzureArtifactPackage(
                    artifactPackage
                );


            // =====================================================
            // Fill Missing Active Artifacts
            // =====================================================

            if (
                !plannedActivityArtifact
            ) {

                plannedActivityArtifact =
                    artifactBuffers.get(
                        `data:${plannedActivityArtifactKey.replace(
                            "customer_blpa:",
                            ""
                        )}`
                    );

                if (
                    plannedActivityArtifact
                ) {

                    await this.artifactStore.put(
                        plannedActivityArtifactKey,
                        plannedActivityArtifact
                    );

                }

            }


            if (
                !plannedResourceArtifact
            ) {

                plannedResourceArtifact =
                    artifactBuffers.get(
                        `data:${plannedResourceArtifactKey.replace(
                            "customer_blpr:",
                            ""
                        )}`
                    );

                if (
                    plannedResourceArtifact
                ) {

                    await this.artifactStore.put(
                        plannedResourceArtifactKey,
                        plannedResourceArtifact
                    );

                }

            }


            if (
                !currentActivityArtifact
            ) {

                currentActivityArtifact =
                    artifactBuffers.get(
                        `data:${currentActivityArtifactKey.replace(
                            "customer_crpa:",
                            ""
                        )}`
                    );

                if (
                    currentActivityArtifact
                ) {

                    await this.artifactStore.put(
                        currentActivityArtifactKey,
                        currentActivityArtifact
                    );

                }

            }


            if (
                !currentResourceArtifact
            ) {

                currentResourceArtifact =
                    artifactBuffers.get(
                        `data:${currentResourceArtifactKey.replace(
                            "customer_crpr:",
                            ""
                        )}`
                    );

                if (
                    currentResourceArtifact
                ) {

                    await this.artifactStore.put(
                        currentResourceArtifactKey,
                        currentResourceArtifact
                    );

                }

            }

            console.log(
                "[ProjectDashboard] Missing Active Data Artifacts Stored:",
                Array.from(
                    artifactBuffers.keys()
                )
            );

        }

        // =====================================================
        // Validate Active Data Artifacts
        // =====================================================

        if (
            !plannedActivityArtifact ||
            !plannedResourceArtifact ||
            !currentActivityArtifact ||
            !currentResourceArtifact
        ) {

            throw new Error(
                "[ProjectDashboard] Active data artifacts are not available"
            );

        }

        // =====================================================
        // Decode Active Data Artifacts
        // =====================================================

        const [
            plannedActivities,
            plannedResources,
            currentActivities,
            currentResources
        ] =
            await Promise.all([
                decodeParquetArtifact(
                    plannedActivityArtifact
                ) as Promise<Record<string, unknown>[]>,
                decodeParquetArtifact(
                    plannedResourceArtifact
                ) as Promise<Record<string, unknown>[]>,
                decodeParquetArtifact(
                    currentActivityArtifact
                ) as Promise<Record<string, unknown>[]>,
                decodeParquetArtifact(
                    currentResourceArtifact
                ) as Promise<Record<string, unknown>[]>
            ]);

        // =====================================================
        // Application Terminal Gate
        //
        // A terminated instance must not publish into the
        // shared module-level data stores.
        // =====================================================

        if (
            this.applicationTerminated
        ) {

            return;

        }

        // =====================================================
        // Build Planned Activity Column Stores
        // =====================================================

        processBuildColumnDataStores(
            plannedActivities,
            this.fieldsRegistry.activities.fields,
            plannedActivityDataStores
        );

        // =====================================================
        // Build Current Activity Column Stores
        // =====================================================

        processBuildColumnDataStores(
            currentActivities,
            this.fieldsRegistry.activities.fields,
            currentActivityDataStores
        );

        // =====================================================
        // Build Planned Resource Column Stores
        // =====================================================

        processBuildColumnDataStores(
            plannedResources,
            this.fieldsRegistry.resources.fields,
            plannedResourceDataStores
        );

        // =====================================================
        // Build Current Resource Column Stores
        // =====================================================

        processBuildColumnDataStores(
            currentResources,
            this.fieldsRegistry.resources.fields,
            currentResourceDataStores
        );

        // =====================================================
        // Inspect Built Data Stores
        // =====================================================

        console.log(
            "[ProjectDashboard] Data Stores Built:",
            {
                plannedActivities: {
                    columns:
                        plannedActivityDataStores.size,

                    rows:
                        plannedActivityDataStores
                            .values()
                            .next()
                            .value
                            ?.size ?? 0
                },

                currentActivities: {
                    columns:
                        currentActivityDataStores.size,

                    rows:
                        currentActivityDataStores
                            .values()
                            .next()
                            .value
                            ?.size ?? 0
                },

                plannedResources: {
                    columns:
                        plannedResourceDataStores.size,

                    rows:
                        plannedResourceDataStores
                            .values()
                            .next()
                            .value
                            ?.size ?? 0
                },

                currentResources: {
                    columns:
                        currentResourceDataStores.size,

                    rows:
                        currentResourceDataStores
                            .values()
                            .next()
                            .value
                            ?.size ?? 0
                }
            }
        );

        console.log(
            "[ProjectDashboard] EXIT processBuildDataStores"
        );

    }

    // =====================================================
    // Process Tab Change
    // =====================================================
    
    private processTabChange(
        slot: number
    ): void {
        // =====================================================
        // Update Selected Tab
        // =====================================================
        const tabs =
            this.ctrTabsHeader.querySelectorAll(
                ".project-dashboard-tabs-tab"
            );
        tabs.forEach(
            tab => {
                tab.classList.remove(
                    "project-dashboard-tabs-tab-selected"
                );
            }
        );
        const selectedTab =
            this.ctrTabsHeader.querySelector(
                `[data-tab-index="${slot}"]`
            );
        selectedTab?.classList.add(
            "project-dashboard-tabs-tab-selected"
        );
        // =====================================================
        // Build Tab Change Payload
        // =====================================================
        const payload =
            {
                PayloadToPCFGroup:
                    "Data",
                PayloadToPCFType:
                    `Change|${Date.now()}`,
                PayloadToPCFMode:
                    "",
                PayloadToPCFSubMode:
                    "",
                PayloadToPCFSubModePath:
                    "",
                PayloadToPCFDataOne:
                    "",
                PayloadToPCFDataTwo:
                    "",
                PayloadToPCFDataThree:
                    "",
                PayloadToPCFDataFour:
                    "",
                PayloadToPCFViewIndex:
                    slot,
                PayloadToPCFViewContext:
                    "",
                PayloadToPCFDecodedArtifactData:
                    "",
                PayloadToPCFUserEmail:
                    this.payloadUserEmail
            };
        this.pcfModeIncomingPayloadJson =
            JSON.stringify(
                payload
            );
        this.outputChangeType =
            7;
        this.processNotifyOutputChanged();
    }

    // =====================================================
    // Process Build User Tabs
    // =====================================================

    private processBuildUserTabs(
        mode:
            "Build" | "Click",

        selectedSlot:
            number,

        activeStateIsReady:
        boolean
    ): void {

        if (
            !this.currentUserProfile
        ) {

            return;

        }

        buildTabs(
            this.ctrTabsHeader,
            this.currentUserProfile.defaultDashboardTabConfig,
            selectedSlot,
            () =>
                this.previousPCFModeViewIndex,
            this.processTabChange.bind(
                this
            ),
            activeStateIsReady,
            mode
        );

    }

    // =====================================================
    // Process Check User Access
    // =====================================================

    private processCheckUserAccess(
        checkType:
            string
    ): boolean {

        if (
            !this.currentUserProfile ||
            !this.currentUser ||
            !this.activeState
        ) {

            return false;

        }

        // =====================================================
        // Global Admin Access
        // =====================================================

        if (
            this.currentUser.globalAccessKeys.includes(
                "admin-all"
            )
        ) {

            return true;

        }

        // =====================================================
        // Global Customer Access
        // =====================================================

        if (
            this.currentUserProfile
                .customerAccessKeys
                .includes(
                    "all|all|all|all"
                )
        ) {

            return true;

        }

        // =====================================================
        // Get Access Action Definition
        // =====================================================

        const accessActionDefinition =
            accessActionDefinitions.find(
                definition =>
                    definition.action ===
                        checkType
            );

        if (
            !accessActionDefinition
        ) {

            return false;

        }

        // =====================================================
        // Build Approved Access Keys
        // =====================================================

        const approvedAccessKeys =
            accessActionDefinition.buildAccessKeys(
                this.activeState
            );

        // =====================================================
        // Check User Access Keys
        // =====================================================

        return approvedAccessKeys.some(
            accessKey =>
                this.currentUserProfile!
                    .customerAccessKeys
                    .includes(
                        accessKey
                    )
        );

    }

    // =====================================================
    // Process Retry status
    // =====================================================

    private processRetryStatus(
        terminalRetryCount: number,
        onTerminalFailure: () => void
    ): boolean {

        const retryCount =
            Number(
                this.payloadType.split("-").pop()
            );

        if (
            retryCount >=
            terminalRetryCount
        ) {

            onTerminalFailure();

            this.pcfModeViewLoadingIsComplete =
                true;

            this.processEvent(
                400,
                {}
            );

            return false;

        }

        this.processEvent(
            400,
            {}
        );

        return true;

    }

    // =====================================================
    // Process Event
    // =====================================================

    private async processEvent(
        eventType: number,
        payload: object
    ): Promise<void> {

        // =========================================================
        // Application Terminal Gate
        //
        // A terminated instance must not begin new event work.
        // =========================================================

        if (
            this.applicationTerminated
        ) {

            return;

        }

        /*
            Event Type

            0 = None
            1 = CRUD
            200 = Success shot
            400 = Error shot

        */

        console.log(
            "[ProjectDashboard] processEvent - Event Type:",
            eventType
        );

        console.log(
            "[ProjectDashboard] processEvent - Payload:",
            payload
        );

        // Status events do not require an outgoing payload - fire event and exit
        if (
            eventType ===
                200
        ) {

            this.processDispatchPCFModeEvent(
                "PCFModeEventSendStatus200"
            );

            console.log(
                "[ProjectDashboard] processEvent - Status 200 event fired"
            );

            return;

        }

        if (
            eventType ===
                400
        ) {

            this.processDispatchPCFModeEvent(
                "PCFModeEventSendStatus400"
            );

            console.log(
                "[ProjectDashboard] processEvent - Status 400 event fired"
            );

            return;

        }

        if (
            eventType ===
                911
        ) {

            this.processDispatchPCFModeEvent(
                "PCFModeEventSendStatus911"
            );

            console.log(
                "[ProjectDashboard] processEvent - Status 911 event fired"
            );

            return;

        }


        // =========================================================
        // Build Outgoing Payload
        // =========================================================

        this.pcfModeOutgoingPayloadJson =
            JSON.stringify(
                payload
            );

        console.log(
            "[ProjectDashboard] processEvent - Outgoing JSON:",
            this.pcfModeOutgoingPayloadJson
        );


        // =========================================================
        // Publish Outgoing Payload
        // =========================================================

        this.outputChangeType =
            6;

        this.routeEchoSource = "Process Event"
        this.routeStatus = 100;
        this.processNotifyOutputChanged();

        // =========================================================
        // Application Terminal Gate
        //
        // Accounts for possible synchronous host re-entry during
        // notification.
        // =========================================================

        if (
            this.applicationTerminated
        ) {

            return;

        }

        console.log(
            "[ProjectDashboard] processEvent - Output notified"
        );


        // =========================================================
        // Wait For Output Synchronization
        // =========================================================

        let attempt =
            0;

        const maxAttempts =
            25;

        while (
            (
                this.context.parameters
                    .PCFModeOutgoingPayloadJson.raw ??
                ""
            ) !==
            this.pcfModeOutgoingPayloadJson
            &&
            attempt <
                maxAttempts
        ) {

            await new Promise<void>(
                resolve => {

                    setTimeout(
                        resolve,
                        20
                    );

                }
            );

            if (
                this.applicationTerminated
            ) {

                return;

            }

            attempt++;

        }


        // =========================================================
        // Validate Output Synchronization
        // =========================================================

        if (
            (
                this.context.parameters
                    .PCFModeOutgoingPayloadJson.raw ??
                ""
            ) !==
            this.pcfModeOutgoingPayloadJson
        ) {

            console.error(
                "[ProjectDashboard] processEvent - Payload synchronization failed"
            );

        }

        console.log(
            "[ProjectDashboard] processEvent - Payload synchronized after attempts:",
            attempt
        );


        // =========================================================
        // Route Event
        // =========================================================

        switch (
            eventType
        ) {

            // CRUD
            case 1:

                this.processDispatchPCFModeEvent(
                    "PCFModeEventCrud"
                );

                console.log(
                    "[ProjectDashboard] processEvent - CRUD event fired"
                );

                break;


            // Status 200
            case 200:

                this.processDispatchPCFModeEvent(
                    "PCFModeEventSendStatus200"
                );

                console.log(
                    "[ProjectDashboard] processEvent - Status 200 event fired"
                );

                break;


            // Status 400
            case 400:

                this.processDispatchPCFModeEvent(
                    "PCFModeEventSendStatus400"
                );

                console.log(
                    "[ProjectDashboard] processEvent - Status 400 event fired"
                );

                break;

            // Status 911
            case 911:

                this.processDispatchPCFModeEvent(
                    "PCFModeEventSendStatus911"
                );

                console.log(
                    "[ProjectDashboard] processEvent - Status 911 event fired"
                );

                break;

            default:

                console.warn(
                    "[ProjectDashboard] processEvent - Unknown Event Type:",
                    eventType
                );

                break;

        }

    }

    // =====================================================
    // Process Get Outputs
    // =====================================================

    public getOutputs(): IOutputs {

        /*
            Output Change Type

            0 = None
            1 = View Type
            2 = View Info JSON
            3 = View Index
            4 = View Context JSON
            5 = View Loading Is Complete
            6 = Outgoing Payload JSON
        */

        let outputs:
            IOutputs = {};

        switch (
            this.outputChangeType
        ) {

            case 1:

                this.outputChangeType =
                    0;

                return {
                    PCFModeViewType:
                        this.pcfModeViewType
                };


            case 2:

                this.outputChangeType =
                    0;

                return {
                    PCFModeViewInfoJson:
                        this.pcfModeViewInfoJson
                };


            case 3:

                this.outputChangeType =
                    0;

                return {
                    PCFModeViewIndex:
                        this.pcfModeViewIndex
                };


            case 4:

                this.outputChangeType =
                    0;

                return {
                    PCFModeViewContextJson:
                        this.pcfModeViewContextJson
                };


            case 5:

                this.outputChangeType =
                    0;

                return {
                    PCFModeViewLoadingIsComplete:
                        this.pcfModeViewLoadingIsComplete
                };


            case 6:

                this.outputChangeType =
                    0;

                return {
                    PCFModeOutgoingPayloadJson:
                        this.pcfModeOutgoingPayloadJson
                };

            case 7:

                this.outputChangeType =
                    0;

                return {
                    PCFModeIncomingPayloadJson:
                        this.pcfModeIncomingPayloadJson
                };


            default:

                outputs = {};

                break;

        }

        // Clear Output Change Type
        this.outputChangeType = 0;

        return outputs;

    }

    // =====================================================
    // Destroy
    // =====================================================

    public destroy(): void {

        // =====================================================
        // Application Terminal State
        //
        // Established first, before any teardown step, so that
        // async continuations checking this flag never observe
        // a partially-terminal instance.
        // =====================================================

        this.applicationTerminated =
            true;


        // =====================================================
        // Terminal Dashboard Kill
        //
        // PCF termination is non-selective. Every dashboard kill
        // helper is invoked unconditionally, regardless of which
        // dashboard (if any) is currently active. Each kill
        // helper is safe to call whether or not that dashboard
        // was ever built.
        // =====================================================

        processKillDashboardOne();
        processKillDashboardTwo();
        processKillDashboardThree();
        processKillDashboardFour();
        processKillDashboardFive();
        processKillDashboardSix();
        processKillDashboardTen();


        // =====================================================
        // Close Artifact Store
        //
        // Terminal for this PCF instance. Closes the managed
        // IndexedDB connection only - persisted data is not
        // cleared, deleted, or invalidated.
        // =====================================================

        this.artifactStore.close();


        // =====================================================
        // Remove Root DOM
        // =====================================================

        this.container.replaceChildren();

    }

    // =====================================================
    // Resize
    // =====================================================

    private resizeContainer(
        context:
            ComponentFramework.Context<IInputs>
    ): void {

        const height =
            context.mode.allocatedHeight;

        const width =
            context.mode.allocatedWidth;

        this.container.style.height =
            height > 0
                ? `${height}px`
                : "100%";

        this.container.style.width =
            width > 0
                ? `${width}px`
                : "100%";

    }


    // ========================================
    // Process Dashboard Special Mode
    // ========================================

    private async processDashboardSpecialMode(
        mode:
            string,

        subMode:
            "Enter" |
            "Leave",

        callingButtons:
            HTMLButtonElement[] =
                [],

        affectedContainers:
            HTMLElement[] =
                []
    ): Promise<void> {

        // ========================================
        // Route By Dashboard Slot
        // ========================================

        switch (
            this.payloadViewIndex
        ) {

            // ========================================
            // Dashboard Ten - Slot 9
            // ========================================

            case 9:

                // ========================================
                // Route By Special Mode
                // ========================================

                switch (
                    mode
                ) {

                    // ========================================
                    // Max
                    // ========================================

                    case "Max":

                        // ========================================
                        // Route By Sub Mode
                        // ========================================

                        switch (
                            subMode
                        ) {

                            // ----------------------------------------
                            // Enter
                            // ----------------------------------------

                            case "Enter":

                                // Hide Application Header

                                this.ctrApplicationHeader.classList.add(
                                    "application-hidden"
                                );


                                // Hide Tabs Header

                                this.ctrTabsHeader.classList.add(
                                    "application-hidden"
                                );


                                // Update Calling Button

                                callingButtons[0].title =
                                    "Restore Dashboard";

                                callingButtons[0].innerHTML =
                                    `
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="
                                                M9 3v6H3
                                                M15 3v6h6
                                                M9 21v-6H3
                                                M15 21v-6h6
                                            "
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                    `;

                                break;


                            // ----------------------------------------
                            // Leave
                            // ----------------------------------------

                            case "Leave":

                                // ----------------------------------------
                                // Restore Dashboard Ten Parent Map
                                // ----------------------------------------

                                await processDashboardTenRestoreSuperMaxParentView();

                                // Show Application Header

                                this.ctrApplicationHeader.classList.remove(
                                    "application-hidden"
                                );


                                // Show Tabs Header

                                this.ctrTabsHeader.classList.remove(
                                    "application-hidden"
                                );


                                // Update Calling Button

                                callingButtons[0].title =
                                    "Expand Dashboard";

                                callingButtons[0].innerHTML =
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

                                break;


                            // ----------------------------------------
                            // Trap
                            // ----------------------------------------

                            default:

                                console.error(
                                    "[ProjectDashboard] Unsupported Dashboard Special Sub Mode:",
                                    subMode
                                );

                                return;

                        }

                        break;


                    // ========================================
                    // SuperMax
                    // ========================================

                    case "SuperMax":

                        // ========================================
                        // Route By Sub Mode
                        // ========================================

                        switch (
                            subMode
                        ) {

                            // ----------------------------------------
                            // Enter
                            // ----------------------------------------

                            case "Enter":

                            // Hide Application Header

                            this.ctrApplicationHeader.classList.add(
                                "application-hidden"
                            );


                            // Hide Tabs Header

                            this.ctrTabsHeader.classList.add(
                                "application-hidden"
                            );


                            callingButtons[0].title =
                                "Exit SuperMax";

                            callingButtons[0].innerHTML =
                                `
                                <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="
                                            M5 5
                                            L19 19
                                            M19 5
                                            L5 19
                                        "
                                        fill="none"
                                        stroke="#ff0000"
                                        stroke-width="2.4"
                                        stroke-linecap="round"
                                    />
                                </svg>
                                `;

                                break;


                            // ----------------------------------------
                            // Leave
                            // ----------------------------------------

                            case "Leave":

                                // Show Application Header

                                this.ctrApplicationHeader.classList.remove(
                                    "application-hidden"
                                );


                                // Show Tabs Header

                                this.ctrTabsHeader.classList.remove(
                                    "application-hidden"
                                );


                                // Restore Calling Button

                                callingButtons[0].title =
                                    "Enter SuperMax";

                                callingButtons[0].innerHTML =
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

                                break;


                            // ----------------------------------------
                            // Trap
                            // ----------------------------------------

                            default:

                                console.error(
                                    "[ProjectDashboard] Unsupported Dashboard Special Sub Mode:",
                                    subMode
                                );

                                return;

                        }

                        break;


                    // ========================================
                    // Trap
                    // ========================================

                    default:

                        console.error(
                            "[ProjectDashboard] Unsupported Dashboard Special Mode:",
                            mode
                        );

                        return;

                }

                break;


            // ========================================
            // Trap
            // ========================================

            default:

                console.error(
                    "[ProjectDashboard] Unsupported Dashboard Special Mode Slot:",
                    this.payloadViewIndex
                );

                return;

        }

    }


}

