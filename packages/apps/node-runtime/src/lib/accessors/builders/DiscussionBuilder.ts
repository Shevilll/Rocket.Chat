import type { IDiscussionBuilder as _IDiscussionBuilder } from '@rocket.chat/apps-engine/definition/accessors/IDiscussionBuilder';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';
import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType';

import { RoomBuilder } from './RoomBuilder';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
	RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };

export type IDiscussionBuilder = _IDiscussionBuilder;

export class DiscussionBuilder extends RoomBuilder implements IDiscussionBuilder {
	public declare kind: _RocketChatAssociationModel.DISCUSSION;

	private reply?: string;

	private parentMessage?: IMessage;

	constructor(data?: Partial<IRoom>) {
		super(data);
		this.kind = RocketChatAssociationModel.DISCUSSION;
		this.room.type = RoomType.PRIVATE_GROUP;
	}

	public setParentRoom(parentRoom: IRoom): IDiscussionBuilder {
		this.room.parentRoom = parentRoom;
		return this;
	}

	public getParentRoom(): IRoom {
		return this.room.parentRoom!;
	}

	public setReply(reply: string): IDiscussionBuilder {
		this.reply = reply;
		return this;
	}

	public getReply(): string {
		return this.reply!;
	}

	public setParentMessage(parentMessage: IMessage): IDiscussionBuilder {
		this.parentMessage = parentMessage;
		return this;
	}

	public getParentMessage(): IMessage {
		return this.parentMessage!;
	}
}
