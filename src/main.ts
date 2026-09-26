// =====================================================
// Project Dashboard - Standalone Bootstrap
//
// Browser host entry point. Resolves the authenticated SWA
// user and hands the email to ProjectDashboard, which owns
// every application responsibility from startup onward
// (user access, version gate, registries, routing, errors).
// =====================================================

import "./css/host.css";

import {
    ProjectDashboard
} from "./projectDashboard";


// =====================================================
// SWA Client Principal
// =====================================================

interface SwaClientPrincipal {
    identityProvider: string;
    userDetails: string;
    userRoles: string[];
}


// =====================================================
// Admission Role
//
// Assigned by the SWA rolesSource function (api/GetRoles) to
// members of the admission security group. SWA route rules
// (staticwebapp.config.json) are the primary enforcement; the
// check in bootstrap() is defense in depth only.
// =====================================================

const ADMISSION_ROLE = "activemanager";


// =====================================================
// Resolve Authenticated User
//
// Returns the normalized email and SWA roles of the
// authenticated principal, or null when no user is signed in.
// Throws when /.auth/me cannot be read or returns an
// unexpected shape.
// =====================================================

async function resolveAuthenticatedUser(): Promise<{
    email: string;
    userRoles: string[];
} | null> {

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
            `/.auth/me did not return JSON (HTTP ${response.status}, ${contentType || "no content-type"}).`
        );

    }

    const authContext =
        await response.json() as {
            clientPrincipal:
                SwaClientPrincipal | null
        };

    const userDetails =
        authContext?.clientPrincipal?.userDetails;

    if (
        typeof userDetails !== "string" ||
        userDetails.trim().length === 0
    ) {

        return null;

    }

    const userRoles =
        authContext?.clientPrincipal?.userRoles;

    return {
        email:
            userDetails
                .trim()
                .toLowerCase(),
        userRoles:
            Array.isArray(userRoles)
                ? userRoles
                : []
    };

}


// =====================================================
// Show Host Message
//
// Pre-application messages only - shown when
// ProjectDashboard cannot be initialized.
// =====================================================

function showHostMessage(
    container:
        HTMLElement,
    message:
        string,
    link?:
        {
            text: string;
            href: string;
        }
): void {

    const ctrMessage =
        document.createElement(
            "div"
        );

    ctrMessage.style.cssText =
        "padding:24px;font:14px/1.5 system-ui,sans-serif;";

    const text =
        document.createElement(
            "p"
        );

    text.textContent =
        message;

    ctrMessage.append(
        text
    );

    if (
        link
    ) {

        const anchor =
            document.createElement(
                "a"
            );

        anchor.href =
            link.href;

        anchor.textContent =
            link.text;

        ctrMessage.append(
            anchor
        );

    }

    container.replaceChildren(
        ctrMessage
    );

}


// =====================================================
// Bootstrap
// =====================================================

async function bootstrap(): Promise<void> {

    const container =
        document.querySelector<HTMLDivElement>(
            "#app"
        );

    if (
        !container
    ) {

        throw new Error(
            "[ProjectDashboard] Application container #app was not found."
        );

    }

    let authenticatedUser:
        Awaited<ReturnType<typeof resolveAuthenticatedUser>>;

    try {

        authenticatedUser =
            await resolveAuthenticatedUser();

    }
    catch (
        error
    ) {

        console.error(
            "[ProjectDashboard] Unable to resolve authentication:",
            error
        );

        showHostMessage(
            container,
            "Project Dashboard - Unable to verify your sign-in. Refresh your browser to try again."
        );

        return;

    }

    if (
        !authenticatedUser
    ) {

        showHostMessage(
            container,
            "Project Dashboard - Sign-in is required.",
            {
                text:
                    "Sign in",
                href:
                    "/.auth/login/aad"
            }
        );

        return;

    }

    // =====================================================
    // Admission - Defense In Depth
    //
    // SWA route rules normally prevent a user without the
    // admission role from receiving this bundle at all.
    // =====================================================

    if (
        !authenticatedUser.userRoles.includes(
            ADMISSION_ROLE
        )
    ) {

        showHostMessage(
            container,
            "Project Dashboard - Access Request Required. You are signed in, but your account is not currently authorized to enter ActiveManager.",
            {
                text:
                    "Sign out",
                href:
                    "/.auth/logout"
            }
        );

        return;

    }

    const projectDashboard =
        new ProjectDashboard();

    projectDashboard.initialize(
        container,
        authenticatedUser.email
    );

    projectDashboard.start();

}

void bootstrap();
