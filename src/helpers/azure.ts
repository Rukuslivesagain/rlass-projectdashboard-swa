import {
    processApplicationError
} from "./errors";


// =====================================================
// Azure Error Type
// =====================================================

export type AzureErrorType =
    "ArtifactNotFound" |
    "InvalidRequest" |
    "Unauthorized" |
    "Forbidden" |
    "ServiceUnavailable" |
    "ServerError" |
    "NetworkError" |
    "Unknown";


// =====================================================
// Azure Artifact Error
// =====================================================

export class AzureArtifactError extends Error {

    public readonly status:
        number | null;

    public readonly errorType:
        AzureErrorType;

    public readonly operation:
        string;

    public readonly artifactType:
        string | null;

    public readonly artifactPaths:
        string[];

    public readonly responseText:
        string;

    public constructor(
        message:
            string,

        status:
            number | null,

        errorType:
            AzureErrorType,

        operation:
            string,

        artifactType:
            string | null,

        artifactPaths:
            string[],

        responseText:
            string
    ) {

        super(
            message
        );

        this.name =
            "AzureArtifactError";

        this.status =
            status;

        this.errorType =
            errorType;

        this.operation =
            operation;

        this.artifactType =
            artifactType;

        this.artifactPaths =
            artifactPaths;

        this.responseText =
            responseText;

    }

}


// =====================================================
// Azure Request Context
// =====================================================

interface AzureRequestContext {

    operation:
        string;

    artifactType?:
        string;

    artifactPaths?:
        string[];

    details?:
        unknown;

}


// =====================================================
// Resolve Azure Error Type
// =====================================================

function resolveAzureErrorType(
    status:
        number | null,

    responseText:
        string
): AzureErrorType {

    // =====================================================
    // 1 - Normalize Response Text
    // =====================================================

    const normalizedResponseText =
        responseText
            .toLowerCase();


    // =====================================================
    // 2 - Missing Artifact
    //     Handles Current Azure Function 500 Wrapper
    // =====================================================

    if (
        status ===
            404 ||
        normalizedResponseText.includes(
            "specified blob does not exist"
        ) ||
        normalizedResponseText.includes(
            "blobnotfound"
        ) ||
        normalizedResponseText.includes(
            "artifact not found"
        )
    ) {

        return "ArtifactNotFound";

    }


    // =====================================================
    // 3 - Request / Access Errors
    // =====================================================

    if (
        status ===
            400
    ) {

        return "InvalidRequest";

    }

    if (
        status ===
            401
    ) {

        return "Unauthorized";

    }

    if (
        status ===
            403
    ) {

        return "Forbidden";

    }


    // =====================================================
    // 4 - Service Errors
    // =====================================================

    if (
        status ===
            502 ||
        status ===
            503 ||
        status ===
            504
    ) {

        return "ServiceUnavailable";

    }

    if (
        status !==
            null &&
        status >=
            500
    ) {

        return "ServerError";

    }


    // =====================================================
    // 5 - Unknown
    // =====================================================

    return "Unknown";

}


// =====================================================
// Process Azure Failure
// =====================================================

function processAzureFailure(
    error:
        unknown,

    context:
        AzureRequestContext,

    status:
        number | null = null,

    responseText =
        ""
): never {

    // =====================================================
    // 1 - Preserve Typed Azure Error
    // =====================================================

    if (
        error instanceof
            AzureArtifactError
    ) {

        throw error;

    }


    // =====================================================
    // 2 - Resolve Error Type
    // =====================================================

    const errorType:
        AzureErrorType =
            status ===
                null &&
            !responseText
                ? "NetworkError"
                : resolveAzureErrorType(
                    status,
                    responseText
                );


    // =====================================================
    // 3 - Resolve Error Message
    // =====================================================

    const errorMessage =
        error instanceof Error &&
        error.message
            ? error.message
            : `[ProjectDashboard] Azure request failed: ${context.operation}`;


    // =====================================================
    // 4 - Build Typed Azure Error
    // =====================================================

    const azureError =
        new AzureArtifactError(
            errorMessage,
            status,
            errorType,
            context.operation,
            context.artifactType ??
                null,
            context.artifactPaths ??
                [],
            responseText
        );


    // =====================================================
    // 5 - Route Through Shared Error Handler
    //
    // Single Application Error Handler - Pass 2B.
    //
    // disposition: "Throw" pins the resolved disposition to Throw
    // regardless of classification, and processApplicationError
    // itself performs the throw below (preserving this exact
    // azureError instance, since it is already an Error) - no
    // separate throw follows this call.
    // =====================================================

    processApplicationError(
        azureError,
        {
            source:
                "Azure",

            operation:
                context.operation,

            status:
                status ??
                    undefined,

            errorType:
                errorType,

            artifactType:
                context.artifactType,

            artifactPaths:
                context.artifactPaths,

            disposition:
                "Throw",

            details:
                {
                    responseText:
                        responseText,

                    contextDetails:
                        context.details
                }
        }
    );

}


