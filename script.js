// api config
const API_KEY = '3fcedd4f'
const OMDB_BASE = 'https://www.omdbapi.com/'

// tiny helper to select one element by CSS selector
const $ = selector => document.querySelector(selector)

// get key elements from the page
const form = $('#searchForm')
const input = $('#query')
const results = $('#results')

// simple utility to show a message in the results area
const renderMessage = text => {
  results.innerHTML = `<p>${text}</p>`
}

// listen to the form being submitted
form.addEventListener('submit', async event => {
  // prevent the default form submission action
  event.preventDefault()
  const query = input.value.trim()
  if (!query) {
    renderMessage('Type a movie title to search!')
    return
  }
  renderMessage(`Searching for: ${query}...`)
  try {
    const movies = await searchMovies(query)
    renderResults(movies)
  } catch (err) {
    renderMessage('Something went wrong - try again')
    console.error(err)
  }
})

// tiny mock database so we can test logic without a real api
const MOCK_MOVIES = [                                                         
  { title: 'Interstellar', year: 2014 },                                      
  { title: 'Inception', year: 2010 },                                         
  { title: 'Inside Out', year: 2015 },
  { title: 'Iron Man', year: 2008 }
]

// fake an async search that "takes time"
const mockMovieSearch = async query => {
  await new Promise(resolve => setTimeout(resolve, 500))
  const q = query.toLowerCase()
  return MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(q))
}

// normalize omdb shape to our simple shape
const toSimple = omdb => ({
  id: omdb.imdbID,
  title: omdb.Title,
  year: omdb.Year,
  poster: omdb.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : '' // empty string means "no usable poster"
})

// render a simple list of results
const renderResults = movies => {
  if (!movies || movies.length === 0) {
    renderMessage('No results - try another search?')
    return
  }
  results.innerHTML = ''
  movies
    .map(toSimple)
    .forEach(m => {
      const card = document.createElement('article')
      card.className = 'card'

      // poster(or simple text fallback)
      const thumb = m.poster
      ? document.createElement('img')
      : document.createElement('div')

      if (m.poster) {
        thumb.src = m.poster
        thumb.alt = m.title
        thumb.className = 'thumb'
      } else {
        thumb.className = 'thumb'
        thumb.textContent = 'No Poster'
      }

      // title and year
      const title = document.createElement('h2')
      title.textContent = m.title

      const meta = document.createElement('div')
      meta.className = 'meta'
      meta.textContent = m.year

      // details button
      const btn = document.createElement('button')
      btn.textContent = 'Details'
      btn.className = 'btn'

      // fetch details and open modal when clicked
      btn.addEventListener('click', async () => {
        try {
          showOverlayLoading('Loading details...')
          const data = await fetchMovieById(m.id)
          showOverlayDetails(data)
        } catch (err) {
          showOverlayLoading(err.message || 'Could not load details')
          console.error(err)
        }
      })

      // assemble card
      card.appendChild(thumb)
      card.appendChild(title)
      card.appendChild(meta)
      card.appendChild(btn)

      results.appendChild(card)
    })
}

// search the real OMDB api
const searchMovies = async query => {
  const url = `${OMDB_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`
  
  const res = await fetch(url)
  if (!res.ok) throw new Error(`network error: ${res.status}`)

  const data = await res.json()
  console.log('OMDb response:', data)

  if (data.Response === 'False') {
    throw new Error(data.Error || 'Unknown OMDb error')
  }

  return data.Search || []
}

// fetch a single movie by imdb id with full plot 
const fetchMovieById = async id => {
  const url = `${OMDB_BASE}?apikey=${API_KEY}&i=${encodeURIComponent(id)}&plot=full`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`network error: ${res.status}`)
  }

  const data = await res.json()
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Could not load details')
  }

  return data
}

// get the overlay root from the DOM
const getOverlay = () => document.querySelector('#overlay')

// Open overlay with a given node
const openOverlayWith = node => {
  const overlay = getOverlay()
  overlay.innerHTML = '' 
  overlay.appendChild(node)
  overlay.removeAttribute('hidden')
  overlay.setAttribute('aria-hidden', 'false')
  overlay.addEventListener('click', onBackdropClick)
  document.addEventListener('keydown', onEsc)
}

// Close the overlay
const closeOverlay = () => {
  const overlay = getOverlay()
  overlay.setAttribute('hidden', 'true')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.removeEventListener('click', onBackdropClick)
  document.removeEventListener('keydown', onEsc)
}

// Close when clicking outside the panel
const onBackdropClick = e => {
  const overlay = getOverlay()
  if (e.target === overlay) {
    closeOverlay()
  }
}

// Close when pressing Escape
const onEsc = e => {
  if (e.key === 'Escape') {
    closeOverlay()
  }
}

// Show a loading panel
const showOverlayLoading = text => {
  const panel = document.createElement('div')
  panel.className = 'overlay__panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.innerHTML = `
    <div class="overlay__placeholder">...</div>
    <div><p>${text || 'Loading...'}</p></div>
  `
  openOverlayWith(panel)
}

// show the details panel using full OMDb data
const showOverlayDetails = data => {
  const posterHtml = data.Poster && data.Poster !== 'N/A'
    ? `<img class="overlay__poster" src="${data.Poster}" alt="${data.Title}">`
    : `<div class="overlay__placeholder">No poster</div>`

  const ratings = Array.isArray(data.Ratings)
    ? data.Ratings.map(r => `<span class="pill">${r.Source}: ${r.Value}</span>`).join('')
    : ''

  const panel = document.createElement('div')
  panel.className = 'overlay__panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
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
  openOverlayWith(panel)
  panel.querySelector('#overlayClose').addEventListener('click', closeOverlay)
}