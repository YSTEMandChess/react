import Cookies from 'js-cookie';

export let information;

export async function setPermissionLevel() {
  let cookieName = 'login';
  if (Cookies.get(cookieName)) {
    let rawData;
    let cookieContents = Cookies.get(cookieName);
    let url = `${process.env.REACT_APP_MIDDLEWARE_URL}/auth/validate`;
    
    const headers = new Headers({
      'Authorization': `Bearer ${cookieContents}`
    });
    
    await fetch(url, { method: 'POST', headers: headers })
      .then(response => response.text())
      .then(data => {
        rawData = data;
      });

    if (
      rawData.includes('Unauthorized') ||
      rawData.includes('Error 405: User authentication is not valid or expired')
    ) {
      Cookies.remove(cookieName);
      return {
        error: 'Error 405: User authentication is not valid or expired',
      };
    } else {
      information = JSON.parse(atob(cookieContents.split('.')[1]));
      return information;
    }
  } else {
    console.log("User is not logged in");
    return { error: 'User is not logged in' };
  }
}
