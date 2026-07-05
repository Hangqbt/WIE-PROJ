import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MovieSearch from './components/MovieSearch';
import MovieDetail from './components/MovieDetail';

function App() {
  return (
    <Router>
      <div className="p-4 bg-gray-100 min-h-screen">
        {/* simple tool bar */}
        <nav className="mb-4">
          <Link to="/" className="mr-4 text-blue-500 underline">Search Page</Link>
          <Link to="/movie/1" className="text-blue-500 underline">Movie Page</Link>
        </nav>

        <Routes>
          <Route path="/" element={<MovieSearch />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;