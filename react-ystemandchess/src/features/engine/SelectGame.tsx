//check login
//check for games

import { useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"
import { environment } from "../../environments/environment";
import { useNavigate } from "react-router";

export type GameMetaData = {
        userId?: number,
        user?: User,
        opponent?: User,
        uuid?: string,
        opponentId?: string,
        gameName: string,
        gameType: "computer" | "friend" | "mentor" | "guest",
        computerLevel: number | null,
        fen: string,
        movesList: string[],
        playerColor: "white" | "black",
        status: "won" | "lost" | "ongoing" | "draw",
        createdAt: string,
        updatedAt: string
    }
   export type User = {
        username: string,
        firstName: string,
        lastName: string,
        role: string,
        email: string,
        id: number
    }

// tracks which step of the "start a game" flow the user is on
type FlowStep = "start" | "mode" | "friendSelect" | "settings"

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

type PendingGameType = "computer" | "guest" | "friend" | null

const SelectGame = () => {

    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

    const user = useRef<User>(null)
    const [games, setGames] = useState<GameMetaData[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [gamesError, setGamesError] = useState<string | null>(null)

    const [flowStep, setFlowStep] = useState<FlowStep>("start")
    const [friendSearch, setFriendSearch] = useState<string>("")
    const [friendResults, setFriendResults] = useState<string[]>([])
    const [searchingFriends, setSearchingFriends] = useState<boolean>(false)
    const [selectingFriend, setSelectingFriend] = useState<boolean>(false)

    // gathered on the settings step, then packed into GameMetaData right before navigating
    const [pendingGameType, setPendingGameType] = useState<PendingGameType>(null)
    const [selectedFriend, setSelectedFriend] = useState<User>(null)
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white")
    const [difficulty, setDifficulty] = useState<number>(10)
    const [startingGame, setStartingGame] = useState<boolean>(false)

    useEffect(() => {
        if (!cookies.login) {
            setIsLoggedIn(false);
            return;
        }

        const verifyAndLoad = async () => {
            try {
                const UInfo = await SetPermissionLevel(cookies, removeCookie);

                if (UInfo?.error) {
                    setIsLoggedIn(false);
                    return;
                }
                setIsLoggedIn(true);
                const { username, firstName, lastName, role, email, id } = UInfo
                user.current = { username, firstName, lastName, role, email, id }

                await getGames();

            } catch (err) {
                console.error("Auth check failed:", err);
                setIsLoggedIn(false);
            }
        };

        verifyAndLoad();

    }, [cookies.login]);

    // debounced student search: fires ~250ms after the last keypress instead of
    // on every single character, so we're not hitting the endpoint on every keystroke
    useEffect(() => {
        if (flowStep !== "friendSelect") return

        if (!friendSearch) {
            setFriendResults([])
            setSearchingFriends(false)
            return
        }

        setSearchingFriends(true)
        const timeoutId = setTimeout(() => {
            searchStudents(friendSearch)
        }, 250)

        return () => clearTimeout(timeoutId)
    }, [friendSearch, flowStep]);

    // Computer/guest games have no opponent to look up - only friend/mentor games do.
    // A failed lookup shouldn't drop the game from the list, so this always resolves
    // with a usable GameMetaData instead of swallowing errors into `undefined`.
    const addOpponentInfo = async (gameInfo: GameMetaData): Promise<GameMetaData> => {
        const withUser = { ...gameInfo, user: user.current }

        const hasOpponent = (gameInfo.gameType === "friend" || gameInfo.gameType === "mentor") && !!gameInfo.opponentId

        if (!hasOpponent) {
            return withUser
        }

        try {
            const res = await fetch(`${environment.urls.middlewareURL}/user/getUser/${gameInfo.opponentId}`);
            if (!res.ok) {
                console.log("Could not load opponent for game", gameInfo.uuid)
                return withUser
            }
            const opponentInfo = await res.json() as User;
            return { ...withUser, opponent: opponentInfo }
        }
        catch (error) {
            console.log(error)
            return withUser
        }
    }

    const getGames = async () => {
        setLoading(true)
        setGamesError(null)
        try {
            const res = await fetch(`${environment.urls.middlewareURL}/savedGames/student/${user.current.id}`)
            if (!res.ok) {
                throw new Error(`Failed to load saved games (${res.status})`)
            }
            const data = await res.json()
            if (!Array.isArray(data) || data.length === 0) {
                setGames([])
                return
            }

            const res2 = await fetch(`${environment.urls.middlewareURL}/savedGames/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuids: data })
            })
            if (!res2.ok) {
                throw new Error(`Failed to load game details (${res2.status})`)
            }
            const data2 = await res2.json() as GameMetaData[]
            const enrichedGames = await Promise.all(data2.map(item => addOpponentInfo(item)))

            // most recently updated first
            enrichedGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

            setGames(enrichedGames)
        }
        catch (error) {
            console.log(error)
            setGamesError("Couldn't load your previous games. Try refreshing.")
        }
        finally {
            setLoading(false)
        }
    }

    // matches usernames against your getStudent route (role: student, case-insensitive regex)
    // NOTE: assuming this is mounted at /user/getStudent alongside the existing /user/getUser/:id
    // call above — adjust the path if it lives under a different prefix
    const searchStudents = async (keyword: string) => {
        try {
            const res = await fetch(`${environment.urls.middlewareURL}/user/getStudent?keyword=${encodeURIComponent(keyword)}`)
            if (!res.ok) {
                setFriendResults([])
                return
            }
            const usernames = await res.json() as string[]
            setFriendResults(usernames)
        }
        catch (error) {
            console.log(error)
        }
        finally {
            setSearchingFriends(false)
        }
    }

    const gameNameFor = (gameType: PendingGameType, opponent?: User): string => {
        if (gameType === "computer") return "Me vs Computer"
        if (gameType === "guest") return "Guest Game"
        if (gameType === "friend") return `${user.current?.username ?? "You"} vs ${opponent?.username ?? "Friend"}`
        return ""
    }

    const buildNewGame = (gameType: PendingGameType, opponent?: User): GameMetaData => {
        return {
            userId: isLoggedIn ? user.current.id : null,
            user: isLoggedIn ? user.current : null,
            opponent: opponent || null,
            uuid: null,
            opponentId: opponent ? String(opponent.id) : null,
            gameName: gameNameFor(gameType, opponent),
            gameType: gameType,
            computerLevel: (gameType === "computer" || gameType === "guest") ? difficulty : null,
            fen: STARTING_FEN,
            movesList: [],
            playerColor: playerColor,
            status: "ongoing",
            createdAt: Date.now().toString(),
            updatedAt: Date.now().toString()
        }
    }

    const handlePlaySolo = () => {
        // logged in solo play is vs computer, logged out is a guest game
        setPendingGameType(isLoggedIn ? "computer" : "guest")
        setFlowStep("settings")
    }

    const handlePlayWithFriend = () => {
        setFlowStep("friendSelect")
    }

    // search only gives us usernames, so pull the full User record before locking in the opponent
    const handleSelectFriend = async (username: string) => {
        setSelectingFriend(true)
        try {
            const res = await fetch(`${environment.urls.middlewareURL}/user/getUser?username=${encodeURIComponent(username)}`)
            if (!res.ok) {
                console.log("Could not find that user")
                return
            }
            const friend = await res.json() as User
            setSelectedFriend(friend)
            setPendingGameType("friend")
            setFlowStep("settings")
        }
        catch (error) {
            console.log(error)
        }
        finally {
            setSelectingFriend(false)
        }
    }

    // Persists a brand-new game to the backend so it actually shows up later as a
    // "previous game." Guest games have no logged-in student to attach it to
    // (addGameToStudent 404s on a missing userId), so those just play locally.
    const persistNewGame = async (game: GameMetaData): Promise<GameMetaData> => {
        if (!isLoggedIn || !user.current) {
            return game
        }

        try {
            const res = await fetch(`${environment.urls.middlewareURL}/savedGames/addgame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(game)
            })

            if (!res.ok) {
                console.log("Failed to save new game, continuing without persistence")
                return game
            }

            const saved = await res.json()
            // server is authoritative for uuid/fen/movesList/status/timestamps;
            // keep our locally-resolved `user`/`opponent` objects since those
            // aren't part of the persisted schema
            return { ...game, ...saved.game, user: game.user, opponent: game.opponent }
        }
        catch (error) {
            console.log(error)
            return game
        }
    }

    const handleStartGame = async () => {
        setStartingGame(true)
        try {
            const opponent = pendingGameType === "friend" ? selectedFriend : undefined
            const newGame = buildNewGame(pendingGameType, opponent)
            const persistedGame = await persistNewGame(newGame)
            navigate("/play", { state: persistedGame })
        }
        finally {
            setStartingGame(false)
        }
    }

    // The saved game only stores one `playerColor` (the creator's). If the person
    // continuing is the opponent rather than the creator, they need the opposite
    // color or they'd be dropped into the game playing the wrong side.
    const handleNav = (game: GameMetaData) => {
        const isCreator = !user.current || String(game.userId) === String(user.current.id)
        const colorForViewer: "white" | "black" = isCreator
            ? game.playerColor
            : (game.playerColor === "white" ? "black" : "white")

        navigate("/play", { state: { ...game, playerColor: colorForViewer } })
    }

    const resetFlow = () => {
        setFlowStep("start")
        setFriendSearch("")
        setFriendResults([])
        setSelectedFriend(null)
        setPendingGameType(null)
    }

    const opponentLabel = (game: GameMetaData): string => {
        if (game.gameType === "computer") return "vs Computer"
        if (game.gameType === "guest") return "Guest Game"
        return `vs ${game.opponent?.username ?? "Unknown"}`
    }

    const formatDate = (value: string): string => {
        const timestamp = Number(value)
        const date = Number.isNaN(timestamp) ? new Date(value) : new Date(timestamp)
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()
    }

    return (
        <div>
            {flowStep === "start" && (
                <div className="flex justify-items-end">
                    <button onClick={() => { setFlowStep("mode") }} className="">
                        Start New Game
                    </button>
                </div>
            )}

            {flowStep === "mode" && (
                <div className="flex flex-col gap-2">
                    <button onClick={handlePlaySolo} className="">
                        Play Solo
                    </button>
                    <button onClick={handlePlayWithFriend} className="">
                        Play with a Friend
                    </button>
                    <button onClick={resetFlow} className="">
                        Back
                    </button>
                </div>
            )}

            {flowStep === "friendSelect" && (
                <div className="flex flex-col gap-2">
                    <h2>Choose an opponent</h2>
                    <input
                        type="text"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Search by username"
                        className=""
                        autoFocus
                    />
                    {searchingFriends && <p>Searching...</p>}
                    {!searchingFriends && friendSearch && friendResults.length === 0 && <p>No students found.</p>}
                    {friendResults.map((username) => (
                        <button
                            key={username}
                            onClick={() => handleSelectFriend(username)}
                            disabled={selectingFriend}
                            className=""
                        >
                            {username}
                        </button>
                    ))}
                    <button onClick={() => setFlowStep("mode")} className="">
                        Back
                    </button>
                </div>
            )}

            {flowStep === "settings" && (
                <div className="flex flex-col gap-4">
                    <h2>Game Settings</h2>

                    <div>
                        <p>Play as</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPlayerColor("white")}
                                className={playerColor === "white" ? "font-bold" : ""}
                            >
                                White
                            </button>
                            <button
                                onClick={() => setPlayerColor("black")}
                                className={playerColor === "black" ? "font-bold" : ""}
                            >
                                Black
                            </button>
                        </div>
                    </div>

                    {pendingGameType === "computer" && (
                        <div>
                            <p>Difficulty</p>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 5, 10, 15, 20].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={difficulty === level ? "font-bold" : ""}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={handleStartGame} disabled={startingGame} className="">
                        {startingGame ? "Starting..." : "Start Game"}
                    </button>
                    <button
                        onClick={() => setFlowStep(pendingGameType === "friend" ? "friendSelect" : "mode")}
                        className=""
                    >
                        Back
                    </button>
                </div>
            )}

            {isLoggedIn && (
                <div className="flex flex-col gap-2">
                    <h2>Your Games</h2>
                    {loading && <p>Loading your games...</p>}
                    {!loading && gamesError && <p>{gamesError}</p>}
                    {!loading && !gamesError && games.length === 0 && <p>No previous games yet.</p>}
                    {!loading && games.map((game) => (
                        <div key={game.uuid ?? `${game.gameName}-${game.createdAt}`}>
                            <button onClick={() => { handleNav(game) }} className="">
                                <h1>{game.gameName}</h1>
                                <p>{opponentLabel(game)} · {game.status} · {formatDate(game.updatedAt)}</p>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SelectGame