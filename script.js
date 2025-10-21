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

      // assemble card
      card.appendChild(thumb)
      card.appendChild(title)
      card.appendChild(meta)

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