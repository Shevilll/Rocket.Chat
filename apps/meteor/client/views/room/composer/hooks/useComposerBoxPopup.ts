import { useMemo } from 'react';

import type { AutocompletePopupOption, EditableTextAdapter } from '../../../../components/AutocompletePopup';
import { useAutocompletePopup } from '../../../../components/AutocompletePopup';
import { useChat } from '../../contexts/ChatContext';

export const useComposerBoxPopup = <T extends { _id: string; sort?: number }>(options: AutocompletePopupOption<T>[]) => {
	const composer = useChat()?.composer;
	const adapter = useMemo(
		(): EditableTextAdapter | undefined =>
			composer && {
				textBeforeCaret: () => composer.substring(0, composer.selection.start),
				caret: () => composer.selection.start,
				replaceRange: (text, start, end) => composer.replaceText(text, { start, end }),
			},
		[composer],
	);

	return useAutocompletePopup(options, adapter);
};
