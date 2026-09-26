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
}


// =====================================================
// Resolve Authenticated Email
//
// Returns the normalized email of the authenticated SWA
// principal, or null when no user is signed in. Throws when
// /.auth/me cannot be read or returns an unexpected shape.
// =====================================================

async function resolveAuthenticatedEmail(): Promise<string | null> {

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

    return userDetails
        .trim()
        .toLowerCase();

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

    let authenticatedEmail:
        string | null;

    try {

        authenticatedEmail =
            await resolveAuthenticatedEmail();

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
        !authenticatedEmail
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

    const projectDashboard =
        new ProjectDashboard();

    projectDashboard.initialize(
        container,
        authenticatedEmail
    );

    projectDashboard.start();

}

void bootstrap();
