// =====================================================
// Application Error Disposition
//
// Single Application Error Handler - Pass 2B.
//
// Renamed from ApplicationErrorDisplayMode - "None" and "Throw"
// are not display mechanisms, so "display mode" stopped being an
// accurate name once error propagation itself became one of the
// handler's explicit outcomes.
// =====================================================

export type ApplicationErrorDisposition =
    "None" |
    "Throw" |
    "Message" |
    "Notification" |
    "InDropdown";


// =====================================================
// Application Message Action
//
// Single Application Error Handler - Pass 1.
//
// The one optional action the application billboard
// (showMessage) can render. "Message" disposition means routing
// to showMessage - this is that billboard's action contract, kept
// alongside ApplicationErrorDisposition rather than declared
// inline in index.ts, matching this repository's convention of
// declaring shared types in models/helpers rather than in
// index.ts itself.
// =====================================================

export interface ApplicationMessageAction {

    label:
        string;

    processAction:
        () => void | Promise<void>;

}


// =====================================================
// Application Error Communication
//
// Single Application Error Handler - Pass 2.
//
// The disposition router (Stage 4) invokes these to actually
// communicate a resolved error - it never touches the DOM, never
// imports index.ts/ProjectDashboard, and never knows showMessage
// is a private class method. index.ts supplies an object
// satisfying this shape (bound methods/closures), the same
// dependency-injection convention already used throughout this
// repository (buildSettingsOverlay, buildDashboardTen, etc.).
//
// showMessage mirrors the existing private ProjectDashboard method
// exactly - no DOM container is exposed here, only the same
// primitive arguments that method already accepts.
//
// showNotification is intentionally minimal (title + body only).
// No current classification resolves to "Notification", so its
// real shape (mode, actions) is left for whichever future
// classification family actually needs it - inventing more now
// would be speculative. The index.ts adapter is free to choose a
// sensible default notification mode internally.
//
// Neither is required for "Throw" or "None" - both are optional so
// a caller whose resolved disposition never needs communication
// is not forced to supply either, and helpers/azure.ts's existing
// consumer must keep working without any UI dependency at all.
// =====================================================

export interface ApplicationErrorCommunication {

    showMessage?:
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
                "app-fatal",

            action?:
                ApplicationMessageAction
        ) => void;

    showNotification?:
        (
            title:
                string,

            message:
                string
        ) => void;

}


// =====================================================
// Application Error Context
// =====================================================

export interface ApplicationErrorContext {

    source:
        string;

    operation:
        string;

    message?:
        string;

    status?:
        number;

    errorType?:
        string;

    artifactType?:
        string;

    artifactPaths?:
        string[];

    // =====================================================
    // Single Application Error Handler - Pass 2.
    //
    // Optional. When a caller explicitly supplies this, it is
    // honored verbatim as the resolved
    // ApplicationErrorResult.disposition, taking priority over
    // whatever Stage 2 classification would otherwise resolve -
    // this is what lets helpers/azure.ts's existing consumer pin
    // "Throw" (Pass 2B) and continue requiring no communication
    // dependency, unaffected by classification. When omitted,
    // classification resolves it.
    // =====================================================

    disposition?:
        ApplicationErrorDisposition;

    notificationTitle?:
        string;

    notificationMessage?:
        string;

    // =====================================================
    // Single Application Error Handler - Pass 2.
    //
    // Caller-supplied fallbacks, consulted only when Stage 2 has
    // no specific classification for this error (the unclassified/
    // default case). A matched classification (e.g. the User
    // Access family) resolves these itself and does not consult
    // these fields - see processApplicationError Stage 2.
    // =====================================================

    disableRequired?:
        boolean;

    disableMode?:
        "app-fatal";

    action?:
        ApplicationMessageAction;

    details?:
        unknown;

}


// =====================================================
// Application Error Result
// =====================================================

export interface ApplicationErrorResult {

    source:
        string;

    operation:
        string;

    message:
        string;

    status:
        number | null;

    errorType:
        string;

    timestamp:
        string;

    disposition:
        ApplicationErrorDisposition;

    notificationTitle:
        string;

    notificationMessage:
        string | undefined;

