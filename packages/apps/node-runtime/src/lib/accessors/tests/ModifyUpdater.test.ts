import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import jsonrpc from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import type { RoomBuilder } from '../builders/RoomBuilder';
import { ModifyUpdater } from '../modify/ModifyUpdater';

describe('ModifyUpdater', () => {
	let modifyUpdater: ModifyUpdater;

	const senderFn = (r: any) =>
		Promise.resolve({
			id: Math.random().toString(36).substring(2),
			jsonrpc: '2.0',
			result: structuredClone(r),
			serialize() {
				return JSON.stringify(this);
			},
		});

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
		modifyUpdater = new ModifyUpdater(senderFn);
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('correctly formats requests for the update message flow', async () => {
		const _spy = mock.method(modifyUpdater, 'senderFn' as any);

		const messageBuilder = await modifyUpdater.message('123', { id: '456' } as any);

		assert.deepStrictEqual(_spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getMessageBridge:doGetById',
				params: ['123', 'deno-test'],
			},
		]);

		messageBuilder.setUpdateData(
			{
				id: '123',
				room: { id: '123' },
				sender: { id: '456' },
				text: 'Hello World',
			},
			{
				id: '456',
			},
		);

		await modifyUpdater.finish(messageBuilder);

		assert.deepStrictEqual(_spy.mock.calls[1].arguments, [
			{
				method: 'bridges:getMessageBridge:doUpdate',
				params: [{ id: '123', ...messageBuilder.getChanges() }, 'deno-test'],
			},
		]);

		_spy.mock.restore();
	});

	it('correctly formats requests for the update room flow', async () => {
		const _spy = mock.method(modifyUpdater, 'senderFn' as any);

		const roomBuilder = (await modifyUpdater.room('123', { id: '456' } as any)) as RoomBuilder;

		assert.deepStrictEqual(_spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getRoomBridge:doGetById',
				params: ['123', 'deno-test'],
			},
		]);

		roomBuilder.setData({
			id: '123',
			type: 'c',
			displayName: 'Test Room',
			slugifiedName: 'test-room',
			creator: { id: '456' },
		});

		roomBuilder.setMembersToBeAddedByUsernames(['username1', 'username2']);

		// We need to sneak in the id as the `modifyUpdater.room` call won't have legitimate data
		roomBuilder.getRoom().id = '123';

		await modifyUpdater.finish(roomBuilder);

		assert.deepStrictEqual(_spy.mock.calls[1].arguments, [
			{
				method: 'bridges:getRoomBridge:doUpdate',
				params: [{ id: '123', ...roomBuilder.getChanges() }, roomBuilder.getMembersToBeAddedUsernames(), 'deno-test'],
			},
		]);
	});

	it('correctly formats requests to UserUpdater methods', async () => {
		const result = (await modifyUpdater.getUserUpdater().updateStatusText({ id: '123' } as any, 'Hello World')) as any;

		assert.deepStrictEqual(result, {
			method: 'accessor:getModifier:getUpdater:getUserUpdater:updateStatusText',
			params: [{ id: '123' }, 'Hello World'],
		});
	});

	it('correctly formats requests to LivechatUpdater methods', async () => {
		const result = (await modifyUpdater.getLivechatUpdater().closeRoom({ id: '123' } as any, 'close it!')) as any;

		assert.deepStrictEqual(result, {
			method: 'accessor:getModifier:getUpdater:getLivechatUpdater:closeRoom',
			params: [{ id: '123' }, 'close it!'],
		});
	});

	it('correctly formats requests to MessageUpdater methods', async () => {
		const result = (await modifyUpdater.getMessageUpdater().addReaction('message-id', 'user-id', ':smile:')) as any;

		assert.deepStrictEqual(result, {
			method: 'accessor:getModifier:getUpdater:getMessageUpdater:addReaction',
			params: ['message-id', 'user-id', ':smile:'],
		});
	});

	describe('Error Handling', () => {
		describe('message', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					modifyUpdater,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), {
					message: 'An unknown error occurred',
				});

				_stub.mock.restore();
			});
		});

		describe('room', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					modifyUpdater,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), { message: 'An unknown error occurred' });

				_stub.mock.restore();
			});
		});

		describe('finish', () => {
			const messageUpdater = {
				kind: 'message',
				getMessage: () => ({
					id: 'message-id',
					sender: { id: 'sender-id' },
				}),
				getChanges: () => ({
					id: 'message-id',
					sender: { id: 'sender-id' },
				}),
			} as any;

			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => modifyUpdater.finish(messageUpdater), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					modifyUpdater,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => modifyUpdater.finish(messageUpdater), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(modifyUpdater, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => modifyUpdater.finish(messageUpdater), { message: 'An unknown error occurred' });

				_stub.mock.restore();
			});
		});
	});
});
