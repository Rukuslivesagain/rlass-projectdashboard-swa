// =====================================================
// Project Dashboard Artifact Store
// =====================================================

// =====================================================
// Terminal Error
//
// Thrown only when a rejection is caused by the store
// having been terminally closed. Callers distinguish this
// case with `instanceof`, never by inspecting error text.
// =====================================================

export class ProjectDashboardArtifactStoreTerminalError
    extends Error {

    constructor() {

        super(
            "Artifact store is closed"
        );

        this.name =
            "ProjectDashboardArtifactStoreTerminalError";

    }

}

export class ProjectDashboardArtifactStore {

    private readonly databaseName =
        "ProjectDashboardArtifacts";

    private readonly storeName =
        "Artifacts";

    private database:
        IDBDatabase | null =
            null;

    private terminal = false;

    private openingOperation:
        Promise<void> | null =
            null;

    public async open(): Promise<void> {

        if (
            this.database
        ) {

            return;

        }

        if (
            this.terminal
        ) {

            throw new ProjectDashboardArtifactStoreTerminalError();

        }

        if (
            this.openingOperation
        ) {

            return this.openingOperation;

        }

        this.openingOperation =
            this.processOpenDatabase();

        try {

            await this.openingOperation;

        }
        finally {

            this.openingOperation =
                null;

        }

    }

    // =====================================================
    // Open Database
    //
    // Holds the newly opened connection locally until it can
    // be validated against terminal state. A store closed
    // while this open request was in flight must not adopt
    // the resulting connection - the connection is closed
    // immediately instead.
    // =====================================================

    private async processOpenDatabase(): Promise<void> {

        const database =
            await new Promise<IDBDatabase>(
                (
                    resolve,
                    reject
                ) => {

                    const request =
                        indexedDB.open(
                            this.databaseName,
                            1
                        );

                    request.onupgradeneeded =
                        () => {

                            const database =
                                request.result;

                            if (
                                !database.objectStoreNames.contains(
                                    this.storeName
                                )
                            ) {

                                database.createObjectStore(
                                    this.storeName
                                );

                            }

                        };

                    request.onsuccess =
                        () => {

                            resolve(
                                request.result
                            );

                        };

                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );

        if (
            this.terminal
        ) {

            database.close();

            throw new ProjectDashboardArtifactStoreTerminalError();

        }

        this.database =
            database;

    }

    // =====================================================
    // Close
    //
    // Terminal for this store instance. Closes the managed
    // IndexedDB connection without clearing, deleting, or
    // otherwise modifying persisted data. Idempotent, and
    // safe whether or not the store was ever opened. A later
    // open() on this same instance rejects deterministically;
    // a new store instance may still open the same persistent
    // database.
    // =====================================================

    public close(): void {

        this.terminal =
            true;

        if (
            this.database
        ) {

            this.database.close();

            this.database =
                null;

        }

    }

    public async has(
        key: string
    ): Promise<boolean> {

        if (
            !this.database
        ) {

            if (
                this.terminal
            ) {

                throw new ProjectDashboardArtifactStoreTerminalError();

            }

            throw new Error(
                "Artifact store is not open"
            );

        }

        return new Promise<boolean>(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    this.database!.transaction(
                        this.storeName,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.count(
                        key
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result >
                                0
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );

    }

    public async get(
        key: string
    ): Promise<ArrayBuffer | undefined> {

        if (
            !this.database
        ) {

            if (
                this.terminal
            ) {

                throw new ProjectDashboardArtifactStoreTerminalError();

            }

            throw new Error(
                "Artifact store is not open"
            );

        }

        return new Promise<ArrayBuffer | undefined>(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    this.database!.transaction(
                        this.storeName,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.get(
                        key
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result as
                                ArrayBuffer |
                                undefined
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );

    }

    public async put(
        key: string,
        buffer: ArrayBuffer
    ): Promise<void> {

        if (
            !this.database
        ) {

            if (
                this.terminal
            ) {

                throw new ProjectDashboardArtifactStoreTerminalError();

            }

            throw new Error(
                "Artifact store is not open"
            );

        }

        await new Promise<void>(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    this.database!.transaction(
                        this.storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                store.put(
                    buffer,
                    key
                );

                transaction.oncomplete =
                    () => {

                        resolve();

                    };

                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };

            }
        );

    }

    public async delete(
        key: string
    ): Promise<void> {

        if (
            !this.database
        ) {

            if (
                this.terminal
            ) {

                throw new ProjectDashboardArtifactStoreTerminalError();

            }

            throw new Error(
                "Artifact store is not open"
            );

        }

        await new Promise<void>(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    this.database!.transaction(
                        this.storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                store.delete(
                    key
                );

                transaction.oncomplete =
                    () => {

                        resolve();

                    };

                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };

            }
        );

    }

    // =====================================================
    // Get Keys By Prefix
    // =====================================================

    public async getKeysByPrefix(
        prefix:
            string
    ): Promise<string[]> {

        if (
            !this.database
        ) {

            if (
                this.terminal
            ) {

                throw new ProjectDashboardArtifactStoreTerminalError();

            }

            throw new Error(
                "Artifact store is not open"
            );

        }

        return new Promise<string[]>(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    this.database!.transaction(
                        this.storeName,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.getAllKeys();

                request.onsuccess =
                    () => {

                        const keys =
                            request.result
                                .map(
                                    key =>
                                        String(
                                            key
                                        )
                                )
                                .filter(
                                    key =>
                                        key.startsWith(
                                            prefix
                                        )
                                );

                        resolve(
                            keys
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );

    }

}