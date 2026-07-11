import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  return (
    <Link
      to={`/movie/${movie.movie_id || movie.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center overflow-hidden">
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{movie.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{movie.director} • {movie.year}</p>
        <p className="mt-3 text-sm text-gray-600 leading-6">
          {movie.description || 'Open this movie to read comments and leave your own review.'}
        </p>
      </div>
    </Link>
  );
};

export default MovieCard;
