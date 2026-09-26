// =====================================================
// GetRoles - SWA rolesSource Admission Function
//
// Invoked by Azure Static Web Apps after each successful
// Microsoft Entra sign-in (staticwebapp.config.json
// auth.rolesSource). Not reachable by external HTTP requests.
//
// Grants the "activemanager" role only when Microsoft Graph
// confirms the signed-in user is a member (transitive) of the
// admission security group configured in the
// ACTIVEMANAGER_ADMISSION_GROUP_ID application setting.
//
// Admission only - Project Dashboard authorization
// (UserGlobalAccess / user_master) remains application-owned.
//
// FAIL CLOSED: any missing input, Graph error, timeout or
// unexpected response returns no roles.
// =====================================================

const ADMISSION_ROLE = "activemanager";

const GRAPH_CHECK_MEMBER_GROUPS_URL =
    "https://graph.microsoft.com/v1.0/me/checkMemberGroups";

const GRAPH_TIMEOUT_MS = 10000;

const GUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function (context, req) {

    const roles =
        await resolveRoles(
            context,
            req
        );

    context.res = {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: {
            roles
        }
    };

};

async function resolveRoles(context, req) {

    try {

        // =====================================================
        // 1 - Validate rolesSource Invocation Shape
        // =====================================================

        const body =
            req && req.body;

        if (
            !body ||
            typeof body !== "object" ||
            body.identityProvider !== "aad"
        ) {

            context.log.warn("[GetRoles] Denied: unexpected invocation shape.");

            return [];

        }

        const accessToken =
            body.accessToken;

        if (
            typeof accessToken !== "string" ||
            accessToken.length === 0
        ) {

            context.log.warn("[GetRoles] Denied: no access token supplied.");

            return [];

        }

        // =====================================================
        // 2 - Admission Group Configuration
        // =====================================================

        const admissionGroupId =
            (process.env.ACTIVEMANAGER_ADMISSION_GROUP_ID || "").trim();

        if (
            !GUID_PATTERN.test(
                admissionGroupId
            )
        ) {

            context.log.error("[GetRoles] Denied: admission group setting missing or invalid.");

            return [];

        }

        // =====================================================
        // 3 - Microsoft Graph Membership Check (transitive)
        // =====================================================

        const response =
            await fetch(
                GRAPH_CHECK_MEMBER_GROUPS_URL,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(
                        {
                            groupIds: [
                                admissionGroupId
                            ]
                        }
                    ),
                    signal: AbortSignal.timeout(
                        GRAPH_TIMEOUT_MS
                    )
                }
            );

        if (
            !response.ok
        ) {

            context.log.warn(`[GetRoles] Denied: Graph checkMemberGroups returned HTTP ${response.status}.`);

            return [];

        }

        const result =
            await response.json();

        const isMember =
            Array.isArray(result && result.value) &&
            result.value.some(
                groupId =>
                    typeof groupId === "string" &&
                    groupId.toLowerCase() ===
                        admissionGroupId.toLowerCase()
            );

        context.log(`[GetRoles] Admission ${isMember ? "granted" : "not granted"}.`);

        return isMember
            ? [ADMISSION_ROLE]
            : [];

    }
    catch (error) {

        const reason =
            error && error.name
                ? error.name
                : "Error";

        context.log.error(`[GetRoles] Denied: ${reason} during admission check.`);

        return [];

    }

}
