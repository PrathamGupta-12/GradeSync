const uploadContentBox = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const statusText = document.getElementById('statusText');

const analyzeButton = document.getElementById('analyzeButton');

let userFile = null;
let userData = null;

let pageNumber = 1;
let maxPageNumber;

function changeFileImportSection(isFileUploaded) {

    if (isFileUploaded) {
        fileName.textContent = userFile.name;

        const fileSizeKB = (userFile.size / 1024).toFixed(2);
        fileSize.textContent = `${fileSizeKB}KB`;

        statusText.textContent = 'Successful.';
        analyzeButton.disabled = false;
    } else {
        fileName.textContent = 'No file selected';
        fileSize.textContent = 'Select a performance file to begin';
        
        statusText.textContent = 'Waiting for a file';
        analyzeButton.disabled = true;
    }
}

const subjectFilter = document.getElementById('subjectFilter');
const examTypeFilter = document.getElementById('examTypeFilter');

function populateSubjectsAndExams(){

    const categories = userData.categories;

    const subjects = categories.subjects;
    const examType = categories.examTypes;

    // Clear existing dynamic options before re-populating to prevent duplicates on re-analysis
    subjectFilter.innerHTML = '<option value="all">All subjects</option>';
    examTypeFilter.innerHTML = '<option value="all">All exam types</option>';

    const subjectsOptionHTML = subjects
    .map(item => `<option value="${item}">${item}</option>`)
    .join('');

    subjectFilter.insertAdjacentHTML('beforeend' , subjectsOptionHTML);

    const examTypeOptionHTML = examType
    .map(item => `<option value="${item}">${item}</option>`)
    .join('');

    examTypeFilter.insertAdjacentHTML('beforeend' , examTypeOptionHTML);
}

uploadContentBox.addEventListener('change' , (e) => {

    const filesList = e.target.files;
    if (filesList.length > 0) {
        userFile = filesList[0];
        changeFileImportSection(true);
    } else {
        userFile = null;
        changeFileImportSection(false);
    }
})

analyzeButton.addEventListener('click' , () => {
    if (!userFile) {
        return;
    } else {
        fetchUserFile();
    }
})

async function fetchUserFile() {

    statusText.textContent = 'Analyzing..';

    const formData = new FormData();
    formData.append('file' , userFile);

    try {
    
        const response = await fetch('http://127.0.0.1:8000/analyze' , {
            method : 'POST',
            body : formData
        });

        if (!response.ok){
            statusText.textContent = 'Try again later..';
            return;
        }

        const result = await response.json();

        console.log(JSON.stringify(result))
        
        if (!result.success) {
            statusText.textContent = 'Unsupported Columns..';
            toggleDashboard(false);
            return;
        }

        userData = result;
        toggleDashboard(true);

        statusText.textContent = 'Analyzed..!';
    }

    catch (error) {
        statusText.textContent = 'Error..';
        console.log(error);
        toggleDashboard(false);
    }
}

const dashboard = document.getElementById('dashboard');

function toggleDashboard(makeVisible) {

    if(makeVisible) {
        dashboard.style.display = 'flex';

        updateMetaDashboard();
        updateSummaryCards();
        updateSubjectWiseCards();
        updateStatisticalCards();

        populateSubjectsAndExams();
        renderFilters();

        updateChartArea();

    } else {
        dashboard.style.display = 'none';
    }
}

const examCount = document.getElementById('examCount');
const analysisDate = document.getElementById('analysisDate');

function updateMetaDashboard(){

    const datasetInfo = userData.basicDatasetOverview;
    examCount.textContent = `${datasetInfo.totalRows} Exams`;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const formattedDate = `${month}/${day}/${year}`;
    analysisDate.textContent = formattedDate;

}

const overallPercentage = document.getElementById('overallPercentage');
const averageMarks = document.getElementById('averageMarks');
const topSubject = document.getElementById('topSubject');
const topSubjectScore = document.getElementById('topSubjectScore');
const consistencyScore = document.getElementById('consistencyScore');

function updateSummaryCards() {

    const performanceOverview = userData.overallPerformanceOverview;
    const statisticalOverview = userData.statisticalBreakdown;
    const subjectWiseOverview = userData.subjectWiseBreakdown;

    const highestSubject = subjectWiseOverview.highestSubjectInfo;

    overallPercentage.textContent = `${performanceOverview.overallPercentage.toFixed(2)}%`;
    averageMarks.textContent = statisticalOverview.meanScore.toFixed(2);

    topSubject.textContent = highestSubject.highestSubjectName;
    topSubjectScore.textContent = `${highestSubject.highestSubjectSummary.Total} Marks`;

    consistencyScore.textContent = `${statisticalOverview.standardDeviationScore.toFixed(2)} Points`;
    
}

