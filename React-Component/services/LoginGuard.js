import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Cookies from 'js-cookie';

const useLoginGuard = (roles = [], redirect = false) => {
    const history = useHistory();
    const isLoggedIn = Cookies.get('login');

    useEffect(() => {
        if (redirectIfLoggedIn(isLoggedIn, redirect)) {
            history.push('/');
            return;
        }

        if (!allowThrough(isLoggedIn, roles)) {
            history.push('/');
            return;
        }
    }, [history, isLoggedIn, roles, redirect]);
};

const redirectIfLoggedIn = (isLoggedIn, redirect) => {
    if (isLoggedIn && redirect) {
        return true;
    }
    return false;
};

const allowThrough = (isLoggedIn, roles) => {
    if (!isLoggedIn) {
        return roles.length === 0;
    }

    const userData = JSON.parse(atob(isLoggedIn.split('.')[1]));
    if (!roles.length) {
        return true;
    }

    return roles.includes(userData.role);
};

export default useLoginGuard;
