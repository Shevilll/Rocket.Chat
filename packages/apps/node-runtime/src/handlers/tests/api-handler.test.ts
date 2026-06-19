import * as assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api/IApiEndpoint';
import { JsonRpcError } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import apiHandler from '../api-handler';
import { createMockRequest } from './helpers/mod';

describe('handlers > api', () => {
	const mockEndpoint: IApiEndpoint = {
		path: '/test',
		get: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('ok'),
		post: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('ok'),
		put: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => {
			throw new Error('Method execution error example');
		},
	};

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('api:/test', mockEndpoint);
	});

	it('correctly handles execution of an api endpoint method GET', async () => {
		const _spy = mock.method(mockEndpoint, 'get');

		const result = await apiHandler(createMockRequest({ method: 'api:/test:get', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, 'ok');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles execution of an api endpoint method POST', async () => {
		const _spy = mock.method(mockEndpoint, 'post');

		const result = await apiHandler(createMockRequest({ method: 'api:/test:post', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, 'ok');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles an error if the method not exists for the selected endpoint', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/test:delete`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `/test's delete not exists`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles an error if endpoint not exists', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/error:get`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `Endpoint /error not found`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles an error if the method execution fails', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/test:put`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `Method execution error example`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles dynamic paths with parameters (e.g., webhook/:event)', async () => {
		const mockDynamicEndpoint: IApiEndpoint = {
			path: 'webhook/:event',
			post: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('webhook handled'),
		};

		AppObjectRegistry.set('api:webhook/:event', mockDynamicEndpoint);

		const _spy = mock.method(mockDynamicEndpoint, 'post');

		const result = await apiHandler(createMockRequest({ method: 'api:webhook/:event:post', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, 'webhook handled');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles paths with multiple segments and colons', async () => {
		const mockComplexEndpoint: IApiEndpoint = {
			path: 'api/v1/:resource/:id',
			get: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('complex path'),
		};

		AppObjectRegistry.set('api:api/v1/:resource/:id', mockComplexEndpoint);

		const _spy = mock.method(mockComplexEndpoint, 'get');

		const result = await apiHandler(createMockRequest({ method: 'api:api/v1/:resource/:id:get', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, 'complex path');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);

		_spy.mock.restore();
	});
});
