import { fetchRawData, extractDescription, parsePublishDate } from './apiFetch.js';
const QUERY_MAP = {
    // student
    "student-internships": "\"paid internship 2025\" OR \"paid internship 2026\" OR \"summer internship program\" OR \"undergraduate internship\" OR \"graduate internship\" OR \"UN internship\" OR \"WHO internship\" OR \"World Bank internship\" OR \"research internship funded\"",

    "student-summits": "\"youth summit 2025\" OR \"youth summit 2026\" OR \"student conference\" OR \"youth forum\" OR \"student leadership\" OR \"Model UN conference\" OR \"youth assembly\" OR \"student delegates\" OR \"fully funded youth\"",

    "student-fellowships": "\"student fellowship 2025\" OR \"student fellowship 2026\" OR \"graduate fellowship\" OR \"research fellowship students\" OR \"postgraduate fellowship\" OR \"PhD fellowship\" OR \"Fulbright fellowship\" OR \"Chevening scholarship\"",

    "student-misc": "\"student competition 2025\" OR \"student competition 2026\" OR \"hackathon students\" OR \"scholarship application\" OR \"student awards\" OR \"youth prize\" OR \"student grant\" OR \"essay competition\" OR \"case competition\"",

    // company
    "company-tech": "\"startup grant 2025\" OR \"startup grant 2026\" OR \"tech accelerator\" OR \"innovation challenge\" OR \"seed funding tech\" OR \"startup competition\" OR \"pitch competition\" OR \"tech incubator\" OR \"innovation fund\" OR \"business grant technology\"",

    "company-agriculture": "\"agriculture grant 2025\" OR \"agriculture grant 2026\" OR \"farming grant\" OR \"agribusiness funding\" OR \"agritech accelerator\" OR \"food innovation grant\" OR \"sustainable agriculture fund\" OR \"agricultural startup\" OR \"rural enterprise grant\" OR \"farm business support\"",

    "company-environment": "\"green startup grant\" OR \"climate tech funding\" OR \"renewable energy grant\" OR \"sustainability accelerator\" OR \"clean energy fund\" OR \"environmental business grant\" OR \"carbon reduction funding\" OR \"circular economy grant\" OR \"impact investment environment\"",

    "company-education": "\"edtech grant 2025\" OR \"edtech grant 2026\" OR \"education startup funding\" OR \"learning innovation\" OR \"education technology accelerator\" OR \"teaching innovation grant\" OR \"EdTech competition\" OR \"educational impact fund\" OR \"e-learning startup\"",

    "company-healthcare": "\"healthtech grant\" OR \"medical innovation funding\" OR \"digital health accelerator\" OR \"biotech startup\" OR \"healthcare innovation\" OR \"medtech competition\" OR \"health startup fund\" OR \"telemedicine grant\" OR \"pharma innovation\"",

    "company-arts": "\"creative business grant\" OR \"arts enterprise funding\" OR \"cultural startup\" OR \"creative industries fund\" OR \"arts organization grant\" OR \"cultural innovation\" OR \"media startup grant\" OR \"creative entrepreneur support\"",

    "company-manufacturing": "\"manufacturing grant 2025\" OR \"industrial innovation\" OR \"smart manufacturing fund\" OR \"Industry 4.0 grant\" OR \"production innovation\" OR \"manufacturing startup\" OR \"advanced manufacturing fund\" OR \"supply chain innovation\"",

    "company-community": "\"social enterprise grant\" OR \"community business fund\" OR \"social impact startup\" OR \"local development grant\" OR \"community innovation\" OR \"social entrepreneur support\" OR \"impact business fund\" OR \"cooperative grant\"",

    // individual
    "individual-grants": "\"individual grant 2025\" OR \"individual grant 2026\" OR \"personal project funding\" OR \"artist grant\" OR \"creator fund\" OR \"independent researcher\" OR \"freelancer grant\" OR \"individual award\" OR \"personal development fund\"",

    "individual-fellowships": "\"professional fellowship 2025\" OR \"professional fellowship 2026\" OR \"individual fellowship\" OR \"career development fellowship\" OR \"leadership fellowship\" OR \"practitioner fellowship\" OR \"mid-career fellowship\" OR \"executive fellowship\"",

    "individual-creative": "\"artist residency 2025\" OR \"artist residency 2026\" OR \"creative grant\" OR \"arts funding individual\" OR \"writer grant\" OR \"filmmaker funding\" OR \"musician grant\" OR \"photographer award\" OR \"creative project fund\"",

    // ngo
    "ngo-tech": "\"NGO technology grant\" OR \"non-profit digital\" OR \"civil society tech\" OR \"ICT for development\" OR \"nonprofit innovation fund\" OR \"digital transformation NGO\" OR \"tech for good grant\" OR \"nonprofit technology support\"",

    "ngo-agriculture": "\"NGO agriculture grant\" OR \"food security funding\" OR \"smallholder farmer NGO\" OR \"agricultural development grant\" OR \"rural development NGO\" OR \"sustainable farming NGO\" OR \"agricultural extension grant\" OR \"farmer cooperative support\"",

    "ngo-environment": "\"environmental NGO grant 2025\" OR \"environmental NGO grant 2026\" OR \"conservation funding\" OR \"climate action NGO\" OR \"biodiversity grant\" OR \"reforestation funding\" OR \"ocean conservation\" OR \"wildlife protection grant\" OR \"environmental justice fund\"",

    "ngo-education": "\"education NGO grant 2025\" OR \"education NGO grant 2026\" OR \"literacy program funding\" OR \"school development grant\" OR \"teacher training NGO\" OR \"education access fund\" OR \"youth education grant\" OR \"scholarship program NGO\"",

    "ngo-healthcare": "\"health NGO grant 2025\" OR \"health NGO grant 2026\" OR \"public health funding\" OR \"medical NGO support\" OR \"healthcare access grant\" OR \"community health fund\" OR \"maternal health NGO\" OR \"disease prevention grant\"",

    "ngo-arts": "\"arts NGO grant\" OR \"cultural heritage funding\" OR \"community arts grant\" OR \"cultural preservation\" OR \"arts education NGO\" OR \"museum funding\" OR \"performing arts NGO\" OR \"cultural exchange grant\"",

    "ngo-manufacturing": "\"social enterprise funding\" OR \"fair trade grant\" OR \"ethical production NGO\" OR \"artisan cooperative\" OR \"local manufacturing support\" OR \"skills development grant\" OR \"vocational training NGO\"",

    "ngo-community": "\"community development grant 2025\" OR \"community development grant 2026\" OR \"grassroots funding\" OR \"local NGO grant\" OR \"community empowerment\" OR \"neighborhood development\" OR \"civil society grant\" OR \"community organizing fund\" OR \"participatory development\""
};

