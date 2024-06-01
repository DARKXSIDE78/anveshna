import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import styled from 'styled-components';
import Image404URL from '../images/404-mobile.png';
import { fetchAnimeEmbeddedEpisodes, fetchAnimeEpisodes, fetchAnimeDetails } from '../hooks/useAPI';
import EpisodeList from '../components/watch/episodeList';
import Player from '../components/watch/video/player';
import EmbedPlayer from '../components/watch/video/embedPlayer';
import WatchAnimeData from '../components/watch/WatchAnimeData';
import AnimeDataList from '../components/watch/animeDataList';
import SkeletonLoader from '../components/skeletons/skeletons';
import { MediaSource } from '../components/watch/video/mediaSource';


const WatchContainer = styled.div ``;
const WatchWrapper = styled.div `
  font-size: 0.9rem;
  gap: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--global-primary-bg);
  color: var(--global-text);

  @media (min-width: 1000px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;
const DataWrapper = styled.div `
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr; // Aim for a 3:1 ratio
  width: 100%; // Make sure this container can expand enough
  @media (max-width: 1000px) {
    grid-template-columns: auto;
  }
`;
const SourceAndData = styled.div `
  width: ${({ $videoPlayerWidth }) => $videoPlayerWidth};
`;
const RalationsTable = styled.div `
  padding: 0;
  margin-top: 1rem;
  @media (max-width: 1000px) {
    margin-top: 0rem;
  }
`;
const VideoPlayerContainer = styled.div `
  position: relative;
  width: 100%;
  border-radius: var(--global-border-radius);

  @media (min-width: 1000px) {
    flex: 1 1 auto;
  }
`;
const EpisodeListContainer = styled.div `
  width: 100%;
  max-height: 100%;

  @media (min-width: 1000px) {
    flex: 1 1 500px;
    max-height: 100%;
  }

  @media (max-width: 1000px) {
    padding-left: 0rem;
  }
`;
const NoEpsFoundDiv = styled.div `
  text-align: center;
  margin-top: 10rem;
  margin-bottom: 10rem;
  @media (max-width: 1000px) {
    margin-top: 2.5rem;
    margin-bottom: 6rem;
  }
`;
const NoEpsImage = styled.div `
  margin-bottom: 3rem;
  max-width: 100%;

  img {
    border-radius: var(--global-border-radius);
    max-width: 100%;
    @media (max-width: 500px) {
      max-width: 70%;
    }
  }
`;
const StyledHomeButton = styled.button `
  color: white;
  border-radius: var(--global-border-radius);
  border: none;
  background-color: var(--primary-accent);
  margin-top: 0.5rem;
  font-weight: bold;
  padding: 1rem;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease-in-out;
  &:hover,
  &:active,
  &:focus {
    transform: translate(-50%, -50%) scale(1.05);
  }
  &:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
`;
const IframeTrailer = styled.iframe `
  position: relative;
  border-radius: var(--global-border-radius);
  border: none;
  top: 0;
  left: 0;
  width: 70%;
  height: 100%;
  text-items: center;
  @media (max-width: 1000px) {
    width: 100%;
    height: 100%;
  }
`;
const LOCAL_STORAGE_KEYS = {
    LAST_WATCHED_EPISODE: 'last-watched-',
    WATCHED_EPISODES: 'watched-episodes-',
    LAST_ANIME_VISITED: 'last-anime-visited',
};

//pass seconds using anilist info 

const useCountdown = (seconds) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
      if (!seconds && seconds !== 0) {
          return; // Exit early if seconds is null or undefined
      }

      const targetTime = Date.now() + seconds;

      const timer = setInterval(() => {
          const now = Date.now();
          const distance = targetTime - now;

          if (distance < 0) {
              clearInterval(timer);
              setTimeLeft('Airing now or aired');
              return;
          }

          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          setTimeLeft(`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
      }, 1000);

      return () => clearInterval(timer);
  }, [seconds]);

  return timeLeft;
};



