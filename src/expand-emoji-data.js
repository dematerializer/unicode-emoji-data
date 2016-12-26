// Transforms a given base datum such that if modification or combination data is available,
// returns a new datum where matching properties are overridden, otherwise returns identity:
const transformEmojiDatum = (baseDatum, modificationOrCombinationOverrides) => {
	if (modificationOrCombinationOverrides) {
		// Override properties of the base datum:
		return {
			...baseDatum,
			...modificationOrCombinationOverrides,
			modification: undefined,
			combination: undefined,
		};
	}
	// Retain the base datum itself:
	return baseDatum;
};

export const internals = {
	transformEmojiDatum,
};

// Expands all given emoji data entries such that each combination and each
// modification of one entry results in a separate entry retaining its
// base datum's properties that get selectively overridden by the respective
// modification or combination:
export default function expandEmojiData(data) {
	// NOTE: this implementation does not account for new combining marks
	// or modifiers that might be added to the standard in the future.
	const expandedEmoji = [];
	data.forEach((datum) => {
		if (datum.combination && datum.combination.keycap) {
			// Extract combination as its own entry:
			expandedEmoji.push(transformEmojiDatum(datum, datum.combination.keycap));
		} else {
			// Include all base emoji except for those of keycap combinations because they
			// do not appear in the emoji list other than in their keycap-combined appearance.
			expandedEmoji.push(transformEmojiDatum(datum));
		}
		if (datum.modification && datum.modification.skin) {
			// Extract each skin modification as its own entry:
			Object.keys(datum.modification.skin).forEach(type =>
				expandedEmoji.push(transformEmojiDatum(datum, datum.modification.skin[type])),
			);
		}
	});
	return expandedEmoji;
}
