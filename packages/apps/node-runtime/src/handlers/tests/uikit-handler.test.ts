import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import jsonrpc from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import handleUIKitInteraction, {
	UIKitActionButtonInteractionContext,
	UIKitBlockInteractionContext,
	UIKitLivechatBlockInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '../uikit/handler';

describe('handlers > uikit', () => {
	const mockApp = {
		getID: (): string => 'appId',
		executeBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewSubmitHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewClosedHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeActionButtonHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeLivechatBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
	};

	beforeEach(() => {
		AppObjectRegistry.set('app', mockApp);
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('successfully handles a call for "executeBlockActionHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeBlockActionHandler', [
			{
				actionId: 'actionId',
				blockId: 'blockId',
				value: 'value',
				viewId: 'viewId',
			},
		]);

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitBlockInteractionContext, `Expected instance of ${UIKitBlockInteractionContext.name}`);
	});

	it('successfully handles a call for "executeViewSubmitHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeViewSubmitHandler', [
			{
				viewId: 'viewId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
				values: {},
			},
		]);

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitViewSubmitInteractionContext, `Expected instance of ${UIKitViewSubmitInteractionContext.name}`);
	});

	it('successfully handles a call for "executeViewClosedHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeViewClosedHandler', [
			{
				viewId: 'viewId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
			},
		]);

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitViewCloseInteractionContext, `Expected instance of ${UIKitViewCloseInteractionContext.name}`);
	});

	it('successfully handles a call for "executeActionButtonHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeActionButtonHandler', [
			{
				actionId: 'actionId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
			},
		]);

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitActionButtonInteractionContext, `Expected instance of ${UIKitActionButtonInteractionContext.name}`);
	});

	it('successfully handles a call for "executeLivechatBlockActionHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeLivechatBlockActionHandler', [
			{
				actionId: 'actionId',
				appId: 'appId',
				userId: 'userId',
				visitor: {},
				isAppUser: true,
				room: {},
			},
		]);

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitLivechatBlockInteractionContext, `Expected instance of ${UIKitLivechatBlockInteractionContext.name}`);
	});
});
