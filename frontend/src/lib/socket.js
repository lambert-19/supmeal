import { io } from "socket.io-client"

let socket

// Connexion paresseuse et unique : le cookie de session httpOnly est envoyé
// automatiquement à la poignée de main (withCredentials), pas de token à
// gérer manuellement ici. auth-store.js pilote connect()/disconnect() selon
// l'état de la session (voir bootstrap/login/logout).
export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:4000", {
      withCredentials: true,
      autoConnect: false,
    })
  }
  return socket
}
