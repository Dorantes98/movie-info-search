/**
 * Movie Search Application
 * 
 * This script handles the core functionality of searching for movies using the OMDb API,
 * displaying results in a grid, and showing detailed information in a modal overlay.
 * 
 * Key Features:
 * - Search movies by title using OMDb API
 * - Display results in a responsive card grid
 * - Show detailed movie information in an accessible modal
 * - Handle loading states and errors gracefully
 */

// ============================================================================
// API Configuration
// ============================================================================

/*
 * OMDb API key for authentication
 */
const API_KEY = '3fcedd4f'

/*
 * Base URL for all OMDb API requests
 */
const OMDB_BASE = 'https://www.omdbapi.com/'

// ============================================================================
// DOM Utilities
// ============================================================================

/**
 * Utility function to select a single DOM element
 * Shorthand for document.querySelector() to reduce verbosity
 * 
 * @param {string} selector - CSS selector string
 * @returns {Element|null} The first matching element or null
 */
const $ = selector => document.querySelector(selector)

// ============================================================================
// DOM Element References
// ============================================================================

/*
 * Main search form element
 * Listens for submit events to trigger movie searches
 */
const form = $('#searchForm')

/*
 * Search input field where users type movie titles
 */
const input = $('#query')

/**
 * Container element where search results are rendered
 * Gets cleared and repopulated with each new search
 */
const results = $('#results')

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * Display a simple text message in the results area
 * Used for loading states, errors, and empty states
 * 
 * @param {string} text - The message to display to the user
 * 
 * Why needed: Provides consistent way to show feedback to users when
 * there are no movie cards to display (loading, errors, no results)
 */