const subjectList = document.getElementById('subjectList');
const subjectSortButton = document.getElementById('subjectSortButton');

subjectSortButton.addEventListener('click' , () => {

    isSorted = !isSorted
    subjectList.innerHTML = '';
    updateSubjectWiseCards();

})

let isSorted = false;

function updateSubjectWiseCards(){

    subjectList.innerHTML = '';

    const subjectWiseOverview = userData.subjectWiseBreakdown.subjectSummaryTable;

    const sortedData = sortSubjectWiseBreakdown(subjectWiseOverview);

    for (let subject in sortedData) {
        addSubjectCard(subject);
    }

    if (subjectList.innerHTML === '') {
        toggleSubjectEmptyState(true);
    } else {
        toggleSubjectEmptyState(false);
    }

}

function sortSubjectWiseBreakdown(subjectData){

    if (!isSorted) {
        subjectSortButton.textContent = '↑';
        return subjectData;
    }

    subjectSortButton.textContent = '🔄';
    const subjectsArray = Object.entries(subjectData)
    subjectsArray.sort((a, b) => b[1].Total - a[1].Total);

    return Object.fromEntries(subjectsArray);

}

const subjectEmptyState = document.getElementById('subject-empty-state');

function toggleSubjectEmptyState(toDisplay) {

    if (toDisplay) {
        subjectEmptyState.style.display = 'flex';
    } else {
        subjectEmptyState.style.display = 'none';
    }
}

function addSubjectCard(subjectName) {

    const subjects = userData.subjectWiseBreakdown.subjectSummaryTable;
    
    const subjectData = subjects[subjectName];
    const subjectAverage = subjectData.AveragePercentage;

    const card = document.createElement('div');
    card.classList.add('category-card');
    
    card.innerHTML = `
    
    <div class="category-card-header">
        <div class="category-info">
            <span class="category-name">${subjectName}</span>
            <span class="category-transaction-count">${subjectData.ExamCount} evaluations</span>
        </div>
        <span class="category-percentage">${subjectData.Total > subjectData.TotalMaximumMarks ?
            'Abnormality Detected' :
            `${subjectAverage.toFixed(2)}%`
        }</span>
    </div>

    <div class="category-card-body">
        <div class="category-progress">
            <div class="category-progress-bar" style="width: ${subjectAverage}%;"></div>
        </div>

        <div class="category-stats">
            <div class="category-stat">
                <span class="stat-label">Total Score</span>
                <span class="stat-value">${subjectData.Total} / ${subjectData.TotalMaximumMarks}</span>
            </div>

            <div class="category-stat">
                <span class="stat-label">Average</span>
                <span class="stat-value">${subjectAverage.toFixed(2)}%</span>
            </div>
        </div>
    </div>
    
    `;
    subjectList.appendChild(card);
}

const statMean = document.getElementById('statMean');
const statMedian = document.getElementById('statMedian');
const statStd = document.getElementById('statStd');
const statMin = document.getElementById('statMin');
const statP25 = document.getElementById('statP25');
const statP75 = document.getElementById('statP75');

function updateStatisticalCards(){

    const statisticalOverview = userData.statisticalBreakdown;

    statMean.textContent = statisticalOverview.meanScore.toFixed(2);
    statMedian.textContent = statisticalOverview.medianScore.toFixed(2);
    statStd.textContent = statisticalOverview.standardDeviationScore.toFixed(2);
    statMin.textContent = statisticalOverview.absoluteMinimumScore.toFixed(2);
    
    const quartiles = statisticalOverview.scoreQuartiles;
    
    statP25.textContent = quartiles['25th Quartile'].toFixed(2);
    statP75.textContent = quartiles['75th Quartile'].toFixed(2);

}

const searchInput = document.getElementById('searchInput');

function renderFilters(){

    let records = userData.convertedRecords;

    const subjectFilterName = subjectFilter.value.toLowerCase();
    const examTypeFilterName = examTypeFilter.value.toLowerCase();

    examTableBody.innerHTML = '';

    if (subjectFilterName === 'all') {
        records = records;
    } else {
        records = records.filter(item => item.Subject.toLowerCase() === subjectFilterName);
    }

    if (examTypeFilterName === 'all') {
        records = records;
    } else {
        records = records.filter(item => item['Exam Type'].toLowerCase() === examTypeFilterName);
    }

    searchRecords(records);
    
}

searchInput.addEventListener('input' , () => {
    pageNumber = 1;
    renderFilters();

});

examTypeFilter.addEventListener('change' , () => {
    pageNumber = 1;
    renderFilters();

});

subjectFilter.addEventListener('change' , () => {
    pageNumber = 1;
    renderFilters();

});

const examTableBody = document.getElementById('examTableBody');
const resultCount = document.getElementById('resultCount');