    // =====================================================
    // Single Application Error Handler - Pass 2.
    //
    // Resolved Message-route presentation data - what Stage 4
    // passes to communication.showMessage as disableRequired/
    // disableMode/action. Always resolved to a concrete value
    // (never read back from context a second time downstream).
    // =====================================================

    disableRequired:
        boolean;

    disableMode:
        "app-fatal" | undefined;

    action:
        ApplicationMessageAction | undefined;

    originalError:
        unknown;

    context:
        ApplicationErrorContext;

}


// =====================================================
// Process Application Error
//
// Single Application Error Handler - Pass 2B.
//
// The one authoritative application error-processing pipeline,
// and the ROOT THROW AUTHORITY for the application:
//
//     normalize (Stage 1)
//         -> classify (Stage 2)
//         -> build ApplicationErrorResult (Stage 3)
//         -> log
//         -> route disposition (Stage 4)
//         -> return ApplicationErrorResult (non-throwing dispositions only)
//
// communication is optional. "None" and "Throw" never touch it.
// "Message"/"Notification" require the matching callback to
// already be supplied - see Stage 4 for the explicit failure
// behavior when it is not.
//
// IMPORTANT - Root throw authority:
// Every throw inside this function (the "Throw" disposition itself,
// and the internal missing-communication-dependency failures) is a
// TERMINAL throw of the error-routing mechanism. None of them call
// processApplicationError again. This function is where
// application throws are meant to converge, not itself a
// participant that re-enters its own pipeline.
//
// Two overload signatures exist solely so a caller that pins
// context.disposition to the literal "Throw" (as
// helpers/azure.ts's processAzureFailure now does) keeps an
// accurate `never` return type at the call site, without requiring
// that caller to add an unreachable throw of its own merely to
// satisfy the compiler. This is provably accurate: an explicit
// context.disposition always wins over classification (see Stage
// 2/"Resolve Disposition" below), so disposition === "Throw" can
// never fall through to Stage 4's non-throwing branches.
// =====================================================

export function processApplicationError(
    error:
        unknown,

    context:
        ApplicationErrorContext & {
            disposition:
                "Throw";
        },

    communication?:
        ApplicationErrorCommunication
): never;

export function processApplicationError(
    error:
        unknown,

    context:
        ApplicationErrorContext,

    communication?:
        ApplicationErrorCommunication
): ApplicationErrorResult;