// =====================================================
// Process Azure Response Failure
// =====================================================

async function processAzureResponseFailure(
    response:
        Response,

    context:
        AzureRequestContext
): Promise<never> {

    const responseText =
        await response.text();

    const error =
        new Error(
            `[ProjectDashboard] Azure request failed: ${response.status} - ${responseText}`
        );

    return processAzureFailure(
        error,
        context,
        response.status,
        responseText
    );

}


// =====================================================
// Execute Azure Request
// =====================================================

async function executeAzureRequest(
    input:
        RequestInfo | URL,

    init:
        RequestInit,

    context:
        AzureRequestContext
): Promise<Response> {

    try {

        // =====================================================
        // 1 - Execute Request
        // =====================================================

        const response =
            await fetch(
                input,
                init
            );


        // =====================================================
        // 2 - Validate Response
        // =====================================================

        if (
            !response.ok
        ) {

            return await processAzureResponseFailure(
                response,
                context
            );

        }


        // =====================================================
        // 3 - Return Response
        // =====================================================

        return response;

    }
    catch (
        error
    ) {

        // =====================================================
        // 4 - Process Network / Transport Failure
        // =====================================================

        return processAzureFailure(
            error,
            context
        );

    }

}

// =====================================================
// Azure Artifact Package Return
// =====================================================

// =====================================================
// Azure Artifact Package Header
// =====================================================

export interface AzureArtifactPackageHeader {

    artifacts: {

        type:
            string;

        version:
            string;

        length:
            number;

    }[];

}

export interface UserAccessResult {
    userSystemId: string;
    userGuid: string;
    displayName: string;
    email: string;
    globalAccessKeys: string[];
    userProfilePath: string;
    isActive: boolean;
}

// =====================================================
// Parse Azure Artifact Package Header
// =====================================================

export function parseAzureArtifactPackageHeader(
    buffer: ArrayBuffer
): {
    header:
        AzureArtifactPackageHeader;

    dataOffset:
        number;
} {

    const view =
        new DataView(
            buffer
        );

    const headerLength =
        view.getUint32(
            0,
            true
        );

    const headerBytes =
        new Uint8Array(
            buffer,
            4,
            headerLength
        );

    const headerJson =
        new TextDecoder().decode(
            headerBytes
        );

    const header =
        JSON.parse(
            headerJson
        ) as AzureArtifactPackageHeader;

    return {
        header,
        dataOffset:
            4 +
            headerLength
    };

}

// =====================================================
// Split Azure Artifact Package
// =====================================================

export function splitAzureArtifactPackage(
    buffer: ArrayBuffer
): Map<string, ArrayBuffer> {

    const {
        header,
        dataOffset
    } =
        parseAzureArtifactPackageHeader(
            buffer
        );

    const artifacts =
        new Map<string, ArrayBuffer>();

    let offset =
        dataOffset;

    for (
        const artifact of header.artifacts
    ) {

        const artifactBuffer =
            buffer.slice(
                offset,
                offset +
                    artifact.length
            );

        const artifactKey =
            `${artifact.type.toLowerCase()}:${artifact.version}`;

        artifacts.set(
            artifactKey,
            artifactBuffer
        );

        offset +=
            artifact.length;

    }

    return artifacts;

}

