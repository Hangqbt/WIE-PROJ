import { useEffect, useState } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';

const MovieSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const years = ['2026', '2025', '2024', '2023', 'Older'];

  const applyFilters = (movies, query = '', year = '') => {
    const normalizedQuery = query.toLowerCase();
    return movies.filter((movie) => {
      const matchTitle = movie.title.toLowerCase().includes(normalizedQuery);
      const matchYear = year
        ? year === 'Older'
          ? Number(movie.year) < 2023
          : String(movie.year) === year
        : true;
      return matchTitle && matchYear;
    });
  };

  const fetchMovies = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get('/api/movies', { params: { search: query } });
      const movies = response.data.movies || [];
      setAllMovies(movies);
      setSearchResults(applyFilters(movies, query, selectedYear));
    } catch {
      setAllMovies([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies('');
  }, []);

  useEffect(() => {
    setSearchResults(applyFilters(allMovies, searchQuery, selectedYear));
  }, [allMovies, searchQuery, selectedYear]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchResults(applyFilters(allMovies, searchQuery, selectedYear));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white shadow-md rounded-xl p-6 md:p-8 text-gray-800 border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full border-2 border-gray-300 rounded-full py-3 px-5 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button type="submit" className="absolute right-4 top-3 text-gray-400 hover:text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3 text-gray-700">Year</h3>
            <div className="flex flex-wrap gap-3">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year === selectedYear ? '' : year)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                    selectedYear === year ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Search Results</h2>

        {loading ? (
          <p className="text-gray-500">Loading movies...</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((movie) => (
              <MovieCard key={movie.movie_id || movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">No movies found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieSearch;
