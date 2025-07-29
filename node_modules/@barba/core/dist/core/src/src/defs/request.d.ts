/**
 * @module typings/core
 */
import { IUrlFull, Trigger } from './index';
export interface IResponse {
    html: string;
    url: IUrlFull;
}
export type RequestError = (url: string, errorOrResponse: RequestErrorOrResponse) => boolean;
export type RequestCustomError = (trigger: Trigger, action: string, url: string, response: RequestErrorOrResponse) => boolean;
export interface IXhrResponse {
    status: number;
    statusText: string;
}
export type RequestErrorOrResponse = Error | IXhrResponse;
