"use client";

import axios, { AxiosResponse } from "axios";
import { getSession, signOut } from "next-auth/react";
import { withData, withError } from "./api";
import { ISessionData } from "@/interfaces/commonInterfaces";
import routes from "@/constant/routes";
import config from "@/config/config";

export const http = axios.create({
	baseURL: config.baseUrl,
	headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (req: any) => {
	const session = await getSession();

	if ((session as ISessionData)?.authToken) {
		req.headers.authorization = `Bearer ${(session as any)?.authToken}`;
	}

	return req;
});

http.interceptors.response.use(
	(res) => withData(res.data) as AxiosResponse<any>,
	async (err) => {
		if (err?.response?.status === 401) {
			// store.dispatch(LogoutAction() as never);
			if (["user_is_blocked_by_admin"].includes(err?.response?.message)) {
				// toastMessageError(UNAUTHORIZED_USER);
			} else {
				// toastMessageError(err?.response?.message ?? "Something went wrong.");
			}

			await signOut({
				redirect: true,
				callbackUrl: `${routes.LANDING}?from=logout`,
			});
		}
		return withError(err.response?.data);
	}
);

// export const httpAuth = axios.create({
//   baseURL: config.loginUrl,
//   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
// })

// httpAuth.interceptors.request.use((req) => {
//   return req
// })

export function get<P>(url: string, params?: P): Promise<any> {
	return http({
		method: "get",
		url,
		params,
	});
}

export function post<D, P>(url: string, data: D, params?: P): any {
	return http({
		method: "post",
		url,
		data,
		params,
	});
}

export function postFile<D, P>(url: string, data: D, params?: P): any {
	return http({
		method: "post",
		headers: { "Content-Type": "multipart/form-data" },
		url,
		data,
		params,
	});
}

export function put<D, P>(url: string, data: D, params?: P): any {
	return http({
		method: "put",
		url,
		data,
		params,
	});
}

export function patch<D, P>(url: string, data: D, params?: P): any {
	return http({
		method: "patch",
		url,
		data,
		params,
	});
}

export function remove<D, P>(url: string, data?: D, params?: P): any {
	return http({
		method: "delete",
		url,
		data,
		params,
	});
}
