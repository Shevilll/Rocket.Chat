import * as Messenger from './lib/messenger';

export default function registerErrorListeners() {
	process.on('uncaughtException', (error: Error, origin: 'uncaughtException' | 'unhandledRejection') => {
		Messenger.sendNotification({
			method: origin,
			params: [error.stack || error],
		});
	});
}
