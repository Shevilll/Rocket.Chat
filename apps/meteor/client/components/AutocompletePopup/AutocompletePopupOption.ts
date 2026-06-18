import type { ReactNode } from 'react';

export type AutocompletePopupOption<T extends { _id: string; sort?: number } = { _id: string; sort?: number }> = {
	title?: string;
	getItemsFromLocal?: (filter: any) => Promise<T[]>;
	getItemsFromServer?: (filter: any) => Promise<T[]>;
	blurOnSelectItem?: boolean;
	closeOnEsc?: boolean;

	trigger?: string;
	triggerAnywhere?: boolean;
	triggerLength?: number;

	suffix?: string;
	prefix?: string;

	matchSelectorRegex?: RegExp;
	preview?: boolean;
	enablePreviewQuery?: (filter: unknown) => boolean;

	getValue: (item: T) => string;

	renderItem?: ({ item }: { item: T }) => ReactNode;
	disabled?: boolean;
};

export const createAutocompletePopupConfig = <T extends { _id: string; sort?: number }>(
	partial: Omit<AutocompletePopupOption<T>, 'getValue'> & Partial<Pick<AutocompletePopupOption<T>, 'getValue'>>,
): AutocompletePopupOption<T> => {
	return {
		blurOnSelectItem: true,
		closeOnEsc: true,
		triggerAnywhere: true,
		suffix: ' ',
		prefix: partial.prefix ?? partial.trigger ?? ' ',
		getValue: (item) => item._id,
		...partial,
	};
};
