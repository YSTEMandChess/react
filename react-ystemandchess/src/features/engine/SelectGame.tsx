
//check login
//check for games

import { useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"
import { environment } from "../../environments/environment";


const SelectGame = () => {
    type User = {
        username: string,
        firstName: string,
        lastName: string,
        role: string,
        email: string,
        id: number
    }

    type Game = {
        studentName: string,
        opponentName: string,
        timeAllotted: string,
        turn: "Your Turn" | "Their Turn",
        playerColor: "Black" | "White"
    }

    type GameMetaData = {
        userId: string,
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

    const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

    const user = useRef<User>(null)
    const [games, setGames] = useState<[Game]>(null)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (!cookies.login) {
            setIsLoggedIn(false);
            return;
        }

        const verifyAndLoad = async () => {
            try {
                const UInfo = await SetPermissionLevel(cookies, removeCookie);

                // If the backend threw an error (e.g., expired token), stop
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

    const convertGameDataToGame = (gameInfo: GameMetaData) => {

    }

    const getGames = async () => {
        try {



            const res = await fetch(`${environment.urls.middlewareURL}/savedGames/student/${user.current.id}`)
            const data = await res.json()
            if (data.length == 0 || !data) {
                return
            }
            const res2 = await fetch(`${environment.urls.middlewareURL}/savedGames/batch`,

                {
                    method: "PATCH",
                    body: JSON.stringify(data)
                }
            )
            const data2 = await res2.json() as [GameMetaData]
            const games = data.map(item => { convertGameDataToGame(item) }) as [Game]

            setGames(games)



        }
        catch (error) {
            console.log(error)
        }


    }


    if (isLoggedIn) {
        return <div>
            {games.map(games =>
                <h1> {games.studentName}</h1>
            )}

        </div>
    }


    else {
        return (

            <div>

            </div>

        )

    }
}

export default SelectGame