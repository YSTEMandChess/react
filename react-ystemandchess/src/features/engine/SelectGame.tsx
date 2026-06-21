
//check login
//check for games

import { useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"


const SelectGame = () => {
    type User = {
        username: string,
        firstName: string,
        lastName: string,
        role: string,
        email: string,
        id: number


    }

    const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

    const user = useRef<User>(null)

    useEffect(() => {
        if (!cookies.login) {
            setIsLoggedIn(false);
            return;
        }

        // 2. Define the async operation safely
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



    const getGames = () => {


    }


    return (
        <div>
            {isLoggedIn ? <p> welcome {user.current?.firstName || ""}</p> :
                <p>Not Logged In</p>}

        </div>
    )
}

export default SelectGame