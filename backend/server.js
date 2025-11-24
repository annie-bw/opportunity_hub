import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_CX_ID;

app.get("/search", async (req, res) => {
    const q = req.query.q;

    if (!q) return res.status(400).json({ error: "Missing query" });

    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(q)}&dateRestrict=y1&sort=date`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Google API request failed", details: error });
    }
});
app.use((req,res,next) => { console.log(new Date().toISOString(), req.method, req.originalUrl); next(); });

// create endpoint to be called by frontend
// This implementation can fetch multiple Google result pages (up to 100),
// combine in-memory caching and in-flight request to reduce quota usage, we have rate limit
const QUERY_CACHE = new Map(); // cacheKey -> { expires, data }
const IN_FLIGHT = new Map();   // cacheKey -> Promise

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function getCachedResults(cacheKey) {
    const entry = QUERY_CACHE.get(cacheKey);
    if (!entry) return null;
    if (Date.now() > entry.expires) { QUERY_CACHE.delete(cacheKey); return null; }
    return entry.data;
}

function setCachedResults(cacheKey, data, ttlMs = 1000 * 60 * 30) { // 30 minutes
    QUERY_CACHE.set(cacheKey, { expires: Date.now() + ttlMs, data });
}

app.get('/api/search', async (req, res) => {
    const q = req.query.query;
    let maxResults = parseInt(req.query.maxResults, 10) || 10;
    maxResults = Math.min(Math.max(1, maxResults), 100);

    if (!q) return res.status(400).json({ success: false, error: 'Missing query' });
    if (!GOOGLE_API_KEY || !CX) return res.status(500).json({ success: false, error: 'Server missing Google API credentials' });

    const cacheKey = `${q}::${maxResults}`;
    const cached = getCachedResults(cacheKey);
    if (cached) return res.json({ success: true, results: cached, cached: true });

    if (IN_FLIGHT.has(cacheKey)) {
        try {
            const results = await IN_FLIGHT.get(cacheKey);
            return res.json({ success: true, results, cached: true });
        } catch (err) {
            // fallback to to a fresh attempt
        }
    }

    const fetchPromise = (async () => {
        try {
            const collected = [];
            const pageSize = 10; // max given per request is 10
            let start = 1; // Custom Search 'start' is 1

            while (collected.length < maxResults && start <= 91) {
                const num = Math.min(pageSize, maxResults - collected.length);
                const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(q)}&dateRestrict=y1&sort=date&start=${start}&num=${num}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.error) {
                    return { error: data.error, results: collected };
                }

                const items = data.items || [];
                collected.push(...items);

                if (!items || items.length < num) break;

                start += items.length;
                await sleep(300);
            }

            const finalResults = collected.slice(0, maxResults);
            setCachedResults(cacheKey, finalResults, 1000 * 60 * 30);
            return finalResults;
        } finally {
            IN_FLIGHT.delete(cacheKey);
        }
    })();

    IN_FLIGHT.set(cacheKey, fetchPromise);

    try {
        const results = await fetchPromise;
        if (results && results.error) {
            return res.status(500).json({ success: false, error: 'Google API error', details: results.error, partial: results.results });
        }
        return res.json({ success: true, results });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Google API request failed', details: String(err) });
    }
});
//listen on port 3000
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