const Watch = () => {
  const videoPlayerContainerRef = useRef(null);
  const [videoPlayerWidth, setVideoPlayerWidth] = useState('100%');
  const getSourceTypeKey = (animeId) => `source-[${animeId}]`;
  const getLanguageKey = (animeId) => `subOrDub-[${animeId}]`;
  const updateVideoPlayerWidth = useCallback(() => {
      if (videoPlayerContainerRef.current) {
          const width = `${videoPlayerContainerRef.current.offsetWidth}px`;
          setVideoPlayerWidth(width);
      }
  }, [setVideoPlayerWidth, videoPlayerContainerRef]);
  const [maxEpisodeListHeight, setMaxEpisodeListHeight] = useState('100%');
  const { animeId, animeTitle, episodeNumber } = useParams();
  const STORAGE_KEYS = {
      SOURCE_TYPE: `source-[${animeId}]`,
      LANGUAGE: `subOrDub-[${animeId}]`,
  };
  const navigate = useNavigate();
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState({
      id: '0',
      number: 1,
      title: '',
      image: '',
      description: '',
      imageHash: '',
      airDate: '',
  });
  const [animeInfo, setAnimeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false);
  const [showNoEpisodesMessage, setShowNoEpisodesMessage] = useState(false);
  const [lastKeypressTime, setLastKeypressTime] = useState(0);
  const [sourceType, setSourceType] = useState(() => localStorage.getItem(STORAGE_KEYS.SOURCE_TYPE) || 'default');
  const [embeddedVideoUrl, setEmbeddedVideoUrl] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'sub');
  const [downloadLink, setDownloadLink] = useState('');
  const nextEpisodeAiringTime = animeInfo && animeInfo?.nextair?.timeUntilAiring 
      ? animeInfo?.nextair?.timeUntilAiring * 1000
      : null;
  const nextEpisodenumber = animeInfo?.nextAiringEpisode?.episode;
  const countdown = useCountdown(nextEpisodeAiringTime);
  const currentEpisodeIndex = episodes.findIndex((ep) => ep.id === currentEpisode.id);
  const [languageChanged, setLanguageChanged] = useState(false);
  //----------------------------------------------MORE VARIABLES----------------------------------------------
  const GoToHomePageButton = () => {
      const navigate = useNavigate();
      const handleClick = () => {
          navigate('/home');
      };
      return (<StyledHomeButton onClick={handleClick}>Go back Home</StyledHomeButton>);
  };

  //FETCH VIDSTREAMING VIDEO
  const fetchVidstreamingUrl = async (episodeId) => {
    try {
        const embeddedServers = await fetchAnimeEmbeddedEpisodes(episodeId);
        if (embeddedServers && embeddedServers.length > 0) {
            const vidstreamingServer = embeddedServers.find((server) => server.name === 'Vidstreaming');
            const selectedServer = vidstreamingServer || embeddedServers[0];
            setEmbeddedVideoUrl(selectedServer);
        }
    }
    catch (error) {
        console.error('Error fetching Vidstreaming servers for episode ID:', episodeId, error);
    }
};
//FETCH GOGO VIDEO
const fetchEmbeddedUrl = async (episodeId) => {
    try {
        const embeddedServers = await fetchAnimeEmbeddedEpisodes(episodeId);
        if (embeddedServers && embeddedServers.length > 0) {
            const gogoServer = embeddedServers.find((server) => server.name === 'Gogo server');
            const selectedServer = gogoServer || embeddedServers[1];
            setEmbeddedVideoUrl(selectedServer);
        }
    }
    catch (error) {
        console.error('Error fetching gogo servers for episode ID:', episodeId, error);
    }
};
//SAVE TO LOCAL STORAGE NAVIGATED/CLICKED EPISODES
const updateWatchedEpisodes = (episode) => {
  console.log(animeId, episode, "here us the episode")
  const watchedEpisodesJson = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId);
  const watchedEpisodes = watchedEpisodesJson
      ? JSON.parse(watchedEpisodesJson)
      : [];
  if (!watchedEpisodes.some((ep) => ep.id === episode.id)) {
      watchedEpisodes.push(episode);
      localStorage.setItem(LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId, JSON.stringify(watchedEpisodes));
  }
};

