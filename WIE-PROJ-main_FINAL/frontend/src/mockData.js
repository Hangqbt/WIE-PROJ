export const mockMovieList = [
  {
    id: 1,
    title: "The Inception",
    year: "2010",
    area: "U.S.",
    director: "Christopher Nolan",
    likes: 1250,
    dislikes: 120,
    posterUrl: "https://via.placeholder.com/300x450"
  },
  {
    id: 2,
    title: "Parasite",
    year: "2019",
    area: "Asia",
    director: "Bong Joon-ho",
    likes: 3400,
    dislikes: 50,
    posterUrl: "https://via.placeholder.com/300x450"
  },
  {
    id: 3,
    title: "Interstellar",
    year: "2014",
    area: "U.S.",
    director: "Christopher Nolan",
    likes: 2100,
    dislikes: 80,
    posterUrl: "https://via.placeholder.com/300x450"
  }
];

export const detailedMockMovie = {
  id: 1,
  title: "The Inception",
  year: "2010",
  country: "U.S.",
  director: "Christopher Nolan",
  posterUrl: "https://via.placeholder.com/300x450",
  summary: "A skilled thief uses dream-sharing technology to plant an idea in a target's subconscious.",
  genres: ["Sci-Fi", "Thriller", "Adventure"],
  upvotes: 1250,
  downvotes: 120,
  actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
  reviews: [
    {
      id: 1,
      account: "movie_fan_01",
      type: "upvote",
      comment: "Absolutely brilliant and mind-bending."
    },
    {
      id: 2,
      account: "cinema_lover",
      type: "downvote",
      comment: "Overly confusing and too long for my taste."
    }
  ]
};

export const mockUsers = [
  {
    id: 1,
    username: 'sampleuser',
    display_name: 'Sample User',
    description: 'Loves cinematic twists and character-driven stories.',
    followers: 12,
    comments: [
      { id: 1, movieId: 1, movieTitle: 'The Inception', text: 'The dream layers felt so immersive.' },
      { id: 2, movieId: 3, movieTitle: 'Interstellar', text: 'The emotional scale really landed for me.' }
    ]
  },
  {
    id: 2,
    username: 'moviecritic',
    display_name: 'Mina Cruz',
    description: 'A sharp-eyed watcher who compares stories across eras.',
    followers: 8,
    comments: [
      { id: 3, movieId: 2, movieTitle: 'Parasite', text: 'The social tension in this one is exceptional.' }
    ]
  },
  {
    id: 3,
    username: 'nightowl',
    display_name: 'Theo Brooks',
    description: 'Always looking for thoughtful sci-fi and slow-burn dramas.',
    followers: 5,
    comments: [
      { id: 4, movieId: 3, movieTitle: 'Interstellar', text: 'The visuals and soundtrack are unforgettable.' }
    ]
  },
  {
    id: 4,
    username: 'framehunter',
    display_name: 'Lina Park',
    description: 'Interested in visual storytelling and offbeat classics.',
    followers: 9,
    comments: [
      { id: 5, movieId: 1, movieTitle: 'The Inception', text: 'The pacing stays taut from start to finish.' }
    ]
  }
];