export async function getDataFromAzure(
    version1: string,
    version2: string,
    version3: string,
    version4: string
): Promise<ArrayBuffer> {

    const functionUrl =
        `https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData` +
        `?v1=${encodeURIComponent(version1)}` +
        `&v2=${encodeURIComponent(version2)}` +
        `&v3=${encodeURIComponent(version3)}` +
        `&v4=${encodeURIComponent(version4)}` +
        `&raw=all`;

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "GET"
            },
            {
                operation:
                    "GetDataFromAzure",

                details:
                    {
                        version1,
                        version2,
                        version3,
                        version4
                    }
            }
        );

    return await response.arrayBuffer();

}

// =====================================================
// Get Artifacts From Azure
// =====================================================

export async function getArtifactsFromAzure(
    artifactType:
        string,

    artifactPaths:
        string[],

    signal?:
        AbortSignal
): Promise<ArrayBuffer> {

    let artifactsParameter:
        string;


    // =====================================================
    // 1 - Build Artifact Path Transport
    // =====================================================

    switch (
        artifactType
    ) {

        case "Data":

            artifactsParameter =
                JSON.stringify(
                    artifactPaths
                );

            break;

        case "Registry":

            artifactsParameter =
                artifactPaths.join(
                    "|"
                );

            break;

        case "Other":

            artifactsParameter =
                artifactPaths.join(
                    "|"
                );

            break;

        default:

            return processAzureFailure(
                new Error(
                    `[ProjectDashboard] Unsupported Azure artifact type: ${artifactType}`
                ),
                {
                    operation:
                        "GetArtifactsFromAzure",

                    artifactType:
                        artifactType,

                    artifactPaths:
                        artifactPaths,

                    details:
                        {
                            reason:
                                "UnsupportedArtifactType"
                        }
                }
            );

    }


    // =====================================================
    // 2 - Build Request
    // =====================================================

    const functionUrl =
        `https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData` +
        `?type=${encodeURIComponent(artifactType)}` +
        `&artifacts=${encodeURIComponent(artifactsParameter)}`;


    // =====================================================
    // 3 - Execute Request
    // =====================================================

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "GET",

                signal:
                    signal
            },
            {
                operation:
                    "GetArtifactsFromAzure",

                artifactType:
                    artifactType,

                artifactPaths:
                    artifactPaths
            }
        );


    // =====================================================
    // 4 - Return Artifact Package
    // =====================================================

    return await response.arrayBuffer();

}

// =====================================================
// Local Registry State
//
// Scalable RegistrySync V2 Contract - One Entry Per Registry
// This Instance Knows About. localLastModified Is That
// SPECIFIC Registry's Own Actual Root lastModified, Read
// From Its Own Local IndexedDB Copy - Never A Customer
// Master Proxy Value. null Means No Usable Local Copy Exists
// =====================================================

export interface LocalRegistryState {

    registryType:
        string;

    registryPath:
        string;

    localLastModified:
        string | null;

}

// =====================================================
// Sync Customer Registries From Azure
// =====================================================

export async function syncCustomerRegistriesFromAzure(
    localRegistries:
        LocalRegistryState[]
): Promise<ArrayBuffer> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "RegistrySync",

                            localRegistries:
                                localRegistries
                        }
                    )
            },
            {
                operation:
                    "SyncCustomerRegistriesFromAzure",

                artifactPaths:
                    localRegistries.map(
                        localRegistry =>
                            localRegistry.registryPath
                    )
            }
        );

    return await response.arrayBuffer();

}

// =====================================================
// Check Azure Artifact Availability
// =====================================================

export async function checkAzureArtifactAvailability(
    artifactPath:
        string
): Promise<boolean> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "ArtifactExists",

                            artifactPath:
                                artifactPath
                        }
                    )
            },
            {
                operation:
                    "CheckAzureArtifactAvailability",

                artifactPaths:
                    [
                        artifactPath
                    ]
            }
        );

    const result =
        await response.json() as {
            exists:
                boolean;
        };

    return !result.exists;

}

