// =====================================================
// TEMPORARY - Migration Pass 3 Diagnostic Probe
//
// Proves: SWA authentication -> authenticated email ->
// existing helpers/azure.ts getUserAccessFromAzure() ->
// existing Function App -> UserGlobalAccess response.
//
// Not application code. Remove when the standalone startup
// lifecycle replaces it.
// =====================================================

import {
    AzureArtifactError,
    getUserAccessFromAzure
} from "../helpers/azure";


// =====================================================
// SWA Client Principal
// =====================================================

interface SwaClientPrincipal {
    identityProvider: string;
    userDetails: string;
}


// =====================================================
// Run Access Probe
// =====================================================

export async function runAccessProbe(
    container:
        HTMLElement
): Promise<void> {

    const log =
        buildProbeLog(
            container
        );

    log(
        "Origin",
        window.location.origin
    );

    // =====================================================
    // 1 - Resolve SWA Authentication
    // =====================================================

    let email:
        string;

    try {

        const response =
            await fetch(
                "/.auth/me",
                {
                    cache:
                        "no-store"
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) ??
            "";

        if (
            !response.ok ||
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                `/.auth/me did not return JSON (HTTP ${response.status}, ${contentType || "no content-type"}). Not running behind the SWA auth platform.`
            );

        }

        const authContext =
            await response.json() as {
                clientPrincipal:
                    SwaClientPrincipal | null
            };

        const principal =
            authContext.clientPrincipal;

        if (
            !principal ||
            !principal.userDetails
        ) {

            throw new Error(
                "No authenticated client principal. Sign in via /.auth/login/aad and reload."
            );

        }

        email =
            principal.userDetails
                .trim()
                .toLowerCase();

        log(
            "Authentication",
            "RESOLVED",
            "pass"
        );

        log(
            "Identity provider",
            principal.identityProvider
        );

        log(
            "Authenticated email",
            email
        );

    }
    catch (
        error
    ) {

        log(
            "Authentication",
            `FAILED - ${describeError(error)}`,
            "fail"
        );

        return;

    }

    // =====================================================
    // 2 - Existing Azure Helper - User Global Access
    // =====================================================

    const startedAt =
        performance.now();

    log(
        "Azure access request",
        "STARTED - getUserAccessFromAzure(email)"
    );

    try {

        const accessResult =
            await getUserAccessFromAzure(
                email
            );

        const elapsed =
            Math.round(
                performance.now() -
                    startedAt
            );

        log(
            "Azure access request",
            `SUCCEEDED (${elapsed} ms)`,
            "pass"
        );

        // =====================================================
        // 3 - Safe Result Summary
        // =====================================================

        if (
            !accessResult
        ) {

            log(
                "Access result",
                "Valid response - no user record returned for this email",
                "fail"
            );

            return;

        }

        const globalAccessKeys =
            Array.isArray(
                accessResult.globalAccessKeys
            )
                ? accessResult.globalAccessKeys.filter(
                    key =>
                        key.trim().length >
                            0
                )
                : [];

        log(
            "Response shape",
            `object { ${Object.keys(accessResult).join(", ")} }`
        );

        log(
            "Display name",
            String(
                accessResult.displayName ??
                    "(none)"
            )
        );

        log(
            "Returned email matches",
            String(
                (accessResult.email ?? "").trim().toLowerCase() ===
                    email
            )
        );

        log(
            "isActive",
            String(
                accessResult.isActive
            ),
            accessResult.isActive
                ? "pass"
                : "fail"
        );

        log(
            "Global access keys",
            `${globalAccessKeys.length} non-empty`,
            globalAccessKeys.length >
                0
                ? "pass"
                : "fail"
        );

        log(
            "User profile path present",
            String(
                Boolean(
                    accessResult.userProfilePath
                )
            )
        );

    }
    catch (
        error
    ) {

        const elapsed =
            Math.round(
                performance.now() -
                    startedAt
            );

        log(
            "Azure access request",
            `FAILED (${elapsed} ms)`,
            "fail"
        );

        if (
            error instanceof
                AzureArtifactError
        ) {

            log(
                "Error type",
                error.errorType
            );

            log(
                "HTTP status",
                error.status === null
                    ? "none (request did not complete - CORS/network; see browser console)"
                    : String(
                        error.status
                    )
            );

        }

        log(
            "Error",
            describeError(
                error
            )
        );

    }

}


// =====================================================
// Build Probe Log
// =====================================================

function buildProbeLog(
    container:
        HTMLElement
): (
    label: string,
    value: string,
    outcome?: "pass" | "fail"
) => void {

    const ctrProbe =
        document.createElement(
            "div"
        );

    ctrProbe.style.cssText =
        "padding:16px;overflow:auto;font:14px/1.5 system-ui,sans-serif;";

    const heading =
        document.createElement(
            "h1"
        );

    heading.style.cssText =
        "font-size:18px;margin:0 0 12px;";

    heading.textContent =
        "Project Dashboard - Pass 3 Access Probe (temporary)";

    const list =
        document.createElement(
            "dl"
        );

    list.style.cssText =
        "display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:0;";

    ctrProbe.append(
        heading,
        list
    );

    container.replaceChildren(
        ctrProbe
    );

    return (
        label,
        value,
        outcome
    ) => {

        const term =
            document.createElement(
                "dt"
            );

        term.style.fontWeight =
            "600";

        term.textContent =
            label;

        const detail =
            document.createElement(
                "dd"
            );

        detail.style.margin =
            "0";

        detail.style.overflowWrap =
            "anywhere";

        if (
            outcome
        ) {

            detail.style.color =
                outcome === "pass"
                    ? "#1a7f37"
                    : "#cf222e";

        }

        detail.textContent =
            value;

        list.append(
            term,
            detail
        );

    };

}


// =====================================================
// Describe Error
// =====================================================

function describeError(
    error:
        unknown
): string {

    return error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(
            error
        );

}
