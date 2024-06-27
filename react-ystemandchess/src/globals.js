import { environment } from "./environments/environment.ts";
let information;

export async function SetPermissionLevel(cookies, removeCookie) {
  let cookieName = "login";
  if (Object.keys(cookies).includes(cookieName)) {
    let rawData;
    let cookieContents = cookies.login;
    let url = `${environment.urls.middlewareURL}/auth/validate`;
    let headers = new Headers();
    headers.append("Authorization", `Bearer ${cookieContents}`);
    await fetch(url, { method: "POST", headers: headers })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        rawData = data;
      });
    if (
      rawData.includes("Unauthorized") ||
      rawData.includes("Error 405: User authentication is not valid or expired")
    ) {
      removeCookie(cookieName);
      return {
        error: "Error 405: User authentication is not valid or expired",
      };
    } else {
      information = JSON.parse(atob(cookieContents.split(".")[1]));
      return information;
    }
  } else {
    console.log("errrrrrrrrrrr");
    return { error: "User is not logged in" };
  }
}
// testUsername
// 123456789
