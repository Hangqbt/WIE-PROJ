import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const MovieCard = ({ movie }) => {
  return (
    // link on the whole part, click to go to the movie detail page
    <Link 
      to={`/movie/${movie.id}`} 
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* movie image (now gray) */}
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center overflow-hidden">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400">No Image</span>
        )}
      </div>

      {/* movie information */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{movie.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {movie.director} • {movie.year} • {movie.area}
        </p>

        {/* like / dislike total */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-1 text-blue-600">
            <ThumbsUp className="w-4 h-4" />
            <span className="font-medium">{movie.likes}</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <ThumbsDown className="w-4 h-4" />
            <span className="font-medium">{movie.dislikes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;