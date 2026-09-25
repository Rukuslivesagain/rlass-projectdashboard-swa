import {
    CustomersRegistry,
    CustomerMasterRegistry,
    ActiveState,
    ScheduleVersionsRegistry,
    LocationEventsRegistry,
    CustomerMasterEvent,
    ResolvedRegistryDefinition
} from "../models/registries";

import { FieldsRegistry } from "../helpers/fields";

import {
    AzureArtifactError
} from "../helpers/azure";

import {
    processResolveCustomerRegistryManifest
} from "../helpers/registryManifest";

import {
    ProjectDashboardArtifactStoreTerminalError
} from "../helpers/artifactStore";


// =====================================================
// Notification Overlay Mode
// =====================================================

export type ProjectDashboardNotificationOverlayMode =
    "OkOnly" |
    "CloseOnly" |
    "YesNo" |
    "RetryCancel";


// =====================================================
// Notification Overlay Actions
// =====================================================

export interface ProjectDashboardNotificationOverlayActions {

    onOk?:
        () => void;

    onClose?:
        () => void;

    onYes?:
        () => void;

    onNo?:
        () => void;

    onRetry?:
        () => void;

    onCancel?:
        () => void;

}


export interface ProjectDashboardUploadOverlayConfig {

    rowCount:
        number;

    activityCount?:
        number;

    resourceCount?:
        number;

    customerId:
        string;

    locationId:
        string;

    eventId:
        string;

    steps:
        string[];

    panelClass?:
        string;

}

// =====================================================
// Overlay - Modes
// =====================================================

export type ProjectDashboardOverlayMode =
    "CreateVersion" |
    "UploadWorklist" |
    "Settings";


// =====================================================
// 1 - Build Version Overlay
// =====================================================

export function buildUploadOverlay(
    container:
        HTMLDivElement,

    mode:
        ProjectDashboardOverlayMode,

    config?:
        ProjectDashboardUploadOverlayConfig
): {

    overlay:
        HTMLDivElement;

    body:
        HTMLDivElement;

    progress:
        HTMLDivElement | null;

    close:
        () => void;
} {

    const ctrOverlay =
        document.createElement(
            "div"
        );

    ctrOverlay.className =
        "project-dashboard-overlay";


    const ctrOverlayPanel =
        document.createElement(
            "div"
        );

    ctrOverlayPanel.className =
        "project-dashboard-overlay-panel";

    if (
        config?.panelClass
    ) {

        ctrOverlayPanel.classList.add(
            config.panelClass
        );

    }


    const ctrOverlayHeader =
        document.createElement(
            "div"
        );

    ctrOverlayHeader.className =
        "project-dashboard-overlay-header";


    const ctrOverlayBody =
        document.createElement(
            "div"
        );

    ctrOverlayBody.className =
        "project-dashboard-overlay-body";


    const ctrOverlayFooter =
        document.createElement(
            "div"
        );

    ctrOverlayFooter.className =
        "project-dashboard-overlay-footer";


    const btnOverlaySave =
        document.createElement(
            "button"
        );

    btnOverlaySave.type =
        "button";

    btnOverlaySave.className =
        "project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-create project-dashboard-overlay-save";

    btnOverlaySave.textContent =
        mode ===
        "UploadWorklist"
            ? "Save Upload"
            : "Save Version";


    const btnOverlayCancel =
        document.createElement(
            "button"
        );

    btnOverlayCancel.type =
        "button";

    btnOverlayCancel.className =
        "project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-cancel project-dashboard-overlay-cancel";

    btnOverlayCancel.textContent =
        "Cancel";


    // =====================================================
    // Mode Header
    // =====================================================

    if (
        mode ===
        "CreateVersion"
    ) {

        ctrOverlayHeader.textContent =
            "Create Version";

    }
    else if (
        mode ===
        "UploadWorklist"
    ) {

        ctrOverlayHeader.textContent =
            "Upload Worklist";

    }
    else {

        ctrOverlayHeader.textContent =
            "Settings";

    }


    // =====================================================
    // Upload Summary / Progress
    // =====================================================

    let ctrUploadProgress:
        HTMLDivElement | null =
            null;

    if (
        config &&
        (
            mode ===
                "UploadWorklist" ||
            mode ===
                "CreateVersion"
        )
    ) {

        // =================================================
        // Upload Summary
        // =================================================

        const ctrUploadSummary =
            document.createElement(
                "div"
            );

        ctrUploadSummary.className =
            "project-dashboard-overlay-upload-summary";


        const ctrUploadSummaryRows =
            document.createElement(
                "div"
            );

        ctrUploadSummaryRows.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryRows.textContent =
            `Rows: ${config.rowCount}`;


        // =================================================
        // Upload Summary - Activities / Resources
        // Schedule Callers Only - Rows Above Covers Worklist
        // =================================================

        const ctrUploadSummaryActivities =
            document.createElement(
                "div"
            );

        ctrUploadSummaryActivities.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryActivities.textContent =
            `Activities (${config.activityCount})`;


        const ctrUploadSummaryResources =
            document.createElement(
                "div"
            );

        ctrUploadSummaryResources.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryResources.textContent =
            `Resources (${config.resourceCount})`;


        const ctrUploadSummaryCustomer =
            document.createElement(
                "div"
            );

        ctrUploadSummaryCustomer.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryCustomer.textContent =
            `Customer: ${config.customerId}`;


        const ctrUploadSummaryLocation =
            document.createElement(
                "div"
            );

        ctrUploadSummaryLocation.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryLocation.textContent =
            `Location: ${config.locationId}`;


        const ctrUploadSummaryEvent =
            document.createElement(
                "div"
            );

        ctrUploadSummaryEvent.className =
            "project-dashboard-overlay-upload-summary-row";

        ctrUploadSummaryEvent.textContent =
            `Event: ${config.eventId}`;


        if (
            config.activityCount !==
                undefined &&
            config.resourceCount !==
                undefined
        ) {

            ctrUploadSummary.append(
                ctrUploadSummaryActivities,
                ctrUploadSummaryResources,
                ctrUploadSummaryCustomer,
                ctrUploadSummaryLocation,
                ctrUploadSummaryEvent
            );

        }
        else {

            ctrUploadSummary.append(
                ctrUploadSummaryRows,
                ctrUploadSummaryCustomer,
                ctrUploadSummaryLocation,
                ctrUploadSummaryEvent
            );

        }


        // =================================================
        // Upload Progress
        // =================================================

        ctrUploadProgress =
            document.createElement(
                "div"
            );

        ctrUploadProgress.className =
            "project-dashboard-overlay-upload-progress";


        config.steps.forEach(
            (
                step,
                index
            ) => {

                const ctrProgressStep =
                    document.createElement(
                        "div"
                    );

                ctrProgressStep.className =
                    "project-dashboard-overlay-upload-progress-step";

                ctrProgressStep.dataset.step =
                    String(
                        index
                    );


                const ctrProgressStatus =
                    document.createElement(
                        "span"
                    );

                ctrProgressStatus.className =
                    "project-dashboard-overlay-upload-progress-status";

                ctrProgressStatus.textContent =
                    "○";


                const ctrProgressText =
                    document.createElement(
                        "span"
                    );

                ctrProgressText.className =
                    "project-dashboard-overlay-upload-progress-text";

                ctrProgressText.textContent =
                    step;


                ctrProgressStep.append(
                    ctrProgressStatus,
                    ctrProgressText
                );

                ctrUploadProgress!.appendChild(
                    ctrProgressStep
                );

            }
        );


        // =================================================
        // Assemble Upload Body
        // =================================================

        ctrOverlayBody.append(
            ctrUploadSummary,
            ctrUploadProgress
        );

    }


    // =====================================================
    // Close
    // =====================================================

    const closeOverlay =
        (): void => {

            ctrOverlay.remove();

            container.classList.remove(
                "project-dashboard-overlay-open"
            );

        };


    btnOverlayCancel.addEventListener(
        "click",
        closeOverlay
    );


    // =====================================================
    // Assemble
    // =====================================================

    ctrOverlayFooter.append(
        btnOverlaySave,
        btnOverlayCancel
    );

    ctrOverlayPanel.append(
        ctrOverlayHeader,
        ctrOverlayBody,
        ctrOverlayFooter
    );

    ctrOverlay.appendChild(
        ctrOverlayPanel
    );

    // =====================================================
    // Mount
    // =====================================================

    container.classList.add(
        "project-dashboard-overlay-open"
    );

    container.appendChild(
        ctrOverlay
    );


    // =====================================================
    // Return
    // =====================================================

    return {
        overlay:
            ctrOverlay,

        body:
            ctrOverlayBody,

        progress:
            ctrUploadProgress,

        close:
            closeOverlay
    };

}

// =====================================================
// 2 - Build Settings Overlay
// =====================================================

