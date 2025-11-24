import { processCategoryClick } from './apiController.js';

const resultsDiv = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');
const searchLabel = document.getElementById('search-label');
const currentQuery = document.getElementById('current-query');
const manualSearchForm = document.getElementById('manual-search-form');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const introDiv = document.getElementById('intro-content');

// handle pagination
let allOpportunities = [];
let currentPage = 1;
const itemsPerPage = 12;

function showLoading(label, query){
    if (introDiv) introDiv.classList.add('hidden');
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.classList.remove('hidden');
    }
    if (searchLabel) searchLabel.textContent = `Showing results for: ${label}`;
    if (currentQuery) currentQuery.textContent = query || '';
}

function hideLoading(){
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        loadingIndicator.classList.add('hidden');
    }
}

function displayOpportunities(data){
    allOpportunities = data;
    currentPage = 1;

    if (data.length === 0){
        resultsDiv.innerHTML = '<p class="text-center-message">No current or future opportunities found. Try a different search!</p>';
        return;
    }

    renderPage();
}

function renderPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = allOpportunities.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allOpportunities.length / itemsPerPage);

    // render cards
    const cardsHtml = pageData.map(opp => {
        // show the publish date if available, otherwise indicate unknown
        let dateDisplay = '';
        if (opp.publishDate) {
            try {
                const d = new Date(opp.publishDate);
                if (!isNaN(d.getTime())) {
                    dateDisplay = d.toLocaleDateString();
                } else {
                    dateDisplay = 'Publish date unknown';
                }
            } catch (e) {
                dateDisplay = 'Publish date unknown';
            }
        } else {
            dateDisplay = 'Publish date unknown';
        }

        return `
            <div class="opportunity-card">
                <h2 class="card-title">${opp.title}</h2>
                <div class="card-meta">
                    <p class="card-source">${opp.source}</p>
                    ${dateDisplay ? `<p class="card-timestamp">${dateDisplay}</p>` : ''}
                </div>
                <p class="card-description">${opp.short_description}</p>

                <a href="${opp.link}" target="_blank" class="cta-button">
                    View Full Details & Apply →
                </a>
            </div>
        `;
    }).join('');

    //add pagination if  needed
    const paginationHtml = totalPages > 1 ? `
        <div class="pagination-container">
            <div class="pagination-info">
                Results: ${startIndex + 1}-${Math.min(endIndex, allOpportunities.length)} of ${allOpportunities.length}
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" id="prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <span class="pagination-pages">
                    Page ${currentPage} of ${totalPages}
                </span>
                <button class="pagination-btn" id="next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        </div>
    ` : `
        <div class="pagination-info-simple">
            Showing all ${allOpportunities.length} results
        </div>
    `;

    resultsDiv.innerHTML = cardsHtml + paginationHtml;

    // add click handlers for pagination
    if (totalPages > 1) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderPage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }
}

// functions should be available for apicontroller
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.displayOpportunities = displayOpportunities;

// event handlers
function handleCategoryClick(event){
    event.preventDefault();
    const categoryId = event.target.getAttribute("data-category");
    if (categoryId){
        processCategoryClick(categoryId);
    }
}

function handleManualSearch(event){
    event.preventDefault();
    const searchInput = document.getElementById("manual-search-input");
    const query = searchInput.value.trim();
    if (query){
        processCategoryClick(query);
    }
}

// initialisation
document.addEventListener('DOMContentLoaded', () => {
    // listen for a click in navigation dropdowns
    dropdownItems.forEach(item => {
        item.addEventListener("click", handleCategoryClick);
    });

    // listen for a click on manual search button
    manualSearchForm.addEventListener("submit", handleManualSearch);

    // hide loading indicator when loading...
    if (introDiv) introDiv.classList.remove('hidden');
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (resultsDiv) resultsDiv.innerHTML = '';
});
