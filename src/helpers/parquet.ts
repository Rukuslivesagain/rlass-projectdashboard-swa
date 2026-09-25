import {
    parquetReadObjects
} from "hyparquet";

import {
    parquetWriteBuffer
} from "hyparquet-writer";


// =====================================================
// Decode Parquet Artifact
// =====================================================

export async function decodeParquetArtifact(
    buffer:
        ArrayBuffer
): Promise<unknown[]> {

    return await parquetReadObjects({
        file:
            buffer
    });

}


// =====================================================
// Encode Parquet Artifact
// =====================================================

export function encodeParquetArtifact(
    columnData:
        {
            name:
                string;

            data:
                unknown[];

            type:
                "STRING" |
                "BOOLEAN" |
                "DOUBLE" |
                "TIMESTAMP";
        }[]
): ArrayBuffer {

    return parquetWriteBuffer({
        columnData:
            columnData
    });

}