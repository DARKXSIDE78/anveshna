import React, { useState, useEffect } from 'react';
import Slideshow from '../components/home/slideshow';
import { fetchTrendingAnime, fetchPopularAnime, fetchTopAirAnime } from '../hooks/useAPI'; // Ensure the fetchTopAirAnime is imported correctly
import CardGrid from '../components/cards/cardItem';
import EpisodeCard from '../components/home/EpisodeCard';

const Home = () => {
  window.scrollTo(0, 0);

  const [activeTab, setActiveTab] = useState('TRENDING');
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const [trendingData, setTrendingData] = useState([]);
  const [popularData, setPopularData] = useState([]);
  const [topAirData, setTopAirData] = useState([]); // State for top airing data
  const [state, setState] = useState({ watchedEpisodes: [] });

  // Fetch Trending Anime
  useEffect(() => {
    fetchTrendingAnime()
      .then((trendingAnime) => {
        const data = trendingAnime
          .filter((anime) => anime.bannerImage)
          .map((anime) => ({
            id: anime.id,
            bannerImage: anime.bannerImage,
            title: anime.title.english || anime.title.romaji || 'No Title',
            title_romaji: anime.title.romaji,
            type: anime.format,
            totalEpisodes: anime.episodes,
            rating: anime.averageScore,
            duration: anime.duration,
            imageSrc: anime.coverImage.extraLarge,
            status: anime.status,
            color: anime.coverImage.color,
            releaseDate: anime.seasonYear,
          }));
        setTrendingData(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  // Fetch Watched Episodes from Local Storage
  useEffect(() => {
    const fetchWatchedEpisodes = () => {
      const watchedEpisodesData = localStorage.getItem('watched-episodes');
      if (watchedEpisodesData) {
        const allEpisodes = JSON.parse(watchedEpisodesData);
        const latestEpisodes = [];
        Object.keys(allEpisodes).forEach((animeId) => {
          const episodes = allEpisodes[animeId];
          const latestEpisode = episodes[episodes.length - 1];
          latestEpisodes.push(latestEpisode);
        });
        setState((prevState) => ({
          ...prevState,
          watchedEpisodes: latestEpisodes,
        }));
      }
    };

    fetchWatchedEpisodes();
  }, []);

  // Fetch Popular Anime
  useEffect(() => {
    fetchPopularAnime()
      .then((popularAnime) => {
        const data = popularAnime
          .map((anime) => ({
            id: anime.id,
            bannerImage: anime.bannerImage,
            title: anime.title.english || anime.title.romaji || 'No Title',
            title_romaji: anime.title.romaji,
            type: anime.format,
            totalEpisodes: anime.episodes,
            rating: anime.averageScore,
            duration: anime.duration,
            imageSrc: anime.coverImage.extraLarge,
            status: anime.status,
            color: anime.coverImage.color,
            releaseDate: anime.seasonYear,
          }));
        setPopularData(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  // Fetch Top Airing Anime
  useEffect(() => {
    fetchTopAirAnime()
      .then((topAirAnime) => {
        const data = topAirAnime
          .map((anime) => ({
            id: anime.id,
            bannerImage: anime.bannerImage,
            title: anime.title.english || anime.title.romaji || 'No Title',
            title_romaji: anime.title.romaji,
            type: anime.format,
            totalEpisodes: anime.episodes,
            rating: anime.averageScore,
            duration: anime.duration,
            imageSrc: anime.coverImage.extraLarge,
            status: anime.status,
            color: anime.coverImage.color,
            releaseDate: anime.seasonYear,
          }));
        setTopAirData(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  // Display data based on the selected tab
  const displayData = activeTab === 'TRENDING' ? trendingData : activeTab === 'POPULAR' ? popularData : topAirData;

  return (
    <div className="text-white my-16">
      <Slideshow />
      <EpisodeCard />
      <div className="flex md:flex-col">
        <div className="w-full mx-auto md:w-full p-4">
          <div className="flex mx-auto justify-center gap-4 my-8">
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
                activeTab === 'TRENDING' ? 'bg-[#333333] text-[var(--global-text)]' : 'bg-transparent text-[var(--global-text)] hover:bg-[#222222]'
              }`}
              onClick={() => handleTabClick('TRENDING')}
            >
              TRENDING
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
                activeTab === 'TOP AIRING' ? 'bg-[#333333] text-[var(--global-text)]' : 'bg-transparent text-[var(--global-text)] hover:bg-[#222222]'
              }`}
              onClick={() => handleTabClick('TOP AIRING')}
            >
              TOP AIRING
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
                activeTab === 'POPULAR' ? 'bg-[#333333] text-[var(--global-text)]' : 'bg-transparent text-[var(--global-text)] hover:bg-[#222222]'
              }`}
              onClick={() => handleTabClick('POPULAR')}
            >
              POPULAR
            </button>
          </div>
          <CardGrid animes={displayData} />
        </div>
      </div>
    </div>
  );
};

export default Home;
