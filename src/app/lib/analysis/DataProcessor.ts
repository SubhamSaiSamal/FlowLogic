import Papa from 'papaparse';

export interface DataColumn {
    name: string;
    type: 'numerical' | 'categorical';
    data: (number | string)[];
    stats?: {
        min: number;
        max: number;
        mean: number;
        std: number;
    };
}

export interface ProcessedDataset {
    name: string;
    rowCount: number;
    columns: DataColumn[];
    raw: Record<string, any>[];
}

export class DataProcessor {
    static async parseFile(file: File): Promise<ProcessedDataset> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length && results.data.length === 0) {
                        reject(results.errors[0]);
                        return;
                    }
                    const processed = DataProcessor.processRawData(file.name, results.data as Record<string, any>[]);
                    resolve(processed);
                },
                error: (error) => reject(error)
            });
        });
    }

    private static processRawData(name: string, rawData: Record<string, any>[]): ProcessedDataset {
        if (rawData.length === 0) throw new Error("Dataset is empty");

        const keys = Object.keys(rawData[0]);
        const columns: DataColumn[] = keys.map(key => {
            const values = rawData.map(row => row[key]);
            const isNumerical = values.every(v => typeof v === 'number' || v === null || v === undefined);

            const col: DataColumn = {
                name: key,
                type: isNumerical ? 'numerical' : 'categorical',
                data: values
            };

            if (isNumerical) {
                const nums = values.filter(v => typeof v === 'number') as number[];
                if (nums.length > 0) {
                    const min = Math.min(...nums);
                    const max = Math.max(...nums);
                    const sum = nums.reduce((a, b) => a + b, 0);
                    const mean = sum / nums.length;
                    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
                    col.stats = {
                        min,
                        max,
                        mean,
                        std: Math.sqrt(variance)
                    };
                }
            }

            return col;
        });

        return {
            name,
            rowCount: rawData.length,
            columns,
            raw: rawData
        };
    }

    static getNumericalColumns(dataset: ProcessedDataset): DataColumn[] {
        return dataset.columns.filter(c => c.type === 'numerical');
    }

    static normalizeData(values: number[]): number[] {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        return values.map(v => (v - min) / range); // 0..1 scaling
    }
}
