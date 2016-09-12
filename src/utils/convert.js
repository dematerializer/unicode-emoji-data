export function codepointSequenceToString(codepointSequence) {
	// Usage: codepointSequenceToString('0032 FE0E')
	const codepoints = codepointSequence.split(' ');
	const numericCodepoints = codepoints.map(codepoint => parseInt(codepoint, 16));
	return String.fromCodePoint(...numericCodepoints);
}

export default codepointSequenceToString;
