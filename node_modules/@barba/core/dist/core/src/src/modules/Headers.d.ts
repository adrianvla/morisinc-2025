/**
 * @barba/core/modules/headers
 * <br><br>
 * ## Manage request Headers.
 *
 * @module core/modules/headers
 * @preferred
 */
/***/
import { HeaderList, IHeaderData } from '../defs';
export declare class Headers {
    private _list;
    /**
     * Set a new header
     */
    set(name: string, value: string): IHeaderData;
    /**
     * Get a specific header
     */
    get(name: string): string;
    /**
     * Get all headers
     */
    all(): HeaderList;
    /**
     * Check if header exists
     */
    has(name: string): boolean;
    /**
     * Delete a header
     */
    delete(name: string): boolean;
    /**
     * Clear all headers
     */
    clear(): void;
}
