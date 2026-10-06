/**
 * App configuration - the ONLY place you need to edit when your computer's
 * IP address changes.
 *
 * Find your IP:  Windows -> run `ipconfig` and copy "IPv4 Address"
 *                Mac/Linux -> `ifconfig` / `ip addr`
 *
 * Use your computer's LAN IP, NOT "localhost" (localhost means "the phone
 * itself" on a real device). Phone and computer must be on the same Wi-Fi,
 * and Laravel must be started with:
 *     php artisan serve --host=0.0.0.0 --port=8000
 */
export const SERVER_HOST = "192.168.254.108";
export const SERVER_PORT = 8000;

export const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const API_URL = `${SERVER_URL}/api`;
