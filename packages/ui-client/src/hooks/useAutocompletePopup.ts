import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import type { MutableRefObject, ReactElement } from 'react';
import { useEffect, useCallback, useState, useRef } from 'react';

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

	renderItem?: ({ item }: { item: T }) => ReactElement;
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

export type EditableTextAdapter = {
	textBeforeCaret(): string;
	caret(): number;
	replaceRange(text: string, start: number, end: number): void;
};

type InputLike = HTMLInputElement | HTMLTextAreaElement;

// the prototype's native setter is what makes React's onChange fire on a programmatic edit
const setNativeValue = (input: InputLike, value: string) => {
	const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
	const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
	setter?.call(input, value);
};

export const fromInputElement = (getInput: () => InputLike | null): EditableTextAdapter => ({
	textBeforeCaret: () => {
		const input = getInput();
		return input ? input.value.substring(0, input.selectionStart ?? input.value.length) : '';
	},
	caret: () => getInput()?.selectionStart ?? 0,
	replaceRange: (text, start, end) => {
		const input = getInput();
		if (!input) {
			return;
		}
		const nextValue = input.value.slice(0, start) + text + input.value.slice(end);
		const caret = start + text.length;
		input.focus();
		setNativeValue(input, nextValue);
		input.setSelectionRange(caret, caret);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	},
});

export const useEnablePopupPreview = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: AutocompletePopupOption<T>) =>
	popup && !popup.preview && (popup?.triggerLength ? typeof filter === 'string' && popup.triggerLength - 1 < filter.length : true);

const useAutocompletePopupQueries = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: AutocompletePopupOption<T>) => {
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [popup, filter]);

	const shouldPopupPreview = useEnablePopupPreview(filter, popup);

	const enableQuery = !popup || (popup.preview && (popup.enablePreviewQuery?.(filter) ?? false)) || shouldPopupPreview;

	const queries = useQueries({
		queries: [
			{
				placeholderData: keepPreviousData,
				queryKey: ['message-popup', 'local', filter, popup],
				queryFn: () => popup?.getItemsFromLocal?.(filter) || [],
				enabled: enableQuery,
			},
			{
				placeholderData: keepPreviousData,
				queryKey: ['message-popup', 'server', filter, popup],
				queryFn: () => popup?.getItemsFromServer?.(filter) || [],
				enabled: counter > 0,
			},
		],
	});

	useEffect(() => {
		if (Array.isArray(queries[0].data) && queries[0].data.length < 5) {
			setCounter(1);
		}
	}, [queries]);

	return {
		queries,
		suspended: !enableQuery,
	};
};

type AutocompletePopupImperativeCommands<T> = MutableRefObject<
	| {
			getFilter?: () => string;
			select?: (s: T) => void;
	  }
	| undefined
>;

type AutocompletePopupResult<T extends { _id: string; sort?: number }> =
	| {
			option: AutocompletePopupOption<T>;
			items: UseQueryResult<T[]>[];
			focused: T | undefined;
			select: (item: T) => void;
			callbackRef: (node: HTMLElement) => void;
			commandsRef: AutocompletePopupImperativeCommands<T>;
			suspended: boolean;
			filter: unknown;
			clear: () => void;
			update: () => void;
	  }
	| {
			option: undefined;
			items: undefined;
			focused: undefined;
			callbackRef: (node: HTMLElement) => void;
			select: undefined;
			commandsRef: AutocompletePopupImperativeCommands<T>;
			suspended: undefined;
			filter: unknown;
			clear: () => void;
			update: () => void;
	  };

const keys = {
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	ARROW_UP: 38,
	ARROW_DOWN: 40,
} as const;