// =====================================================
// Save Artifact To Azure
// =====================================================

export async function saveArtifactToAzure(
    artifactPath:
        string,

    artifactBuffer:
        ArrayBuffer
): Promise<void> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    await executeAzureRequest(
        functionUrl,
        {
            method:
                "POST",

            headers: {
                "Content-Type":
                    "application/octet-stream",

                "x-rlass-mode":
                    "ArtifactWrite",

                "x-rlass-artifact-path":
                    artifactPath
            },

            body:
                artifactBuffer
        },
        {
            operation:
                "SaveArtifactToAzure",

            artifactPaths:
                [
                    artifactPath
                ]
        }
    );

}

// =====================================================
// Replace Artifact In Azure
// =====================================================

export async function replaceArtifactInAzure(
    artifactPath:
        string,

    artifactBuffer:
        ArrayBuffer
): Promise<void> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    await executeAzureRequest(
        functionUrl,
        {
            method:
                "POST",

            headers: {
                "Content-Type":
                    "application/octet-stream",

                "x-rlass-mode":
                    "ArtifactReplace",

                "x-rlass-artifact-path":
                    artifactPath
            },

            body:
                artifactBuffer
        },
        {
            operation:
                "ReplaceArtifactInAzure",

            artifactPaths:
                [
                    artifactPath
                ]
        }
    );

}

// =====================================================
// Move Folder Contents And Clear
// =====================================================

export async function moveFolderContentsAndClear(
    sourceFolderPath:
        string,

    destinationFolderPath:
        string
): Promise<number> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "MoveFolderContentsAndClear",

                            sourceFolderPath:
                                sourceFolderPath,

                            destinationFolderPath:
                                destinationFolderPath
                        }
                    )
            },
            {
                operation:
                    "MoveFolderContentsAndClear",

                details:
                    {
                        sourceFolderPath,
                        destinationFolderPath
                    }
            }
        );

    const result =
        await response.json() as {
            movedCount:
                number;
        };

    return result.movedCount;

}

// =====================================================
// Azure Folder Contents Entry
// =====================================================

export interface AzureFolderContentsEntry {

    name:
        string;

    type:
        "folder" |
        "artifact";

}

// =====================================================
// Azure Folder Contents Mode
// =====================================================

export type AzureFolderContentsMode =
    "List";

// =====================================================
// Get Folder Contents
//
// General-purpose, read-only Azure folder primitive. Returns
// only the immediate (non-recursive) children of the requested
// folder - it has no knowledge of Schedule, Baseline, or any
// other Project Dashboard business concept. The caller owns the
// meaning of the returned entries. Every call performs a fresh
// Azure read; this helper does not cache.
// =====================================================

export async function getFolderContents(
    folderPath:
        string,

    mode:
        AzureFolderContentsMode
): Promise<AzureFolderContentsEntry[]> {

    void mode;

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "FolderContents",

                            folderPath:
                                folderPath
                        }
                    )
            },
            {
                operation:
                    "GetFolderContents",

                artifactPaths:
                    [
                        folderPath
                    ]
            }
        );

    const result =
        await response.json() as {
            folderPath:
                string;

            children:
                AzureFolderContentsEntry[];
        };

    return result.children;

}

// =====================================================
// Get Azure Artifact Last Modified
// =====================================================

export async function getAzureArtifactLastModified(
    artifactPaths:
        string[]
): Promise<Map<string, string | null>> {

    console.log(
        "[ProjectDashboard] ENTER getAzureArtifactLastModified:",
        artifactPaths
    );

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "ArtifactLastModified",

                            artifactPaths:
                                artifactPaths
                        }
                    )
            },
            {
                operation:
                    "GetAzureArtifactLastModified",

                artifactPaths:
                    artifactPaths
            }
        );

    const result =
        await response.json() as {
            artifacts:
                {
                    artifactPath:
                        string;

                    lastModified:
                        string | null;
                }[];
        };

    const lastModifiedMap =
        new Map<string, string | null>();

    result.artifacts.forEach(
        artifact => {

            lastModifiedMap.set(
                artifact.artifactPath,
                artifact.lastModified
            );

        }
    );

    console.log(
        "[ProjectDashboard] EXIT getAzureArtifactLastModified:",
        result.artifacts
    );

    return lastModifiedMap;

}

