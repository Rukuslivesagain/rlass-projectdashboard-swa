import {
    FieldsRegistry,
    FieldsRegistryField
} from "../helpers/fields";

import * as XLSX from "xlsx";

import {
    buildUploadOverlay
} from "./overlays";

import type {
    ActiveState,
    LocationEventsRegistry
} from "../models/registries";

import {
    encodeParquetArtifact
} from "../helpers/parquet";

import {
    checkAzureArtifactAvailability,
    getArtifactsFromAzure,
    saveArtifactToAzure,
    splitAzureArtifactPackage,
    replaceArtifactInAzure,
    moveFolderContentsAndClear,
    getFolderContents,
    AzureFolderContentsEntry,
    touchChangeEtag,
    getArtifactEtag
} from "../helpers/azure";

import {
    ProjectDashboardArtifactStore
} from "../helpers/artifactStore";

// =====================================================
// Build Version Upload Wizard
// =====================================================

export function buildVersionUploadWizard(

    ctrMessages: HTMLDivElement,
    ctrDashboard: HTMLDivElement,
    ctrUploadVersion: HTMLDivElement,
    fieldsRegistry: FieldsRegistry | null,
    activeState: ActiveState | null,
    artifactStore: ProjectDashboardArtifactStore,
    processProcessingOverlay: (
        show: boolean,
        message?: string
    ) => void,
    processPayloadContext: (
        mode: "Restore"
    ) => void,
    processRestoreDashboardView: (
    ) => void,
    processSendStatus300: (
    ) => void,
    processEnableTabs:
    () => void,

    processGetScheduleUploadCompleted: (
    ) => boolean,

    processSetScheduleUploadCompleted: (
        completed: boolean
    ) => void,

    processGetWorklistUploadCompleted: (
    ) => boolean,

    processSetWorklistUploadCompleted: (
        completed: boolean
    ) => void,

    // =====================================================
    // Registry Architecture Refactor - Stage G.1 Completion.
    //
    // Resident Location Events lookup only - no Azure
    // retrieval, no path construction, no manifest
    // interpretation, no fallback to legacy
    // CustomerMasterLocation.events.
    // =====================================================

    processGetLocationEventsRegistry: (
        locationId: string
    ) => LocationEventsRegistry | null
): void {

    ctrMessages.classList.add(
        "application-hidden"
    );

    ctrDashboard.classList.add(
        "application-hidden"
    );

    ctrUploadVersion.classList.remove(
        "application-hidden"
    );

    // =====================================================
    // Upload Wizard Body
    // =====================================================

    const ctrUploadWizardBody =
        document.createElement(
            "div"
        );

    ctrUploadWizardBody.className =
        "project-dashboard-upload-wizard-body";


    // =====================================================
    // Upload Wizard Body Left
    // =====================================================

    const ctrUploadWizardBodyLeft =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyLeft.className =
        "project-dashboard-upload-wizard-body-left";


    // =====================================================
    // Upload Wizard Drop Zone
    // =====================================================

    const ctrUploadWizardDropZone =
        document.createElement(
            "div"
        );

    ctrUploadWizardDropZone.className =
        "project-dashboard-upload-wizard-drop-zone";

    ctrUploadWizardDropZone.tabIndex =
        0;

    ctrUploadWizardDropZone.setAttribute(
        "role",
        "button"
    );

    ctrUploadWizardDropZone.setAttribute(
        "aria-label",
        "Drop upload sheet here or select file"
    );

    ctrUploadWizardDropZone.setAttribute(
        "aria-disabled",
        "false"
    );


    // =====================================================
    // Upload Wizard Drop Zone - Text
    // =====================================================

    const ctrUploadWizardDropZoneText =
        document.createElement(
            "div"
        );

    ctrUploadWizardDropZoneText.className =
        "project-dashboard-upload-wizard-drop-zone-text";


    const txtUploadWizardDropZonePrimary =
        document.createElement(
            "div"
        );

    txtUploadWizardDropZonePrimary.textContent =
        "Drop upload sheet here";


    const txtUploadWizardDropZoneAction =
        document.createElement(
            "div"
        );

    txtUploadWizardDropZoneAction.className =
        "project-dashboard-upload-wizard-drop-zone-action";

    txtUploadWizardDropZoneAction.textContent =
        "or select file";

    ctrUploadWizardDropZoneText.append(
        txtUploadWizardDropZonePrimary,
        txtUploadWizardDropZoneAction
    );

    ctrUploadWizardDropZone.append(
        ctrUploadWizardDropZoneText
    );


    // =====================================================
    // Upload Wizard Drop Zone - File Picker Input
    // =====================================================

    const inpUploadWizardFilePicker =
        document.createElement(
            "input"
        );

    inpUploadWizardFilePicker.type =
        "file";

    inpUploadWizardFilePicker.accept =
        ".xlsx,.xls";

    inpUploadWizardFilePicker.classList.add(
        "application-hidden"
    );


    ctrUploadWizardBodyLeft.append(
        ctrUploadWizardDropZone,
        inpUploadWizardFilePicker
    );

    let uploadFileType:

        "Activities" |
        "Resources" |
        "Worklist" |
        null =
            null;

    let uploadFileName = "Activities";

    let uploadWorklistRows:
        unknown[][] =
            [];

    let uploadActivityRows:
        unknown[][] =
            [];

    let uploadResourceRows:
        unknown[][] =
            [];

    // =====================================================
    // Upload Health State
    // =====================================================

    const uploadHealthState = {

        Activities:
            {
                loaded:
                    false,

                rowCount:
                    0,

                missingRequiredFields:
                    [] as FieldsRegistryField[]
            },

        Resources:
            {
                loaded:
                    false,

                rowCount:
                    0,

                missingRequiredFields:
                    [] as FieldsRegistryField[]
            },

        Worklist:
            {
                loaded:
                    false,

                rowCount:
                    0,

                missingRequiredFields:
                    [] as FieldsRegistryField[]
            }

    };

    ctrUploadWizardDropZone.addEventListener(
        "dragenter",
        (
            event
        ) => {

            event.preventDefault();

            ctrUploadWizardDropZone.classList.add(
                "project-dashboard-upload-wizard-drop-zone-active"
            );

        }
    );

    ctrUploadWizardDropZone.addEventListener(
        "dragleave",
        () => {

            ctrUploadWizardDropZone.classList.remove(
                "project-dashboard-upload-wizard-drop-zone-active"
            );

        }
    );

    ctrUploadWizardDropZone.addEventListener(
        "dragover",
        (
            event
        ) => {

            event.preventDefault();
            ctrUploadWizardDropZone.classList.add(
                "project-dashboard-upload-wizard-drop-zone-active"
            );

        }
    );

    const renderHealthTableRows =
    (
    ): void => {

        if (
            !healthTableBody ||
            !fieldsRegistry ||
            !uploadFileType
        ) {

            return;

        }

        healthTableBody.innerHTML =
            "";

        let registryFields;

        let sourceRows:
            unknown[][];

        if (
            uploadFileType ===
            "Activities"
        ) {

            registryFields =
                fieldsRegistry.activities?.fields;

            sourceRows =
                uploadActivityRows;

        }
        else if (
            uploadFileType ===
            "Resources"
        ) {

            registryFields =
                fieldsRegistry.resources?.fields;

            sourceRows =
                uploadResourceRows;

        }
        else {

            registryFields =
                fieldsRegistry.worklist?.fields;

            sourceRows =
                uploadWorklistRows;

        }

        if (
            !registryFields
        ) {

            console.warn(
                "[ProjectDashboard] Registry fields not available for:",
                uploadFileType
            );

            return;

        }

        const datasetIsLoaded =
            uploadHealthState[
                uploadFileType
            ].loaded;

        // =================================================
        // Real Header Row - Row 1 / rows[0] Is Always The
        // Header Regardless Of Where Data Rows Actually
        // Begin. Per-Field Status Below Is A True Header
        // Match, Not A Single Loaded Flag Repeated Per Row
        // =================================================

        const headerRow:
            unknown[] =
                datasetIsLoaded ?
                    (
                        (
                            sourceRows[
                                0
                            ] as unknown[]
                        ) ??
                            []
                    ) :
                    [];

        for (
            const field of registryFields
        ) {

            const row =
                document.createElement(
                    "tr"
                );

            let status:
                string;

            let statusClass:
                string;

            if (
                !datasetIsLoaded
            ) {

                status =
                    "Not Loaded";

                statusClass =
                    "project-dashboard-health-status-not-loaded";

            }
            else if (
                field.lookupKey ===
                    null
            ) {

                // =========================================
                // Generated/Stamped Field - Not Sourced From
                // The Workbook At All. Never A Missing-Header
                // Failure Regardless Of field.required
                // =========================================

                status =
                    "NA";

                statusClass =
                    "project-dashboard-health-status-not-loaded";

            }
            else {

                const headerMatched =
                    headerRow.findIndex(
                        header =>
                            String(
                                header ??
                                ""
                            ).trim() ===
                                field.lookupKey
                    ) >=
                        0;

                if (
                    headerMatched
                ) {

                    status =
                        "✓";

                    statusClass =
                        "project-dashboard-health-status-pass";

                }
                else if (
                    field.required
                ) {

                    status =
                        "Missing";

                    statusClass =
                        "project-dashboard-health-status-fail";

                }
                else {

                    status =
                        "Not Found";

                    statusClass =
                        "project-dashboard-health-status-not-loaded";

                }

            }

            row.innerHTML = `
                <td>${field.displayName}</td>
                <td>${field.required ? "Yes" : "No"}</td>
                <td class="${statusClass}">
                    ${status}
                </td>
            `;

            healthTableBody.appendChild(
                row
            );

        }

    };

    const getFieldHealth =
    (
        rows: unknown[][],
        sourceFieldName: string
    ): {
        pass: number;
        fail: number;
    } => {

        const {
            headerRow,
            dataRows
        } =
            processExtractUploadDataRows(
                rows
            );

        const columnIndex =
            headerRow.findIndex(
                value =>
                    String(
                        value ?? ""
                    ).trim() ===
                    sourceFieldName
            );

        let pass =
            0;

        let fail =
            0;

        if (
            columnIndex < 0
        ) {

            return {
                pass,
                fail
            };

        }

        for (
            const row of dataRows
        ) {

            const value =
                row[
                    columnIndex
                ];

            if (
                value !== undefined &&
                value !== null &&
                String(
                    value
                ).trim() !== ""
            ) {

                pass++;

            }
            else {

                fail++;

            }

        }

        return {
            pass,
            fail
        };

    };

    // =====================================================
    // Process Upload Type Is Eligible
    // Single Owner Of Create Version Eligibility Per Tab
    // Schedule (Activities/Resources) Requires Both Datasets
    // Worklist Requires Only Its Own Dataset
    // =====================================================

    const processUploadTypeIsEligible =
    (
        uploadType:
            "Activities" |
            "Resources" |
            "Worklist"
    ): boolean => {

        if (
            uploadType ===
                "Worklist"
        ) {

            return (
                uploadHealthState.Worklist.loaded &&
                uploadHealthState.Worklist.missingRequiredFields.length ===
                    0 &&
                !processGetWorklistUploadCompleted()
            );

        }

        return (
            uploadHealthState.Activities.loaded &&
            uploadHealthState.Resources.loaded &&
            uploadHealthState.Activities.missingRequiredFields.length ===
                0 &&
            uploadHealthState.Resources.missingRequiredFields.length ===
                0 &&
            !processGetScheduleUploadCompleted()
        );

    };

    // =====================================================
    // Process Upload Candidate Exists
    // Single Owner Of "An Active Upload Candidate Is Loaded"
    // V1 Permits At Most One Loaded Candidate Per Session
    // =====================================================

    const processUploadCandidateExists =
        (): boolean =>
            uploadHealthState.Activities.loaded ||
            uploadHealthState.Resources.loaded ||
            uploadHealthState.Worklist.loaded;

    // =====================================================
    // Process Set Acquisition Locked
    // Single Owner Of Drop Zone Locked Presentation
    // =====================================================

    const processSetAcquisitionLocked =
        (
            locked:
                boolean
        ): void => {

            ctrUploadWizardDropZone.classList.toggle(
                "application-disabled",
                locked
            );

            ctrUploadWizardDropZone.setAttribute(
                "aria-disabled",
                locked ?
                    "true" :
                    "false"
            );

        };

    // =====================================================
    // Process Update Upload Tab Health State
    // Single Owner Of Schedule Tab Error Presentation
    // A Tab Is In Error Only When The Other Required Schedule
    // Dataset Is Loaded And This One Is Not - A Worklist-Only
    // Candidate Never Paints Activities/Resources As Error
    // =====================================================

    const processUpdateUploadTabHealthState =
        (): void => {

            uploadWizardTabs.forEach(
                tab => {

                    const tabUploadType =
                        (
                            tab as HTMLButtonElement
                        ).dataset.uploadType;

                    let tabHasScheduleError =
                        false;

                    if (
                        tabUploadType ===
                            "Activities"
                    ) {

                        tabHasScheduleError =
                            uploadHealthState.Resources.loaded &&
                            !uploadHealthState.Activities.loaded;

                    }
                    else if (
                        tabUploadType ===
                            "Resources"
                    ) {

                        tabHasScheduleError =
                            uploadHealthState.Activities.loaded &&
                            !uploadHealthState.Resources.loaded;

                    }

                    tab.classList.toggle(
                        "project-dashboard-upload-wizard-tab-error",
                        tabHasScheduleError
                    );

                }
            );

        };

    // =====================================================
    // Process Upload Wizard File
    // Shared By Drag/Drop And File Picker Acquisition
    // =====================================================

    const processUploadWizardFile =
        async (
            file:
                File
        ): Promise<void> => {

            // =================================================
            // Refuse A Second Candidate
            // V1 Permits At Most One Loaded Candidate At A Time
            // =================================================

            if (
                processUploadCandidateExists()
            ) {

                console.warn(
                    "[ProjectDashboard] Upload acquisition is locked - clear the current candidate before loading another workbook"
                );

                return;

            }

            uploadFileName =
                file.name;

            processProcessingOverlay(
                true,
                "Processing Upload..."
            );

            await new Promise<void>(
                resolve =>
                    setTimeout(
                        resolve,
                        50
                    )
            );

            try {

                    const fileName =
                        file.name.toLowerCase();

                    if (
                        !fileName.endsWith(
                            ".xlsx"
                        ) &&
                        !fileName.endsWith(
                            ".xls"
                        )
                    ) {

                        ctrUploadWizardBodyRightHeaderPrimary.textContent =
                            "Unsupported File";

                        console.warn(
                            "[ProjectDashboard] Unsupported Upload File:",
                            file.name
                        );

                        return;

                    }

                    const fileBuffer =
                        await file.arrayBuffer();

                    const workbook =
                        XLSX.read(
                            fileBuffer,
                            {
                                type:
                                    "array"
                            }
                        );


                    // =====================================================
                    // Detect Upload Sheets
                    // =====================================================

                    const hasActivities =
                        workbook.SheetNames.includes(
                            "3-AC_For_upload"
                        );

                    const hasResources =
                        workbook.SheetNames.includes(
                            "3-RA_For_upload"
                        );

                    const hasWorklist =
                        workbook.SheetNames.includes(
                            "3-WL_For_upload"
                        );


                    console.log(
                        "[ProjectDashboard] Upload Sheets Detected:",
                        {
                            hasActivities,
                            hasResources,
                            hasWorklist
                        }
                    );


                    // =====================================================
                    // Activities
                    // =====================================================

                    if (
                        hasActivities
                    ) {

                        const activitySheet =
                            workbook.Sheets[
                                "3-AC_For_upload"
                            ];

                        const activityRows =
                            XLSX.utils.sheet_to_json(
                                activitySheet,
                                {
                                    header:
                                        1
                                }
                            ) as unknown[][];


                        // =====================================================
                        // Retain Raw Activity Rows
                        // Owned By This Upload Session Until Clear/Exit
                        // =====================================================

                        uploadActivityRows =
                            activityRows;


                        // =====================================================
                        // Activity ID Health Check
                        // =====================================================

                        const activityIdHealth =
                            getFieldHealth(
                                activityRows,
                                "task_code"
                            );

                        console.log(
                            "[ProjectDashboard] Activity ID Health:",
                            activityIdHealth
                        );


                        const activityDataExtraction =
                            processExtractUploadDataRows(
                                activityRows
                            );

                        const activityCount =
                            activityDataExtraction.dataRows.length;

                        uploadHealthState.Activities.loaded =
                            true;

                        uploadHealthState.Activities.rowCount =
                            activityCount;

                        uploadHealthState.Activities.missingRequiredFields =
                            fieldsRegistry ?
                                processFindMissingRequiredUploadFields(
                                    activityDataExtraction.headerRow,
                                    fieldsRegistry.activities.fields
                                ) :
                                [];

                        // =================================================
                        // TEMPORARY DIAGNOSTIC - Schedule Row Contract
                        // =================================================

                        console.log(
                            "[ProjectDashboard] TEMPORARY DIAGNOSTIC - Activities workbook rows:",
                            {
                                worksheetRows:
                                    activityRows.length,

                                actualDataRows:
                                    activityCount,

                                headers:
                                    activityDataExtraction.headerRow,

                                expectedHeaders:
                                    fieldsRegistry ?
                                        fieldsRegistry.activities.fields
                                            .map(
                                                field =>
                                                    field.lookupKey
                                            )
                                            .filter(
                                                (lookupKey): lookupKey is string =>
                                                    lookupKey !==
                                                        null
                                            ) :
                                        [],

                                missingRequiredFields:
                                    uploadHealthState.Activities.missingRequiredFields.map(
                                        field =>
                                            field.displayName
                                    )
                            }
                        );

                        renderHealthTableRows();

                        // =====================================================
                        // Refresh Selected Upload Summary
                        // =====================================================

                        const selectedUploadType =
                            uploadFileType;

                        if (
                            selectedUploadType
                        ) {

                            processUpdateUploadSummary(
                                ctrUploadWizardBodyRightHeaderPrimaryText,
                                selectedUploadType,
                                uploadFileName,
                                uploadHealthState[
                                    selectedUploadType
                                ].rowCount
                            );

                        }

                    }

                    // =====================================================
                    // Resources
                    // =====================================================

                    if (
                        hasResources
                    ) {

                        const resourceSheet =
                            workbook.Sheets[
                                "3-RA_For_upload"
                            ];

                        const resourceRows =
                            XLSX.utils.sheet_to_json(
                                resourceSheet,
                                {
                                    header:
                                        1
                                }
                            ) as unknown[][];


                        // =====================================================
                        // Retain Raw Resource Rows
                        // Owned By This Upload Session Until Clear/Exit
                        // =====================================================

                        uploadResourceRows =
                            resourceRows;

                        const resourceDataExtraction =
                            processExtractUploadDataRows(
                                resourceRows
                            );

                        const resourceCount =
                            resourceDataExtraction.dataRows.length;

                        uploadHealthState.Resources.loaded =
                            true;

                        uploadHealthState.Resources.rowCount =
                            resourceCount;

                        uploadHealthState.Resources.missingRequiredFields =
                            fieldsRegistry ?
                                processFindMissingRequiredUploadFields(
                                    resourceDataExtraction.headerRow,
                                    fieldsRegistry.resources.fields
                                ) :
                                [];

                        // =================================================
                        // TEMPORARY DIAGNOSTIC - Schedule Row Contract
                        // =================================================

                        console.log(
                            "[ProjectDashboard] TEMPORARY DIAGNOSTIC - Resources workbook rows:",
                            {
                                worksheetRows:
                                    resourceRows.length,

                                actualDataRows:
                                    resourceCount,

                                headers:
                                    resourceDataExtraction.headerRow,

                                expectedHeaders:
                                    fieldsRegistry ?
                                        fieldsRegistry.resources.fields
                                            .map(
                                                field =>
                                                    field.lookupKey
                                            )
                                            .filter(
                                                (lookupKey): lookupKey is string =>
                                                    lookupKey !==
                                                        null
                                            ) :
                                        [],

                                missingRequiredFields:
                                    uploadHealthState.Resources.missingRequiredFields.map(
                                        field =>
                                            field.displayName
                                    )
                            }
                        );

                        renderHealthTableRows();

                    }

                    // =====================================================
                    // Worklist
                    // =====================================================

                    if (
                        hasWorklist
                    ) {

                        const worklistSheet =
                            workbook.Sheets[
                                "3-WL_For_upload"
                            ];

                        uploadWorklistRows =
                            XLSX.utils.sheet_to_json(
                                worklistSheet,
                                {
                                    header:
                                        1
                                }
                            ) as unknown[][];

                        const worklistDataExtraction =
                            processExtractUploadDataRows(
                                uploadWorklistRows
                            );

                        const worklistCount =
                            worklistDataExtraction.dataRows.length;

                        uploadHealthState.Worklist.loaded =
                            true;

                        uploadHealthState.Worklist.rowCount =
                            worklistCount;

                        uploadHealthState.Worklist.missingRequiredFields =
                            fieldsRegistry ?
                                processFindMissingRequiredUploadFields(
                                    worklistDataExtraction.headerRow,
                                    fieldsRegistry.worklist.fields
                                ) :
                                [];

                        // =================================================
                        // TEMPORARY DIAGNOSTIC - Worklist Row Contract
                        // =================================================

                        console.log(
                            "[ProjectDashboard] TEMPORARY DIAGNOSTIC - Worklist workbook rows:",
                            {
                                worksheetRows:
                                    uploadWorklistRows.length,

                                actualDataRows:
                                    worklistCount,

                                missingRequiredFields:
                                    uploadHealthState.Worklist.missingRequiredFields.map(
                                        field =>
                                            field.displayName
                                    )
                            }
                        );

                        renderHealthTableRows();

                    }

                    const uploadHasData =
                        processUploadCandidateExists();

                    btnUploadWizardClear.disabled =
                        !uploadHasData;

                    btnUploadWizardClear.classList.toggle(
                        "application-disabled",
                        !uploadHasData
                    );

                    processSetAcquisitionLocked(
                        uploadHasData
                    );

                    processUpdateUploadTabHealthState();

                    if (
                        uploadFileType
                    ) {

                        const selectedDatasetIsLoaded =
                            processUploadTypeIsEligible(
                                uploadFileType
                            );

                        btnUploadWizardCreate.disabled =
                            !selectedDatasetIsLoaded;

                        btnUploadWizardCreate.classList.toggle(
                            "application-disabled",
                            !selectedDatasetIsLoaded
                        );

                    }

            }
            finally {

                processProcessingOverlay(
                    false
                );

            }

            console.log(
                "[ProjectDashboard] Upload Wizard File Received:",
                {
                    name:
                        file.name,

                    size:
                        file.size,

                    type:
                        file.type,

                    lastModified:
                        file.lastModified
                }
            );

        };


    // =====================================================
    // Upload Wizard Drop Zone - Drop
    // =====================================================

    ctrUploadWizardDropZone.addEventListener(
        "drop",
        async (
            event
        ) => {

            event.preventDefault();

            ctrUploadWizardDropZone.classList.remove(
                "project-dashboard-upload-wizard-drop-zone-active"
            );

            if (
                processUploadCandidateExists()
            ) {

                return;

            }

            const file =
                event.dataTransfer?.files?.[0];

            if (
                !file
            ) {

                return;

            }

            await processUploadWizardFile(
                file
            );

        }

    );


    // =====================================================
    // Upload Wizard Drop Zone - Click Opens File Picker
    // =====================================================

    ctrUploadWizardDropZone.addEventListener(
        "click",
        () => {

            if (
                processUploadCandidateExists()
            ) {

                return;

            }

            inpUploadWizardFilePicker.click();

        }
    );


    // =====================================================
    // Upload Wizard Drop Zone - Keyboard Opens File Picker
    // =====================================================

    ctrUploadWizardDropZone.addEventListener(
        "keydown",
        (
            event
        ) => {

            if (
                event.key !==
                    "Enter" &&
                event.key !==
                    " "
            ) {

                return;

            }

            event.preventDefault();

            if (
                processUploadCandidateExists()
            ) {

                return;

            }

            inpUploadWizardFilePicker.click();

        }
    );


    // =====================================================
    // Upload Wizard File Picker - Change
    // =====================================================

    inpUploadWizardFilePicker.addEventListener(
        "change",
        async () => {

            const file =
                inpUploadWizardFilePicker.files?.[0];

            // =================================================
            // Reset Input Value
            // Allows Re-Selecting The Same File To Trigger
            // A Subsequent Change Event
            // =================================================

            inpUploadWizardFilePicker.value =
                "";

            if (
                !file
            ) {

                return;

            }

            await processUploadWizardFile(
                file
            );

        }
    );


    // =====================================================
    // Upload Wizard Body Right
    // Health
    // =====================================================

    const ctrUploadWizardBodyRight =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRight.className =
        "project-dashboard-upload-wizard-body-right";


    // =====================================================
    // Upload Wizard Body Right Header
    // =====================================================

    const ctrUploadWizardBodyRightHeader =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightHeader.className =
        "project-dashboard-upload-wizard-body-right-header";


    // =====================================================
    // Upload Wizard Body Right Header - Primary
    // =====================================================

    const ctrUploadWizardBodyRightHeaderPrimary =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightHeaderPrimary.className =
        "project-dashboard-upload-wizard-body-right-header-primary";


    // =====================================================
    // Upload Wizard Body Right Header - Primary Text
    // =====================================================

    const ctrUploadWizardBodyRightHeaderPrimaryText =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightHeaderPrimaryText.className =
        "project-dashboard-upload-wizard-body-right-header-primary-text";

    ctrUploadWizardBodyRightHeaderPrimaryText.textContent =
        "Upload Type = Not Loaded | File Name = Not Loaded | Row Count = 0";


    // =====================================================
    // Upload Wizard Body Right Header - Close Button
    // =====================================================

    const btnUploadWizardClose =
        document.createElement(
            "button"
        );

    btnUploadWizardClose.className =
        "project-dashboard-upload-wizard-button-close";

    btnUploadWizardClose.type =
        "button";

    btnUploadWizardClose.textContent =
        "×";

    btnUploadWizardClose.title =
        "Close";

    btnUploadWizardClose.setAttribute(
        "aria-label",
        "Close Upload Version Wizard"
    );

    // =====================================================
    // Upload Wizard Body Right Header - Assemble Primary
    // =====================================================

    ctrUploadWizardBodyRightHeaderPrimary.append(
        ctrUploadWizardBodyRightHeaderPrimaryText,
        btnUploadWizardClose
    );


    // =====================================================
    // Upload Wizard Body Right Header - Tabs
    // =====================================================

    const ctrUploadWizardBodyRightHeaderTabs =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightHeaderTabs.className =
        "project-dashboard-upload-wizard-body-right-header-tabs";


    // =====================================================
    // Upload Wizard Body Right Header - Assemble
    // =====================================================

    ctrUploadWizardBodyRightHeader.appendChild(
        ctrUploadWizardBodyRightHeaderPrimary
    );

    ctrUploadWizardBodyRightHeader.appendChild(
        ctrUploadWizardBodyRightHeaderTabs
    );


    // =====================================================
    // Upload Wizard Tabs
    // =====================================================

    ctrUploadWizardBodyRightHeaderTabs.innerHTML = `
        <button
            type="button"
            class="project-dashboard-upload-wizard-tab"
            data-upload-type="Activities"
        >
            <span class="project-dashboard-upload-wizard-tab-badge"></span>
            Activities
        </button>

        <button
            type="button"
            class="project-dashboard-upload-wizard-tab"
            data-upload-type="Resources"
        >
            <span class="project-dashboard-upload-wizard-tab-badge"></span>
            Resources
        </button>

        <button
            type="button"
            class="project-dashboard-upload-wizard-tab"
            data-upload-type="Worklist"
        >
            <span class="project-dashboard-upload-wizard-tab-badge"></span>
            Worklist
        </button>

    `;


    // =====================================================
    // Upload Wizard Tab - References
    // =====================================================

    const uploadWizardTabs =
        ctrUploadWizardBodyRightHeaderTabs.querySelectorAll(
            ".project-dashboard-upload-wizard-tab"
        );

    uploadWizardTabs[
        0
    ]?.classList.add(
        "project-dashboard-upload-wizard-tab-selected"
    );


    // =====================================================
    // Process Apply Upload Entry Completion State
    // Single Owner Of Session Completion Badge Presentation -
    // Shared By All Three Upload Entries. Completion No
    // Longer Disables Tab Navigation - Navigation Eligibility
    // Is Independent Of Create Version Eligibility, Which
    // processUploadTypeIsEligible() Governs Separately
    // =====================================================

    const processApplyUploadEntryCompletionState =
        (
            uploadType:
                "Activities" |
                "Resources" |
                "Worklist",

            isCompletedThisSession:
                boolean
        ): void => {

            const tab =
                Array.from(
                    uploadWizardTabs
                ).find(
                    candidateTab =>
                        (
                            candidateTab as HTMLButtonElement
                        ).dataset.uploadType ===
                            uploadType
                ) as HTMLButtonElement | undefined;

            if (
                !tab
            ) {

                return;

            }

            tab.title =
                isCompletedThisSession ?
                    `${uploadType} already uploaded this session.` :
                    "";

            const badge =
                tab.querySelector(
                    ".project-dashboard-upload-wizard-tab-badge"
                ) as HTMLSpanElement | null;

            if (
                badge
            ) {

                badge.classList.toggle(
                    "project-dashboard-upload-wizard-tab-badge-complete",
                    isCompletedThisSession
                );

                badge.textContent =
                    isCompletedThisSession ?
                        "✓" :
                        "";

            }

        };


    // =====================================================
    // Process Render Upload Completion Badges
    // Re-Reads Session State Every Call So It Can Be Used
    // Both For The Initial Render And For Any Later Refresh
    // After A Successful Transaction Closes
    // =====================================================

    const processRenderUploadCompletionBadges =
        (): void => {

            processApplyUploadEntryCompletionState(
                "Activities",
                processGetScheduleUploadCompleted()
            );

            processApplyUploadEntryCompletionState(
                "Resources",
                processGetScheduleUploadCompleted()
            );

            processApplyUploadEntryCompletionState(
                "Worklist",
                processGetWorklistUploadCompleted()
            );

        };

    processRenderUploadCompletionBadges();


    // =====================================================
    // Process Mark Schedule/Worklist Upload Completed
    // Composes The Class-Level Session State Setter With The
    // Local Badge Refresh So processSaveUploadSchedule/
    // processSaveUploadWorklist Only Need To Call One Thing
    // At Their Authoritative Success Point
    // =====================================================

    const processMarkScheduleUploadCompleted =
        (): void => {

            processSetScheduleUploadCompleted(
                true
            );

            processRenderUploadCompletionBadges();

        };

    const processMarkWorklistUploadCompleted =
        (): void => {

            processSetWorklistUploadCompleted(
                true
            );

            processRenderUploadCompletionBadges();

        };


    // =====================================================
    // Upload Wizard Body Right Body
    // =====================================================

    const ctrUploadWizardBodyRightBody =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightBody.className =
        "project-dashboard-upload-wizard-body-right-body";

    const healthTable =
        document.createElement(
            "table"
        );

    healthTable.className =
        "project-dashboard-upload-wizard-health-table";

    healthTable.innerHTML = `
        <thead>
            <tr>
                <th>Field Name</th>
                <th>Required</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    ctrUploadWizardBodyRightBody.appendChild(
        healthTable
    );

    const healthTableBody =
        healthTable.querySelector(
            "tbody"
        );

    uploadFileType =
        "Activities";

    renderHealthTableRows();

    // =====================================================
    // Upload Wizard Body Right Footer
    // =====================================================

    const ctrUploadWizardBodyRightFooter =
        document.createElement(
            "div"
        );

    ctrUploadWizardBodyRightFooter.className =
        "project-dashboard-upload-wizard-body-right-footer";
    
    // =====================================================
    // Upload Wizard Footer Buttons
    // =====================================================

    ctrUploadWizardBodyRightFooter.innerHTML = `

        <button
            type="button"
            class="project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-create"
        >
            Create Version
        </button>

        <button
            type="button"
            class="project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-cancel"
        >
            Cancel
        </button>

        <div
            class="project-dashboard-upload-wizard-footer-separator"
        ></div>

        <button
            type="button"
            class="project-dashboard-upload-wizard-button project-dashboard-upload-wizard-button-clear"
        >
            Clear
        </button>
    `;

    const btnUploadWizardCreate =
        ctrUploadWizardBodyRightFooter.querySelector(
            ".project-dashboard-upload-wizard-button-create"
        ) as HTMLButtonElement;

        btnUploadWizardCreate.disabled =
            true;

        btnUploadWizardCreate.classList.add(
            "application-disabled"
        );

        btnUploadWizardCreate.addEventListener(
            "click",
            () => {

                // =====================================================
                // Validate Active State
                // =====================================================

                if (
                    !activeState
                ) {

                    throw new Error(
                        "[ProjectDashboard] Active State is not available"
                    );

                }


                // =====================================================
                // Route Upload Workflow
                // =====================================================

                switch (
                    uploadFileType
                ) {

                    // =================================================
                    // Worklist Upload
                    // =================================================

                    case "Worklist":
                    {

                        // =================================================
                        // Execution Guard - Session Completion
                        // Backs Up The Disabled Tab/Button
                        // Presentation - Refuses To Start A Second
                        // Worklist Upload This Session Regardless Of
                        // Stale DOM/Handler Invocation
                        // =================================================

                        if (
                            processGetWorklistUploadCompleted()
                        ) {

                            return;

                        }


                        // =================================================
                        // Build Worklist Upload Overlay
                        // Version Identity Is NOT Generated Here - The
                        // Dialog Is Preparation Only. Version Creation Is
                        // Deferred To Save Upload (Commit Intent), Matching
                        // The Schedule Create Version Reference Pattern
                        // =================================================

                        const uploadOverlay =
                            buildUploadOverlay(
                                ctrUploadVersion,
                                "UploadWorklist",
                                {
                                    rowCount:
                                        uploadHealthState.Worklist.rowCount,

                                    customerId:
                                        activeState.customerId,

                                    locationId:
                                        activeState.locationId,

                                    eventId:
                                        activeState.eventId,

                                    steps: [
                                        "Build canonical Worklist data",
                                        "Build Worklist Parquet",
                                        "Archive current Worklist version",
                                        "Validate target path",
                                        "Save Worklist to Azure",
                                        "Validate Worklist in Azure",
                                        "Save Worklist to IndexedDB",
                                        "Update Worklist Versions Registry",
                                        "Refresh resident Worklist state",
                                        "Update ETag"
                                    ]
                                }
                            );


                        // =================================================
                        // Worklist Upload - Version Outcome Section
                        // Permanent - Not A Processing Step - Does Not
                        // Participate In processUploadStep Indexing.
                        // Mirrors The Schedule Create Version Outcome
                        // Section/Classes Exactly
                        // =================================================

                        const ctrWorklistVersionOutcomeSection =
                            document.createElement(
                                "div"
                            );

                        ctrWorklistVersionOutcomeSection.className =
                            "project-dashboard-overlay-schedule-version-outcome-section";


                        // =================================================
                        // Worklist Upload - Version Outcome Row
                        // Reuses The Existing Progress Step/Status/Text
                        // Visual Language
                        // =================================================

                        const ctrWorklistVersionOutcomeRow =
                            document.createElement(
                                "div"
                            );

                        ctrWorklistVersionOutcomeRow.className =
                            "project-dashboard-overlay-upload-progress-step";

                        const ctrWorklistVersionOutcomeStatus =
                            document.createElement(
                                "span"
                            );

                        ctrWorklistVersionOutcomeStatus.className =
                            "project-dashboard-overlay-upload-progress-status";

                        ctrWorklistVersionOutcomeStatus.textContent =
                            "○";

                        const ctrWorklistVersionOutcomeText =
                            document.createElement(
                                "span"
                            );

                        ctrWorklistVersionOutcomeText.className =
                            "project-dashboard-overlay-upload-progress-text";

                        ctrWorklistVersionOutcomeText.textContent =
                            "Version pending...";

                        ctrWorklistVersionOutcomeRow.append(
                            ctrWorklistVersionOutcomeStatus,
                            ctrWorklistVersionOutcomeText
                        );

                        ctrWorklistVersionOutcomeSection.appendChild(
                            ctrWorklistVersionOutcomeRow
                        );

                        uploadOverlay.body.appendChild(
                            ctrWorklistVersionOutcomeSection
                        );


                        // =================================================
                        // Save Worklist Upload
                        // =================================================

                        const btnUploadOverlaySave =
                            uploadOverlay.overlay.querySelector(
                                ".project-dashboard-overlay-save"
                            ) as HTMLButtonElement;

                        btnUploadOverlaySave.addEventListener(
                            "click",
                            async () => {

                                if (
                                    btnUploadOverlaySave.disabled
                                ) {

                                    return;

                                }

                                btnUploadOverlaySave.disabled =
                                    true;

                                btnUploadOverlaySave.classList.add(
                                    "application-disabled"
                                );

                                console.log(
                                    "[ProjectDashboard] Save Worklist Upload clicked"
                                );

                                await processSaveUploadWorklist(
                                    fieldsRegistry!,
                                    uploadWorklistRows,
                                    activeState,
                                    artifactStore,
                                    uploadOverlay,
                                    processMarkWorklistUploadCompleted,
                                    processGetLocationEventsRegistry
                                );

                            }
                        );

                        break;

                    }


                    // =================================================
                    // Schedule Upload
                    // Activities + Resources belong to same transaction
                    // =================================================

                    case "Activities":
                    case "Resources":
                    {

                        // =================================================
                        // Execution Guard - Session Completion
                        // Backs Up The Disabled Tab/Button Presentation -
                        // Refuses To Start A Second Schedule Create
                        // Version This Session Regardless Of Stale
                        // DOM/Handler Invocation
                        // =================================================

                        if (
                            processGetScheduleUploadCompleted()
                        ) {

                            return;

                        }


                        // =================================================
                        // Schedule Type - Baseline Folder Contents Session
                        // Cache Belongs To This Create Version Overlay Only
                        // =================================================

                        let baselineFolderContentsStatus:
                            "NotLoaded" |
                            "Loading" |
                            "Loaded" |
                            "Failed" =
                                "NotLoaded";

                        let baselineFolderContents:
                            AzureFolderContentsEntry[] =
                                [];


                        // =================================================
                        // Build Schedule Upload Overlay
                        // =================================================

                        const uploadOverlay =
                            buildUploadOverlay(
                                ctrUploadVersion,
                                "CreateVersion",
                                {
                                    rowCount:
                                        uploadHealthState.Activities.rowCount,

                                    activityCount:
                                        uploadHealthState.Activities.rowCount,

                                    resourceCount:
                                        uploadHealthState.Resources.rowCount,

                                    customerId:
                                        activeState.customerId,

                                    locationId:
                                        activeState.locationId,

                                    eventId:
                                        activeState.eventId,

                                    steps: [
                                        "Build canonical schedule data",
                                        "Build schedule Parquet",
                                        "Validate target path",
                                        "Save schedule to Azure",
                                        "Validate schedule in Azure"
                                    ],

                                    panelClass:
                                        "project-dashboard-overlay-panel-schedule"
                                }
                            );


                        // =================================================
                        // Schedule Upload - Schedule Type Section
                        // =================================================

                        const ctrScheduleTypeSection =
                            document.createElement(
                                "div"
                            );

                        ctrScheduleTypeSection.className =
                            "project-dashboard-overlay-schedule-type-section";


                        // =================================================
                        // Schedule Upload - Schedule Type - Control Row
                        // =================================================

                        const ctrScheduleTypeRow =
                            document.createElement(
                                "div"
                            );

                        ctrScheduleTypeRow.className =
                            "project-dashboard-overlay-schedule-type-row";


                        // =================================================
                        // Schedule Upload - Schedule Type
                        // =================================================

                        const lblScheduleType =
                            document.createElement(
                                "div"
                            );

                        lblScheduleType.className =
                            "project-dashboard-overlay-schedule-type-heading";

                        lblScheduleType.textContent =
                            "Schedule Type";


                        // =================================================
                        // Schedule Upload - Schedule Type - Current Plan
                        // =================================================

                        const lblScheduleTypeCurrent =
                            document.createElement(
                                "label"
                            );

                        lblScheduleTypeCurrent.className =
                            "project-dashboard-overlay-schedule-type-label";

                        const radScheduleTypeCurrent =
                            document.createElement(
                                "input"
                            );

                        radScheduleTypeCurrent.type =
                            "radio";

                        radScheduleTypeCurrent.name =
                            "project-dashboard-overlay-schedule-type";

                        radScheduleTypeCurrent.className =
                            "project-dashboard-overlay-schedule-type-radio";

                        const txtScheduleTypeCurrent =
                            document.createElement(
                                "span"
                            );

                        txtScheduleTypeCurrent.textContent =
                            "Current Plan";

                        lblScheduleTypeCurrent.append(
                            radScheduleTypeCurrent,
                            txtScheduleTypeCurrent
                        );


                        // =================================================
                        // Schedule Upload - Schedule Type - Baseline Plan
                        // =================================================

                        const lblScheduleTypeBaseline =
                            document.createElement(
                                "label"
                            );

                        lblScheduleTypeBaseline.className =
                            "project-dashboard-overlay-schedule-type-label";

                        const radScheduleTypeBaseline =
                            document.createElement(
                                "input"
                            );

                        radScheduleTypeBaseline.type =
                            "radio";

                        radScheduleTypeBaseline.name =
                            "project-dashboard-overlay-schedule-type";

                        radScheduleTypeBaseline.className =
                            "project-dashboard-overlay-schedule-type-radio";

                        const txtScheduleTypeBaseline =
                            document.createElement(
                                "span"
                            );

                        txtScheduleTypeBaseline.textContent =
                            "Baseline Plan";

                        lblScheduleTypeBaseline.append(
                            radScheduleTypeBaseline,
                            txtScheduleTypeBaseline
                        );


                        // =================================================
                        // Schedule Upload - Baseline Version
                        // =================================================

                        const selBaselineVersion =
                            document.createElement(
                                "select"
                            );

                        selBaselineVersion.className =
                            "project-dashboard-overlay-schedule-baseline-select";

                        selBaselineVersion.disabled =
                            true;

                        selBaselineVersion.classList.add(
                            "application-disabled"
                        );

                        const optBaselineVersion =
                            document.createElement(
                                "option"
                            );

                        optBaselineVersion.value =
                            "";

                        optBaselineVersion.textContent =
                            "Select Baseline Version";

                        selBaselineVersion.appendChild(
                            optBaselineVersion
                        );


                        // =================================================
                        // Schedule Upload - Baseline Version Options
                        // BL1-BL20 Only - BL0 Is Historical, Not Selectable
                        // =================================================

                        for (
                            let baselineNumber = 1;
                            baselineNumber <= 20;
                            baselineNumber += 1
                        ) {

                            const optBaseline =
                                document.createElement(
                                    "option"
                                );

                            optBaseline.value =
                                `BL${baselineNumber}`;

                            optBaseline.textContent =
                                `BL${baselineNumber}`;

                            selBaselineVersion.appendChild(
                                optBaseline
                            );

                        }


                        // =================================================
                        // Schedule Upload - Baseline Availability Message
                        // =================================================

                        const ctrBaselineAvailabilityMessage =
                            document.createElement(
                                "div"
                            );

                        ctrBaselineAvailabilityMessage.className =
                            "project-dashboard-overlay-schedule-baseline-message";

                        ctrBaselineAvailabilityMessage.textContent =
                            "Select plan type.";


                        // =================================================
                        // Schedule Upload - Assemble Schedule Type Section
                        // =================================================

                        ctrScheduleTypeRow.append(
                            lblScheduleTypeCurrent,
                            lblScheduleTypeBaseline,
                            selBaselineVersion
                        );

                        ctrScheduleTypeSection.append(
                            lblScheduleType,
                            ctrScheduleTypeRow,
                            ctrBaselineAvailabilityMessage
                        );

                        if (
                            !uploadOverlay.progress
                        ) {

                            throw new Error(
                                "[ProjectDashboard] Schedule upload overlay structure is incomplete"
                            );

                        }

                        uploadOverlay.body.insertBefore(
                            ctrScheduleTypeSection,
                            uploadOverlay.progress
                        );


                        // =================================================
                        // Schedule Upload - Version Outcome Section
                        // Permanent - Not A Processing Step - Does Not
                        // Participate In processUploadStep Indexing
                        // =================================================

                        const ctrScheduleVersionOutcomeSection =
                            document.createElement(
                                "div"
                            );

                        ctrScheduleVersionOutcomeSection.className =
                            "project-dashboard-overlay-schedule-version-outcome-section";


                        // =================================================
                        // Schedule Upload - Version Outcome Row
                        // Reuses The Existing Progress Step/Status/Text
                        // Visual Language
                        // =================================================

                        const ctrScheduleVersionOutcomeRow =
                            document.createElement(
                                "div"
                            );

                        ctrScheduleVersionOutcomeRow.className =
                            "project-dashboard-overlay-upload-progress-step";

                        const ctrScheduleVersionOutcomeStatus =
                            document.createElement(
                                "span"
                            );

                        ctrScheduleVersionOutcomeStatus.className =
                            "project-dashboard-overlay-upload-progress-status";

                        ctrScheduleVersionOutcomeStatus.textContent =
                            "○";

                        const ctrScheduleVersionOutcomeText =
                            document.createElement(
                                "span"
                            );

                        ctrScheduleVersionOutcomeText.className =
                            "project-dashboard-overlay-upload-progress-text";

                        ctrScheduleVersionOutcomeText.textContent =
                            "Version pending...";

                        ctrScheduleVersionOutcomeRow.append(
                            ctrScheduleVersionOutcomeStatus,
                            ctrScheduleVersionOutcomeText
                        );

                        ctrScheduleVersionOutcomeSection.appendChild(
                            ctrScheduleVersionOutcomeRow
                        );

                        uploadOverlay.body.appendChild(
                            ctrScheduleVersionOutcomeSection
                        );


                        // =================================================
                        // Save Schedule Upload
                        // =================================================

                        const btnUploadOverlaySave =
                            uploadOverlay.overlay.querySelector(
                                ".project-dashboard-overlay-save"
                            ) as HTMLButtonElement;

                        btnUploadOverlaySave.disabled =
                            true;

                        btnUploadOverlaySave.classList.add(
                            "application-disabled"
                        );


                        // =================================================
                        // Schedule Type - Update State
                        // Single Owner Of BL Selector Enablement,
                        // Baseline Availability Message, And Save
                        // Eligibility For This Overlay Session
                        // =================================================

                        const processUpdateScheduleTypeState =
                            (): void => {

                                const currentIsSelected =
                                    radScheduleTypeCurrent.checked;

                                const baselineIsSelected =
                                    radScheduleTypeBaseline.checked;

                                selBaselineVersion.disabled =
                                    !baselineIsSelected;

                                selBaselineVersion.classList.toggle(
                                    "application-disabled",
                                    !baselineIsSelected
                                );

                                let saveIsEligible =
                                    false;

                                let statusText =
                                    "Select plan type.";

                                let statusStyle:
                                    "Neutral" |
                                    "Success" |
                                    "Error" =
                                        "Neutral";

                                if (
                                    currentIsSelected
                                ) {

                                    statusText =
                                        "Current selected.";

                                    saveIsEligible =
                                        true;

                                }
                                else if (
                                    baselineIsSelected
                                ) {

                                    const selectedBaseline =
                                        selBaselineVersion.value;

                                    if (
                                        !selectedBaseline
                                    ) {

                                        statusText =
                                            "Select baseline version.";

                                    }
                                    else if (
                                        baselineFolderContentsStatus ===
                                            "Loaded"
                                    ) {

                                        const selectedBaselineIsUsed =
                                            processIsBaselineVersionUsed(
                                                baselineFolderContents,
                                                selectedBaseline
                                            );

                                        if (
                                            selectedBaselineIsUsed
                                        ) {

                                            statusText =
                                                `${selectedBaseline} is not available.`;

                                            statusStyle =
                                                "Error";

                                        }
                                        else {

                                            statusText =
                                                `${selectedBaseline} is available.`;

                                            statusStyle =
                                                "Success";

                                            saveIsEligible =
                                                true;

                                        }

                                    }
                                    else if (
                                        baselineFolderContentsStatus ===
                                            "Failed"
                                    ) {

                                        statusText =
                                            "Unable to validate baseline availability.";

                                        statusStyle =
                                            "Error";

                                    }
                                    else {

                                        // NotLoaded / Loading

                                        statusText =
                                            `Checking ${selectedBaseline} availability...`;

                                    }

                                }

                                btnUploadOverlaySave.disabled =
                                    !saveIsEligible;

                                btnUploadOverlaySave.classList.toggle(
                                    "application-disabled",
                                    !saveIsEligible
                                );

                                ctrBaselineAvailabilityMessage.textContent =
                                    statusText;

                                ctrBaselineAvailabilityMessage.classList.toggle(
                                    "project-dashboard-overlay-schedule-baseline-message-success",
                                    statusStyle ===
                                        "Success"
                                );

                                ctrBaselineAvailabilityMessage.classList.toggle(
                                    "project-dashboard-overlay-schedule-baseline-message-error",
                                    statusStyle ===
                                        "Error"
                                );

                            };


                        // =================================================
                        // Schedule Type - Ensure Baseline Folder Contents
                        // Loaded
                        //
                        // Path Is Derived From The Current Active State -
                        // Not From The Upload Wizard DOM, The Uploaded
                        // Workbook, Or Any Locally Reconstructed Value.
                        //
                        // Fetches Once Per Overlay Session. A Prior
                        // Successful Read Is Reused For Every Subsequent
                        // BL Selection. A Prior Failed Read May Be Retried
                        // By The Next Concrete BL Selection.
                        // =================================================

                        const processEnsureBaselineFolderContentsLoaded =
                            async (): Promise<void> => {

                                if (
                                    !selBaselineVersion.value
                                ) {

                                    return;

                                }

                                if (
                                    baselineFolderContentsStatus ===
                                        "Loading" ||
                                    baselineFolderContentsStatus ===
                                        "Loaded"
                                ) {

                                    processUpdateScheduleTypeState();

                                    return;

                                }

                                baselineFolderContentsStatus =
                                    "Loading";

                                processUpdateScheduleTypeState();

                                const baselinePlansPath =
                                    `customers/${activeState!.customerId}` +
                                    `/locations/${activeState!.locationId}` +
                                    `/events/${activeState!.eventId}` +
                                    `/schedule_versions/baseline_plans`;

                                try {

                                    baselineFolderContents =
                                        await getFolderContents(
                                            baselinePlansPath,
                                            "List"
                                        );

                                    baselineFolderContentsStatus =
                                        "Loaded";

                                }
                                catch (
                                    error
                                ) {

                                    console.error(
                                        "[ProjectDashboard] Failed to load baseline plan folder contents:",
                                        error
                                    );

                                    baselineFolderContentsStatus =
                                        "Failed";

                                }

                                processUpdateScheduleTypeState();

                            };


                        // =================================================
                        // Schedule Type - Radio Events
                        // =================================================

                        radScheduleTypeCurrent.addEventListener(
                            "change",
                            () => {

                                processUpdateScheduleTypeState();

                            }
                        );

                        radScheduleTypeBaseline.addEventListener(
                            "change",
                            () => {

                                processUpdateScheduleTypeState();

                            }
                        );


                        // =================================================
                        // Schedule Type - Baseline Selector Event
                        // =================================================

                        selBaselineVersion.addEventListener(
                            "change",
                            () => {

                                processUpdateScheduleTypeState();

                                void processEnsureBaselineFolderContentsLoaded();

                            }
                        );


                        btnUploadOverlaySave.addEventListener(
                            "click",
                            async () => {

                                if (
                                    btnUploadOverlaySave.disabled
                                ) {

                                    return;

                                }

                                btnUploadOverlaySave.disabled =
                                    true;

                                btnUploadOverlaySave.classList.add(
                                    "application-disabled"
                                );


                                // =========================================
                                // Lock Transaction Inputs For Processing
                                // One Save Click = One Immutable
                                // Transaction - Cancel Is Disabled Rather
                                // Than Rewired So The Existing Shared
                                // Close Listener Is Left Untouched
                                // =========================================

                                const btnUploadOverlayCancel =
                                    uploadOverlay.overlay.querySelector(
                                        ".project-dashboard-overlay-cancel"
                                    ) as HTMLButtonElement | null;

                                if (
                                    btnUploadOverlayCancel
                                ) {

                                    btnUploadOverlayCancel.disabled =
                                        true;

                                    btnUploadOverlayCancel.classList.add(
                                        "application-disabled"
                                    );

                                }

                                radScheduleTypeCurrent.disabled =
                                    true;

                                radScheduleTypeBaseline.disabled =
                                    true;

                                selBaselineVersion.disabled =
                                    true;

                                selBaselineVersion.classList.add(
                                    "application-disabled"
                                );

                                console.log(
                                    "[ProjectDashboard] Save Schedule Upload clicked"
                                );

                                await processSaveUploadSchedule(
                                    fieldsRegistry!,
                                    uploadActivityRows,
                                    uploadResourceRows,
                                    activeState!,
                                    radScheduleTypeCurrent.checked,
                                    radScheduleTypeBaseline.checked,
                                    selBaselineVersion.value,
                                    uploadOverlay,
                                    processMarkScheduleUploadCompleted
                                );

                            }
                        );

                        break;

                    }


                    // =================================================
                    // Invalid Upload State
                    // =================================================

                    default:

                        throw new Error(
                            `[ProjectDashboard] Unsupported upload type: ${uploadFileType}`
                        );

                }

            }

    )

    // =====================================================
    // Upload Wizard Tab Events
    // =====================================================

    uploadWizardTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    const selectedUploadType =
                        (
                            tab as HTMLButtonElement
                        ).dataset.uploadType as
                            "Activities" |
                            "Resources" |
                            "Worklist";

                    processUpdateUploadSummary(
                        ctrUploadWizardBodyRightHeaderPrimaryText,
                        selectedUploadType,
                        uploadFileName,
                        uploadHealthState[
                            selectedUploadType
                        ].rowCount
                    );

                    uploadFileType =
                        selectedUploadType;

                    const selectedDatasetIsLoaded =
                        processUploadTypeIsEligible(
                            selectedUploadType
                        );

                    btnUploadWizardCreate.disabled =
                        !selectedDatasetIsLoaded;

                    btnUploadWizardCreate.classList.toggle(
                        "application-disabled",
                        !selectedDatasetIsLoaded
                    );

                    btnUploadWizardCreate.textContent =
                        selectedUploadType ===
                        "Worklist"
                            ? "Upload Worklist"
                            : "Create Version";

                    uploadWizardTabs.forEach(
                        uploadWizardTab => {

                            uploadWizardTab.classList.remove(
                                "project-dashboard-upload-wizard-tab-selected"
                            );

                        }
                    );

                    tab.classList.add(
                        "project-dashboard-upload-wizard-tab-selected"
                    );

                    console.log(
                        "[ProjectDashboard] Upload Wizard Tab Selected:",
                        uploadFileType
                    );

                    renderHealthTableRows();

                }
            );

        }
    );


    // =====================================================
    // Upload Wizard Cancel Button Reference
    // =====================================================


    const btnUploadWizardCancel =
        ctrUploadWizardBodyRightFooter.querySelector(
            ".project-dashboard-upload-wizard-button-cancel"
        ) as HTMLButtonElement;


    // =====================================================
    // Close Upload Version Wizard
    // =====================================================

    const closeUploadVersionWizard =
        (): void => {

            // =========================================
            // Restore Payload Context
            // =========================================

            processPayloadContext(
                "Restore"
            );


            // =========================================
            // Reset Session Completion State
            // A New Wizard Session Must Not Inherit A
            // Prior Session's Completed Create Version Gate
            // =========================================

            processSetScheduleUploadCompleted(
                false
            );

            processSetWorklistUploadCompleted(
                false
            );


            // =========================================
            // Clear / Hide Upload Version Wizard
            // =========================================

            ctrUploadVersion.innerHTML =
                "";

            ctrUploadVersion.className =
                "application-hidden";


            // =========================================
            // Restore Dashboard View
            // =========================================

            processRestoreDashboardView();

            // =========================================
            // Re-Enable Dashboard Tabs
            // =========================================

            processEnableTabs();


        };


    // =====================================================
    // Upload Wizard Footer Cancel
    // =====================================================

    btnUploadWizardCancel.addEventListener(
        "click",
        closeUploadVersionWizard
    );


    // =====================================================
    // Upload Wizard Header Close
    // =====================================================

    btnUploadWizardClose.addEventListener(
        "click",
        () => {
            closeUploadVersionWizard();
        }
    );

    // =====================================================
    // Upload Wizard Clear Button
    // =====================================================

    const btnUploadWizardClear =
        ctrUploadWizardBodyRightFooter.querySelector(
            ".project-dashboard-upload-wizard-button-clear"
        ) as HTMLButtonElement;

    // =====================================================
    // Upload Wizard Clear Button - Initial State
    // =====================================================

    btnUploadWizardClear.disabled =
        true;

    btnUploadWizardClear.classList.add(
        "application-disabled"
    );

    // =====================================================
    // Upload Wizard Clear Button - Click
    // =====================================================

    btnUploadWizardClear.addEventListener(
        "click",
        () => {

            // =====================================================
            // Clear Upload Health State
            // =====================================================

            uploadHealthState.Activities.loaded =
                false;

            uploadHealthState.Activities.rowCount =
                0;

            uploadHealthState.Activities.missingRequiredFields =
                [];

            uploadHealthState.Resources.loaded =
                false;

            uploadHealthState.Resources.rowCount =
                0;

            uploadHealthState.Resources.missingRequiredFields =
                [];

            uploadHealthState.Worklist.loaded =
                false;

            uploadHealthState.Worklist.rowCount =
                0;

            uploadHealthState.Worklist.missingRequiredFields =
                [];

            // =====================================================
            // Clear Retained Raw Schedule Rows
            // =====================================================

            uploadActivityRows =
                [];

            uploadResourceRows =
                [];

            uploadWorklistRows =
                [];

            // =====================================================
            // Reset Upload Type
            // =====================================================

            uploadFileType =
                "Activities";

            uploadFileName =
                "Activities";

            // =====================================================
            // Reset Selected Tab
            // =====================================================

            uploadWizardTabs.forEach(
                uploadWizardTab => {

                    uploadWizardTab.classList.remove(
                        "project-dashboard-upload-wizard-tab-selected"
                    );

                }
            );

            uploadWizardTabs[
                0
            ]?.classList.add(
                "project-dashboard-upload-wizard-tab-selected"
            );


            // =====================================================
            // Reset Create Button
            // =====================================================

            btnUploadWizardCreate.textContent =
                "Create Version";

            btnUploadWizardCreate.disabled =
                true;

            btnUploadWizardCreate.classList.add(
                "application-disabled"
            );


            // =====================================================
            // Reset Clear Button
            // =====================================================

            btnUploadWizardClear.disabled =
                true;

            btnUploadWizardClear.classList.add(
                "application-disabled"
            );

            // =====================================================
            // Unlock Acquisition
            // =====================================================

            processSetAcquisitionLocked(
                false
            );

            // =====================================================
            // Reset Session Completion State
            // A New File/Upload Cycle Must Not Inherit The Prior
            // Cycle's Completed Create Version Gate
            // =====================================================

            processSetScheduleUploadCompleted(
                false
            );

            processSetWorklistUploadCompleted(
                false
            );

            processRenderUploadCompletionBadges();

            // =====================================================
            // Reset Tab Health State
            // =====================================================

            processUpdateUploadTabHealthState();

            // =====================================================
            // Reset Header
            // =====================================================

            ctrUploadWizardBodyRightHeaderPrimary.textContent =
                "Upload Type = Not Loaded | File Name = Not Loaded | Row Count = 0";

            // =====================================================
            // Reset Health Table
            // =====================================================

            renderHealthTableRows();

        }
    );

    ctrUploadWizardBodyRight.append(
        ctrUploadWizardBodyRightHeader,
        ctrUploadWizardBodyRightBody,
        ctrUploadWizardBodyRightFooter
    );

    ctrUploadVersion.replaceChildren(
        ctrUploadWizardBodyLeft,
        ctrUploadWizardBodyRight
    );

}

// =====================================================
// Process Update Upload Summary
// =====================================================

function processUpdateUploadSummary(
    ctrHeaderText:
        HTMLElement,
    uploadType:
        "Activities" | "Resources" | "Worklist",
    fileName:
        string,
    rowCount:
        number
): void {

    ctrHeaderText.textContent =
        `Upload Type = ${uploadType} | File Name = ${fileName} | Row Count = ${rowCount}`;

}

// =====================================================
// Process Canonical Field Value
// =====================================================

function processCanonicalFieldValue(
    value:
        unknown,

    dataType:
        string
): unknown {

    if (
        value ===
            undefined ||
        value ===
            null ||
        value ===
            ""
    ) {

        return null;

    }

    switch (
        dataType
    ) {

        case "string":

            return String(
                value
            );

        case "boolean":

        {
            if (
                typeof value ===
                    "boolean"
            ) {

                return value;

            }

            const booleanValue =
                String(
                    value
                ).trim().toLowerCase();

            if (
                booleanValue ===
                    "true" ||
                booleanValue ===
                    "yes" ||
                booleanValue ===
                    "complete" ||
                booleanValue ===
                    "required"
            ) {

                return true;

            }

            if (
                booleanValue ===
                    "false" ||
                booleanValue ===
                    "no" ||
                booleanValue ===
                    "incomplete" ||
                booleanValue ===
                    "not required" ||
                booleanValue ===
                    "-"
            ) {

                return false;

            }

            return null;

        }

        case "number":

        {
            if (
                typeof value ===
                    "number"
            ) {

                return Number.isFinite(
                    value
                )
                    ? value
                    : null;

            }

            const numericValue =
                Number(
                    value
                );

            return Number.isFinite(
                numericValue
            )
                ? numericValue
                : null;

        }

        case "datetime":

        {
            if (
                value instanceof
                    Date
            ) {

                return value;

            }

            const parsedDate =
                new Date(
                    String(
                        value
                    )
                );

            return Number.isNaN(
                parsedDate.getTime()
            )
                ? null
                : parsedDate;

        }

        default:

            throw new Error(
                `[ProjectDashboard] Unsupported canonical data type: ${dataType}`
            );

    }

}

// =====================================================
// Process Save Upload Worklist
// =====================================================

async function processSaveUploadWorklist(
    fieldsRegistry:
        FieldsRegistry,

    uploadWorklistRows:
        unknown[][],

    activeState:
        ActiveState,

    artifactStore:
        ProjectDashboardArtifactStore,

    uploadOverlay:
        {
            overlay:
                HTMLDivElement;

            body:
                HTMLDivElement;

            progress:
                HTMLDivElement | null;

            close:
                () => void;
        },

    processMarkWorklistUploadCompleted:
        () => void,

    // =====================================================
    // Registry Architecture Refactor - Stage G.1 Completion.
    // =====================================================

    processGetLocationEventsRegistry:
        (
            locationId:
                string
        ) => LocationEventsRegistry | null
): Promise<void> {

    console.log(
        "[ProjectDashboard] ENTER processSaveUploadWorklist"
    );


    // =====================================================
    // Upload Step State
    // =====================================================

    let activeUploadStep =
        0;


    // =====================================================
    // Update Upload Step
    // =====================================================

    const processUpdateUploadStep =
        (
            step:
                number,

            state:
                "active" |
                "complete" |
                "failed"
        ): void => {

            const stepElement =
                uploadOverlay.progress?.querySelector(
                    `[data-step="${step}"]`
                ) as HTMLDivElement | null;

            if (
                !stepElement
            ) {

                return;

            }

            stepElement.classList.remove(
                "project-dashboard-overlay-upload-progress-step-active",
                "project-dashboard-overlay-upload-progress-step-complete",
                "project-dashboard-overlay-upload-progress-step-failed"
            );

            const statusElement =
                stepElement.querySelector(
                    ".project-dashboard-overlay-upload-progress-status"
                ) as HTMLSpanElement | null;

            switch (
                state
            ) {

                case "active":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-active"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "●";

                    }

                    break;


                case "complete":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-complete"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "✓";

                    }

                    break;


                case "failed":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-failed"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "✕";

                    }

                    break;

            }

        };


    // =====================================================
    // Process Upload Step
    // =====================================================

    const processUploadStep =
        async <T>(
            step:
                number,

            processStep:
                () => Promise<T> | T
        ): Promise<T> => {

            activeUploadStep =
                step;

            const uploadStepIndex =
                step -
                1;

            processUpdateUploadStep(
                uploadStepIndex,
                "active"
            );

            try {

                const result =
                    await processStep();

                processUpdateUploadStep(
                    uploadStepIndex,
                    "complete"
                );

                return result;

            }
            catch (
                error
            ) {

                processUpdateUploadStep(
                    uploadStepIndex,
                    "failed"
                );

                throw error;

            }

        };


    // =====================================================
    // Process Upload Failure
    // =====================================================

    const processUploadFailure =
        (
            error:
                unknown
        ): void => {

            console.error(
                "[ProjectDashboard] Worklist upload failed:",
                {
                    step:
                        activeUploadStep,

                    error:
                        error
                }
            );


            // =================================================
            // Remove Save Upload
            // =================================================

            const btnSave =
                uploadOverlay.overlay.querySelector(
                    ".project-dashboard-overlay-save"
                ) as HTMLButtonElement | null;

            btnSave?.remove();


            // =================================================
            // Remove Existing Error
            // =================================================

            const existingError =
                uploadOverlay.body.querySelector(
                    ".application-alert"
                );

            existingError?.remove();


            // =================================================
            // Show Upload Error
            // =================================================

            const ctrUploadError =
                document.createElement(
                    "div"
                );

            ctrUploadError.className =
                "application-alert";

            ctrUploadError.textContent =
                "Upload failed. Cancel to try again.";

            uploadOverlay.progress?.appendChild(
                ctrUploadError
            );

        };
    try {

        // =====================================================
        // Worklist Versions Registry Identity
        //
        // Registry Architecture Refactor - Stage G.1 Completion.
        //
        // worklistVersionsRegistryPath is Event-owned. It is
        // sourced from the resident Location Events Registry,
        // not reconstructed from customerId/locationId/eventId.
        // A missing resident registry, a missing active Event, or
        // an empty/invalid path is a transaction-time invariant
        // violation - it throws here and is handled by the
        // existing Worklist upload failure path below, rather
        // than falling back to a reconstructed path.
        // =====================================================

        const locationEventsRegistry =
            processGetLocationEventsRegistry(
                activeState.locationId
            );

        if (
            !locationEventsRegistry
        ) {

            throw new Error(
                `[ProjectDashboard] Location Events Registry is not resident for locationId: ${activeState.locationId}`
            );

        }

        const activeEvent =
            locationEventsRegistry
                .events
                .find(
                    event =>
                        event.eventId ===
                            activeState.eventId
                );

        if (
            !activeEvent
        ) {

            throw new Error(
                `[ProjectDashboard] Active Event not found in Location Events Registry: ${activeState.eventId}`
            );

        }

        const worklistVersionsRegistryPath =
            activeEvent.worklistVersionsRegistryPath;

        if (
            !worklistVersionsRegistryPath?.trim()
        ) {

            throw new Error(
                `[ProjectDashboard] Active Event has no worklistVersionsRegistryPath configured: ${activeEvent.eventId}`
            );

        }

        const worklistVersionsRegistryKey =
            `registry:${worklistVersionsRegistryPath}`;

        // =====================================================
        // Worklist Version Folder Identities
        // Current holds the active Worklist version.
        // Archive retains previously committed Worklist versions.
        // =====================================================

        const worklistCurrentVersionFolderPath =
            `customers/${activeState.customerId}` +
            `/locations/${activeState.locationId}` +
            `/events/${activeState.eventId}` +
            `/worklist_versions/current_version`;

        const worklistArchiveVersionsFolderPath =
            `customers/${activeState.customerId}` +
            `/locations/${activeState.locationId}` +
            `/events/${activeState.eventId}` +
            `/worklist_versions/archive_versions`;

        try {

            // =====================================================
            // 1-1 - Build Canonical Worklist Data
            // =====================================================

            const worklistData =
                await processUploadStep(
                    1,
                    () => {

                        const worklistRegistryFields =
                            fieldsRegistry.worklist.fields;

                        const {
                            headerRow:
                                worklistHeaderRow,

                            dataRows:
                                worklistDataRows
                        } =
                            processExtractUploadDataRows(
                                uploadWorklistRows
                            );

                        console.log(
                            "[ProjectDashboard] Worklist Source Headers:",
                            worklistHeaderRow
                        );

                        console.log(
                            "[ProjectDashboard] Worklist Registry Names:",
                            worklistRegistryFields.map(
                                field =>
                                    field.name
                            )
                        );


                        // =============================================
                        // Defense In Depth - Fail Closed On Missing
                        // Required Headers Rather Than Silently
                        // Canonicalizing null Columns. Health/Save
                        // Eligibility Are Expected To Have Already
                        // Caught This Before Step 1 Was Reachable
                        // =============================================

                        const missingRequiredWorklistFields =
                            processFindMissingRequiredUploadFields(
                                worklistHeaderRow,
                                worklistRegistryFields
                            );

                        if (
                            missingRequiredWorklistFields.length >
                                0
                        ) {

                            throw new Error(
                                `[ProjectDashboard] Missing required Worklist headers: ${missingRequiredWorklistFields.map(
                                    field =>
                                        field.displayName
                                ).join(
                                    ", "
                                )}`
                            );

                        }

                        const canonicalWorklistData:
                            Record<string, unknown>[] =
                                [];

                        for (
                            const row
                            of worklistDataRows
                        ) {

                            const worklistRecord:
                                Record<string, unknown> =
                                    {};

                            for (
                                const field
                                of worklistRegistryFields
                            ) {

                                // =========================================
                                // Resolve Source Column - lookupKey Is The
                                // Source Contract. lookupKey === null Means
                                // Generated/Stamped, Never Matched Against
                                // The Workbook
                                // =========================================

                                const columnIndex =
                                    field.lookupKey ===
                                        null
                                        ? -1
                                        : worklistHeaderRow.findIndex(
                                            header =>
                                                String(
                                                    header ??
                                                    ""
                                                ).trim() ===
                                                    field.lookupKey
                                        );


                                // =========================================
                                // Map To Canonical Field
                                // =========================================

                                worklistRecord[
                                    field.canonicalName
                                ] =
                                    columnIndex >=
                                        0
                                        ? processCanonicalFieldValue(
                                            row[
                                                columnIndex
                                            ],
                                            field.dataType
                                        )
                                        : null;

                            }

                            canonicalWorklistData.push(
                                worklistRecord
                            );

                        }


                        // =============================================
                        // Row-Count Assertion - One Data Row In,
                        // One Canonical Row Out. Fail Closed Rather
                        // Than Silently Accept A Mismatch
                        // =============================================

                        if (
                            canonicalWorklistData.length !==
                                worklistDataRows.length
                        ) {

                            throw new Error(
                                "[ProjectDashboard] Canonical Worklist row count does not match the retained upload candidate"
                            );

                        }

                        // =============================================
                        // TEMPORARY DIAGNOSTIC - Worklist Row Contract
                        // =============================================

                        console.log(
                            "[ProjectDashboard] TEMPORARY DIAGNOSTIC - Canonical Worklist Data Built:",
                            {
                                worksheetRows:
                                    uploadWorklistRows.length,

                                actualDataRows:
                                    worklistDataRows.length,

                                canonicalRows:
                                    canonicalWorklistData.length,

                                fields:
                                    worklistRegistryFields.length,

                                sample:
                                    canonicalWorklistData[
                                        0
                                    ]
                            }
                        );

                        return canonicalWorklistData;

                    }
                );


            // =====================================================
            // 1-2 - Build Worklist Parquet
            // =====================================================

            let worklistParquetBuffer:
                ArrayBuffer | null =
                    await processUploadStep(
                        2,
                        () => {

                            const worklistRegistryFields =
                                fieldsRegistry.worklist.fields;

                            const worklistParquetColumns =
                                worklistRegistryFields.map(
                                    field => {

                                        let parquetType:
                                            "STRING" |
                                            "BOOLEAN" |
                                            "DOUBLE" |
                                            "TIMESTAMP";

                                        switch (
                                            field.dataType
                                        ) {

                                            case "string":

                                                parquetType =
                                                    "STRING";

                                                break;


                                            case "boolean":

                                                parquetType =
                                                    "BOOLEAN";

                                                break;


                                            case "number":

                                                parquetType =
                                                    "DOUBLE";

                                                break;


                                            case "datetime":

                                                parquetType =
                                                    "TIMESTAMP";

                                                break;


                                            default:

                                                throw new Error(
                                                    `[ProjectDashboard] Unsupported Worklist field data type: ${field.dataType}`
                                                );

                                        }

                                        return {
                                            name:
                                                field.canonicalName,

                                            data:
                                                worklistData.map(
                                                    record =>
                                                        record[
                                                            field.canonicalName
                                                        ]
                                                ),

                                            type:
                                                parquetType
                                        };

                                    }
                                );

                            const parquetBuffer =
                                encodeParquetArtifact(
                                    worklistParquetColumns
                                );

                            console.log(
                                "[ProjectDashboard] Worklist Parquet Built:",
                                {
                                    rows:
                                        worklistData.length,

                                    columns:
                                        worklistParquetColumns.length,

                                    bytes:
                                        parquetBuffer.byteLength
                                }
                            );

                            return parquetBuffer;

                        }
                    );


            // =====================================================
            // 1-3 - Archive Current Worklist Version
            // =====================================================

            await processUploadStep(
                3,
                async () => {

                    const movedCount =
                        await moveFolderContentsAndClear(
                            worklistCurrentVersionFolderPath,
                            worklistArchiveVersionsFolderPath
                        );

                    console.log(
                        "[ProjectDashboard] Current Worklist Version Archived:",
                        {
                            source:
                                worklistCurrentVersionFolderPath,

                            destination:
                                worklistArchiveVersionsFolderPath,

                            movedCount:
                                movedCount
                        }
                    );

                }
            );

            // =====================================================
            // 1-4 - Validate Target Path Availability
            //
            // The Worklist Version Identity Is Generated Exactly
            // Once For This Save Attempt, Here - Not Before The
            // User Clicked Save Upload. Mirrors The Schedule
            // Create Version Reference Pattern (Version Identity
            // Generated Inside Its Own "Validate Target Path" Step)
            // =====================================================

            const {
                worklistVersionId,
                worklistArtifactFileName,
                worklistTransactionTimestamp,
                worklistVersionPath,
                worklistArtifactPath,
                worklistArtifactKey
            } =
                await processUploadStep(
                    4,
                    async () => {

                        const worklistTransactionDate =
                            new Date();

                        const worklistTransactionTimestamp =
                            worklistTransactionDate.toISOString();

                        const worklistVersionTimestamp =
                            worklistTransactionTimestamp
                                .replace(
                                    /[-:]/g,
                                    ""
                                )
                                .replace(
                                    "T",
                                    "_"
                                )
                                .replace(
                                    "Z",
                                    ""
                                )
                                .replace(
                                    ".",
                                    ""
                                );

                        const worklistVersionId =
                            [
                                "WKL",
                                activeState.customerId,
                                activeState.locationId,
                                activeState.eventId,
                                worklistVersionTimestamp
                            ].join(
                                "|"
                            );

                        const worklistArtifactFileName =
                            worklistVersionId.replace(
                                /\|/g,
                                "_"
                            ) +
                            ".parquet";

                        const worklistVersionPath =
                            `customers/${activeState.customerId}` +
                            `/locations/${activeState.locationId}` +
                            `/events/${activeState.eventId}` +
                            `/worklist_versions/current_version` +
                            `/${worklistVersionId}`;

                        const worklistArtifactPath =
                            `${worklistVersionPath}/${worklistArtifactFileName}`;

                        const worklistArtifactKey =
                            `worklist:${worklistArtifactPath}`;

                        const worklistArtifactPathIsAvailable =
                            await checkAzureArtifactAvailability(
                                worklistArtifactPath
                            );

                        if (
                            !worklistArtifactPathIsAvailable
                        ) {

                            throw new Error(
                                `[ProjectDashboard] Worklist artifact already exists: ${worklistArtifactPath}`
                            );

                        }

                        console.log(
                            "[ProjectDashboard] Worklist Artifact Path Available:",
                            {
                                worklistVersionId,
                                worklistArtifactPath
                            }
                        );

                        return {
                            worklistVersionId,
                            worklistArtifactFileName,
                            worklistTransactionTimestamp,
                            worklistVersionPath,
                            worklistArtifactPath,
                            worklistArtifactKey
                        };

                    }
                );


            // =====================================================
            // 1-5 - Save Worklist Parquet To Azure
            // =====================================================

            await processUploadStep(
                5,
                async () => {

                    if (
                        !worklistParquetBuffer
                    ) {

                        throw new Error(
                            "[ProjectDashboard] Worklist Parquet buffer is unavailable. Upload cannot continue."
                        );

                    }

                    await saveArtifactToAzure(
                        worklistArtifactPath,
                        worklistParquetBuffer
                    );

                    console.log(
                        "[ProjectDashboard] Worklist Parquet Saved To Azure:",
                        {
                            path:
                                worklistArtifactPath,

                            bytes:
                                worklistParquetBuffer.byteLength
                        }
                    );

                }
            );


            // =====================================================
            // 1-6 - Retrieve Committed Worklist Parquet From Azure
            // =====================================================

            const committedWorklistParquetBuffer =
                await processUploadStep(
                    6,
                    async () => {

                        if (
                            !worklistParquetBuffer
                        ) {

                            throw new Error(
                                "[ProjectDashboard] Original Worklist Parquet buffer is not available."
                            );

                        }

                        const originalByteLength =
                            worklistParquetBuffer.byteLength;


                        // =================================================
                        // Retrieve Committed Artifact
                        // =================================================

                        const azureArtifactPackage =
                            await getArtifactsFromAzure(
                                "Data",
                                [
                                    worklistVersionPath
                                ]
                            );


                        // =================================================
                        // Split Azure Artifact Package
                        // =================================================

                        const azureArtifacts =
                            splitAzureArtifactPackage(
                                azureArtifactPackage
                            );

                        const committedArtifact =
                            azureArtifacts.get(
                                `data:${worklistVersionPath}`
                            );


                        // =================================================
                        // Validate Returned Artifact
                        // =================================================

                        if (
                            !committedArtifact
                        ) {

                            throw new Error(
                                `[ProjectDashboard] Committed Worklist artifact was not returned from Azure version path: ${worklistVersionPath}`
                            );

                        }

                        if (
                            committedArtifact.byteLength !==
                                originalByteLength
                        ) {

                            throw new Error(
                                `[ProjectDashboard] Committed Worklist artifact byte length mismatch. Expected ${originalByteLength}, received ${committedArtifact.byteLength}.`
                            );

                        }

                        console.log(
                            "[ProjectDashboard] Committed Worklist Parquet Retrieved From Azure:",
                            {
                                path:
                                    worklistVersionPath,

                                bytes:
                                    committedArtifact.byteLength
                            }
                        );


                        // =================================================
                        // Release Original In-Memory Artifact
                        // =================================================

                        worklistParquetBuffer =
                            null;

                        return committedArtifact;

                    }
                );


            // =====================================================
            // 1-7 - Save Committed Worklist Parquet To IndexedDB
            // =====================================================

            await processUploadStep(
                7,
                async () => {

                    try {

                        // =================================================
                        // Remove Existing Worklist Artifact
                        // =================================================

                        const existingWorklistKeys =
                            await artifactStore.getKeysByPrefix(
                                "worklist:"
                            );

                        for (
                            const existingWorklistKey
                            of existingWorklistKeys
                        ) {

                            await artifactStore.delete(
                                existingWorklistKey
                            );

                        }


                        // =================================================
                        // Save New Worklist Artifact
                        // =================================================

                        await artifactStore.put(
                            worklistArtifactKey,
                            committedWorklistParquetBuffer
                        );

                    }
                    catch (
                        error
                    ) {

                        console.error(
                            "[ProjectDashboard] Local artifact database write failed:",
                            error
                        );

                        throw new Error(
                            "[ProjectDashboard] Local artifact database is unavailable. Restart the application and try again."
                        );

                    }

                    console.log(
                        "[ProjectDashboard] Committed Worklist Parquet Saved To IndexedDB:",
                        {
                            key:
                                worklistArtifactKey,

                            bytes:
                                committedWorklistParquetBuffer.byteLength
                        }
                    );

                }
            );


            // =====================================================
            // 1-8 - Update Worklist Versions Registry
            //
            // Required Registry Maintenance Only - The Obsolete
            // "Default Version" Concept (defaultVersionId,
            // defaultVersionPath, IsDefaultActive) Has Been
            // Removed. Those Fields Had Zero Frontend Consumers.
            // RegistrySync V2 Depends Only On This Registry's Own
            // lastModified, Which This Step Still Maintains
            // =====================================================

            await processUploadStep(
                8,
                async () => {

                    // =================================================
                    // Build Updated Worklist Versions Registry
                    // =================================================

                    const worklistVersionsRegistry =
                        {
                            registryType:
                                "worklist_versions",

                            schemaVersion:
                                1,

                            lastModified:
                                worklistTransactionTimestamp
                        };


                    // =================================================
                    // Build Registry Buffer
                    // =================================================

                    let worklistVersionsRegistryBuffer:
                        ArrayBuffer | null =
                            new TextEncoder().encode(
                                JSON.stringify(
                                    worklistVersionsRegistry,
                                    null,
                                    4
                                )
                            ).buffer;


                    // =================================================
                    // Replace Registry In Azure
                    // =================================================

                    await replaceArtifactInAzure(
                        worklistVersionsRegistryPath,
                        worklistVersionsRegistryBuffer
                    );


                    // =================================================
                    // Retrieve Committed Registry From Azure
                    // =================================================

                    const azureRegistryPackage =
                        await getArtifactsFromAzure(
                            "Registry",
                            [
                                worklistVersionsRegistryPath
                            ]
                        );


                    // =================================================
                    // Split Azure Registry Package
                    // =================================================

                    const azureRegistries =
                        splitAzureArtifactPackage(
                            azureRegistryPackage
                        );

                    const committedWorklistVersionsRegistryBuffer =
                        azureRegistries.get(
                            `registry:${worklistVersionsRegistryPath}`
                        );


                    // =================================================
                    // Validate Returned Registry
                    // =================================================

                    if (
                        !committedWorklistVersionsRegistryBuffer
                    ) {

                        throw new Error(
                            `[ProjectDashboard] Committed Worklist Versions Registry was not returned from Azure: ${worklistVersionsRegistryPath}`
                        );

                    }

                    const committedWorklistVersionsRegistry =
                        JSON.parse(
                            new TextDecoder().decode(
                                committedWorklistVersionsRegistryBuffer
                            )
                        ) as {
                            registryType:
                                string;

                            schemaVersion:
                                number;

                            lastModified:
                                string;
                        };

                    if (
                        committedWorklistVersionsRegistry.lastModified !==
                            worklistTransactionTimestamp
                    ) {

                        throw new Error(
                            "[ProjectDashboard] Committed Worklist Versions Registry does not match the current Worklist transaction."
                        );

                    }


                    // =================================================
                    // Release Original In-Memory Registry Buffer
                    // =================================================

                    worklistVersionsRegistryBuffer =
                        null;


                    // =================================================
                    // Replace IndexedDB Registry
                    // =================================================

                    await artifactStore.delete(
                        worklistVersionsRegistryKey
                    );

                    await artifactStore.put(
                        worklistVersionsRegistryKey,
                        committedWorklistVersionsRegistryBuffer
                    );


                    // =================================================
                    // Confirm Registry Commit
                    // =================================================

                    console.log(
                        "[ProjectDashboard] Worklist Versions Registry Updated:",
                        {
                            registryPath:
                                worklistVersionsRegistryPath,

                            lastModified:
                                worklistTransactionTimestamp,

                            bytes:
                                committedWorklistVersionsRegistryBuffer.byteLength
                        }
                    );

                }
            );


            // =====================================================
            // 1-9 - Refresh Resident Worklist State
            // Temporary Pass-Through Until Worklist Hydration Is Built
            // =====================================================

            await processUploadStep(
                9,
                async () => {

                    console.log(
                        "[ProjectDashboard] Resident Worklist refresh deferred - temporary successful pass-through"
                    );

                }
            );


            // =====================================================
            // 1-10 - Update ETag
            //
            // Customer-Wide Change Notification. Executes Only
            // After Every Required Worklist Persistent Mutation
            // Above Has Succeeded - The Last Transactional
            // Operation In The Worklist Save Sequence
            // =====================================================

            const changeEtagMarkerPath =
                `customers/${activeState.customerId}/change.etag`;

            await processUploadStep(
                10,
                async () => {

                    const changeEtagResult =
                        await touchChangeEtag(
                            changeEtagMarkerPath
                        );

                    console.log(
                        "[ProjectDashboard] Worklist Change ETag Updated:",
                        {
                            markerPath:
                                changeEtagMarkerPath,

                            etag:
                                changeEtagResult.etag
                        }
                    );

                    const authoritativeMarker =
                        await getArtifactEtag(
                            changeEtagMarkerPath
                        );

                    if (
                        authoritativeMarker.etag
                    ) {

                        await artifactStore.put(
                            "system:etagStatus",
                            new TextEncoder().encode(
                                authoritativeMarker.etag
                            ).buffer
                        );

                    }

                }
            );

            // =====================================================
            // Worklist Upload Version Outcome - Terminal Success
            // Mirrors The Schedule Create Version Outcome Row
            // Update Exactly
            // =====================================================

            const ctrWorklistVersionOutcomeRow =
                uploadOverlay.body.querySelector(
                    ".project-dashboard-overlay-schedule-version-outcome-section .project-dashboard-overlay-upload-progress-step"
                ) as HTMLDivElement | null;

            const ctrWorklistVersionOutcomeStatus =
                ctrWorklistVersionOutcomeRow?.querySelector(
                    ".project-dashboard-overlay-upload-progress-status"
                ) as HTMLSpanElement | null;

            const ctrWorklistVersionOutcomeText =
                ctrWorklistVersionOutcomeRow?.querySelector(
                    ".project-dashboard-overlay-upload-progress-text"
                ) as HTMLSpanElement | null;

            ctrWorklistVersionOutcomeRow?.classList.add(
                "project-dashboard-overlay-upload-progress-step-complete"
            );

            if (
                ctrWorklistVersionOutcomeStatus
            ) {

                ctrWorklistVersionOutcomeStatus.textContent =
                    "✓";

            }

            if (
                ctrWorklistVersionOutcomeText
            ) {

                ctrWorklistVersionOutcomeText.textContent =
                    `Version = ${worklistVersionId} created successfully.`;

            }


            // =====================================================
            // Complete Worklist Upload
            // =====================================================

            const btnCancel =
                uploadOverlay.overlay.querySelector(
                    ".project-dashboard-overlay-cancel"
                ) as HTMLButtonElement | null;

            const btnSave =
                uploadOverlay.overlay.querySelector(
                    ".project-dashboard-overlay-save"
                ) as HTMLButtonElement | null;

            if (
                btnCancel
            ) {

                btnCancel.classList.add(
                    "application-hidden"
                );

            }

            if (
                btnSave
            ) {

                const btnClose =
                    document.createElement(
                        "button"
                    );

                btnClose.type =
                    "button";

                btnClose.className =
                    btnSave.className;

                btnClose.classList.remove(
                    "application-disabled"
                );

                btnClose.textContent =
                    "Close";

                btnClose.addEventListener(
                    "click",
                    () => {

                        uploadOverlay.close();

                    }
                );

                btnSave.replaceWith(
                    btnClose
                );

            }


        }
        catch (
            error
        ) {

            // =================================================
            // Worklist Upload Version Outcome - Terminal Failure
            // Mirrors The Schedule Create Version Outcome Row
            // Update Exactly. The Version Row May Still Be
            // "Version pending..." If The Failure Occurred Before
            // Step 4 Generated The Version Identity
            // =================================================

            const ctrWorklistVersionOutcomeRow =
                uploadOverlay.body.querySelector(
                    ".project-dashboard-overlay-schedule-version-outcome-section .project-dashboard-overlay-upload-progress-step"
                ) as HTMLDivElement | null;

            const ctrWorklistVersionOutcomeStatus =
                ctrWorklistVersionOutcomeRow?.querySelector(
                    ".project-dashboard-overlay-upload-progress-status"
                ) as HTMLSpanElement | null;

            const ctrWorklistVersionOutcomeText =
                ctrWorklistVersionOutcomeRow?.querySelector(
                    ".project-dashboard-overlay-upload-progress-text"
                ) as HTMLSpanElement | null;

            ctrWorklistVersionOutcomeRow?.classList.add(
                "project-dashboard-overlay-upload-progress-step-failed"
            );

            if (
                ctrWorklistVersionOutcomeStatus
            ) {

                ctrWorklistVersionOutcomeStatus.textContent =
                    "✕";

            }

            if (
                ctrWorklistVersionOutcomeText
            ) {

                ctrWorklistVersionOutcomeText.textContent =
                    "Version creation failed.";

            }

            processUploadFailure(
                error
            );

            return;

        }
        finally {
            console.log(
                "[ProjectDashboard] EXIT processSaveUploadWorklist"
            );

        }


        processMarkWorklistUploadCompleted();

        console.log(
            "[ProjectDashboard] Worklist upload completed successfully"
        );

    }
    catch (
        error
    ) {

        processUploadFailure(
            error
        );

        return;

    }
    finally {
        console.log(
            "[ProjectDashboard] EXIT processSaveUploadWorklist"
        );

    }

}

// =====================================================
// Process Is Baseline Version Used
// Single Owner Of The Baseline Suffix-Match Rule - Used
// By Both The Form-Time Availability Check And The
// Save-Time Revalidation So The Two Can Never Drift Apart
// =====================================================

function processIsBaselineVersionUsed(
    folderContents:
        AzureFolderContentsEntry[],

    selectedBaseline:
        string
): boolean {

    return folderContents.some(
        entry =>
            entry.type ===
                "folder" &&
            entry.name.endsWith(
                `-${selectedBaseline}`
            )
    );

}

// =====================================================
// Schedule Version Validation Result
// Minimal Reusable Completeness Classification - A
// Returned Result Means Inspection Succeeded; An Azure
// Read Failure Must Throw Rather Than Be Encoded Here
// =====================================================

interface ScheduleVersionValidationResult {

    isValid:
        boolean;

    activitiesExists:
        boolean;

    resourcesExists:
        boolean;

}

// =====================================================
// Process Validate Schedule Version Contents
// Single Owner Of The Schedule Version Completeness Rule
// - Pure Classification Of Already-Retrieved Folder
// Contents, No Azure Calls, No Side Effects. Reusable By
// S5, Future Load Protection, Dropdown Filtering, And
// Orphan Detection Without Duplicating This Rule
// =====================================================

function processValidateScheduleVersionContents(
    scheduleVersionId:
        string,

    folderContents:
        AzureFolderContentsEntry[]
): ScheduleVersionValidationResult {

    const requiredActivitiesName =
        `${scheduleVersionId}_activities.parquet`;

    const requiredResourcesName =
        `${scheduleVersionId}_resources.parquet`;

    const activitiesExists =
        folderContents.some(
            entry =>
                entry.type ===
                    "artifact" &&
                entry.name ===
                    requiredActivitiesName
        );

    const resourcesExists =
        folderContents.some(
            entry =>
                entry.type ===
                    "artifact" &&
                entry.name ===
                    requiredResourcesName
        );

    return {
        isValid:
            activitiesExists &&
            resourcesExists,

        activitiesExists,
        resourcesExists
    };

}

// =====================================================
// Process Row Is Empty
// Single Owner Of "Genuinely Empty Row" - A Row Is Empty
// Only When Every Cell Is undefined, null, Or A
// Whitespace-Only String. 0 And false Are Real Values
// =====================================================

function processRowIsEmpty(
    row:
        unknown[]
): boolean {

    if (
        !row ||
        row.length ===
            0
    ) {

        return true;

    }

    return row.every(
        cell => {

            if (
                cell ===
                    undefined ||
                cell ===
                    null
            ) {

                return true;

            }

            if (
                typeof cell ===
                    "string" &&
                cell.trim() ===
                    ""
            ) {

                return true;

            }

            return false;

        }
    );

}

// =====================================================
// Process Extract Upload Data Rows
// Single Owner Of The Uploader Workbook Row Contract -
// Shared By Schedule (Activities/Resources) And Worklist.
// Row 1 / rows[0] Is Always The Header, Row 2 Onward Is
// Candidate Data. Trailing Or Interior Rows That Are
// Genuinely Empty (Excel May Report Worksheet Dimensions
// Beyond The Populated Data) Are Excluded Independently -
// Not By Stopping At The First Empty Row. Every Uploader's
// Health Count And Its Own Canonicalization Step Both Call
// This So They Can Never Drift Apart Again
// =====================================================

function processExtractUploadDataRows(
    rows:
        unknown[][]
): {
    headerRow:
        unknown[];

    dataRows:
        unknown[][];
} {

    const headerRow =
        (
            rows[
                0
            ] as unknown[]
        ) ??
            [];

    const candidateDataRows =
        rows.slice(
            1
        );

    const dataRows =
        candidateDataRows.filter(
            row =>
                !processRowIsEmpty(
                    row
                )
        );

    return {
        headerRow,
        dataRows
    };

}

// =====================================================
// Process Find Missing Required Upload Fields
// Dataset-Agnostic - Shared By Schedule (Activities/
// Resources) And Worklist. Reuses The Established
// Exact-Match Header Rule Against lookupKey - The
// Authoritative Source Contract, Never displayName. Any
// Registry Field Marked Required With No Matching Source
// Header Is Reported. A Field With lookupKey === null Is
// Generated/Stamped, Not Sourced From The Workbook At
// All, And Can Never Be Reported As A Missing Header
// Regardless Of field.required. Extra Workbook Columns
// Not Present In The Registry Are Never Considered Here -
// They Are Simply Ignored By The Rest Of The Pipeline
// =====================================================

function processFindMissingRequiredUploadFields(
    headerRow:
        unknown[],

    fields:
        FieldsRegistryField[]
): FieldsRegistryField[] {

    return fields.filter(
        field =>
            field.required &&
            field.lookupKey !==
                null &&
            headerRow.findIndex(
                header =>
                    String(
                        header ??
                        ""
                    ).trim() ===
                        field.lookupKey
            ) <
                0
    );

}

// =====================================================
// Process Canonicalize Schedule Rows
// Registry-Driven - Fields Not Present In The Registry
// Are Never Read From The Source Rows
// =====================================================

function processCanonicalizeScheduleRows(
    rows:
        unknown[][],

    fields:
        FieldsRegistryField[]
): Record<string, unknown>[] {

    const {
        headerRow,
        dataRows
    } =
        processExtractUploadDataRows(
            rows
        );


    // =====================================================
    // Defense In Depth - Fail Closed On Missing Required
    // Headers Rather Than Silently Canonicalizing null
    // Columns. Health Is Expected To Have Already Caught
    // This Before Save Was Reachable
    // =====================================================

    const missingRequiredFields =
        processFindMissingRequiredUploadFields(
            headerRow,
            fields
        );

    if (
        missingRequiredFields.length >
            0
    ) {

        throw new Error(
            `[ProjectDashboard] Missing required Schedule headers: ${missingRequiredFields.map(
                field =>
                    field.displayName
            ).join(
                ", "
            )}`
        );

    }

    const canonicalRows:
        Record<string, unknown>[] =
            [];

    for (
        const row
        of dataRows
    ) {

        const canonicalRow:
            Record<string, unknown> =
                {};

        for (
            const field
            of fields
        ) {

            // =================================================
            // Resolve Source Column - lookupKey Is The Source
            // Contract. lookupKey === null Means Generated/
            // Stamped, Never Matched Against The Workbook
            // =================================================

            const columnIndex =
                field.lookupKey ===
                    null
                    ? -1
                    : headerRow.findIndex(
                        header =>
                            String(
                                header ??
                                ""
                            ).trim() ===
                                field.lookupKey
                    );


            // =================================================
            // Map To Canonical Field
            // =================================================

            canonicalRow[
                field.canonicalName
            ] =
                columnIndex >=
                    0
                    ? processCanonicalFieldValue(
                        row[
                            columnIndex
                        ],
                        field.dataType
                    )
                    : null;

        }

        canonicalRows.push(
            canonicalRow
        );

    }

    return canonicalRows;

}

// =====================================================
// Process Build Schedule Parquet Columns
// Registry-Driven - Mirrors The Existing Worklist Column
// Pattern Without Modifying It
// =====================================================

function processBuildScheduleParquetColumns(
    rows:
        Record<string, unknown>[],

    fields:
        FieldsRegistryField[]
): {
    name:
        string;

    data:
        unknown[];

    type:
        "STRING" |
        "BOOLEAN" |
        "DOUBLE" |
        "TIMESTAMP";
}[] {

    return fields.map(
        field => {

            let parquetType:
                "STRING" |
                "BOOLEAN" |
                "DOUBLE" |
                "TIMESTAMP";

            switch (
                field.dataType
            ) {

                case "string":

                    parquetType =
                        "STRING";

                    break;


                case "boolean":

                    parquetType =
                        "BOOLEAN";

                    break;


                case "number":

                    parquetType =
                        "DOUBLE";

                    break;


                case "datetime":

                    parquetType =
                        "TIMESTAMP";

                    break;


                default:

                    throw new Error(
                        `[ProjectDashboard] Unsupported Schedule field data type: ${field.dataType}`
                    );

            }

            return {
                name:
                    field.canonicalName,

                data:
                    rows.map(
                        record =>
                            record[
                                field.canonicalName
                            ]
                    ),

                type:
                    parquetType
            };

        }
    );

}

// =====================================================
// Process Save Upload Schedule
// =====================================================

async function processSaveUploadSchedule(
    fieldsRegistry:
        FieldsRegistry,

    uploadActivityRows:
        unknown[][],

    uploadResourceRows:
        unknown[][],

    activeState:
        ActiveState,

    scheduleTypeIsCurrent:
        boolean,

    scheduleTypeIsBaseline:
        boolean,

    selectedBaseline:
        string,

    uploadOverlay:
        {
            overlay:
                HTMLDivElement;

            body:
                HTMLDivElement;

            progress:
                HTMLDivElement | null;

            close:
                () => void;
        },

    processMarkScheduleUploadCompleted:
        () => void
): Promise<void> {

    console.log(
        "[ProjectDashboard] ENTER processSaveUploadSchedule"
    );


    // =====================================================
    // Upload Step State
    // =====================================================

    let activeUploadStep =
        0;


    // =====================================================
    // Schedule Failure Status
    // Set Explicitly, Immediately Before Throwing, Only At
    // The Specific Sites Below That Can Distinguish A Known
    // Condition From A Generic Step Failure. Never Inferred
    // From Error Text - The Transaction Owner (The Outer
    // Catch) Reads This Instead Of Parsing Error Messages
    // =====================================================

    let scheduleFailureStatus:
        string | null =
            null;


    // =====================================================
    // Resolve Default Schedule Failure Status
    // Per-Step Fallback Used When No Specific Condition Above
    // Set scheduleFailureStatus
    // =====================================================

    const processResolveScheduleFailureStatus =
        (
            step:
                number
        ): string => {

            switch (
                step
            ) {

                case 1:

                    return "Unable to build schedule data.";

                case 2:

                    return "Unable to build schedule Parquet.";

                case 3:

                    return "Unable to validate target version.";

                case 4:

                    return "Unable to save schedule to Azure.";

                case 5:

                    return "Unable to validate schedule in Azure.";

                default:

                    return "An unexpected error occurred.";

            }

        };


    // =====================================================
    // Update Upload Step
    // =====================================================

    const processUpdateUploadStep =
        (
            step:
                number,

            state:
                "active" |
                "complete" |
                "failed"
        ): void => {

            const stepElement =
                uploadOverlay.progress?.querySelector(
                    `[data-step="${step}"]`
                ) as HTMLDivElement | null;

            if (
                !stepElement
            ) {

                return;

            }

            stepElement.classList.remove(
                "project-dashboard-overlay-upload-progress-step-active",
                "project-dashboard-overlay-upload-progress-step-complete",
                "project-dashboard-overlay-upload-progress-step-failed"
            );

            const statusElement =
                stepElement.querySelector(
                    ".project-dashboard-overlay-upload-progress-status"
                ) as HTMLSpanElement | null;

            switch (
                state
            ) {

                case "active":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-active"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "●";

                    }

                    break;


                case "complete":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-complete"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "✓";

                    }

                    break;


                case "failed":

                    stepElement.classList.add(
                        "project-dashboard-overlay-upload-progress-step-failed"
                    );

                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "✕";

                    }

                    break;

            }

        };


    // =====================================================
    // Process Upload Step
    // =====================================================

    const processUploadStep =
        async <T>(
            step:
                number,

            processStep:
                () => Promise<T> | T
        ): Promise<T> => {

            activeUploadStep =
                step;

            const uploadStepIndex =
                step -
                1;

            processUpdateUploadStep(
                uploadStepIndex,
                "active"
            );

            try {

                const result =
                    await processStep();

                processUpdateUploadStep(
                    uploadStepIndex,
                    "complete"
                );

                return result;

            }
            catch (
                error
            ) {

                processUpdateUploadStep(
                    uploadStepIndex,
                    "failed"
                );

                throw error;

            }

        };


    // =====================================================
    // Process Upload Failure
    // =====================================================

    const processUploadFailure =
        (
            error:
                unknown
        ): void => {

            console.error(
                "[ProjectDashboard] Schedule upload failed:",
                {
                    step:
                        activeUploadStep,

                    error:
                        error
                }
            );


            // =================================================
            // Remove Save Upload
            // =================================================

            const btnSave =
                uploadOverlay.overlay.querySelector(
                    ".project-dashboard-overlay-save"
                ) as HTMLButtonElement | null;

            btnSave?.remove();


            // =================================================
            // Remove Existing Error
            // =================================================

            const existingError =
                uploadOverlay.body.querySelector(
                    ".application-alert"
                );

            existingError?.remove();


            // =================================================
            // Show Upload Error
            // =================================================

            const ctrUploadError =
                document.createElement(
                    "div"
                );

            ctrUploadError.className =
                "application-alert";

            ctrUploadError.textContent =
                "Upload failed. Close to try again.";

            uploadOverlay.progress?.appendChild(
                ctrUploadError
            );

        };

    try {

        // =====================================================
        // 1-1 - Build Canonical Schedule Data
        // =====================================================

        const {
            canonicalActivities,
            canonicalResources
        } =
            await processUploadStep(
                1,
                () => {

                    const canonicalActivities =
                        processCanonicalizeScheduleRows(
                            uploadActivityRows,
                            fieldsRegistry.activities.fields
                        );

                    const canonicalResources =
                        processCanonicalizeScheduleRows(
                            uploadResourceRows,
                            fieldsRegistry.resources.fields
                        );

                    const activitiesExtraction =
                        processExtractUploadDataRows(
                            uploadActivityRows
                        );

                    const resourcesExtraction =
                        processExtractUploadDataRows(
                            uploadResourceRows
                        );

                    if (
                        canonicalActivities.length !==
                            activitiesExtraction.dataRows.length ||
                        canonicalResources.length !==
                            resourcesExtraction.dataRows.length
                    ) {

                        throw new Error(
                            "[ProjectDashboard] Canonical schedule row counts do not match the retained upload candidate"
                        );

                    }

                    // =============================================
                    // TEMPORARY DIAGNOSTIC - Schedule Row Contract
                    // Remove Once Row/Field Mapping Is Confirmed
                    // Correct Against A Real Uploaded Workbook
                    // =============================================

                    console.log(
                        "[ProjectDashboard] TEMPORARY DIAGNOSTIC - Schedule canonical data built:",
                        {
                            activities: {
                                worksheetRows:
                                    uploadActivityRows.length,

                                actualDataRows:
                                    activitiesExtraction.dataRows.length,

                                canonicalRows:
                                    canonicalActivities.length,

                                matchedFields:
                                    fieldsRegistry.activities.fields.filter(
                                        field =>
                                            field.lookupKey !==
                                                null &&
                                            activitiesExtraction.headerRow.findIndex(
                                                header =>
                                                    String(
                                                        header ??
                                                        ""
                                                    ).trim() ===
                                                        field.lookupKey
                                            ) >=
                                                0
                                    ).length,

                                missingRequiredFields:
                                    processFindMissingRequiredUploadFields(
                                        activitiesExtraction.headerRow,
                                        fieldsRegistry.activities.fields
                                    ).map(
                                        field =>
                                            field.displayName
                                    )
                            },

                            resources: {
                                worksheetRows:
                                    uploadResourceRows.length,

                                actualDataRows:
                                    resourcesExtraction.dataRows.length,

                                canonicalRows:
                                    canonicalResources.length,

                                matchedFields:
                                    fieldsRegistry.resources.fields.filter(
                                        field =>
                                            field.lookupKey !==
                                                null &&
                                            resourcesExtraction.headerRow.findIndex(
                                                header =>
                                                    String(
                                                        header ??
                                                        ""
                                                    ).trim() ===
                                                        field.lookupKey
                                            ) >=
                                                0
                                    ).length,

                                missingRequiredFields:
                                    processFindMissingRequiredUploadFields(
                                        resourcesExtraction.headerRow,
                                        fieldsRegistry.resources.fields
                                    ).map(
                                        field =>
                                            field.displayName
                                    )
                            }
                        }
                    );

                    return {
                        canonicalActivities,
                        canonicalResources
                    };

                }
            );


        // =====================================================
        // 1-2 - Build Schedule Parquet
        // =====================================================

        const {
            scheduleActivitiesParquet,
            scheduleResourcesParquet
        } =
            await processUploadStep(
                2,
                () => {

                    const activitiesColumns =
                        processBuildScheduleParquetColumns(
                            canonicalActivities,
                            fieldsRegistry.activities.fields
                        );

                    const scheduleActivitiesParquet =
                        encodeParquetArtifact(
                            activitiesColumns
                        );

                    const resourcesColumns =
                        processBuildScheduleParquetColumns(
                            canonicalResources,
                            fieldsRegistry.resources.fields
                        );

                    const scheduleResourcesParquet =
                        encodeParquetArtifact(
                            resourcesColumns
                        );

                    console.log(
                        "[ProjectDashboard] Schedule Parquet built:",
                        {
                            activitiesBytes:
                                scheduleActivitiesParquet.byteLength,

                            resourcesBytes:
                                scheduleResourcesParquet.byteLength
                        }
                    );

                    return {
                        scheduleActivitiesParquet,
                        scheduleResourcesParquet
                    };

                }
            );

        // =====================================================
        // 1-3 - Validate Target Path
        // =====================================================

        const {
            scheduleVersionId,
            scheduleTargetPath,
            schedulePlanType
        } =
            await processUploadStep(
                3,
                async () => {

                    // =============================================
                    // Require An Explicit Schedule Type
                    // Defensive - Save Eligibility Already Requires
                    // This, But S3 Does Not Trust UI State Alone
                    // =============================================

                    let schedulePlanType:
                        "Current" |
                        "Baseline";

                    if (
                        scheduleTypeIsCurrent
                    ) {

                        schedulePlanType =
                            "Current";

                    }
                    else if (
                        scheduleTypeIsBaseline &&
                        selectedBaseline
                    ) {

                        schedulePlanType =
                            "Baseline";

                    }
                    else {

                        throw new Error(
                            "[ProjectDashboard] Schedule Save requires an explicit Current Plan selection or a valid Baseline Plan selection"
                        );

                    }


                    // =============================================
                    // Generate The Schedule Version Identity
                    // Exactly Once For This Save Attempt
                    // =============================================

                    const scheduleVersionDate =
                        new Date();

                    const scheduleVersionDatePart =
                        [
                            scheduleVersionDate.getFullYear(),
                            String(
                                scheduleVersionDate.getMonth() + 1
                            ).padStart(
                                2,
                                "0"
                            ),
                            String(
                                scheduleVersionDate.getDate()
                            ).padStart(
                                2,
                                "0"
                            )
                        ].join(
                            ""
                        );

                    const scheduleVersionTimePart =
                        [
                            String(
                                scheduleVersionDate.getHours()
                            ).padStart(
                                2,
                                "0"
                            ),
                            String(
                                scheduleVersionDate.getMinutes()
                            ).padStart(
                                2,
                                "0"
                            )
                        ].join(
                            ""
                        );

                    const scheduleBaseVersionId =
                        `P6SD-${scheduleVersionDatePart}-${scheduleVersionTimePart}`;

                    const scheduleVersionId =
                        schedulePlanType ===
                            "Baseline"
                            ? `${scheduleBaseVersionId}-${selectedBaseline}`
                            : scheduleBaseVersionId;


                    // =============================================
                    // Construct The Authoritative Target Path
                    // From Active State - Not From Form/Workbook
                    // Values
                    // =============================================

                    const schedulePlanFolder =
                        schedulePlanType ===
                            "Baseline"
                            ? "baseline_plans"
                            : "current_plans";

                    const scheduleTargetPath =
                        `customers/${activeState.customerId}` +
                        `/locations/${activeState.locationId}` +
                        `/events/${activeState.eventId}` +
                        `/schedule_versions/${schedulePlanFolder}` +
                        `/${scheduleVersionId}`;

                    const scheduleActivitiesTargetPath =
                        `${scheduleTargetPath}/${scheduleVersionId}_activities.parquet`;

                    const scheduleResourcesTargetPath =
                        `${scheduleTargetPath}/${scheduleVersionId}_resources.parquet`;


                    // =============================================
                    // Baseline Only - Fresh Save-Time Availability
                    // Revalidation
                    //
                    // The form-time cache is a UI snapshot only and
                    // does not reserve the BL. This is a new,
                    // independent Azure read.
                    // =============================================

                    if (
                        schedulePlanType ===
                            "Baseline"
                    ) {

                        const baselinePlansPath =
                            `customers/${activeState.customerId}` +
                            `/locations/${activeState.locationId}` +
                            `/events/${activeState.eventId}` +
                            `/schedule_versions/baseline_plans`;

                        let freshBaselineFolderContents:
                            AzureFolderContentsEntry[];

                        try {

                            freshBaselineFolderContents =
                                await getFolderContents(
                                    baselinePlansPath,
                                    "List"
                                );

                        }
                        catch (
                            error
                        ) {

                            scheduleFailureStatus =
                                "Unable to validate baseline availability.";

                            throw error;

                        }

                        if (
                            processIsBaselineVersionUsed(
                                freshBaselineFolderContents,
                                selectedBaseline
                            )
                        ) {

                            scheduleFailureStatus =
                                `${selectedBaseline} is no longer available.`;

                            throw new Error(
                                `[ProjectDashboard] ${selectedBaseline} is no longer available`
                            );

                        }

                    }


                    // =============================================
                    // Exact Target Collision Validation
                    // Applies To Both Current And Baseline
                    // =============================================

                    const activitiesTargetIsAvailable =
                        await checkAzureArtifactAvailability(
                            scheduleActivitiesTargetPath
                        );

                    const resourcesTargetIsAvailable =
                        await checkAzureArtifactAvailability(
                            scheduleResourcesTargetPath
                        );

                    if (
                        !activitiesTargetIsAvailable ||
                        !resourcesTargetIsAvailable
                    ) {

                        scheduleFailureStatus =
                            "Target version already exists.";

                        throw new Error(
                            `[ProjectDashboard] Schedule target already exists: ${scheduleTargetPath}`
                        );

                    }

                    console.log(
                        "[ProjectDashboard] Schedule target path validated:",
                        {
                            scheduleVersionId,
                            scheduleTargetPath,
                            schedulePlanType
                        }
                    );

                    return {
                        scheduleVersionId,
                        scheduleTargetPath,
                        schedulePlanType
                    };

                }
            );

        // =====================================================
        // 1-4 - Save Schedule To Azure
        // =====================================================

        const scheduleActivitiesTargetPath =
            `${scheduleTargetPath}/${scheduleVersionId}_activities.parquet`;

        const scheduleResourcesTargetPath =
            `${scheduleTargetPath}/${scheduleVersionId}_resources.parquet`;

        await processUploadStep(
            4,
            async () => {

                await saveArtifactToAzure(
                    scheduleActivitiesTargetPath,
                    scheduleActivitiesParquet
                );

                console.log(
                    "[ProjectDashboard] Schedule Activities Parquet Saved To Azure:",
                    {
                        path:
                            scheduleActivitiesTargetPath,

                        bytes:
                            scheduleActivitiesParquet.byteLength
                    }
                );

                await saveArtifactToAzure(
                    scheduleResourcesTargetPath,
                    scheduleResourcesParquet
                );

                console.log(
                    "[ProjectDashboard] Schedule Resources Parquet Saved To Azure:",
                    {
                        path:
                            scheduleResourcesTargetPath,

                        bytes:
                            scheduleResourcesParquet.byteLength
                    }
                );

            }
        );

        // =====================================================
        // 1-5 - Validate Schedule In Azure
        // =====================================================

        await processUploadStep(
            5,
            async () => {

                const scheduleVersionFolderContents =
                    await getFolderContents(
                        scheduleTargetPath,
                        "List"
                    );

                const scheduleVersionValidationResult =
                    processValidateScheduleVersionContents(
                        scheduleVersionId,
                        scheduleVersionFolderContents
                    );

                if (
                    !scheduleVersionValidationResult.isValid
                ) {

                    scheduleFailureStatus =
                        "Schedule version is incomplete in Azure.";

                    throw new Error(
                        `[ProjectDashboard] Schedule version validation failed: ${scheduleVersionId} ` +
                        `Activities: ${scheduleVersionValidationResult.activitiesExists ? "available" : "missing"} ` +
                        `Resources: ${scheduleVersionValidationResult.resourcesExists ? "available" : "missing"}`
                    );

                }

                console.log(
                    "[ProjectDashboard] Schedule version validated in Azure:",
                    {
                        scheduleVersionId,
                        scheduleTargetPath,
                        ...scheduleVersionValidationResult
                    }
                );

            }
        );

        // =====================================================
        // Session Completion - Set Only After S5 Succeeds
        // Activities And Resources Share One Schedule
        // Completion State Regardless Of Which Entry Point
        // Launched This Transaction
        // =====================================================

        processMarkScheduleUploadCompleted();

        // =====================================================
        // Schedule Create Version V1 Terminal Success
        // S5 Is The Final Transaction Step - There Are No
        // Further Schedule Create Version Persistence Steps.
        // Reuses The Existing Version Outcome Row And The
        // Existing Worklist Cancel/Close Terminal Pattern
        // =====================================================

        const ctrScheduleVersionOutcomeRow =
            uploadOverlay.body.querySelector(
                ".project-dashboard-overlay-schedule-version-outcome-section .project-dashboard-overlay-upload-progress-step"
            ) as HTMLDivElement | null;

        const ctrScheduleVersionOutcomeStatus =
            ctrScheduleVersionOutcomeRow?.querySelector(
                ".project-dashboard-overlay-upload-progress-status"
            ) as HTMLSpanElement | null;

        const ctrScheduleVersionOutcomeText =
            ctrScheduleVersionOutcomeRow?.querySelector(
                ".project-dashboard-overlay-upload-progress-text"
            ) as HTMLSpanElement | null;

        ctrScheduleVersionOutcomeRow?.classList.add(
            "project-dashboard-overlay-upload-progress-step-complete"
        );

        if (
            ctrScheduleVersionOutcomeStatus
        ) {

            ctrScheduleVersionOutcomeStatus.textContent =
                "✓";

        }

        if (
            ctrScheduleVersionOutcomeText
        ) {

            ctrScheduleVersionOutcomeText.textContent =
                `Version = ${scheduleVersionId} created successfully.`;

        }

        const btnScheduleCancel =
            uploadOverlay.overlay.querySelector(
                ".project-dashboard-overlay-cancel"
            ) as HTMLButtonElement | null;

        btnScheduleCancel?.classList.add(
            "application-hidden"
        );

        const btnScheduleSave =
            uploadOverlay.overlay.querySelector(
                ".project-dashboard-overlay-save"
            ) as HTMLButtonElement | null;

        if (
            btnScheduleSave
        ) {

            const btnScheduleClose =
                document.createElement(
                    "button"
                );

            btnScheduleClose.type =
                "button";

            btnScheduleClose.className =
                btnScheduleSave.className;

            btnScheduleClose.classList.remove(
                "application-disabled"
            );

            btnScheduleClose.textContent =
                "Close";

            btnScheduleClose.addEventListener(
                "click",
                () => {

                    uploadOverlay.close();

                }
            );

            btnScheduleSave.replaceWith(
                btnScheduleClose
            );

        }

        console.log(
            "[ProjectDashboard] Schedule version created successfully:",
            {
                scheduleVersionId,
                scheduleTargetPath,
                schedulePlanType,
                activitiesBytes:
                    scheduleActivitiesParquet.byteLength,

                resourcesBytes:
                    scheduleResourcesParquet.byteLength
            }
        );

    }
    catch (
        error
    ) {

        // =====================================================
        // Schedule Create Version V1 Terminal Failure
        // Any S1-S5 Failure Ends The Transaction The Same Way -
        // Update The Version Outcome Row Before The Existing
        // Failure Presentation Runs
        // =====================================================

        const ctrScheduleVersionOutcomeRow =
            uploadOverlay.body.querySelector(
                ".project-dashboard-overlay-schedule-version-outcome-section .project-dashboard-overlay-upload-progress-step"
            ) as HTMLDivElement | null;

        const ctrScheduleVersionOutcomeStatus =
            ctrScheduleVersionOutcomeRow?.querySelector(
                ".project-dashboard-overlay-upload-progress-status"
            ) as HTMLSpanElement | null;

        const ctrScheduleVersionOutcomeText =
            ctrScheduleVersionOutcomeRow?.querySelector(
                ".project-dashboard-overlay-upload-progress-text"
            ) as HTMLSpanElement | null;

        ctrScheduleVersionOutcomeRow?.classList.add(
            "project-dashboard-overlay-upload-progress-step-failed"
        );

        if (
            ctrScheduleVersionOutcomeStatus
        ) {

            ctrScheduleVersionOutcomeStatus.textContent =
                "✕";

        }

        if (
            ctrScheduleVersionOutcomeText
        ) {

            const resolvedScheduleFailureStatus =
                scheduleFailureStatus ??
                processResolveScheduleFailureStatus(
                    activeUploadStep
                );

            ctrScheduleVersionOutcomeText.textContent =
                `Version creation failed. (${resolvedScheduleFailureStatus})`;

        }

        // =====================================================
        // Terminal Close-Only - No In-Place Retry
        // Save Is Already Removed By processUploadFailure Below;
        // Cancel Is Relabelled Since It Already Only Closes
        // =====================================================

        const btnScheduleCancel =
            uploadOverlay.overlay.querySelector(
                ".project-dashboard-overlay-cancel"
            ) as HTMLButtonElement | null;

        if (
            btnScheduleCancel
        ) {

            btnScheduleCancel.disabled =
                false;

            btnScheduleCancel.classList.remove(
                "application-disabled"
            );

            btnScheduleCancel.textContent =
                "Close";

        }

        processUploadFailure(
            error
        );

        return;

    }
    finally {

        console.log(
            "[ProjectDashboard] EXIT processSaveUploadSchedule"
        );

    }

}
