// Augment the npm 'acorn-walk' module with a better-typed ancestor walker
// callback that uses the discriminated-union AnyNode (from our acorn augment)
// instead of the base Node class. The original FullAncestorWalkerCallback type
// cannot be changed via augmentation, so we add a new alias.

import type { AnyNode } from 'acorn';

declare module 'acorn-walk' {
	/**
	 * Strongly-typed variant of FullAncestorWalkerCallback where the node is
	 * narrowed to AnyNode (the discriminated union) and the state is TState only
	 * (not TState | Node[]).  Use this instead of FullAncestorWalkerCallback when
	 * writing AST operations for this runtime.
	 */
	export type FullAncestorWalkerCallbackWithState<TState> = (node: AnyNode, state: TState, ancestors: AnyNode[], type: string) => void;
}
