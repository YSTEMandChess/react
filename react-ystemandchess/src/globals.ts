import { environment } from "./environments/environment";
let information;

type SetPermissionLevelType<T> = (a: any, b?: any) => Promise<T>;

export const SetPermissionLevel: SetPermissionLevelType<any> = async (cookies: any, removeCookie: Function): Promise<any> => {
  let cookieName = "login";
  if (Object.keys(cookies).includes(cookieName)) {
    let rawData: any;
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
};
