import { ethers } from 'ethers';

export class BlockchainUtils {
    /**
     * Converts a BigInt to a string representation
     * @param value The BigInt value to convert
     * @returns string representation of the BigInt
     */
    static bigIntToString(value: bigint): string {
        return value.toString();
    }

    /**
     * Converts a BigInt to a number with specified decimals
     * @param value The BigInt value to convert
     * @param decimals Number of decimals to consider
     * @returns number representation of the BigInt
     */
    static bigIntToNumber(value: bigint, decimals: number = 18): number {
        return Number(ethers.formatUnits(value, decimals));
    }

    /**
     * Converts a number to a BigInt with specified decimals
     * @param value The number to convert
     * @param decimals Number of decimals to consider
     * @returns BigInt representation of the number
     */
    static numberToBigInt(value: number, decimals: number = 18): bigint {
        return ethers.parseUnits(value.toString(), decimals);
    }

    /**
     * Converts a BigInt to a formatted string with specified decimals
     * @param value The BigInt value to convert
     * @param decimals Number of decimals to consider
     * @returns formatted string representation of the BigInt
     */
    static formatBigInt(value: bigint, decimals: number = 18): string {
        return ethers.formatUnits(value, decimals);
    }

    /**
     * Converts an array of BigInts to an array of strings
     * @param values Array of BigInt values
     * @returns Array of string representations
     */
    static bigIntArrayToStringArray(values: bigint[]): string[] {
        return values.map(value => value.toString());
    }

    /**
     * Converts an array of BigInts to an array of numbers with specified decimals
     * @param values Array of BigInt values
     * @param decimals Number of decimals to consider
     * @returns Array of number representations
     */
    static bigIntArrayToNumberArray(values: bigint[], decimals: number = 18): number[] {
        return values.map(value => this.bigIntToNumber(value, decimals));
    }

    /**
     * Safely converts any value to a string, handling BigInt and other special types
     * @param value Any value to convert
     * @returns string representation of the value
     */
    static safeToString(value: any): string {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, (key, val) => 
                typeof val === 'bigint' ? val.toString() : val
            );
        }
        return String(value);
    }

    /**
     * Converts an Ethereum address to a checksum address
     * @param address The address to convert
     * @returns checksum address
     */
    static toChecksumAddress(address: string): string {
        return ethers.getAddress(address);
    }

    /**
     * Validates if a string is a valid Ethereum address
     * @param address The address to validate
     * @returns boolean indicating if the address is valid
     */
    static isValidAddress(address: string): boolean {
        try {
            ethers.getAddress(address);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Converts a blockchain timestamp (BigInt) to a human-readable date string
     * @param timestamp The BigInt timestamp from blockchain
     * @param format Optional format string (default: ISO string)
     * @returns Formatted date string
     */
    static timestampToDate(timestamp: bigint, format: 'iso' | 'unix' | 'utc' = 'iso'): string {
        const date = new Date(Number(timestamp) * 1000); // Convert seconds to milliseconds
        
        switch (format) {
            case 'unix':
                return Math.floor(date.getTime() / 1000).toString();
            case 'utc':
                return date.toUTCString();
            default:
                return date.toISOString();
        }
    }

    /**
     * Converts a blockchain timestamp (BigInt) to a Date object
     * @param timestamp The BigInt timestamp from blockchain
     * @returns Date object
     */
    static timestampToDateObject(timestamp: bigint): Date {
        return new Date(Number(timestamp) * 1000);
    }

    /**
     * Checks if an address is the zero address
     * @param address The address to check
     * @returns boolean indicating if the address is the zero address
     */
    static isZeroAddress(address: string): boolean {
        return ethers.ZeroAddress === address;
    }
} 