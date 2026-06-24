//check login
//check for games

import { MouseEventHandler, useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"
import { environment } from "../../environments/environment";
import { useNavigate } from "react-router";

export type GameMetaData = {
        userId: string,
        user?: User,                                                                                                                                                                                                                                                         
        opponent?: User,
        uuid: string,
        opponentId: string,
        gameName: string,
        gameType: "computer" | "friend" | "mentor",
        computerLevel: number | null,
        fen: string,
        movesList: string[],
        playerColor: "white" | "black",
        status: "won" | "lost" | "ongoing",
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

    

const SelectGame = () => {
    
    

   
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

    const user = useRef<User>(null)
    const [games, setGames] = useState<GameMetaData[]>(null)
    const [loading, setLoading] = useState<boolean>(false)

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
        console.log("Logged in")

    }, [cookies.login]);

    const addOpponentInfo = async (gameInfo: GameMetaData): Promise<GameMetaData> => {
        try {
            const opponentId = gameInfo.opponentId
            const res = await fetch(`${environment.urls.middlewareURL}/user/getUser/${opponentId}`);
            const opponentInfo = await res.json() as User;
            gameInfo.opponent= opponentInfo;
            gameInfo.user = user.current
            return gameInfo
        }
        catch (error) {
            console.log(error)
        }
    }

    const getGames = async () => {
        try {
            const res = await fetch(`${environment.urls.middlewareURL}/savedGames/student/${user.current.id}`)
            const data = await res.json() 
            if (!data || data.length === 0) {
                return
            }
            const res2 = await fetch(`${environment.urls.middlewareURL}/savedGames/batch`, {
                method: "POST",
                body: JSON.stringify({uuids:data})
            })
            const data2 = await res2.json() as GameMetaData[]
            const games = await Promise.all(data2.map(item => addOpponentInfo(item))) as GameMetaData[]

            setGames(games)
        }
        catch (error) {
            console.log(error)
        }
    }
const handleNav = (game) : MouseEventHandler =>{
    navigate("/play", {state: game})
    return
}

    if (isLoggedIn) {
        return (
            <div >
                <div className="flex justify-items-end">
                    <button onClick={()=>{navigate("/play")}} className=""> Start New Game</button>
                    
               
                
            </div>
            {games?.map((game, index) =>
            <div key={index}>
                <button onClick={()=>{handleNav(game)}}> 
                    <h1 >{game.user.username}</h1>
                    </button>


                    </div>
                )}
             </div>
        )
    }

    else {
        return (
             <button onClick={()=>{navigate("/play")}} className=""> Start New Game</button>
        )
    }
}

export default SelectGame


{/* TODO: on game click, navigate to /game and pass game data via state
    navigate('/game', { state: { game } })
    then on game page: const { state } = useLocation(); const game = state?.game */}