// get basic information from description in a normal google search result
function extractBasicInfo(item) {
    const snippet = item.snippet || "";
    const title = item.title || "";

    // get clean description ,timestamps removed, use extractDescription from apifetch
    const shortDescription = extractDescription(snippet);

    return {
        title: title,
        link: item.link,
        source: item.source || new URL(item.link).hostname,
        short_description: shortDescription,
        publishDate: parsePublishDate(item.publishDate)
    };
}

async function processCategoryClick(input) {
    let query;
    let label;

    if (QUERY_MAP[input]) {
        query = QUERY_MAP[input];
        const element = document.querySelector(`[data-category="${input}"]`);//find in html where data-category is that input(ex:internships)
        label = element ? element.textContent : input;
    } else {
        query = input;
        label = `manual search for: ${input}`;
    }

    if (window.showLoading) window.showLoading(label, query);

    //fetch raw results from google
    const rawResults = await fetchRawData(query, 100);

    // get basic info with clean descr
    let opportunities = rawResults.map(extractBasicInfo);

    //filter out 2024 and earlier (only 2025+)
    const cutoffDate = new Date('2025-01-01');
    opportunities = opportunities.filter(opp => {
        if (!opp.publishDate) return true; // keep it if we don't have date info
        return opp.publishDate >= cutoffDate;
    });

    //sort by publish date (most recent first)
    opportunities.sort((a, b) => {
        if (a.publishDate && b.publishDate) {
            return b.publishDate - a.publishDate; // newest  first
        }
        if (a.publishDate && !b.publishDate) return -1;
        if (!a.publishDate && b.publishDate) return 1;
        return 0;
    });

    if (window.hideLoading) window.hideLoading();
    if (window.displayOpportunities) window.displayOpportunities(opportunities);
}

export { processCategoryClick };
