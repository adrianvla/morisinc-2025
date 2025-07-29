/**
 * @module typings/core
 */
import { ITransitionData, ITransitionPage, IViewData } from './index';
export type HooksBarba = 'ready' | 'page' | 'reset' | 'currentAdded' | 'currentRemoved' | 'nextAdded' | 'nextRemoved';
export type HooksOnce = 'beforeOnce' | 'once' | 'afterOnce';
export type HooksPage = 'before' | 'beforeLeave' | 'leave' | 'afterLeave' | 'beforeEnter' | 'enter' | 'afterEnter' | 'after';
export type HooksBefore = 'beforeOnce' | 'beforeLeave' | 'beforeEnter';
export type HooksAfter = 'afterOnce' | 'afterLeave' | 'afterEnter';
export type HooksTransition = HooksOnce | HooksPage;
export type HooksView = HooksBefore | HooksAfter;
export type HooksAll = HooksBarba | HooksTransition;
export type HooksTransitionMap = {
    [key in HooksTransition]?: any;
};
export type HookFunction = (data?: ITransitionData | IViewData, t?: ITransitionPage) => Promise<void> | void;
export declare class HookMethods {
    before: (fn: HookFunction, ctx?: any) => void;
    beforeLeave: (fn: HookFunction, ctx?: any) => void;
    leave: (fn: HookFunction, ctx?: any) => void;
    afterLeave: (fn: HookFunction, ctx?: any) => void;
    beforeEnter: (fn: HookFunction, ctx?: any) => void;
    enter: (fn: HookFunction, ctx?: any) => void;
    afterEnter: (fn: HookFunction, ctx?: any) => void;
    after: (fn: HookFunction, ctx?: any) => void;
}