// UPDATES CURRENT EPISODE INFORMATION, UPDATES WATCHED EPISODES AND NAVIGATES TO NEW URL
const handleEpisodeSelect = useCallback(async (selectedEpisode) => {
  setIsEpisodeChanging(true);
  const animeTitle = selectedEpisode.id.split('-episode')[0];
  setCurrentEpisode({
      id: selectedEpisode.id,
      number: selectedEpisode.number,
      title: selectedEpisode.title,
      airDate: selectedEpisode.airDate,
  });
  localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId, JSON.stringify({
      id: selectedEpisode.id,
      title: selectedEpisode.title,
      number: selectedEpisode.number,
  }));
  updateWatchedEpisodes(selectedEpisode);
  navigate(`/watch/${animeId}/${encodeURI(animeInfo.id_provider.idGogo)}/${selectedEpisode.number || 1}`, {
      replace: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  setIsEpisodeChanging(false);
}, [animeId, navigate]);
//UPDATE DOWNLOAD LINK WHEN EPISODE ID CHANGES
const updateDownloadLink = useCallback((link) => {
  setDownloadLink(link);
}, []);
//AUTOPLAY BUTTON TOGGLE PROPS
const handleEpisodeEnd = async () => {
  const nextEpisodeIndex = currentEpisodeIndex + 1;
  if (nextEpisodeIndex >= episodes.length) {
      console.log('No more episodes.');
      return;
  }
  handleEpisodeSelect(episodes[nextEpisodeIndex]);
};
//NAVIGATE TO NEXT AND PREVIOUS EPISODES WITH SHIFT+N/P KEYBOARD COMBINATIONS (500MS DELAY)
const onPrevEpisode = () => {
  const prevIndex = currentEpisodeIndex - 1;
  if (prevIndex >= 0) {
      handleEpisodeSelect(episodes[prevIndex]);
  }
};
const onNextEpisode = () => {
  const nextIndex = currentEpisodeIndex + 1;
  if (nextIndex < episodes.length) {
      handleEpisodeSelect(episodes[nextIndex]);
  }
};

//----------------------------------------------USEFFECTS----------------------------------------------
    //SETS DEFAULT SOURCE TYPE AND LANGUGAE TO DEFAULT AND SUB
    useEffect(() => {
      const defaultSourceType = 'default';
      const defaultLanguage = 'sub';
      setSourceType(localStorage.getItem(getSourceTypeKey(animeId || '')) ||
          defaultSourceType);
      setLanguage(localStorage.getItem(getLanguageKey(animeId || '')) || defaultLanguage);
  }, [animeId]);
  // SAVES LANGUAGE PREFERENCE TO LOCAL STORAGE
  useEffect(() => {
      localStorage.setItem(getLanguageKey(animeId), language);
  }, [language, animeId]);
  //FETCHES ANIME DATA AND ANIME INFO AS BACKUP
  useEffect(() => {
      let isMounted = true;
      const fetchInfo = async () => {
          if (!animeId) {
              console.error('Anime ID is null.');
              setLoading(false);
              return;
          }
          setLoading(true);
          try {
              const info = await fetchAnimeDetails(animeId);
              if (isMounted) {
                  setAnimeInfo(info);
              }
          }
          catch (error) {
              console.error('Failed to fetch anime data, trying fetchAnimeInfo as a fallback:', error);
              try {
                  const fallbackInfo = await fetchAnimeDetails(animeId);
                  if (isMounted) {
                      setAnimeInfo(fallbackInfo);
                  }
              }
              catch (fallbackError) {
                  console.error('Also failed to fetch anime info as a fallback:', fallbackError);
              }
              finally {
                  if (isMounted)
                      setLoading(false);
              }
          }
      };
      fetchInfo();
      return () => {
          isMounted = false;
      };
  }, [animeId]);
// FETCHES ANIME EPISODES BASED ON LANGUAGE, ANIME ID AND UPDATES COMPONENTS
useEffect(() => {
  let isMounted = true;
  const fetchData = async () => {
      setLoading(true);
      if (!animeId)
          return;
      try {
          const isDub = language === 'dub';
          const animeData = await fetchAnimeEpisodes(animeTitle);
          if (isMounted && animeData && Array.isArray(animeData.episodes)) {
            console.log("episodes:: " ,animeData.episodes);
              const transformedEpisodes = animeData.episodes
                  .filter((ep) => ep.id.includes('-episode-')) // Continue excluding entries without '-episode-'
                  .map((ep) => {
                  const episodePart = ep.id.split('-episode-')[1];
                  // New regex to capture the episode number including cases like "7-5"
                  const episodeNumberMatch = episodePart.match(/^(\d+(?:-\d+)?)/);
                  return {
                    ...ep,
                    number: episodeNumberMatch ? episodeNumberMatch[0] : ep.number,
                    id: ep.id,
                    title: ep.title,
                  };
                });
                setEpisodes((transformedEpisodes.reverse()));
                console.log("episodePart:: " ,episodes);
              const navigateToEpisode = (() => {
                  if (languageChanged) {
                      const currentEpisodeNumber = episodeNumber || currentEpisode.number;
                      return (transformedEpisodes.find((ep) => ep.number === currentEpisodeNumber) || transformedEpisodes[transformedEpisodes.length - 1]);
                  }
                  else if (animeTitle && episodeNumber) {
                      const episodeId = `${animeTitle}-episode-${episodeNumber}`;
                      return (transformedEpisodes.find((ep) => ep.id === episodeId) ||
                          navigate(`/watch/${animeId}`, { replace: true }));
                  }
                  else {
                      const savedEpisodeData = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId);
                      const savedEpisode = savedEpisodeData
                          ? JSON.parse(savedEpisodeData)
                          : null;
                      return savedEpisode
                          ? transformedEpisodes.find((ep) => ep.number === savedEpisode.number) || transformedEpisodes[0]
                          : transformedEpisodes[0];
                  }
              })();
              if (navigateToEpisode) {
                  setCurrentEpisode({
                      id: navigateToEpisode.id,
                      number: navigateToEpisode.number,
                      title: navigateToEpisode.title,
                  });
                  const newAnimeTitle = navigateToEpisode.id.split('-episode-')[0];
                  navigate(`/watch/${animeId}/${newAnimeTitle}/${navigateToEpisode.number}`, { replace: true });
                  setLanguageChanged(false); // Reset the languageChanged flag after handling the navigation
              }
          }
      }
      catch (error) {
          console.error('Failed to fetch episodes:', error);
      }
      finally {
          if (isMounted)
              setLoading(false);
      }
  };
  // Last visited cache to order continue watching
  const updateLastVisited = () => {
      if (!animeInfo || !animeId)
          return; // Ensure both animeInfo and animeId are available
      const lastVisited = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED);
      const lastVisitedData = lastVisited ? JSON.parse(lastVisited) : {};
      lastVisitedData[animeId] = {
          timestamp: Date.now(),
          titleEnglish: animeInfo?.title?.english || '', // Assuming animeInfo contains the title in English
          titleRomaji: animeInfo?.title?.romaji || '', // Assuming animeInfo contains the title in Romaji
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ANIME_VISITED, JSON.stringify(lastVisitedData));
  };
  if (animeId) {
      updateLastVisited();
  }
  fetchData();
  return () => {
      isMounted = false;
  };
}, [
  animeId,
  animeTitle,
  episodeNumber,
  navigate,
  language,
  languageChanged,
  currentEpisode.number,
]);