// =====================================================
// Get Artifact ETag
//
// Metadata-only equality token read - calls the backend's
// ArtifactETag mode (distinct from ArtifactLastModified
// above). Never downloads or parses artifact content. The
// caller treats etag as an opaque comparison value only.
// =====================================================

export async function getArtifactEtag(
    artifactPath:
        string
): Promise<{
    path:
        string;

    etag:
        string | null;

    lastModified:
        string | null;
}> {

    console.log(
        "[ProjectDashboard] ENTER getArtifactEtag:",
        artifactPath
    );

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "ArtifactETag",

                            artifactPath:
                                artifactPath
                        }
                    )
            },
            {
                operation:
                    "GetArtifactEtag",

                artifactPaths:
                    [
                        artifactPath
                    ]
            }
        );

    const result =
        await response.json() as {
            path:
                string;

            etag:
                string | null;

            lastModified:
                string | null;
        };

    console.log(
        "[ProjectDashboard] EXIT getArtifactEtag:",
        result
    );

    return result;

}

// =====================================================
// Touch Change ETag
//
// Production customer-wide change notification write -
// calls the backend's ChangeEtag mode (distinct from
// ArtifactETag above, and from the isolated
// ChangeEtagTest proof route). Performs an unconditional
// zero-byte marker write and returns the freshly assigned
// etag. The marker's content is intentionally meaningless -
// callers treat etag as an opaque comparison value only.
// =====================================================

export async function touchChangeEtag(
    artifactPath:
        string
): Promise<{
    path:
        string;

    etag:
        string | null;

    lastModified:
        string | null;
}> {

    console.log(
        "[ProjectDashboard] ENTER touchChangeEtag:",
        artifactPath
    );

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "ChangeEtag",

                            artifactPath:
                                artifactPath
                        }
                    )
            },
            {
                operation:
                    "TouchChangeEtag",

                artifactPaths:
                    [
                        artifactPath
                    ]
            }
        );

    const result =
        await response.json() as {
            path:
                string;

            etag:
                string | null;

            lastModified:
                string | null;
        };

    console.log(
        "[ProjectDashboard] EXIT touchChangeEtag:",
        result
    );

    return result;

}

// =====================================================
// Check Runtime Registry Freshness
// =====================================================

export async function checkRuntimeRegistryFreshness(
    customerMasterRegistryPath:
        string,

    customerMasterLastModified:
        string,

    userProfilePath:
        string,

    userProfileLastModified:
        string
): Promise<ArrayBuffer> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            mode:
                                "RuntimeRegistryFreshness",

                            customerMasterRegistryPath:
                                customerMasterRegistryPath,

                            customerMasterLastModified:
                                customerMasterLastModified,

                            userProfilePath:
                                userProfilePath,

                            userProfileLastModified:
                                userProfileLastModified
                        }
                    )
            },
            {
                operation:
                    "CheckRuntimeRegistryFreshness",

                artifactPaths:
                    [
                        customerMasterRegistryPath,
                        userProfilePath
                    ]
            }
        );

    return await response.arrayBuffer();

}

export async function getUserAccessFromAzure(
    email: string,

    signal?:
        AbortSignal
): Promise<UserAccessResult> {

    const functionUrl =
        "https://fap-rlass-sd-dev-g2bzffgdbdawd8fz.centralus-01.azurewebsites.net/api/getData";

    const response =
        await executeAzureRequest(
            functionUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                signal:
                    signal,

                body:
                    JSON.stringify(
                        {
                            mode:
                                "UserGlobalAccess",

                            email:
                                email
                        }
                    )
            },
            {
                operation:
                    "GetUserAccessFromAzure",

                details:
                    {
                        email
                    }
            }
        );

    return await response.json() as UserAccessResult;

}