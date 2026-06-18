import { useContext, createContext } from 'react';

import type { AutocompletePopupOption } from '../../../components/AutocompletePopup';

export type ComposerPopupContextValue = AutocompletePopupOption[];

export const ComposerPopupContext = createContext<ComposerPopupContextValue | undefined>(undefined);

export const useComposerPopupOptions = () => {
	const composerPopupContext = useContext(ComposerPopupContext);
	if (!composerPopupContext) {
		throw new Error('useComposerPopupOptions must be used within ComposerPopupContext');
	}
	return composerPopupContext;
};
