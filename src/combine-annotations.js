const groupArrayOfObjectsByKey = (array, key) => {
	return array.reduce((curr, obj) => {
		const next = curr;
		next[obj[key]] = obj;
		return next;
	}, {});
};

export default function combineAnnotations({ cldrAnnotationsForLanguage, communityAnnotationsForLanguage }) {
	const globalCommunityAnnotations = communityAnnotationsForLanguage['global'];
	const globalCommunityAnnotationForSequence = groupArrayOfObjectsByKey(globalCommunityAnnotations, 'sequence');
	return Object.keys(cldrAnnotationsForLanguage).reduce((prevCldrAnnotationsForLanguage, language) => {
		const nextCldrAnnotationsForLanguage = prevCldrAnnotationsForLanguage;
		const cldrAnnotations = cldrAnnotationsForLanguage[language];
		const communityAnnotations = communityAnnotationsForLanguage[language];
		if (communityAnnotations == null) {
			nextCldrAnnotationsForLanguage[language] = cldrAnnotations;
		} else {
			const communityAnnotationForSequence = groupArrayOfObjectsByKey(communityAnnotations, 'sequence');
			nextCldrAnnotationsForLanguage[language] = cldrAnnotations.map((cldrAnnotation) => {
				const globalCommunityAnnotation = globalCommunityAnnotationForSequence[cldrAnnotation.sequence] || {};
				const communityAnnotation = communityAnnotationForSequence[cldrAnnotation.sequence] || {};
				// Override tts, extend keywords:
				return {
					...cldrAnnotation,
					tts: communityAnnotation.tts || cldrAnnotation.tts,
					keywords: cldrAnnotation.keywords.concat(
						communityAnnotation.keywords || [],
						globalCommunityAnnotation.keywords || []
					),
				};
			});
		}
		return nextCldrAnnotationsForLanguage;
	}, {});
}
