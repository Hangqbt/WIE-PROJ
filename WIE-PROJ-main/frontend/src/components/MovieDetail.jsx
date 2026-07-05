import { useState } from 'react';
import { detailedMockMovie } from '../mockData';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const MovieDetail = () => {
  const movie = detailedMockMovie;

  const [userInteraction, setUserInteraction] = useState(null); // 'upvote', 'downvote', null

  // like / dislike logic
  const handleVote = (type) => {
    // 
    setUserInteraction(type === userInteraction ? null : type);
    
    // call backend API：
    // POST /api/movies/:movieId/reviews
    // data: { type: type, reason: "user input reason" }
    // put movie into like / dislike list
    
    console.log(`User ${type === userInteraction ? 'removed' : 'added'} ${type} for ${movie.title}.`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white shadow-xl rounded-2xl mt-12 border border-gray-100">
      
      {/* 1. Movie detail on top (Img & Title/director/Year/Country/Actor/Actress/Summary/genre) */}
      <div className="md:flex md:gap-10">
        {/* Image at left) */}
        <div className="md:w-1/3 flex-shrink-0 mb-6 md:mb-0">
          <img 
            src={movie.posterUrl} 
            alt={`Poster for ${movie.title}`} 
            className="w-full h-auto rounded-lg shadow-md border-2 border-gray-200"
          />
        </div>

        {/* Text on right side */}
        <div className="md:w-2/3 space-y-4 text-gray-700">
          <h1 className="text-3xl font-extrabold text-gray-900">{movie.title}</h1>
          
          {/* director / Year / Country */}
          <p className="text-base font-medium text-gray-600">
            {movie.director} / {movie.year} / {movie.country}
          </p>
          
          {/* Actor/Actress ... */}
          <p className="text-sm font-light text-gray-500">
            <span className="font-semibold text-gray-600">Actors:</span> {movie.actors.join(', ')} ...
          </p>
          
          {/* Summary ... */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {movie.summary}
            </p>
          </div>
          
          {/* genre ... */}
          <div className="flex flex-wrap gap-2 pt-2">
            {movie.genres.map(genre => (
              <span 
                key={genre} 
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. like / dislike botton */}
      <div className="grid grid-cols-2 gap-4 mt-10">
        <button 
          onClick={() => handleVote('upvote')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-200 ${
            userInteraction === 'upvote'
              ? 'bg-blue-500 text-white border-blue-500 shadow-md scale-[1.02]'
              : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className="h-5 w-5" />
          <span className="font-semibold">Good</span> 
          <span className="text-xs ml-1 opacity-70">({movie.upvotes})</span>
        </button>
        
        <button 
          onClick={() => handleVote('downvote')}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-200 ${
            userInteraction === 'downvote'
              ? 'bg-red-500 text-white border-red-500 shadow-md scale-[1.02]'
              : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <ThumbsDown className="h-5 w-5" />
          <span className="font-semibold">Bad</span>
          <span className="text-xs ml-1 opacity-70">({movie.downvotes})</span>
        </button>
      </div>

      {/* 3. Comments */}
      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Reviews & Reasons</h2>
        
        {movie.reviews.map(review => (
          <div 
            key={review.id} 
            className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
          >
            {/* Good / bad at left */}
            <div className={`p-3 rounded-full flex-shrink-0 ${
              review.type === 'upvote' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
            }`}>
              {review.type === 'upvote' ? (
                <ThumbsUp className="h-6 w-6" />
              ) : (
                <ThumbsDown className="h-6 w-6" />
              )}
            </div>
            
            {/* Account & comment ... at right */}
            <div className="space-y-1">
              <p className="font-semibold text-gray-800">{review.account}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {review.comment}
              </p>
            </div>
          </div>
        ))}
        
        {movie.reviews.length === 0 && (
          <p className="text-center text-gray-500 py-6">No reviews yet.</p>
        )}
      </div>

    </div>
  );
};

export default MovieDetail;