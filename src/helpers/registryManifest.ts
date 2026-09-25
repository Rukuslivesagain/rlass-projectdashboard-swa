import {
    CustomerMasterRegistry,
    ResolvedRegistryDefinition
} from "../models/registries";

// =====================================================
// Registry Manifest Resolver
//
// Registry Architecture Refactor - Stage B.
//
// Sole owner of CustomerMasterRegistry.registries[] build
// string / token interpretation. Not wired into Registry
// Sync, startup, or IndexedDB behavior yet - see later stages.
// =====================================================

// =====================================================
// Unresolved Token Pattern
//
// Non-global by design - RegExp.prototype.test() on a global
// (/g) pattern retains lastIndex across calls, which would
// silently corrupt repeated .test() calls against different
// candidate strings below.
// =====================================================

const unresolvedRegistryTokenPattern =
    /\{[^{}]+\}/;

// =====================================================
// Resolve Customer Registry Manifest
//
// Converts CustomerMasterRegistry.registries[] build-string
// definitions into concrete, fully resolved registry entries.
//
// - Only registrySync === true definitions are resolved.
// - Scope (Customer-level vs Location-scoped) is determined by
//   whether a definition's registryKey / registryPath contains
//   the {locationId} token - never by registryType.
// - Location-scoped definitions expand once per active Location
//   (customerMasterRegistry.locations[], in array order).
// - Manifest order is preserved; Location expansion follows
//   customerMasterRegistry.locations[] order.
// - A resolved entry containing any remaining {...} token is a
//   manifest contract violation and throws, rather than being
//   silently returned.
// - Two definitions resolving to the same registryKey is a
//   manifest contract violation and throws, rather than
//   silently deduplicating.
// =====================================================

export function processResolveCustomerRegistryManifest(
    customerMasterRegistry:
        CustomerMasterRegistry
):
ResolvedRegistryDefinition[] {

    const definitions =
        customerMasterRegistry.registries;

    // =====================================================
    // Missing / Empty Manifest
    //
    // Customer Master V11 is authoritative. An empty or
    // missing manifest yields no resolved entries - never a
    // reconstructed hardcoded registry list.
    // =====================================================

    if (
        !Array.isArray(
            definitions
        ) ||
        definitions.length ===
            0
    ) {

        console.warn(
            "[ProjectDashboard] Customer Master registries[] is missing or empty - nothing to resolve"
        );

        return [];

    }

    const resolved:
        ResolvedRegistryDefinition[] =
            [];

    const seenRegistryKeys =
        new Set<string>();

    for (
        const definition of
            definitions
    ) {

        // =====================================================
        // registrySync Filtering
        // =====================================================

        if (
            !definition.registrySync
        ) {

            continue;

        }

        // =====================================================
        // Determine Scope From Tokens, Not registryType
        // =====================================================

        const isLocationScoped =
            definition.registryKey.includes(
                "{locationId}"
            ) ||
            definition.registryPath.includes(
                "{locationId}"
            );

        const candidates:
            {
                registryKey:
                    string;

                registryPath:
                    string;

                locationId?:
                    string;
            }[] =
                [];

        if (
            isLocationScoped
        ) {

            // =====================================================
            // Location-Scoped - Expand Once Per Active Location
            // =====================================================

            for (
                const location of
                    customerMasterRegistry.locations
            ) {

                if (
                    !location.active
                ) {

                    continue;

                }

                candidates.push(
                    {
                        registryKey:
                            definition.registryKey
                                .replace(
                                    "{customerId}",
                                    customerMasterRegistry.customerId
                                )
                                .replace(
                                    "{locationId}",
                                    location.locationId
                                ),

                        registryPath:
                            definition.registryPath
                                .replace(
                                    "{customerId}",
                                    customerMasterRegistry.customerId
                                )
                                .replace(
                                    "{locationId}",
                                    location.locationId
                                ),

                        locationId:
                            location.locationId
                    }
                );

            }

        }
        else {

            // =====================================================
            // Customer-Scoped - Resolves Once
            // =====================================================

            candidates.push(
                {
                    registryKey:
                        definition.registryKey
                            .replace(
                                "{customerId}",
                                customerMasterRegistry.customerId
                            ),

                    registryPath:
                        definition.registryPath
                            .replace(
                                "{customerId}",
                                customerMasterRegistry.customerId
                            )
                }
            );

        }

        // =====================================================
        // Validate And Collect Each Candidate
        // =====================================================

        for (
            const candidate of
                candidates
        ) {

            if (
                unresolvedRegistryTokenPattern.test(
                    candidate.registryKey
                ) ||
                unresolvedRegistryTokenPattern.test(
                    candidate.registryPath
                )
            ) {

                throw new Error(
                    `[ProjectDashboard] Unresolved registry manifest token: ${candidate.registryKey} / ${candidate.registryPath}`
                );

            }

            if (
                seenRegistryKeys.has(
                    candidate.registryKey
                )
            ) {

                throw new Error(
                    `[ProjectDashboard] Duplicate resolved registry key: ${candidate.registryKey}`
                );

            }

            seenRegistryKeys.add(
                candidate.registryKey
            );

            resolved.push(
                {
                    registryType:
                        definition.registryType,

                    registryKey:
                        candidate.registryKey,

                    registryPath:
                        candidate.registryPath,

                    locationId:
                        candidate.locationId
                }
            );

        }

    }

    return resolved;

}
