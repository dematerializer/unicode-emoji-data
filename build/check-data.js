const matchAnyTrailingVariationSelector = /\s(FE0E|FE0F)$/g;

export default function checkData({ data, reference }) {
	const report = {
		unmatchedSequences: [],
		numDiff: 0,
		numExpected: reference.length,
		numGot: data.length,
	};
	if (data.length === reference.length) {
		const diff = data.map((datum) => {
			// Compare insentitive to any trailing variation selector
			// because I believe the use of trailing variation selectors
			// in emoji-list.html does not represent current vendor support.
			const sequenceWithoutVariation = datum.sequence.replace(matchAnyTrailingVariationSelector, '');
			const contains = reference.find(seq => seq.includes(sequenceWithoutVariation));
			if (!contains) {
				report.unmatchedSequences.push(datum.sequence);
			}
			return !!contains;
		});
		report.numDiff = diff.filter(d => d === false).length;
	} else {
		report.numDiff = report.numGot - report.numExpected;
	}
	return report;
}
