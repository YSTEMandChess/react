
//check login
//check for games

import { useEffect, useRef, useState } from "react"
import { useCookies } from "react-cookie"
import { SetPermissionLevel } from "../../globals"


const SelectGame = () => {


    const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

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

                await getGames();

            } catch (err) {
                console.error("Auth check failed:", err);
                setIsLoggedIn(false);
            }
        };

        verifyAndLoad();

    }, [cookies.login]);



    const getGames = () => {


    }


    return (
        <div>

        </div>
    )
}

export default SelectGame