// FETCH EMBEDDED EPISODES IF VIDSTREAMING OR GOGO HAVE BEEN SELECTED
useEffect(() => {
  if (sourceType === 'vidstreaming' && currentEpisode.id) {
      fetchVidstreamingUrl(currentEpisode.id).catch(console.error);
  }
  else if (sourceType === 'gogo' && currentEpisode.id) {
      fetchEmbeddedUrl(currentEpisode.id).catch(console.error);
  }
}, [sourceType, currentEpisode.id]);
// UPDATE BACKGROUND IMAGE TO ANIME BANNER IF WIDTH IS UNDER 500PX / OR USE ANIME COVER IF NO BANNER FOUND
useEffect(() => {
  const updateBackgroundImage = () => {
      const bannerImage = animeInfo?.bannerImage || animeInfo?.coverImage?.large;
      if (animeInfo.image) {
          const img = new Image();
          img.onload = () => {
                setSelectedBackgroundImage(bannerImage);
          
          };
          img.onerror = () => {
              setSelectedBackgroundImage(bannerImage);
          };
          img.src = bannerImage;
      }
      else {
          setSelectedBackgroundImage(bannerImage);
      }
  };
  if (animeInfo && currentEpisode.id !== '0') {
      updateBackgroundImage();
  }
}, [animeInfo, currentEpisode]);
//UPDATES VIDEOPLAYER WIDTH WHEN WINDOW GETS RESIZED
useEffect(() => {
  updateVideoPlayerWidth();
  const handleResize = () => {
      updateVideoPlayerWidth();
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [updateVideoPlayerWidth]);
//UPDATES EPISODE LIST MAX HEIGHT BASED ON VIDEO PLAYER CURRENT HEIGHT
useEffect(() => {
  const updateMaxHeight = () => {
      if (videoPlayerContainerRef.current) {
          const height = videoPlayerContainerRef.current.offsetHeight;
          setMaxEpisodeListHeight(`${height}px`);
      }
  };
  updateMaxHeight();
  window.addEventListener('resize', updateMaxHeight);
  return () => window.removeEventListener('resize', updateMaxHeight);
}, []);
// SAVES SOURCE TYPE PREFERENCE TO LOCAL STORAGE
useEffect(() => {
  localStorage.setItem(getSourceTypeKey(animeId), sourceType);
}, [sourceType, animeId]);
//NAVIGATE TO NEXT AND PREVIOUS EPISODES WITH SHIFT+N/P KEYBOARD COMBINATIONS (500MS DELAY)
useEffect(() => {
  const handleKeyDown = (event) => {
      const targetTagName = event.target.tagName.toLowerCase();
      if (targetTagName === 'input' || targetTagName === 'textarea') {
          return;
      }
      if (!event.shiftKey || !['N', 'P'].includes(event.key.toUpperCase()))
          return;
      const now = Date.now();
      if (now - lastKeypressTime < 200)
          return;
      setLastKeypressTime(now);
      const currentIndex = episodes.findIndex((ep) => ep.id === currentEpisode.id);
      if (event.key.toUpperCase() === 'N' &&
          currentIndex < episodes.length - 1) {
          const nextEpisode = episodes[currentIndex + 1];
          handleEpisodeSelect(nextEpisode);
      }
      else if (event.key.toUpperCase() === 'P' && currentIndex > 0) {
          const prevEpisode = episodes[currentIndex - 1];
          handleEpisodeSelect(prevEpisode);
      }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [episodes, currentEpisode, handleEpisodeSelect, lastKeypressTime]);
//SET PAGE TITLE TO MIRURO + ANIME TITLE
useEffect(() => {
  if (animeInfo && animeInfo.title) {
      document.title =
          'Anveshna. | ' +
              (animeInfo.title.english ||
                  animeInfo.title.romaji ||
                  animeInfo.title.romaji ||
                  '');
  }
  else {
      document.title = 'Anveshna.';
  }
}, [animeInfo]);

//No idea
useEffect(() => {
  let isMounted = true;
  const fetchInfo = async () => {
      if (!animeId) {
          console.error('Anime ID is undefined.');
          return;
      }
      try {
          const info = await fetchAnimeDetails(animeTitle);
          if (isMounted) {
              setAnimeInfo(info);
          }
      }
      catch (error) {
          console.error('Failed to fetch anime info:', error);
      }
  };
  fetchInfo();
  return () => {
      isMounted = false;
  };
}, [animeId]);
//SHOW NO EPISODES DIV IF NO RESPONSE AFTER 10 SECONDS
useEffect(() => {
  const timeoutId = setTimeout(() => {
      if (!episodes || episodes.length === 0) {
          setShowNoEpisodesMessage(true);
      }
  }, 10000);
  return () => clearTimeout(timeoutId);
}, [loading, episodes]);
// SHOW NO EPISODES DIV IF NOT LOADING AND NO EPISODES FOUND
useEffect(() => {
  if (!loading && episodes.length === 0) {
      setShowNoEpisodesMessage(true);
  }
  else {
      setShowNoEpisodesMessage(false);
  }
}, [loading, episodes]);


//----------------------------------------------RETURN----------------------------------------------


return (<WatchContainer>
  {animeInfo &&
        animeInfo.status === 'NOT_YET_AIRED'? (<div style={{ textAlign: 'center' }}>
      <strong>
        <h2>Time Remaining:</h2>
      </strong>
      {animeInfo &&
            animeInfo.nextAiringEpisode &&
            countdown !== 'Airing now or aired' ? (<p>
          <FaBell /> {countdown}
        </p>) : (<p>Unknown</p>)}
      {animeInfo.trailer && (<IframeTrailer src={`https://www.youtube.com/embed/${animeInfo.trailer.id}`} allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen/>)}
    </div>) : showNoEpisodesMessage ? (<NoEpsFoundDiv>
      <h2>No episodes found {':('}</h2>
      <NoEpsImage>
        <img src={Image404URL} alt='404 Error'></img>
      </NoEpsImage>
      <GoToHomePageButton />
    </NoEpsFoundDiv>) : (<WatchWrapper className='flex absolute md:flex-col'>
      {!showNoEpisodesMessage && (<>
          <VideoPlayerContainer className='' ref={videoPlayerContainerRef}>
            {loading ? (<SkeletonLoader />) : sourceType === 'default' ? (<Player episodeId={currentEpisode.id} malId={animeInfo?.idMal} banner={selectedBackgroundImage} updateDownloadLink={updateDownloadLink} onEpisodeEnd={handleEpisodeEnd} onPrevEpisode={onPrevEpisode} onNextEpisode={onNextEpisode} animeTitle={animeInfo.title?.english || animeInfo.title?.romaji || ''}/>) : (<EmbedPlayer src={embeddedVideoUrl}/>)}
          </VideoPlayerContainer>
          <EpisodeListContainer style={{ maxHeight: maxEpisodeListHeight }}>
            {loading ? (<SkeletonLoader />) : (<EpisodeList className="absolute" animeId={animeId} episodes={episodes} selectedEpisodeId={currentEpisode.id} onEpisodeSelect={(episodeId) => {
                    const episode = episodes.find((e) => e.id === episodeId);
                    if (episode) {
                        handleEpisodeSelect(episode);
                    }
                }} maxListHeight={maxEpisodeListHeight}/>)}
          </EpisodeListContainer>
        </>)}
    </WatchWrapper>)}
  <DataWrapper>
    <SourceAndData $videoPlayerWidth={videoPlayerWidth}>
      {animeInfo && animeInfo.status !== 'Not yet aired' && (<MediaSource sourceType={sourceType} setSourceType={setSourceType} language={language} setLanguage={setLanguage} downloadLink={downloadLink} episodeId={currentEpisode.number.toString()} airingTime={animeInfo && animeInfo.status === 'RELEASING'
            ? countdown
            : undefined} nextEpisodenumber={nextEpisodenumber}/>)}
      {animeInfo && <WatchAnimeData animeData={animeInfo}/>}
    </SourceAndData>
    <RalationsTable>
      {animeInfo && <AnimeDataList animeData={animeInfo}/>}
    </RalationsTable>
  </DataWrapper>
</WatchContainer>
  );
};
export default Watch
