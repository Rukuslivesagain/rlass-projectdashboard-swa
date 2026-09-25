// =====================================================
// Column Data Store
// =====================================================

export type ColumnDataStore =
    Map<
        number,
        unknown
    >;


// =====================================================
// Data Store Collection
// =====================================================

export type DataStoreCollection =
    Map<
        string,
        ColumnDataStore
    >;


// =====================================================
// Planned Activity Data Stores
// =====================================================

export const plannedActivityDataStores:
    DataStoreCollection =
        new Map();


// =====================================================
// Current Activity Data Stores
// =====================================================

export const currentActivityDataStores:
    DataStoreCollection =
        new Map();


// =====================================================
// Planned Resource Data Stores
// =====================================================

export const plannedResourceDataStores:
    DataStoreCollection =
        new Map();


// =====================================================
// Current Resource Data Stores
// =====================================================

export const currentResourceDataStores:
    DataStoreCollection =
        new Map();

// =====================================================
// Build Column Data Stores
// =====================================================

export function processBuildColumnDataStores(
    rows:
        Record<string, unknown>[],
    fields:
        {
            canonicalName: string;
        }[],
    dataStores:
        DataStoreCollection
): void {

    // =====================================================
    // Clear Existing Collection
    // =====================================================

    dataStores.clear();

    // =====================================================
    // Build Registered Columns
    // =====================================================

    for (
        const field of fields
    ) {

        const columnDataStore:
            ColumnDataStore =
                new Map();

        // =====================================================
        // Populate Column
        // =====================================================

        for (
            let rowIndex = 0;
            rowIndex <
                rows.length;
            rowIndex++
        ) {

            columnDataStore.set(
                rowIndex,
                rows[
                    rowIndex
                ][
                    field.canonicalName
                ]
            );

        }

        // =====================================================
        // Store Column
        // =====================================================

        dataStores.set(
            field.canonicalName,
            columnDataStore
        );

    }

}