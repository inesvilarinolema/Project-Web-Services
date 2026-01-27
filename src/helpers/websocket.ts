import http from "http";
import { parse as parseCookie } from "cookie";
import signature from "cookie-signature";
import { SessionData } from "express-session";
import { WebSocketServer, WebSocket } from "ws";
import { findUserByIdSafe, sessionStore } from "./auth";
import { User } from "../model/user";
import { db } from "./sysdb";

//Interface to track resource locking (concurrency control)
export interface Lock {
	username: string; //Who holds de lock
	at: number; //Timestamp
}

//Gloabl memory store for active locks
export const activeLocks = new Map<string, Lock>();

interface WSMessage {
	type: string;
	data?: any;
}

interface WSWithUser extends WebSocket {
	// extended WebSocket to include user info
	user?: User;
}

//Internal state to track connection health
interface ClientState {
	socket: WSWithUser;
	lastPong: number;
}

const clients = new Map<WSWithUser, ClientState>();

//Sends a message to all connected clientes.
export function broadcast(roles: number[], msg: WSMessage) {
	const now = Date.now();

	for (const [ws, client] of clients) {
		const user = ws.user;

		if (ws.readyState === ws.OPEN) {
			try {
				ws.send(JSON.stringify(msg));
			} 
			catch (err) {
				console.error("Broadcast error:", err);
			}
		}
	}
}

//Initilizes websocket server and handles de HTTP upgrade process
export function attachWebSocketServer(server: http.Server) {
	const wss = new WebSocketServer({ noServer: true });

	const PING_INTERVAL_MS = 10000;
	const PONG_TIMEOUT_MS = 30000;

	server.on("upgrade", (req, socket, head) => {
		if (req.url !== "/api/ws") {
			socket.destroy();
			return;
		}

		//1. Parse cookies from the HTTP request headers
		const cookies = parseCookie(req.headers.cookie || "");
		let raw = cookies["connect.sid"];

		//2. Unsign cookie using the secret key
		if (raw?.startsWith("s:")) {
			const unsign = signature.unsign(
				raw.slice(2),
				process.env.SECRETKEY || "mysecretkey",
			);
			raw = unsign === false ? undefined : unsign;
		}
		const sessionID = raw;

		//3. Verify session in the store
		if (sessionID) {
			sessionStore.get(
				sessionID,
				(err: any, session: SessionData | null | undefined) => {
					let userId: any = undefined;
					if (!err && session) {
						userId = (session as any).passport?.user;
					}

					//4. Retrieve full user details
					const user: User | undefined = userId
						? findUserByIdSafe(userId)
						: undefined;
					if (user) {
						console.log("Websocket connected for", user.username);
					} else {
						console.log("Websocket connected for not-logged-in");
					}

					//5. Finalize connectio upgrade
					wss.handleUpgrade(req, socket, head, (ws) => {
						const wsUser = ws as WSWithUser;
						wsUser.user = user;
						wss.emit("connection", wsUser, req);
					});
				},
			);
		} else {
			wss.handleUpgrade(req, socket, head, (ws) => {
				const wsUser = ws as WSWithUser;
				wsUser.user = undefined; //Anonymous user
				wss.emit("connection", wsUser, req);
			});
		}
	});

	//Handle new WS connection
	wss.on("connection", (ws) => {
		const client: ClientState = {
			socket: ws,
			lastPong: Date.now(),
		};

		clients.set(ws, client);

		const wsUser = ws as WSWithUser;

		ws.on("message", (raw) => {
			let msg: WSMessage;

			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return;
			}

			if (msg.type === "pong") {
				client.lastPong = Date.now();
			}
		});

		//Handle Disconnection
		ws.on("close", () => {
			clients.delete(wsUser);

			//If user disconnects, release all locks they held
			if (wsUser.user && wsUser.user.id) {
				const myUsername = wsUser.user.username;

				let changes = false;
				//Iterate through all active locks in the system
				for (const [key, lock] of activeLocks.entries()) {
					//Force release the lock so the resource isnt stuck forever
					if (lock.username === myUsername) {
						activeLocks.delete(key);
						changes = true;
						//console.log(`Lock liberado automáticamente: ${key}`);
					}
				}

				//If any locks were released, inform all other clients inmediately
				if (changes) {
					broadcast([0, 1], {
						type: "lockUpdate",
						data: { action: "unlock_all", userId: wsUser.user.id },
					});
				}
			}
		});

		ws.on("error", () => {
			clients.delete(wsUser);
		});
	});

	//Detect and close dead connections
	setInterval(() => {
		const now = Date.now();

		for (const [ws, client] of clients) {
			if (now - client.lastPong > PONG_TIMEOUT_MS) {
				ws.terminate(); //Kill connection
				clients.delete(ws);
				continue;
			}

			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: "ping" }));
			}
		}
	}, PING_INTERVAL_MS);
}

//Sends a direct message to a specific user by their ID.
export function sendMessageToUser(userId: number, msg: WSMessage) {
	for (const [ws, client] of clients) {
		if (ws.user && ws.user.id === userId) {
			if (ws.readyState === ws.OPEN) {
				try {
					ws.send(JSON.stringify(msg));
					//console.log(`Mensaje enviado a usuario ${userId}:`, msg.type);
				} catch (err) {
					//console.error('Error enviando mensaje directo:', err);
				}
			}
		}
	}
}