export function processApplicationError(
    error:
        unknown,

    context:
        ApplicationErrorContext,

    communication?:
        ApplicationErrorCommunication
): ApplicationErrorResult {

    // =====================================================
    // Stage 1 - Normalize
    //
    // Unchanged since Pass 1 - resolves message/status/errorType
    // from the raw error, preferring structured signals (e.g. a
    // thrown AzureArtifactError's own .status) over context
    // defaults. Azure failures already carry this structure -
    // Stage 2 below prefers it over message-substring parsing.
    // =====================================================

    let message =
        context.message ??
        "Unknown application error";

    if (
        error instanceof Error &&
        error.message
    ) {

        message =
            error.message;

    }

    const status =
        context.status ??
        (
            typeof error ===
                "object" &&
            error !==
                null &&
            "status" in error &&
            typeof (
                error as {
                    status?: unknown;
                }
            ).status ===
                "number"
                ? (
                    error as {
                        status: number;
                    }
                ).status
                : null
        );

    let errorType =
        context.errorType ??
        "Unknown";

    if (
        error instanceof Error &&
        error.name
    ) {

        errorType =
            context.errorType ??
            error.name;

    }


    // =====================================================
    // Stage 2 - Classify
    //
    // Answers "what happened?" only - no communication mechanism
    // and no throw is invoked here. Context-aware by design: a
    // condition is only matched when it belongs to the operation
    // it was established for, so (for example) a 404 from some
    // future, unrelated boundary does not silently inherit the
    // User Access family's "Inactive Account" meaning. The User
    // Access family below is gated on context.operation ===
    // "GetUserAccessFromAzure" - the exact operation identifier
    // already used at that call site in helpers/azure.ts
    // (getUserAccessFromAzure), not a newly invented key.
    //
    // Artifact Store Not Open remains message-based - its origin
    // (helpers/artifactStore.ts) is a plain Error with no
    // structured type, unrelated to any Azure operation.
    //
    // None of the current classifications resolve "Throw" -
    // Throw is reached in this pass only via an explicit
    // context.disposition override (see helpers/azure.ts).
    // =====================================================

    let classifiedDisposition:
        ApplicationErrorDisposition =
            "None";

    let classifiedNotificationTitle:
        string =
            context.notificationTitle ??
            "Application Error";

    let classifiedNotificationMessage:
        string | undefined =
            context.notificationMessage ??
            message;

    let classifiedDisableRequired:
        boolean =
            context.disableRequired ??
            false;

    let classifiedDisableMode:
        "app-fatal" | undefined =
            context.disableMode;

    const classifiedAction:
        ApplicationMessageAction | undefined =
            context.action;

    switch (
        true
    ) {

        // =====================================================
        // Artifact Store Not Open
        // =====================================================

        case message.includes(
            "Artifact store is not open"
        ):

            classifiedDisposition =
                "Message";

            classifiedNotificationTitle =
                "Project Dashboard - Local application storage is unavailable. Refresh your browser to try again.";

            classifiedNotificationMessage =
                message;

            classifiedDisableRequired =
                true;

            classifiedDisableMode =
                "app-fatal";

            break;


        // =====================================================
        // User Access - 404 - Inactive Account
        // =====================================================

        case context.operation ===
                "GetUserAccessFromAzure" &&
            status ===
                404:

            classifiedDisposition =
                "Message";

            classifiedNotificationTitle =
                "Project Dashboard - Inactive Account. Contact your administrator for access.";

            classifiedNotificationMessage =
                undefined;

            classifiedDisableRequired =
                true;

            classifiedDisableMode =
                "app-fatal";

            break;


        // =====================================================
        // User Access - 400 - Invalid Request
        // =====================================================

        case context.operation ===
                "GetUserAccessFromAzure" &&
            status ===
                400:

            classifiedDisposition =
                "Message";

            classifiedNotificationTitle =
                "Project Dashboard - Unable to validate your account information.";

            classifiedNotificationMessage =
                "Azure returned a 400 while validating account information.";

            classifiedDisableRequired =
                true;

            classifiedDisableMode =
                "app-fatal";

            break;


        // =====================================================
        // User Access - 5xx - Azure / Server Failure
        //
        // Structured >= 500, not a literal === 500 check, per the
        // established Azure ServerError semantics
        // (resolveAzureErrorType in helpers/azure.ts already
        // treats any status >= 500 - other than the explicit
        // 502/503/504 ServiceUnavailable cases - as ServerError).
        // =====================================================

        case context.operation ===
                "GetUserAccessFromAzure" &&
            status !==
                null &&
            status >=
                500:

            classifiedDisposition =
                "Message";

            classifiedNotificationTitle =
                "Project Dashboard - Unable to verify your account. Please try again.";

            classifiedNotificationMessage =
                "Azure returned a 500 while verifying account information.";

            classifiedDisableRequired =
                true;

            classifiedDisableMode =
                "app-fatal";

            break;


        // =====================================================
        // User Access - Catch All
        //
        // Still scoped to this operation only - an unrecognized
        // status from GetUserAccessFromAzure falls here, not a
        // global catch-all for every unclassified application
        // error.
        // =====================================================

        case context.operation ===
            "GetUserAccessFromAzure":

            classifiedDisposition =
                "Message";

            classifiedNotificationTitle =
                "Project Dashboard - An unexpected error occurred while verifying your account. Refresh your browser to try again.";

            classifiedNotificationMessage =
                message;

            classifiedDisableRequired =
                true;

            classifiedDisableMode =
                "app-fatal";

            break;


        // =====================================================
        // Unclassified
        //
        // No known condition matched. Resolved fields already
        // default to the caller-supplied context values (or the
        // pre-Pass-2 generic defaults) set above - nothing further
        // to do here.
        // =====================================================

        default:

            break;

    }


    // =====================================================
    // Resolve Disposition
    //
    // An explicit context.disposition always wins over
    // classification - this is what lets helpers/azure.ts's
    // existing consumer pin "Throw" (or, previously, "None") and
    // keep working unchanged even though its own
    // GetUserAccessFromAzure failures would otherwise structurally
    // match the User Access classification family above.
    // =====================================================

    const disposition:
        ApplicationErrorDisposition =
            context.disposition ??
            classifiedDisposition;


    // =====================================================
    // Stage 3 - Build Result
    //
    // Exactly one ApplicationErrorResult - the authoritative
    // description of what occurred, used by the log below and by
    // the Stage 4 disposition router. Nothing downstream
    // reclassifies the error.
    // =====================================================

    const normalizedError:
        ApplicationErrorResult = {

            source:
                context.source,

            operation:
                context.operation,

            message:
                message,

            status:
                status,

            errorType:
                errorType,

            timestamp:
                new Date().toISOString(),

            disposition:
                disposition,

            notificationTitle:
                classifiedNotificationTitle,

            notificationMessage:
                classifiedNotificationMessage,

            disableRequired:
                classifiedDisableRequired,

            disableMode:
                classifiedDisableMode,

            action:
                classifiedAction,

            originalError:
                error,

            context:
                context

        };


    // =====================================================
    // Log Normalized Error
    //
    // Unchanged since Pass 1 - logged exactly once, regardless of
    // disposition or whether Stage 4 below invokes any
    // communication or throws.
    // =====================================================

    console.error(
        "[ProjectDashboard] Application Error:",
        normalizedError
    );


    // =====================================================
    // Stage 4 - Disposition Router
    //
    // Answers "what happens to this resolved error?" only - no
    // status/errorType classification happens here.
    //
    // Every throw below is terminal - none of them call
    // processApplicationError again. See the root-throw-authority
    // note on this function.
    // =====================================================

    switch (
        disposition
    ) {

        // =====================================================
        // None
        //
        // Normalize, classify, build, log - no communication, no
        // throw. Distinct from "Throw": None returns the result;
        // Throw never returns.
        // =====================================================

        case "None":

            break;


        // =====================================================
        // Throw
        //
        // Preserves the ORIGINAL thrown object whenever it is
        // already an Error, so status/errorType/stack/name and any
        // other structured information (e.g. AzureArtifactError's
        // own fields) survive for the next application boundary.
        // Only when the original thrown value was not an Error at
        // all is a new Error constructed, from the already-resolved
        // normalized message.
        // =====================================================

        case "Throw":

            if (
                normalizedError.originalError instanceof
                    Error
            ) {

                throw normalizedError.originalError;

            }

            throw new Error(
                normalizedError.message
            );


        // =====================================================
        // Message
        //
        // A resolved Message disposition with no showMessage
        // dependency supplied is a configuration/programming
        // defect, not a silently-swallowed condition - it throws a
        // plain Error here, directly, matching this repository's
        // existing convention for internal precondition failures
        // (e.g. processBuildRegistryKeys' "Customer Master
        // Registry is not available"). This is a root-handler
        // throw - it does not call processApplicationError again.
        // =====================================================

        case "Message":

            if (
                !communication?.showMessage
            ) {

                throw new Error(
                    `[ProjectDashboard] processApplicationError: disposition is "Message" but no showMessage communication dependency was supplied (operation: ${normalizedError.operation}).`
                );

            }

            communication.showMessage(
                true,
                normalizedError.notificationTitle,
                normalizedError.notificationMessage,
                normalizedError.disableRequired,
                normalizedError.disableMode,
                normalizedError.action
            );

            break;


        // =====================================================
        // Notification
        //
        // Same root-handler-throw reasoning as Message above.
        // =====================================================

        case "Notification":

            if (
                !communication?.showNotification
            ) {

                throw new Error(
                    `[ProjectDashboard] processApplicationError: disposition is "Notification" but no showNotification communication dependency was supplied (operation: ${normalizedError.operation}).`
                );

            }

            communication.showNotification(
                normalizedError.notificationTitle,
                normalizedError.notificationMessage ??
                    normalizedError.message
            );

            break;


        // =====================================================
        // InDropdown
        //
        // Reserved - explicitly recognized, intentionally a no-op.
        // No operational renderer exists yet (confirmed by
        // repo-wide audit), and inventing one merely to make this
        // switch look complete remains out of scope.
        // =====================================================

        case "InDropdown":

            break;

    }


    // =====================================================
    // Return Result
    //
    // Reached only by non-throwing dispositions (None, Message,
    // Notification, InDropdown) - "Throw" always exits above.
    // =====================================================

    return normalizedError;

}
