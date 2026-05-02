let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Supprime le slash à la fin s'il y en a un pour éviter les doubles slashes dans les appels
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

export default API_URL;