export const useAutocompletePopup = <T extends { _id: string; sort?: number }>(
	options: AutocompletePopupOption<T>[],
	editor: EditableTextAdapter | undefined,
): AutocompletePopupResult<T> => {
	const [optionIndex, setOptionIndex] = useState<number>(-1);
	const [focused, setFocused] = useState<T | undefined>(undefined);
	const [filter, setFilter] = useState('');

	const option = options[optionIndex];

	const commandsRef: AutocompletePopupImperativeCommands<T> = useRef();

	const { queries: items, suspended } = useAutocompletePopupQueries(filter, option) as {
		queries: UseQueryResult<T[]>[];
		suspended: boolean;
	};

	useEffect(() => {
		if (!option) {
			return;
		}

		if (option?.preview && suspended) {
			setFocused(undefined);
			return;
		}
		setFocused((focused) => {
			const sortedItems = items
				.filter((item) => item.isSuccess)
				.flatMap((item) => item.data)
				.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));
			return sortedItems.find((item) => item._id === focused?._id) ?? sortedItems[0];
		});
	}, [items, option, suspended]);

	const select = useEffectEvent((item: T) => {
		if (!option) {
			throw new Error('No popup is open');
		}

		if (commandsRef.current?.select) {
			commandsRef.current.select(item);
		} else {
			const value = editor?.textBeforeCaret();
			const selector =
				option.matchSelectorRegex ??
				(option.triggerAnywhere ? new RegExp(`(?:^| |\n)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));

			const result = value?.match(selector);
			if (!result || !value || !editor) {
				return;
			}

			editor.replaceRange(
				(option.prefix ?? option.trigger ?? '') + option.getValue(item) + (option.suffix ?? ''),
				value.lastIndexOf(result[1] + result[2]),
				editor.caret(),
			);
		}
		setOptionIndex(-1);
		setFocused(undefined);
	});

	const setOptionByInput = useEffectEvent((): AutocompletePopupOption<T> | undefined => {
		const value = editor?.textBeforeCaret();

		if (!value) {
			setOptionIndex(-1);
			setFocused(undefined);
			return;
		}

		const optionIndex = options.findIndex(({ trigger, matchSelectorRegex, triggerAnywhere, triggerLength }) => {
			const selector =
				matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^| |\n)(${trigger})[^\\s]*$`) : new RegExp(`(?:^)(${trigger})[^\\s]*$`));
			const result = selector.test(value);
			if (!triggerLength || !result) {
				return result;
			}
			const filter = value.match(selector);
			return filter && triggerLength < filter[0].length;
		});
		setOptionIndex(optionIndex);
		const option = options[optionIndex];
		if (!option) {
			setFocused(undefined);
			setFilter('');
		}

		if (option) {
			const selector =
				option.matchSelectorRegex ??
				(option.triggerAnywhere ? new RegExp(`(?:^| |\n)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));
			const result = value.match(selector);
			setFilter(commandsRef.current?.getFilter?.() ?? (result ? result[2] : ''));
		}
		return option;
	});

	const handleFocus = useEffectEvent(() => {
		if (option) {
			return;
		}
		setOptionByInput();
	});

	const handleKeyUp = useEffectEvent((event: KeyboardEvent) => {
		if (!setOptionByInput()) {
			return;
		}

		if (!option) {
			return;
		}

		if (option.closeOnEsc === true && event.which === keys.ESC) {
			setOptionIndex(-1);
			setFocused(undefined);
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	});

	const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
		if (!option) {
			return;
		}

		if (event.which === keys.ENTER || event.which === keys.TAB) {
			if (!focused) {
				return;
			}

			select(focused);

			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_UP && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			setFocused((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data)
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return focusedIndex > 0 ? list[focusedIndex - 1] : list[list.length - 1];
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}
		if (event.which === keys.ARROW_DOWN && !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)) {
			setFocused((focused) => {
				const list = items
					.filter((item) => item.isSuccess)
					.flatMap((item) => item.data)
					.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0));

				if (!list) {
					return undefined;
				}

				const focusedIndex = list.findIndex((item) => item === focused);

				return focusedIndex < list.length - 1 ? list[focusedIndex + 1] : list[0];
			});
			event.preventDefault();
			event.stopImmediatePropagation();
			return true;
		}

		return undefined;
	});

	const clear = useEffectEvent(() => {
		if (!option) {
			return;
		}

		setOptionIndex(-1);
		setFocused(undefined);
		setFilter('');
	});

	const ref = useRef<HTMLElement | null>(null);
	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (ref.current) {
				ref.current.removeEventListener('keyup', handleKeyUp);
				ref.current.removeEventListener('keydown', handleKeyDown);
				ref.current.removeEventListener('focus', handleFocus);
				ref.current = null;
			}

			if (node) {
				ref.current = node;
				node.addEventListener('keyup', handleKeyUp);
				node.addEventListener('keydown', handleKeyDown);
				node.addEventListener('focus', handleFocus);
			}
		},
		[handleKeyUp, handleKeyDown, handleFocus],
	);

	if (!option) {
		return {
			option: undefined,
			items: undefined,
			focused: undefined,
			select: undefined,
			callbackRef,
			commandsRef,
			suspended: undefined,
			filter: undefined,
			clear,
			update: setOptionByInput,
		};
	}

	return {
		option,
		items,
		focused,
		select,
		callbackRef,
		commandsRef,
		suspended,
		filter,
		clear,
		update: setOptionByInput,
	};
};
