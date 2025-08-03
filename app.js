// API configuration
const API_KEY = 'f1f56885c0034ac0a379f2c04168ee0f';
const BASE_URL = 'https://newsapi.org/v2';

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const statsBtn = document.getElementById('statsBtn');
const terminalStats = document.getElementById('terminalStats');
const closeStats = document.getElementById('closeStats');
const articleCount = document.getElementById('articleCount');
const lastUpdated = document.getElementById('lastUpdated');
const loaderOverlay = document.getElementById('loaderOverlay');
const themeSwitcher = document.getElementById('themeSwitcher');

// State
let currentCategory = 'all';
let articles = [];
let isSearching = false;
let currentQuery = '';
let currentPage = 1;
const PAGE_SIZE = 12;
let isLoading = false;

// Format to readable date
function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return new Date(dateString).toLocaleString('en-US', options);
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Load and initialize
window.addEventListener('DOMContentLoaded', () => {
  loadThemePreference();
  setTimeout(() => {
    hideLoader();
    fetchNews();
  }, 1000);
  setupInfiniteScroll();
});

function loadThemePreference() {
  const savedTheme = localStorage.getItem('yash_news_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeSwitcher) themeSwitcher.textContent = '🌙';
  }
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('yash_news_theme', theme);
  themeSwitcher.textContent = theme === 'light' ? '🌙' : '☀️';
}

async function fetchNews(query = '', category = '', page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;
  showLoader();
  try {
    isSearching = !!query;
    currentQuery = query;
    let url = `${BASE_URL}/top-headlines?language=en&apiKey=${API_KEY}`;

    if (query) {
      url = `${BASE_URL}/everything?q=${query}&apiKey=${API_KEY}`;
    } else if (category && category !== 'all') {
      url += `&category=${category}`;
    }

    url += `&pageSize=${PAGE_SIZE}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok') {
      if (append) {
        articles = [...articles, ...data.articles];
      } else {
        articles = data.articles;
      }
      displayNews(data.articles, append);
      updateStats(articles);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    newsGrid.innerHTML = `
      <div class="error-box">
        <p>⚠️ ${error.message}</p>
        <div class="credits">
          <p><strong>Site Developed by Yaswanth Koppanathi</strong></p>
          <p><a href="https://www.linkedin.com/in/yaswanth-koppanathi-ai/" target="_blank">LinkedIn</a> | <a href="https://github.com/yaswanth-koppanathi-ai" target="_blank">GitHub</a> | <a href="mailto:yaswanthkoppanathi24@gmail.com">Email</a></p>
        </div>
      </div>`;
  } finally {
    isLoading = false;
    hideLoader();
  }
}

function displayNews(articles, append = false) {
  if (!append) newsGrid.innerHTML = '';
  if (articles.length === 0) {
    newsGrid.innerHTML = `<p class="error">No articles found.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  articles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'news-card';
    const imgSrc = article.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image';
    const published = article.publishedAt ? formatDate(article.publishedAt) : 'Unknown';
    const relative = article.publishedAt ? getRelativeTime(article.publishedAt) : 'Just now';

    card.innerHTML = `
      <img src="${imgSrc}" alt="news image">
      <div class="news-card-content">
        <div style="font-size: 0.85rem; color: #888;">${relative}</div>
        <h3>${article.title || 'No title'}</h3>
        <p>${article.description || 'No description available.'}</p>
        <a class="read-more-btn" href="${article.url}" target="_blank">Read Full Article</a>
      </div>
    `;
    fragment.appendChild(card);
  });
  newsGrid.appendChild(fragment);
}

function updateStats(articles) {
  if (articleCount) articleCount.textContent = articles.length;
  if (lastUpdated) lastUpdated.textContent = formatDate(new Date().toISOString());
}

function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      currentPage++;
      fetchNews(currentQuery, currentCategory, currentPage, true);
    }
  });
}

function showLoader() {
  if (loaderOverlay) loaderOverlay.style.display = 'flex';
}

function hideLoader() {
  if (loaderOverlay) loaderOverlay.style.display = 'none';
}

// Event Listeners
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1;
      fetchNews(query);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1;
        fetchNews(query);
      }
    }
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    currentPage = 1;
    fetchNews('', currentCategory);
  });
});

if (statsBtn && terminalStats) {
  statsBtn.addEventListener('click', () => terminalStats.style.display = 'block');
}

if (closeStats) {
  closeStats.addEventListener('click', () => terminalStats.style.display = 'none');
}

if (themeSwitcher) {
  themeSwitcher.addEventListener('click', toggleTheme);
}