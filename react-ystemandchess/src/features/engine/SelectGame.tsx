//check login
//check for games

// Design note: this page assumes three fonts are loaded globally — Fraunces
// (display), Inter (body), and IBM Plex Mono (metadata/notation-style text).
// Add these to index.html (or your global stylesheet) if they aren't already:
//
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
//
// Every className below includes a plain-font fallback, so the layout still
// reads correctly even before the webfonts load.

import { useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"
import { environment } from "../../environments/environment";
import { useNavigate } from "react-router";
import { User } from "../../core/types/gamemetadata";
import { GameMetaData } from "../../core/types/gamemetadata";



// tracks which step of the "start a game" flow the user is on
type FlowStep = "start" | "mode" | "friendSelect" | "settings"

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

type PendingGameType = "computer" | "guest" | "friend" | null

// ---------------------------------------------------------------------------
// Design tokens — a wood-and-felt tournament board rather than a generic UI
// kit: deep charcoal-green "ink" squares, warm ivory, and an antique brass
// accent for anything actionable.
//   ink    #182019  page background (dark square)
//   panel  #212B23  card / row surface
//   line   #3A4A3C  hairline borders
//   ivory  #EAE3D3  primary text (light square)
//   dim    #A8A395  secondary / muted text
//   brass  #C0983F  primary accent, active states
//   sage   #7C9A7F  "won"
//   brick  #B15A44  "lost" / destructive
// ---------------------------------------------------------------------------

const FONT_DISPLAY = "font-['Fraunces',_Georgia,_serif]"
const FONT_MONO = "font-['IBM_Plex_Mono',_ui-monospace,_monospace]"
const FONT_BODY = "font-['Inter',_system-ui,_sans-serif]"

const btnPrimary =
    "inline-flex items-center justify-center rounded-md bg-[#C0983F] px-5 py-2.5 text-sm font-medium text-[#182019] transition hover:bg-[#D3AC55] focus:outline-none focus:ring-2 focus:ring-[#C0983F]/60 focus:ring-offset-2 focus:ring-offset-[#182019] disabled:opacity-50 disabled:cursor-not-allowed"
const btnGhost =
    "inline-flex items-center justify-center rounded-md border border-[#3A4A3C] bg-transparent px-5 py-2.5 text-sm font-medium text-[#A8A395] transition hover:border-[#C0983F]/50 hover:text-[#EAE3D3] focus:outline-none focus:ring-2 focus:ring-[#C0983F]/40"
const btnText =
    "text-sm text-[#A8A395] underline-offset-4 hover:text-[#EAE3D3] hover:underline transition"
const btnDanger =
    "inline-flex items-center justify-center rounded-md border border-[#B15A44]/50 bg-transparent px-4 py-2 text-xs font-medium text-[#C98872] transition hover:bg-[#B15A44] hover:text-[#EAE3D3] hover:border-[#B15A44] disabled:opacity-40 disabled:cursor-not-allowed"

const statusStyles: Record<GameMetaData["status"], { dot: string; label: string }> = {
    ongoing: { dot: "bg-[#C0983F] animate-pulse", label: "text-[#C0983F]" },
    won: { dot: "bg-[#7C9A7F]", label: "text-[#9DB89F]" },
    lost: { dot: "bg-[#B15A44]", label: "text-[#C98872]" },
    draw: { dot: "bg-[#A8A395]", label: "text-[#A8A395]" },
}

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
            opponent: opponent ||null,
            uuid: null,
            opponentId: opponent ? String(opponent._id) : "stockfish",
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
        catch(err){
            console.log("Error Building / Saving the game", err)
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

    // Not wired up yet — no bulk-delete endpoint exists on the backend.
    // Placeholder mirrors the per-game Delete/Rename buttons below, which are
    // also unprogrammed for now.
   const handleDeleteAllGames = async () => {
  try {
    if (!user.current) return;

    const res = await fetch(
      `${environment.urls.middlewareURL}/savedGames/student/${user.current.id}/games`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete games.");
    }

    console.log(`${data.deletedGames} games were deleted.`);
    console.log(data.message);

    setGames([]);
  } catch (err) {
    console.error("Error deleting games:", err);
  }
};

     const handleDeleteGame = async (uuid) => {
  try {
    const res = await fetch(
      `${environment.urls.middlewareURL}/savedGames/game/${uuid}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete game.");
    }

    console.log(data.message);

    // Remove the game from the UI
    setGames((prevGames) =>
      prevGames.filter((game) => game.uuid !== uuid)
    );
  } catch (err) {
    console.error("Error deleting game:", err);
  }
};
    


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
        <div className={`min-h-screen bg-[#182019] ${FONT_BODY} text-[#EAE3D3] px-4 py-10 sm:py-14`}>
            <div className="mx-auto w-full max-w-2xl">

                {/* Header */}
                <header className="mb-10 sm:mb-14">
                    <p className={`${FONT_MONO} text-[11px] tracking-[0.25em] uppercase text-[#C0983F]`}>
                        ♞ Y STEM Chess
                    </p>
                    <h1 className={`${FONT_DISPLAY} mt-2 text-3xl sm:text-4xl font-semibold text-[#EAE3D3]`}>
                        Take your seat at the board
                    </h1>
                    <p className="mt-2 max-w-md text-sm text-[#A8A395]">
                        Play a friend, a mentor, or the engine — then pick up any game right where you left off.
                    </p>
                    <div className="mt-6 h-px w-full bg-gradient-to-r from-[#C0983F]/70 via-[#C0983F]/20 to-transparent" />
                </header>

                {flowStep === "start" && (
                    <div className="mb-10 flex justify-end">
                        <button onClick={() => { setFlowStep("mode") }} className={btnPrimary}>
                            Start New Game
                        </button>
                    </div>
                )}

                {flowStep === "mode" && (
                    <section className="mb-10 rounded-xl border border-[#3A4A3C] bg-[#212B23] p-6 sm:p-8">
                        <h2 className={`${FONT_DISPLAY} mb-5 text-xl text-[#EAE3D3]`}>How do you want to play?</h2>
                        <div className="flex flex-col gap-3">
                            <button onClick={handlePlaySolo} className={`${btnPrimary} w-full`}>
                                Play Solo
                            </button>
                            <button onClick={handlePlayWithFriend} className={`${btnGhost} w-full`}>
                                Play with a Friend
                            </button>
                            <button onClick={resetFlow} className={`${btnText} mt-2 self-start`}>
                                ← Back
                            </button>
                        </div>
                    </section>
                )}

                {flowStep === "friendSelect" && (
                    <section className="mb-10 rounded-xl border border-[#3A4A3C] bg-[#212B23] p-6 sm:p-8">
                        <h2 className={`${FONT_DISPLAY} mb-1 text-xl text-[#EAE3D3]`}>Choose an opponent</h2>
                        <p className="mb-5 text-sm text-[#A8A395]">Search for a classmate by username.</p>
                        <input
                            type="text"
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                            placeholder="Search by username"
                            className="w-full rounded-md border border-[#3A4A3C] bg-[#182019] px-4 py-2.5 text-sm text-[#EAE3D3] placeholder:text-[#A8A395]/60 focus:outline-none focus:ring-2 focus:ring-[#C0983F]/50"
                            autoFocus
                        />
                        <div className="mt-4 flex flex-col gap-1.5">
                            {searchingFriends && (
                                <p className={`${FONT_MONO} text-xs text-[#A8A395]`}>Searching…</p>
                            )}
                            {!searchingFriends && friendSearch && friendResults.length === 0 && (
                                <p className="text-sm text-[#A8A395]">No students found.</p>
                            )}
                            {friendResults.map((username) => (
                                <button
                                    key={username}
                                    onClick={() => handleSelectFriend(username)}
                                    disabled={selectingFriend}
                                    className="flex items-center justify-between rounded-md border border-[#3A4A3C] bg-[#182019] px-4 py-2.5 text-sm text-[#EAE3D3] transition hover:border-[#C0983F]/60 hover:bg-[#232F26] disabled:opacity-50"
                                >
                                    <span>{username}</span>
                                    <span className="text-[#A8A395]">→</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setFlowStep("mode")} className={`${btnText} mt-5`}>
                            ← Back
                        </button>
                    </section>
                )}

                {flowStep === "settings" && (
                    <section className="mb-10 rounded-xl border border-[#3A4A3C] bg-[#212B23] p-6 sm:p-8">
                        <h2 className={`${FONT_DISPLAY} mb-6 text-xl text-[#EAE3D3]`}>Game settings</h2>

                        <div className="mb-6">
                            <p className={`${FONT_MONO} mb-2.5 text-xs uppercase tracking-wider text-[#A8A395]`}>Play as</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPlayerColor("white")}
                                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
                                        playerColor === "white"
                                            ? "border-[#C0983F] bg-[#C0983F]/10 text-[#EAE3D3]"
                                            : "border-[#3A4A3C] text-[#A8A395] hover:border-[#A8A395]/60"
                                    }`}
                                >
                                    <span className="h-4 w-4 rounded-[3px] border border-[#3A4A3C] bg-[#EAE3D3]" />
                                    White
                                </button>
                                <button
                                    onClick={() => setPlayerColor("black")}
                                    className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
                                        playerColor === "black"
                                            ? "border-[#C0983F] bg-[#C0983F]/10 text-[#EAE3D3]"
                                            : "border-[#3A4A3C] text-[#A8A395] hover:border-[#A8A395]/60"
                                    }`}
                                >
                                    <span className="h-4 w-4 rounded-[3px] border border-[#EAE3D3]/40 bg-[#182019]" />
                                    Black
                                </button>
                            </div>
                        </div>

                        {pendingGameType === "computer" && (
                            <div className="mb-8">
                                <p className={`${FONT_MONO} mb-2.5 text-xs uppercase tracking-wider text-[#A8A395]`}>Difficulty</p>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 5, 10, 15, 20].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`${FONT_MONO} h-9 w-9 rounded-md border text-sm transition ${
                                                difficulty === level
                                                    ? "border-[#C0983F] bg-[#C0983F] font-semibold text-[#182019]"
                                                    : "border-[#3A4A3C] text-[#A8A395] hover:border-[#C0983F]/50"
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <button onClick={handleStartGame} disabled={startingGame} className={btnPrimary}>
                                {startingGame ? "Starting…" : "Start Game"}
                            </button>
                            <button
                                onClick={() => setFlowStep(pendingGameType === "friend" ? "friendSelect" : "mode")}
                                className={btnText}
                            >
                                ← Back
                            </button>
                        </div>
                    </section>
                )}

                {isLoggedIn && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className={`${FONT_DISPLAY} text-xl text-[#EAE3D3]`}>Your games</h2>
                            {!loading && games.length > 0 && (
                                <button onClick={handleDeleteAllGames} className={btnDanger}>
                                    Delete all
                                </button>
                            )}
                        </div>

                        {loading && (
                            <p className={`${FONT_MONO} text-sm text-[#A8A395]`}>Loading your games…</p>
                        )}
                        {!loading && gamesError && (
                            <p className="text-sm text-[#C98872]">{gamesError}</p>
                        )}
                        {!loading && !gamesError && games.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#3A4A3C] px-6 py-10 text-center">
                                <p className="text-sm text-[#A8A395]">
                                    No previous games yet. Start one above and it'll show up here.
                                </p>
                            </div>
                        )}

                        {!loading && !gamesError && games.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-[#3A4A3C]">
                                {games.map((game, index) => (
                                    <div
                                        key={game.uuid ?? `${game.gameName}-${game.createdAt}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => { handleNav(game) }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") handleNav(game)
                                        }}
                                        className={`group flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#C0983F]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#C0983F]/50 ${
                                            index % 2 === 0 ? "bg-[#212B23]" : "bg-[#1C2620]"
                                        } ${index !== 0 ? "border-t border-[#3A4A3C]" : ""}`}
                                    >
                                        <div className="min-w-0">
                                            <h3 className={`${FONT_DISPLAY} truncate text-base text-[#EAE3D3]`}>
                                                {game.gameName}
                                            </h3>
                                            <p className={`${FONT_MONO} mt-1 text-xs text-[#A8A395]`}>
                                                {opponentLabel(game)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[game.status].dot}`} />
                                                <span className={`${FONT_MONO} hidden text-xs capitalize sm:inline ${statusStyles[game.status].label}`}>
                                                    {game.status}
                                                </span>
                                            </span>
                                            <span className={`${FONT_MONO} text-xs text-[#A8A395]`}>
                                                {formatDate(game.updatedAt)}
                                            </span>

                                            <div
                                                className="hidden items-center gap-2 sm:flex"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button className="text-xs text-[#A8A395] transition hover:text-[#EAE3D3] hover:underline">
                                                    Rename
                                                </button>
                                                <button  onClick={() => handleDeleteGame(game.uuid)}className="text-xs text-[#C98872] transition hover:text-[#EAE3D3] hover:underline">
                                                    Delete
                                                </button>
                                            </div>

                                            <span className="text-[#A8A395] transition group-hover:translate-x-0.5 group-hover:text-[#C0983F]">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    )
}

export default SelectGame