const renderMessage = text => {
  results.innerHTML = `<p>${text}</p>`
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle form submission to search for movies
 * 
 * Flow:
 * 1. Prevent default form submission (page reload)
 * 2. Validate user input
 * 3. Show loading state
 * 4. Fetch movie data from API
 * 5. Render results or show error
 * 
 * Why needed: This is the main entry point for user interaction,
 * coordinating the entire search workflow
 */
form.addEventListener('submit', async event => {
  // Prevent the browser from reloading the page (default form behavior)
  event.preventDefault()

  // Get the search query and remove leading/trailing whitespace
  const query = input.value.trim()

  // Validate that user entered something
  if (!query) {
    renderMessage('Type a movie title to search!')
    return
  }

  // Show immediate feedback that search is in progress
  renderMessage(`Searching for: ${query}...`)
  
  try {
    // Fetch movies from OMDb API (async operation)
    const movies = await searchMovies(query)
    // Display the results in a grid of cards
    renderResults(movies) 
  } catch (err) {
    // If anything goes wrong, show friendly error message
    renderMessage('Something went wrong - try again')
    // Log the actual error for debugging purposes
    console.error(err)
  }
})

// ============================================================================
// Mock Data (for testing without API calls)
// ============================================================================

/**
 * Sample movie data for testing UI without making real API calls
 * Useful during development to avoid hitting API rate limits
 * 
 * Why included: Allows rapid iteration on UI without API dependency
 */
const MOCK_MOVIES = [                                                         
  { title: 'Interstellar', year: 2014 },                                      
  { title: 'Inception', year: 2010 },                                         
  { title: 'Inside Out', year: 2015 },
  { title: 'Iron Man', year: 2008 }
]

/**
 * Simulate an async API search using mock data
 * Returns movies that match the query string (case-insensitive)
 * 
 * @param {string} query - Search term to filter movies
 * @returns {Promise<Array>} Filtered array of mock movies
 * 
 * Why needed: Allows testing search functionality offline without real API
 */
const mockMovieSearch = async query => {
  // Simulate network delay with setTimeout
  await new Promise(resolve => setTimeout(resolve, 500))
  // Convert query to lowercase for case-insensitive matching
  const q = query.toLowerCase()
  // Return movies whose titles contain the query string
  return MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(q))
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform OMDb API response into simplified internal format
 * 
 * Why needed: OMDb uses capitalized property names (Title, Year, etc.)
 * and includes many fields we don't need. This normalizes the data
 * to a simpler, consistent format throughout our app.
 * 
 * @param {Object} omdb - Raw movie object from OMDb API
 * @param {string} omdb.imdbID - Unique IMDb identifier
 * @param {string} omdb.Title - Movie title
 * @param {string} omdb.Year - Release year
 * @param {string} omdb.Poster - URL to poster image or "N/A"
 * @returns {Object} Simplified movie object with lowercase properties
 */
const toSimple = omdb => ({
  id: omdb.imdbID,
  title: omdb.Title,
  year: omdb.Year,
  // Only include poster URL if it exists and isn't "N/A"
  // Empty string signals "no usable poster" to the render function
  poster: omdb.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : ''
})

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render search results as a grid of movie cards
 * 
 * Flow:
 * 1. Check if results are empty
 * 2. Clear previous results
 * 3. Transform each movie to simple format
 * 4. Create and append card elements for each movie
 * 
 * Why needed: This is the main UI rendering function that creates
 * the visual representation of search results
 * 
 * @param {Array<Object>} movies - Array of movie objects from API
 */
const renderResults = movies => {
  if (!movies || movies.length === 0) {
    // Handle empty results gracefully
    renderMessage('No results - try another search?')
    return
  }
  // Clear any previous content (old results or messages)
  results.innerHTML = ''
  // Process each movie and create a card
  movies
    .map(toSimple)  // Convert to our internal format
    .forEach(m => {
      // Create the card container
      const card = document.createElement('article')
      card.className = 'card'

      // Create poster element (image or placeholder)
      const thumb = m.poster
      ? document.createElement('img')
      : document.createElement('div')

      if (m.poster) {
        // Movie has a poster - create an image element
        thumb.src = m.poster
        thumb.alt = m.title // Accessibility: describe the image
        thumb.className = 'thumb'
      } else {
        // No poster available - create a placeholder div
        thumb.className = 'thumb'
        thumb.textContent = 'No Poster'
      }

      // Create title heading
      const title = document.createElement('h2')
      title.textContent = m.title

      // Create year metadata
      const meta = document.createElement('div')
      meta.className = 'meta'
      meta.textContent = m.year

      // Create details button
      const btn = document.createElement('button')
      btn.textContent = 'Details'
      btn.className = 'btn'

      /**
       * Handle click on Details button
       * Fetches full movie details and opens modal overlay
       * 
       * Why async: Needs to wait for API response before showing modal
       */
      btn.addEventListener('click', async () => {
        try {
          // Show loading state in modal immediately
          showOverlayLoading('Loading details...')

          // Fetch complete movie data including plot
          const data = await fetchMovieById(m.id)

          // Replace loading state with actual details
          showOverlayDetails(data)
        } catch (err) {
          // Show error message in modal if fetch fails
          showOverlayLoading(err.message || 'Could not load details')
          console.error(err)
        }
      })

      // Assemble the card by adding all elements in order
      card.appendChild(thumb)
      card.appendChild(title)
      card.appendChild(meta)
      card.appendChild(btn)

      // Add the completed card to the results container
      results.appendChild(card)
    })
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search for movies by title using the OMDb API
 * 
 * API Endpoint: /?apikey=KEY&s=QUERY
 * The 's' parameter searches by title
 * 
 * @param {string} query - Movie title to search for
 * @returns {Promise<Array<Object>>} Array of movie search results
 * @throws {Error} If network fails or API returns error
 * 
 * Why needed: This is the main API integration point for searching movies
 */
const searchMovies = async query => {
  // Build the API URL with encoded query parameter
  const url = `${OMDB_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`
  
  // Make HTTP GET request to OMDb
  const res = await fetch(url)
  // Check if request was successful (status 200-299)
  if (!res.ok) throw new Error(`network error: ${res.status}`)
  
  // Parse JSON response body
  const data = await res.json()
  console.log('OMDb response:', data)  // Debug logging

  // OMDb returns Response: "False" on errors (weird API design)
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Unknown OMDb error')
  }

  // Return the Search array (or empty array if somehow missing)
  return data.Search || []
}

/**
 * Fetch complete details for a single movie by IMDb ID
 * 
 * API Endpoint: /?apikey=KEY&i=ID&plot=full
 * The 'i' parameter gets movie by ID
 * The 'plot=full' parameter requests full plot text instead of short version
 * 
 * @param {string} id - IMDb ID (format: tt1234567)
 * @returns {Promise<Object>} Complete movie details object
 * @throws {Error} If network fails or movie not found
 * 
 * Why needed: Search only returns basic info. This gets full details
 * including plot, ratings, director, etc. for the modal display
 */
const fetchMovieById = async id => {
  // Build URL with ID and request full plot
  const url = `${OMDB_BASE}?apikey=${API_KEY}&i=${encodeURIComponent(id)}&plot=full`

  // Make HTTP GET request
  const res = await fetch(url)
  // Check for network errors
  if (!res.ok) {
    throw new Error(`network error: ${res.status}`)
  }

  // Parse response as JSON
  const data = await res.json()
  // Check for API-level errors
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Could not load details')
  }

  return data
}

// ============================================================================
// Modal/Overlay Functions
// ============================================================================

/**
 * Get reference to the overlay DOM element
 * 
 * @returns {Element} The overlay/modal root element
 * 
 * Why a function: Allows for flexibility if we need to add caching
 * or validation logic later
 */
const getOverlay = () => document.querySelector('#overlay')

