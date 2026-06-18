import type { AutocompletePopupOption } from '../AutocompletePopupOption';

export const useEnablePopupPreview = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: AutocompletePopupOption<T>) =>
	popup && !popup.preview && (popup?.triggerLength ? typeof filter === 'string' && popup.triggerLength - 1 < filter.length : true);
