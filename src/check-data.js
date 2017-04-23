const matchAnyTrailingVariationSelector = /\s(FE0E|FE0F)$/g;

export default function checkData({ data, reference }) {
	const report = {
		sequencesInDataButNotInReference: [],
		sequencesInReferenceButNotInData: [],
	};
	report.sequencesInDataButNotInReference = data.reduce((sequencesInDataButNotInReference, datum) => {
		// Compare insentitive to any trailing variation selector
		// because I believe the use of trailing variation selectors
		// in emoji-list.html does not represent current vendor support.
		const sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
		const sequenceWithoutVariation = sequence.replace(matchAnyTrailingVariationSelector, '');
		const contains = reference.find(referenceSequence => referenceSequence.includes(sequenceWithoutVariation));
		if (!contains) {
			return [...sequencesInDataButNotInReference, sequence];
		}
		return sequencesInDataButNotInReference;
	}, []);
	report.sequencesInReferenceButNotInData = reference.reduce((sequencesInReferenceButNotInData, referenceSequence) => {
		const referenceSequenceWithoutVariation = referenceSequence.replace(matchAnyTrailingVariationSelector, '');
		const contains = data.find((datum) => {
			// Compare insentitive to any trailing variation selector
			// because I believe the use of trailing variation selectors
			// in emoji-list.html does not represent current vendor support.
			const sequence = datum.presentation.variation ? datum.presentation.variation.emoji : datum.presentation.default;
			const sequenceWithoutVariation = sequence.replace(matchAnyTrailingVariationSelector, '');
			return sequenceWithoutVariation.includes(referenceSequenceWithoutVariation);
		});
		if (!contains) {
			return [...sequencesInReferenceButNotInData, referenceSequence];
		}
		return sequencesInReferenceButNotInData;
	}, []);
	return report;
}