/**
 * Open the modal overlay with given content
 * Sets up accessibility attributes and event listeners
 * 
 * @param {HTMLElement} node - DOM node to display inside overlay
 * 
 * Why needed: Centralizes the logic for opening modal with proper
 * accessibility and event handling setup
 */
const openOverlayWith = node => {
  // Clear any previous modal content
  overlay.innerHTML = '' 
  
  // Add the new content node
  overlay.appendChild(node)
  
  // Make overlay visible
  overlay.removeAttribute('hidden')
  
  // Update accessibility attribute for screen readers
  overlay.setAttribute('aria-hidden', 'false')
  
  // Enable close-on-backdrop-click
  overlay.addEventListener('click', onBackdropClick)
  
  // Enable close-on-escape-key
  document.addEventListener('keydown', onEsc)
}

/** 
 * Close the modal overlay
 * Hides the overlay and cleans up event listeners
 * 
 * Why needed: Centralizes cleanup logic to prevent memory leaks
 * from accumulated event listeners
 */
const closeOverlay = () => {
  const overlay = getOverlay()
  
  // Hide the overlay
  overlay.setAttribute('hidden', 'true')
  
  // Update accessibility state
  overlay.setAttribute('aria-hidden', 'true')
  
  // Remove event listeners to prevent memory leaks
  overlay.removeEventListener('click', onBackdropClick)
  document.removeEventListener('keydown', onEsc)
}

/**
 * Handle clicks on the overlay backdrop
 * Closes modal only if clicking outside the panel (on the backdrop itself)
 * 
 * @param {MouseEvent} e - Click event object
 * 
 * Why needed: Allows intuitive "click outside to close" behavior
 * while keeping modal open when clicking content inside
 */
const onBackdropClick = e => {
  const overlay = getOverlay()

  // Only close if clicking the overlay itself, not children
  if (e.target === overlay) {
    closeOverlay()
  }
}

/** 
 * Handle Escape key press to close modal
 * 
 * @param {KeyboardEvent} e - Keyboard event object
 * 
 * Why needed: Provides accessible keyboard navigation
 * Standard UX pattern for closing modals
 */
const onEsc = e => {
  if (e.key === 'Escape') {
    closeOverlay()
  }
}

/**
 * Show a loading message in the modal
 * Used while fetching movie details
 * 
 * @param {string} text - Loading message to display
 * 
 * Why needed: Provides immediate visual feedback when user clicks
 * Details button, before API response arrives
 */
const showOverlayLoading = text => {
  // Create the modal panel structure
  const panel = document.createElement('div')
  panel.className = 'overlay__panel'

  // Set accessibility attributes for screen readers
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')

  // Add simple loading UI
  panel.innerHTML = `
    <div class="overlay__placeholder">...</div>
    <div><p>${text || 'Loading...'}</p></div>
  `
  // Open modal with loading content
  openOverlayWith(panel)
}

/**
 * Display complete movie details in the modal
 * Creates a rich UI with poster, plot, ratings, etc.
 * 
 * @param {Object} data - Complete movie object from OMDb API
 * 
 * Why needed: This is the main "details view" that shows all
 * the information users requested when clicking Details button
 */
const showOverlayDetails = data => {
  // Build poster HTML - image or placeholder
  const posterHtml = data.Poster && data.Poster !== 'N/A'
    ? `<img class="overlay__poster" src="${data.Poster}" alt="${data.Title}">`
    : `<div class="overlay__placeholder">No poster</div>`

  // Build ratings pills from the Ratings array
  const ratings = Array.isArray(data.Ratings)
    ? data.Ratings.map(r => `<span class="pill">${r.Source}: ${r.Value}</span>`).join('')
    : ''
  // Create the modal panel element
  const panel = document.createElement('div')
  panel.className = 'overlay__panel'

  // Set accessibility attributes
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')

  // Build complete modal HTML structure
  panel.innerHTML = `
    <div>${posterHtml}</div>
    <div>
      <div class="overlay__header">
        <h2 style="margin:0">${data.Title} <span style="font-size:14px;color:#cbd5e1">(${data.Year || 'N/A'})</span></h2>
        <button class="btn" id="overlayClose">Close</button>
      </div>
      <div class="pills">
        <span class="pill">${data.Rated || 'Unrated'}</span>
        <span class="pill">${data.Runtime || 'N/A'}</span>
        <span class="pill">${data.Genre || ''}</span>
      </div>
      <p style="margin:8px 0 0 0;color:#cbd5e1">${data.Plot || 'No plot available.'}</p>
      <div class="pills" style="margin-top:10px">${ratings}</div>
      <p class="meta" style="margin-top:10px">Director: ${data.Director || 'Unknown'}</p>
      <p class="meta">IMDb: ${data.imdbID}</p>
    </div>
  `

  // Open the modal with details content
  openOverlayWith(panel)

  // Attach close handler to the Close button
  panel.querySelector('#overlayClose').addEventListener('click', closeOverlay)
}