function searchRecords(records) {

    const searchText = searchInput.value.trim().toLowerCase();
    const recordsData = [];

    for (let record of records) {
        if (record.Subject.toLowerCase().includes(searchText) || record['Exam Type'].toLowerCase().includes(searchText)) {
            recordsData.push(record);
        }
    }

    if (recordsData.length === 0) {

        resultCount.textContent = '0 results';

        examTableBody.innerHTML = `
        <tr id="table-empty-row">
            <td colspan="5" class="table-empty">No examination data available.</td>
        </tr>
        `;
        return;
    }
    maxPageNumber = Math.ceil(recordsData.length / 15);

    renderPagination(false);

    resultCount.textContent = `${recordsData.length} results`;
    const trimmedArray = recordsData.slice((pageNumber - 1) * 15 , (pageNumber * 15));
    displayRecords(trimmedArray);
    
}

const previousPage = document.getElementById('previousPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

function renderPagination(isError){

    if (isError) {
        previousPage.disabled = true;
        nextPage.disabled = true;
        pageInfo.textContent = 'Page 0 of 0';
        return;
    }

    if (pageNumber >= maxPageNumber){
        nextPage.disabled = true;
    } else {
        nextPage.disabled = false;
    } 

    if (pageNumber <= 1) {
        previousPage.disabled = true;
    } else {
        previousPage.disabled = false;
    }

    pageInfo.textContent = `Page ${pageNumber} of ${maxPageNumber}`;
}

previousPage.addEventListener('click' , () => {

    pageNumber -= 1;
    renderPagination(false);
    renderFilters();
})

nextPage.addEventListener('click' , () => {

    pageNumber += 1;
    renderPagination(false);
    renderFilters();
})

function displayRecords(recordsData) {

    for (let record of recordsData) {
        const card = document.createElement('tr');

        card.innerHTML = `

            <td>${record.Date}</td>
            <td>${record.Subject}</td>
            <td>${record['Exam Type']}</td>
            <td>${record['Marks Obtained']} / ${record['Maximum Marks']}</td>
            <td class="amount-column">${record.Percentage.toFixed(2)}%</td>
        
        `

        examTableBody.appendChild(card);
    }

}

const clearFilters = document.getElementById('clearFilters');

clearFilters.addEventListener('click' , () => {

    subjectFilter.value = 'all';
    examTypeFilter.value = 'all';
    searchInput.value = '';
    pageNumber = 1;
    renderFilters();

})

const resetButton = document.getElementById('resetButton');

resetButton.addEventListener('click' , () => {

    toggleDashboard(false);
    fileName.textContent = 'No file selected';
    fileSize.textContent = 'Select a performance file to begin';
    statusText.textContent = 'Waiting for a file';

})

const scoreChart = document.getElementById('scoreChart');
const trendBadge = document.getElementById('trendBadge');

function updateChartArea() {
    scoreChart.innerHTML = ''; 

    const chronologicalData = userData.convertedRecords || [];

    if (!chronologicalData || chronologicalData.length === 0) {
        trendBadge.textContent = 'No data';
        scoreChart.innerHTML = `
            <div class="chart-placeholder">
                <div class="empty-state-icon" style="margin-bottom: 4px;">📈</div>
                <span>Score progression chart</span>
                <small>No trend data available</small>
            </div>
        `;
        return;
    }

    trendBadge.textContent = `${chronologicalData.length} Evaluations`;

    const recentData = chronologicalData.slice(-10);

    const width = 450;
    const height = 140;
    const padding = 20;

    const points = recentData.map((item, index) => {
        const x = padding + (index * (width - 2 * padding) / (recentData.length - 1));
        const pct = item.Percentage || ((item['Marks Obtained'] / item['Maximum Marks']) * 100);
        const y = height - padding - ((pct / 100) * (height - 2 * padding));
        return { x, y, pct: pct.toFixed(0), subject: item.Subject, date: item.Date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const chartHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
            <div style="position: relative; width: 100%; height: 160px;">
                <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
                            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    
                    <!-- Area Fill -->
                    <path d="${areaD}" fill="url(#chartGradient)" />
                    
                    <!-- Line -->
                    <path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
                    
                    <!-- Data Dots -->
                    ${points.map(p => `
                        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#60a5fa" stroke="#07090f" stroke-width="2"/>
                        <text x="${p.x}" y="${p.y - 8}" fill="#f8f9fc" font-size="9" font-weight="600" text-anchor="middle">${p.pct}%</text>
                    `).join('')}
                </svg>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0 10px; color: var(--text-muted); font-size: 11px; font-weight: 500;">
                <span>Earlier (${recentData[0].Date})</span>
                <span>Latest Recent Trend</span>
                <span>Recent (${recentData[recentData.length - 1].Date})</span>
            </div>
        </div>
    `;

    scoreChart.innerHTML = chartHTML;
}