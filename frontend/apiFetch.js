const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://annie-bw.tech';

// get multiple pages of rAw data from backend server
async function fetchRawData(query, maxResults = 100) {
    try {
        const url = `${BACKEND_URL}/api/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`backend api error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (data.success && data.results) {
            return data.results;
        } else {
            console.error('unexpected response format:', data);
            return [];
        }
    } catch (error) {
        console.error("backend fetch error:", error);
        return [];
    }
}

// clean snippet to remove timestamps and unnecessary info
function cleanSnippetText(snippet) {
    if (!snippet) return '';

    let cleaned = snippet;

    // remove all timestamp patterns
    const timestampPatterns = [
        // "x days/hours/etc ago" patterns
        /\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\s*/gi,
        /\d+\s+(?:sec|min|hr|hrs|dy|dys|wk|wks|mo|mos|yr|yrs)\.?\s+ago\s*/gi,

        // posted/updated timestamps
        /posted\s+\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/gi,
        /updated\s+\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/gi,
        /published\s+\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/gi,

        // timestamps at the start with punctuation
        /^\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\s*[:\-–—]?\s*/gi,

        // other patterns
        /\.\.\.\s*\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/gi,
        /…\s*\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/gi,
        /^…+\s*/g,
        /^\.{2,}\s*/g,

        // "x ago" without units (like "5 ago")
        /\d+\s+ago\s*/gi,
    ];

    // apply all patterns
    timestampPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // remove date stamps at the start (like "nov 20, 2024 — " or "2024-11-20 —")
    cleaned = cleaned.replace(/^[A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}\s*[—\-–:]\s*/g, '');
    cleaned = cleaned.replace(/^\d{4}-\d{1,2}-\d{1,2}\s*[—\-–:]\s*/g, '');
    cleaned = cleaned.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*[—\-–:]\s*/g, '');

    // remove "posted on/published/updated on" prefixes
    cleaned = cleaned.replace(/^(?:Posted|Published|Updated)(?:\s+on)?[:\s]+/gi, '');

    // remove metadata-like prefixes (source indicators)
    cleaned = cleaned.replace(/^[A-Z][^:]{0,30}:\s*/g, ''); // remove "source name: " patterns

    // remove whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // remove punctuation and symbols at the startT
    cleaned = cleaned.replace(/^[\.…,;\-–—:\s›»]+/, '');

    // remove trailing ellipsis at start (after other cleanings)
    cleaned = cleaned.replace(/^[\.…]+\s*/, '');

    return cleaned;
}

// extract clean description from snippet
function extractDescription(snippet) {
    const cleaned = cleanSnippetText(snippet);

    if (!cleaned || cleaned.length < 10) {
        return 'no description available.';
    }

    // try to get first complete sentence (30-300 chars)
    const sentenceMatch = cleaned.match(/^([^.!?]{30,300}[.!?])/);
    if (sentenceMatch) {
        return sentenceMatch[1].trim();
    }

    // try to get 1-2 sentences up to 300 chars
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
        let description = sentences[0].trim();

        // add second sentence if first is too short
        if (sentences.length > 1 && description.length < 120) {
            description += ' ' + sentences[1].trim();
        }

        // ADD "..." if snippet is  too long
        if (description.length > 300) {
            return description.substring(0, 297) + '...';
        }

        return description;
    }

    // asa fallback: just add "..." cleanly at word boundary
    if (cleaned.length > 300) {
        const truncated = cleaned.substring(0, 297);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 200) {
            return truncated.substring(0, lastSpace) + '...';
        }
        return truncated + '...';
    }

    return cleaned;
}

// parse date from various formats
function parsePublishDate(dateStr) {
    if (!dateStr) return null;

    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
    } catch (e) {
        return null;
    }

    return null;
}

export { fetchRawData, extractDescription, cleanSnippetText, parsePublishDate };
