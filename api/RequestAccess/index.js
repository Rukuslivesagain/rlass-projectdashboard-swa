// =====================================================
// RequestAccess - Authenticated Identity Boundary
//
// POST /api/request-access
//
// Proves the server-side identity boundary for access
// requests. The caller's identity comes ONLY from the
// trusted SWA principal (x-ms-client-principal, injected by
// Azure Static Web Apps) - never from the request body.
// The browser supplies only requestedEnvironment.
//
// TEMPORARY: returns a diagnostic "Validated" response. No
// FAP call, no registry write, no email - future passes.
// =====================================================

const ALLOWED_METHOD = "POST";

const REQUESTED_ENVIRONMENTS = [
    "Development"
];

module.exports = async function (context, req) {

    try {

        // =====================================================
        // 1 - Method
        // =====================================================

        if (
            (req.method || "").toUpperCase() !== ALLOWED_METHOD
        ) {

            respond(context, 405, { error: "Method not allowed." }, { "Allow": ALLOWED_METHOD });

            return;

        }

        // =====================================================
        // 2 - Trusted SWA Principal
        // =====================================================

        const principalResult =
            readClientPrincipal(
                req.headers && req.headers["x-ms-client-principal"]
            );

        if (
            !principalResult.ok
        ) {

            context.log.warn(`[RequestAccess] Rejected: ${principalResult.reason}.`);

            respond(context, principalResult.status, { error: principalResult.status === 401 ? "Authentication required." : "Not permitted." });

            return;

        }

        const principal =
            principalResult.principal;

        // =====================================================
        // 3 - Requested Environment (browser-supplied)
        // =====================================================

        const body =
            readJsonBody(
                req.body
            );

        const requestedEnvironment =
            body && body.requestedEnvironment;

        if (
            typeof requestedEnvironment !== "string" ||
            !REQUESTED_ENVIRONMENTS.includes(requestedEnvironment)
        ) {

            context.log.warn("[RequestAccess] Rejected: invalid or missing requestedEnvironment.");

            respond(context, 400, { error: "Invalid or missing requestedEnvironment." });

            return;

        }

        // =====================================================
        // 4 - Temporary Diagnostic Response
        // =====================================================

        context.log("[RequestAccess] Validated.");

        respond(
            context,
            200,
            {
                result: "Validated",
                requestedEnvironment,
                userEmail: principal.userDetails,
                identityProvider: principal.identityProvider,
                swaUserId: principal.userId
            }
        );

    }
    catch (error) {

        const reason =
            error && error.name
                ? error.name
                : "Error";

        context.log.error(`[RequestAccess] Failed: ${reason}.`);

        respond(context, 500, { error: "Request could not be processed." });

    }

};

// =====================================================
// Read Client Principal
//
// Decodes the Base64 x-ms-client-principal header set by
// Azure Static Web Apps and validates the fields this
// boundary relies on. Returns 401 when no usable principal
// exists, 403 when a principal exists but is not an
// authenticated Microsoft Entra (aad) user.
// =====================================================

function readClientPrincipal(header) {

    if (
        typeof header !== "string" ||
        header.length === 0
    ) {

        return { ok: false, status: 401, reason: "no client principal" };

    }

    let principal;

    try {

        principal =
            JSON.parse(
                Buffer.from(header, "base64").toString("utf8")
            );

    }
    catch {

        return { ok: false, status: 401, reason: "client principal could not be parsed" };

    }

    if (
        !principal ||
        typeof principal !== "object"
    ) {

        return { ok: false, status: 401, reason: "client principal is not an object" };

    }

    if (
        typeof principal.userId !== "string" ||
        principal.userId.trim().length === 0
    ) {

        return { ok: false, status: 401, reason: "client principal has no userId" };

    }

    if (
        typeof principal.userDetails !== "string" ||
        principal.userDetails.trim().length === 0
    ) {

        return { ok: false, status: 401, reason: "client principal has no userDetails" };

    }

    if (
        principal.identityProvider !== "aad"
    ) {

        return { ok: false, status: 403, reason: "identity provider is not aad" };

    }

    if (
        !Array.isArray(principal.userRoles) ||
        !principal.userRoles.includes("authenticated")
    ) {

        return { ok: false, status: 403, reason: "principal is not authenticated" };

    }

    return {
        ok: true,
        principal: {
            identityProvider: principal.identityProvider,
            userDetails: principal.userDetails.trim(),
            userId: principal.userId.trim()
        }
    };

}

// =====================================================
// Read JSON Body
// =====================================================

function readJsonBody(body) {

    if (
        body &&
        typeof body === "object"
    ) {

        return body;

    }

    if (
        typeof body === "string" &&
        body.length > 0
    ) {

        try {

            return JSON.parse(body);

        }
        catch {

            return null;

        }

    }

    return null;

}

// =====================================================
// Respond
// =====================================================

function respond(context, status, body, headers) {

    context.res = {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            ...(headers || {})
        },
        body
    };

}
