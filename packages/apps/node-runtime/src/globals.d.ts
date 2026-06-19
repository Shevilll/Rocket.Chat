/**
 * Ambient declarations for Web-compatible globals that Node.js 18+ provides
 * but are not included in @types/node.
 */

interface IPromiseRejectionEventInit extends EventInit {
	promise: Promise<unknown>;
	reason?: unknown;
}

declare class PromiseRejectionEvent extends Event {
	readonly promise: Promise<unknown>;

	readonly reason: unknown;

	constructor(type: string, eventInitDict: IPromiseRejectionEventInit);
}

interface IErrorEventInit extends EventInit {
	message?: string;
	filename?: string;
	lineno?: number;
	colno?: number;
	error?: unknown;
}

declare class ErrorEvent extends Event {
	readonly message: string;

	readonly filename: string;

	readonly lineno: number;

	readonly colno: number;

	readonly error: unknown;

	constructor(type: string, eventInitDict?: IErrorEventInit);
}

declare function addEventListener(
	type: string,
	listener: EventListenerOrEventListenerObject,
	options?: boolean | AddEventListenerOptions,
): void;