export function buildSettingsOverlay(
    container:
        HTMLDivElement,

    processSendStatus300:
        () => void,

    processGetArtifact:
        (
            artifactType:
                "Registry" |
                "Map",

            artifactPath:
                string,

            storageTarget:
                "IndexDB" |
                "Temp",

            // =====================================================
            // Registry Architecture Refactor - Stage G.
            // =====================================================

            freshnessMode?:
                "Cache" |
                "ValidateFreshness",

            // =====================================================
            // Registry Architecture Refactor - Setup Location
            // Bootstrap.
            // =====================================================

            residentArtifactKey?:
                string
        ) => Promise<ArrayBuffer>,

    processSetActiveState:
        (
            activeState:
                ActiveState
        ) => Promise<void>,

    processCheckActiveState:
        () => Promise<boolean>,

    processRefreshCustomerRegistries:
        () => Promise<void>,

    invokedFromPCF =
        false,

    headerText =
        "Settings",

    customersRegistry:
        CustomersRegistry | null =
            null,

    activeState:
        ActiveState | null =
            null,

    uploadWizardIsActive:
        () => boolean,

    processReconcileIndexDbTemp:
        () => Promise<boolean>,
        
    processClearIndexDbTemp:
        (
            mode:
                "All" |
                "Some",

            artifactPrefixes:
                string[]
        ) => void,

    processTempHasChanged:
    (
        activeStateTemp:
            ActiveState
    ) => boolean,

    processLoadNewScheduleState: () => void,

    // =====================================================
    // Registry Architecture Refactor - Stage F.
    //
    // Resident Location Events lookups only - no Azure
    // retrieval, no path construction, no manifest
    // interpretation, no fallback to legacy
    // CustomerMasterLocation.events.
    // =====================================================

    processGetLocationEventsRegistry:
        (
            locationId:
                string
        ) => LocationEventsRegistry | null,

    processGetLocationEvent:
        (
            locationId:
                string,

            eventId:
                string
        ) => CustomerMasterEvent | null,

    // =====================================================
    // Setup Location Bootstrap.
    //
    // Decodes a resolved registry artifact into resident
    // application state (existing Stage E hydration owner) - no
    // duplicated decode/dispatch/identity-validation logic here.
    // =====================================================

    processHydrateResidentRegistry:
        (
            resolvedRegistry:
                ResolvedRegistryDefinition,

            registryArtifact:
                ArrayBuffer
        ) => void,

    // =====================================================
    // Establish Resident Customer Master Registry.
    //
    // Settings owns an overlay-local Customer Master for its own
    // cascade (Fields discovery, Main Map, Location/Event
    // resolution). The class-level resident Customer Master
    // authority consumed by processHydrateResidentRegistry's
    // identity validator is a separate field, otherwise
    // established only by processCheckRegistryKeys() during
    // normal Dashboard routing. Called once Settings' own
    // overlay-local Customer Master has been retrieved, decoded,
    // and validated against the selected Customer - before any
    // Location-scoped registry reaches processHydrateResidentRegistry.
    // =====================================================

    processSetResidentCustomerMasterRegistry:
        (
            customerMasterRegistry:
                CustomerMasterRegistry
        ) => void

): void {

    // =====================================================
    // Overlay
    // =====================================================

    const ctrOverlay =
        document.createElement(
            "div"
        );

    ctrOverlay.className =
        "project-dashboard-overlay project-dashboard-settings-overlay";


    // =====================================================
    // 1 - Resolve Settings Artifact Storage Target
    // =====================================================

    const artifactStorageTarget:
        "IndexDB" |
        "Temp" = "Temp";


    // =====================================================
    // 2 - Build Temporary Active State
    //     Overlay-Local Working State
    // =====================================================

    const activeStateTemp:
        ActiveState = {

            customerId:
                activeState?.customerId ??
                "",

            locationId:
                activeState?.locationId ??
                "",

            eventId:
                activeState?.eventId ??
                "",

            baselineVersion:
                activeState?.baselineVersion ??
                "",

            currentVersion:
                activeState?.currentVersion ??
                ""

        };


    // =====================================================
    // 3 - Block Interaction Behind Modal
    // =====================================================

    ctrOverlay.addEventListener(
        "pointerdown",
        (
            event
        ) => {

            event.stopPropagation();

        }
    );

    ctrOverlay.addEventListener(
        "click",
        (
            event
        ) => {

            event.stopPropagation();

        }
    );


    // =====================================================
    // 4 - Panel
    // =====================================================

    const ctrOverlayPanel =
        document.createElement(
            "div"
        );

    ctrOverlayPanel.className =
        "project-dashboard-overlay-panel";


    // =====================================================
    // 5 - Header
    // =====================================================

    const ctrOverlayHeader =
        document.createElement(
            "div"
        );

    ctrOverlayHeader.className =
        "project-dashboard-overlay-header";

    ctrOverlayHeader.textContent =
        headerText;


    // =====================================================
    // 6 - Body
    // =====================================================

    const ctrOverlayBody =
        document.createElement(
            "div"
        );

    ctrOverlayBody.className =
        "project-dashboard-overlay-body";


    // =====================================================
    // 7 - Settings Fields
    // =====================================================

    const ctrSettingsFields =
        document.createElement(
            "div"
        );

    ctrSettingsFields.className =
        "project-dashboard-settings-fields";


    // =====================================================
    // 8 - Customer
    // =====================================================

    const lblCustomer =
        document.createElement(
            "label"
        );

    lblCustomer.className =
        "project-dashboard-settings-label";

    lblCustomer.textContent =
        "Customer";


    const selCustomer =
        document.createElement(
            "select"
        );

    selCustomer.className =
        "project-dashboard-settings-select";


    const optCustomerPlaceholder =
        document.createElement(
            "option"
        );

    optCustomerPlaceholder.value =
        "";

    optCustomerPlaceholder.textContent =
        "Select Customer";

    selCustomer.appendChild(
        optCustomerPlaceholder
    );


    // =====================================================
    // 8.1 - Resolve Active Customers
    // =====================================================

    const activeCustomers =
        customersRegistry
            ?.customers
            ?.filter(
                customer =>
                    customer.active
            ) ??
        [];


    // =====================================================
    // 8.2 - Handle Customer Availability
    // =====================================================

    if (
        activeCustomers.length ===
            0
    ) {

        optCustomerPlaceholder.textContent =
            "No Customers Available";

        selCustomer.disabled =
            true;

    }
    else {

        activeCustomers.forEach(
            customer => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    customer.customerId;

                option.textContent =
                    customer.customerName;

                selCustomer.appendChild(
                    option
                );

            }
        );

    }


    selCustomer.classList.add(
        "application-capitalize"
    );


    // =====================================================
    // 9 - Set Temporary Customer
    // =====================================================

    if (
        activeStateTemp.customerId
    ) {

        selCustomer.value =
            activeStateTemp.customerId;

    }


    // =====================================================
    // 10 - Location
    // =====================================================

    const lblLocation =
        document.createElement(
            "label"
        );

    lblLocation.className =
        "project-dashboard-settings-label";

    lblLocation.textContent =
        "Location";


    const selLocation =
        document.createElement(
            "select"
        );

    selLocation.className =
        "project-dashboard-settings-select";

    selLocation.disabled =
        true;

    selLocation.classList.add(
        "application-capitalize"
    );


    // =====================================================
    // 11 - Event
    // =====================================================

    const lblEvent =
        document.createElement(
            "label"
        );

    lblEvent.className =
        "project-dashboard-settings-label";

    lblEvent.textContent =
        "Event";


    const selEvent =
        document.createElement(
            "select"
        );

    selEvent.className =
        "project-dashboard-settings-select";

    selEvent.disabled =
        true;

    selEvent.classList.add(
        "application-capitalize"
    );


    // =====================================================
    // 12 - Baseline Plan
    // =====================================================

    const lblBaseline =
        document.createElement(
            "label"
        );

    lblBaseline.className =
        "project-dashboard-settings-label";

    lblBaseline.textContent =
        "Baseline Plan";


    const selBaseline =
        document.createElement(
            "select"
        );

    selBaseline.className =
        "project-dashboard-settings-select";

    selBaseline.disabled =
        true;

    selBaseline.classList.add(
        "application-capitalize"
    );


    // =====================================================
    // 13 - Current Plan
    // =====================================================

    const lblCurrent =
        document.createElement(
            "label"
        );

    lblCurrent.className =
        "project-dashboard-settings-label";

    lblCurrent.textContent =
        "Current Plan";


    const selCurrent =
        document.createElement(
            "select"
        );

    selCurrent.className =
        "project-dashboard-settings-select";

    selCurrent.disabled =
        true;

    selCurrent.classList.add(
        "application-capitalize"
    );


    // =====================================================
    // 14 - Customer Master Registry
    //     Overlay-Local Runtime Registry
    // =====================================================

    let customerMasterRegistry:
        CustomerMasterRegistry | null =
            null;


    // =====================================================
    // 15 - Settings Cascade Processing State
    // =====================================================

    let isProcessingCustomer =
        false;

    let isProcessingLocation =
        false;

    let isProcessingEvent =
        false;


    // =====================================================
    // 16 - Customer Change
    // =====================================================

    let selectedCustomerId =
        "";

    selCustomer.addEventListener(
        "change",
        async () => {

            // =====================================================
            // 16.1 - Customer Processing Gate
            // =====================================================

            if (
                isProcessingCustomer
            ) {

                return;

            }

            isProcessingCustomer =
                true;

            selCustomer.disabled =
                true;

            try {

                const customerId =
                    selCustomer.value;


            // =====================================================
            // 15.1 - Customer Has Not Changed
            // =====================================================

            if (
                customerId ===
                    selectedCustomerId
            ) {

                return;

            }


            // =====================================================
            // 15.2 - Determine Customer Change Type
            //        Empty Previous Value = Initial Cascade
            // =====================================================

            const customerIsInitialLoad =
                selectedCustomerId ===
                    "";


            // =====================================================
            // 15.3 - Set Temporary Customer
            // =====================================================

            selectedCustomerId =
                customerId;

            activeStateTemp.customerId =
                customerId;


            // =====================================================
            // 15.4 - Reset Temporary Downstream State
            //        Preserve During Initial Cascade
            // =====================================================

            if (
                !customerIsInitialLoad
            ) {

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";


                // =====================================================
                // Reset Downstream Selection Tracking
                // =====================================================

                selectedLocationId =
                    "";

                selectedEventId =
                    "";

                selectedBaselineVersion =
                    "";

                selectedCurrentVersion =
                    "";

                // =====================================================
                // Reset Temporary Artifact Hierarchy
                //     Customer Changed - Clear Entire Prior Customer Context
                //     New Customer Artifacts Rebuild During This Cascade
                // =====================================================

                processClearIndexDbTemp(
                    "Some",
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
                    ]
                );

            }


            // =====================================================
            // 16.5 - Reset Customer Runtime Registries
            // =====================================================

            customerMasterRegistry =
                null;


            // =====================================================
            // 15.6 - Reset Downstream Controls
            // =====================================================

            selLocation.innerHTML =
                "";

            selLocation.disabled =
                true;

            selEvent.innerHTML =
                "";

            selEvent.disabled =
                true;

            selBaseline.innerHTML =
                "";

            selBaseline.disabled =
                true;

            selCurrent.innerHTML =
                "";

            selCurrent.disabled =
                true;


            // =====================================================
            // 15.7 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );


            // =====================================================
            // 15.8 - Validate Customer Selection
            // =====================================================

            if (
                !customerId ||
                !customersRegistry
            ) {

                return;

            }


            // =====================================================
            // 15.9 - Get Selected Customer
            // =====================================================

            const selectedCustomer =
                customersRegistry.customers.find(
                    customer =>
                        customer.customerId ===
                            customerId
                );

            if (
                !selectedCustomer
            ) {

                return;

            }


            // =====================================================
            // 15.10 - Get Customer Master Registry Path
            // =====================================================

            const customerMasterRegistryPath =
                selectedCustomer
                    .customerMasterRegistryPath;

            console.log(
                "[ProjectDashboard] Customer Master Registry Path:",
                customerMasterRegistryPath
            );


            // =====================================================
            // 15.11 - Get Customer Master Registry
            // =====================================================

            let customerMasterRegistryArtifact:
                ArrayBuffer;

            try {

                customerMasterRegistryArtifact =
                    await processGetArtifact(
                        "Registry",
                        customerMasterRegistryPath,
                        artifactStorageTarget
                    );

            }
            catch (
                error
            ) {

                // =====================================================
                // 15.11A - Customer Setup Unavailable
                //          Stop Cascade At Location
                // =====================================================

                console.error(
                    `[ProjectDashboard] Customer Master Registry unavailable: ${customerMasterRegistryPath}`,
                    error
                );

                const optCustomerSetupUnavailable =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupUnavailable.value =
                    "";

                optCustomerSetupUnavailable.textContent =
                    "Customer Setup Unavailable";

                selLocation.appendChild(
                    optCustomerSetupUnavailable
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            // =====================================================
            // 15.12 - Decode Customer Master Registry
            // =====================================================

            try {

                customerMasterRegistry =
                    JSON.parse(
                        new TextDecoder().decode(
                            new Uint8Array(
                                customerMasterRegistryArtifact
                            )
                        )
                    ) as CustomerMasterRegistry;

            }
            catch (
                error
            ) {

                // =====================================================
                // 15.12A - Customer Setup Invalid
                //          Customer Master Could Not Be Decoded
                // =====================================================

                console.error(
                    `[ProjectDashboard] Customer Master Registry invalid: ${customerMasterRegistryPath}`,
                    error
                );

                const optCustomerSetupInvalid =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupInvalid.value =
                    "";

                optCustomerSetupInvalid.textContent =
                    "Customer Setup Invalid";

                selLocation.appendChild(
                    optCustomerSetupInvalid
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            // =====================================================
            // 15.13 - Validate Customer Master Registry
            // =====================================================

            if (
                !customerMasterRegistry ||
                customerMasterRegistry.customerId !==
                    customerId
            ) {

                console.error(
                    "[ProjectDashboard] Customer Master Registry does not match selected customer:",
                    {
                        selectedCustomerId:
                            customerId,

                        registryCustomerId:
                            customerMasterRegistry?.customerId
                    }
                );

                const optCustomerSetupInvalid =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupInvalid.value =
                    "";

                optCustomerSetupInvalid.textContent =
                    "Customer Setup Invalid";

                selLocation.appendChild(
                    optCustomerSetupInvalid
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            console.log(
                "[ProjectDashboard] Customer Master Registry:",
                customerMasterRegistry
            );


            // =====================================================
            // 15.13B - Establish Resident Customer Master Registry
            //
            // Customer Master has now been retrieved, decoded, and
            // validated against the selected Customer above (15.13).
            // Establish the class-level resident authority here,
            // before any Location-scoped registry (LOCE/LOCP) can
            // reach processHydrateResidentRegistry's identity
            // validator.
            // =====================================================

            processSetResidentCustomerMasterRegistry(
                customerMasterRegistry
            );


            // =====================================================
            // 15.14 - Get Fields Registry Path
            //
            // Registry Architecture Refactor - Fields Authority
            // Migration.
            //
            // Fields discovery now comes from the resolved Customer
            // Master manifest, identified by registryType - not
            // from the legacy customerMasterRegistry.fieldsRegistry
            // pointer. No fallback to that legacy field, no
            // filename inference, no reconstructed path. Exactly
            // one resolved "fields" definition is required; zero
            // or more than one is treated the same as "not
            // configured" through the existing Customer-cascade
            // failure presentation.
            // =====================================================

            const resolvedFieldsRegistries =
                processResolveCustomerRegistryManifest(
                    customerMasterRegistry
                ).filter(
                    resolvedRegistry =>
                        resolvedRegistry.registryType ===
                            "fields"
                );

            if (
                resolvedFieldsRegistries.length !==
                    1
            ) {

                console.error(
                    "[ProjectDashboard] Fields registry definition could not be resolved from the Customer Master manifest:",
                    {
                        customerId:
                            customerId,

                        resolvedCount:
                            resolvedFieldsRegistries.length
                    }
                );

                const optCustomerSetupInvalid =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupInvalid.value =
                    "";

                optCustomerSetupInvalid.textContent =
                    "Customer Setup Invalid";

                selLocation.appendChild(
                    optCustomerSetupInvalid
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }

            const resolvedFieldsRegistry =
                resolvedFieldsRegistries[0];

            const fieldsRegistryPath =
                resolvedFieldsRegistry.registryPath;

            const fieldsRegistryKey =
                resolvedFieldsRegistry.registryKey;

            if (
                !fieldsRegistryPath?.trim() ||
                !fieldsRegistryKey?.trim()
            ) {

                console.error(
                    "[ProjectDashboard] Resolved Fields registry path/key is invalid:",
                    {
                        customerId:
                            customerId,

                        fieldsRegistryPath:
                            fieldsRegistryPath,

                        fieldsRegistryKey:
                            fieldsRegistryKey
                    }
                );

                const optCustomerSetupInvalid =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupInvalid.value =
                    "";

                optCustomerSetupInvalid.textContent =
                    "Customer Setup Invalid";

                selLocation.appendChild(
                    optCustomerSetupInvalid
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }

            console.log(
                "[ProjectDashboard] Fields Registry Path:",
                fieldsRegistryPath
            );


            // =====================================================
            // 15.15 - Get Fields Registry
            // =====================================================

            try {

                const fieldsRegistryArtifact =
                    await processGetArtifact(
                        "Registry",
                        fieldsRegistryPath,
                        artifactStorageTarget,
                        "Cache",
                        fieldsRegistryKey
                    );

                void fieldsRegistryArtifact;

            }
            catch (
                error
            ) {

                console.error(
                    `[ProjectDashboard] Fields Registry unavailable: ${fieldsRegistryPath}`,
                    error
                );

                const optCustomerSetupUnavailable =
                    document.createElement(
                        "option"
                    );

                optCustomerSetupUnavailable.value =
                    "";

                optCustomerSetupUnavailable.textContent =
                    "Customer Setup Unavailable";

                selLocation.appendChild(
                    optCustomerSetupUnavailable
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            // =====================================================
            // 15.16 - Resolve Active Locations
            // =====================================================

            const activeLocations =
                customerMasterRegistry
                    .locations
                    ?.filter(
                        location =>
                            location.active
                    ) ??
                [];


            // =====================================================
            // 15.17 - Handle Location Availability
            //          Stop Cascade At Location
            // =====================================================

            if (
                activeLocations.length ===
                    0
            ) {

                const optNoLocations =
                    document.createElement(
                        "option"
                    );

                optNoLocations.value =
                    "";

                optNoLocations.textContent =
                    "No Locations Available";

                selLocation.appendChild(
                    optNoLocations
                );

                selLocation.disabled =
                    true;

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            // =====================================================
            // 15.18 - Populate Location Dropdown
            // =====================================================

            const optLocationPlaceholder =
                document.createElement(
                    "option"
                );

            optLocationPlaceholder.value =
                "";

            optLocationPlaceholder.textContent =
                "Select Location";

            selLocation.appendChild(
                optLocationPlaceholder
            );

            activeLocations.forEach(
                location => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        location.locationId;

                    option.textContent =
                        location.locationName;

                    selLocation.appendChild(
                        option
                    );

                }
            );


            // =====================================================
            // 15.19 - Enable Location Dropdown
            // =====================================================

            selLocation.disabled =
                false;


            // =====================================================
            // 15.20 - Resolve Temporary Location Selection
            // =====================================================

            if (
                activeStateTemp.locationId
            ) {

                selLocation.value =
                    activeStateTemp.locationId;

                selLocation.dispatchEvent(
                    new Event(
                        "change"
                    )
                );

            }


            // =====================================================
            // 15.21 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );

            }
            catch (
                error
            ) {

                console.error(
                    "[ProjectDashboard] Customer change processing failed:",
                    error
                );

            }
            finally {

                isProcessingCustomer =
                    false;

                selCustomer.disabled =
                    false;

            }

        }
    );


    // =====================================================
    // 17 - Location Change
    // =====================================================

    let selectedLocationId =
        "";

    selLocation.addEventListener(
        "change",
        async () => {

            // =====================================================
            // 17.1 - Location Processing Gate
            // =====================================================

            if (
                isProcessingLocation
            ) {

                return;

            }

            isProcessingLocation =
                true;

            selLocation.disabled =
                true;

            try {

                const locationId =
                    selLocation.value;


            // =====================================================
            // 16.1 - Location Has Not Changed
            // =====================================================

            if (
                locationId ===
                    selectedLocationId
            ) {

                return;

            }


            // =====================================================
            // 16.2 - Determine Location Change Type
            //        Empty Previous Value = Initial Cascade
            // =====================================================

            const locationIsInitialLoad =
                selectedLocationId ===
                    "";


            // =====================================================
            // 16.3 - Set Temporary Location
            // =====================================================

            selectedLocationId =
                locationId;

            activeStateTemp.locationId =
                locationId;


            // =====================================================
            // 16.4 - Reset Temporary Downstream State
            //        Preserve During Initial Cascade
            // =====================================================

            if (
                !locationIsInitialLoad
            ) {

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";


                // =====================================================
                // Reset Downstream Selection Tracking
                // =====================================================

                selectedEventId =
                    "";

                selectedBaselineVersion =
                    "";

                selectedCurrentVersion =
                    "";

                // =====================================================
                // Reset Temporary Artifact Hierarchy
                //     Location Changed - Preserve Customer Artifacts
                // =====================================================

                processClearIndexDbTemp(
                    "Some",
                    [
                        "customer_maps:",
                        "customer_loce:",
                        "customer_locp:",
                        "customer_schv:",
                        "customer_wklv:",
                        "customer_blpa:",
                        "customer_blpr:",
                        "customer_crpa:",
                        "customer_crpr:"
                    ]
                );

            }


            // =====================================================
            // 17.5 - Reset Event And Plans
            // =====================================================

            selEvent.innerHTML =
                "";

            selEvent.disabled =
                true;

            selBaseline.innerHTML =
                "";

            selBaseline.disabled =
                true;

            selCurrent.innerHTML =
                "";

            selCurrent.disabled =
                true;


            // =====================================================
            // 16.6 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );


            // =====================================================
            // 16.7 - Validate Location Selection
            // =====================================================

            if (
                !locationId ||
                !customerMasterRegistry
            ) {

                return;

            }


            // =====================================================
            // 16.8 - Get Selected Location
            // =====================================================

            const selectedLocation =
                customerMasterRegistry
                    .locations
                    .find(
                        location =>
                            location.locationId ===
                                locationId &&
                            location.active
                    );

            if (
                !selectedLocation
            ) {

                return;

            }

            console.log(
                "[ProjectDashboard] Selected Location:",
                selectedLocation
            );


            // =====================================================
            // 16.9 - Get Main Location Map Files
            // =====================================================

            const selectedMainMap =
                selectedLocation
                    .maps
                    ?.find(
                        map =>
                            map.active &&
                            map.mapType ===
                                "MAIN"
                    );


            // =====================================================
            // 16.10A - Main Map Retrieval Error
            //          Map Is Optional - Continue Cascade
            // =====================================================

            if (
                selectedMainMap?.mapArtifactPath?.trim()
            ) {

                console.log(
                    "[ProjectDashboard] Selected Main Map:",
                    selectedMainMap
                );

                try {

                    const mapArtifact =
                        await processGetArtifact(
                            "Map",
                            selectedMainMap.mapArtifactPath,
                            artifactStorageTarget
                        );

                    console.log(
                        "[ProjectDashboard] Main Map Resident:",
                        {
                            mapId:
                                selectedMainMap.mapId,

                            mapArtifactPath:
                                selectedMainMap.mapArtifactPath,

                            byteLength:
                                mapArtifact.byteLength
                        }
                    );

                }
                catch (
                    error
                ) {

                    // =====================================================
                    // 16.10A - Main Map Retrieval Error
                    //          Map Is Optional - Continue Cascade
                    // =====================================================

                    if (
                        error instanceof
                            AzureArtifactError
                    ) {

                        console.warn(
                            "[ProjectDashboard] Main map retrieval error:",
                            {
                                errorType:
                                    error.errorType,

                                status:
                                    error.status,

                                artifactPaths:
                                    error.artifactPaths
                            }
                        );

                    }
                    else {

                        console.warn(
                            "[ProjectDashboard] Main map retrieval error:"
                        )

                    }

                }

            }
            else {

                console.log(
                    `[ProjectDashboard] Main map not configured for location: ${locationId}`
                );

            }


            // =====================================================
            // Setup Location Bootstrap.
            //
            // Location Events and Location Places are now
            // standalone Location-scoped registries, not embedded
            // in Customer Master. Retrieve/stage BOTH for the
            // selected Location through the existing Settings Temp
            // transaction, and hydrate them into the same resident
            // owner processCheckRegistryKeys() already uses, so
            // the existing Event dropdown code below (and any
            // future Location Places consumer) can read them
            // through the existing resident accessors.
            //
            // All-or-nothing: both required Location registries
            // must retrieve and hydrate successfully before the
            // cascade is allowed to continue to Event population.
            // A failure in either one stops this Location-selection
            // attempt here and returns the cascade to its existing
            // natural retryable state - it does not continue to
            // read whatever may already be resident for this
            // Location.
            // =====================================================

            ctrOverlay.querySelector(
                ".application-alert"
            )?.remove();

            const resolvedLocationRegistries =
                processResolveCustomerRegistryManifest(
                    customerMasterRegistry
                ).filter(
                    resolvedRegistry =>
                        (
                            resolvedRegistry.registryType ===
                                "location_events" ||
                            resolvedRegistry.registryType ===
                                "location_places"
                        ) &&
                        resolvedRegistry.locationId ===
                            locationId
                );

            try {

                for (
                    const resolvedLocationRegistry of
                        resolvedLocationRegistries
                ) {

                    const locationRegistryArtifact =
                        await processGetArtifact(
                            "Registry",
                            resolvedLocationRegistry.registryPath,
                            artifactStorageTarget,
                            "Cache",
                            resolvedLocationRegistry.registryKey
                        );

                    processHydrateResidentRegistry(
                        resolvedLocationRegistry,
                        locationRegistryArtifact
                    );

                    console.log(
                        "[ProjectDashboard] Location registry resident:",
                        {
                            registryType:
                                resolvedLocationRegistry.registryType,

                            registryKey:
                                resolvedLocationRegistry.registryKey
                        }
                    );

                }

            }
            catch (
                error
            ) {

                // =====================================================
                // Location Bootstrap Failed
                //
                // Restore the cascade to the same pre-original-try
                // state it was in before this Location selection
                // began - not merely the dependent (Event/Baseline/
                // Current) state. selEvent / selBaseline / selCurrent
                // DOM are already cleared and disabled by the
                // unconditional reset earlier in this handler.
                //
                // Location itself must also return to its existing
                // placeholder ("Select Location", value "") and
                // remain selectable, and the internal
                // selectedLocationId tracking must be restored to
                // that same placeholder value - otherwise re-picking
                // the identical Location from the dropdown produces
                // no DOM value change, so no native "change" event
                // fires, and even if it did, the existing "16.1 -
                // Location Has Not Changed" gate would return before
                // ever reaching this code again. Restoring both the
                // control and the tracking variable to the existing
                // placeholder is what makes an ordinary re-selection
                // behave as a genuine new attempt - no synthetic
                // event, retry flag, or new mechanism is introduced.
                //
                // selectedEventId / selectedBaselineVersion /
                // selectedCurrentVersion are reset alongside it for
                // the same reason, consistent with the existing
                // Location-changed reset already used elsewhere in
                // this handler.
                // =====================================================

                console.warn(
                    "[ProjectDashboard] Location registry retrieval error:",
                    error
                );

                selLocation.value =
                    "";

                selectedLocationId =
                    "";

                activeStateTemp.locationId =
                    "";

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                selectedEventId =
                    "";

                selectedBaselineVersion =
                    "";

                selectedCurrentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                const alert =
                    document.createElement(
                        "div"
                    );

                alert.className =
                    "application-alert";

                alert.textContent =
                    "Retrieval error. Please try again.";

                selCurrent.insertAdjacentElement(
                    "afterend",
                    alert
                );

                return;

            }


            // =====================================================
            // Registry Architecture Refactor - Stage F.
            //
            // Events now come from the resident Location Events
            // Registry for this Location, not embedded Customer
            // Master. No fallback to selectedLocation.events if
            // the resident registry is missing - that would
            // preserve two authorities.
            // =====================================================

            const locationEventsRegistry =
                processGetLocationEventsRegistry(
                    locationId
                );

            console.log(
                "[ProjectDashboard] Selected Location Events:",
                locationEventsRegistry?.events
            );

            const activeEvents =
                locationEventsRegistry
                    ?.events
                    .filter(
                        event =>
                            event.active
                    ) ??
                [];

            console.log(
                "[ProjectDashboard] Active Events:",
                activeEvents,
                "Count:",
                activeEvents.length
            );


            // =====================================================
            // 16.12 - Handle Event Availability
            //          Stop Cascade At Event
            // =====================================================

            if (
                activeEvents.length ===
                    0
            ) {

                console.log(
                    "[ProjectDashboard] No Events Available branch"
                );

                const optNoEvents =
                    document.createElement(
                        "option"
                    );

                optNoEvents.value =
                    "";

                optNoEvents.textContent =
                    "No Events Available";

                selEvent.appendChild(
                    optNoEvents
                );

                selEvent.disabled =
                    true;

                activeStateTemp.eventId =
                    "";

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";

                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );

                return;

            }


            // =====================================================
            // 16.13 - Populate Event Dropdown
            // =====================================================

            const optEventPlaceholder =
                document.createElement(
                    "option"
                );

            optEventPlaceholder.value =
                "";

            optEventPlaceholder.textContent =
                "Select Event";

            selEvent.appendChild(
                optEventPlaceholder
            );

            activeEvents.forEach(
                event => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        event.eventId;

                    option.textContent =
                        event.eventName;

                    selEvent.appendChild(
                        option
                    );

                }
            );


            // =====================================================
            // 16.14 - Enable Event Dropdown
            // =====================================================

            selEvent.disabled =
                false;


            // =====================================================
            // 16.15 - Resolve Temporary Event Selection
            // =====================================================

            if (
                activeStateTemp.eventId
            ) {

                selEvent.value =
                    activeStateTemp.eventId;

                selEvent.dispatchEvent(
                    new Event(
                        "change"
                    )
                );

            }


            // =====================================================
            // 16.16 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );

            }
            catch (
                error
            ) {

                console.error(
                    "[ProjectDashboard] Location change processing failed:",
                    error
                );

            }
            finally {

                isProcessingLocation =
                    false;

                selLocation.disabled =
                    false;

            }

        }
    );


    // =====================================================
    // 18 - Event Change
    // =====================================================

    let selectedEventId =
        "";

    selEvent.addEventListener(
        "change",
        async () => {

            // =====================================================
            // 18.1 - Event Processing Gate
            // =====================================================

            if (
                isProcessingEvent
            ) {

                return;

            }

            isProcessingEvent =
                true;

            selEvent.disabled =
                true;

            try {

                const eventId =
                    selEvent.value;


            // =====================================================
            // 17.1 - Event Has Not Changed
            // =====================================================

            if (
                eventId ===
                    selectedEventId
            ) {

                return;

            }


            // =====================================================
            // 17.2 - Determine Event Change Type
            //        Empty Previous Value = Initial Cascade
            // =====================================================

            const eventIsInitialLoad =
                selectedEventId ===
                    "";


            // =====================================================
            // 17.3 - Set Temporary Event
            // =====================================================

            selectedEventId =
                eventId;

            activeStateTemp.eventId =
                eventId;


            // =====================================================
            // 17.4 - Reset Temporary Plan State
            //        Preserve During Initial Cascade
            // =====================================================

            if (
                !eventIsInitialLoad
            ) {

                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";


                // =====================================================
                // Reset Downstream Selection Tracking
                // =====================================================

                selectedBaselineVersion =
                    "";

                selectedCurrentVersion =
                    "";

                // =====================================================
                // Reset Temporary Artifact Hierarchy
                //     Event Changed - Preserve Customer And Location Artifacts
                // =====================================================

                processClearIndexDbTemp(
                    "Some",
                    [
                        "customer_schv:",
                        "customer_wklv:",
                        "customer_blpa:",
                        "customer_blpr:",
                        "customer_crpa:",
                        "customer_crpr:"
                    ]
                );

            }


            // =====================================================
            // 18.5 - Reset Plan Controls
            // =====================================================

            selBaseline.innerHTML =
                "";

            selBaseline.disabled =
                true;

            selCurrent.innerHTML =
                "";

            selCurrent.disabled =
                true;


            // =====================================================
            // 17.6 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );


            // =====================================================
            // 17.7 - Validate Event Selection
            // =====================================================

            if (
                !eventId ||
                !customerMasterRegistry
            ) {

                return;

            }


            // =====================================================
            // 17.8 - Get Selected Location
            // =====================================================

            const selectedLocation =
                customerMasterRegistry
                    .locations
                    .find(
                        location =>
                            location.locationId ===
                                activeStateTemp.locationId &&
                            location.active
                    );

            if (
                !selectedLocation
            ) {

                return;

            }


            // =====================================================
            // 17.9 - Get Selected Event
            //
            // Registry Architecture Refactor - Stage F.
            //
            // Sourced from the resident Location Events Registry,
            // not embedded Customer Master. No fallback to
            // selectedLocation.events if the resident registry or
            // the Event itself is missing.
            // =====================================================

            const selectedLocationEvent =
                processGetLocationEvent(
                    activeStateTemp.locationId,
                    eventId
                );

            const selectedEvent =
                selectedLocationEvent?.active
                    ? selectedLocationEvent
                    : null;

            if (
                !selectedEvent
            ) {

                return;

            }


            // =====================================================
            // 17.10 - Get Event Registry Paths
            // =====================================================

            const versionsRegistryPath =
                selectedEvent
                    .scheduleVersionsRegistryPath;

            const worklistVersionsRegistryPath =
                selectedEvent
                    .worklistVersionsRegistryPath;

            console.log(
                "[ProjectDashboard] Event Registry Paths:",
                {
                    versionsRegistryPath,
                    worklistVersionsRegistryPath
                }
            );


            // =====================================================
            // 17.11 - Validate Schedule Versions Registry Path
            // =====================================================

            if (
                !versionsRegistryPath?.trim()
            ) {

                // =====================================================
                // 17.11A - Schedule Setup Not Configured
                //          Stop Schedule Cascade At Plans
                // =====================================================

                const optScheduleNotConfiguredBaseline =
                    document.createElement(
                        "option"
                    );

                optScheduleNotConfiguredBaseline.value =
                    "";

                optScheduleNotConfiguredBaseline.textContent =
                    "Schedule Not Uploaded";

                selBaseline.appendChild(
                    optScheduleNotConfiguredBaseline
                );

                selBaseline.disabled =
                    true;


                const optScheduleNotConfiguredCurrent =
                    document.createElement(
                        "option"
                    );

                optScheduleNotConfiguredCurrent.value =
                    "";

                optScheduleNotConfiguredCurrent.textContent =
                    "Schedule Not Uploaded";

                selCurrent.appendChild(
                    optScheduleNotConfiguredCurrent
                );

                selCurrent.disabled =
                    true;


                activeStateTemp.baselineVersion =
                    "";

                activeStateTemp.currentVersion =
                    "";


                console.warn(
                    "[ProjectDashboard] Schedule Versions Registry path is not configured:",
                    {
                        customerId:
                            activeStateTemp.customerId,

                        locationId:
                            activeStateTemp.locationId,

                        eventId:
                            activeStateTemp.eventId
                    }
                );


                processUpdateSettingsSaveState(
                    btnOverlaySave,
                    activeState,
                    activeStateTemp
                );


                // =====================================================
                // 17.11B - Continue Worklist Validation Independently
                // =====================================================

            }


            // =====================================================
            // 17.12 - Get Schedule Versions Registry
            // =====================================================

            let versionsRegistry:
                ScheduleVersionsRegistry | null =
                    null;

            if (
                versionsRegistryPath?.trim()
            ) {

                let versionsRegistryArtifact:
                    ArrayBuffer;

                try {

                    versionsRegistryArtifact =
                        await processGetArtifact(
                            "Registry",
                            versionsRegistryPath,
                            artifactStorageTarget
                        );

                }
                catch (
                    error
                ) {

                    // =====================================================
                    // 17.12A - Schedule Retrieval Error
                    //          Azure / Retrieval Failure
                    // =====================================================

                    const optScheduleUnavailableBaseline =
                        document.createElement(
                            "option"
                        );

                    optScheduleUnavailableBaseline.value =
                        "";

                    optScheduleUnavailableBaseline.textContent =
                        "Schedule Retrieval Error";

                    selBaseline.appendChild(
                        optScheduleUnavailableBaseline
                    );

                    selBaseline.disabled =
                        true;


                    const optScheduleUnavailableCurrent =
                        document.createElement(
                            "option"
                        );

                    optScheduleUnavailableCurrent.value =
                        "";

                    optScheduleUnavailableCurrent.textContent =
                        "Schedule Retrieval Error";

                    selCurrent.appendChild(
                        optScheduleUnavailableCurrent
                    );

                    selCurrent.disabled =
                        true;


                    activeStateTemp.baselineVersion =
                        "";

                    activeStateTemp.currentVersion =
                        "";


                    if (
                        error instanceof
                            AzureArtifactError
                    ) {

                        console.warn(
                            "[ProjectDashboard] Schedule retrieval error:",
                            {
                                errorType:
                                    error.errorType,

                                status:
                                    error.status,

                                artifactPaths:
                                    error.artifactPaths
                            }
                        );

                    }


                    processUpdateSettingsSaveState(
                        btnOverlaySave,
                        activeState,
                        activeStateTemp
                    );

                }


                // =====================================================
                // 17.13 - Decode Schedule Versions Registry
                // =====================================================

                if (
                    versionsRegistryArtifact!
                ) {

                    try {

                        versionsRegistry =
                            JSON.parse(
                                new TextDecoder().decode(
                                    new Uint8Array(
                                        versionsRegistryArtifact
                                    )
                                )
                            ) as ScheduleVersionsRegistry;

                    }
                    catch (
                        error
                    ) {

                        // =====================================================
                        // 17.13A - Schedule Setup Invalid
                        //          Artifact Retrieved But Could Not Be Decoded
                        // =====================================================

                        selBaseline.innerHTML =
                            "";

                        selCurrent.innerHTML =
                            "";


                        const optScheduleInvalidBaseline =
                            document.createElement(
                                "option"
                            );

                        optScheduleInvalidBaseline.value =
                            "";

                        optScheduleInvalidBaseline.textContent =
                            "Schedule Setup Invalid";

                        selBaseline.appendChild(
                            optScheduleInvalidBaseline
                        );

                        selBaseline.disabled =
                            true;


                        const optScheduleInvalidCurrent =
                            document.createElement(
                                "option"
                            );

                        optScheduleInvalidCurrent.value =
                            "";

                        optScheduleInvalidCurrent.textContent =
                            "Schedule Setup Invalid";

                        selCurrent.appendChild(
                            optScheduleInvalidCurrent
                        );

                        selCurrent.disabled =
                            true;


                        activeStateTemp.baselineVersion =
                            "";

                        activeStateTemp.currentVersion =
                            "";


                        console.error(
                            "[ProjectDashboard] Schedule Versions Registry invalid:",
                            {
                                path:
                                    versionsRegistryPath,

                                error:
                                    error
                            }
                        );


                        processUpdateSettingsSaveState(
                            btnOverlaySave,
                            activeState,
                            activeStateTemp
                        );

                    }

                }

            }


            // =====================================================
            // 17.14 - Validate Worklist Versions Registry Path
            //          Independent From Schedule Plan Cascade
            // =====================================================

            let worklistVersionsRegistryArtifact:
                ArrayBuffer | null =
                    null;

            if (
                !worklistVersionsRegistryPath?.trim()
            ) {

                console.warn(
                    "[ProjectDashboard] Worklist Versions Registry path is not configured:",
                    {
                        customerId:
                            activeStateTemp.customerId,

                        locationId:
                            activeStateTemp.locationId,

                        eventId:
                            activeStateTemp.eventId
                    }
                );

            }
            else {

                // =====================================================
                // 17.15 - Get Worklist Versions Registry
                // =====================================================

                try {

                    worklistVersionsRegistryArtifact =
                        await processGetArtifact(
                            "Registry",
                            worklistVersionsRegistryPath,
                            artifactStorageTarget
                        );

                }
                catch (
                    error
                ) {

                    // =====================================================
                    // 17.15A - Worklist Retrieval Error
                    //          Does Not Block Schedule Plan Cascade
                    // =====================================================

                    if (
                        error instanceof
                            AzureArtifactError
                    ) {

                        console.warn(
                            "[ProjectDashboard] Worklist retrieval error:",
                            {
                                errorType:
                                    error.errorType,

                                status:
                                    error.status,

                                artifactPaths:
                                    error.artifactPaths
                            }
                        );

                    }

                }

            }


            // =====================================================
            // 17.16 - Worklist Versions Registry
            //          No Decode Required Yet
            // =====================================================

            void worklistVersionsRegistryArtifact;


            // =====================================================
            // 17.17 - Stop Schedule Plan Processing When Unavailable
            // =====================================================

            if (
                !versionsRegistry
            ) {

                return;

            }

            console.log(
                "[ProjectDashboard] Versions Registry:",
                versionsRegistry
            );


            // =====================================================
            // 17.18 - Resolve Available Baseline Plans
            // =====================================================

            const baselinePlans =
                versionsRegistry
                    .baselinePlans ??
                [];


            // =====================================================
            // 17.19 - Handle Baseline Plan Availability
            // =====================================================

            if (
                baselinePlans.length ===
                    0
            ) {

                const optNoBaselinePlans =
                    document.createElement(
                        "option"
                    );

                optNoBaselinePlans.value =
                    "";

                optNoBaselinePlans.textContent =
                    "No Baseline Plans Available";

                selBaseline.appendChild(
                    optNoBaselinePlans
                );

                selBaseline.disabled =
                    true;

                activeStateTemp.baselineVersion =
                    "";

            }
            else {

                const optBaselinePlaceholder =
                    document.createElement(
                        "option"
                    );

                optBaselinePlaceholder.value =
                    "";

                optBaselinePlaceholder.textContent =
                    "Select Baseline Plan";

                selBaseline.appendChild(
                    optBaselinePlaceholder
                );

                baselinePlans.forEach(
                    baselinePlan => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            baselinePlan.versionId;

                        option.textContent =
                            baselinePlan.versionId;

                        selBaseline.appendChild(
                            option
                        );

                    }
                );

                selBaseline.disabled =
                    false;

                const baselineVersion =
                    activeStateTemp.baselineVersion ||
                    versionsRegistry
                        .defaultBaselineVersionId;

                if (
                    baselineVersion
                ) {

                    activeStateTemp.baselineVersion =
                        baselineVersion;

                    selBaseline.value =
                        baselineVersion;

                    selBaseline.dispatchEvent(
                        new Event(
                            "change"
                        )
                    );

                }

            }


            // =====================================================
            // 17.20 - Resolve Available Current Plans
            // =====================================================

            const currentPlans =
                versionsRegistry
                    .currentPlans ??
                [];


            // =====================================================
            // 17.21 - Handle Current Plan Availability
            // =====================================================

            if (
                currentPlans.length ===
                    0
            ) {

                const optNoCurrentPlans =
                    document.createElement(
                        "option"
                    );

                optNoCurrentPlans.value =
                    "";

                optNoCurrentPlans.textContent =
                    "No Current Plans Available";

                selCurrent.appendChild(
                    optNoCurrentPlans
                );

                selCurrent.disabled =
                    true;

                activeStateTemp.currentVersion =
                    "";

            }
            else {

                const optCurrentPlaceholder =
                    document.createElement(
                        "option"
                    );

                optCurrentPlaceholder.value =
                    "";

                optCurrentPlaceholder.textContent =
                    "Select Current Plan";

                selCurrent.appendChild(
                    optCurrentPlaceholder
                );

                currentPlans.forEach(
                    currentPlan => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            currentPlan.versionId;

                        option.textContent =
                            currentPlan.versionId;

                        selCurrent.appendChild(
                            option
                        );

                    }
                );

                selCurrent.disabled =
                    false;

                const currentVersion =
                    activeStateTemp.currentVersion ||
                    versionsRegistry
                        .defaultCurrentVersionId;

                if (
                    currentVersion
                ) {

                    activeStateTemp.currentVersion =
                        currentVersion;

                    selCurrent.value =
                        currentVersion;

                    selCurrent.dispatchEvent(
                        new Event(
                            "change"
                        )
                    );

                }

            }


            // =====================================================
            // 17.22 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );

            }
            catch (
                error
            ) {

                console.error(
                    "[ProjectDashboard] Event change processing failed:",
                    error
                );

            }
            finally {

                isProcessingEvent =
                    false;

                selEvent.disabled =
                    false;

            }

        }
    );


    // =====================================================
    // 19 - Baseline Change
    // =====================================================

    let selectedBaselineVersion =
        "";

    selBaseline.addEventListener(
        "change",
        () => {

            const baselineVersion =
                selBaseline.value;


            // =====================================================
            // 18.1 - Baseline Has Not Changed
            // =====================================================

            if (
                baselineVersion ===
                    selectedBaselineVersion
            ) {

                return;

            }


            // =====================================================
            // 18.1B - Determine Baseline Change Type
            //         Empty Previous Value = Initial Cascade
            // =====================================================

            const baselineIsInitialLoad =
                selectedBaselineVersion ===
                    "";


            // =====================================================
            // 18.2 - Set Temporary Baseline Version
            // =====================================================

            selectedBaselineVersion =
                baselineVersion;

            // =====================================================
            // Reset Temporary Baseline Artifacts
            //     Preserve During Initial Cascade
            // =====================================================

            if (
                !baselineIsInitialLoad
            ) {

                processClearIndexDbTemp(
                    "Some",
                    [
                        "customer_blpa:",
                        "customer_blpr:"
                    ]
                );

            }

            activeStateTemp.baselineVersion =
                baselineVersion;


            // =====================================================
            // 18.3 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );

        }
    );


    // =====================================================
    // 20 - Current Change
    // =====================================================

    let selectedCurrentVersion =
        "";

    selCurrent.addEventListener(
        "change",
        () => {

            const currentVersion =
                selCurrent.value;


            // =====================================================
            // 19.1 - Current Has Not Changed
            // =====================================================

            if (
                currentVersion ===
                    selectedCurrentVersion
            ) {

                return;

            }


            // =====================================================
            // 19.1B - Determine Current Change Type
            //         Empty Previous Value = Initial Cascade
            // =====================================================

            const currentIsInitialLoad =
                selectedCurrentVersion ===
                    "";


            // =====================================================
            // 19.2 - Set Temporary Current Version
            // =====================================================

            selectedCurrentVersion =
                currentVersion;

            // =====================================================
            // Reset Temporary Current Artifacts
            //     Preserve During Initial Cascade
            // =====================================================

            if (
                !currentIsInitialLoad
            ) {

                processClearIndexDbTemp(
                    "Some",
                    [
                        "customer_crpa:",
                        "customer_crpr:"
                    ]
                );

            }

            activeStateTemp.currentVersion =
                currentVersion;


            // =====================================================
            // 19.3 - Check Save
            // =====================================================

            processUpdateSettingsSaveState(
                btnOverlaySave,
                activeState,
                activeStateTemp
            );

        }
    );


    // =====================================================
    // 21 - Assemble Settings Fields
    // =====================================================

    ctrSettingsFields.append(
        lblCustomer,
        selCustomer,
        lblLocation,
        selLocation,
        lblEvent,
        selEvent,
        lblBaseline,
        selBaseline,
        lblCurrent,
        selCurrent
    );

    ctrOverlayBody.appendChild(
        ctrSettingsFields
    );


    // =====================================================
    // 22 - Footer
    // =====================================================

    const ctrOverlayFooter =
        document.createElement(
            "div"
        );

    ctrOverlayFooter.className =
        "project-dashboard-overlay-footer";


    // =====================================================
    // 23 - Save
    // =====================================================

    const btnOverlaySave =
        document.createElement(
            "button"
        );

    btnOverlaySave.type =
        "button";

    btnOverlaySave.className =
        "project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-create project-dashboard-overlay-save";

    btnOverlaySave.textContent =
        "Save Changes";

    btnOverlaySave.disabled =
        true;

    btnOverlaySave.classList.add(
        "application-disabled"
    );


    // =====================================================
    // 24 - Initialize Temporary Active State Cascade
    // =====================================================

    if (
        activeStateTemp.customerId
    ) {

        selCustomer.dispatchEvent(
            new Event(
                "change"
            )
        );

    }


    // =====================================================
    // 25 - Save Event
    // =====================================================

    btnOverlaySave.addEventListener(
        "click",
        async () => {

            // =====================================================
            // 24.0 - Reconcile Temporary IndexedDB Staging
            // =====================================================

            const indexDbTempReconciled =
                await processReconcileIndexDbTemp();

            if (
                !indexDbTempReconciled
            ) {

                return;

            }

            // =====================================================
            // TEMP DEBUG - Stop After Reconcile
            // =====================================================

            //console.log(
                //"[ProjectDashboard] STOP AFTER RECONCILE"
            //);

            //return;


            // =====================================================
            // 24.1 - Persist Temporary Active State
            // =====================================================

            try {

                await processSetActiveState(
                    activeStateTemp
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


            // =====================================================
            // 24.2 - Validate Saved Active State
            //        Customer, Location, And Event Are Required
            // =====================================================

            const activeStateIsReady =
                !!activeStateTemp.customerId &&
                !!activeStateTemp.locationId &&
                !!activeStateTemp.eventId;

            if (
                !activeStateIsReady
            ) {

                // =====================================================
                // 24.3 - Active State Save Failed
                //        Keep Settings Open
                // =====================================================

                ctrOverlay.querySelector(
                    ".application-alert"
                )?.remove();

                const alert =
                    document.createElement(
                        "div"
                    );

                alert.className =
                    "application-alert";

                alert.textContent =
                    "Settings could not be saved. Please try again.";

                selCurrent.insertAdjacentElement(
                    "afterend",
                    alert
                );

                console.error(
                    "[ProjectDashboard] Active State validation failed after save"
                );

                return;

            }


            // =====================================================
            // 24.4 - Registries Check
            // =====================================================

            try {

                await processRefreshCustomerRegistries();

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
            // 24.5 - Clear Temporary IndexedDB Staging
            //        Only After Successful Save
            // =====================================================

            processClearIndexDbTemp(
                "All",
                []
            );


            // =====================================================
            // 24.6 - Close Settings
            // =====================================================

            ctrOverlay.remove();

            container.classList.remove(
                "project-dashboard-overlay-open"
            );


            // =====================================================
            // 24.7 - Load New Schedule
            //        Baseline And Current Exist In Temp
            // =====================================================

            processLoadNewScheduleState();

        }
    );


    // =====================================================
    // 26 - Cancel
    // =====================================================

    const btnOverlayCancel =
        document.createElement(
            "button"
        );

    btnOverlayCancel.type =
        "button";

    btnOverlayCancel.className =
        "project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-cancel project-dashboard-overlay-cancel";

    btnOverlayCancel.textContent =
        "Cancel";


    // =====================================================
    // 27 - Cancel Event
    // =====================================================

    btnOverlayCancel.addEventListener(
        "click",
        () => {

            // =====================================================
            // 26.1 - Temporary Artifacts Exist
            //        Confirm Before Discarding
            // =====================================================

            if (
                processTempHasChanged(
                    activeStateTemp
                )
            ) {

                buildNotificationOverlay(
                    container,
                    "Unsaved Changes",
                    "Temporary artifacts have been loaded. Cancel without saving?",
                    "YesNo",
                    {
                        onYes:
                            () => {

                                // =====================================================
                                // 26.1A - Clear Temporary IndexedDB Staging
                                // =====================================================

                                processClearIndexDbTemp(
                                    "All",
                                    []
                                );


                                // =====================================================
                                // 26.1B - Close Overlay
                                // =====================================================

                                ctrOverlay.remove();

                                container.classList.remove(
                                    "project-dashboard-overlay-open"
                                );


                                // =====================================================
                                // 26.1C - Send Status 300
                                //         Upload Wizard Must Not Be Active
                                // =====================================================

                                if (
                                    !uploadWizardIsActive()
                                ) {

                                    processSendStatus300();

                                }

                            },

                        onNo:
                            () => {

                                // =====================================================
                                // 26.1D - Keep Editing
                                //         Notification Closes Automatically
                                //         Temporary Artifacts Remain
                                // =====================================================

                            }
                    }
                );

                return;

            }


            // =====================================================
            // 26.2 - No Temporary Artifacts
            //        Close Overlay Normally
            // =====================================================

            ctrOverlay.remove();

            container.classList.remove(
                "project-dashboard-overlay-open"
            );


            // =====================================================
            // 26.3 - Send Status 300
            //        Upload Wizard Must Not Be Active
            // =====================================================

            if (
                !uploadWizardIsActive()
            ) {

                processSendStatus300();

            }

        }
    );


    // =====================================================
    // 28 - Assemble Footer
    // =====================================================

    ctrOverlayFooter.append(
        btnOverlaySave,
        btnOverlayCancel
    );


    // =====================================================
    // 29 - Assemble Panel
    // =====================================================

    ctrOverlayPanel.append(
        ctrOverlayHeader,
        ctrOverlayBody,
        ctrOverlayFooter
    );


    // =====================================================
    // 30 - Assemble Overlay
    // =====================================================

    ctrOverlay.appendChild(
        ctrOverlayPanel
    );


    // =====================================================
    // 31 - Mount Overlay
    // =====================================================

    container.classList.add(
        "project-dashboard-overlay-open"
    );

    container.appendChild(
        ctrOverlay
    );

}

// =====================================================
// Build Notification Overlay
// =====================================================

export function buildNotificationOverlay(
    container:
        HTMLDivElement,

    headerText:
        string,

    bodyText:
        string,

    mode:
        ProjectDashboardNotificationOverlayMode,

    actions?:
        ProjectDashboardNotificationOverlayActions
): void {

    // =====================================================
    // 1 - Overlay
    // =====================================================

    const ctrOverlayNotification =
        document.createElement(
            "div"
        );

    ctrOverlayNotification.className =
        "project-dashboard-overlay project-dashboard-overlay-notification";


    // =====================================================
    // 2 - Block Interaction Behind Overlay
    // =====================================================

    ctrOverlayNotification.addEventListener(
        "pointerdown",
        (
            event
        ) => {

            event.stopPropagation();

        }
    );

    ctrOverlayNotification.addEventListener(
        "click",
        (
            event
        ) => {

            event.stopPropagation();

        }
    );


    // =====================================================
    // 3 - Panel
    // =====================================================

    const ctrOverlayNotificationPanel =
        document.createElement(
            "div"
        );

    ctrOverlayNotificationPanel.className =
        "project-dashboard-overlay-panel project-dashboard-overlay-notification-panel";


    // =====================================================
    // 4 - Header
    // =====================================================

    const ctrOverlayNotificationHeader =
        document.createElement(
            "div"
        );

    ctrOverlayNotificationHeader.className =
        "project-dashboard-overlay-header project-dashboard-overlay-notification-header";

    ctrOverlayNotificationHeader.textContent =
        headerText;


    // =====================================================
    // 5 - Body
    // =====================================================

    const ctrOverlayNotificationBody =
        document.createElement(
            "div"
        );

    ctrOverlayNotificationBody.className =
        "project-dashboard-overlay-body project-dashboard-overlay-notification-body";

    ctrOverlayNotificationBody.textContent =
        bodyText;


    // =====================================================
    // 6 - Footer
    // =====================================================

    const ctrOverlayNotificationFooter =
        document.createElement(
            "div"
        );

    ctrOverlayNotificationFooter.className =
        "project-dashboard-overlay-footer project-dashboard-overlay-notification-footer";


    // =====================================================
    // 7 - Close Overlay Helper
    // =====================================================

    const closeOverlayNotification =
        (): void => {

            ctrOverlayNotification.remove();

        };


    // =====================================================
    // 8 - Build Notification Actions
    // =====================================================

    switch (
        mode
    ) {

        // =====================================================
        // 8.1 - OK Only
        // =====================================================

        case "OkOnly": {

            const btnOk =
                document.createElement(
                    "button"
                );

            btnOk.type =
                "button";

            btnOk.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-ok";

            btnOk.textContent =
                "OK";

            btnOk.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onOk?.();

                }
            );

            ctrOverlayNotificationFooter.appendChild(
                btnOk
            );

            break;

        }


        // =====================================================
        // 8.2 - Close Only
        // =====================================================

        case "CloseOnly": {

            const btnClose =
                document.createElement(
                    "button"
                );

            btnClose.type =
                "button";

            btnClose.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-close";

            btnClose.textContent =
                "Close";

            btnClose.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onClose?.();

                }
            );

            ctrOverlayNotificationFooter.appendChild(
                btnClose
            );

            break;

        }


        // =====================================================
        // 8.3 - Yes / No
        // =====================================================

        case "YesNo": {

            const btnYes =
                document.createElement(
                    "button"
                );

            btnYes.type =
                "button";

            btnYes.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-yes";

            btnYes.textContent =
                "Yes";


            const btnNo =
                document.createElement(
                    "button"
                );

            btnNo.type =
                "button";

            btnNo.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-no";

            btnNo.textContent =
                "No";


            btnYes.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onYes?.();

                }
            );


            btnNo.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onNo?.();

                }
            );


            ctrOverlayNotificationFooter.append(
                btnYes,
                btnNo
            );

            break;

        }


        // =====================================================
        // 8.4 - Retry / Cancel
        // =====================================================

        case "RetryCancel": {

            const btnRetry =
                document.createElement(
                    "button"
                );

            btnRetry.type =
                "button";

            btnRetry.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-retry";

            btnRetry.textContent =
                "Retry";


            const btnCancel =
                document.createElement(
                    "button"
                );

            btnCancel.type =
                "button";

            btnCancel.className =
                "project-dashboard-overlay-notification-button project-dashboard-overlay-notification-button-cancel";

            btnCancel.textContent =
                "Cancel";


            btnRetry.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onRetry?.();

                }
            );


            btnCancel.addEventListener(
                "click",
                () => {

                    closeOverlayNotification();

                    actions?.onCancel?.();

                }
            );


            ctrOverlayNotificationFooter.append(
                btnRetry,
                btnCancel
            );

            break;

        }


        // =====================================================
        // 8.5 - Unsupported Mode
        // =====================================================

        default:

            throw new Error(
                `[ProjectDashboard] Unsupported notification overlay mode: ${mode}`
            );

    }


    // =====================================================
    // 9 - Assemble Panel
    // =====================================================

    ctrOverlayNotificationPanel.append(
        ctrOverlayNotificationHeader,
        ctrOverlayNotificationBody,
        ctrOverlayNotificationFooter
    );


    // =====================================================
    // 10 - Assemble Overlay
    // =====================================================

    ctrOverlayNotification.appendChild(
        ctrOverlayNotificationPanel
    );


    // =====================================================
    // 11 - Mount Overlay
    // =====================================================

    container.appendChild(
        ctrOverlayNotification
    );

}

// =====================================================
// 4 - Process Update Settings Save State
// =====================================================

function processUpdateSettingsSaveState(
    btnSave: HTMLButtonElement,
    activeState: ActiveState | null,
    settingsState: ActiveState
): void {

    const primaryStateIsValid =
        !!settingsState.customerId &&
        !!settingsState.locationId &&
        !!settingsState.eventId;

    const hasChanged =
        !activeState ||
        settingsState.customerId !== activeState.customerId ||
        settingsState.locationId !== activeState.locationId ||
        settingsState.eventId !== activeState.eventId ||
        settingsState.baselineVersion !== activeState.baselineVersion ||
        settingsState.currentVersion !== activeState.currentVersion;

    const saveIsEnabled =
        primaryStateIsValid &&
        hasChanged;

    btnSave.disabled =
        !saveIsEnabled;

    btnSave.classList.toggle(
        "application-disabled",
        !saveIsEnabled
    );

}


